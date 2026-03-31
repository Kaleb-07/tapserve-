import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, UtensilsCrossed, Plus, Minus, CheckCircle, Sun, Moon
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

/* ─── Gradients ─── */
const GOLD_GRADIENT = 'linear-gradient(135deg, #d4af37 0%, #f1d592 50%, #aa8d2e 100%)';

export const CustomerOrderPage: React.FC = () => {
  const { fetchSettings, theme, toggleTheme, initTheme } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const getInitialMealType = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'BREAKFAST';
    if (hour >= 11 && hour < 17) return 'LUNCH';
    return 'DINNER';
  };

  const [activeMealType, setActiveMealType] = useState<string>(getInitialMealType());
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
  
  // Payment States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'CARD' | 'ROOM' | 'CASH'>('CASH');
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '', expiry: '', cvc: '',
    roomNumber: '', guestName: ''
  });

  useEffect(() => {
    fetchSettings();
    initTheme();
    setLoading(true);
    axios.get(`${API_URL}/categories?mealType=${activeMealType}`)
      .then(r => {
        setCategories(r.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fetchSettings, initTheme, activeMealType]);

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
    
    // Open payment modal instead of submitting immediately
    setIsPaymentModalOpen(true);
  };

  const handleFinalSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    setIsPaymentModalOpen(false);
    try {
      const res = await axios.post(`${API_URL}/orders`, {
        sourceType, 
        sourceId: selectedMethod === 'ROOM' ? (paymentDetails.roomNumber || sourceId) : sourceId,
        mealType: activeMealType,
        paymentMethod: selectedMethod,
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
        notes: orderNotes + (selectedMethod === 'ROOM' ? ` | Room guest: ${paymentDetails.guestName}` : ''),
      });
      setOrderSuccess(res.data.id);
      setCart([]); // Clear cart on success
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
      <div className="min-h-screen flex items-center justify-center bg-luxury-black">
        <div className="w-20 h-20 rounded-full border border-luxury-gold/20 flex items-center justify-center animate-pulse">
          <UtensilsCrossed size={32} className="text-luxury-gold" />
        </div>
      </div>
    );
  }

  const currentCategoryName = activeCategory === 'all' ? 'All Collections' : categories.find(c => c.id === activeCategory)?.name || 'Menu';

  return (
    <div className="min-h-screen flex overflow-hidden bg-luxury-black font-sans text-luxury-text">
      
      {/* ── LEFT PANE: MENU MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar relative">
        <div className="p-4 md:p-8 pb-40">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <div className="inline-block px-4 py-1 rounded-full border border-luxury-gold/20 mb-2 bg-luxury-gold/5">
                <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-luxury-gold">
                  Exclusive Access
                </p>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold font-serif tracking-tight">
                Welcome to {activeMealType.toLowerCase()}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative w-full md:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-textDim group-focus-within:text-luxury-gold transition-colors" size={16} />
                <input
                  type="text"
                  placeholder="Discover masterpieces…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none transition-all placeholder:text-luxury-textDim bg-luxury-dark border border-luxury-border focus:border-luxury-gold text-luxury-text"
                />
              </div>

              <button 
                onClick={toggleTheme}
                className="p-3 rounded-2xl bg-luxury-dark border border-luxury-border text-luxury-textDim hover:text-luxury-gold transition-all"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>

          {/* Meal Times Grid (Primary) */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {['BREAKFAST', 'LUNCH', 'DINNER'].map(mt => (
              <button
                key={mt}
                onClick={() => { setActiveMealType(mt); setActiveCategory('all'); }}
                className={`flex flex-col items-center justify-center p-6 rounded-[2rem] transition-all duration-500 border ${
                  activeMealType === mt 
                  ? 'bg-luxury-gold text-black border-luxury-gold shadow-[0_0_30px_rgba(212,175,55,0.3)] scale-[1.02]' 
                  : 'bg-luxury-dark border-luxury-border text-luxury-text hover:border-luxury-gold/50'
                }`}
              >
                <div className={`p-4 rounded-2xl mb-3 ${activeMealType === mt ? 'bg-white/20' : 'bg-luxury-black'}`}>
                  <UtensilsCrossed size={24} className={activeMealType === mt ? 'text-black' : 'text-luxury-gold'} />
                </div>
                <span className="text-sm font-bold uppercase tracking-[0.2em]">{mt}</span>
                <span className={`text-[9px] mt-1 opacity-60 uppercase tracking-widest ${activeMealType === mt ? 'text-black' : ''}`}>
                  {mt === 'BREAKFAST' ? '5 AM - 11 AM' : mt === 'LUNCH' ? '11 AM - 5 PM' : '5 PM - 12 AM'}
                </span>
              </button>
            ))}
          </div>

          {/* Categories Grid (Secondary) */}
          <div className="flex flex-wrap gap-3 mb-10 pb-4 border-b border-luxury-border">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${
                activeCategory === 'all' 
                ? 'bg-luxury-gold text-black border-luxury-gold' 
                : 'bg-luxury-dark border-luxury-border text-luxury-textDim hover:text-luxury-text'
              }`}
            >
              All {activeMealType.toLowerCase()}
            </button>
            
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${
                  activeCategory === cat.id 
                  ? 'bg-luxury-gold text-black border-luxury-gold' 
                  : 'bg-luxury-dark border-luxury-border text-luxury-textDim hover:text-luxury-text'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Items Section */}
          <h2 className="text-2xl font-bold mb-6 font-serif">
            {searchTerm ? 'Search Results' : `${currentCategoryName} Menu`}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleItems().map((item: any, idx: number) => {
              const cartQty = cart.filter(c => c.id === item.id).reduce((s, c) => s + c.quantity, 0);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="flex flex-col rounded-[2rem] p-4 transition-all bg-luxury-dark border border-luxury-border shadow-sm hover:shadow-md"
                >
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden flex-shrink-0 bg-luxury-gray/50">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20"><UtensilsCrossed size={24} /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold truncate font-serif">{item.name}</h3>
                      {item.description && (
                         <p className="text-xs line-clamp-2 mt-1 text-luxury-textDim">{item.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-t mt-4 pt-4 border-luxury-border">
                    <span className="text-xl font-bold text-luxury-gold">${item.price.toFixed(2)}</span>
                    
                    <div className="flex bg-luxury-black rounded-full p-1 border border-luxury-border">
                      <button 
                         onClick={(e) => { 
                           e.stopPropagation(); 
                           const existing = cart.find(c => c.id === item.id);
                           if (existing) updateQty(existing.cartId, -1);
                         }} 
                         disabled={cartQty === 0}
                         className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-luxury-gray disabled:opacity-30 text-luxury-textDim"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 flex items-center justify-center text-sm font-bold text-luxury-text">{cartQty}</span>
                      <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           item.ingredients ? openCustomizer(item) : addToCart(item);
                         }}
                         className="w-8 h-8 rounded-full flex items-center justify-center bg-luxury-gold text-black hover:bg-luxury-goldLight transition-colors"
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
              <UtensilsCrossed size={48} className="mx-auto mb-4 text-luxury-textDim" />
              <p className="text-sm uppercase tracking-widest font-bold">No items found</p>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANE: INVOICE / CART SIDEBAR ── */}
      <div className="w-[420px] h-screen h-screen flex flex-col flex-shrink-0 relative border-l border-luxury-border bg-luxury-dark hidden lg:flex shadow-2xl">
        <div className="p-6 border-b border-luxury-border">
          <h2 className="text-2xl font-bold font-serif">Invoice</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
              <UtensilsCrossed size={40} className="mb-4 text-luxury-gold" />
              <span className="text-xs uppercase tracking-widest font-bold mb-2">Palette is empty</span>
              <span className="text-xs px-8 italic">Add masterpieces from the menu to build your experience.</span>
            </div>
          ) : (
             cart.map(item => (
                <div key={item.cartId} className="flex gap-4 p-3 rounded-2xl bg-luxury-black/20 border border-luxury-border/50">
                  <div className="w-16 h-16 rounded-[1rem] overflow-hidden flex-shrink-0 border border-luxury-border bg-luxury-gray">
                     {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold truncate font-serif">{item.name}</p>
                      <p className="text-sm font-bold ml-2 text-luxury-gold">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <p className="text-xs mt-1 text-luxury-textDim">{item.quantity}x</p>
                    
                    {(item.excludedIngredients.length > 0 || item.specialInstructions) && (
                      <div className="mt-1 space-y-1">
                        {item.excludedIngredients.length > 0 && (
                          <p className="text-[9px] uppercase tracking-wider text-red-500 line-clamp-1">No {item.excludedIngredients.join(', ')}</p>
                        )}
                        {item.specialInstructions && (
                          <p className="text-[9px] uppercase tracking-wider italic line-clamp-1 text-luxury-textDim">"{item.specialInstructions}"</p>
                        )}
                      </div>
                    )}
                    
                    <button onClick={() => removeFromCart(item.cartId)} className="mt-2 text-[9px] uppercase tracking-wider text-red-500 opacity-60 hover:opacity-100 font-bold transition-opacity">Remove</button>
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Summary Footer */}
        <div className="p-6 bg-luxury-black border-t border-luxury-border relative z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
          <div className="mb-6 space-y-3">
             <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-luxury-textDim">Service Location</label>
             <div className="flex space-x-2">
               {['Table', 'Room', 'VIP'].map(type => (
                 <button
                   key={type}
                   onClick={() => setSourceType(type)}
                   className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all border ${
                     sourceType === type 
                     ? 'bg-luxury-gold text-black border-luxury-gold' 
                     : 'bg-luxury-dark text-luxury-textDim border-luxury-border'
                   }`}
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
                 className="w-full bg-luxury-dark border border-luxury-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-luxury-gold transition-all text-luxury-text"
               />
             </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-luxury-textDim">Sub Total</span>
              <span className="font-bold text-luxury-text">${cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-luxury-textDim">Service Fee</span>
              <span className="font-bold text-luxury-gold">Complimentary</span>
            </div>
            <div className="w-full h-[1px] my-4 border-t border-dashed border-luxury-border" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold uppercase tracking-widest text-luxury-text">Total Payment</span>
              <span className="text-2xl font-extrabold font-serif text-luxury-gold">
                ${cartTotal.toFixed(2)}
              </span>
            </div>
          </div>
          
          {error && <p className="text-red-500 font-bold text-xs text-center mb-3">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={cart.length === 0 || isSubmitting}
            className="w-full py-4 rounded-2xl font-bold uppercase tracking-[0.2em] transition-all disabled:opacity-50 text-black shadow-lg shadow-luxury-gold/20"
            style={{ background: GOLD_GRADIENT }}
          >
            {isSubmitting ? 'Processing...' : 'Place An Order'}
          </button>
        </div>
      </div>
      
      {/* ── CUSTOMIZATION MODAL ── */}
      <AnimatePresence>
        {customizingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-md">
             <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-md rounded-[2rem] overflow-hidden flex flex-col shadow-2xl bg-luxury-dark border border-luxury-border"
              >
                <div className="px-6 py-6 border-b border-luxury-border flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold font-serif text-luxury-text">{customizingItem.name}</h3>
                    <p className="text-[10px] uppercase tracking-widest mt-1 text-luxury-textDim">Adjust Ingredients</p>
                  </div>
                  <button onClick={() => setCustomizingItem(null)} className="opacity-50 hover:opacity-100 text-luxury-text"><UtensilsCrossed size={18} /></button>
                </div>
                
                <div className="p-6 max-h-[400px] overflow-y-auto space-y-3 custom-scrollbar">
                  {customizingItem.ingredients?.split(',').map((ing: string) => {
                    const name = ing.trim();
                    const isExcluded = excludedIngredients.includes(name);
                    return (
                      <label key={name} onClick={() => toggleIngredient(name)} className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer border transition-all ${
                        isExcluded 
                        ? 'border-luxury-border bg-transparent' 
                        : 'border-luxury-gold/20 bg-luxury-gold/5'
                      }`}>
                        <div className={`w-5 h-5 flex-shrink-0 rounded flex items-center justify-center border transition-all ${
                          isExcluded ? 'border-luxury-border bg-transparent' : 'border-luxury-gold bg-luxury-gold'
                        }`}>
                           {!isExcluded && <CheckCircle size={12} className="text-black" />}
                        </div>
                        <span className={`flex-1 text-sm font-bold uppercase tracking-widest ${
                          isExcluded ? 'text-luxury-textDim line-through' : 'text-luxury-text'
                        }`}>{name}</span>
                        {isExcluded && <span className="text-[9px] uppercase tracking-widest text-red-500 font-bold">Excluded</span>}
                      </label>
                    );
                  })}
                  
                  <div className="pt-4 mt-4 border-t border-luxury-border">
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-luxury-gold">Special Enquiries</label>
                    <textarea
                      value={itemInstructions}
                      onChange={e => setItemInstructions(e.target.value)}
                      placeholder="Extra spicy, allergy notes..."
                      className="w-full rounded-xl p-3 text-sm focus:outline-none resize-none h-20 bg-luxury-black border border-luxury-border text-luxury-text focus:border-luxury-gold"
                    />
                  </div>
                </div>
                
                <div className="p-6 border-t border-luxury-border bg-luxury-black/30">
                  <button onClick={confirmCustomizer} className="w-full py-3 rounded-xl font-bold uppercase tracking-widest text-sm text-black" style={{ background: GOLD_GRADIENT }}>
                    Confirm & Add
                  </button>
                </div>
              </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-lg rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl bg-luxury-dark border border-luxury-gold/30"
            >
              <div className="px-8 py-8 border-b border-luxury-border flex justify-between items-center bg-luxury-black/40">
                <div>
                  <h3 className="text-2xl font-bold font-serif text-luxury-text">Settle Experience</h3>
                  <p className="text-[11px] uppercase tracking-[0.3em] mt-1 text-luxury-gold font-bold">Secure Luxury Payment</p>
                </div>
                <button 
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors"
                >
                  <Plus size={20} className="rotate-45 opacity-50" />
                </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
                {/* Payment Methods Tabs */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'CARD', label: 'Credit Card', icon: <UtensilsCrossed size={16} /> },
                    { id: 'ROOM', label: 'Room Charge', icon: <CheckCircle size={16} /> },
                    { id: 'CASH', label: 'Counter Pay', icon: <Sun size={16} /> }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMethod(m.id as any)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                        selectedMethod === m.id 
                        ? 'bg-luxury-gold border-luxury-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.2)]' 
                        : 'bg-luxury-black border-luxury-border text-luxury-textDim hover:border-luxury-gold/50'
                      }`}
                    >
                      <span className="mb-2">{m.icon}</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest">{m.label}</span>
                    </button>
                  ))}
                </div>

                {/* Method Details */}
                <div className="space-y-6">
                  {selectedMethod === 'CARD' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <div className="p-6 rounded-2xl bg-gradient-to-br from-luxury-gray to-luxury-black border border-luxury-gold/20 shadow-inner relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-luxury-gold/10 transition-all" />
                        <div className="relative">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-luxury-gold mb-2 block">Card Number</label>
                          <input 
                            type="text" 
                            placeholder="xxxx xxxx xxxx xxxx"
                            className="w-full bg-transparent border-b border-luxury-border py-2 text-lg focus:outline-none focus:border-luxury-gold transition-all tracking-[0.2em]"
                            value={paymentDetails.cardNumber}
                            onChange={e => setPaymentDetails({...paymentDetails, cardNumber: e.target.value})}
                          />
                          <div className="flex gap-8 mt-6">
                            <div className="flex-1">
                              <label className="text-[8px] font-bold uppercase tracking-widest text-luxury-textDim mb-1 block">Expiry</label>
                              <input 
                                type="text" 
                                placeholder="MM / YY" 
                                className="w-full bg-transparent border-b border-luxury-border py-1 text-sm focus:outline-none focus:border-luxury-gold transition-all"
                                value={paymentDetails.expiry}
                                onChange={e => setPaymentDetails({...paymentDetails, expiry: e.target.value})}
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-[8px] font-bold uppercase tracking-widest text-luxury-textDim mb-1 block">CVC</label>
                              <input 
                                type="text" 
                                placeholder="***" 
                                className="w-full bg-transparent border-b border-luxury-border py-1 text-sm focus:outline-none focus:border-luxury-gold transition-all"
                                value={paymentDetails.cvc}
                                onChange={e => setPaymentDetails({...paymentDetails, cvc: e.target.value})}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-[9px] text-center text-luxury-textDim italic">Encrypted via Hotel Secure Systems</p>
                    </motion.div>
                  )}

                  {selectedMethod === 'ROOM' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <div className="p-6 rounded-2xl bg-luxury-black/40 border border-luxury-border space-y-4">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-luxury-textDim mb-2 block">Guest Name</label>
                          <input 
                            type="text" 
                            placeholder="Enter full name"
                            className="w-full bg-luxury-dark border border-luxury-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-luxury-gold transition-all"
                            value={paymentDetails.guestName}
                            onChange={e => setPaymentDetails({...paymentDetails, guestName: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-luxury-textDim mb-2 block">Room Number</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 101"
                            className="w-full bg-luxury-dark border border-luxury-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-luxury-gold transition-all"
                            value={paymentDetails.roomNumber}
                            onChange={e => setPaymentDetails({...paymentDetails, roomNumber: e.target.value})}
                          />
                        </div>
                      </div>
                      <p className="text-[9px] text-center text-luxury-textDim italic">Verification required at check-out</p>
                    </motion.div>
                  )}

                  {selectedMethod === 'CASH' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center p-8 rounded-2xl bg-luxury-gold/5 border border-dashed border-luxury-gold/50">
                      <p className="text-sm font-bold font-serif mb-2">Settle at the Counter</p>
                      <p className="text-[10px] text-luxury-textDim uppercase tracking-wide">Please proceed to our reception to complete your payment.</p>
                      <div className="mt-6 flex justify-center opacity-30">
                        <UtensilsCrossed size={40} className="text-luxury-gold" />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Total Recap */}
                <div className="p-6 rounded-3xl bg-luxury-black border border-luxury-border flex justify-between items-center mt-4 shadow-xl">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.3em] text-luxury-textDim font-bold">Grand Total</p>
                    <p className="text-3xl font-extrabold font-serif text-luxury-gold mt-1">${cartTotal.toFixed(2)}</p>
                  </div>
                  <div className="px-4 py-2 rounded-full border border-luxury-gold/20 bg-luxury-gold/5 text-[9px] font-bold text-luxury-gold uppercase tracking-widest">
                    Concierge Verified
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-luxury-border bg-luxury-black/60">
                <button 
                  onClick={handleFinalSubmit}
                  className="w-full py-5 rounded-[1.5rem] font-bold uppercase tracking-[0.3em] text-sm text-black transition-all hover:scale-[1.01] active:scale-[0.99] shadow-[0_10px_30px_rgba(212,175,55,0.2)]"
                  style={{ background: GOLD_GRADIENT }}
                >
                  Authorize Payment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── SUCCESS MODAL ── */}
      <AnimatePresence>
        {orderSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/90 backdrop-blur-xl">
            <motion.div
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               className="w-full max-w-sm rounded-[2rem] p-8 flex flex-col items-center text-center shadow-2xl bg-luxury-dark border border-luxury-gold"
             >
               <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-luxury-gold/10 border border-luxury-gold/20">
                 <CheckCircle size={32} className="text-luxury-gold" />
               </div>
               <h2 className="text-3xl font-extrabold mb-2 font-serif text-luxury-text">Order Placed</h2>
               <p className="text-xs mb-6 uppercase tracking-widest text-luxury-textDim">Your selection is being prepared.</p>
               
               <div className="w-full bg-luxury-black rounded-xl p-4 border border-luxury-border mb-6">
                 <p className="text-[10px] uppercase tracking-widest text-luxury-textDim">Reference Number</p>
                 <p className="font-bold text-lg text-luxury-gold tracking-widest">#{orderSuccess.slice(-6).toUpperCase()}</p>
                 <div className="h-[1px] w-full border-t border-dashed border-luxury-border my-3" />
                 <p className="text-[10px] uppercase tracking-widest text-luxury-textDim">Delivering to</p>
                 <p className="font-bold text-luxury-text">{sourceType} {sourceId}</p>
               </div>
               
               <button onClick={handleNewOrder} className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs text-black" style={{ background: GOLD_GRADIENT }}>
                 Explore More
               </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--lux-border); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--lux-gold); opacity: 0.5; }
      `}</style>
    </div>
  );
};
