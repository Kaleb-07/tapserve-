import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { User as UserIcon, Lock, Save } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useStore();
  
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setMessage({ text: '', type: '' });
    setIsSubmitting(true);
    
    try {
      const updateData: any = { name };
      if (password) {
        updateData.password = password;
      }
      
      await updateUser(user.id, updateData);
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setPassword('');
 // Clear password field after successful updated
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error || 'Failed to update profile', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 pb-32 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-extrabold gold-text">My Profile</h1>
        <p className="text-sm text-luxury-textDim mt-2">Manage your account settings and credentials.</p>
      </div>

      <div className="bg-luxury-dark border border-luxury-border rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center space-x-4 mb-8 pb-8 border-b border-luxury-border">
          <div className="w-16 h-16 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center flex-shrink-0">
            <UserIcon size={32} className="text-luxury-gold" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-serif text-luxury-text">{user?.username}</h2>
            <div className="inline-block px-3 py-1 mt-2 rounded-full border border-luxury-gold/30 bg-luxury-gold/5">
              <p className="text-[10px] uppercase tracking-widest font-bold text-luxury-gold">
                {user?.role}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-luxury-textDim mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-luxury-black border border-luxury-border rounded-xl px-4 py-3 focus:border-luxury-gold outline-none text-luxury-text transition-colors"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-luxury-textDim mb-2">New Password <span className="text-luxury-textDim/50 lowercase">(leave empty to keep current)</span></label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-textDim" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-luxury-black border border-luxury-border rounded-xl pl-12 pr-4 py-3 focus:border-luxury-gold outline-none text-luxury-text transition-colors"
                placeholder="Enter new password"
              />
            </div>
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {message.text}
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-black transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center space-x-2 shadow-lg shadow-luxury-gold/10"
              style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f1d592 50%, #aa8d2e 100%)' }}
            >
              <Save size={18} />
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
