import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:3001/api';
const socket = io('http://localhost:3001');

interface Category {
  id: string;
  name: string;
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
  items: any[];
  createdAt: string;
}

interface User {
  id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'WAITER' | 'CHEF';
  createdAt?: string;
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
}

export const useStore = create<AppState>((set) => ({
  orders: [],
  categories: [],
  items: [],
  users: [],
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
      set({ orders: res.data, loading: false });
    } catch (err) {
      console.error(err);
      set({ loading: false });
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
    set({ token, user });
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
    await axios.post(`${API_URL}/items`, itemData);
    const { fetchItems, fetchCategories } = useStore.getState();
    await fetchItems();
    await fetchCategories();
  },

  updateItem: async (id, itemData) => {
    await axios.patch(`${API_URL}/items/${id}`, itemData);
    const { fetchItems, fetchCategories } = useStore.getState();
    await fetchItems();
    await fetchCategories();
  },

  deleteItem: async (id) => {
    await axios.delete(`${API_URL}/items/${id}`);
    const { fetchItems, fetchCategories } = useStore.getState();
    await fetchItems();
    await fetchCategories();
  },

  addCategory: async (catData) => {
    await axios.post(`${API_URL}/categories`, catData);
    const { fetchCategories } = useStore.getState();
    await fetchCategories();
  },

  updateCategory: async (id, catData) => {
    await axios.patch(`${API_URL}/categories/${id}`, catData);
    const { fetchCategories } = useStore.getState();
    await fetchCategories();
  },

  deleteCategory: async (id) => {
    await axios.delete(`${API_URL}/categories/${id}`);
    const { fetchCategories } = useStore.getState();
    await fetchCategories();
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
    const theme = (localStorage.getItem('luxury_theme') as 'light' | 'dark') || 'dark';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
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
