import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Plus, Minus, ChevronRight, ChevronLeft,
  ShoppingCart, Home, Star, MapPin, Loader2, UtensilsCrossed, User, ArrowRight, DollarSign
} from 'lucide-react';
import { useStore } from '../store/useStore';

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({ isOpen, onClose }) => {
  const { categories, fetchCategories, fetchItems, createOrder } = useStore();
  const [step, setStep] = useState(1);
  const [sourceType, setSourceType] = useState('Table');
  const [sourceId, setSourceId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customizingItem, setCustomizingItem] = useState<any>(null);
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'UNPAID'>('UNPAID');

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchItems();
      setStep(1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (categories.length > 0 && activeCategory === 'all') {
      // keep 'all' as default
    }
  }, [categories]);

  const handleReset = () => {
    setStep(1);
    setCart([]);
    setSourceId('');
    setSourceType('Table');
    setOrderNotes('');
    setSearchTerm('');
    setActiveCategory('all');
    setPaymentStatus('UNPAID');
    setError(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleItemClick = (item: any) => {
    addToCart(item, []);
  };

  const addToCart = (item: any, excluded: string[]) => {
    if (customizingItem && customizingItem.cartId) {
      setCart(cart.map(i =>
        i.cartId === customizingItem.cartId
          ? { ...i, excludedIngredients: excluded }
          : i
      ));
    } else {
      // Check if item already in cart
      const existing = cart.find(i => i.id === item.id && JSON.stringify(i.excludedIngredients) === JSON.stringify(excluded));
      if (existing) {
        setCart(cart.map(i => i.cartId === existing.cartId ? { ...i, quantity: i.quantity + 1 } : i));
      } else {
        const cartItem = {
          ...item,
          cartId: Math.random().toString(36).substr(2, 9),
          quantity: 1,
          excludedIngredients: excluded
        };
        setCart(prev => [...prev, cartItem]);
      }
    }
    setCustomizingItem(null);
    setExcludedIngredients([]);
  };

  const toggleIngredient = (name: string) => {
    setExcludedIngredients(prev =>
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    );
  };

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter(i => i.cartId !== cartId));
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(cart.map(i =>
      i.cartId === cartId
        ? { ...i, quantity: Math.max(1, i.quantity + delta) }
        : i
    ).filter(i => i.quantity > 0));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getFilteredItems = () => {
    const allItems = categories.flatMap(c => c.items.map(i => ({ ...i, categoryName: c.name })));
    return allItems
      .filter(i => i.inStock !== false)
      .filter(i => activeCategory === 'all' || i.categoryId === activeCategory)
      .filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const handleSubmit = async () => {
    if (!sourceId.trim()) {
      setError('Please enter a table/room number');
      return;
    }
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const orderData = {
        sourceType,
        sourceId,
        items: cart.map(i => ({
          menuItemId: i.id,
          quantity: i.quantity,
          price: i.price,
          customizations: i.excludedIngredients?.length > 0
            ? JSON.stringify({ "Excluded": i.excludedIngredients })
            : null
        })),
        totalPrice: calculateTotal(),
        notes: orderNotes,
        paymentStatus
      };
      await createOrder(orderData);
      handleClose();
    } catch (err) {
      console.error(err);
      setError('Failed to create order. Please check connections.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const stepTitles = ['Choose Items', 'Choose Location', 'Review & Place'];
  const filteredItems = getFilteredItems();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-luxury-black/90 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-luxury-black border border-luxury-border w-full max-w-5xl h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.6)]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-luxury-border flex justify-between items-center bg-luxury-gray/10 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-luxury-gold/10 flex items-center justify-center text-luxury-gold border border-luxury-gold/20">
              <UtensilsCrossed size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-luxury-text font-serif tracking-tight">New Manual Order</h2>
              <div className="flex items-center space-x-2 mt-0.5">
                {[1, 2, 3].map(s => (
                  <div key={s} className="flex items-center space-x-1">
                    <div className={`flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold transition-all ${
                      step === s ? 'bg-luxury-gold text-black' :
                      step > s ? 'bg-luxury-gold/30 text-luxury-gold' :
                      'bg-luxury-border text-gray-600'
                    }`}>{step > s ? '✓' : s}</div>
                    <span className={`text-[9px] uppercase tracking-widest font-bold ${step === s ? 'text-luxury-gold' : 'text-gray-600'}`}>
                      {stepTitles[s - 1]}
                    </span>
                    {s < 3 && <ChevronRight size={10} className="text-gray-700" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-luxury-gray/30">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border-y border-red-500/20 px-6 py-2 text-red-400 text-xs font-bold text-center flex-shrink-0">
            {error}
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              {/* ============ STEP 1: MENU SELECTION ============ */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  {/* Search + Category Tabs */}
                  <div className="px-6 py-4 space-y-3 flex-shrink-0 border-b border-luxury-border/40">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                      <input
                        type="text"
                        placeholder="Search menu items..."
                        className="w-full bg-luxury-gray/20 border border-luxury-border rounded-xl pl-11 pr-4 py-2.5 text-sm text-luxury-text focus:outline-none focus:border-luxury-gold transition-all placeholder:text-luxury-textDim"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    {/* Category Tabs */}
                    <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
                      <button
                        onClick={() => setActiveCategory('all')}
                        className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${
                          activeCategory === 'all'
                            ? 'bg-luxury-gold text-black shadow-[0_0_12px_rgba(212,175,55,0.3)]'
                            : 'border border-luxury-border text-gray-400 hover:border-luxury-gold/40 hover:text-gray-200'
                        }`}
                      >
                        All
                      </button>
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setActiveCategory(cat.id)}
                          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${
                            activeCategory === cat.id
                              ? 'bg-luxury-gold text-black shadow-[0_0_12px_rgba(212,175,55,0.3)]'
                              : 'border border-luxury-border text-gray-400 hover:border-luxury-gold/40 hover:text-gray-200'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Items Grid */}
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {filteredItems.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                        <UtensilsCrossed size={48} className="mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest">No items found</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredItems.map(item => {
                          const cartQty = cart.filter(c => c.id === item.id).reduce((s, c) => s + c.quantity, 0);
                          return (
                            <motion.div
                              key={item.id}
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="group relative bg-luxury-gray/10 border border-luxury-border rounded-2xl overflow-hidden hover:border-luxury-gold/40 transition-all duration-300 flex flex-col"
                            >
                              {/* Image */}
                              <div className="h-36 relative overflow-hidden bg-luxury-black flex-shrink-0">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-700">
                                    <UtensilsCrossed size={32} />
                                  </div>
                                )}
                                {/* Category badge */}
                                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 rounded-full text-[9px] font-bold text-luxury-gold uppercase tracking-widest backdrop-blur-sm">
                                  {item.categoryName}
                                </div>
                                {cartQty > 0 && (
                                  <div className="absolute top-2 right-2 w-6 h-6 bg-luxury-gold text-black rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                                    {cartQty}
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="p-4 flex flex-col flex-1">
                                <div className="flex-1">
                                  <h4 className="font-bold text-luxury-text text-sm leading-tight mb-1">{item.name}</h4>
                                  {item.description && (
                                    <p className="text-[11px] text-luxury-textDim line-clamp-2 leading-relaxed">{item.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                  <span className="text-luxury-gold font-bold text-base font-serif">${item.price.toFixed(2)}</span>
                                  <button
                                    onClick={() => handleItemClick(item)}
                                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold rounded-xl text-[11px] font-bold hover:bg-luxury-gold hover:text-black transition-all duration-200"
                                  >
                                    <Plus size={13} />
                                    <span>Add</span>
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ============ STEP 2: LOCATION ============ */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 overflow-y-auto p-8 custom-scrollbar"
                >
                  <div className="max-w-lg mx-auto space-y-8">
                    <div>
                      <h3 className="text-xl font-bold text-luxury-text font-serif mb-2">Where are you ordering for?</h3>
                      <p className="text-sm text-luxury-textDim">Select the location type and enter the identifier.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: 'Table', icon: MapPin, label: 'Table', desc: 'Dining area table' },
                        { id: 'Room', icon: Home, label: 'Room', desc: 'Hotel room service' },
                        { id: 'VIP', icon: Star, label: 'VIP Lounge', desc: 'Exclusive VIP area' },
                        { id: 'Staff', icon: User, label: 'Staff', desc: 'Staff meal request' },
                      ].map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setSourceType(type.id)}
                          className={`p-6 rounded-2xl border transition-all flex flex-col items-center text-center space-y-3 ${
                            sourceType === type.id
                              ? 'border-luxury-gold bg-luxury-gold/10 text-luxury-gold shadow-[0_0_20px_rgba(212,175,55,0.15)]'
                              : 'border-luxury-border bg-luxury-gray/10 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                          }`}
                        >
                          <div className={`p-3 rounded-xl ${sourceType === type.id ? 'bg-luxury-gold/20' : 'bg-luxury-black/50'}`}>
                            <type.icon size={24} />
                          </div>
                          <div>
                            <span className="block text-xs font-bold uppercase tracking-widest">{type.label}</span>
                            <span className="block text-[10px] text-gray-600 mt-0.5">{type.desc}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                        {sourceType === 'Table' ? 'Table Number' :
                         sourceType === 'Room' ? 'Room Number' :
                         sourceType === 'VIP' ? 'VIP Area / Name' : 'Staff Name / ID'}
                      </label>
                      <input
                        type="text"
                        required
                        value={sourceId}
                        onChange={(e) => { setSourceId(e.target.value); setError(null); }}
                        placeholder={
                          sourceType === 'Table' ? 'e.g. 12' :
                          sourceType === 'Room' ? 'e.g. 204' :
                          sourceType === 'VIP' ? 'e.g. Suite A' : 'e.g. Ahmed'
                        }
                        className="w-full bg-luxury-gray/20 border border-luxury-border rounded-2xl px-6 py-4 text-luxury-text text-xl font-bold focus:outline-none focus:border-luxury-gold transition-all placeholder:text-luxury-textDim font-serif"
                      />
                      {sourceId && (
                        <p className="mt-3 text-xs text-luxury-gold/70 font-bold uppercase tracking-widest">
                          ✓ Order will be sent to {sourceType} {sourceId}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ============ STEP 3: REVIEW ============ */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 overflow-y-auto p-8 custom-scrollbar"
                >
                  <div className="max-w-2xl mx-auto space-y-6">
                    <h3 className="text-xl font-bold text-luxury-text font-serif">Review Order</h3>

                    {/* Location Summary */}
                    <div className="flex items-center justify-between p-4 bg-luxury-gold/5 border border-luxury-gold/20 rounded-2xl">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-luxury-gold/20 rounded-lg text-luxury-gold">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] text-luxury-gold uppercase tracking-widest font-bold">{sourceType}</p>
                          <p className="text-sm font-bold text-luxury-text">{sourceId}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setStep(2)}
                        className="text-xs text-luxury-gold font-bold uppercase tracking-widest hover:underline"
                      >
                        Change
                      </button>
                    </div>

                    {/* Items List */}
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.cartId} className="flex items-center justify-between p-4 bg-luxury-gray/10 border border-luxury-border rounded-2xl">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-luxury-black border border-luxury-border flex-shrink-0">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-700">
                                  <UtensilsCrossed size={18} />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-luxury-text text-sm">{item.name}</p>
                              {item.excludedIngredients && item.excludedIngredients.length > 0 && (
                                <p className="text-[10px] text-red-400 italic mt-0.5 font-bold uppercase tracking-widest">
                                  NO {item.excludedIngredients.join(' • NO ')}
                                </p>
                              )}
                              <p className="text-[10px] text-luxury-textDim mt-0.5">Unit: ${item.price.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            {item.ingredients && (
                              <button
                                onClick={() => {
                                  setCustomizingItem(item);
                                  setExcludedIngredients(item.excludedIngredients || []);
                                }}
                                className="text-[10px] font-bold text-luxury-gold uppercase tracking-widest px-3 py-1 bg-luxury-gold/10 border border-luxury-gold/20 rounded-lg hover:bg-luxury-gold/20 transition-all"
                              >
                                Edit
                              </button>
                            )}
                            <div className="flex items-center space-x-2 bg-luxury-black p-1.5 rounded-lg border border-luxury-border">
                              <button onClick={() => updateQuantity(item.cartId, -1)} className="p-1 text-luxury-textDim hover:text-luxury-text">
                                <Minus size={13} />
                              </button>
                              <span className="text-sm font-bold text-luxury-text min-w-[20px] text-center">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.cartId, 1)} className="p-1 text-luxury-textDim hover:text-luxury-text">
                                <Plus size={13} />
                              </button>
                            </div>
                            <p className="font-bold text-luxury-text font-serif w-16 text-right">${(item.price * item.quantity).toFixed(2)}</p>
                            <button onClick={() => removeFromCart(item.cartId)} className="text-luxury-textDim hover:text-red-500 transition-colors">
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Payment Toggle */}
                    <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${paymentStatus === 'PAID' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          <DollarSign size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Payment Status</p>
                          <p className={`text-sm font-bold ${paymentStatus === 'PAID' ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {paymentStatus === 'PAID' ? 'Already Received' : 'Collect on Delivery'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setPaymentStatus(prev => prev === 'PAID' ? 'UNPAID' : 'PAID')}
                        className={`px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all ${
                          paymentStatus === 'PAID'
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                          : 'border border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold/5'
                        }`}
                      >
                        {paymentStatus === 'PAID' ? '✓ Marked as Paid' : 'Mark as Paid'}
                      </button>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                        Special Instructions (optional)
                      </label>
                      <textarea
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="e.g. Allergies, special requests, gift notes..."
                        className="w-full bg-luxury-black/10 border border-luxury-border rounded-2xl p-4 text-sm text-luxury-text placeholder:text-luxury-textDim focus:border-luxury-gold/50 outline-none transition-all resize-none h-24"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Cart Summary */}
          <div className="w-72 border-l border-luxury-border bg-luxury-black/50 p-5 flex flex-col flex-shrink-0">
            <div className="flex items-center space-x-2 text-luxury-gold mb-6">
              <ShoppingCart size={18} />
              <h3 className="text-xs font-bold uppercase tracking-widest">Cart</h3>
              {cart.length > 0 && (
                <span className="ml-auto w-5 h-5 bg-luxury-gold text-black rounded-full text-[10px] font-bold flex items-center justify-center">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
              {cart.map(item => (
                <div key={item.cartId} className="flex items-start justify-between text-sm group">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center">
                      <span className="text-luxury-gold font-bold mr-1.5 text-xs">{item.quantity}×</span>
                      <span className="text-gray-300 text-xs truncate">{item.name}</span>
                    </div>
                    {item.excludedIngredients && item.excludedIngredients.length > 0 && (
                      <p className="text-[9px] text-red-400/80 italic pl-4 font-bold uppercase leading-tight">
                        NO {item.excludedIngredients.join(' • NO ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className="text-luxury-text text-xs font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                    <button
                      onClick={() => removeFromCart(item.cartId)}
                      className="text-luxury-textDim hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-12">
                  <ShoppingCart size={36} className="mb-3" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Empty cart</p>
                  <p className="text-[9px] text-gray-600 mt-1">Add items from the menu</p>
                </div>
              )}
            </div>

            {/* Total & Navigation */}
            <div className="mt-6 pt-5 border-t border-luxury-border space-y-4">
              {cart.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-luxury-textDim uppercase tracking-widest font-bold">Total</span>
                  <span className="text-xl font-serif font-bold text-luxury-gold">${calculateTotal().toFixed(2)}</span>
                </div>
              )}

              <div className="flex space-x-2">
                {step > 1 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="p-3 border border-luxury-border rounded-xl text-gray-400 hover:bg-luxury-gray/10 transition-all"
                  >
                    <ChevronLeft size={18} />
                  </button>
                )}
                {step < 3 ? (
                  <button
                    disabled={step === 1 && cart.length === 0}
                    onClick={() => setStep(step + 1)}
                    className="flex-1 py-3 bg-luxury-gold text-black rounded-xl font-bold text-xs tracking-widest uppercase flex items-center justify-center space-x-2 disabled:opacity-40 hover:bg-luxury-goldLight transition-all"
                  >
                    <span>{step === 1 ? 'Choose Location' : 'Review Order'}</span>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || cart.length === 0}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs tracking-widest uppercase flex items-center justify-center space-x-2 hover:bg-emerald-500 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <span>Place Order</span>}
                  </button>
                )}
              </div>
              {step === 1 && cart.length === 0 && (
                <p className="text-[9px] text-center text-gray-600 uppercase tracking-widest font-bold">Add items to continue</p>
              )}
            </div>
          </div>
        </div>

        {/* Ingredients Overlay */}
        {customizingItem && (
          <div className="absolute inset-0 z-[60] bg-black/95 flex items-center justify-center p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-luxury-black border border-luxury-border w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-luxury-border flex justify-between items-center bg-luxury-gray/10">
                <div>
                  <h3 className="text-xl font-bold text-luxury-text font-serif">{customizingItem.name}</h3>
                  <p className="text-xs text-luxury-textDim uppercase tracking-widest font-bold mt-1">
                    Uncheck ingredients to exclude from the dish
                  </p>
                </div>
                <button onClick={() => setCustomizingItem(null)} className="p-2 text-gray-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-2">
                  {customizingItem.ingredients?.split(',').map((ing: string) => {
                    const name = ing.trim();
                    const isExcluded = excludedIngredients.includes(name);
                    const isIncluded = !isExcluded;
                    return (
                      <label
                        key={name}
                        className={`flex items-center space-x-4 p-4 rounded-xl border cursor-pointer transition-all select-none ${
                          isIncluded
                            ? 'bg-luxury-gold/5 border-luxury-gold/40 hover:bg-luxury-gold/10'
                            : 'bg-luxury-gray/5 border-luxury-border/50 hover:bg-luxury-gray/10 opacity-60'
                        }`}
                      >
                        {/* Custom checkbox */}
                        <div
                          onClick={() => toggleIngredient(name)}
                          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            isIncluded
                              ? 'bg-luxury-gold border-luxury-gold'
                              : 'bg-transparent border-luxury-border'
                          }`}
                        >
                          {isIncluded && (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4L3.5 6.5L9 1" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <span
                          onClick={() => toggleIngredient(name)}
                          className={`flex-1 text-sm font-bold uppercase tracking-wider ${
                            isIncluded ? 'text-luxury-text' : 'text-luxury-textDim line-through'
                          }`}
                        >
                          {name}
                        </span>
                        {!isIncluded && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-red-500/70">Excluded</span>
                        )}
                      </label>
                    );
                  })}
                </div>
                {excludedIngredients.length > 0 && (
                  <div className="mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
                      Will exclude: {excludedIngredients.join(' • ')}
                    </p>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-luxury-border bg-luxury-gray/5 flex space-x-4">
                <button onClick={() => setCustomizingItem(null)} className="flex-1 py-3 text-gray-400 font-bold uppercase tracking-widest text-xs border border-luxury-border rounded-2xl hover:bg-luxury-gray/5 transition-all">
                  Cancel
                </button>
                <button
                  onClick={() => addToCart(customizingItem, excludedIngredients)}
                  className="flex-1 py-3 bg-luxury-gold text-black font-bold uppercase tracking-widest text-xs rounded-2xl hover:bg-luxury-goldLight transition-all"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
