import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Clock, CheckCircle2, AlertCircle, TrendingUp,
  Table2, Zap, Package, Users, DollarSign, Timer, Award, Calendar
} from 'lucide-react';
import { useStore } from '../store/useStore';

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number) => `$${n.toFixed(2)}`;

const timeDiff = (from: string, to: string): number => {
  return (new Date(to).getTime() - new Date(from).getTime()) / 60000; // minutes
};

const fmtMins = (m: number) => {
  if (m < 1) return '<1 min';
  if (m < 60) return `${Math.round(m)} min`;
  return `${Math.floor(m / 60)}h ${Math.round(m % 60)}m`;
};

// Today's date range
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  delay?: number;
}> = ({ label, value, sub, icon: Icon, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="bg-luxury-dark/60 border border-luxury-border rounded-2xl p-6 flex flex-col justify-between hover:border-luxury-gold/20 transition-colors"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`p-2.5 rounded-xl ${color}`}>
        <Icon size={18} />
      </div>
    </div>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-luxury-textDim mb-1">{label}</p>
      <p className="text-3xl font-serif font-bold text-white">{value}</p>
      {sub && <p className="text-[10px] text-luxury-textDim mt-1 font-medium">{sub}</p>}
    </div>
  </motion.div>
);

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const ProgressBar: React.FC<{ label: string; count: number; total: number; color: string }> = ({
  label, count, total, color
}) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs font-bold text-luxury-text">{label}</span>
        <span className="text-xs font-bold text-luxury-textDim">{count} <span className="text-gray-600">({pct}%)</span></span>
      </div>
      <div className="h-2 bg-luxury-border/40 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const WaiterReportsPage: React.FC = () => {
  const { user, orders } = useStore();
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'all'>('today');

  const isAdmin = user?.role === 'ADMIN';
  const assignedTables = user?.assignedTables?.split(',').map(s => s.trim()).filter(Boolean) || [];

  // ── Filter orders by time range and role ──────────────────────────────────
  const relevantOrders = useMemo(() => {
    let base = orders.filter(o => o.sourceType === 'Table');

    // Waiters only see their assigned tables
    if (!isAdmin && assignedTables.length > 0) {
      base = base.filter(o => assignedTables.includes(o.sourceId || ''));
    }

    if (timeRange === 'today') {
      const today = startOfToday();
      base = base.filter(o => new Date(o.createdAt) >= today);
    } else if (timeRange === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      base = base.filter(o => new Date(o.createdAt) >= weekAgo);
    }

    return base;
  }, [orders, timeRange, isAdmin, assignedTables.join(',')]);

  // ── Key Metrics ───────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const total = relevantOrders.length;
    const delivered = relevantOrders.filter(o => o.status === 'DELIVERED').length;
    const pending = relevantOrders.filter(o => o.status === 'PENDING').length;
    const preparing = relevantOrders.filter(o => o.status === 'PREPARING').length;
    const ready = relevantOrders.filter(o => o.status === 'READY').length;
    const paid = relevantOrders.filter(o => o.paymentStatus === 'PAID').length;
    const revenue = relevantOrders
      .filter(o => o.paymentStatus === 'PAID')
      .reduce((s, o) => s + o.totalPrice, 0);

    // Average delivery time (only fully delivered ones)
    const deliveredWithTime = relevantOrders.filter(o => o.status === 'DELIVERED' && o.createdAt && o.updatedAt);
    const avgDeliveryMins = deliveredWithTime.length > 0
      ? deliveredWithTime.reduce((s, o) => s + timeDiff(o.createdAt, o.updatedAt), 0) / deliveredWithTime.length
      : 0;

    // Unique tables served
    const uniqueTables = [...new Set(relevantOrders.map(o => o.sourceId).filter(Boolean))];

    return { total, delivered, pending, preparing, ready, paid, revenue, avgDeliveryMins, uniqueTables };
  }, [relevantOrders]);

  // ── Per-table breakdown ───────────────────────────────────────────────────
  const tableBreakdown = useMemo(() => {
    const map: Record<string, { orders: number; revenue: number; tableId: string }> = {};
    relevantOrders.forEach(o => {
      const key = o.sourceId || 'Unknown';
      if (!map[key]) map[key] = { orders: 0, revenue: 0, tableId: key };
      map[key].orders++;
      if (o.paymentStatus === 'PAID') map[key].revenue += o.totalPrice;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [relevantOrders]);

  // ── Completion rate ───────────────────────────────────────────────────────
  const completionRate = metrics.total > 0
    ? Math.round((metrics.delivered / metrics.total) * 100)
    : 0;

  const timeLabel = { today: "Today's", week: "This Week's", all: "All-Time" }[timeRange];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <div className="p-2 rounded-xl bg-luxury-gold/10 border border-luxury-gold/20">
              <BarChart3 size={20} className="text-luxury-gold" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white font-serif tracking-tight">
              {isAdmin ? 'Staff Analytics' : 'My Performance'}
            </h1>
          </div>
          <p className="text-gray-500 text-xs md:text-sm mt-1 ml-11">
            {isAdmin
              ? `Venue-wide table order analytics`
              : `Your ${timeLabel.toLowerCase()} performance overview`}
          </p>
        </div>

        {/* Time Range Filter */}
        <div className="flex rounded-xl overflow-hidden border border-luxury-border bg-luxury-dark/40">
          {(['today', 'week', 'all'] as const).map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${timeRange === r
                  ? 'bg-luxury-gold text-black'
                  : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              {r === 'today' ? 'Today' : r === 'week' ? '7 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── TOP STATS GRID ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Orders"
          value={metrics.total}
          sub={`${timeLabel} activity`}
          icon={Package}
          color="bg-sky-500/10 text-sky-400"
          delay={0.05}
        />
        <StatCard
          label="Revenue Handled"
          value={fmt(metrics.revenue)}
          sub={`${metrics.paid} paid orders`}
          icon={DollarSign}
          color="bg-luxury-gold/10 text-luxury-gold"
          delay={0.1}
        />
        <StatCard
          label="Avg. Delivery Time"
          value={metrics.avgDeliveryMins > 0 ? fmtMins(metrics.avgDeliveryMins) : 'N/A'}
          sub="From order to served"
          icon={Timer}
          color="bg-purple-500/10 text-purple-400"
          delay={0.15}
        />
        <StatCard
          label="Tables Served"
          value={metrics.uniqueTables.length}
          sub={`Completion: ${completionRate}%`}
          icon={Table2}
          color="bg-emerald-500/10 text-emerald-400"
          delay={0.2}
        />
      </div>

      {/* ── MIDDLE ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Status Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-luxury-dark/60 border border-luxury-border rounded-2xl p-6"
        >
          <div className="flex items-center space-x-2 mb-6">
            <CheckCircle2 size={16} className="text-luxury-gold" />
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Order Status Breakdown</h2>
          </div>
          <div className="space-y-4">
            <ProgressBar label="Delivered" count={metrics.delivered} total={metrics.total} color="bg-emerald-500" />
            <ProgressBar label="Preparing" count={metrics.preparing} total={metrics.total} color="bg-sky-500" />
            <ProgressBar label="Pending" count={metrics.pending} total={metrics.total} color="bg-yellow-500" />
            <ProgressBar label="Ready" count={metrics.ready} total={metrics.total} color="bg-purple-500" />
          </div>
          {metrics.total === 0 && (
            <div className="h-24 flex flex-col items-center justify-center text-center opacity-30 mt-4">
              <AlertCircle size={28} className="mb-2" />
              <p className="text-xs font-bold uppercase tracking-widest">No orders in this period</p>
            </div>
          )}
        </motion.div>

        {/* Performance Badges */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-luxury-dark/60 border border-luxury-border rounded-2xl p-6"
        >
          <div className="flex items-center space-x-2 mb-6">
            <Award size={16} className="text-luxury-gold" />
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Performance Insights</h2>
          </div>
          <div className="space-y-3">
            {[
              {
                label: 'Completion Rate',
                value: `${completionRate}%`,
                note: completionRate >= 80 ? '★ Excellent' : completionRate >= 50 ? '● Good' : '○ Needs Improvement',
                color: completionRate >= 80 ? 'text-emerald-400' : completionRate >= 50 ? 'text-yellow-400' : 'text-rose-400',
                bg: completionRate >= 80 ? 'bg-emerald-500/5 border-emerald-500/20' : completionRate >= 50 ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-rose-500/5 border-rose-500/20'
              },
              {
                label: 'Avg. Delivery Speed',
                value: metrics.avgDeliveryMins > 0 ? fmtMins(metrics.avgDeliveryMins) : 'N/A',
                note: metrics.avgDeliveryMins > 0 && metrics.avgDeliveryMins < 15 ? '★ Fast' : metrics.avgDeliveryMins < 30 ? '● Normal' : '○ Slow',
                color: metrics.avgDeliveryMins < 15 ? 'text-emerald-400' : metrics.avgDeliveryMins < 30 ? 'text-yellow-400' : 'text-rose-400',
                bg: 'bg-luxury-black/30 border-luxury-border'
              },
              {
                label: 'Paid vs Unpaid',
                value: `${metrics.paid} / ${metrics.total}`,
                note: `$${fmt(metrics.revenue)} collected`,
                color: 'text-luxury-gold',
                bg: 'bg-luxury-gold/5 border-luxury-gold/20'
              },
              {
                label: 'Tables in Service',
                value: metrics.uniqueTables.length,
                note: metrics.uniqueTables.join(', ') || 'None',
                color: 'text-sky-400',
                bg: 'bg-sky-500/5 border-sky-500/20'
              }
            ].map((insight) => (
              <div key={insight.label} className={`flex items-center justify-between p-3.5 rounded-xl border ${insight.bg}`}>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{insight.label}</p>
                  <p className={`text-xs font-bold mt-0.5 ${insight.color}`}>{insight.note}</p>
                </div>
                <span className={`text-xl font-serif font-bold ${insight.color}`}>{insight.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── TABLE PERFORMANCE ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-luxury-dark/60 border border-luxury-border rounded-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-luxury-border/50 flex items-center space-x-2">
          <TrendingUp size={16} className="text-luxury-gold" />
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Table Activity & Revenue</h2>
        </div>

        {tableBreakdown.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center opacity-30">
            <Table2 size={36} className="mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest">No table activity in this period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead>
                <tr className="bg-luxury-gray/10 text-[10px] uppercase tracking-[0.18em] text-luxury-textDim">
                  <th className="p-4 font-bold">#</th>
                  <th className="p-4 font-bold">Table</th>
                  <th className="p-4 font-bold">Orders</th>
                  <th className="p-4 font-bold text-right">Revenue</th>
                  <th className="p-4 font-bold text-right">Avg / Order</th>
                </tr>
              </thead>
              <tbody>
                {tableBreakdown.map((t, i) => (
                  <tr key={t.tableId} className="border-t border-luxury-border/30 hover:bg-luxury-gray/10 transition-colors">
                    <td className="p-4 text-luxury-textDim text-xs font-bold">#{i + 1}</td>
                    <td className="p-4">
                      <span className="text-lg font-serif font-bold text-white">Table {t.tableId}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-1.5 bg-luxury-border/40 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-luxury-gold rounded-full"
                            style={{ width: `${Math.min(100, (t.orders / (tableBreakdown[0]?.orders || 1)) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-white">{t.orders}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-serif font-bold text-luxury-gold text-lg">
                      {fmt(t.revenue)}
                    </td>
                    <td className="p-4 text-right text-xs text-luxury-textDim font-bold">
                      {t.orders > 0 ? fmt(t.revenue / t.orders) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ── RECENT ACTIVITY LOG ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-luxury-dark/60 border border-luxury-border rounded-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-luxury-border/50 flex items-center space-x-2">
          <Calendar size={16} className="text-luxury-gold" />
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Recent Order Activity</h2>
        </div>
        <div className="divide-y divide-luxury-border/30 max-h-80 overflow-y-auto custom-scrollbar">
          {relevantOrders.slice(0, 20).map((order) => (
            <div key={order.id} className="p-4 flex items-center justify-between hover:bg-luxury-gray/5 transition-colors">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${order.status === 'DELIVERED' ? 'bg-emerald-500' :
                    order.status === 'READY' ? 'bg-purple-500' :
                      order.status === 'PREPARING' ? 'bg-sky-500 animate-pulse' :
                        'bg-yellow-500 animate-pulse'
                  }`} />
                <div>
                  <p className="text-xs font-bold text-white">
                    Table {order.sourceId}
                    <span className="text-luxury-textDim font-normal ml-2">#{order.id.slice(-6).toUpperCase()}</span>
                  </p>
                  <p className="text-[10px] text-luxury-textDim mt-0.5">
                    {new Date(order.createdAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {order.items?.length || 0} items
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-serif font-bold text-luxury-gold">{fmt(order.totalPrice)}</p>
                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${order.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' :
                    order.paymentStatus === 'PARTIAL' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-rose-500/10 text-rose-400'
                  }`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          ))}
          {relevantOrders.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center opacity-30 text-center">
              <Zap size={28} className="mb-2" />
              <p className="text-xs font-bold uppercase tracking-widest">No recent activity</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
