import React, { useEffect, useState, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import axios from 'axios';
import { useStore } from '../store/useStore';
import { Plus, Edit2, Trash2, Image as ImageIcon, Filter, Upload, X, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export const MenuPage: React.FC = () => {
  const { categories, fetchCategories, addItem, updateItem, deleteItem, addCategory, updateCategory, deleteCategory, searchQuery, showConfirm, user } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [activeMealType, setActiveMealType] = useState<string>('LUNCH');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Modals / Loading state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [catSearchQuery, setCatSearchQuery] = useState('');

  // Ingredient tag state
  const [ingredientTags, setIngredientTags] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const ingredientInputRef = useRef<HTMLInputElement>(null);

  const openItemModal = (item?: any) => {
    setEditingItem(item || null);
    setIngredientTags(item?.ingredients ? item.ingredients.split(',').map((s: string) => s.trim()).filter(Boolean) : []);
    setIngredientInput('');
    setSelectedFile(null);
    setIsItemModalOpen(true);
  };

  const addIngredientTag = () => {
    const val = ingredientInput.trim();
    if (val && !ingredientTags.includes(val)) {
      setIngredientTags(prev => [...prev, val]);
    }
    setIngredientInput('');
  };

  const removeIngredientTag = (tag: string) => {
    setIngredientTags(prev => prev.filter(t => t !== tag));
  };

  const handleIngredientKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addIngredientTag();
    } else if (e.key === 'Backspace' && ingredientInput === '' && ingredientTags.length > 0) {
      setIngredientTags(prev => prev.slice(0, -1));
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSaveItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    let imageUrl = formData.get('image') as string;

    if (selectedFile) {
      const uploadData = new FormData();
      uploadData.append('image', selectedFile);
      try {
        const res = await axios.post('http://localhost:3001/api/upload', uploadData);
        imageUrl = res.data.url;
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }

    // Flush any pending ingredient input
    const allTags = ingredientInput.trim()
      ? [...ingredientTags, ingredientInput.trim()]
      : ingredientTags;

    const itemData = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: parseFloat(formData.get('price') as string),
      image: imageUrl,
      ingredients: allTags.join(', '),
      categoryId: formData.get('categoryId'),
    };

    setIsSaving(true);
    try {
      if (editingItem) {
        await updateItem(editingItem.id, itemData);
      } else {
        await addItem(itemData);
      }
      setIsItemModalOpen(false);
      setEditingItem(null);
      setSelectedFile(null);
      setIngredientTags([]);
      setIngredientInput('');
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCat = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const catData = {
      name: formData.get('name'),
      mealType: formData.get('mealType'),
      order: parseInt(formData.get('order') as string) || 0,
    };

    setIsSaving(true);
    try {
      if (editingCat) {
        await updateCategory(editingCat.id, catData);
      } else {
        await addCategory(catData);
        setSelectedCategory('All Categories'); // Reset filter so new category is visible
      }
      setIsCatModalOpen(false);
      setEditingCat(null);
    } catch (err) {
      console.error('Category save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const mealTypes = [
    { id: 'BREAKFAST', label: 'Breakfast' },
    { id: 'LUNCH', label: 'Lunch' },
    { id: 'DINNER', label: 'Dinner' },
    { id: 'ALL', label: 'All-Day' }
  ];

  const handleDeleteItem = async (id: string) => {
    showConfirm(
      'Delete Menu Item',
      'Are you sure you want to permanently remove this selection from the menu?',
      () => deleteItem(id)
    );
  };

  const handleDeleteCat = async (id: string) => {
    showConfirm(
      'Delete Category',
      'Are you sure you want to delete this whole category? All items inside will be archived or removed.',
      () => deleteCategory(id)
    );
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-luxury-text font-serif">Menu Management</h1>
          <p className="text-luxury-textDim mt-1">Manage categories and premium selections</p>
        </div>
        
        {/* Meal Type Switcher */}
        <div className="bg-luxury-dark/50 p-1 rounded-xl border border-luxury-border flex">
          {mealTypes.map(mt => (
            <button
              key={mt.id}
              onClick={() => {
                setActiveMealType(mt.id);
                setSelectedCategory('All Categories');
              }}
              className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                activeMealType === mt.id 
                  ? 'bg-luxury-gold text-black shadow-lg shadow-luxury-gold/20' 
                  : 'text-luxury-textDim hover:text-luxury-text'
              }`}
            >
              {mt.label}
            </button>
          ))}
        </div>

        <div className="flex space-x-3">
          {user?.role === 'ADMIN' && (
            <>
              <button
                onClick={() => setIsCatModalOpen(true)}
                className="px-4 py-2 text-xs font-bold text-luxury-gold border border-luxury-gold/20 rounded-lg hover:bg-luxury-gold/5 transition-all uppercase tracking-widest"
              >
                Add Category
              </button>
              <button
                onClick={() => openItemModal()}
                className="btn-gold flex items-center space-x-2"
              >
                <Plus size={18} />
                <span>Add New Item</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-luxury-dark p-4 rounded-xl border border-luxury-border">

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter size={18} className="text-gray-500" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-luxury-black border border-luxury-border rounded-lg px-4 py-2 text-sm focus:border-luxury-gold outline-none cursor-pointer flex-1 md:flex-none"
          >
            <option>All Categories</option>
            {categories
              .filter(c => {
                const mt = c.mealType || 'ALL';
                return activeMealType === 'ALL' || mt === activeMealType || mt === 'ALL';
              })
              .map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        
        <div className="flex-1 relative group w-full md:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-textDim group-focus-within:text-luxury-gold transition-colors" size={16} />
          <input
            type="text"
            placeholder="Search categories..."
            value={catSearchQuery}
            onChange={e => setCatSearchQuery(e.target.value)}
            className="w-full bg-luxury-black/50 border border-luxury-border rounded-xl pl-10 pr-4 py-2 text-sm focus:border-luxury-gold outline-none transition-all"
          />
        </div>
      </div>

      {categories
        .filter(c => {
          const mt = c.mealType || 'ALL';
          return (activeMealType === 'ALL' || mt === activeMealType || mt === 'ALL');
        })
        .filter(c => selectedCategory === 'All Categories' || c.name === selectedCategory)
        .filter(c => c.name.toLowerCase().includes(catSearchQuery.toLowerCase()))
        .map((category, idx) => (
        <motion.div
          key={category.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-luxury-gold font-serif">{category.name}</h2>
            <span className={`text-[8px] px-2 py-0.5 rounded-full border border-luxury-gold/30 text-luxury-gold font-bold uppercase tracking-widest bg-luxury-gold/5`}>
              {category.mealType || 'ALL'}
            </span>
            {user?.role === 'ADMIN' && (
              <div className="flex space-x-2">
                <button
                  onClick={() => { setEditingCat(category); setIsCatModalOpen(true); }}
                  className="p-1.5 text-luxury-textDim hover:text-luxury-text transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDeleteCat(category.id)}
                  className="p-1.5 text-luxury-textDim hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
            <div className="h-px flex-1 bg-luxury-border opacity-30"></div>
            <p className="text-xs text-luxury-textDim uppercase tracking-widest">{category.items.length} Items</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {category.items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => (
              <div key={item.id} className="card-luxury p-0 overflow-hidden flex flex-col group">
                <div className="h-48 relative overflow-hidden bg-luxury-gray">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <ImageIcon size={48} />
                    </div>
                  )}
                  {user?.role === 'ADMIN' && (
                    <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openItemModal(item)}
                        className="p-2 bg-luxury-black rounded-full text-white hover:text-luxury-gold shadow-lg"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 bg-luxury-black rounded-full text-white hover:text-red-500 shadow-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white text-lg">{item.name}</h3>
                    <span className="text-luxury-gold font-bold text-lg font-serif tracking-tighter">${item.price.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">{item.description}</p>
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-luxury-border">
                    <span className="text-[10px] text-luxury-gold uppercase tracking-widest font-bold">In Stock</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={item.inStock !== false}
                        onChange={async (e) => {
                          await updateItem(item.id, { inStock: e.target.checked });
                        }}
                      />
                      <div className="w-11 h-6 bg-luxury-gray peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-luxury-gold"></div>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-luxury-black border border-luxury-border p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 font-serif">{editingItem ? 'Edit' : 'Add'} Menu Item</h2>
            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1 block">Name</label>
                <input name="name" defaultValue={editingItem?.name} required className="w-full bg-luxury-gray/20 border border-luxury-border rounded-lg px-4 py-2 text-white outline-none focus:border-luxury-gold" />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1 block">Description</label>
                <textarea name="description" defaultValue={editingItem?.description} className="w-full bg-luxury-gray/20 border border-luxury-border rounded-lg px-4 py-2 text-white outline-none focus:border-luxury-gold h-20" />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2 block">Ingredients</label>
                {/* Tag chip input */}
                <div
                  onClick={() => ingredientInputRef.current?.focus()}
                  className="w-full min-h-[48px] bg-luxury-gray/20 border border-luxury-border rounded-lg px-3 py-2 flex flex-wrap gap-2 cursor-text focus-within:border-luxury-gold transition-all"
                >
                  {ingredientTags.map(tag => (
                    <span key={tag} className="flex items-center space-x-1 bg-luxury-gold/15 border border-luxury-gold/30 text-luxury-gold text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                      <span>{tag}</span>
                      <button type="button" onClick={() => removeIngredientTag(tag)} className="text-luxury-gold/60 hover:text-luxury-gold ml-1">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                  <input
                    ref={ingredientInputRef}
                    type="text"
                    value={ingredientInput}
                    onChange={e => setIngredientInput(e.target.value)}
                    onKeyDown={handleIngredientKeyDown}
                    onBlur={addIngredientTag}
                    placeholder={ingredientTags.length === 0 ? 'Type ingredient, press Enter or comma...' : ''}
                    className="flex-1 min-w-[140px] bg-transparent text-white text-xs outline-none placeholder:text-gray-600"
                  />
                </div>
                <p className="text-[9px] text-gray-700 mt-1 uppercase tracking-widest font-bold">Press Enter or , after each ingredient</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1 block">Price ($)</label>
                  <input name="price" type="number" step="0.01" defaultValue={editingItem?.price} required className="w-full bg-luxury-gray/20 border border-luxury-border rounded-lg px-4 py-2 text-white outline-none focus:border-luxury-gold" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1 block">Category</label>
                  <select name="categoryId" defaultValue={editingItem?.categoryId} required className="w-full bg-luxury-gray/20 border border-luxury-border rounded-lg px-4 py-2 text-white outline-none focus:border-luxury-gold">
                    {categories
                      .filter(c => activeMealType === 'ALL' || c.mealType === activeMealType || c.mealType === 'ALL')
                      .map(c => <option key={c.id} value={c.id} className="bg-luxury-black">{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2 block">Item Image</label>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="imageUpload"
                    />
                    <label
                      htmlFor="imageUpload"
                      className={`w-full flex items-center justify-center space-x-3 border border-dashed rounded-xl px-4 py-4 cursor-pointer transition-all ${selectedFile
                        ? 'bg-luxury-gold/10 border-luxury-gold text-white shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                        : 'bg-luxury-gray/10 border-luxury-border text-gray-500 hover:border-luxury-gold/50'
                        }`}
                    >
                      <Upload size={18} className={selectedFile ? 'text-luxury-gold' : ''} />
                      <div className="text-left">
                        <p className="text-[10px] uppercase tracking-widest font-bold">{selectedFile ? 'Image Selected' : 'Choose Local File'}</p>
                        <p className="text-[9px] text-gray-600 truncate max-w-[200px]">{selectedFile ? selectedFile.name : 'Supports JPG, PNG, WEBP'}</p>
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="h-[1px] flex-1 bg-luxury-border/30"></div>
                    <span className="text-[8px] font-bold text-gray-700 uppercase tracking-[0.2em]">or use external url</span>
                    <div className="h-[1px] flex-1 bg-luxury-border/30"></div>
                  </div>

                  <div className="relative group">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-luxury-gold transition-colors" size={14} />
                    <input
                      name="image"
                      placeholder="https://images.unsplash.com/..."
                      defaultValue={editingItem?.image}
                      className="w-full bg-luxury-gray/10 border border-luxury-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-luxury-gold/50 transition-all placeholder:text-gray-700"
                    />
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setIsItemModalOpen(false)} className="flex-1 py-3 border border-luxury-border rounded-xl text-gray-400 font-bold uppercase tracking-widest text-[10px]">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-luxury-gold text-black rounded-xl font-bold uppercase tracking-widest text-[10px] disabled:opacity-50">
                  {isSaving ? 'Saving...' : 'Save Selection'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-luxury-black border border-luxury-border p-8 rounded-2xl w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 font-serif">{editingCat ? 'Edit' : 'Add'} Category</h2>
            <form onSubmit={handleSaveCat} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1 block">Category Name</label>
                <input name="name" defaultValue={editingCat?.name} required className="w-full bg-luxury-gray/20 border border-luxury-border rounded-lg px-4 py-2 text-white outline-none focus:border-luxury-gold" />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1 block">Meal Type</label>
                <select name="mealType" defaultValue={editingCat?.mealType || activeMealType} className="w-full bg-luxury-gray/20 border border-luxury-border rounded-lg px-4 py-2 text-white outline-none focus:border-luxury-gold">
                  {mealTypes.map(mt => <option key={mt.id} value={mt.id} className="bg-luxury-black">{mt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1 block">Display Order</label>
                <input name="order" type="number" defaultValue={editingCat?.order} className="w-full bg-luxury-gray/20 border border-luxury-border rounded-lg px-4 py-2 text-white outline-none focus:border-luxury-gold" />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setIsCatModalOpen(false)} className="flex-1 py-3 border border-luxury-border rounded-xl text-gray-400 font-bold uppercase tracking-widest text-[10px]">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-luxury-gold text-black rounded-xl font-bold uppercase tracking-widest text-[10px] disabled:opacity-50">
                  {isSaving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {categories.length === 0 && (
        <div className="py-20 text-center border-2 border-dashed border-luxury-border rounded-[2rem] bg-luxury-dark/20">
          <div className="w-16 h-16 bg-luxury-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
             <Plus className="text-luxury-gold" size={32} />
          </div>
          <h3 className="text-lg font-bold text-luxury-text font-serif">Begin Your Menu</h3>
          <p className="text-luxury-textDim text-sm max-w-xs mx-auto mt-2">Create your first category and add masterpieces to your luxury collection.</p>
          <button onClick={() => setIsCatModalOpen(true)} className="mt-6 px-6 py-2 bg-luxury-gold text-black rounded-lg font-bold text-xs uppercase tracking-widest">Add Category</button>
        </div>
      )}

      {categories.length > 0 && categories.filter(c => (activeMealType === 'ALL' || c.mealType === activeMealType || c.mealType === 'ALL')).filter(c => c.name.toLowerCase().includes(catSearchQuery.toLowerCase())).length === 0 && (
        <div className="py-20 text-center">
          <Search className="mx-auto mb-4 text-luxury-textDim opacity-20" size={48} />
          <p className="text-sm uppercase tracking-[0.2em] font-bold text-luxury-textDim">No matching categories found</p>
        </div>
      )}
    </div>
  );
};
