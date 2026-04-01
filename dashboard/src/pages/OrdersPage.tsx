import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, Loader2, PlusCircle, Star, ChevronDown, ChevronUp, Phone } from 'lucide-react';
import { ManualOrderModal } from '../components/ManualOrderModal';
import { DollarSign, CheckCircle2 } from 'lucide-react';

const statusColors = {
  PENDING: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
  PREPARING: 'text-blue-500 border-blue-500/20 bg-blue-500/5',
  READY: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5',
  DELIVERED: 'text-gray-500 border-gray-500/20 bg-gray-500/5',
};
const OrderItemsCell = ({ items }: { items: any[] }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!items || items.length === 0) return <span className="text-gray-500 text-xs italic">No items</span>;

  return (
    <div className="flex flex-col">
      <div 
        className="flex items-center space-x-2 cursor-pointer group hover:bg-luxury-black/40 p-2 -ml-2 rounded-lg transition-colors inline-flex w-max"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-sm font-bold text-luxury-gold group-hover:text-luxury-goldLight transition-colors">
          {items.length === 1 ? items[0].menuItem.name : `${items.length} Items`}
        </span>
        <div className="bg-luxury-gray/20 p-1 rounded-full group-hover:bg-luxury-gray/40 transition-colors">
          {isExpanded ? (
            <ChevronUp size={12} className="text-gray-400 group-hover:text-white transition-colors" />
          ) : (
            <ChevronDown size={12} className="text-gray-400 group-hover:text-white transition-colors" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 mt-3 pt-3 border-t border-luxury-border/30">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="text-luxury-gold font-bold text-xs uppercase tracking-tighter w-6">x{item.quantity}</span>
                    <span className="text-sm font-medium text-gray-200">{item.menuItem.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ExclusionsCell = ({ items }: { items: any[] }) => {
  const allExclusions = items.flatMap(item => {
    try {
      let customs = JSON.parse(item.customizations);
      if (typeof customs === 'string') customs = JSON.parse(customs);
      if (customs && Array.isArray(customs.Excluded)) {
        return customs.Excluded.map((ex: string) => ({ itemName: item.menuItem.name, ingredient: ex }));
      }
    } catch (e) {}
    return [];
  });

  if (allExclusions.length === 0) return <span className="text-[10px] text-gray-600 italic uppercase tracking-widest font-bold">None</span>;

  return (
    <div className="flex flex-col space-y-1.5">
      {allExclusions.map((ex, idx) => (
        <div key={idx} className="flex flex-col">
          <span className="text-[8px] text-gray-500 uppercase tracking-tighter leading-none mb-0.5">{ex.itemName}</span>
          <span className="text-red-400 font-bold uppercase tracking-widest text-[10px] leading-tight">
            NO {ex.ingredient}
          </span>
        </div>
      ))}
    </div>
  );
};

const ExpandableNoteCell = ({ note }: { note?: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!note) return <span className="text-xs text-gray-600 italic">None</span>;

  // Assume approx 40 characters limit before needing to expand
  const shouldTruncate = note.length > 40;

  return (
    <div className="flex flex-col items-start min-w-[150px] max-w-[250px]">
      <span className="text-[9px] text-luxury-gold uppercase tracking-widest font-bold flex items-center mb-1">
        <Star size={10} className="mr-1 inline" /> Instruction
      </span>
      <span className={`text-xs text-luxury-textDim italic ${!isExpanded && shouldTruncate ? 'line-clamp-2' : 'whitespace-normal'}`}>
        "{note}"
      </span>
      {shouldTruncate && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[9px] text-luxury-gold hover:text-luxury-goldLight uppercase tracking-widest mt-1.5 font-bold transition-colors inline-flex items-center"
        >
          {isExpanded ? 'View Less' : 'View More'}
        </button>
      )}
    </div>
  );
};

const LocationCell = ({ order }: { order: any }) => {
  return (
    <div className="flex items-center space-x-2 text-sm text-luxury-text font-medium">
      <div className="w-6 h-6 rounded-full bg-luxury-gold/10 flex items-center justify-center text-luxury-gold border border-luxury-gold/20 flex-shrink-0">
        <MapPin size={12} />
      </div>
      <div className={`flex flex-col ${order.sourceType === 'Outsource' ? 'bg-luxury-gold/10 p-2 rounded-xl border border-luxury-gold/30 w-full' : ''}`}>
        <div className="flex items-center space-x-1.5 mb-1">
          <span className={`text-[10px] uppercase tracking-widest font-bold ${order.sourceType === 'Outsource' ? 'text-luxury-gold' : 'text-gray-500'}`}>
            {order.sourceType}
          </span>
          {order.sourceType === 'Outsource' && (
            <div className="w-1.5 h-1.5 rounded-full bg-luxury-gold animate-pulse" />
          )}
        </div>
        
        {order.sourceType === 'Outsource' ? (
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2 bg-luxury-black/40 px-2 py-1.5 rounded-lg border border-luxury-border/50">
              <Phone size={10} className="text-emerald-500" />
              <a 
                href={`tel:${order.customerPhone}`}
                className="text-xs font-bold text-luxury-gold hover:text-white transition-colors"
                title="Click to call"
              >
                {order.customerPhone || 'Walk-in'}
              </a>
            </div>
          </div>
        ) : (
          <span className="leading-tight text-luxury-text">{order.sourceId || 'Regular'}</span>
        )}
      </div>
    </div>
  );
};

export const OrdersPage: React.FC = () => {
  const { orders, fetchOrders, updateOrderStatus, loading, searchQuery } = useStore();
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);

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
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-xl md:text-2xl font-bold text-white">Order Management</h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1">Real-time order feed & status tracking</p>
        <div className="flex flex-wrap gap-3">
          <div className="card-luxury p-2 md:p-3 text-[10px] md:text-sm flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
            <span className="text-luxury-text">{orders.filter(o => o.status === 'PENDING').length} Pending</span>
          </div>
          <div className="card-luxury p-2 md:p-3 text-[10px] md:text-sm flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-luxury-text">{orders.filter(o => o.status === 'PREPARING').length} Preparing</span>
          </div>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center space-x-2 px-4 md:px-6 py-2 md:py-3 rounded-full font-bold text-[10px] md:text-sm shadow-lg transition-all ${
              showHistory 
              ? 'bg-luxury-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]' 
              : 'bg-luxury-gray/40 text-luxury-gold border border-luxury-gold/30 hover:bg-luxury-gray/60'
            }`}
          >
            <Clock size={16} className="md:w-5 md:h-5" />
            <span>{showHistory ? 'All Orders' : 'Active Only'}</span>
          </button>

          <button 
            onClick={() => setIsManualOrderModalOpen(true)}
            className="btn-gold flex items-center space-x-3 px-4 md:px-6 py-2 md:py-3 rounded-full font-bold text-[10px] md:text-sm shadow-lg hover:shadow-xl transition-all"
          >
            <PlusCircle size={16} className="md:w-5 md:h-5" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      <ManualOrderModal 
        isOpen={isManualOrderModalOpen} 
        onClose={() => setIsManualOrderModalOpen(false)} 
      />

      <div className="overflow-x-auto bg-luxury-dark/60 rounded-2xl border border-luxury-border shadow-2xl custom-scrollbar">
        <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
          <thead>
            <tr className="border-b border-luxury-gold/50 text-[11px] uppercase tracking-[0.2em] text-black bg-luxury-gold">
              <th className="p-4 font-bold w-24">Order ID</th>
              <th className="p-4 font-bold w-28">Time</th>
              <th className="p-4 font-bold w-32">Location</th>
              <th className="p-4 font-bold">Items</th>
              <th className="p-4 font-bold">Exclusions</th>
              <th className="p-4 font-bold">Instruction</th>
              <th className="p-4 font-bold w-24">Total</th>
              <th className="p-4 font-bold w-32">Payment</th>
              <th className="p-4 font-bold text-right w-32">Action</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {orders
                .filter(order => {
                  // If not showing history, exclude completed orders from the active list
                  if (!showHistory) {
                    const isCompleted = order.status === 'DELIVERED' && order.paymentStatus === 'PAID';
                    if (isCompleted) return false;
                  }

                  const query = searchQuery.toLowerCase();
                  if (!query) return true;
                  const idMatch = order.id.toLowerCase().includes(query);
                  const sourceMatch = (order.sourceId || '').toLowerCase().includes(query);
                  const itemMatch = order.items.some(i => i.menuItem.name.toLowerCase().includes(query));
                  return idMatch || sourceMatch || itemMatch;
                })
                .map((order) => (
                <motion.tr
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="border-b border-luxury-border/50 hover:bg-luxury-gray/10 transition-colors group"
                >
                  <td className="p-4 text-sm font-bold text-luxury-text align-top">
                    #{order.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex items-center space-x-2 text-xs text-luxury-textDim font-medium">
                      <Clock size={12} className="text-luxury-gold" />
                      <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </td>
                   <td className="p-4 align-top">
                    <LocationCell order={order} />
                  </td>
                  <td className="p-4 align-top overflow-hidden">
                    <OrderItemsCell items={order.items} />
                  </td>
                  <td className="p-4 align-top overflow-hidden">
                    <ExclusionsCell items={order.items} />
                  </td>
                  <td className="p-4 align-top overflow-hidden">
                    <ExpandableNoteCell note={order.notes} />
                  </td>
                  <td className="p-4 align-top">
                    <span className="text-base font-serif font-bold text-luxury-gold">${order.totalPrice.toFixed(2)}</span>
                  </td>
                  <td className="p-4 align-top">
                    {/* Interactive Payment Status Badge only */}
                    <button
                      disabled={order.paymentStatus === 'PAID'}
                      onClick={() => updateOrderStatus(order.id, undefined, 'PAID')}
                      className={`w-full group relative overflow-hidden px-2.5 py-1.5 rounded-lg border text-[8px] font-bold uppercase tracking-widest transition-all ${
                        order.paymentStatus === 'PAID'
                        ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5 cursor-default'
                        : 'text-rose-500 border-rose-500/20 bg-rose-500/5 hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:text-emerald-400 cursor-pointer animate-pulse'
                      }`}
                    >
                      <span className="relative z-10 flex items-center justify-center space-x-1">
                        {order.paymentStatus === 'PAID' ? <CheckCircle2 size={10} /> : <DollarSign size={10} />}
                        <span>{order.paymentStatus}</span>
                      </span>
                    </button>
                  </td>
                  <td className="p-4 text-right align-top">
                    <div className="flex flex-col items-end space-y-2">
                      {/* Order Status Badge moved here */}
                      <span className={`px-2 py-0.5 w-max text-center rounded-lg border text-[7px] font-bold uppercase tracking-widest ${statusColors[order.status as keyof typeof statusColors] || statusColors.PENDING}`}>
                        {order.status}
                      </span>

                      <div className="flex justify-end">
                        {order.status === 'PENDING' && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                          className="px-3 py-1.5 bg-luxury-gold text-black rounded-lg text-[10px] uppercase tracking-widest font-bold hover:bg-luxury-goldLight transition-colors whitespace-nowrap"
                        >
                          Prepare
                        </button>
                      )}
                      {order.status === 'PREPARING' && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'READY')}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] uppercase tracking-widest font-bold hover:bg-blue-500 transition-colors whitespace-nowrap"
                        >
                          Ready
                        </button>
                      )}
                      {order.status === 'READY' && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] uppercase tracking-widest font-bold hover:bg-emerald-500 transition-colors whitespace-nowrap"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
};
