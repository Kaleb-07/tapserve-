import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Plus, Minus, Search, MapPin, Home, Star, User,
  Loader2, CheckCircle, ArrowLeft, ArrowRight, UtensilsCrossed
} from 'lucide-react';
import axios from 'axios';
import { useStore } from '../store/useStore';

const API_URL = 'http://localhost:3001/api';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  ingredients?: string;
  categoryId: string;
  inStock?: boolean;
}

interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}

interface CartItem extends MenuItem {
  cartId: string;
  quantity: number;
  excludedIngredients: string[];
  specialInstructions?: string; // New field for enquiries
  categoryName: string;
}

/* ─── Design Tokens — Luxury Dark Palette ─── */
const LUXURY_BLACK = '#0a0a0a';
const LUXURY_DARK = '#121212';
const LUXURY_GOLD = '#d4af37';
const LUXURY_BORDER = '#2a2a2a';
const WHITE = '#ffffff';
const TEXT_GRAY = '#9ca3af';

const GOLD_GRADIENT = 'linear-gradient(135deg, #d4af37 0%, #f1d592 50%, #aa8d2e 100%)';

export const CustomerOrderPage: React.FC = () => {
  const { settings, fetchSettings } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sourceType, setSourceType] = useState('Table');
  const [sourceId, setSourceId] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [customizingItem, setCustomizingItem] = useState<(MenuItem & { categoryName: string }) | null>(null);
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [itemInstructions, setItemInstructions] = useState(''); // New state for enquiry text
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const categoryRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const StepIndicator = ({ currentStep }: { currentStep: number }) => (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {[1, 2, 3].map((s) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                currentStep >= s ? 'text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'text-gray-500 border border-[#2a2a2a] bg-[#1a1a1a]'
              }`}
              style={currentStep >= s ? { background: GOLD_GRADIENT } : {}}
            >
              {s}
            </div>
            <span className={`text-[9px] mt-2 uppercase tracking-widest font-bold ${currentStep >= s ? 'text-[#d4af37]' : 'text-gray-600'}`}>
              {s === 1 ? 'Menu' : s === 2 ? 'Location' : 'Review'}
            </span>
          </div>
          {s < 3 && <div className="h-[2px] w-12 bg-[#2a2a2a] mb-5" style={currentStep > s ? { background: GOLD_GRADIENT } : {}} />}
        </React.Fragment>
      ))}
    </div>
  );

  useEffect(() => {
    fetchSettings();
    axios.get(`${API_URL}/categories`).then(r => {
      setCategories(r.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const visibleItems = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return [];
    return cat.items
      .filter(i => i.inStock !== false)
      .filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   (i.description || '').toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const allVisibleItems = () =>
    categories.flatMap(c =>
      c.items
        .filter(i => i.inStock !== false)
        .filter(i =>
          i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (i.description || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map(i => ({ ...i, categoryName: c.name }))
    );

  const addToCart = (item: MenuItem & { categoryName: string }, excluded: string[] = [], instructions: string = '') => {
    const key = item.id + JSON.stringify(excluded) + instructions;
    const existing = cart.find(c => c.id + JSON.stringify(c.excludedIngredients) + (c.specialInstructions || '') === key);
    if (existing) {
      setCart(prev => prev.map(c => c.cartId === existing.cartId ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart(prev => [...prev, { ...item, cartId: Math.random().toString(36).substr(2, 9), quantity: 1, excludedIngredients: excluded, specialInstructions: instructions }]);
    }
  };

  const updateQty = (cartId: string, delta: number) => {
    setCart(prev =>
      prev.flatMap(c => {
        if (c.cartId !== cartId) return [c];
        const newQty = c.quantity + delta;
        return newQty <= 0 ? [] : [{ ...c, quantity: newQty }];
      })
    );
  };

  const removeFromCart = (cartId: string) => setCart(prev => prev.filter(c => c.cartId !== cartId));

  const toggleIngredient = (name: string) =>
    setExcludedIngredients(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]);

  const openCustomizer = (item: MenuItem & { categoryName: string }) => {
    setCustomizingItem(item);
    setExcludedIngredients([]);
    setItemInstructions('');
  };

  const confirmCustomizer = () => {
    if (customizingItem) addToCart(customizingItem, excludedIngredients, itemInstructions);
    setCustomizingItem(null);
    setExcludedIngredients([]);
    setItemInstructions('');
  };

  const handleSubmit = async () => {
    if (!sourceId.trim()) { setError('Please enter your table or room number'); return; }
    if (cart.length === 0) { setError('Your cart is empty'); return; }
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/orders`, {
        sourceType, sourceId,
        items: cart.map(i => ({
          menuItemId: i.id,
          quantity: i.quantity,
          price: i.price,
          customizations: (i.excludedIngredients.length > 0 || i.specialInstructions)
            ? JSON.stringify({ 
                Excluded: i.excludedIngredients, 
                Instructions: i.specialInstructions || null 
              }) : null,
        })),
        totalPrice: cartTotal,
        notes: orderNotes,
      });
      setOrderId(res.data.id);
      setStep(4);
    } catch { setError('Failed to place order. Please try again.'); }
    finally { setIsSubmitting(false); }
  };

  const handleNewOrder = () => {
    setStep(1); setCart([]); setSourceId(''); setSourceType('Table');
    setOrderNotes(''); setSearchTerm(''); setActiveCategory('all');
    setError(null); setOrderId(null);
  };

  const scrollToCategory = (id: string) => {
    setActiveCategory(id);
    if (id === 'all') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const el = categoryRefs.current[id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const displayedCategories = searchTerm
    ? [{ id: 'search', name: 'Search Results', items: allVisibleItems() as any }]
    : categories;

  if (loading) {
    return (
      <div style={{ background: LUXURY_BLACK }} className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full border border-[#d4af3733] flex items-center justify-center animate-pulse">
            <UtensilsCrossed size={32} style={{ color: LUXURY_GOLD }} />
          </div>
          <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-gray-500">
            Curating Experience…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: LUXURY_BLACK, fontFamily: "'Outfit', 'Inter', sans-serif", color: WHITE }}>

      {/* ── HEADER ── */}
      <header className="relative border-b border-[#2a2a2a] bg-[#0d0d0d]">
        <div className="px-6 py-12 text-center">
          <div className="inline-block px-4 py-1 rounded-full border border-[#d4af3733] mb-4 bg-[#d4af3708]">
            <p className="text-[10px] uppercase tracking-[0.4em] font-bold" style={{ color: LUXURY_GOLD }}>
              Exclusive Access
            </p>
          </div>
          <h1 className="text-5xl font-extrabold uppercase tracking-widest leading-relaxed" style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.03em' }}>
            {settings?.hotelName || 'WELCOME'}
          </h1>
          <div className="flex items-center justify-center space-x-6 mt-6">
            <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-[#d4af3766]" />
            <div className="w-2 h-2 rounded-full rotate-45 border border-[#d4af37]" />
            <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-[#d4af3766]" />
          </div>
        </div>
      </header>

      {/* ── STEP CONTENT ── */}
      <AnimatePresence mode="wait">

        {/* ══════ STEP 1: MENU ══════ */}
        {step === 1 && (
          <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            {/* Sticky nav */}
            <div className="sticky top-0 z-30 border-b border-[#2a2a2a]" style={{ background: LUXURY_BLACK }}>
              {/* Search */}
              <div className="px-4 pt-6 pb-2">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: TEXT_GRAY }} />
                  <input
                    type="text"
                    placeholder="Discover masterpieces…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none transition-all placeholder:text-gray-600"
                    style={{ background: LUXURY_DARK, border: `1px solid ${LUXURY_BORDER}`, color: WHITE }}
                  />
                </div>
              </div>
              {/* Category Tabs */}
              {!searchTerm && (
                <div className="flex space-x-2 px-4 pb-6 overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => scrollToCategory('all')}
                    className="flex-shrink-0 px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500"
                    style={activeCategory === 'all'
                      ? { background: GOLD_GRADIENT, color: LUXURY_BLACK }
                      : { background: LUXURY_DARK, border: `1px solid ${LUXURY_BORDER}`, color: TEXT_GRAY }}
                  >
                    All Collections
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => scrollToCategory(cat.id)}
                      className="flex-shrink-0 px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500"
                      style={activeCategory === cat.id
                        ? { background: GOLD_GRADIENT, color: LUXURY_BLACK }
                        : { background: LUXURY_DARK, border: `1px solid ${LUXURY_BORDER}`, color: TEXT_GRAY }}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="max-w-2xl mx-auto px-4 py-8">
              <StepIndicator currentStep={1} />
            </div>

            {/* Menu body */}
            <div className="max-w-2xl mx-auto px-4 py-6 pb-40 space-y-10">
              {displayedCategories.map((cat) => {
                const items = searchTerm
                  ? (cat.items as any[])
                  : visibleItems(cat.id);

                if (items.length === 0) return null;

                return (
                  <div
                    key={cat.id}
                    ref={el => { if (cat.id !== 'search') categoryRefs.current[cat.id] = el; }}
                  >
                    {/* Category Header */}
                    <div className="mb-8 pt-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-[2px]" style={{ background: LUXURY_GOLD }} />
                        <h2 className="text-2xl font-bold italic" style={{ fontFamily: "'Playfair Display', serif", color: WHITE }}>
                          {cat.name}
                        </h2>
                        <div className="flex-1 h-[1px]" style={{ background: LUXURY_BORDER }} />
                      </div>
                    </div>

                    {/* Item Grid */}
                    <div className="grid grid-cols-1 last-of-type:mb-12 gap-10">
                      {items.map((item: any, idx: number) => {
                        const cartQty = cart.filter(c => c.id === item.id).reduce((s, c) => s + c.quantity, 0);
                        const categoryName = categories.find(c => c.id === item.categoryId)?.name || cat.name;
                        const mappedItem = { ...item, categoryName };

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="group relative rounded-[2rem] overflow-hidden border border-[#2a2a2a] transition-all hover:border-[#d4af3766]"
                            style={{ background: LUXURY_DARK }}
                          >
                            {/* Image Container (High-impact) */}
                            <div className="relative aspect-[16/10] overflow-hidden">
                              {item.image ? (
                                <img 
                                  src={item.image} 
                                  alt={item.name} 
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                />
                              ) : (
                                <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center text-gray-700">
                                  <UtensilsCrossed size={48} />
                                </div>
                              )}
                              {/* Overlay Gradient */}
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-60" />
                              
                              {/* Floating Price Tag */}
                              <div className="absolute top-6 right-6 px-4 py-2 rounded-xl backdrop-blur-md border border-[#ffffff22] font-bold text-lg" 
                                   style={{ background: 'rgba(0,0,0,0.4)', color: LUXURY_GOLD, fontFamily: "'Playfair Display', serif" }}>
                                ${item.price.toFixed(2)}
                              </div>
                            </div>

                            {/* Content */}
                            <div className="p-8">
                              <div className="flex justify-between items-start gap-4 mb-4">
                                <h3 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: WHITE }}>
                                  {item.name}
                                </h3>
                              </div>

                              {item.description && (
                                <p className="text-sm leading-relaxed mb-6 line-clamp-2" style={{ color: TEXT_GRAY }}>
                                  {item.description}
                                </p>
                              )}

                              {item.ingredients && (
                                <div className="flex flex-wrap gap-2 mb-8">
                                  {item.ingredients.split(',').map((s: string, i: number) => (
                                    <span key={i} className="text-[9px] font-bold uppercase tracking-[0.1em] px-3 py-1 rounded-full border border-[#d4af3722]" style={{ color: LUXURY_GOLD }}>
                                      {s.trim()}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-6 border-t border-[#2a2a2a]">
                                {item.ingredients ? (
                                  <button
                                    onClick={() => openCustomizer(mappedItem)}
                                    className="text-[10px] uppercase tracking-[0.2em] font-bold px-4 py-2 rounded-lg border border-[#2a2a2a] hover:bg-[#1a1a1a] transition-all"
                                    style={{ color: TEXT_GRAY }}
                                  >
                                    Customize
                                  </button>
                                ) : <div />}

                                <div className="flex items-center">
                                  {cartQty > 0 ? (
                                    <div className="flex items-center space-x-4 bg-[#0a0a0a] rounded-xl px-4 py-2 border border-[#2a2a2a]">
                                      <button onClick={() => {
                                        const existing = cart.find(c => c.id === item.id);
                                        if (existing) updateQty(existing.cartId, -1);
                                      }} className="text-gray-400 hover:text-white transition-colors">
                                        <Minus size={16} />
                                      </button>
                                      <span className="text-sm font-bold min-w-[20px] text-center" style={{ color: WHITE }}>{cartQty}</span>
                                      <button onClick={() => addToCart(mappedItem)} className="text-gray-400 hover:text-white transition-colors">
                                        <Plus size={16} />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => item.ingredients ? openCustomizer(mappedItem) : addToCart(mappedItem)}
                                      className="flex items-center space-x-2 px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 transform active:scale-95 shadow-xl"
                                      style={{ background: GOLD_GRADIENT, color: LUXURY_BLACK }}
                                    >
                                      <Plus size={14} />
                                      <span>Add to Palette</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {displayedCategories.every(c => {
                const items = searchTerm ? (c.items as any[]) : visibleItems(c.id);
                return items.length === 0;
              }) && (
                <div className="py-20 text-center opacity-30">
                  <UtensilsCrossed size={48} className="mx-auto mb-4" style={{ color: TEXT_GRAY }} />
                  <p className="text-sm uppercase tracking-widest font-bold" style={{ color: TEXT_GRAY }}>No masterpieces found</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ══════ STEP 2: LOCATION ══════ */}
        {step === 2 && (
          <motion.div key="loc" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="max-w-xl mx-auto px-5 pt-8 pb-36 space-y-10">
            
            <StepIndicator currentStep={2} />

            <div>
              <button onClick={() => setStep(1)} className="flex items-center space-x-2 text-sm mb-8 hover:translate-x-1 transition-transform" style={{ color: TEXT_GRAY }}>
                <ArrowLeft size={16} /> <span>Back to the Menu</span>
              </button>
              <h2 className="text-4xl font-extrabold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: WHITE }}>
                Where shall we serve?
              </h2>
              <p className="text-sm opacity-60" style={{ color: WHITE }}>Choose your location for a tailored experience.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'Table', icon: MapPin, label: 'Table', desc: 'Dining Area' },
                { id: 'Room', icon: Home, label: 'Room', desc: 'Suite Service' },
                { id: 'VIP', icon: Star, label: 'VIP', desc: 'Exclusive Lounge' },
                { id: 'Staff', icon: User, label: 'Staff', desc: 'Service Team' },
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setSourceType(type.id)}
                  className="p-6 rounded-[1.5rem] border-2 flex flex-col items-center text-center space-y-3 transition-all duration-300"
                  style={sourceType === type.id
                    ? { borderColor: LUXURY_GOLD, background: '#d4af3711' }
                    : { borderColor: LUXURY_BORDER, background: LUXURY_DARK }}
                >
                  <div className="p-4 rounded-2xl" style={{ background: sourceType === type.id ? '#d4af3722' : '#ffffff08' }}>
                    <type.icon size={28} style={{ color: sourceType === type.id ? LUXURY_GOLD : TEXT_GRAY }} />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: sourceType === type.id ? LUXURY_GOLD : WHITE }}>
                      {type.label}
                    </span>
                    <span className="block text-[10px] opacity-40 uppercase tracking-widest">{type.desc}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-4">
              <label className="block text-[10px] font-bold uppercase tracking-[0.3em] mb-4 text-center" style={{ color: LUXURY_GOLD }}>
                Enter {sourceType} Identification
              </label>
              <input
                type="text"
                value={sourceId}
                onChange={e => { setSourceId(e.target.value); setError(null); }}
                placeholder={sourceType === 'Table' ? '00' : sourceType === 'Room' ? '000' : 'Suite name'}
                className="w-full rounded-2xl px-6 py-6 text-4xl font-extrabold text-center focus:outline-none transition-all placeholder:text-gray-800"
                style={{ fontFamily: "'Playfair Display', serif", border: `2px solid ${sourceId ? LUXURY_GOLD : LUXURY_BORDER}`, background: LUXURY_DARK, color: WHITE }}
              />
              {sourceId && (
                <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse" style={{ color: LUXURY_GOLD }}>
                  Selected: {sourceType} {sourceId}
                </p>
              )}
            </div>
            {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}
          </motion.div>
        )}

        {/* ══════ STEP 3: REVIEW ══════ */}
        {step === 3 && (
          <motion.div key="review" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="max-w-xl mx-auto px-5 pt-8 pb-40 space-y-8">
            
            <StepIndicator currentStep={3} />

            <div>
              <button onClick={() => setStep(2)} className="flex items-center space-x-2 text-sm mb-8 hover:translate-x-1 transition-transform" style={{ color: TEXT_GRAY }}>
                <ArrowLeft size={16} /> <span>Modify location</span>
              </button>
              <h2 className="text-4xl font-extrabold" style={{ fontFamily: "'Playfair Display', serif", color: WHITE }}>
                Review Selection
              </h2>
            </div>

            {/* Location badge */}
            <div className="flex items-center justify-between px-6 py-4 rounded-[1.5rem] border border-[#d4af3722]" style={{ background: '#d4af3708' }}>
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-[#d4af3711]">
                  <MapPin size={20} style={{ color: LUXURY_GOLD }} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: LUXURY_GOLD }}>{sourceType}</p>
                  <p className="font-extrabold text-xl leading-none mt-1" style={{ color: WHITE }}>{sourceId}</p>
                </div>
              </div>
              <button onClick={() => setStep(2)} className="text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-lg border border-[#2a2a2a] hover:bg-[#1a1a1a] transition-all" style={{ color: TEXT_GRAY }}>
                Change
              </button>
            </div>

            {/* Items */}
            <div className="rounded-[2rem] overflow-hidden border border-[#2a2a2a]" style={{ background: LUXURY_DARK }}>
              {cart.map((item, idx) => (
                <div key={item.cartId} className="flex items-center gap-6 p-6"
                  style={{ borderBottom: idx < cart.length - 1 ? `1px solid ${LUXURY_BORDER}` : 'none' }}>
                  {item.image && (
                    <div className="w-16 h-16 rounded-[1rem] overflow-hidden flex-shrink-0 border border-[#2a2a2a]">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-lg leading-tight mb-1" style={{ fontFamily: "'Playfair Display', serif", color: WHITE }}>{item.name}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.excludedIngredients.length > 0 && (
                        <p className="text-[10px] uppercase font-bold tracking-widest text-red-500">
                           NO {item.excludedIngredients.join(' • NO ')}
                        </p>
                      )}
                      {item.specialInstructions && (
                        <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 italic">
                          "{item.specialInstructions}"
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 mt-2">
                      <div className="flex items-center space-x-3 px-3 py-1.5 rounded-xl bg-[#0a0a0a] border border-[#2a2a2a]">
                        <button onClick={() => updateQty(item.cartId, -1)} className="text-gray-500 hover:text-white transition-colors"><Minus size={14} /></button>
                        <span className="text-sm font-bold min-w-[16px] text-center" style={{ color: WHITE }}>{item.quantity}</span>
                        <button onClick={() => updateQty(item.cartId, 1)} className="text-gray-500 hover:text-white transition-colors"><Plus size={14} /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.cartId)} className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#EF4444' }}>
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="font-bold text-lg flex-shrink-0" style={{ fontFamily: "'Playfair Display', serif", color: LUXURY_GOLD }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.3em] mb-4" style={{ color: TEXT_GRAY }}>
                Global Concierge Notes (optional)
              </label>
              <textarea
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                placeholder="Dining preferences, arrival notes, or general requests..."
                className="w-full rounded-[1.5rem] p-6 text-sm focus:outline-none transition-all resize-none h-28 placeholder:text-gray-800"
                style={{ border: `1px solid ${LUXURY_BORDER}`, background: LUXURY_DARK, color: WHITE }}
              />
            </div>

            {/* Total */}
            <div className="flex items-center justify-between px-8 py-6 rounded-[2rem] shadow-2xl" style={{ background: GOLD_GRADIENT }}>
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-black opacity-60">Investment Total</span>
              <span className="text-3xl font-extrabold text-black" style={{ fontFamily: "'Playfair Display', serif" }}>
                ${cartTotal.toFixed(2)}
              </span>
            </div>

            {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}
          </motion.div>
        )}

        {/* ══════ STEP 4: SUCCESS ══════ */}
        {step === 4 && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 space-y-8 py-20">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12, delay: 0.2 }}
              className="w-20 h-20 rounded-full flex items-center justify-center shadow-sm"
              style={{ background: '#d4af3711', border: `1px solid #d4af3733` }}>
              <CheckCircle size={40} style={{ color: LUXURY_GOLD }} />
            </motion.div>
            <div className="space-y-2">
              <h2 className="text-4xl font-extrabold" style={{ fontFamily: "'Playfair Display', serif", color: WHITE }}>
                Order Received
              </h2>
              <p className="text-sm opacity-60" style={{ color: WHITE }}>Your selection is being prepared with care.</p>
              {orderId && (
                <div className="inline-block px-4 py-1.5 rounded-full mt-4 bg-[#d4af3711]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: LUXURY_GOLD }}>
                    Reference #{orderId.slice(-6).toUpperCase()}
                  </p>
                </div>
              )}
            </div>
            <div className="text-sm space-y-2 max-w-xs" style={{ color: TEXT_GRAY }}>
              <p>Delivery to <strong style={{ color: WHITE }}>{sourceType} {sourceId}</strong></p>
              <p className="text-[11px] opacity-40">Estimated arrival: 15 – 25 minutes</p>
            </div>
            <button onClick={handleNewOrder}
              className="px-12 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl"
              style={{ background: GOLD_GRADIENT, color: LUXURY_BLACK }}>
              Explore More
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {step === 1 && cartCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-40 p-4"
            style={{ background: `rgba(10,10,10,0.8)`, backdropFilter: 'blur(24px)', borderTop: `1px solid ${LUXURY_BORDER}` }}
          >
            <div className="max-w-lg mx-auto">
              <button
                onClick={() => setStep(2)}
                className="w-full py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] flex items-center justify-between px-8 transition-all active:scale-[0.98] shadow-2xl"
                style={{ background: GOLD_GRADIENT, color: LUXURY_BLACK }}
              >
                <span className="flex items-center space-x-3">
                  <ShoppingCart size={18} />
                  <span>{cartCount} selection{cartCount !== 1 ? 's' : ''}</span>
                </span>
                <span className="flex items-center space-x-2">
                  <span>Review Order</span>
                  <ArrowRight size={16} />
                </span>
                <span style={{ fontFamily: "'Playfair Display', serif" }} className="text-lg">${cartTotal.toFixed(2)}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STEP 2 CONTINUE BUTTON ── */}
      {step === 2 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-6" style={{ background: `rgba(10,10,10,0.8)`, backdropFilter: 'blur(24px)', borderTop: `1px solid ${LUXURY_BORDER}` }}>
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => {
                if (!sourceId.trim()) { setError('Please enter your table or room number'); return; }
                setError(null); setStep(3);
              }}
              className="w-full py-5 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center space-x-3 transition-all active:scale-[0.98] shadow-2xl"
              style={{ background: GOLD_GRADIENT, color: LUXURY_BLACK }}
            >
              <span>Verify Order Details</span><ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3 PLACE ORDER ── */}
      {step === 3 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-6" style={{ background: `rgba(10,10,10,0.8)`, backdropFilter: 'blur(24px)', borderTop: `1px solid ${LUXURY_BORDER}` }}>
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleSubmit} disabled={isSubmitting}
              className="w-full py-5 rounded-2xl font-bold text-[10px] uppercase tracking-[0.3em] flex items-center justify-center space-x-3 transition-all disabled:opacity-50 shadow-2xl"
              style={{ background: GOLD_GRADIENT, color: LUXURY_BLACK }}
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (
                <><CheckCircle size={18} /><span>Secure Order · ${cartTotal.toFixed(2)}</span></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── INGREDIENT CUSTOMIZER SHEET ── */}
      <AnimatePresence>
        {customizingItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setCustomizingItem(null)}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[3rem] overflow-hidden max-h-[90vh] flex flex-col border-t border-[#d4af3733] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
              style={{ background: LUXURY_DARK }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-4 pb-2 flex-shrink-0">
                <div className="w-12 h-1.5 rounded-full bg-[#2a2a2a]" />
              </div>

              <div className="px-8 pb-6 border-b border-[#2a2a2a] flex-shrink-0">
                <h3 className="text-3xl font-extrabold" style={{ fontFamily: "'Playfair Display', serif", color: WHITE }}>
                  {customizingItem.name}
                </h3>
                <p className="text-[10px] mt-2 uppercase tracking-[0.2em] font-bold" style={{ color: TEXT_GRAY }}>
                  Refine your masterpiece by adjusting ingredients
                </p>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
                {customizingItem.ingredients?.split(',').map((ing: string) => {
                  const name = ing.trim();
                  const isExcluded = excludedIngredients.includes(name);
                  const isIncluded = !isExcluded;
                  return (
                    <label
                      key={name}
                      onClick={() => toggleIngredient(name)}
                      className="flex items-center space-x-5 p-5 rounded-2xl cursor-pointer select-none transition-all duration-300"
                      style={{
                        border: `1px solid ${isIncluded ? '#d4af3733' : '#2a2a2a'}`,
                        background: isIncluded ? '#d4af3708' : '#ffffff05',
                      }}
                    >
                      {/* Checkbox */}
                      <div
                        className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-500"
                        style={{
                          border: `2px solid ${isIncluded ? LUXURY_GOLD : '#2a2a2a'}`,
                          background: isIncluded ? GOLD_GRADIENT : 'transparent',
                        }}
                      >
                        {isIncluded && (
                          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                            <path d="M1.5 5L4.5 8L10.5 2" stroke={LUXURY_BLACK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span
                        className="flex-1 text-sm font-bold uppercase tracking-widest"
                        style={{ color: isIncluded ? WHITE : TEXT_GRAY, textDecoration: isIncluded ? 'none' : 'line-through' }}
                      >
                        {name}
                      </span>
                      {!isIncluded && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 opacity-60">Excluded</span>
                      )}
                    </label>
                  );
                })}

                <div className="pt-6 border-t border-[#2a2a2a] mt-6">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.3em] mb-4" style={{ color: LUXURY_GOLD }}>
                    Special Enquiries
                  </label>
                  <textarea
                    value={itemInstructions}
                    onChange={e => setItemInstructions(e.target.value)}
                    placeholder="E.g. Extra spicy, well-done, allergy notes..."
                    className="w-full rounded-2xl p-5 text-sm focus:outline-none transition-all resize-none h-28 placeholder:text-gray-800 border-2"
                    style={{ border: `1px solid #2a2a2a`, background: '#0a0a0a', color: WHITE }}
                  />
                  <p className="text-[10px] mt-3 opacity-40 italic">
                    Your preferences will be noted for this item.
                  </p>
                </div>
              </div>

              <div className="px-8 py-6 border-t border-[#2a2a2a] flex space-x-4 flex-shrink-0 bg-[#0d0d0d]">
                <button onClick={() => setCustomizingItem(null)}
                  className="px-8 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all"
                  style={{ border: `1px solid #2a2a2a`, color: TEXT_GRAY, background: '#1a1a1a' }}>
                  Cancel
                </button>
                <button onClick={confirmCustomizer}
                  className="flex-1 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all active:scale-[0.98] shadow-2xl"
                  style={{ background: GOLD_GRADIENT, color: LUXURY_BLACK }}>
                  Confirm Selection · ${customizingItem.price.toFixed(2)}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
