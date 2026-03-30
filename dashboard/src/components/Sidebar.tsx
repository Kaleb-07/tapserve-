import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Utensils, 
  Settings, 
  LogOut,
  Users,
  CreditCard,
  User as UserIcon,
  Menu as MenuIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';

const getMenuItems = (role: string) => {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'menu', label: 'Menu Items', icon: Utensils },
  ];
  
  if (role === 'ADMIN') {
    items.push({ id: 'staff', label: 'Staff Management', icon: Users });
    items.push({ id: 'settings', label: 'Global Settings', icon: Settings });
  } else {
    items.push({ id: 'profile', label: 'My Profile', icon: UserIcon });
  }
  
  return items;
};

export const Sidebar: React.FC<{ 
  activeId: string; 
  onSetTab: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}> = ({ activeId, onSetTab, isOpen, onClose }) => {
  const { logout, settings, user } = useStore();
  const menuItems = getMenuItems(user?.role || '');
  
  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <div className={`fixed top-0 left-0 bottom-0 w-64 bg-luxury-dark border-r border-luxury-border flex flex-col pt-8 z-50 transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="px-8 mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold gold-text uppercase tracking-widest leading-relaxed line-clamp-2">{settings?.hotelName || 'NORA LUXE'}</h1>
            <p className="text-[10px] text-luxury-gold uppercase tracking-widest mt-1 opacity-70">
              {user?.role === 'ADMIN' ? 'Admin Dashboard' : 'Staff Dashboard'}
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSetTab(item.id)}
                className={`w-full flex items-center space-x-4 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive 
                  ? 'bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/20' 
                  : 'text-luxury-textDim hover:bg-luxury-gray hover:text-luxury-text'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="activeTab" 
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-luxury-gold shadow-[0_0_8px_rgba(212,175,55,0.8)]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-luxury-border">
          <button 
            onClick={() => { if(confirm('Are you sure you want to logout?')) logout(); }}
            className="w-full flex items-center space-x-4 px-4 py-3 text-luxury-textDim hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};
