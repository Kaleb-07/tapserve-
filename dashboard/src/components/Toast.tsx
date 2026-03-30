import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useStore } from '../store/useStore';

export const Toast: React.FC = () => {
  const { notification } = useStore();
  const { message, type, isOpen } = notification;

  const icons = {
    success: <CheckCircle className="text-emerald-500" size={20} />,
    error: <AlertCircle className="text-red-500" size={20} />,
    info: <Info className="text-luxury-gold" size={20} />,
  };

  const borders = {
    success: 'border-emerald-500/20',
    error: 'border-red-500/20',
    info: 'border-luxury-gold/20',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
          className={`fixed top-6 right-6 z-[9999] flex items-center space-x-4 p-4 pr-6 rounded-2xl bg-luxury-dark border shadow-2xl backdrop-blur-xl ${borders[type]}`}
          style={{ minWidth: '300px' }}
        >
          <div className="flex-shrink-0">
            {icons[type]}
          </div>
          
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-luxury-gold mb-0.5 opacity-50">
              System {type}
            </p>
            <p className="text-sm font-medium text-luxury-text">
              {message}
            </p>
          </div>

          <div className="ml-4 h-8 w-px bg-luxury-border/30"></div>
          
          <div className="relative w-1 h-8 rounded-full overflow-hidden bg-luxury-gray/30 ml-2">
            <motion.div 
              initial={{ height: '100%' }}
              animate={{ height: '0%' }}
              transition={{ duration: 4, ease: 'linear' }}
              className={`absolute top-0 left-0 w-full ${type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-luxury-gold'}`}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
