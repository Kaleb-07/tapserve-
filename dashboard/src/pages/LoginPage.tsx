import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Lock, User, Key, Loader2, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export const LoginPage: React.FC = () => {
  const { login } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxury-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-luxury-gold/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-luxury-gold/5 rounded-full blur-[120px]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-block p-4 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/20 mb-6 shadow-[0_0_30px_rgba(212,175,55,0.1)]"
          >
            <Lock className="text-luxury-gold" size={32} />
          </motion.div>
          <h1 className="text-3xl font-serif font-bold gold-text mb-2">NORA LUXE</h1>
          <p className="text-[10px] text-luxury-gold uppercase tracking-[0.3em] font-bold opacity-70">Administrative Gateway</p>
        </div>

        <div className="bg-luxury-dark/40 border border-luxury-border p-8 rounded-3xl backdrop-blur-xl shadow-2xl relative">
          <div className="absolute top-0 right-0 p-4">
             <Star className="text-luxury-gold/20 animate-pulse" size={14} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-luxury-gold transition-colors" size={18} />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-luxury-gray/10 border border-luxury-border rounded-xl pl-12 pr-4 py-4 text-white outline-none focus:border-luxury-gold/50 transition-all placeholder:text-gray-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1">Password</label>
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-luxury-gold transition-colors" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-luxury-gray/10 border border-luxury-border rounded-xl pl-12 pr-4 py-4 text-white outline-none focus:border-luxury-gold/50 transition-all placeholder:text-gray-700"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-luxury-gold text-black py-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg hover:shadow-luxury-gold/20 transition-all active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <span>Initialize Dashboard</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-[9px] text-gray-600 uppercase tracking-[0.2em]">
          Secure Session &copy; 2026 LUXURY QR MENU SYSTEM
        </p>
      </motion.div>
    </div>
  );
};
