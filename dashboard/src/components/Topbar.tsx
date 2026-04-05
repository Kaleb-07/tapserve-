import React from 'react';
import { Search, User, Menu, Sun, Moon } from 'lucide-react';
import { useStore } from '../store/useStore';
import { WaiterAlertInbox } from './WaiterAlertInbox';

export const Topbar: React.FC<{ title: string; onToggleSidebar: () => void }> = ({ title, onToggleSidebar }) => {
  const { user, theme, toggleTheme, searchQuery, setSearchQuery } = useStore();
  const isWaiter = user?.role === 'WAITER';

  return (
    <div className="h-20 bg-luxury-black border-b border-luxury-border flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
      <div className="flex items-center space-x-4">
        <button 
          onClick={onToggleSidebar}
          className="p-2 text-luxury-textDim hover:text-luxury-gold transition-colors md:hidden"
        >
          <Menu size={24} />
        </button>
        <h2 className="text-xl font-medium text-luxury-text">{title}</h2>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-luxury-textDim group-focus-within:text-luxury-gold transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search orders, menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-luxury-gray/50 border border-luxury-border rounded-full py-2 pl-10 pr-4 text-sm w-64 focus:outline-none focus:border-luxury-gold transition-all text-luxury-text"
          />
        </div>

        {/* Waiter Alert Inbox — only shown to WAITERs */}
        {isWaiter && <WaiterAlertInbox />}

        <button 
          onClick={toggleTheme}
          className="p-2 text-luxury-textDim hover:text-luxury-gold transition-all duration-300 transform active:rotate-45"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="h-8 w-px bg-luxury-border mx-2"></div>

        <div className="flex items-center space-x-3 cursor-pointer group">
          <div className="w-10 h-10 rounded-full border border-luxury-gold/30 flex items-center justify-center bg-luxury-gray group-hover:bg-luxury-gold/10 transition-colors">
            <User size={20} className="text-luxury-gold" />
          </div>
          <div className="text-left hidden md:block">
            <p className="text-sm font-medium text-luxury-text">{user?.name || user?.username || 'Staff'}</p>
            <p className="text-[10px] text-luxury-textDim uppercase tracking-tighter">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
