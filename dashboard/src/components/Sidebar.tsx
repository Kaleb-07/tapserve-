import React from 'react';
import { LayoutDashboard, ShoppingCart, Utensils, Settings, LogOut, Users, CreditCard, User as UserIcon, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';

const getMenuItems = (role: string) => {
  const isAdmin = role === 'ADMIN';
  const isChef = role === 'CHEF';

  const items = [
    // Dashboard: the only for ADMIN and CHEF
    ...(isAdmin || isChef ? [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
    // Tables: for WAITER and ADMIN
    ...(isAdmin || !isChef ? [{ id: 'tables', label: isAdmin ? 'Table Operations' : 'My Tables', icon: LayoutDashboard }] : []),
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    // Menu Items: only for ADMIN and CHEF
    ...(isAdmin || isChef ? [{ id: 'menu', label: 'Menu Items', icon: Utensils }] : []),
    // Reports: Waiter sees own stats, Admin sees staff analytics
    ...(!isChef ? [{ id: 'waiter_reports', label: isAdmin ? 'Staff Analytics' : 'My Performance', icon: BarChart3 }] : []),
  ];
  
  if (isAdmin) {
    items.push({ id: 'reports', label: 'Financial Reports', icon: BarChart3 });
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
  const { logout, settings, user, showConfirm, isSidebarCollapsed, toggleSidebarCollapse } = useStore();
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
      <motion.div 
        animate={{ width: isSidebarCollapsed ? 80 : 256 }}
        className={`fixed top-0 left-0 bottom-0 bg-luxury-dark border-r border-luxury-border flex flex-col pt-8 z-50 transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 h-full`}
      >
        {/* Header/Logo Section */}
        <div className="px-6 mb-12 flex items-center justify-between overflow-hidden h-12 flex-shrink-0">
          <AnimatePresence mode="wait">
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="whitespace-nowrap flex-1"
              >
                <h1 className="text-xl font-serif font-bold gold-text uppercase tracking-widest leading-none truncate w-40">
                  {settings?.hotelName || 'NORA LUXE'}
                </h1>
                <p className="text-[9px] text-luxury-gold uppercase tracking-tighter mt-1 opacity-70">
                  {user?.role === 'ADMIN' ? 'Admin Dashboard' : 'Staff'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={toggleSidebarCollapse}
            className={`p-2 rounded-lg bg-luxury-gray/10 text-luxury-gold hover:bg-luxury-gold/20 transition-all md:flex hidden ${isSidebarCollapsed ? 'mx-auto' : 'ml-auto'}`}
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSetTab(item.id)}
                className={`w-full flex items-center rounded-xl transition-all duration-300 group h-11 ${
                  isActive 
                  ? 'bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/20' 
                  : 'text-luxury-textDim hover:bg-luxury-gray hover:text-luxury-text border border-transparent'
                } ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4 space-x-4'}`}
              >
                <Icon size={20} className="flex-shrink-0" />
                <AnimatePresence mode="wait">
                  {!isSidebarCollapsed && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="font-medium whitespace-nowrap overflow-hidden text-sm text-luxury-text"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && !isSidebarCollapsed && (
                  <motion.div 
                    layoutId="activeTab" 
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-luxury-gold shadow-[0_0_8px_rgba(212,175,55,0.8)]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer/Logout Section */}
        <div className="p-4 border-t border-luxury-border flex-shrink-0">
          <button 
            onClick={() => showConfirm(
              'Sign Out',
              'Are you sure you want to end your session?',
              () => logout()
            )}
            className={`w-full flex items-center rounded-xl py-3 text-luxury-textDim hover:text-red-400 transition-colors ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4 space-x-4'}`}
          >
            <LogOut size={20} className="flex-shrink-0" />
            <AnimatePresence>
              {!isSidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-medium whitespace-nowrap text-sm text-luxury-text"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.div>
    </>
  );
};
