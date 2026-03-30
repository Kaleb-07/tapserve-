import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, UtensilsCrossed, Plus, Minus, CheckCircle
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
  specialInstructions?: string;
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
  
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [sourceType, setSourceType] = useState('Table');
  const [sourceId, setSourceId] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  
  const [customizingItem, setCustomizingItem] = useState<(MenuItem & { categoryName: string }) | null>(null);
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [itemInstructions, setItemInstructions] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
    axios.get(`${API_URL}/categories`).then(r => {
      setCategories(r.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const visibleItems = () => {
    let items: (MenuItem & { categoryName: string })[] = [];
    if (activeCategory === 'all') {
      items = categories.flatMap(c => c.items.map(i => ({ ...i, categoryName: c.name })));
    } else {
      const cat = categories.find(c => c.id === activeCategory);
      if (cat) {
        items = cat.items.map(i => ({ ...i, categoryName: cat.name }));
      }
    }
    
    return items
      .filter(i => i.inStock !== false)
      .filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   (i.description || '').toLowerCase().includes(searchTerm.toLowerCase()));
  };

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
    if (!sourceId.trim()) { setError('Please specify your table, room, or suite number.'); return; }
    if (cart.length === 0) { setError('Your cart is empty.'); return; }
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
      setOrderSuccess(res.data.id);
    } catch { 
      setError('Failed to place order. Please try again.'); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleNewOrder = () => {
    setCart([]); setSourceId(''); setSourceType('Table');
    setOrderNotes(''); setSearchTerm(''); setActiveCategory('all');
    setError(null); setOrderSuccess(null);
  };

  if (loading) {
    return (
      <div style={{ background: LUXURY_BLACK }} className="min-h-screen flex items-center justify-center">
        <div className="w-20 h-20 rounded-full border border-[#d4af3733] flex items-center justify-center animate-pulse">
          <UtensilsCrossed size={32} style={{ color: LUXURY_GOLD }} />
        </div>
      </div>
    );
  }

  // Active Category Name Display
  const currentCategoryName = activeCategory === 'all' ? 'All Collections' : categories.find(c => c.id === activeCategory)?.name || 'Menu';

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: LUXURY_BLACK, fontFamily: "'Outfit', 'Inter', sans-serif", color: WHITE }}>
      
      {/* ── LEFT PANE: MENU MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar relative">
        <div className="p-8 pb-40">
          
          {/* Header Row */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="inline-block px-4 py-1 rounded-full border border-[#d4af3733] mb-2 bg-[#d4af3708]">
                <p className="text-[10px] uppercase tracking-[0.4em] font-bold" style={{ color: LUXURY_GOLD }}>
                  Exclusive Access
                </p>
              </div>
              <h1 className="text-4xl font-extrabold" style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.02em' }}>
                Welcome
              </h1>
            </div>
            
            <div className="relative w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: TEXT_GRAY }} />
              <input
                type="text"
                placeholder="Discover masterpieces…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none transition-all placeholder:text-gray-600"
                style={{ background: LUXURY_DARK, border: `1px solid ${LUXURY_BORDER}`, color: WHITE }}
              />
            </div>
          </div>

          {/* Categories Grid (mimicking the POS photo grid) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <button
              onClick={() => setActiveCategory('all')}
              className="flex items-center space-x-4 p-4 rounded-[1.5rem] transition-all duration-300"
              style={activeCategory === 'all' 
                ? { background: LUXURY_GOLD, color: LUXURY_BLACK } 
                : { background: LUXURY_DARK, border: `1px solid ${LUXURY_BORDER}` }}
            >
              <div className="p-3 rounded-2xl" style={{ background: activeCategory === 'all' ? '#ffffff44' : '#ffffff08' }}>
                <UtensilsCrossed size={20} style={{ color: activeCategory === 'all' ? LUXURY_BLACK : LUXURY_GOLD }} />
              </div>
              <div className="text-left">
                <span className={`block text-sm font-bold ${activeCategory === 'all' ? 'text-black' : 'text-white'}`}>All Collections</span>
                <span className={`block text-[10px] uppercase tracking-widest ${activeCategory === 'all' ? 'text-black/70' : 'text-gray-500'}`}>
                  {categories.flatMap(c => c.items).length} items
                </span>
              </div>
            </button>
            
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="flex items-center space-x-4 p-4 rounded-[1.5rem] transition-all duration-300"
                style={activeCategory === cat.id 
                  ? { background: LUXURY_GOLD, color: LUXURY_BLACK } 
                  : { background: LUXURY_DARK, border: `1px solid ${LUXURY_BORDER}` }}
              >
                <div className="p-3 rounded-2xl" style={{ background: activeCategory === cat.id ? '#ffffff44' : '#ffffff08' }}>
                  <UtensilsCrossed size={20} style={{ color: activeCategory === cat.id ? LUXURY_BLACK : LUXURY_GOLD }} />
                </div>
                <div className="text-left">
                  <span className={`block text-sm font-bold ${activeCategory === cat.id ? 'text-black' : 'text-white'}`}>{cat.name}</span>
                  <span className={`block text-[10px] uppercase tracking-widest ${activeCategory === cat.id ? 'text-black/70' : 'text-gray-500'}`}>
                    {cat.items.length} items
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Items Section */}
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif", color: WHITE }}>
            {searchTerm ? 'Search Results' : `${currentCategoryName} Menu`}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleItems().map((item: any, idx: number) => {
              const cartQty = cart.filter(c => c.id === item.id).reduce((s, c) => s + c.quantity, 0);
              const mappedItem = { ...item };

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="flex flex-col rounded-[2rem] p-4 transition-all"
                  style={{ background: LUXURY_DARK, border: `1px solid ${LUXURY_BORDER}` }}
                >
                  <div className="flex gap-4">
                    {/* Item Image */}
                    <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden flex-shrink-0 bg-[#1a1a1a]">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><UtensilsCrossed size={24} style={{ color: '#333' }} /></div>
                      )}
                    </div>
                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold truncate" style={{ fontFamily: "'Playfair Display', serif" }}>{item.name}</h3>
                      {item.description && (
                         <p className="text-xs line-clamp-2 mt-1" style={{ color: TEXT_GRAY }}>{item.description}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Bottom Row - Price & Quantities */}
                  <div className="flex items-center justify-between border-t mt-4 pt-4" style={{ borderColor: LUXURY_BORDER }}>
                    <span className="text-xl font-bold" style={{ color: LUXURY_GOLD }}>${item.price.toFixed(2)}</span>
                    
                    <div className="flex bg-[#0a0a0a] rounded-full p-1 border" style={{ borderColor: LUXURY_BORDER }}>
                      <button 
                         onClick={(e) => { 
                           e.stopPropagation(); 
                           const existing = cart.find(c => c.id === item.id);
                           if (existing) updateQty(existing.cartId, -1);
                         }} 
                         disabled={cartQty === 0}
                         className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[#1a1a1a] disabled:opacity-30"
                      >
                        <Minus size={14} style={{ color: TEXT_GRAY }} />
                      </button>
                      <span className="w-8 flex items-center justify-center text-sm font-bold">{cartQty}</span>
                      <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           item.ingredients ? openCustomizer(mappedItem) : addToCart(mappedItem);
                         }}
                         className="w-8 h-8 rounded-full flex items-center justify-center"
                         style={{ background: LUXURY_GOLD, color: LUXURY_BLACK }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {visibleItems().length === 0 && (
            <div className="py-20 text-center opacity-30">
              <UtensilsCrossed size={48} className="mx-auto mb-4" style={{ color: TEXT_GRAY }} />
              <p className="text-sm uppercase tracking-widest font-bold">No items found</p>
            </div>
          )}

        </div>
      </div>

      {/* ── RIGHT PANE: INVOICE / CART SIDEBAR ── */}
      <div className="w-[420px] h-screen flex flex-col flex-shrink-0 relative border-l" style={{ background: LUXURY_DARK, borderColor: LUXURY_BORDER }}>
        <div className="p-6 border-b" style={{ borderColor: LUXURY_BORDER }}>
          <h2 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Invoice</h2>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
              <span className="text-xs uppercase tracking-widest font-bold mb-2">Palette is empty</span>
              <span className="text-xs px-8">Add masterpieces from the menu to build your experience.</span>
            </div>
          ) : (
             cart.map(item => (
               <div key={item.cartId} className="flex gap-4">
                 <div className="w-16 h-16 rounded-[1rem] overflow-hidden flex-shrink-0 border" style={{ borderColor: LUXURY_BORDER, background: '#1a1a1a' }}>
                    {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : null}
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-start">
                     <p className="text-sm font-bold truncate" style={{ fontFamily: "'Playfair Display', serif" }}>{item.name}</p>
                     <p className="text-sm font-bold ml-2" style={{ color: LUXURY_GOLD }}>${(item.price * item.quantity).toFixed(2)}</p>
                   </div>
                   <p className="text-xs mt-1" style={{ color: TEXT_GRAY }}>{item.quantity}x</p>
                   
                   {/* Customisations display */}
                   {(item.excludedIngredients.length > 0 || item.specialInstructions) && (
                     <div className="mt-1 space-y-1">
                       {item.excludedIngredients.length > 0 && (
                         <p className="text-[9px] uppercase tracking-wider text-red-500 line-clamp-1">No {item.excludedIngredients.join(', ')}</p>
                       )}
                       {item.specialInstructions && (
                         <p className="text-[9px] uppercase tracking-wider italic line-clamp-1" style={{ color: TEXT_GRAY }}>"{item.specialInstructions}"</p>
                       )}
                     </div>
                   )}
                   
                   {/* Remove button */}
                   <button onClick={() => removeFromCart(item.cartId)} className="mt-2 text-[9px] uppercase tracking-wider text-red-500 opacity-60 hover:opacity-100">Remove</button>
                 </div>
               </div>
             ))
          )}
        </div>

        {/* Checkout / Summary Footer */}
        <div className="p-6 bg-[#0a0a0a] border-t relative z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]" style={{ borderColor: LUXURY_BORDER }}>
            
          {/* Location Area Selection (Moved here to adapt from wizard) */}
          <div className="mb-6 space-y-3">
             <label className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: TEXT_GRAY }}>Service Location</label>
             <div className="flex space-x-2">
               {['Table', 'Room', 'VIP'].map(type => (
                 <button
                   key={type}
                   onClick={() => setSourceType(type)}
                   className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-colors border"
                   style={sourceType === type 
                     ? { background: LUXURY_GOLD, color: LUXURY_BLACK, borderColor: LUXURY_GOLD } 
                     : { background: LUXURY_DARK, color: TEXT_GRAY, borderColor: LUXURY_BORDER }}
                 >
                   {type}
                 </button>
               ))}
             </div>
             <div>
               <input
                 type="text"
                 placeholder={`Enter ${sourceType} Number/Name`}
                 value={sourceId}
                 onChange={(e) => { setSourceId(e.target.value); setError(null); }}
                 className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] transition-all"
               />
             </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span style={{ color: TEXT_GRAY }}>Sub Total</span>
              <span className="font-bold">${cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: TEXT_GRAY }}>Tax</span>
              <span className="font-bold">$0.00</span>
            </div>
            <div className="w-full h-[1px] my-4 border-t border-dashed" style={{ borderColor: LUXURY_BORDER }} />
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold uppercase tracking-widest">Total Payment</span>
              <span className="text-2xl font-extrabold" style={{ fontFamily: "'Playfair Display', serif", color: LUXURY_GOLD }}>
                ${cartTotal.toFixed(2)}
              </span>
            </div>
          </div>
          
          {error && <p className="text-red-500 font-bold text-xs text-center mb-3">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={cart.length === 0 || isSubmitting}
            className="w-full py-4 rounded-2xl font-bold uppercase tracking-[0.2em] transition-all disabled:opacity-50"
            style={{ background: GOLD_GRADIENT, color: LUXURY_BLACK }}
          >
            {isSubmitting ? 'Processing...' : 'Place An Order'}
          </button>
        </div>
      </div>
      
      {/* ── CUSTOMIZATION MODAL ── */}
      <AnimatePresence>
        {customizingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
             <motion.div
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="w-full max-w-md rounded-[2rem] overflow-hidden flex flex-col shadow-2xl"
               style={{ background: LUXURY_DARK, border: `1px solid ${LUXURY_BORDER}` }}
             >
               <div className="px-6 py-6 border-b flex justify-between items-center" style={{ borderColor: LUXURY_BORDER }}>
                 <div>
                   <h3 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>{customizingItem.name}</h3>
                   <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: TEXT_GRAY }}>Adjust Ingredients</p>
                 </div>
                 <button onClick={() => setCustomizingItem(null)} className="opacity-50 hover:opacity-100"><UtensilsCrossed size={18} /></button>
               </div>
               
               <div className="p-6 max-h-[400px] overflow-y-auto space-y-3 custom-scrollbar">
                 {customizingItem.ingredients?.split(',').map((ing: string) => {
                   const name = ing.trim();
                   const isExcluded = excludedIngredients.includes(name);
                   return (
                     <label key={name} onClick={() => toggleIngredient(name)} className="flex items-center space-x-3 p-3 rounded-xl cursor-pointer border transition-colors"
                            style={{ borderColor: isExcluded ? LUXURY_BORDER : '#d4af3733', background: isExcluded ? 'transparent' : '#d4af3708' }}>
                       <div className="w-5 h-5 flex-shrink-0 rounded flex items-center justify-center border transition-colors"
                            style={{ borderColor: isExcluded ? LUXURY_BORDER : LUXURY_GOLD, background: isExcluded ? 'transparent' : LUXURY_GOLD }}>
                          {!isExcluded && <CheckCircle size={12} style={{ color: LUXURY_BLACK }} />}
                       </div>
                       <span className="flex-1 text-sm font-bold uppercase tracking-widest" style={{ color: isExcluded ? TEXT_GRAY : WHITE, textDecoration: isExcluded ? 'line-through' : 'none' }}>{name}</span>
                       {isExcluded && <span className="text-[9px] uppercase tracking-widest text-red-500">Excluded</span>}
                     </label>
                   );
                 })}
                 
                 <div className="pt-4 mt-4 border-t" style={{ borderColor: LUXURY_BORDER }}>
                   <label className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: LUXURY_GOLD }}>Special Enquiries</label>
                   <textarea
                     value={itemInstructions}
                     onChange={e => setItemInstructions(e.target.value)}
                     placeholder="Extra spicy, allergy notes..."
                     className="w-full rounded-xl p-3 text-sm focus:outline-none resize-none h-20"
                     style={{ background: LUXURY_BLACK, border: `1px solid ${LUXURY_BORDER}`, color: WHITE }}
                   />
                 </div>
               </div>
               
               <div className="p-6 border-t bg-[#0a0a0a]" style={{ borderColor: LUXURY_BORDER }}>
                 <button onClick={confirmCustomizer} className="w-full py-3 rounded-xl font-bold uppercase tracking-widest text-sm" style={{ background: GOLD_GRADIENT, color: LUXURY_BLACK }}>
                   Confirm & Add
                 </button>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── SUCCESS MODAL ── */}
      <AnimatePresence>
        {orderSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)' }}>
            <motion.div
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               className="w-full max-w-sm rounded-[2rem] p-8 flex flex-col items-center text-center shadow-2xl"
               style={{ background: LUXURY_DARK, border: `1px solid ${LUXURY_GOLD}` }}
             >
               <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-[#d4af3711] border border-[#d4af3733]">
                 <CheckCircle size={32} style={{ color: LUXURY_GOLD }} />
               </div>
               <h2 className="text-3xl font-extrabold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Order Placed</h2>
               <p className="text-xs mb-6 uppercase tracking-widest" style={{ color: TEXT_GRAY }}>Your selection is being prepared.</p>
               
               <div className="w-full bg-[#0a0a0a] rounded-xl p-4 border mb-6" style={{ borderColor: LUXURY_BORDER }}>
                 <p className="text-[10px] uppercase tracking-widest" style={{ color: TEXT_GRAY }}>Reference Number</p>
                 <p className="font-bold text-lg" style={{ color: LUXURY_GOLD }}>#{orderSuccess.slice(-6).toUpperCase()}</p>
                 <div className="h-[1px] w-full border-t border-dashed my-3" style={{ borderColor: LUXURY_BORDER }} />
                 <p className="text-[10px] uppercase tracking-widest" style={{ color: TEXT_GRAY }}>Delivering to</p>
                 <p className="font-bold">{sourceType} {sourceId}</p>
               </div>
               
               <button onClick={handleNewOrder} className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs" style={{ background: GOLD_GRADIENT, color: LUXURY_BLACK }}>
                 Explore More
               </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* ── GLOBAL STYLES FOR SCROLLBAR ── */}
      {/* Since we cannot easily inject CSS directly into index.css from here without modifying it, 
          we rely on standard util classes or inline styles. But for custom scrollbar in Tailwind: */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: ${LUXURY_BLACK}; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${LUXURY_BORDER}; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
      `}</style>
    </div>
  );
};
