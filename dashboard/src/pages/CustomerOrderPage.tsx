import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UtensilsCrossed, Plus, Minus, CheckCircle, Sun, Moon, ShoppingCart, X, ChevronRight, ChevronLeft } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL as string;

interface MenuItem { id: string; name: string; description?: string; price: number; image?: string; ingredients?: string; categoryId: string; inStock?: boolean; }
interface Category { id: string; name: string; items: MenuItem[]; }
interface CartItem extends MenuItem { cartId: string; quantity: number; excludedIngredients: string[]; specialInstructions?: string; categoryName: string; }

const MEAL_TIMES: Record<string, string> = { BREAKFAST: '5 AM – 11 AM', LUNCH: '11 AM – 5 PM', DINNER: '5 PM – 12 AM' };

const getGreeting = (mealType: string) => {
  if (mealType === 'BREAKFAST') return 'Good Morning';
  if (mealType === 'LUNCH') return 'Good Afternoon';
  return 'Good Evening';
};

const getInitialMealType = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return 'BREAKFAST';
  if (h >= 11 && h < 17) return 'LUNCH';
  return 'DINNER';
};

const th = (dark: boolean) => ({
  bg:          dark ? 'bg-[#0a0a0a]'                        : 'bg-[#f5f0e8]',
  header:      dark ? 'bg-[#111111] border-[#1f1f1f]'       : 'bg-white border-[#e0d5be]',
  divider:     dark ? 'border-[#1f1f1f]'                    : 'border-[#e0d5be]',
  card:        dark ? 'bg-[#111111] border-[#1f1f1f]'       : 'bg-white border-[#e0d5be]',
  cardInner:   dark ? 'bg-[#1a1a1a]'                        : 'bg-[#f0e8d5]',
  cartItem:    dark ? 'bg-[#1a1a1a] border-[#1f1f1f]'       : 'bg-[#faf6ee] border-[#e0d5be]',
  drawer:      dark ? 'bg-[#111111]'                        : 'bg-white',
  modal:       dark ? 'bg-[#111111] border-[#1f1f1f]'       : 'bg-white border-[#e0d5be]',
  text:        dark ? 'text-[#e5e5e5]'                      : 'text-[#2a1f0e]',
  muted:       dark ? 'text-[#888888]'                      : 'text-[#8a7560]',
  input:       dark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-[#e5e5e5] placeholder-[#555]' : 'bg-[#f0e8d5] border-[#d4c4a0] text-[#2a1f0e] placeholder-[#a89070]',
  pillOff:     dark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-[#999] hover:border-[#d4af37]/50' : 'bg-white border-[#d4c4a0] text-[#8a7560] hover:border-[#d4af37]',
  pillOn:      'bg-[#d4af37] border-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20',
  btnHover:    dark ? 'hover:bg-[#2a2a2a]'                  : 'hover:bg-[#e8dfc8]',
  iconMuted:   dark ? 'text-[#888888]'                      : 'text-[#8a7560]',
  border:      dark ? 'border-[#2a2a2a]'                    : 'border-[#d4c4a0]',
  locBg:       dark ? 'bg-[#d4af37]/10 border-[#d4af37]/30' : 'bg-[#d4af37]/10 border-[#d4af37]/40',
  ingOff:      dark ? 'border-[#2a2a2a] bg-transparent'     : 'border-[#d4c4a0] bg-transparent',
  ingOn:       dark ? 'border-[#d4af37]/30 bg-[#d4af37]/5'  : 'border-[#d4af37]/40 bg-[#d4af37]/8',
  cashBox:     dark ? 'border-[#d4af37]/30 bg-[#d4af37]/5'  : 'border-[#d4af37]/40 bg-[#d4af37]/8',
  totalBox:    dark ? 'bg-[#1a1a1a] border-[#1f1f1f]'       : 'bg-[#f0e8d5] border-[#e0d5be]',
  successCard: dark ? 'bg-[#111111] border-[#d4af37]/30'    : 'bg-white border-[#d4af37]/40',
  successInner:dark ? 'bg-[#1a1a1a] border-[#1f1f1f]'       : 'bg-[#f5f0e8] border-[#e0d5be]',
});

const ImageCarousel: React.FC<{ images: string[]; t: any; height: string; rounded?: string }> = ({ images, t, height, rounded = "" }) => {
  const [idx, setIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (images.length <= 1 || isPaused) return;
    const itv = setInterval(() => setIdx(p => (p + 1) % images.length), 4000);
    return () => clearInterval(itv);
  }, [images.length, isPaused]);
  
  if (images.length === 0) return <div className={`w-full ${height} flex items-center justify-center ${t.cardInner} ${rounded}`}><UtensilsCrossed size={48} className="opacity-20" /></div>;
  
  return (
    <div className={`relative w-full ${height} overflow-hidden ${t.cardInner} ${rounded}`} onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
      <motion.img key={idx} src={images[idx]} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
        className="w-full h-full object-cover transition-transform hover:scale-110 duration-700" />
      
      {images.length > 1 && (
        <>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                className={`h-1 rounded-full transition-all ${i === idx ? 'bg-[#d4af37] w-6' : 'bg-white/40 w-2'}`} />
            ))}
          </div>
          <button onClick={(e) => { e.stopPropagation(); setIdx(p => (p - 1 + images.length) % images.length); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronLeft size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIdx(p => (p + 1) % images.length); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight size={16} />
          </button>
        </>
      )}
    </div>
  );
};

export const CustomerOrderPage: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(() => localStorage.getItem('customer_theme') === 'dark');
  const t = th(isDark);
  const toggleTheme = () => { const n = !isDark; setIsDark(n); localStorage.setItem('customer_theme', n ? 'dark' : 'light'); };

  const [restaurantName, setRestaurantName] = useState(() => localStorage.getItem('customer_restaurant_name') || 'Our Restaurant');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMealType, setActiveMealType] = useState(getInitialMealType());
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [gridView, setGridView] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sourceType, setSourceType] = useState('Table');
  const [sourceId, setSourceId] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes] = useState('');
  const [customizingItem, setCustomizingItem] = useState<(MenuItem & { categoryName: string }) | null>(null);
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [itemInstructions, setItemInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [isAutoLocation, setIsAutoLocation] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'CARD' | 'ROOM' | 'CASH'>('CASH');
  const [paymentDetails, setPaymentDetails] = useState({ cardNumber: '', expiry: '', cvc: '', roomNumber: '', guestName: '' });

  useEffect(() => {
    axios.get(`${API_URL}/settings`).then(r => { 
      if (r.data?.restaurantName) {
        setRestaurantName(r.data.restaurantName);
        localStorage.setItem('customer_restaurant_name', r.data.restaurantName);
      } 
    }).catch(() => {});
    const p = new URLSearchParams(window.location.search);
    const type = p.get('type'); const id = p.get('id');
    if (type && id) { setSourceType(type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()); setSourceId(id); setIsAutoLocation(true); }
  }, []);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_URL}/categories?mealType=${activeMealType}`).then(r => setCategories(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [activeMealType]);

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const visibleItems = () => {
    let items: (MenuItem & { categoryName: string })[] = [];
    if (activeCategory === 'all') items = categories.flatMap(c => c.items.map(i => ({ ...i, categoryName: c.name })));
    else { const cat = categories.find(c => c.id === activeCategory); if (cat) items = cat.items.map(i => ({ ...i, categoryName: cat.name })); }
    return items.filter(i => i.inStock !== false).filter(i =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) || (i.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const addToCart = (item: MenuItem & { categoryName: string }, excluded: string[] = [], instructions = '') => {
    const key = item.id + JSON.stringify(excluded) + instructions;
    const existing = cart.find(c => c.id + JSON.stringify(c.excludedIngredients) + (c.specialInstructions || '') === key);
    if (existing) setCart(prev => prev.map(c => c.cartId === existing.cartId ? { ...c, quantity: c.quantity + 1 } : c));
    else setCart(prev => [...prev, { ...item, cartId: Math.random().toString(36).substr(2, 9), quantity: 1, excludedIngredients: excluded, specialInstructions: instructions }]);
  };

  const updateQty = (cartId: string, delta: number) => setCart(prev => prev.flatMap(c => { if (c.cartId !== cartId) return [c]; const n = c.quantity + delta; return n <= 0 ? [] : [{ ...c, quantity: n }]; }));
  const removeFromCart = (cartId: string) => setCart(prev => prev.filter(c => c.cartId !== cartId));
  const toggleIngredient = (name: string) => setExcludedIngredients(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]);
  const openCustomizer = (item: MenuItem & { categoryName: string }) => { setCustomizingItem(item); setExcludedIngredients([]); setItemInstructions(''); };
  const confirmCustomizer = () => { if (customizingItem) addToCart(customizingItem, excludedIngredients, itemInstructions); setCustomizingItem(null); setExcludedIngredients([]); setItemInstructions(''); };

  const handleSubmit = () => {
    if (sourceType !== 'Outsource' && !sourceId.trim()) { setError('Please specify your table, room, or suite number.'); return; }
    if (sourceType === 'Outsource' && !customerPhone.trim()) { setError('Please enter your phone number.'); return; }
    if (cart.length === 0) { setError('Your cart is empty.'); return; }
    setIsPaymentModalOpen(true);
  };

  const handleFinalSubmit = async () => {
    setError(null); setIsSubmitting(true); setIsPaymentModalOpen(false);
    try {
      const res = await axios.post(`${API_URL}/orders`, {
        sourceType, sourceId: selectedMethod === 'ROOM' ? (paymentDetails.roomNumber || sourceId) : sourceId,
        mealType: activeMealType, paymentMethod: selectedMethod,
        items: cart.map(i => ({ menuItemId: i.id, quantity: i.quantity, price: i.price, customizations: (i.excludedIngredients.length > 0 || i.specialInstructions) ? JSON.stringify({ Excluded: i.excludedIngredients, Instructions: i.specialInstructions || null }) : null })),
        totalPrice: cartTotal, notes: orderNotes + (selectedMethod === 'ROOM' ? ` | Room guest: ${paymentDetails.guestName}` : ''),
      });
      setOrderSuccess(res.data.id); setCart([]); setIsCartOpen(false);
    } catch { setError('Failed to place order. Please try again.'); } finally { setIsSubmitting(false); }
  };

  const handleNewOrder = () => { setCart([]); setSourceId(''); setSourceType('Table'); setCustomerPhone(''); setSearchTerm(''); setActiveCategory('all'); setError(null); setOrderSuccess(null); };
  const getItemImages = (image?: string): string[] => { if (!image) return []; try { const p = JSON.parse(image); return Array.isArray(p) ? p : [image]; } catch { return [image]; } };

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${t.bg}`}>
      <div className="w-16 h-16 rounded-full border-2 border-[#d4af37]/30 border-t-[#d4af37] animate-spin" />
    </div>
  );

  const items = visibleItems();
  const currentCatName = activeCategory === 'all' ? `All ${activeMealType.charAt(0) + activeMealType.slice(1).toLowerCase()}` : categories.find(c => c.id === activeCategory)?.name || '';

  return (
    <div className={`min-h-screen ${t.bg} font-sans`}>

      {/* ── HEADER ── */}
      <header className={`sticky top-0 z-30 border-b ${t.header} shadow-sm`}>

        {/* 1. Greeting + Restaurant name */}
        <div className="relative flex items-center justify-center py-3 px-4">
          <div className="text-center">
            <p className="text-xs italic text-[#d4af37] font-medium">{getGreeting(activeMealType)}</p>
            <h1 className={`text-xl font-extrabold tracking-wide font-serif uppercase ${t.text}`}>{restaurantName}</h1>
          </div>
          <div className="absolute right-4 flex items-center gap-2">
            <button onClick={toggleTheme} className={`p-2 rounded-full border ${t.border} ${t.iconMuted} hover:text-[#d4af37] transition-all`}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 rounded-full bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/30">
              <ShoppingCart size={16} />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{cartCount}</span>}
            </button>
          </div>
        </div>

        {/* 2. Meal tabs */}
        <div className={`flex border-b ${t.divider}`}>
          {(['BREAKFAST', 'LUNCH', 'DINNER'] as const).map(mt => (
            <button key={mt} onClick={() => { setActiveMealType(mt); setActiveCategory('all'); }}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeMealType === mt ? 'border-[#d4af37] text-[#d4af37]' : `border-transparent ${t.muted} hover:text-[#d4af37]`}`}>
              {mt}
              <span className={`block text-[9px] font-normal mt-0.5 ${activeMealType === mt ? 'text-[#d4af37]/70' : t.muted}`}>{MEAL_TIMES[mt]}</span>
            </button>
          ))}
        </div>

        {/* 3. Category pills */}
        <div className="px-4 pb-2 pt-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d4af37]/60 to-[#d4af37]" />
            <span className="text-[12px] font-black font-serif tracking-[0.4em] text-[#d4af37] uppercase">Categories</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#d4af37]/60 to-[#d4af37]" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide max-w-7xl mx-auto">
            <button onClick={() => setActiveCategory('all')}
              className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${activeCategory === 'all' ? t.pillOn : t.pillOff}`}>
              <UtensilsCrossed size={18} />
              <span className="text-[9px]">All</span>
            </button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${activeCategory === cat.id ? t.pillOn : t.pillOff}`}>
                <UtensilsCrossed size={18} />
                <span className="text-[9px] max-w-[60px] truncate">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Search */}
        <div className="px-4 pb-2">
          <div className="relative max-w-2xl mx-auto">
            <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.iconMuted}`} />
            <input type="text" placeholder="Search dishes..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className={`w-full rounded-full pl-9 pr-4 py-2.5 text-sm border focus:outline-none focus:border-[#d4af37] transition-all ${t.input}`} />
          </div>
        </div>
      </header>

      {/* ── MENU ITEMS ── */}
      <main className="px-4 py-3 pb-28 max-w-7xl mx-auto">
        {/* Title + grid/list toggle */}
        <div className="flex items-center justify-between mb-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-0.5 h-5 bg-[#d4af37] rounded-full" />
            <h2 className={`text-base font-serif tracking-[0.12em] uppercase ${t.text}`}>{searchTerm ? 'Search Results' : currentCatName}</h2>
          </div>
          <div className={`flex items-center gap-1 rounded-full border px-1 py-1 ${t.border}`}>
            <button onClick={() => setGridView(false)}
              className={`p-1.5 rounded-full transition-all ${!gridView ? 'bg-[#d4af37] text-black' : t.muted}`}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="2" width="12" height="2" rx="1" fill="currentColor"/>
                <rect x="1" y="6" width="12" height="2" rx="1" fill="currentColor"/>
                <rect x="1" y="10" width="12" height="2" rx="1" fill="currentColor"/>
              </svg>
            </button>
            <button onClick={() => setGridView(true)}
              className={`p-1.5 rounded-full transition-all ${gridView ? 'bg-[#d4af37] text-black' : t.muted}`}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1" fill="currentColor"/>
                <rect x="8" y="1" width="5" height="5" rx="1" fill="currentColor"/>
                <rect x="1" y="8" width="5" height="5" rx="1" fill="currentColor"/>
                <rect x="8" y="8" width="5" height="5" rx="1" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className={`py-20 text-center ${t.muted}`}>
            <UtensilsCrossed size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold uppercase tracking-widest opacity-40">No items found</p>
          </div>
        ) : gridView ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
            {items.map((item: any, idx: number) => {
              const cartQty = cart.filter(c => c.id === item.id).reduce((s, c) => s + c.quantity, 0);
              const images = getItemImages(item.image);
              return (
                <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className={`group flex flex-col rounded-2xl border overflow-hidden shadow-md transition-shadow hover:shadow-xl ${t.card}`}>
                  <ImageCarousel images={images} t={t} height="h-64" />
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                       <h3 className={`font-bold text-base font-serif leading-tight ${t.text}`}>{item.name}</h3>
                       <p className="text-[#d4af37] font-extrabold text-base flex-shrink-0">${item.price.toFixed(2)}</p>
                    </div>
                    {item.description && <p className={`text-xs mt-1 line-clamp-2 ${t.muted}`}>{item.description}</p>}
                    <button onClick={() => item.ingredients ? openCustomizer(item) : addToCart(item)}
                      className="mt-4 w-full py-3 rounded-xl bg-[#d4af37] text-black text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#f1d592] transition-all shadow-md shadow-[#d4af37]/20 active:scale-95 border-b-2 border-black/10">
                      <Plus size={14} />
                      ADD {cartQty > 0 && <span className="bg-black/10 px-2 py-0.5 rounded-lg ml-1">({cartQty})</span>}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {items.map((item: any, idx: number) => {
              const cartQty = cart.filter(c => c.id === item.id).reduce((s, c) => s + c.quantity, 0);
              const images = getItemImages(item.image);
              return (
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  className={`group flex items-center gap-3 p-3 rounded-2xl border shadow-sm ${t.card}`}>
                  <div className="w-28 h-28 flex-shrink-0">
                    <ImageCarousel images={images} t={t} height="h-full" rounded="rounded-xl" />
                  </div>
                  <div className="flex-1 min-w-0 pl-1">
                    <div className="flex items-start justify-between">
                      <h3 className={`font-bold text-base font-serif ${t.text} truncate`}>{item.name}</h3>
                      <p className="text-[#d4af37] font-extrabold text-sm ml-2">${item.price.toFixed(2)}</p>
                    </div>
                    {item.description && <p className={`text-xs line-clamp-2 mt-1 ${t.muted}`}>{item.description}</p>}
                    <button onClick={() => item.ingredients ? openCustomizer(item) : addToCart(item)}
                      className="mt-3 px-5 py-2 rounded-xl bg-[#d4af37] text-black text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#f1d592] transition-all shadow-md active:scale-95 border-b-2 border-black/10">
                      <Plus size={12} />
                      <span>ADD</span>
                      {cartQty > 0 && <span className="bg-black/10 px-2 py-0.5 rounded-md ml-1">({cartQty})</span>}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── FLOATING CART ── */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
          <button onClick={() => setIsCartOpen(true)} className="flex items-center gap-3 px-6 py-3 rounded-full bg-[#d4af37] text-black font-bold shadow-xl shadow-[#d4af37]/30 text-sm">
            <ShoppingCart size={16} />
            <span>{cartCount} item{cartCount > 1 ? 's' : ''}</span>
            <span className="opacity-70">·</span>
            <span>${cartTotal.toFixed(2)}</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ── CART DRAWER ── */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`fixed right-0 top-0 h-full w-full max-w-sm z-50 flex flex-col shadow-2xl ${t.drawer}`}>
              <div className={`flex items-center justify-between p-4 border-b ${t.divider}`}>
                <h2 className={`text-lg font-bold font-serif ${t.text}`}>Your Order</h2>
                <button onClick={() => setIsCartOpen(false)} className={`p-2 rounded-full ${t.btnHover}`}><X size={18} className={t.iconMuted} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className={`h-full flex flex-col items-center justify-center text-center ${t.muted}`}>
                    <ShoppingCart size={40} className="mb-3 opacity-30" />
                    <p className="text-sm font-bold opacity-40">Cart is empty</p>
                  </div>
                ) : cart.map(item => {
                  const images = getItemImages(item.image);
                  const img = images.length > 0 ? images[0] : null;
                  return (
                    <div key={item.cartId} className={`flex gap-3 p-3 rounded-xl border ${t.cartItem}`}>
                      {img && <img src={img} alt={item.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${t.text}`}>{item.name}</p>
                        <p className="text-[#d4af37] text-sm font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                        {item.excludedIngredients.length > 0 && <p className="text-[10px] text-red-400 mt-0.5">No {item.excludedIngredients.join(', ')}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button onClick={() => removeFromCart(item.cartId)} className="text-red-400 opacity-60 hover:opacity-100"><X size={14} /></button>
                        <div className={`flex items-center gap-1 rounded-full px-2 py-1 border ${t.border}`}>
                          <button onClick={() => updateQty(item.cartId, -1)} className={`w-5 h-5 flex items-center justify-center rounded-full ${t.btnHover}`}><Minus size={10} className={t.iconMuted} /></button>
                          <span className={`text-xs font-bold w-4 text-center ${t.text}`}>{item.quantity}</span>
                          <button onClick={() => updateQty(item.cartId, 1)} className="w-5 h-5 flex items-center justify-center rounded-full bg-[#d4af37] text-black"><Plus size={10} /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className={`p-4 border-t ${t.divider} ${t.drawer}`}>
                <div className="mb-4 space-y-3">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${t.muted}`}>Service Location</label>
                  {isAutoLocation ? (
                    <div className={`flex items-center gap-2 p-3 rounded-xl ${t.locBg}`}>
                      <div className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
                      <p className={`text-sm font-bold ${t.text}`}>{sourceType} {sourceId}</p>
                      <span className="ml-auto text-[9px] text-[#d4af37] font-bold uppercase">QR Active</span>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-4 gap-1">
                        {['Table', 'Room', 'VIP', 'Outsource'].map(type => (
                          <button key={type} onClick={() => setSourceType(type)}
                            className={`py-2 text-[10px] font-bold uppercase rounded-lg border transition-all ${sourceType === type ? 'bg-[#d4af37] border-[#d4af37] text-black' : `${t.border} ${t.muted}`}`}>{type}</button>
                        ))}
                      </div>
                      {sourceType === 'Outsource'
                        ? <input type="tel" placeholder="+1 234 567 890" value={customerPhone} onChange={e => { setCustomerPhone(e.target.value); setError(null); }} className={`w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:border-[#d4af37] ${t.input}`} />
                        : <input type="text" placeholder={`${sourceType} number`} value={sourceId} onChange={e => { setSourceId(e.target.value); setError(null); }} className={`w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:border-[#d4af37] ${t.input}`} />
                      }
                    </>
                  )}
                </div>
                <div className={`flex justify-between text-sm mb-3 pb-3 border-b ${t.divider}`}>
                  <span className={t.muted}>Total</span>
                  <span className={`font-bold text-lg ${t.text}`}>${cartTotal.toFixed(2)}</span>
                </div>
                {error && <p className="text-red-500 text-xs text-center mb-2 font-bold">{error}</p>}
                <button onClick={handleSubmit} disabled={cart.length === 0 || isSubmitting}
                  className="w-full py-3.5 rounded-xl font-bold uppercase tracking-widest text-sm text-black bg-[#d4af37] hover:bg-[#f1d592] disabled:opacity-50 transition-all shadow-lg shadow-[#d4af37]/20">
                  {isSubmitting ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── CUSTOMIZATION MODAL ── */}
      <AnimatePresence>
        {customizingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border ${t.modal}`}>
              <div className={`px-5 py-4 border-b ${t.divider} flex justify-between items-center`}>
                <div>
                  <h3 className={`text-lg font-bold font-serif ${t.text}`}>{customizingItem.name}</h3>
                  <p className={`text-[10px] uppercase tracking-widest mt-0.5 ${t.muted}`}>Customize Ingredients</p>
                </div>
                <button onClick={() => setCustomizingItem(null)} className={`p-2 rounded-full ${t.btnHover}`}><X size={16} className={t.iconMuted} /></button>
              </div>
              <div className="p-5 max-h-80 overflow-y-auto space-y-2">
                {customizingItem.ingredients?.split(',').map((ing: string) => {
                  const name = ing.trim(); const isExcluded = excludedIngredients.includes(name);
                  return (
                    <label key={name} onClick={() => toggleIngredient(name)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${isExcluded ? t.ingOff : t.ingOn}`}>
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all flex-shrink-0 ${isExcluded ? t.border : 'border-[#d4af37] bg-[#d4af37]'}`}>
                        {!isExcluded && <CheckCircle size={12} className="text-black" />}
                      </div>
                      <span className={`flex-1 text-sm font-bold uppercase tracking-wider ${isExcluded ? `${t.muted} line-through` : t.text}`}>{name}</span>
                      {isExcluded && <span className="text-[9px] text-red-400 font-bold uppercase">Excluded</span>}
                    </label>
                  );
                })}
                <div className={`pt-3 mt-3 border-t ${t.divider}`}>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-[#d4af37]">Special Instructions</label>
                  <textarea value={itemInstructions} onChange={e => setItemInstructions(e.target.value)} placeholder="Extra spicy, allergy notes..."
                    className={`w-full rounded-xl p-3 text-sm focus:outline-none resize-none h-20 border focus:border-[#d4af37] ${t.input}`} />
                </div>
              </div>
              <div className={`p-5 border-t ${t.divider}`}>
                <button onClick={confirmCustomizer} className="w-full py-3 rounded-xl font-bold uppercase tracking-widest text-sm text-black bg-[#d4af37] hover:bg-[#f1d592] transition-colors">Add to Order</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PAYMENT MODAL ── */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border ${t.modal}`}>
              <div className={`px-5 py-4 border-b ${t.divider} flex justify-between items-center`}>
                <h3 className={`text-lg font-bold font-serif ${t.text}`}>Payment</h3>
                <button onClick={() => setIsPaymentModalOpen(false)} className={`p-2 rounded-full ${t.btnHover}`}><X size={16} className={t.iconMuted} /></button>
              </div>
              <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-3 gap-3">
                  {[{ id: 'CARD', label: 'Credit Card' }, { id: 'ROOM', label: 'Room Charge' }, { id: 'CASH', label: 'Counter Pay' }].map(m => (
                    <button key={m.id} onClick={() => setSelectedMethod(m.id as any)}
                      className={`py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${selectedMethod === m.id ? 'bg-[#d4af37] border-[#d4af37] text-black' : `${t.border} ${t.muted}`}`}>{m.label}</button>
                  ))}
                </div>
                {selectedMethod === 'CARD' && (
                  <div className="space-y-3">
                    <input type="text" placeholder="Card number" value={paymentDetails.cardNumber} onChange={e => setPaymentDetails({...paymentDetails, cardNumber: e.target.value})} className={`w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:border-[#d4af37] ${t.input}`} />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="MM / YY" value={paymentDetails.expiry} onChange={e => setPaymentDetails({...paymentDetails, expiry: e.target.value})} className={`w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:border-[#d4af37] ${t.input}`} />
                      <input type="text" placeholder="CVC" value={paymentDetails.cvc} onChange={e => setPaymentDetails({...paymentDetails, cvc: e.target.value})} className={`w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:border-[#d4af37] ${t.input}`} />
                    </div>
                  </div>
                )}
                {selectedMethod === 'ROOM' && (
                  <div className="space-y-3">
                    <input type="text" placeholder="Guest name" value={paymentDetails.guestName} onChange={e => setPaymentDetails({...paymentDetails, guestName: e.target.value})} className={`w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:border-[#d4af37] ${t.input}`} />
                    <input type="text" placeholder="Room number" value={paymentDetails.roomNumber} onChange={e => setPaymentDetails({...paymentDetails, roomNumber: e.target.value})} className={`w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:border-[#d4af37] ${t.input}`} />
                  </div>
                )}
                {selectedMethod === 'CASH' && (
                  <div className={`text-center p-6 rounded-xl border border-dashed ${t.cashBox}`}>
                    <p className={`text-sm font-bold ${t.text}`}>Pay at the Counter</p>
                    <p className={`text-xs mt-1 ${t.muted}`}>Please proceed to reception to complete payment.</p>
                  </div>
                )}
                <div className={`flex justify-between items-center p-4 rounded-xl border ${t.totalBox}`}>
                  <span className={`text-sm ${t.muted}`}>Total</span>
                  <span className="text-xl font-extrabold text-[#d4af37]">${cartTotal.toFixed(2)}</span>
                </div>
              </div>
              <div className={`p-5 border-t ${t.divider}`}>
                <button onClick={handleFinalSubmit} className="w-full py-3.5 rounded-xl font-bold uppercase tracking-widest text-sm text-black bg-[#d4af37] hover:bg-[#f1d592] transition-colors shadow-lg shadow-[#d4af37]/20">Confirm Order</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── SUCCESS MODAL ── */}
      <AnimatePresence>
        {orderSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`w-full max-w-sm rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl border ${t.successCard}`}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 bg-[#d4af37]/10 border border-[#d4af37]/20">
                <CheckCircle size={32} className="text-[#d4af37]" />
              </div>
              <h2 className={`text-2xl font-extrabold mb-1 font-serif ${t.text}`}>Order Placed</h2>
              <p className={`text-xs mb-4 uppercase tracking-widest ${t.muted}`}>Your order is being prepared.</p>
              <div className={`w-full rounded-xl p-4 border mb-5 ${t.successInner}`}>
                <p className={`text-[10px] uppercase tracking-widest ${t.muted}`}>Reference</p>
                <p className="font-bold text-lg text-[#d4af37] tracking-widest">#{orderSuccess.slice(-6).toUpperCase()}</p>
                <div className={`h-px w-full my-3 border-t ${t.divider}`} />
                <p className={`text-[10px] uppercase tracking-widest ${t.muted}`}>{sourceType === 'Outsource' ? 'Contact' : 'Delivering to'}</p>
                <p className={`font-bold ${t.text}`}>{sourceType} {sourceType === 'Outsource' ? customerPhone : sourceId}</p>
              </div>
              <button onClick={handleNewOrder} className="w-full py-3.5 rounded-xl font-bold uppercase tracking-widest text-sm text-black bg-[#d4af37] hover:bg-[#f1d592] transition-colors">New Order</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
