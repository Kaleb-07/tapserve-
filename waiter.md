# 🍽️ Waiter Role — Implementation Guide

This document details the full technical implementation of the **Waiter** role in the Luxury QR Menu system. It covers authentication, access control, order filtering, real-time notifications, and the alert inbox system.

---

## Table of Contents

1. [Role Overview](#role-overview)
2. [Authentication & Login](#authentication--login)
3. [Access Control (UI)](#access-control-ui)
4. [Access Control (API)](#access-control-api)
5. [Table Assignment](#table-assignment)
6. [Order Filtering](#order-filtering)
7. [Real-Time Notifications](#real-time-notifications)
8. [Missed Alert Recovery](#missed-alert-recovery)
9. [Alert Inbox Component](#alert-inbox-component)
10. [File Reference](#file-reference)

---

## Role Overview

The system supports three user roles:

| Role | Description |
|------|-------------|
| `ADMIN` | Full access to all features |
| `CHEF` | Can view orders, menu, and dashboard |
| `WAITER` | Restricted to Orders, Payments, and Profile only |

Waiters are assigned specific **tables** by an admin. They only see orders for their assigned tables, and they receive real-time kitchen alerts when food is ready to be served.

---

## Authentication & Login

### Backend (`api/src/index.js`)

Login is handled via `POST /api/auth/login`. On success, the backend returns:
- A signed **JWT token** (expires in 24h)
- The **user object** including `role`, `name`, `assignedTables`

```js
// api/src/index.js
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });
  const valid = await bcrypt.compare(password, user.password);
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user });
});
```

### Frontend (`dashboard/src/store/useStore.ts`)

On successful login:
1. The token is stored in `localStorage`
2. The Axios default `Authorization` header is set for all future requests
3. If the role is `WAITER`, `checkMissedReadyOrders()` runs after 500ms to catch any **READY** orders that occurred while the waiter was offline

```ts
login: async (username, password) => {
  const res = await axios.post(`${API_URL}/auth/login`, { username, password });
  const { token, user } = res.data;
  localStorage.setItem('luxury_token', token);
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  set({ token, user });

  if (user.role === 'WAITER') {
    setTimeout(() => useStore.getState().checkMissedReadyOrders(), 500);
  }
},
```

---

## Access Control (UI)

### Sidebar (`dashboard/src/components/Sidebar.tsx`)

The sidebar navigation is dynamically generated based on the logged-in user's role. Waiters only see:

- ✅ Orders
- ✅ Payments
- ✅ My Profile
- ❌ Dashboard *(hidden)*
- ❌ Menu Items *(hidden)*
- ❌ Financial Reports *(hidden)*
- ❌ Staff Management *(hidden)*
- ❌ Global Settings *(hidden)*

```ts
const getMenuItems = (role: string) => {
  const isAdmin = role === 'ADMIN';
  const isChef = role === 'CHEF';

  const items = [
    ...(isAdmin || isChef ? [{ id: 'dashboard', ... }] : []),
    { id: 'orders', ... },
    { id: 'payments', ... },
    ...(isAdmin || isChef ? [{ id: 'menu', ... }] : []),
  ];

  if (isAdmin) {
    items.push({ id: 'reports', ... });
    items.push({ id: 'staff', ... });
    items.push({ id: 'settings', ... });
  } else {
    items.push({ id: 'profile', ... });
  }
  return items;
};
```

### App Shell (`dashboard/src/App.tsx`)

Beyond just hiding sidebar tabs, the app also **guards the rendered content**. Even if a waiter somehow navigates to a protected route, they are redirected to the Orders page:

```tsx
// Default tab on login
React.useEffect(() => {
  if (user) {
    setActiveTab(user.role === 'WAITER' ? 'orders' : 'dashboard');
  }
}, [user?.role]);

// Route guards in renderContent()
case 'dashboard':
  if (isWaiter) return <OrdersPage />; // redirect
  return <DashboardPage />;

case 'menu':
  if (isWaiter) return <OrdersPage />; // redirect
  return <MenuPage />;
```

---

## Access Control (API)

The backend enforces role-based access via middleware.

### `authMiddleware`

Validates the JWT and attaches the decoded user to `req.user`.

```js
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET);
  req.user = decoded;
  next();
};
```

### `adminOnly`

Blocks non-admins from sensitive routes such as managing sources (tables/rooms), users, and settings.

```js
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
```

Protected routes:
- `POST /api/sources` — create table/room
- `PATCH /api/sources/:id` — update table/room
- `DELETE /api/sources/:id` — remove table/room
- `POST /api/users` — create staff
- `DELETE /api/users/:id` — remove staff

---

## Table Assignment

Admins assign tables to waiters via the **Staff Management** page.

### Settings → Venue Locations

Before assigning, an admin must define physical locations (Tables, Rooms, VIP areas) in **Settings → Venue Locations**. These are stored in the `Source` database table.

```
Source {
  id: UUID
  type: "Table" | "Room" | "VIP"
  identifier: string  (e.g., "5", "101", "A")
}
```

### Staff Management

When editing a WAITER in the Staff Management modal, the admin sees a grid of all defined Tables. Clicking a table toggles assignment:

```tsx
// Assigned tables are stored as comma-separated string
const submitData = {
  assignedTables: formData.assignedTables.join(',')  // e.g., "1,5,8"
};
```

This is saved to the `User.assignedTables` column in the database as a comma-separated string (e.g., `"1,5,8"`).

---

## Order Filtering

When a waiter fetches orders, the **backend filters** them by assigned tables:

```js
// api/src/index.js — GET /api/orders
if (req.user?.role === 'WAITER') {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (user?.assignedTables) {
    const tableIds = user.assignedTables.split(',').map(s => s.trim());
    where.sourceType = 'Table';
    where.sourceId = { in: tableIds };
  } else {
    where.sourceId = 'NONE-ASSIGNED'; // returns empty if no tables assigned
  }
}
```

> If a waiter has no assigned tables, they see **zero orders** until an admin assigns them.

---

## Real-Time Notifications

### Flow

```
Chef marks order as READY
        ↓
Backend: PATCH /api/orders/:id { status: "READY" }
        ↓
Server emits: io.emit('food_ready', { orderId, tableId, message })
        ↓
Frontend socket listener fires: socket.on('food_ready', ...)
        ↓
Waiter's screen: Toast notification + Alert saved to inbox + Sound plays
```

### Backend Emission (`api/src/index.js`)

```js
app.patch('/api/orders/:id', authMiddleware, async (req, res) => {
  const order = await prisma.order.update({ ... });
  io.emit('order_updated', order);

  if (status === 'READY') {
    io.emit('food_ready', {
      orderId: order.id,
      tableId: order.sourceId,
      message: `Food is ready for Table ${order.sourceId}`
    });
  }
  res.json(order);
});
```

### Frontend Listener (`dashboard/src/store/useStore.ts`)

```ts
socket.on('food_ready', (data) => {
  const { user, showNotification } = useStore.getState();
  if (user?.role === 'WAITER') {
    const assigned = user.assignedTables?.split(',').map(s => s.trim()) || [];
    const isAssigned = assigned.length === 0 || assigned.includes(data.tableId);
    if (isAssigned) {
      const message = `🍽️ Food ready for Table ${data.tableId}`;
      showNotification(message, 'success');
      saveAlert({ orderId: data.orderId, tableId: data.tableId, message, ... });
      // Optional sound
      new Audio('...').play().catch(() => {});
    }
  }
});
```

---

## Missed Alert Recovery

If a waiter was **logged out** when food became ready, those alerts are recovered on their next login.

### How It Works

On successful WAITER login, the store calls `checkMissedReadyOrders()` after a short delay:

```ts
checkMissedReadyOrders: async () => {
  const { user } = useStore.getState();
  if (!user || user.role !== 'WAITER') return;

  const res = await axios.get(`${API_URL}/orders`);
  const orders = res.data;
  const assigned = user.assignedTables?.split(',').map(s => s.trim()) || [];

  const readyOrders = orders.filter(o =>
    o.status === 'READY' &&
    (assigned.length === 0 || assigned.includes(o.sourceId))
  );

  readyOrders.forEach(order => {
    saveAlert({
      id: order.id,
      orderId: order.id,
      tableId: order.sourceId,
      message: `🍽️ Food ready for ${order.sourceType} ${order.sourceId}`,
      timestamp: new Date().toISOString(),
      read: false,
    });
  });
},
```

> `saveAlert()` deduplicates by `orderId`, so the same order is never shown twice.

---

## Alert Inbox Component

**File:** `dashboard/src/components/WaiterAlertInbox.tsx`

The inbox is a persistent, `localStorage`-backed alert queue displayed as a **bell icon in the Topbar**, visible only to WAITERs.

### Key Functions

| Function | Description |
|---|---|
| `saveAlert(alert)` | Saves a new alert to `localStorage`. Deduplicates by `orderId`. Max 50 alerts stored. |
| `getStoredAlerts()` | Returns all alerts from `localStorage`. |
| `markAllRead()` | Marks every alert as `read: true`. |
| `clearAlerts()` | Removes all alerts from `localStorage`. |

### UI Features

- 🔔 **Bell icon** with animated bounce when unread alerts exist
- 🔴 **Red badge** showing the unread count (shows "9+" if over 9)
- 📋 **Dropdown panel** with a list of all recent alerts
- 🟢 **Green glow dot** on unread, dimmed on read
- ⏰ **Timestamp** shown for each alert
- ✅ **Mark Read** button clears the badge
- 🗑️ **Clear All** removes all stored alerts
- The inbox **refreshes every 2 seconds** to pick up new socket-triggered alerts without requiring a page reload

### Integration in Topbar

```tsx
// dashboard/src/components/Topbar.tsx
const isWaiter = user?.role === 'WAITER';

{isWaiter && <WaiterAlertInbox />}
```

---

## File Reference

| File | Purpose |
|---|---|
| `api/src/index.js` | Auth routes, order PATCH with `food_ready` emission, `adminOnly` middleware |
| `dashboard/src/store/useStore.ts` | `login`, `checkMissedReadyOrders`, `food_ready` socket listener, `saveAlert` integration |
| `dashboard/src/components/Sidebar.tsx` | Role-based navigation filtering |
| `dashboard/src/App.tsx` | Default tab by role, route guards per role |
| `dashboard/src/components/Topbar.tsx` | Shows `WaiterAlertInbox` conditionally |
| `dashboard/src/components/WaiterAlertInbox.tsx` | Full alert inbox UI + `localStorage` persistence |
| `dashboard/src/pages/StaffManagementPage.tsx` | Table assignment UI in the staff modal |
| `dashboard/src/pages/SettingsPage.tsx` | Venue Locations (Tables/Rooms) management UI |

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         WAITER FLOW                             │
└─────────────────────────────────────────────────────────────────┘

  [Admin creates Table in Settings]
          │
          ▼
  [Source record in DB: { type: "Table", identifier: "5" }]
          │
          ▼
  [Admin assigns Table 5 to waiter in Staff Management]
          │
          ▼
  [User.assignedTables = "5" saved to DB]
          │
          ▼
  [Waiter logs in → JWT issued → axios header set]
          │
          ├──→ [checkMissedReadyOrders() fetches READY orders]
          │         └──→ [Queues missed alerts in localStorage]
          │
          ▼
  [Waiter fetches orders → API filters by assigned tables]
          │
          ▼
  [Chef marks order READY]
          │
          ▼
  [Server emits food_ready via Socket.io]
          │
          ▼
  [Frontend socket listener → showNotification() + saveAlert()]
          │
          ▼
  [Bell badge updates → Waiter sees 🍽️ notification]
```
