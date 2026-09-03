import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import type { Order } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, PlusCircle, ArrowRightLeft, Clock, X, Receipt } from 'lucide-react';
import { ManualOrderModal } from '../components/ManualOrderModal';
import { CheckoutModal } from '../components/CheckoutModal';

export const WaiterTablesPage: React.FC = () => {
  const { user, sources, orders, fetchSources, fetchOrders, updateOrderDetails, showNotification } = useStore();
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState(false);
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<string | null>(null);
  
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferOrderFrom, setTransferOrderFrom] = useState<Order | null>(null);
  const [transferTargetId, setTransferTargetId] = useState<string>('');
  const [reservedTables, setReservedTables] = useState<Record<string, boolean>>({});

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutTableId, setCheckoutTableId] = useState<string>('');

  useEffect(() => {
    fetchSources();
    fetchOrders();
    const savedReserved = localStorage.getItem('luxury_reserved_tables');
    if (savedReserved) {
      try { setReservedTables(JSON.parse(savedReserved)); } catch (e) {}
    }
  }, [fetchSources, fetchOrders]);


  // Derived tables: Admin sees all tables, Waiter sees only assigned
  const isAdmin = user?.role === 'ADMIN';
  const assignedTableIds = user?.assignedTables ? user.assignedTables.split(',').map(s => s.trim()).filter(Boolean) : [];
  
  const waiterTables = sources.filter(s => {
    if (s.type !== 'Table') return false;
    if (isAdmin) return true;
    return assignedTableIds.includes(s.identifier);
  });

  // Active orders
  const activeOrders = orders.filter(
    o => o.status !== 'DELIVERED' || o.paymentStatus !== 'PAID'
  );

  const handleOpenNewOrder = (tableId: string) => {
    setSelectedTableForOrder(tableId);
    setIsManualOrderModalOpen(true);
  };

  const handleOpenCheckout = (tableId: string) => {
    setCheckoutTableId(tableId);
    setIsCheckoutModalOpen(true);
  };

  const handleOpenTransfer = (order: Order) => {
    setTransferOrderFrom(order);
    setTransferTargetId('');
    setIsTransferModalOpen(true);
  };

  const handleTransferSubmit = async () => {
    if (!transferOrderFrom) return;
    if (!transferTargetId) return showNotification('Select a target table', 'error');
    if (transferTargetId === transferOrderFrom.sourceId) return showNotification('Already at this table', 'error');

    try {
      await updateOrderDetails(transferOrderFrom.id, { sourceId: transferTargetId });
      showNotification(`Order moved to Table ${transferTargetId}`, 'success');
      setIsTransferModalOpen(false);
    } catch (err) {
      showNotification('Failed to transfer table', 'error');
    }
  };

  const toggleReservation = (tableId: string) => {
    const newReserved = { ...reservedTables, [tableId]: !reservedTables[tableId] };
    setReservedTables(newReserved);
    localStorage.setItem('luxury_reserved_tables', JSON.stringify(newReserved));
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-luxury-text font-serif tracking-tight">
            Table Management
          </h1>
          <p className="text-luxury-textDim text-xs md:text-sm mt-1">
            {isAdmin ? 'Global overview of all venue tables' : 'Status and assignment for your tables'}
          </p>
        </div>
      </div>

      {waiterTables.length === 0 ? (
        <div className="card-luxury p-12 flex flex-col items-center justify-center text-center">
          <Users size={48} className="text-luxury-textDim mb-4 opacity-30" />
          <h3 className="text-xl font-bold text-luxury-text font-serif">No Tables Assigned</h3>
          <p className="text-sm text-luxury-textDim mt-2 max-w-md">
            You currently have no tables assigned to your profile. Please contact an administrator to assign tables to you.
          </p>
        </div>
      ) : isAdmin ? (
        <div className="overflow-x-auto bg-luxury-dark/60 rounded-2xl border border-luxury-border shadow-2xl custom-scrollbar">
          <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
            <thead>
              <tr className="bg-luxury-gray/10 text-xs uppercase tracking-[0.2em] text-luxury-textDim">
                <th className="p-4 font-bold w-24 border-b border-luxury-border/50">Table</th>
                <th className="p-4 font-bold w-40 border-b border-luxury-border/50">Status</th>
                <th className="p-4 font-bold border-b border-luxury-border/50">Active Orders</th>
                <th className="p-4 font-bold w-32 border-b border-luxury-border/50 text-right">Value</th>
                <th className="p-4 font-bold w-48 border-b border-luxury-border/50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {waiterTables.map(table => {
                const tableOrders = activeOrders.filter(o => o.sourceId === table.identifier && o.sourceType === 'Table');
                const isOccupied = tableOrders.length > 0;
                const isReserved = !isOccupied && reservedTables[table.identifier];
                const totalBill = tableOrders.reduce((sum, o) => sum + o.totalPrice, 0);

                return (
                  <tr key={table.id} className="border-b border-luxury-border/50 hover:bg-luxury-gray/10 transition-colors">
                    <td className="p-4 font-bold text-luxury-text text-lg font-serif">
                      {table.identifier}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${isOccupied ? 'bg-rose-500 animate-pulse' : isReserved ? 'bg-purple-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <span className={`text-xs font-bold uppercase tracking-widest ${isOccupied ? 'text-rose-400' : isReserved ? 'text-purple-400' : 'text-emerald-400'}`}>
                          {isOccupied ? 'Occupied' : isReserved ? 'Reserved' : 'Available'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {isOccupied ? (
                        <div className="flex flex-wrap gap-2">
                          {tableOrders.map(order => (
                            <span key={order.id} className="px-2 py-1 bg-luxury-gray/30 border border-luxury-border rounded text-[10px] text-luxury-gold font-bold">
                              #{order.id.slice(-4).toUpperCase()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-luxury-textDim text-sm opacity-50">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <span className={`font-bold font-serif ${isOccupied ? 'text-luxury-gold text-lg' : 'text-luxury-textDim opacity-50'}`}>
                        ${totalBill.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {!isOccupied && (
                          <button 
                            onClick={() => toggleReservation(table.identifier)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${
                              isReserved 
                                ? 'border-purple-500/50 text-purple-400 hover:bg-purple-500/10' 
                                : 'border-luxury-border text-luxury-textDim hover:border-luxury-gold hover:text-luxury-gold'
                            }`}
                          >
                            {isReserved ? 'Unreserve' : 'Reserve'}
                          </button>
                        )}
                        <button 
                          onClick={() => handleOpenNewOrder(table.identifier)}
                          className="px-3 py-1.5 bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold rounded-lg hover:bg-luxury-gold hover:text-black transition-all flex items-center text-[10px] font-bold uppercase tracking-widest"
                        >
                          <PlusCircle size={12} className="mr-1" /> Order
                        </button>
                        {isOccupied && (
                          <button 
                            onClick={() => handleOpenCheckout(table.identifier)}
                            className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-black transition-all flex items-center text-[10px] font-bold uppercase tracking-widest"
                          >
                            <Receipt size={12} className="mr-1" /> Checkout
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {waiterTables.map(table => {
            // Find active orders for this tables
            const tableOrders = activeOrders.filter(o => o.sourceId === table.identifier && o.sourceType === 'Table');
            const isOccupied = tableOrders.length > 0;
            const isReserved = !isOccupied && reservedTables[table.identifier];
            const totalBill = tableOrders.reduce((sum, o) => sum + o.totalPrice, 0);

            return (
              <motion.div
                key={table.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                  isOccupied 
                    ? 'bg-luxury-gold/5 border-luxury-gold/40 shadow-[0_4px_30px_rgba(212,175,55,0.05)]' 
                    : isReserved 
                      ? 'bg-purple-900/20 border-purple-500/40 shadow-xl'
                      : 'bg-luxury-dark/60 border-luxury-border shadow-xl hover:bg-luxury-gray/10'
                }`}
              >
                {/* Header */}
                <div className="p-5 flex justify-between items-start border-b border-luxury-border/30">
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-luxury-text">Table {table.identifier}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${isOccupied ? 'bg-rose-500 animate-pulse' : isReserved ? 'bg-purple-500 animate-pulse' : 'bg-emerald-500'}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isOccupied ? 'text-rose-400' : isReserved ? 'text-purple-400' : 'text-emerald-400'}`}>
                        {isOccupied ? 'Occupied' : isReserved ? 'Reserved' : 'Available'}
                      </span>
                    </div>
                  </div>
                  {!isOccupied && (
                    <button 
                      onClick={() => toggleReservation(table.identifier)}
                      className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all ${
                        isReserved 
                          ? 'border-purple-500/50 text-purple-400 hover:bg-purple-500/10' 
                          : 'border-luxury-border text-gray-500 hover:border-luxury-gold hover:text-luxury-gold'
                      }`}
                    >
                      {isReserved ? 'Unreserve' : 'Mark Reserved'}
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  {isOccupied ? (
                    <div className="space-y-4">
                      {tableOrders.map(order => (
                        <div key={order.id} className="bg-luxury-gray/20 border border-luxury-border rounded-xl p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-luxury-gold">#{order.id.slice(-4).toUpperCase()}</span>
                            <span className="text-[10px] text-luxury-textDim font-bold uppercase">{order.status}</span>
                          </div>
                          <div className="flex justify-between items-end">
                            <span className="text-sm font-bold text-luxury-text">${order.totalPrice.toFixed(2)}</span>
                            <button
                              onClick={() => handleOpenTransfer(order)}
                              className="text-[9px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-widest flex items-center transition-colors"
                            >
                              <ArrowRightLeft size={10} className="mr-1" /> Transfer
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      <div className="pt-2 border-t border-luxury-border/50 flex justify-between items-center">
                        <span className="text-[10px] text-luxury-textDim uppercase tracking-widest font-bold">Total Bill</span>
                        <span className="text-lg font-bold text-luxury-gold">${totalBill.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                      <Clock size={24} className={`${isReserved ? 'text-purple-400' : 'text-luxury-textDim'} mb-2 opacity-50`} />
                      <p className={`text-xs font-medium ${isReserved ? 'text-purple-300' : 'text-luxury-textDim'}`}>
                        {isReserved ? 'Awaiting guests...' : 'Ready for guests'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer actions */}
                <div className="p-3 bg-luxury-gray/10 border-t border-luxury-border flex space-x-2">
                  <button 
                    onClick={() => handleOpenNewOrder(table.identifier)}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center shadow-lg ${
                      isOccupied 
                        ? 'bg-luxury-dark border border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold/10'
                        : 'bg-luxury-gold text-black hover:bg-luxury-goldLight hover:scale-[1.02]'
                    }`}
                  >
                    <PlusCircle size={14} className="mr-2" />
                    {isOccupied ? 'Add to Order' : 'New Order'}
                  </button>
                  {isOccupied && (
                    <button 
                      onClick={() => handleOpenCheckout(table.identifier)}
                      className="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center shadow-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white"
                    >
                      <Receipt size={14} className="mr-2" />
                      Checkout
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Manual Order Modal (Reused) */}
      <ManualOrderModal 
        isOpen={isManualOrderModalOpen} 
        onClose={() => setIsManualOrderModalOpen(false)} 
        initialSourceType="Table"
        initialSourceId={selectedTableForOrder || ''}
      />

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        tableId={checkoutTableId}
        tableOrders={orders.filter(o => o.sourceId === checkoutTableId && o.sourceType === 'Table' && (o.status !== 'DELIVERED' || o.paymentStatus !== 'PAID'))}
      />

      {/* Transfer Modal */}
      <AnimatePresence>
        {isTransferModalOpen && transferOrderFrom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-luxury-dark border border-luxury-border rounded-[2rem] overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-6 border-b border-luxury-border flex justify-between items-center bg-luxury-gray/10">
                <h2 className="text-xl font-serif font-bold text-luxury-text flex items-center">
                  <ArrowRightLeft size={20} className="mr-2 text-luxury-gold" /> Transfer Order
                </h2>
                <button onClick={() => setIsTransferModalOpen(false)} className="text-luxury-textDim hover:text-luxury-text">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <p className="text-xs text-luxury-textDim uppercase tracking-widest font-bold mb-1">Moving Order</p>
                  <p className="text-lg font-bold text-luxury-gold">#{transferOrderFrom.id.slice(-4).toUpperCase()}</p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex-1 bg-luxury-gray border border-luxury-border rounded-xl p-4 text-center">
                    <p className="text-[10px] text-luxury-textDim uppercase tracking-widest font-bold mb-1">From</p>
                    <p className="text-luxury-text font-bold">Table {transferOrderFrom.sourceId}</p>
                  </div>
                  <ArrowRightLeft size={20} className="text-luxury-textDim" />
                  <div className="flex-1 bg-luxury-gold/10 border border-luxury-gold/30 rounded-xl p-4 text-center">
                    <p className="text-[10px] text-luxury-gold uppercase tracking-widest font-bold mb-1">To</p>
                    <p className="text-luxury-gold font-bold">Table {transferTargetId || '?'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-luxury-textDim mb-2">Select Target Table</label>
                  <select
                    value={transferTargetId}
                    onChange={(e) => setTransferTargetId(e.target.value)}
                    className="w-full bg-luxury-gray border border-luxury-border rounded-xl px-4 py-3 text-sm focus:border-luxury-gold outline-none text-luxury-text"
                  >
                    <option value="" disabled>Choose Table...</option>
                    {sources
                      .filter(s => s.type === 'Table' && s.identifier !== transferOrderFrom.sourceId)
                      .map(s => (
                        <option key={s.id} value={s.identifier}>Table {s.identifier}</option>
                      ))
                    }
                  </select>
                </div>

                <button
                  onClick={handleTransferSubmit}
                  disabled={!transferTargetId}
                  className="w-full py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-black transition-all hover:scale-[1.02] shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f1d592 50%, #aa8d2e 100%)' }}
                >
                  Confirm Transfer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
