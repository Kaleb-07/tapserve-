import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';

export const ConfirmModal: React.FC = () => {
  const { confirmModal, closeConfirm } = useStore();
  const { title, message, onConfirm, isOpen } = confirmModal;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-luxury-dark border border-luxury-border rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} className="text-luxury-gold" />
              </div>
              
              <h2 className="text-2xl font-serif font-bold text-white mb-2">{title}</h2>
              <p className="text-luxury-textDim text-sm leading-relaxed mb-8">
                {message}
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={closeConfirm}
                  className="py-4 rounded-2xl border border-luxury-border text-luxury-text font-bold uppercase tracking-widest text-[10px] hover:bg-luxury-gray/30 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    closeConfirm();
                  }}
                  className="py-4 rounded-2xl bg-luxury-gold text-black font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-luxury-gold/20 hover:scale-[1.02] transition-all"
                >
                  Confirm
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
