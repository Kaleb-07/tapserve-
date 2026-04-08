import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import {
  DollarSign,
  MapPin,
  Coffee,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Hotel,
  Smartphone,
  FileText,
  ShoppingBag,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const getLocalFormattedDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getISOWeekStr = (d: Date) => {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNumber = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
};

export const ReportsPage: React.FC = () => {
  const { orders, categories, items, fetchCategories, fetchItems, settings } = useStore();
  
  const today = new Date();
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dateSelection, setDateSelection] = useState<string>(getLocalFormattedDate(today));
  const [weekSelection, setWeekSelection] = useState<string>(getISOWeekStr(today));
  const [monthSelection, setMonthSelection] = useState<string>(getLocalFormattedDate(today).slice(0, 7));
  
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchItems();
  }, [fetchCategories, fetchItems]);

  const restaurantName = settings?.hotelName || 'NORA LUXE';

  const currentSelectionValue = 
    timeRange === 'daily' ? dateSelection 
    : (timeRange === 'weekly' ? weekSelection : monthSelection);

  // Filter orders based on time range
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      if (timeRange === 'daily') {
        return getLocalFormattedDate(orderDate) === dateSelection;
      } else if (timeRange === 'weekly') {
        return getISOWeekStr(orderDate) === weekSelection;
      } else {
        return getLocalFormattedDate(orderDate).slice(0, 7) === monthSelection;
      }
    });
  }, [orders, timeRange, dateSelection, weekSelection, monthSelection]);

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
    link.setAttribute("download", `Financial_Report_${currentSelectionValue}_${new Date().toISOString().slice(0, 10)}.csv`);
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

      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const cost = (item.costPriceAtOrder || 0) * (item.quantity || 1);
          totalCost += cost;
        });
      }
    });

    const netProfit = revenue - totalCost;
    const avgValue = count > 0 ? revenue / count : 0;

    const itemCounts: Record<string, { name: string, count: number }> = {};
    filteredOrders.forEach(o => {
      o.items?.forEach((oi: any) => {
        const name = oi.menuItem?.name || 'Unknown';
        if (!itemCounts[name]) itemCounts[name] = { name, count: 0 };
        itemCounts[name].count += oi.quantity || 1;
      });
    });

    const topItem = Object.values(itemCounts).sort((a, b) => b.count - a.count)[0]?.name || 'N/A';

    const sources = {
      TABLE: filteredOrders.filter(o => o.sourceType === 'TABLE').length,
      ROOM: filteredOrders.filter(o => o.sourceType === 'ROOM').length,
      OTHER: filteredOrders.filter(o => !['TABLE', 'ROOM'].includes(o.sourceType)).length
    };

    return { revenue, totalCost, netProfit, count, avgValue, sources, topItem };
  }, [filteredOrders]);

  // ─── PDF HELPERS ───────────────────────────────────────────────
  const addPdfHeader = (doc: jsPDF, title: string, subtitle: string) => {
    const pageW = doc.internal.pageSize.getWidth();
    // Gold header bar
    doc.setFillColor(212, 175, 55);
    doc.rect(0, 0, pageW, 38, 'F');
    // Restaurant name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(restaurantName.toUpperCase(), 14, 16);
    // Report title
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(title, 14, 24);
    // Date
    doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleString()}  |  Period: ${currentSelectionValue.toUpperCase()}`, 14, 32);
    // Subtitle on right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(subtitle, pageW - 14, 24, { align: 'right' });
  };

  const addPdfFooter = (doc: jsPDF) => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'normal');
      doc.text(`${restaurantName} — Confidential Report`, 14, pageH - 8);
      doc.text(`Page ${i} of ${pageCount}`, pageW - 14, pageH - 8, { align: 'right' });
      // Gold footer line
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.5);
      doc.line(14, pageH - 12, pageW - 14, pageH - 12);
    }
  };

  // ─── MENU REPORT ───────────────────────────────────────────────
  const generateMenuReport = async () => {
    setGenerating('menu');
    await new Promise(r => setTimeout(r, 300));
    try {
      const doc = new jsPDF();
      const totalItems = items.length;
      const inStockCount = items.filter(i => i.inStock !== false).length;
      const avgPrice = totalItems > 0 ? items.reduce((s, i) => s + i.price, 0) / totalItems : 0;

      addPdfHeader(doc, 'MENU INVENTORY REPORT', `${totalItems} Items`);

      // Summary cards
      let yPos = 48;
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(14, yPos, 55, 18, 3, 3, 'F');
      doc.roundedRect(75, yPos, 55, 18, 3, 3, 'F');
      doc.roundedRect(136, yPos, 55, 18, 3, 3, 'F');

      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.setFont('helvetica', 'normal');
      doc.text('TOTAL ITEMS', 18, yPos + 6);
      doc.text('IN STOCK', 79, yPos + 6);
      doc.text('AVG. PRICE', 140, yPos + 6);

      doc.setFontSize(14);
      doc.setTextColor(30, 30, 30);
      doc.setFont('helvetica', 'bold');
      doc.text(String(totalItems), 18, yPos + 14);
      doc.text(String(inStockCount), 79, yPos + 14);
      doc.text(`$${avgPrice.toFixed(2)}`, 140, yPos + 14);

      yPos += 26;

      // Group items by category
      if (categories.length > 0) {
        categories.forEach(cat => {
          if (cat.items && cat.items.length > 0) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(212, 175, 55);
            doc.text(`${cat.name.toUpperCase()} (${cat.mealType})`, 14, yPos);
            yPos += 2;

            autoTable(doc, {
              startY: yPos,
              head: [['#', 'Item Name', 'Description', 'Price', 'Stock']],
              body: cat.items.map((item, i) => [
                String(i + 1),
                item.name,
                (item.description || '—').substring(0, 60),
                `$${item.price.toFixed(2)}`,
                item.inStock !== false ? 'In Stock' : 'Out'
              ]),
              theme: 'grid',
              headStyles: { fillColor: [30, 30, 30], textColor: [212, 175, 55], fontSize: 7, fontStyle: 'bold', cellPadding: 3 },
              bodyStyles: { fontSize: 7, cellPadding: 3 },
              alternateRowStyles: { fillColor: [248, 248, 248] },
              columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 40, fontStyle: 'bold' },
                2: { cellWidth: 80 },
                3: { cellWidth: 25, halign: 'right' },
                4: { cellWidth: 20, halign: 'center' },
              },
              margin: { left: 14, right: 14 },
            });
            yPos = (doc as any).lastAutoTable.finalY + 10;
          }
        });
      } else {
        // Flat list
        autoTable(doc, {
          startY: yPos,
          head: [['#', 'Item Name', 'Description', 'Price', 'Stock']],
          body: items.map((item, i) => [
            String(i + 1),
            item.name,
            (item.description || '—').substring(0, 60),
            `$${item.price.toFixed(2)}`,
            item.inStock !== false ? 'In Stock' : 'Out'
          ]),
          theme: 'grid',
          headStyles: { fillColor: [30, 30, 30], textColor: [212, 175, 55], fontSize: 7, fontStyle: 'bold', cellPadding: 3 },
          bodyStyles: { fontSize: 7, cellPadding: 3 },
          alternateRowStyles: { fillColor: [248, 248, 248] },
          margin: { left: 14, right: 14 },
        });
      }

      addPdfFooter(doc);
      doc.save(`Menu_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setGenerating(null);
    }
  };

  // ─── ORDER REPORT ──────────────────────────────────────────────
  const generateOrderReport = async () => {
    setGenerating('order');
    await new Promise(r => setTimeout(r, 300));
    try {
      const doc = new jsPDF('landscape');
      const totalRev = filteredOrders.reduce((s, o) => s + o.totalPrice, 0);

      addPdfHeader(doc, 'ORDER TRANSACTION REPORT', `${filteredOrders.length} Orders  |  $${totalRev.toFixed(2)} Revenue`);

      // Summary row
      let yPos = 48;
      const pending = filteredOrders.filter(o => o.status === 'PENDING').length;
      const preparing = filteredOrders.filter(o => o.status === 'PREPARING').length;
      const ready = filteredOrders.filter(o => o.status === 'READY').length;
      const delivered = filteredOrders.filter(o => o.status === 'DELIVERED').length;

      doc.setFillColor(245, 245, 245);
      doc.roundedRect(14, yPos, 60, 18, 3, 3, 'F');
      doc.roundedRect(80, yPos, 60, 18, 3, 3, 'F');
      doc.roundedRect(146, yPos, 60, 18, 3, 3, 'F');
      doc.roundedRect(212, yPos, 60, 18, 3, 3, 'F');

      const statCards = [
        { label: 'PENDING', value: pending, x: 18 },
        { label: 'PREPARING', value: preparing, x: 84 },
        { label: 'READY', value: ready, x: 150 },
        { label: 'DELIVERED', value: delivered, x: 216 },
      ];
      statCards.forEach(s => {
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.setFont('helvetica', 'normal');
        doc.text(s.label, s.x, yPos + 6);
        doc.setFontSize(14);
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'bold');
        doc.text(String(s.value), s.x, yPos + 14);
      });

      yPos += 26;

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Order Ref', 'Date & Time', 'Source', 'Location', 'Meal', 'Items', 'Total', 'Status', 'Payment']],
        body: filteredOrders.map((order, i) => {
          const itemNames = order.items?.map((oi: any) => `${oi.menuItem?.name || 'Item'} x${oi.quantity || 1}`).join(', ') || '—';
          return [
            String(i + 1),
            `#${order.id.slice(-6).toUpperCase()}`,
            new Date(order.createdAt).toLocaleString(),
            order.sourceType,
            order.sourceId || '—',
            order.mealType || 'ALL',
            itemNames.substring(0, 50),
            `$${order.totalPrice.toFixed(2)}`,
            order.status,
            order.paymentStatus,
          ];
        }),
        theme: 'grid',
        headStyles: { fillColor: [30, 30, 30], textColor: [212, 175, 55], fontSize: 6.5, fontStyle: 'bold', cellPadding: 2.5 },
        bodyStyles: { fontSize: 6.5, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 20, fontStyle: 'bold' },
          6: { cellWidth: 50 },
          7: { halign: 'right' },
        },
        margin: { left: 14, right: 14 },
      });

      addPdfFooter(doc);
      doc.save(`Order_Report_${currentSelectionValue}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setGenerating(null);
    }
  };

  // ─── FINANCE REPORT ────────────────────────────────────────────
  const generateFinanceReport = async () => {
    setGenerating('finance');
    await new Promise(r => setTimeout(r, 300));
    try {
      const doc = new jsPDF();

      addPdfHeader(doc, 'FINANCIAL SUMMARY REPORT', `$${metrics.revenue.toFixed(2)} Revenue`);

      let yPos = 48;

      // Revenue summary cards
      const summaryData = [
        { label: 'GROSS REVENUE', value: `$${metrics.revenue.toFixed(2)}` },
        { label: 'TOTAL COST', value: `$${metrics.totalCost.toFixed(2)}` },
        { label: 'NET PROFIT', value: `$${metrics.netProfit.toFixed(2)}` },
        { label: 'PROFIT MARGIN', value: `${metrics.revenue > 0 ? ((metrics.netProfit / metrics.revenue) * 100).toFixed(1) : 0}%` },
        { label: 'TOTAL ORDERS', value: String(metrics.count) },
        { label: 'AVG ORDER VALUE', value: `$${metrics.avgValue.toFixed(2)}` },
      ];

      // 3x2 grid of summary boxes
      summaryData.forEach((item, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = 14 + col * 62;
        const y = yPos + row * 24;
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(x, y, 56, 20, 3, 3, 'F');
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.setFont('helvetica', 'normal');
        doc.text(item.label, x + 4, y + 7);
        doc.setFontSize(14);
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'bold');
        doc.text(item.value, x + 4, y + 16);
      });

      yPos += 58;

      // Order Distribution
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(212, 175, 55);
      doc.text('ORDER DISTRIBUTION', 14, yPos);
      yPos += 2;

      autoTable(doc, {
        startY: yPos,
        head: [['Source Type', 'Order Count', 'Percentage']],
        body: [
          ['Table Service', String(metrics.sources.TABLE), `${metrics.count > 0 ? ((metrics.sources.TABLE / metrics.count) * 100).toFixed(1) : 0}%`],
          ['Room Delivery', String(metrics.sources.ROOM), `${metrics.count > 0 ? ((metrics.sources.ROOM / metrics.count) * 100).toFixed(1) : 0}%`],
          ['Digital / Other', String(metrics.sources.OTHER), `${metrics.count > 0 ? ((metrics.sources.OTHER / metrics.count) * 100).toFixed(1) : 0}%`],
          ['TOTAL', String(metrics.count), '100%'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [30, 30, 30], textColor: [212, 175, 55], fontSize: 8, fontStyle: 'bold', cellPadding: 4 },
        bodyStyles: { fontSize: 8, cellPadding: 4 },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: 'bold' },
          1: { cellWidth: 50, halign: 'center' },
          2: { cellWidth: 50, halign: 'center' },
        },
        margin: { left: 14, right: 14 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 12;

      // Payment Methods
      const paymentMethods: Record<string, { count: number, total: number }> = {};
      filteredOrders.forEach(o => {
        const items_arr = o.items || [];
        const method = (items_arr[0] as any)?.paymentMethod || 'CASH';
        if (!paymentMethods[method]) paymentMethods[method] = { count: 0, total: 0 };
        paymentMethods[method].count++;
        paymentMethods[method].total += o.totalPrice;
      });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(212, 175, 55);
      doc.text('PAYMENT BREAKDOWN', 14, yPos);
      yPos += 2;

      const paidOrders = filteredOrders.filter(o => o.paymentStatus === 'PAID');
      const unpaidOrders = filteredOrders.filter(o => o.paymentStatus === 'UNPAID');

      autoTable(doc, {
        startY: yPos,
        head: [['Payment Status', 'Order Count', 'Revenue', 'Percentage']],
        body: [
          ['Paid', String(paidOrders.length), `$${paidOrders.reduce((s, o) => s + o.totalPrice, 0).toFixed(2)}`, `${metrics.count > 0 ? ((paidOrders.length / metrics.count) * 100).toFixed(1) : 0}%`],
          ['Unpaid', String(unpaidOrders.length), `$${unpaidOrders.reduce((s, o) => s + o.totalPrice, 0).toFixed(2)}`, `${metrics.count > 0 ? ((unpaidOrders.length / metrics.count) * 100).toFixed(1) : 0}%`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [30, 30, 30], textColor: [212, 175, 55], fontSize: 8, fontStyle: 'bold', cellPadding: 4 },
        bodyStyles: { fontSize: 8, cellPadding: 4 },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        margin: { left: 14, right: 14 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 12;

      // Top selling items
      const itemCounts: Record<string, { name: string, count: number, revenue: number }> = {};
      filteredOrders.forEach(o => {
        o.items?.forEach((oi: any) => {
          const name = oi.menuItem?.name || 'Unknown';
          const price = oi.price || 0;
          const qty = oi.quantity || 1;
          if (!itemCounts[name]) itemCounts[name] = { name, count: 0, revenue: 0 };
          itemCounts[name].count += qty;
          itemCounts[name].revenue += price * qty;
        });
      });
      const topItems = Object.values(itemCounts).sort((a, b) => b.count - a.count).slice(0, 10);

      if (topItems.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(212, 175, 55);
        doc.text('TOP SELLING ITEMS', 14, yPos);
        yPos += 2;

        autoTable(doc, {
          startY: yPos,
          head: [['Rank', 'Item Name', 'Qty Sold', 'Revenue']],
          body: topItems.map((item, i) => [
            String(i + 1),
            item.name,
            String(item.count),
            `$${item.revenue.toFixed(2)}`
          ]),
          theme: 'grid',
          headStyles: { fillColor: [30, 30, 30], textColor: [212, 175, 55], fontSize: 8, fontStyle: 'bold', cellPadding: 4 },
          bodyStyles: { fontSize: 8, cellPadding: 4 },
          alternateRowStyles: { fillColor: [248, 248, 248] },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { fontStyle: 'bold' },
            2: { cellWidth: 30, halign: 'center' },
            3: { cellWidth: 35, halign: 'right' },
          },
          margin: { left: 14, right: 14 },
        });
      }

      addPdfFooter(doc);
      doc.save(`Finance_Report_${currentSelectionValue}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setGenerating(null);
    }
  };

  const reportCards = [
    {
      id: 'menu',
      title: 'Menu Report',
      description: 'Complete menu inventory with items, prices, cost analysis, and stock status grouped by category.',
      icon: <FileText size={22} />,
      count: `${items.length} Items · ${categories.length} Categories`,
      action: generateMenuReport,
      gradient: 'from-amber-900/20 to-yellow-900/10',
    },
    {
      id: 'order',
      title: 'Order Report',
      description: 'Detailed transaction log with order references, item breakdowns, source tracking, and status.',
      icon: <ShoppingBag size={22} />,
      count: `${filteredOrders.length} Orders · ${currentSelectionValue}`,
      action: generateOrderReport,
      gradient: 'from-emerald-900/20 to-teal-900/10',
    },
    {
      id: 'finance',
      title: 'Finance Report',
      description: 'Revenue summary, profit margins, cost breakdown, payment analysis, and top selling items.',
      icon: <TrendingUp size={22} />,
      count: `$${metrics.revenue.toFixed(2)} Revenue · ${currentSelectionValue}`,
      action: generateFinanceReport,
      gradient: 'from-blue-900/20 to-indigo-900/10',
    },
  ];

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

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3 bg-luxury-dark/40 p-1.5 rounded-[1.25rem] border border-luxury-border/50">
            {(['daily', 'weekly', 'monthly'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${timeRange === range
                    ? 'bg-luxury-gold text-black shadow-lg shadow-luxury-gold/30'
                    : 'text-luxury-textDim hover:text-luxury-text'
                  }`}
              >
                {range}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-luxury-dark/60 border border-luxury-border/30 rounded-xl px-4 py-2">
            <span className="text-[10px] text-luxury-textDim uppercase tracking-widest font-bold">Select: </span>
            {timeRange === 'daily' && (
              <input type="date" value={dateSelection} onChange={(e) => setDateSelection(e.target.value)} className="bg-transparent text-luxury-gold text-xs font-mono outline-none cursor-pointer" />
            )}
            {timeRange === 'weekly' && (
              <input type="week" value={weekSelection} onChange={(e) => setWeekSelection(e.target.value)} className="bg-transparent text-luxury-gold text-xs font-mono outline-none cursor-pointer" />
            )}
            {timeRange === 'monthly' && (
              <input type="month" value={monthSelection} onChange={(e) => setMonthSelection(e.target.value)} className="bg-transparent text-luxury-gold text-xs font-mono outline-none cursor-pointer" />
            )}
          </div>
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
            <h3 className="text-lg font-serif font-bold text-luxury-text uppercase tracking-widest text-sm">Order Distribution</h3>
            <MapPin size={18} className="text-luxury-gold opacity-50" />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center space-y-10">
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
              <h3 className="text-lg font-serif font-bold text-luxury-text uppercase tracking-widest text-sm">Revenue Flux</h3>
              <p className="text-[10px] text-luxury-textDim mt-1 uppercase tracking-widest">Latest transaction details</p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-luxury-gray/10 rounded-xl text-luxury-gold hover:bg-luxury-gold/10 transition-all text-[10px] font-bold uppercase tracking-widest border border-luxury-gold/10"
            >
              <Download size={14} /> Export CSV
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
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border ${order.status === 'READY'
                          ? 'border-green-500/30 text-green-500 bg-green-500/5'
                          : 'border-luxury-gold/30 text-luxury-gold bg-luxury-gold/5'
                        }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 text-right font-serif font-bold text-luxury-text italic">
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

      {/* ── REPORTS CENTER ── */}
      <div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-luxury-text font-serif tracking-tight">Reports Center</h2>
            <p className="text-luxury-textDim mt-1 text-sm">
              Download professional PDF reports for <span className="text-luxury-gold font-bold">menu, orders, and finance</span>
            </p>
          </div>

          {/* Removed the header filter to place it before the download button */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reportCards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              className={`relative overflow-hidden card-luxury rounded-[2rem] p-6 flex flex-col shadow-lg hover:shadow-luxury-gold/10 transition-all duration-300`}
            >
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} pointer-events-none`} />

              <div className="relative z-10 flex flex-col flex-1">
                {/* Icon + Title */}
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-luxury-gold/10 border border-luxury-gold/20 rounded-2xl text-luxury-gold">
                    {card.icon}
                  </div>
                </div>

                <h3 className="text-lg font-serif font-bold text-luxury-text mb-2">{card.title}</h3>
                <p className="text-xs text-luxury-textDim leading-relaxed flex-1 mb-4">{card.description}</p>

                {/* Data count */}
                <p className="text-[10px] font-bold uppercase tracking-widest text-luxury-gold/70 mb-4">{card.count}</p>

                {card.id !== 'menu' && (
                  <div className="flex flex-col gap-2 mb-4 mt-auto">
                    <div className="flex items-center gap-1 bg-luxury-gray/20 p-1 rounded-xl border border-luxury-border w-full">
                      {(['daily', 'weekly', 'monthly'] as const).map(range => (
                        <button
                          key={`${card.id}-${range}`}
                          onClick={() => setTimeRange(range)}
                          className={`flex-1 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all ${
                            timeRange === range
                              ? 'bg-luxury-gold text-black shadow-md shadow-luxury-gold/10'
                              : 'text-luxury-textDim hover:text-luxury-text'
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                    <div className="bg-luxury-gray/20 rounded-xl border border-luxury-border px-3 py-2 flex items-center justify-between">
                       <span className="text-[10px] text-luxury-textDim uppercase font-bold tracking-widest">Select:</span>
                       {timeRange === 'daily' && (
                         <input type="date" value={dateSelection} onChange={(e) => setDateSelection(e.target.value)} className="bg-transparent text-luxury-gold text-xs font-mono outline-none cursor-pointer w-[120px]" />
                       )}
                       {timeRange === 'weekly' && (
                         <input type="week" value={weekSelection} onChange={(e) => setWeekSelection(e.target.value)} className="bg-transparent text-luxury-gold text-xs font-mono outline-none cursor-pointer w-[120px]" />
                       )}
                       {timeRange === 'monthly' && (
                         <input type="month" value={monthSelection} onChange={(e) => setMonthSelection(e.target.value)} className="bg-transparent text-luxury-gold text-xs font-mono outline-none cursor-pointer w-[120px]" />
                       )}
                    </div>
                  </div>
                )}
                {card.id === 'menu' && <div className="mt-auto" />}

                {/* Download button */}
                <button
                  onClick={card.action}
                  disabled={generating !== null}
                  className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl font-bold uppercase tracking-[0.15em] text-[11px] transition-all border-b-2 border-black/10 shadow-lg disabled:opacity-50 bg-luxury-gold text-black hover:bg-[#f1d592] active:scale-95 shadow-luxury-gold/20"
                >
                  {generating === card.id ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download size={15} />
                      Download PDF
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
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
          background: var(--glass-card-bg, linear-gradient(180deg, rgba(20,20,20,0.4) 0%, rgba(10,10,10,0.6) 100%));
          backdrop-filter: blur(10px);
        }
        :root .dark .glass-card {
          --glass-card-bg: linear-gradient(180deg, rgba(20,20,20,0.4) 0%, rgba(10,10,10,0.6) 100%);
        }
        :root:not(.dark) .glass-card {
          --glass-card-bg: linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(245,245,245,0.9) 100%);
        }
      `}</style>
    </div>
  );
};

const MetricCard: React.FC<{ label: string, value: string, icon: React.ReactNode, trend: string, trendDir: 'up' | 'down' }> = ({ label, value, icon, trend, trendDir }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="card-luxury p-6 rounded-[2rem] flex flex-col justify-between h-full shadow-lg hover:shadow-luxury-gold/10 transition-all duration-300 pointer-events-auto"
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
      <h3 className="text-3xl font-serif font-bold text-luxury-text tracking-tighter leading-tight italic">{value}</h3>
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
    <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
);
