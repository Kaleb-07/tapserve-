import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Utensils, 
  Settings, 
  LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'menu', label: 'Menu Items', icon: Utensils },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<{ activeId: string; onSetTab: (id: string) => void }> = ({ activeId, onSetTab }) => {
  const { logout } = useStore();
  return (
    <div className="w-64 h-screen bg-luxury-dark border-r border-luxury-border flex flex-col pt-8">
      <div className="px-8 mb-12">
        <h1 className="text-2xl font-serif font-bold gold-text">NORA LUXE</h1>
        <p className="text-[10px] text-luxury-gold uppercase tracking-widest mt-1 opacity-70">Admin Dashboard</p>
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
                : 'text-gray-400 hover:bg-luxury-gray hover:text-gray-200'
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
          className="w-full flex items-center space-x-4 px-4 py-3 text-gray-400 hover:text-red-400 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};
