import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Receipt, CreditCard, Banknote, UploadCloud, CheckCircle2, FileText, Loader2, DollarSign } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Order } from '../types';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
  tableOrders: Order[];
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, tableId, tableOrders }) => {
  const { updateOrderDetails } = useStore();
  const [discount, setDiscount] = useState<number>(0);
  const [serviceCharge, setServiceCharge] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('CARD');
  const [paymentStatus, setPaymentStatus] = useState<string>('PAID');
  const [amountPaid, setAmountPaid] = useState<number | ''>('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const allItems = tableOrders.flatMap(o => o.items || []);
  const subTotal = tableOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const flatDiscount = discount || 0;
  const taxAmount = (subTotal - flatDiscount) * 0.10;
  const totalDue = (subTotal - flatDiscount) + serviceCharge + taxAmount;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Image must be smaller than 5MB"); return; }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setProofImage(base64);
      setIsUploading(true);
      try {
        const token = localStorage.getItem('luxury_token');
        const res = await axios.post(`${API_URL}/upload-base64`, { image: base64, prefix: 'receipt' }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProofUrl(res.data.url);
      } catch (err) {
        console.error("Failed to upload proof", err);
        setProofImage(null);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const processCheckout = async () => {
    setIsSubmitting(true);
    try {
      const paidValue = amountPaid === '' ? totalDue : Number(amountPaid);
      const billingDetails = { subTotal, discount: flatDiscount, serviceCharge, taxAmount, totalDue, amountPaid: paidValue, proofUrl };
      for (let i = 0; i < tableOrders.length; i++) {
        const order = tableOrders[i];
        if (i === 0) {
          await updateOrderDetails(order.id, { paymentStatus, paymentMethod, billingDetails, status: 'DELIVERED' });
        } else {
          await updateOrderDetails(order.id, { paymentStatus, paymentMethod, status: 'DELIVERED' });
        }
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert("Checkout failed. Check connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center md:p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-luxury-dark border-luxury-border w-full max-w-4xl md:h-[85vh] h-full md:rounded-3xl rounded-none overflow-hidden flex flex-col md:flex-row shadow-2xl border-x md:border"
      >
        {/* LEFT PANEL: Receipt */}
        <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-luxury-border bg-luxury-gray/10 h-[40vh] md:h-auto">
          <div className="p-6 border-b border-luxury-border flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-luxury-text font-serif">Table {tableId}</h2>
              <p className="text-[10px] text-luxury-textDim font-bold uppercase tracking-widest mt-1">
                {tableOrders.length} {tableOrders.length === 1 ? 'Ticket' : 'Tickets'} • Receipt
              </p>
            </div>
            <Receipt className="text-luxury-gold/50" size={24} />
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {allItems.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-luxury-gold">{item.quantity}×</span>
                    <span className="text-xs font-bold text-luxury-text">{item.menuItem?.name}</span>
                  </div>
                </div>
                <span className="text-xs font-serif font-bold text-luxury-textDim">
                  ${(item.priceAtOrder * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-luxury-border bg-luxury-gray/10 space-y-2">
            <div className="flex justify-between items-center text-xs text-luxury-textDim">
              <span>Subtotal</span><span>${subTotal.toFixed(2)}</span>
            </div>
            {flatDiscount > 0 && (
              <div className="flex justify-between items-center text-xs text-emerald-500">
                <span>Discount</span><span>-${flatDiscount.toFixed(2)}</span>
              </div>
            )}
            {serviceCharge > 0 && (
              <div className="flex justify-between items-center text-xs text-luxury-textDim">
                <span>Service Charge</span><span>+${serviceCharge.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs text-luxury-textDim">
              <span>Tax (10%)</span><span>+${taxAmount.toFixed(2)}</span>
            </div>
            <div className="pt-3 mt-3 border-t border-luxury-border/50 flex justify-between items-center">
              <span className="text-[10px] uppercase tracking-widest font-bold text-luxury-gold">Total Due</span>
              <span className="text-2xl font-serif font-bold text-luxury-gold">${totalDue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Actions */}
        <div className="w-full md:w-1/2 flex flex-col bg-luxury-dark/40 overflow-y-auto custom-scrollbar relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-luxury-textDim hover:text-luxury-text transition-colors z-20 bg-luxury-gray/50 rounded-full border border-luxury-border">
            <X size={18} />
          </button>

          <div className="p-5 md:p-8 space-y-6 md:space-y-8 flex-1">
            {/* Billing Adjustments */}
            <div>
              <h3 className="text-base md:text-lg font-bold text-luxury-text font-serif mb-4">Billing Adjustments</h3>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="text-[9px] md:text-[10px] uppercase font-bold text-luxury-textDim tracking-widest mb-2 block">Discount ($)</label>
                  <div className="relative">
                    <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-luxury-textDim" />
                    <input type="number" min="0" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))}
                      className="w-full bg-luxury-gray border border-luxury-border rounded-xl pl-8 pr-3 py-2.5 md:py-3 text-sm text-luxury-text focus:outline-none focus:border-luxury-gold transition-colors" placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] md:text-[10px] uppercase font-bold text-luxury-textDim tracking-widest mb-2 block">Service ($)</label>
                  <div className="relative">
                    <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-luxury-textDim" />
                    <input type="number" min="0" value={serviceCharge || ''} onChange={e => setServiceCharge(Number(e.target.value))}
                      className="w-full bg-luxury-gray border border-luxury-border rounded-xl pl-8 pr-3 py-2.5 md:py-3 text-sm text-luxury-text focus:outline-none focus:border-luxury-gold transition-colors" placeholder="0.00" />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Tracking */}
            <div>
              <h3 className="text-lg font-bold text-luxury-text font-serif mb-4">Payment Tracking</h3>
              <div className="grid grid-cols-3 gap-2 md:gap-3 mb-6">
                {['CASH', 'CARD', 'ROOM'].map((method) => (
                  <button key={method} onClick={() => setPaymentMethod(method)}
                    className={`py-2.5 md:py-3 rounded-xl border flex flex-col items-center justify-center transition-all ${paymentMethod === method ? 'bg-luxury-gold/10 border-luxury-gold text-luxury-gold' : 'bg-luxury-gray border-luxury-border text-luxury-textDim hover:border-luxury-gold/30'}`}>
                    {method === 'CASH' && <Banknote size={14} className="mb-1 md:w-4 md:h-4" />}
                    {method === 'CARD' && <CreditCard size={14} className="mb-1 md:w-4 md:h-4" />}
                    {method === 'ROOM' && <FileText size={14} className="mb-1 md:w-4 md:h-4" />}
                    <span className="text-[9px] md:text-[10px] font-bold tracking-widest uppercase">{method}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-luxury-textDim tracking-widest mb-2 block">Amount Received ($)</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-luxury-textDim" />
                    <input type="number" min="0" value={amountPaid} onChange={e => setAmountPaid(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-luxury-gray border border-luxury-border rounded-xl pl-8 pr-4 py-3 text-luxury-text text-lg font-bold focus:outline-none focus:border-luxury-gold transition-colors" placeholder={totalDue.toFixed(2)} />
                  </div>
                  <p className="text-[10px] text-luxury-textDim mt-2 tracking-wide font-bold">Leave blank for full amount.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'PAID', label: 'Full Paid', active: 'bg-emerald-500/20 border-emerald-500 text-emerald-500' },
                    { id: 'PARTIAL', label: 'Partial', active: 'bg-yellow-500/20 border-yellow-500 text-yellow-500' },
                    { id: 'UNPAID', label: 'Unpaid', active: 'bg-rose-500/10 border-rose-500 text-rose-500' },
                  ].map(btn => (
                    <button key={btn.id} onClick={() => setPaymentStatus(btn.id)}
                      className={`flex-1 min-w-[80px] py-2 md:py-2.5 rounded-lg border text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all ${paymentStatus === btn.id ? btn.active : 'bg-luxury-gray border-luxury-border text-luxury-textDim hover:border-luxury-gold/30'}`}>
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Proof Upload */}
            <div>
              <h3 className="text-sm font-bold text-luxury-text font-serif mb-3">Attach Proof of Payment</h3>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed ${proofImage ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-luxury-border hover:border-luxury-gold/50 bg-luxury-gray/30'} rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center cursor-pointer transition-all h-28 md:h-32 relative overflow-hidden`}
              >
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                {isUploading ? (
                  <Loader2 size={24} className="animate-spin text-luxury-gold" />
                ) : proofImage ? (
                  <>
                    <div className="absolute inset-0 opacity-40">
                      <img src={proofImage} alt="Proof" className="w-full h-full object-cover" />
                    </div>
                    <CheckCircle2 size={28} className="text-emerald-500 z-10 mb-2 drop-shadow-md md:w-8 md:h-8" />
                    <span className="text-[9px] md:text-[10px] font-bold text-luxury-text uppercase tracking-widest z-10 drop-shadow-md">Attached</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={20} className="text-luxury-textDim mb-2 md:w-6 md:h-6" />
                    <span className="text-[9px] md:text-[10px] font-bold text-luxury-textDim uppercase tracking-widest">Upload Receipt</span>
                    <span className="text-[8px] md:text-[9px] text-luxury-textDim/60 mt-1">JPEG/PNG, Max 5MB</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-5 md:p-6 border-t border-luxury-border bg-luxury-gray/10 mt-auto safe-bottom">
            <button
              onClick={processCheckout}
              disabled={isSubmitting || isUploading}
              className="w-full py-3.5 md:py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] md:text-xs transition-all shadow-lg flex justify-center items-center active:scale-[0.98]"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm & Process Bill'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
