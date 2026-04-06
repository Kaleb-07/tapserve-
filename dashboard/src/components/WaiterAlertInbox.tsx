import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, ChefHat, Check } from 'lucide-react';

interface ReadyAlert {
  id: string;
  orderId: string;
  tableId: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const STORAGE_KEY = 'waiter_ready_alerts';

export const getStoredAlerts = (): ReadyAlert[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveAlert = (alert: ReadyAlert) => {
  const existing = getStoredAlerts();
  // Avoid duplicates by orderId
  if (existing.some(a => a.orderId === alert.orderId)) return;
  const updated = [alert, ...existing].slice(0, 50); // keep max 50
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const markAllRead = () => {
  const existing = getStoredAlerts().map(a => ({ ...a, read: true }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
};

export const clearAlerts = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const WaiterAlertInbox: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<ReadyAlert[]>(() => getStoredAlerts());

  // Refresh alerts every 2 seconds to catch socket-pushed updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setAlerts(getStoredAlerts());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const unread = alerts.filter(a => !a.read).length;

  const handleMarkAllRead = () => {
    markAllRead();
    setAlerts(getStoredAlerts());
  };

  const handleClear = () => {
    clearAlerts();
    setAlerts([]);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        id="waiter-alert-bell"
        onClick={() => {
          setIsOpen(prev => !prev);
          if (!isOpen) {
            markAllRead();
            setAlerts(getStoredAlerts());
          }
        }}
        className="relative p-2.5 rounded-xl bg-luxury-dark border border-luxury-border text-luxury-textDim hover:text-luxury-gold hover:border-luxury-gold/30 transition-all"
      >
        <Bell size={20} className={unread > 0 ? 'text-luxury-gold animate-bounce' : ''} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-lg shadow-red-500/40">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown Inbox */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 bg-luxury-dark border border-luxury-border rounded-2xl shadow-2xl z-[9999] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-luxury-border bg-luxury-gray/10">
              <div className="flex items-center space-x-2">
                <ChefHat size={16} className="text-luxury-gold" />
                <span className="text-xs font-bold uppercase tracking-widest text-luxury-gold">Kitchen Alerts</span>
              </div>
              <div className="flex items-center space-x-2">
                {alerts.length > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[9px] text-luxury-textDim hover:text-luxury-gold uppercase font-bold tracking-widest transition-colors"
                  >
                    Mark Read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-luxury-textDim hover:text-luxury-text"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Alert List */}
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-luxury-textDim">
                  <Check size={32} className="mb-3 opacity-30" />
                  <p className="text-xs">No alerts at the moment</p>
                </div>
              ) : (
                alerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`flex items-start space-x-3 px-4 py-3 border-b border-luxury-border/30 transition-colors ${
                      alert.read ? 'opacity-50' : 'bg-luxury-gold/5'
                    }`}
                  >
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${alert.read ? 'bg-gray-600' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-luxury-text">{alert.message}</p>
                      <p className="text-[10px] text-luxury-textDim mt-0.5">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {alerts.length > 0 && (
              <div className="px-4 py-2.5 border-t border-luxury-border bg-luxury-gray/5">
                <button
                  onClick={handleClear}
                  className="text-[9px] text-red-400 hover:text-red-300 uppercase font-bold tracking-widest transition-colors"
                >
                  Clear All Alerts
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
