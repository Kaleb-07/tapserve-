import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Edit, Trash2, X } from 'lucide-react';
import { useStore } from '../store/useStore';

export const StaffManagementPage: React.FC = () => {
  const { users, fetchUsers, addUser, updateUser, deleteUser, user: currentUser } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    role: 'WAITER'
  });

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenModal = (user: any = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({ username: user.username, name: user.name || '', password: '', role: user.role });
    } else {
      setEditingUser(null);
      setFormData({ username: '', name: '', password: '', role: 'WAITER' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Exclude the username to prevent changing it unecessarily or let the API handle it if not allowed.
        const updateData: any = { name: formData.name, role: formData.role };
        if (formData.password) updateData.password = formData.password;
        await updateUser(editingUser.id, updateData);
      } else {
        await addUser(formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save user');
    }
  };

  const handleDelete = async (id: string) => {
    if (id === currentUser?.id) {
      alert("You cannot delete yourself.");
      return;
    }
    if (confirm("Are you sure you want to permanently remove this staff member?")) {
      await deleteUser(id);
    }
  };

  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-serif font-extrabold gold-text">Staff Management</h1>
          <p className="text-sm text-luxury-textDim mt-2">Manage personnel access and roles.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-black shadow-lg shadow-luxury-gold/20 transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f1d592 50%, #aa8d2e 100%)' }}
        >
          <Plus size={18} />
          <span>Add Staff</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u, idx) => (
          <motion.div
            key={u.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex flex-col p-6 rounded-2xl bg-luxury-dark border border-luxury-border relative group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center">
                <Users size={20} className="text-luxury-gold" />
              </div>
              <div className="space-x-2">
                <button onClick={() => handleOpenModal(u)} className="p-2 rounded-lg bg-luxury-black border border-luxury-border text-luxury-textDim hover:text-luxury-gold transition-colors">
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDelete(u.id)} className="p-2 rounded-lg bg-luxury-black border border-luxury-border text-luxury-textDim hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <h3 className="text-xl font-bold font-serif">{u.name || u.username}</h3>
            <p className="text-sm text-luxury-textDim mt-1">@{u.username}</p>
            
            <div className="mt-4 inline-block px-3 py-1 rounded-full border border-luxury-gold/30 bg-luxury-gold/5 w-max">
              <p className="text-[10px] uppercase tracking-widest font-bold text-luxury-gold">
                {u.role}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-luxury-dark border border-luxury-border rounded-[2rem] overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-6 border-b border-luxury-border flex justify-between items-center bg-luxury-black/30">
                <h2 className="text-2xl font-serif font-bold text-luxury-text">
                  {editingUser ? 'Edit Staff' : 'Add New Staff'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-luxury-textDim hover:text-luxury-text">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-luxury-textDim mb-2">Username</label>
                  <input
                    required
                    disabled={!!editingUser}
                    type="text"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-luxury-black border border-luxury-border rounded-xl px-4 py-3 text-sm focus:border-luxury-gold outline-none text-luxury-text disabled:opacity-50"
                  />
                </div>
                
                <div>
                  <label className="block text-xs uppercase tracking-widest text-luxury-textDim mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-luxury-black border border-luxury-border rounded-xl px-4 py-3 text-sm focus:border-luxury-gold outline-none text-luxury-text"
                  />
                </div>
                
                <div>
                  <label className="block text-xs uppercase tracking-widest text-luxury-textDim mb-2">
                    {editingUser ? 'New Password (leave empty to keep current)' : 'Password'}
                  </label>
                  <input
                    required={!editingUser}
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-luxury-black border border-luxury-border rounded-xl px-4 py-3 text-sm focus:border-luxury-gold outline-none text-luxury-text"
                  />
                </div>
                
                <div>
                  <label className="block text-xs uppercase tracking-widest text-luxury-textDim mb-2">Role</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-luxury-black border border-luxury-border rounded-xl px-4 py-3 text-sm focus:border-luxury-gold outline-none text-luxury-text appearance-none"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="WAITER">WAITER</option>
                    <option value="CHEF">CHEF</option>
                  </select>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-black transition-all hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f1d592 50%, #aa8d2e 100%)' }}
                  >
                    {editingUser ? 'Save Updates' : 'Create Staff'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
