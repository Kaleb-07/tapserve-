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
  notes?: string;
  items: any[];
  createdAt: string;
}

interface AppState {
  orders: Order[];
  categories: Category[];
  items: MenuItem[];
  loading: boolean;
  token: string | null;
  user: any | null;
  fetchOrders: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchItems: () => Promise<void>;
  updateOrderStatus: (id: string, status: string) => Promise<void>;
  createOrder: (orderData: any) => Promise<any>;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  // Auth Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  // Menu Item Actions
  addItem: (itemData: any) => Promise<void>;
  updateItem: (id: string, itemData: any) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  // Category Actions
  addCategory: (catData: any) => Promise<void>;
  updateCategory: (id: string, catData: any) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  orders: [],
  categories: [],
  items: [],
  loading: false,
  token: localStorage.getItem('luxury_token'),
  user: JSON.parse(localStorage.getItem('luxury_user') || 'null'),

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

  updateOrderStatus: async (id, status) => {
    try {
      await axios.patch(`${API_URL}/orders/${id}`, { status });
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
    const { token, admin } = res.data;
    localStorage.setItem('luxury_token', token);
    localStorage.setItem('luxury_user', JSON.stringify(admin));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    set({ token, user: admin });
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
}));

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
