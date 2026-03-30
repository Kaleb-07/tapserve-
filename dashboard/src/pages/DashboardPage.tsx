import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  ArrowUpRight,
  Package,
  Loader2,
  PlayCircle,
  CheckCircle,
  ShoppingBag,
  Clock,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

export const DashboardPage: React.FC<{ onSetTab?: (id: string) => void }> = ({ onSetTab }) => {
  const { orders, fetchOrders } = useStore();

  const statusIcons = {
    PENDING: Package,
    PREPARING: Loader2,
    READY: PlayCircle,
    DELIVERED: CheckCircle,
  };

  const statusColors = {
    PENDING: 'text-amber-500',
    PREPARING: 'text-blue-500',
    READY: 'text-emerald-500',
    DELIVERED: 'text-gray-500',
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const stats = [
    { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'text-luxury-gold' },
    { label: 'Pending', value: orders.filter(o => o.status === 'PENDING').length, icon: Clock, color: 'text-amber-500' },
    { label: 'Preparing', value: orders.filter(o => o.status === 'PREPARING').length, icon: TrendingUp, color: 'text-blue-500' },
    { label: 'Completed', value: orders.filter(o => o.status === 'DELIVERED').length, icon: CheckCircle2, color: 'text-emerald-500' },
  ];

  const totalRevenue = orders.reduce((acc, curr) => acc + curr.totalPrice, 0);

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white font-serif">Luxury Overview</h1>
        <p className="text-gray-500 text-xs md:text-sm mt-1">Real-time performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="card-luxury flex items-center justify-between group"
          >
            <div>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white mt-1">{stat.value}</h3>
            </div>
            <div className={`p-3 md:p-4 rounded-xl bg-luxury-gray/40 border border-luxury-border shadow-inner ${stat.color} group-hover:border-luxury-gold transition-colors duration-300`}>
              <stat.icon size={24} className="md:w-7 md:h-7" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Card */}
        <div className="lg:col-span-2 card-luxury overflow-hidden group">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <p className="text-[10px] text-luxury-gold uppercase tracking-widest font-bold">Revenue Report</p>
              <h3 className="text-xl md:text-2xl font-bold text-white mt-1">Total Earnings</h3>
            </div>
            <div className="flex bg-luxury-gray/40 border border-luxury-border rounded-lg p-1">
              <button className="px-3 py-1 text-[10px] md:text-xs text-luxury-gold bg-luxury-gold/10 rounded-md">Today</button>
              <button className="px-3 py-1 text-[10px] md:text-xs text-gray-500">Weekly</button>
            </div>
          </div>
          
          <div className="flex items-end space-x-3 md:space-x-4 mb-2">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-white">${totalRevenue.toLocaleString()}</h2>
            <div className="flex items-center text-emerald-500 text-xs md:text-sm font-medium mb-1">
              <ArrowUpRight size={14} className="md:w-4 md:h-4" />
              <span>+12.5%</span>
            </div>
          </div>
          <p className="text-gray-500 text-xs md:text-sm">vs last month ($142,500)</p>

          <div className="mt-8 grid grid-cols-7 gap-2 items-end h-32">
            {[40, 60, 35, 85, 45, 90, 75].map((h, i) => (
              <div key={i} className="bg-luxury-gray/60 border border-luxury-border rounded-t-sm w-full h-full relative overflow-hidden">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                  className="absolute bottom-0 left-0 w-full bg-gold-gradient opacity-80"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Mini-Feed */}
        <div className="card-luxury">
          <h3 className="text-lg font-bold text-white mb-6">Recent Orders</h3>
          <div className="space-y-6">
            {orders.slice(0, 5).map((order) => {
              const StatusIcon = statusIcons[order.status] || Package;
              return (
                <div key={order.id} className="flex items-center space-x-4 border-b border-luxury-border border-dashed pb-4 last:border-0 last:pb-0">
                  <div className={`w-10 h-10 rounded-full bg-luxury-gray flex items-center justify-center border border-luxury-border ${statusColors[order.status]}`}>
                    <StatusIcon size={20} className={order.status === 'PREPARING' ? 'animate-spin' : ''} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">Order #{order.id.slice(-6).toUpperCase()}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-[10px] text-gray-500 capitalize">{order.sourceType} • {order.sourceId}</p>
                      {order.notes && <div className="w-1 h-1 rounded-full bg-amber-500" title="Special instructions"></div>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-luxury-gold">${order.totalPrice.toFixed(2)}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${statusColors[order.status]}`}>{order.status}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <button 
            onClick={() => onSetTab?.('orders')}
            className="w-full mt-8 py-3 text-xs font-bold text-luxury-gold border border-luxury-gold/20 rounded-lg hover:bg-luxury-gold/5 transition-all uppercase tracking-widest"
          >
            View All Orders
          </button>
        </div>
      </div>
    </div>
  );
};
