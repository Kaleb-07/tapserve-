import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, CheckCircle, Package, PlayCircle, Loader2, PlusCircle, Star } from 'lucide-react';
import { ManualOrderModal } from '../components/ManualOrderModal';

const statusColors = {
  PENDING: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
  PREPARING: 'text-blue-500 border-blue-500/20 bg-blue-500/5',
  READY: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5',
  DELIVERED: 'text-gray-500 border-gray-500/20 bg-gray-500/5',
};

const statusIcons = {
  PENDING: Package,
  PREPARING: Loader2,
  READY: PlayCircle,
  DELIVERED: CheckCircle,
};

export const OrdersPage: React.FC = () => {
  const { orders, fetchOrders, updateOrderStatus, loading } = useStore();
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = React.useState(false);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading && orders.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-luxury-gold" size={48} />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Order Management</h1>
          <p className="text-gray-500 mt-1">Real-time order feed & status tracking</p>
        </div>
        <div className="flex space-x-3">
          <div className="card-luxury p-3 text-sm flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
            <span>{orders.filter(o => o.status === 'PENDING').length} Pending</span>
          </div>
          <div className="card-luxury p-3 text-sm flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span>{orders.filter(o => o.status === 'PREPARING').length} Preparing</span>
          </div>
        </div>
        <button 
          onClick={() => setIsManualOrderModalOpen(true)}
          className="btn-gold flex items-center space-x-3 px-6 py-3 rounded-full font-bold text-sm shadow-[0_4px_15px_rgba(212,175,55,0.2)] hover:shadow-[0_4px_25px_rgba(212,175,55,0.3)] transition-all"
        >
          <PlusCircle size={20} />
          <span>New Order</span>
        </button>
      </div>

      <ManualOrderModal 
        isOpen={isManualOrderModalOpen} 
        onClose={() => setIsManualOrderModalOpen(false)} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-luxury bg-luxury-dark/60 relative overflow-hidden group"
            >
              {/* Order Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center space-x-2 text-xs text-luxury-gold uppercase tracking-tighter mb-1 font-semibold">
                    <Clock size={12} />
                    <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Order #{order.id.slice(-6).toUpperCase()}</h3>
                </div>
                <div className={`px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest ${statusColors[order.status]}`}>
                  {order.status}
                </div>
              </div>

              {/* Source Info */}
              <div className="flex items-center space-x-3 p-3 bg-luxury-gray/40 border border-luxury-border rounded-lg mb-6">
                <div className="w-10 h-10 rounded-full bg-luxury-gold/10 flex items-center justify-center text-luxury-gold border border-luxury-gold/20">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-luxury-gold uppercase tracking-tighter font-semibold">{order.sourceType}</p>
                  <p className="text-sm font-medium text-white">{order.sourceId || 'Regular'}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4 mb-6">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-start border-b border-luxury-border border-dashed pb-3 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-luxury-gold font-bold text-sm">x{item.quantity}</span>
                        <p className="text-sm font-medium text-gray-200">{item.menuItem.name}</p>
                      </div>
                      {item.customizations && (
                        <div className="text-[10px] mt-1 pl-6 space-y-0.5">
                          {(() => {
                            try {
                              const customs = JSON.parse(item.customizations);
                              if (customs.Excluded) {
                                return <p className="text-red-400 font-bold uppercase tracking-widest">NO {customs.Excluded.join(', ')}</p>;
                              }
                              return <p className="text-gray-500 italic">{Object.values(customs).join(', ')}</p>;
                            } catch (e) {
                              return <p className="text-gray-500 italic">{item.customizations}</p>;
                            }
                          })()}
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-400">
                      ${(item.priceAtOrder * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Order Notes */}
              {order.notes && (
                <div className="mb-6 p-4 bg-luxury-gold/5 border border-luxury-gold/10 rounded-2xl">
                  <p className="text-[10px] text-luxury-gold uppercase tracking-widest font-bold mb-2 flex items-center">
                    <Star size={12} className="mr-2 fill-luxury-gold/20" /> Special Instructions
                  </p>
                  <p className="text-xs text-gray-400 italic">"{order.notes}"</p>
                </div>
              )}

              {/* Total & Actions */}
              <div className="mt-auto pt-4 border-t border-luxury-border flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Total Price</p>
                  <p className="text-xl font-serif font-bold text-luxury-gold">${order.totalPrice.toFixed(2)}</p>
                </div>
                
                <div className="flex space-x-2">
                  {order.status === 'PENDING' && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                      className="px-4 py-2 bg-luxury-gold text-black rounded text-xs font-bold hover:bg-luxury-goldLight transition-colors"
                    >
                      Prepare
                    </button>
                  )}
                  {order.status === 'PREPARING' && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'READY')}
                      className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-500 transition-colors"
                    >
                      Ready to Serve
                    </button>
                  )}
                  {order.status === 'READY' && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                      className="px-4 py-2 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-500 transition-colors"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
