import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  Globe, 
  Bell, 
  Shield,
  Save,
  Hotel
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [hotelName, setHotelName] = useState('Nora Luxury Resort');
  const [currency, setCurrency] = useState('USD');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('Settings saved successfully');
    }, 1000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">Settings</h1>
          <p className="text-gray-500 mt-1">Configure your dashboard and hotel preferences</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="btn-gold flex items-center space-x-2 px-6 py-3 rounded-xl disabled:opacity-50"
        >
          <Save size={18} />
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation */}
        <div className="space-y-2">
          {[
            { id: 'general', label: 'General', icon: SettingsIcon },
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'security', label: 'Security', icon: Lock },
            { id: 'localization', label: 'Localization', icon: Globe },
            { id: 'notifications', label: 'Notifications', icon: Bell },
          ].map((item) => (
            <button
              key={item.id}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                item.id === 'general' 
                ? 'bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/20' 
                : 'text-gray-400 hover:bg-luxury-gray/50 hover:text-gray-200'
              }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="card-luxury p-8 space-y-6">
            <div className="flex items-center space-x-3 text-luxury-gold border-b border-luxury-border pb-4">
              <Hotel size={20} />
              <h3 className="font-bold text-lg">Hotel Information</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2 block">Premium Venue Name</label>
                <input 
                  type="text" 
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  className="w-full bg-luxury-black border border-luxury-border rounded-lg px-4 py-3 text-sm focus:border-luxury-gold outline-none text-white" 
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2 block">Support Email</label>
                <input type="email" placeholder="concierge@nora-resort.com" className="w-full bg-luxury-black border border-luxury-border rounded-lg px-4 py-3 text-sm focus:border-luxury-gold outline-none text-white" />
              </div>
            </div>
          </div>

          <div className="card-luxury p-8 space-y-6">
            <div className="flex items-center space-x-3 text-luxury-gold border-b border-luxury-border pb-4">
              <Globe size={20} />
              <h3 className="font-bold text-lg">Localization</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2 block">Currency</label>
                <select 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-luxury-black border border-luxury-border rounded-lg px-4 py-3 text-sm focus:border-luxury-gold outline-none text-white"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AED">AED (د.إ)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2 block">Timezone</label>
                <select className="w-full bg-luxury-black border border-luxury-border rounded-lg px-4 py-3 text-sm focus:border-luxury-gold outline-none text-white">
                  <option>UTC +03:00 (Riyadh)</option>
                  <option>UTC +04:00 (Dubai)</option>
                  <option>UTC +00:00 (London)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card-luxury p-8 space-y-4 border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center space-x-3 text-emerald-500">
              <Shield size={20} />
              <h3 className="font-bold text-sm uppercase tracking-widest">Active Protection</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Your dashboard is currently secured with enterprise-grade encryption. All manual order modifications are logged for security audits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
