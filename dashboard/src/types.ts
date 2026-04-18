export interface Category {
  id: string;
  name: string;
  mealType: string;
  items: MenuItem[];
}

export interface MenuItem {
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

export interface Order {
  id: string;
  sourceType: string;
  sourceId: string;
  totalPrice: number;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED';
  paymentStatus: 'UNPAID' | 'PAID' | 'PARTIAL';
  paymentMethod?: string;
  notes?: string;
  customerPhone?: string;
  items: any[];
  mealType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'WAITER' | 'CHEF';
  assignedTables?: string; // Comma-separated table identifiers
  createdAt?: string;
}

export interface Source {
  id: string;
  type: string;
  identifier: string;
}

export interface AppState {
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
  updateOrderDetails: (id: string, updates: any) => Promise<void>;
  createOrder: (orderData: any) => Promise<any>;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  // Auth Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
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
