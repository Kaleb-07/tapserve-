import React, { useState } from 'react';
import {
  Globe, 
  Save,
  Hotel,
  QrCode,
  Download
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useStore } from '../store/useStore';

export const SettingsPage: React.FC = () => {
  const { settings, fetchSettings, updateSettings, showNotification } = useStore();
  const [hotelName, setHotelName] = useState('NORA LUXE');
  const [currency, setCurrency] = useState('USD');
  const [supportEmail, setSupportEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // QR Generator State
  const [qrType, setQrType] = useState('Table');
  const [qrId, setQrId] = useState('1');

  React.useEffect(() => {
    fetchSettings();
  }, []);

  React.useEffect(() => {
    if (settings) {
      setHotelName(settings.hotelName || 'NORA LUXE');
      setCurrency(settings.currency || 'USD');
      setSupportEmail(settings.supportEmail || '');
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({ hotelName, currency, supportEmail });
      showNotification('Settings saved successfully', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Unknown error';
      showNotification(`Failed to save settings: ${msg}`, 'error');
      console.error('Settings save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const downloadQR = () => {
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    let downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `qr-${qrType}-${qrId}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const qrValue = `${window.location.origin}/?type=${qrType}&id=${qrId}`;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-luxury-text font-serif">Settings</h1>
          <p className="text-luxury-textDim mt-1">Configure your dashboard and hotel preferences</p>
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

      <div className="max-w-xl space-y-6">
        {/* Content */}
          <div className="card-luxury p-8 space-y-6">
            <div className="flex items-center space-x-3 text-luxury-gold border-b border-luxury-border pb-4">
              <Hotel size={20} />
              <h3 className="font-bold text-lg">Hotel Information</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-luxury-textDim uppercase tracking-widest font-bold mb-2 block">Premium Venue Name</label>
                <input 
                  type="text" 
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  className="w-full bg-luxury-black border border-luxury-border rounded-lg px-4 py-3 text-sm focus:border-luxury-gold outline-none text-luxury-text" 
                />
              </div>
              <div>
                <label className="text-[10px] text-luxury-textDim uppercase tracking-widest font-bold mb-2 block">Support Email</label>
                <input 
                  type="email" 
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="concierge@nora-resort.com" 
                  className="w-full bg-luxury-black border border-luxury-border rounded-lg px-4 py-3 text-sm focus:border-luxury-gold outline-none text-luxury-text" 
                />
              </div>
            </div>
          </div>

          {/* QR Code Management */}
          <div className="card-luxury p-8 space-y-6">
            <div className="flex items-center space-x-3 text-luxury-gold border-b border-luxury-border pb-4">
              <QrCode size={20} />
              <h3 className="font-bold text-lg">QR Code Management</h3>
            </div>
            
            <p className="text-sm text-luxury-textDim">
              Generate location-specific QR codes for your tables, rooms, or VIP areas.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-luxury-textDim uppercase tracking-widest font-bold mb-2 block">Location Type</label>
                <select 
                  value={qrType}
                  onChange={(e) => setQrType(e.target.value)}
                  className="w-full bg-luxury-black border border-luxury-border rounded-lg px-4 py-3 text-sm focus:border-luxury-gold outline-none text-luxury-text"
                >
                  <option value="Table">Table</option>
                  <option value="Room">Room</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-luxury-textDim uppercase tracking-widest font-bold mb-2 block">Identifier (ID)</label>
                <input 
                  type="text" 
                  value={qrId}
                  onChange={(e) => setQrId(e.target.value)}
                  placeholder="e.g. 101, Suite A"
                  className="w-full bg-luxury-black border border-luxury-border rounded-lg px-4 py-3 text-sm focus:border-luxury-gold outline-none text-luxury-text" 
                />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-8 bg-luxury-black/50 rounded-2xl border border-luxury-border/50 space-y-4">
              <div className="bg-white p-4 rounded-xl shadow-2xl">
                <QRCodeCanvas 
                  id="qr-canvas"
                  value={qrValue} 
                  size={200}
                  level={"H"}
                  includeMargin={false}
                />
              </div>
              <div className="text-center">
                <p className="text-[10px] text-luxury-gold font-bold uppercase tracking-widest mb-1">{qrType} {qrId}</p>
                <p className="text-[9px] text-luxury-textDim break-all max-w-[200px] leading-relaxed mb-4">
                  {qrValue}
                </p>
                <button 
                  onClick={downloadQR}
                  className="flex items-center space-x-2 px-6 py-2 rounded-lg bg-luxury-gold/10 border border-luxury-gold/20 text-luxury-gold text-xs font-bold uppercase tracking-widest hover:bg-luxury-gold/20 transition-all"
                >
                  <Download size={14} />
                  <span>Download Image</span>
                </button>
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
                <label className="text-[10px] text-luxury-textDim uppercase tracking-widest font-bold mb-2 block">Currency</label>
                <select 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-luxury-black border border-luxury-border rounded-lg px-4 py-3 text-sm focus:border-luxury-gold outline-none text-luxury-text"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AED">AED (د.إ)</option>
                  <option value="ETB">ETB (Br)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-luxury-textDim uppercase tracking-widest font-bold mb-2 block">Timezone</label>
                <select className="w-full bg-luxury-black border border-luxury-border rounded-lg px-4 py-3 text-sm focus:border-luxury-gold outline-none text-luxury-text">
                  <option>UTC +03:00 (Riyadh)</option>
                  <option>UTC +04:00 (Dubai)</option>
                  <option>UTC +00:00 (London)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};
