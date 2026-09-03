import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';

export const PaymentPage: React.FC = () => {
  const { orders, fetchOrders, updateOrderStatus } = useStore();
  const [filter, setFilter] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL');

  useEffect(() => {
    fetchOrders();
    // The Setting up polling for live updates or relying on existing socket connection
  }, [fetchOrders]);

  const filteredOrders = orders.filter(o => filter === 'ALL' || o.paymentStatus === filter);

  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-serif font-extrabold gold-text">Payments</h1>
          <p className="text-sm text-luxury-textDim mt-2">Track the financial statuses of all services.</p>
        </div>

        <div className="flex space-x-2 bg-luxury-dark border border-luxury-border p-1 rounded-xl w-max">
          {['ALL', 'UNPAID', 'PAID'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-6 py-2 rounded-lg text-xs uppercase tracking-widest font-bold transition-all ${
                filter === f 
                ? 'bg-luxury-gold text-black shadow-md' 
                : 'text-luxury-textDim hover:text-luxury-text'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full py-20 text-center opacity-30 mt-10">
            <CreditCard size={48} className="mx-auto mb-4 text-luxury-gold" />
            <p className="text-sm uppercase tracking-widest font-bold">No Records Found</p>
          </div>
        ) : (
          filteredOrders.map((order, idx) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex flex-col bg-luxury-dark border border-luxury-border rounded-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-luxury-border flex justify-between items-center bg-luxury-black/50">
                <div>
                  <span className="text-xs text-luxury-textDim uppercase tracking-widest">#{order.id.slice(-6).toUpperCase()}</span>
                  <div className="text-lg font-serif font-bold mt-1 text-luxury-text">
                    {order.sourceType} {order.sourceId}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full border flex items-center gap-2 ${
                  order.paymentStatus === 'PAID' 
                  ? 'border-green-500/30 bg-green-500/10 text-green-400' 
                  : 'border-luxury-gold/30 bg-luxury-gold/10 text-luxury-gold'
                }`}>
                  {order.paymentStatus === 'PAID' ? <CheckCircle size={12} /> : <Clock size={12} />}
                  <span className="text-[10px] uppercase font-bold tracking-widest">{order.paymentStatus}</span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-luxury-textDim mb-3">Order Summary</p>
                  <div className="space-y-2 mb-4 max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-luxury-text truncate mr-2">{item.quantity}x {item.menuItem?.name}</span>
                        <span className="text-luxury-textDim">${(item.priceAtOrder * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-end border-t border-luxury-border pt-4 mb-4">
                    <span className="text-xs uppercase tracking-widest text-luxury-textDim">Total</span>
                    <span className="text-2xl font-serif font-bold text-luxury-gold">${order.totalPrice.toFixed(2)}</span>
                  </div>

                  {order.paymentStatus === 'UNPAID' ? (
                    <button
                      onClick={() => updateOrderStatus(order.id, undefined, 'PAID')}
                      className="w-full py-3 rounded-xl font-bold uppercase tracking-[0.2em] transition-all hover:scale-[1.02] text-black shadow-lg shadow-luxury-gold/20 flex justify-center items-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f1d592 50%, #aa8d2e 100%)' }}
                    >
                      <CreditCard size={18} />
                      <span>Mark as Paid</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => updateOrderStatus(order.id, undefined, 'UNPAID')}
                      className="w-full py-3 rounded-xl font-bold uppercase tracking-[0.2em] transition-all border border-luxury-border bg-luxury-black text-luxury-textDim hover:text-white"
                    >
                      Revert To Unpaid
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
