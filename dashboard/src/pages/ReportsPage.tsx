import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { 
  DollarSign, 
  MapPin, 
  Coffee, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  Hotel,
  Smartphone
} from 'lucide-react';
import { motion } from 'framer-motion';

export const ReportsPage: React.FC = () => {
  const { orders } = useStore();
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  // Filter orders based on time range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      if (timeRange === 'today') {
        return orderDate.toDateString() === now.toDateString();
      } else if (timeRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return orderDate >= weekAgo;
      } else {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        return orderDate >= monthAgo;
      }
    });
  }, [orders, timeRange]);

  const handleExport = () => {
    const headers = ['Order ID', 'Date', 'Source Type', 'Source ID', 'Meal Type', 'Total Price', 'Status', 'Payment Status'];
    
    const escape = (val: any) => {
      let str = String(val === null || val === undefined ? '' : val);
      str = str.replace(/"/g, '""');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str}"`;
      }
      return str;
    };

    const rows = filteredOrders.map(order => [
      order.id,
      new Date(order.createdAt).toLocaleString(),
      order.sourceType,
      order.sourceId || 'N/A',
      order.mealType || 'ALL',
      order.totalPrice.toFixed(2),
      order.status,
      order.paymentStatus
    ]);

    const csvContent = [
      headers.map(escape).join(','),
      ...rows.map(row => row.map(escape).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Financial_Report_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculations
  const metrics = useMemo(() => {
    let revenue = 0;
    let totalCost = 0;
    let count = 0;

    filteredOrders.forEach(order => {
      revenue += order.totalPrice;
      count++;
      
      // Calculate cost from order items
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          // Use captured cost if available, otherwise fallback to 0
          const cost = (item.costPriceAtOrder || 0) * (item.quantity || 1);
          totalCost += cost;
        });
      }
    });

    const netProfit = revenue - totalCost;
    const avgValue = count > 0 ? revenue / count : 0;
    
    // Top Item
    const itemCounts: Record<string, { name: string, count: number }> = {};
    filteredOrders.forEach(o => {
      o.items?.forEach((oi: any) => {
        const name = oi.menuItem?.name || 'Unknown';
        if (!itemCounts[name]) itemCounts[name] = { name, count: 0 };
        itemCounts[name].count += oi.quantity || 1;
      });
    });
    
    const topItem = Object.values(itemCounts).sort((a, b) => b.count - a.count)[0]?.name || 'N/A';

    // Distribution
    const sources = {
      TABLE: filteredOrders.filter(o => o.sourceType === 'TABLE').length,
      ROOM: filteredOrders.filter(o => o.sourceType === 'ROOM').length,
      OTHER: filteredOrders.filter(o => !['TABLE', 'ROOM'].includes(o.sourceType)).length
    };

    return { revenue, totalCost, netProfit, count, avgValue, sources, topItem };
  }, [filteredOrders]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-luxury-text font-serif tracking-tight">Financial Intelligence</h1>
          <p className="text-luxury-textDim mt-1 flex items-center gap-2">
            Real-time revenue, <span className="text-luxury-gold font-bold italic">profit margins</span>, and order distribution
          </p>
        </div>

        <div className="flex items-center gap-3 bg-luxury-dark/40 p-1.5 rounded-[1.25rem] border border-luxury-border/50">
          {(['today', 'week', 'month'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${
                timeRange === range 
                ? 'bg-luxury-gold text-black shadow-lg shadow-luxury-gold/30' 
                : 'text-luxury-textDim hover:text-luxury-text'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard 
          label="Gross Revenue" 
          value={`$${metrics.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          icon={<DollarSign className="text-luxury-gold" size={20} />}
          trend="+12%"
          trendDir="up"
        />
        <MetricCard 
          label="Net Profit" 
          value={`$${metrics.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          icon={<ArrowUpRight className="text-luxury-gold" size={20} />}
          trend={`${((metrics.netProfit / (metrics.revenue || 1)) * 100).toFixed(1)}% margin`}
          trendDir={metrics.netProfit >= 0 ? 'up' : 'down'}
        />
        <MetricCard 
          label="Top Selling Item" 
          value={metrics.topItem} 
          icon={<Coffee className="text-luxury-gold" size={20} />}
          trend="Bestseller"
          trendDir="up"
        />
        <MetricCard 
          label="Total Orders" 
          value={metrics.count.toString()} 
          icon={<ShoppingCartIcon className="text-luxury-gold" size={20} />}
          trend="+5.4%"
          trendDir="up"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Source Distribution Visualization */}
        <div className="xl:col-span-1 glass-card p-8 rounded-[2.5rem] border border-luxury-border flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-serif font-bold text-white uppercase tracking-widest text-sm">Order Distribution</h3>
            <MapPin size={18} className="text-luxury-gold opacity-50" />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center space-y-10">
            {/* Custom CSS Donut Visual */}
            <div className="relative w-48 h-48 rounded-full border-[12px] border-luxury-gold/5 flex items-center justify-center">
               <div className="absolute inset-0 rounded-full border-[12px] border-t-luxury-gold border-r-luxury-gold/40 border-b-luxury-gold/10 border-l-luxury-gold/60 animate-spin-slow" />
               <div className="text-center">
                 <p className="text-[10px] uppercase tracking-widest text-luxury-textDim font-bold">Total</p>
                 <p className="text-3xl font-serif font-bold text-luxury-gold">{metrics.count}</p>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-5 w-full">
               <DistributionRow 
                 label="Table Service" 
                 count={metrics.sources.TABLE} 
                 total={metrics.count} 
                 icon={<Hotel size={14} />} 
                 color="#d4af37"
               />
               <DistributionRow 
                 label="Room Delivery" 
                 count={metrics.sources.ROOM} 
                 total={metrics.count} 
                 icon={<Coffee size={14} />} 
                 color="#a1842e"
               />
               <DistributionRow 
                 label="Digital / Other" 
                 count={metrics.sources.OTHER} 
                 total={metrics.count} 
                 icon={<Smartphone size={14} />} 
                 color="#63521d"
               />
            </div>
          </div>
        </div>

        {/* Transaction History & Performance */}
        <div className="xl:col-span-2 glass-card p-8 rounded-[2.5rem] border border-luxury-border">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-serif font-bold text-white uppercase tracking-widest text-sm">Revenue Flux</h3>
              <p className="text-[10px] text-luxury-textDim mt-1 uppercase tracking-widest">Latest transaction details</p>
            </div>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-luxury-gray/10 rounded-xl text-luxury-gold hover:bg-luxury-gold/10 transition-all text-[10px] font-bold uppercase tracking-widest border border-luxury-gold/10"
            >
              <Download size={14} /> Export Report
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-luxury-border/30">
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-luxury-gold opacity-50">Reference</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-luxury-gold opacity-50">Origin</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-luxury-gold opacity-50">Status</th>
                  <th className="pb-4 text-right text-[10px] font-bold uppercase tracking-widest text-luxury-gold opacity-50">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-border/10">
                {filteredOrders.slice(0, 8).map((order) => (
                  <tr key={order.id} className="group hover:bg-luxury-gold/5 transition-colors">
                    <td className="py-4 font-mono text-xs text-luxury-textDim tracking-tighter">
                      #{order.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-luxury-text uppercase tracking-widest">{order.sourceType}</span>
                        <span className="text-[10px] text-luxury-textDim">{order.sourceId}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border ${
                        order.status === 'READY' 
                        ? 'border-green-500/30 text-green-500 bg-green-500/5' 
                        : 'border-luxury-gold/30 text-luxury-gold bg-luxury-gold/5'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 text-right font-serif font-bold text-white italic">
                      ${order.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-20 text-center text-luxury-textDim text-sm italic opacity-50">
                      No transactions recorded for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        .glass-card {
          background: linear-gradient(180deg, rgba(20,20,20,0.4) 0%, rgba(10,10,10,0.6) 100%);
          backdrop-filter: blur(10px);
        }
      `}</style>
    </div>
  );
};

const MetricCard: React.FC<{ label: string, value: string, icon: React.ReactNode, trend: string, trendDir: 'up' | 'down' }> = ({ label, value, icon, trend, trendDir }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-luxury-dark border border-luxury-border p-6 rounded-[2rem] flex flex-col justify-between h-full shadow-lg hover:shadow-luxury-gold/10 transition-all duration-300 pointer-events-auto"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-luxury-gold/5 border border-luxury-gold/10 rounded-2xl">
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${trendDir === 'up' ? 'text-green-500' : 'text-red-500'}`}>
        {trendDir === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {trend}
      </div>
    </div>
    
    <div>
      <p className="text-[10px] text-luxury-textDim uppercase tracking-[0.2rem] font-bold mb-1 opacity-70">{label}</p>
      <h3 className="text-3xl font-serif font-bold text-white tracking-tighter leading-tight italic">{value}</h3>
    </div>
  </motion.div>
);

const DistributionRow: React.FC<{ label: string, count: number, total: number, icon: React.ReactNode, color: string }> = ({ label, count, total, icon, color }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
        <div className="flex items-center gap-2 text-luxury-text">
          <span style={{ color }}>{icon}</span>
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-luxury-textDim">{count} units</span>
           <span className="text-luxury-gold">{percentage}%</span>
        </div>
      </div>
      <div className="h-1.5 w-full bg-luxury-gray/10 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full" 
          style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}40` }}
        />
      </div>
    </div>
  );
};

const ShoppingCartIcon: React.FC<any> = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
  </svg>
);
