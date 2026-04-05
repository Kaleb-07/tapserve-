import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';
import { saveAlert } from '../components/WaiterAlertInbox';

const API_URL = import.meta.env.VITE_API_URL as string;
const socket = io(import.meta.env.VITE_SOCKET_URL as string);

// Axios Interceptor for Auth
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('luxury_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface Category {
  id: string;
  name: string;
  mealType: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  ingredients?: string;
  categoryId: string;
  costPrice?: number;
  inStock?: boolean;
}

interface Order {
  id: string;
  sourceType: string;
  sourceId: string;
  totalPrice: number;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED';
  paymentStatus: 'UNPAID' | 'PAID';
  notes?: string;
  customerPhone?: string;
  items: any[];
  mealType?: string;
  createdAt: string;
}

interface User {
  id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'WAITER' | 'CHEF';
  assignedTables?: string; // Comma-separated table identifiers
  createdAt?: string;
}

interface Source {
  id: string;
  type: string;
  identifier: string;
}

interface AppState {
  orders: Order[];
  categories: Category[];
  items: MenuItem[];
  loading: boolean;
  token: string | null;
  user: User | null;
  users: User[];
  fetchOrders: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchItems: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  updateOrderStatus: (id: string, status?: string, paymentStatus?: string) => Promise<void>;
  createOrder: (orderData: any) => Promise<any>;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  // Auth Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  // User Actions (Admin)
  addUser: (userData: any) => Promise<void>;
  updateUser: (id: string, userData: any) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  // Menu Item Actions
  addItem: (itemData: any) => Promise<void>;
  updateItem: (id: string, itemData: any) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  // Category Actions
  addCategory: (catData: any) => Promise<void>;
  updateCategory: (id: string, catData: any) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  // Settings Actions
  settings: any | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (settingsData: any) => Promise<void>;
  setSettings: (settings: any) => void;
  // Theme Actions
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  initTheme: () => void;
  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  // Notification state
  notification: { message: string, type: 'success' | 'error' | 'info', isOpen: boolean };
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  // Confirmation Modal state
  confirmModal: { title: string, message: string, onConfirm: () => void, isOpen: boolean };
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  closeConfirm: () => void;
  // Sidebar reactivity
  isSidebarCollapsed: boolean;
  toggleSidebarCollapse: () => void;
  // Source Actions (Admin)
  sources: Source[];
  fetchSources: () => Promise<void>;
  addSource: (sourceData: any) => Promise<void>;
  deleteSource: (id: string) => Promise<void>;
  // Waiter missed alert check
  checkMissedReadyOrders: () => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  orders: [],
  categories: [],
  items: [],
  users: [],
  sources: [],
  loading: false,
  settings: null,
  token: localStorage.getItem('luxury_token'),
  user: (() => {
    try {
      const item = localStorage.getItem('luxury_user');
      return item && item !== 'undefined' ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  })(),

  fetchOrders: async () => {
    set({ loading: true });
    try {
      const res = await axios.get(`${API_URL}/orders`);
      set({ orders: Array.isArray(res.data) ? res.data : [], loading: false });
    } catch (err) {
      console.error('Fetch orders error:', err);
      set({ orders: [], loading: false });
    }
  },

  fetchCategories: async () => {
    try {
      const res = await axios.get(`${API_URL}/categories`);
      set({ categories: res.data });
    } catch (err) {
      console.error(err);
    }
  },

  fetchItems: async () => {
    try {
      const res = await axios.get(`${API_URL}/items`);
      set({ items: res.data });
    } catch (err) {
      console.error(err);
    }
  },

  fetchUsers: async () => {
    try {
      const res = await axios.get(`${API_URL}/users`);
      set({ users: res.data });
    } catch (err) {
      console.error(err);
    }
  },

  fetchSources: async () => {
    const res = await axios.get(`${API_URL}/sources`);
    set({ sources: res.data });
  },

  addSource: async (sourceData) => {
    await axios.post(`${API_URL}/sources`, sourceData);
    const { fetchSources } = useStore.getState();
    await fetchSources();
  },

  deleteSource: async (id) => {
    await axios.delete(`${API_URL}/sources/${id}`);
    const { fetchSources } = useStore.getState();
    await fetchSources();
  },

  checkMissedReadyOrders: async () => {
    const { user } = useStore.getState();
    if (!user || user.role !== 'WAITER') return;
    try {
      const res = await axios.get(`${API_URL}/orders`);
      const orders: Order[] = Array.isArray(res.data) ? res.data : [];
      const assigned = user.assignedTables?.split(',').map(s => s.trim()).filter(Boolean) || [];
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
    } catch (err) {
      console.error('Failed to check missed ready orders:', err);
    }
  },

  updateOrderStatus: async (id, status, paymentStatus) => {
    try {
      const updateData: any = {};
      if (status !== undefined) updateData.status = status;
      if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
      await axios.patch(`${API_URL}/orders/${id}`, updateData);
    } catch (err) {
      console.error(err);
    }
  },

  createOrder: async (orderData: any) => {
    try {
      const res = await axios.post(`${API_URL}/orders`, orderData);
      return res.data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  addOrder: (order) => {
    set((state) => {
      const exists = state.orders.some((o) => o.id === order.id);
      if (exists) return state;
      return { orders: [order, ...state.orders] };
    });
  },

  updateOrder: (order) => set((state) => ({
    orders: state.orders.map((o) => (o.id === order.id ? order : o)),
  })),

  login: async (username, password) => {
    const res = await axios.post(`${API_URL}/auth/login`, { username, password });
    const { token, user } = res.data;
    localStorage.setItem('luxury_token', token);
    localStorage.setItem('luxury_user', JSON.stringify(user));
    // Set axios header for immediate use
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    set({ token, user });
    // Check for missed READY orders on login
    if (user.role === 'WAITER') {
      setTimeout(() => useStore.getState().checkMissedReadyOrders(), 500);
    }
  },

  logout: () => {
    localStorage.removeItem('luxury_token');
    localStorage.removeItem('luxury_user');
    delete axios.defaults.headers.common['Authorization'];
    set({ token: null, user: null });
  },

  checkAuth: () => {
    const token = localStorage.getItem('luxury_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  },

  addUser: async (userData) => {
    await axios.post(`${API_URL}/users`, userData);
    const { fetchUsers } = useStore.getState();
    await fetchUsers();
  },

  updateUser: async (id, userData) => {
    await axios.patch(`${API_URL}/users/${id}`, userData);
    const { fetchUsers } = useStore.getState();
    await fetchUsers();
  },

  deleteUser: async (id) => {
    await axios.delete(`${API_URL}/users/${id}`);
    const { fetchUsers } = useStore.getState();
    await fetchUsers();
  },

  addItem: async (itemData) => {
    try {
      await axios.post(`${API_URL}/items`, itemData);
      const { fetchItems, fetchCategories, showNotification } = useStore.getState();
      await fetchItems();
      await fetchCategories();
      showNotification('Item added successfully', 'success');
    } catch (err) {
      useStore.getState().showNotification('Failed to add item', 'error');
    }
  },

  updateItem: async (id, itemData) => {
    try {
      await axios.patch(`${API_URL}/items/${id}`, itemData);
      const { fetchItems, fetchCategories, showNotification } = useStore.getState();
      await fetchItems();
      await fetchCategories();
      showNotification('Item updated', 'success');
    } catch (err) {
      useStore.getState().showNotification('Update failed', 'error');
    }
  },

  deleteItem: async (id) => {
    try {
      await axios.delete(`${API_URL}/items/${id}`);
      const { fetchItems, fetchCategories, showNotification } = useStore.getState();
      await fetchItems();
      await fetchCategories();
      showNotification('Item removed', 'info');
    } catch (err) {
      useStore.getState().showNotification('Delete failed', 'error');
    }
  },

  addCategory: async (catData) => {
    try {
      await axios.post(`${API_URL}/categories`, catData);
      const { fetchCategories, showNotification } = useStore.getState();
      await fetchCategories();
      showNotification('Category created', 'success');
    } catch (err) {
      useStore.getState().showNotification('Failed to create category', 'error');
    }
  },

  updateCategory: async (id, catData) => {
    try {
      await axios.patch(`${API_URL}/categories/${id}`, catData);
      const { fetchCategories, showNotification } = useStore.getState();
      await fetchCategories();
      showNotification('Category updated', 'success');
    } catch (err) {
      useStore.getState().showNotification('Update failed', 'error');
    }
  },

  deleteCategory: async (id) => {
    try {
      await axios.delete(`${API_URL}/categories/${id}`);
      const { fetchCategories, showNotification } = useStore.getState();
      await fetchCategories();
      showNotification('Category deleted', 'info');
    } catch (err) {
      useStore.getState().showNotification('Could not delete category', 'error');
    }
  },

  fetchSettings: async () => {
    try {
      const res = await axios.get(`${API_URL}/settings`);
      set({ settings: res.data });
    } catch (err) {
      console.error(err);
    }
  },

  updateSettings: async (settingsData) => {
    try {
      const res = await axios.patch(`${API_URL}/settings`, settingsData);
      set({ settings: res.data });
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  setSettings: (settings) => set({ settings }),

  theme: (localStorage.getItem('luxury_theme') as 'light' | 'dark') || 'dark',

  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('luxury_theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { theme: newTheme };
    });
  },

  initTheme: () => {
    const saved = localStorage.getItem('luxury_theme') as 'light' | 'dark' | null;
    // Customer page defaults to light; admin dashboard defaults to dark
    const theme = saved ?? 'dark';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  notification: { message: '', type: 'success', isOpen: false },
  showNotification: (message, type = 'success') => {
    set({ notification: { message, type, isOpen: true } });
    setTimeout(() => {
      set({ notification: { message: '', type: 'success', isOpen: false } });
    }, 4000);
  },

  confirmModal: { title: '', message: '', onConfirm: () => {}, isOpen: false },
  showConfirm: (title, message, onConfirm) => {
    set({ confirmModal: { title, message, onConfirm, isOpen: true } });
  },
  closeConfirm: () => {
    set({ confirmModal: { ...useStore.getState().confirmModal, isOpen: false } });
  },

  isSidebarCollapsed: localStorage.getItem('sidebar-collapsed') === 'true',
  toggleSidebarCollapse: () => {
    const newState = !useStore.getState().isSidebarCollapsed;
    set({ isSidebarCollapsed: newState });
    localStorage.setItem('sidebar-collapsed', String(newState));
  },
}));

// Axios request interceptor for tokens
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('luxury_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Axios interceptor for 401s
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// Socket listeners
socket.on('new_order', (order) => {
  useStore.getState().addOrder(order);
});

socket.on('order_updated', (order) => {
  useStore.getState().updateOrder(order);
});

socket.on('settings_updated', (settings) => {
  useStore.getState().setSettings(settings);
});

socket.on('food_ready', (data) => {
  const { user, showNotification } = useStore.getState();
  if (user && user.role === 'WAITER') {
    const assigned = user.assignedTables?.split(',').map(s => s.trim()) || [];
    const isAssigned = assigned.length === 0 || assigned.includes(data.tableId);
    if (isAssigned) {
      const message = `🍽️ Food ready for Table ${data.tableId}`;
      showNotification(message, 'success');
      // Persist to inbox
      saveAlert({
        id: data.orderId + '-' + Date.now(),
        orderId: data.orderId,
        tableId: data.tableId,
        message,
        timestamp: new Date().toISOString(),
        read: false,
      });
      // Play sound
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});
      } catch (e) {}
    }
  } else if (user && user.role === 'ADMIN') {
    showNotification(`🔔 Food Ready: Table ${data.tableId}`, 'info');
  }
});

