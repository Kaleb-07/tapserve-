# ⚜️ Luxury QR Menu & Ordering System

A full-stack, production-ready QR Menu and ordering platform built for high-end hospitality venues — restaurants, hotels, and VIP lounges.

---

## ✨ Features

| Area | Details |
|---|---|
| 🌑 **Dark Luxury UI** | Elegant dark theme with gold accents, Playfair Display typography, and smooth Framer Motion animations |
| 📱 **Customer Ordering** | Mobile-first card-based menu, 3-step ordering flow, per-item enquiries, ingredient customisation |
| 📦 **Real-time Orders** | Socket.IO-powered live order feed — orders appear instantly on the admin dashboard |
| 🔐 **JWT Auth** | Secure admin login; all management endpoints are protected |
| 🍽️ **Menu Management** | Full CRUD for categories & menu items with image upload support |
| 📍 **Multi-Source** | Orders attributed to a Table, Room, VIP Lounge, or Staff |
| ⚙️ **Customisations** | Per-item ingredient exclusions and special enquiry notes persisted per order |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Zustand, Framer Motion |
| **Backend** | Node.js, Express 5, Prisma ORM |
| **Database** | MySQL (easily swappable via Prisma) |
| **Real-time** | Socket.IO |
| **Auth** | JWT + bcrypt |

---

## 🖥️ App URLs

| App | URL | Notes |
|---|---|---|
| 🔐 Admin Dashboard | `http://localhost:5173/` | JWT-protected. Manage orders, menu, settings |
| 📱 Customer Ordering | `http://localhost:5173/customer.html` | **No login required.** Designed for QR-code access on tables/rooms |

> **QR Code Tip:** Generate a QR code pointing to `http://YOUR_LOCAL_IP:5173/customer.html` and place it on each table/room door.

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- MySQL database
- npm

---

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/luxury-qr-menu.git
cd luxury-qr-menu
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Copy the environment template and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="mysql://root:your_password@localhost:3306/luxury_menu"
PORT=3001
JWT_SECRET="your-strong-random-secret"   # generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Push the Prisma schema to your database and generate the client:

```bash
npx prisma db push
npx prisma generate
```

(Optional) Seed some sample menu data:

```bash
node src/seed.js
```

Start the API:

```bash
npm run dev      # development (auto-restart on changes)
npm start        # production
```

> API runs on **http://localhost:3001**

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

> Dashboard runs on **http://localhost:5173**

---

## 🔑 Default Admin Credentials

On first startup, if no admin exists in the database, a default account is created automatically:

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `luxury123` |

> ⚠️ **Change this password immediately** after your first login via the Settings page.

---

## 📁 Project Structure

```
menu/
├── backend/                # Express + Prisma backend
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── src/
│   │   ├── index.js        # Main server (routes, auth, socket.io)
│   │   └── seed.js         # Sample data seeder
│   ├── uploads/            # Uploaded images (gitignored, kept by .gitkeep)
│   ├── .env.example        # Environment variable template
│   └── package.json
│
└── frontend/               # React + Vite frontend
    ├── src/
    │   ├── components/     # Layout: Sidebar, Topbar, ManualOrderModal
    │   ├── pages/          # Dashboard, Orders, Menu, Settings, Login, CustomerOrder
    │   ├── store/          # Zustand global state
    │   ├── App.tsx         # Admin app root with auth guard
    │   └── customer-main.tsx # Customer ordering app entry point
    ├── customer.html       # Separate HTML entry for customer page
    ├── index.html          # Admin entry point
    └── package.json
```

---

## 🛡️ Security Notes

- **Never commit `.env`** — it is gitignored. Use `.env.example` as a template.
- Set a strong, unique `JWT_SECRET` in production.
- The `uploads/` folder is gitignored — configure persistent cloud storage (e.g. S3) for production deployments.
- Change the default admin password on first login.

---
