'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, X, Camera, RefreshCw, CheckCircle2, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online').replace(/\/$/, '') + '/api';

export default function ScanPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [couponData, setCouponData] = useState<any>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startScanner = async () => {
    try {
      setScanning(true);
      setStatus('idle');
      setMessage('');
      setResult(null);

      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      
      await html5QrCode.start(
        { facingMode: "environment" }, 
        config,
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {} // silent on failure
      );
    } catch (err) {
      console.error(err);
      setScanning(false);
      setStatus('error');
      setMessage('يرجى السماح بالوصول إلى الكاميرا للمسح');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
    }
    setScanning(false);
  };

  const handleScanSuccess = async (code: string) => {
    setResult(code);
    await stopScanner();
    validateCoupon(code);
  };

  const validateCoupon = async (code: string) => {
    setLoading(true);
    const token = document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];
    const storeId = localStorage.getItem('vendor_store_id');

    try {
      // First fetch coupon details to show to merchant
      const res = await axios.get(`${API_URL}/coupons/by-code/${code}`, {
        headers: { Authorization: `Bearer ${decodeURIComponent(token || '')}` }
      });
      setCouponData(res.data);
      setStatus('idle');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'الكود غير صحيح أو منتهي الصلاحية');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const redeemCoupon = async () => {
    if (!result) return;
    setLoading(true);
    const token = document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];
    const storeId = localStorage.getItem('vendor_store_id');

    try {
      await axios.post(`${API_URL}/coupons/redeem`, 
        { code: result, storeId },
        { headers: { Authorization: `Bearer ${decodeURIComponent(token || '')}` } }
      );
      setStatus('success');
      setMessage('تم تفعيل الخصم بنجاح!');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'فشل في تفعيل الكوبون');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startScanner();
    return () => { stopScanner(); };
  }, []);

  return (
    <div className="min-h-screen bg-bg p-4 flex flex-col items-center justify-center relative overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="absolute top-0 inset-x-0 p-6 flex items-center justify-between z-20">
        <button 
          onClick={() => router.back()}
          className="p-3 bg-bg2/80 backdrop-blur-md rounded-2xl border border-white/5 text-text-dim"
        >
          <ChevronRight size={24} />
        </button>
        <h1 className="text-xl font-black text-text">ماسح العروض</h1>
        <div className="w-12" /> {/* spacer */}
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div 
            key="scanner"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="w-full max-w-sm space-y-8"
          >
            <div className="relative aspect-square w-full bg-black rounded-[3rem] overflow-hidden border-2 border-white/5 shadow-2xl">
              <div id="reader" className="w-full h-full overflow-hidden" />
              
              {/* Scanner UI Overlays */}
              <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40" />
              <div className="absolute inset-[40px] border-2 border-primary/30 rounded-3xl overflow-hidden">
                <motion.div 
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-x-0 h-0.5 bg-primary shadow-[0_0_15px_rgba(255,107,0,1)] z-10" 
                />
              </div>

              {!scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-4">
                    <AlertCircle size={40} />
                  </div>
                  <p className="text-white font-bold mb-6">تعذر فتح الكاميرا</p>
                  <button 
                    onClick={startScanner}
                    className="px-6 py-3 bg-primary text-white font-black rounded-xl"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              )}
            </div>

            <div className="text-center space-y-2">
              <p className="text-text font-black text-lg">ضع الكود في المربع</p>
              <p className="text-text-dim text-sm font-bold">سيتم التعرف على الكود تلقائياً وتفعيل الخصم</p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm glass p-8 rounded-[3rem] border border-white/5 shadow-2xl"
          >
            {loading ? (
              <div className="py-12 flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="text-text font-black">جاري التحقق من الكود...</p>
              </div>
            ) : status === 'success' ? (
              <div className="py-6 text-center space-y-6">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mx-auto border-2 border-green-500/20">
                  <CheckCircle2 size={48} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-text">تم التفعيل!</h3>
                  <p className="text-green-500/80 font-bold mt-1">{message}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-right">
                  <p className="text-[10px] font-black text-text-dim uppercase">تفاصيل العرض</p>
                  <p className="text-lg font-black text-primary mt-1">{couponData?.offer?.title}</p>
                  <p className="text-xs font-bold text-text-dim">الخصم: {couponData?.offer?.discount}</p>
                </div>
                <button 
                  onClick={() => { setResult(null); startScanner(); }}
                  className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20"
                >
                  مسح كود آخر
                </button>
              </div>
            ) : status === 'error' ? (
              <div className="py-6 text-center space-y-6">
                <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mx-auto border-2 border-red-500/20">
                  <AlertCircle size={48} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-text">فشل التحقق</h3>
                  <p className="text-red-500/80 font-bold mt-1">{message}</p>
                </div>
                <button 
                  onClick={() => { setResult(null); startScanner(); }}
                  className="w-full py-4 bg-bg2 text-text font-black rounded-2xl border border-white/5"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mx-auto mb-4 border border-primary/20">
                    <QrCode size={40} />
                  </div>
                  <h3 className="text-xl font-black text-text">بيانات الكوبون</h3>
                  <p className="text-text-dim text-sm font-bold mt-1">يرجى التأكد من العرض قبل التفعيل</p>
                </div>

                <div className="space-y-3">
                  <div className="p-5 bg-white/5 rounded-[2rem] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 bg-primary/10 text-primary text-[10px] font-black rounded-bl-2xl uppercase tracking-widest">
                      كوبون صالح
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-text-dim uppercase tracking-wider">العرض</p>
                      <p className="text-lg font-black text-text leading-tight">{couponData?.offer?.title}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                      <div>
                        <p className="text-[10px] font-black text-text-dim uppercase">الخصم</p>
                        <p className="text-xl font-black text-primary">{couponData?.offer?.discount}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-black text-text-dim uppercase">الكود</p>
                        <p className="text-lg font-black text-text tracking-widest">{couponData?.code}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => { setResult(null); startScanner(); }}
                    className="flex-1 py-4 bg-bg2 text-text font-black rounded-2xl border border-white/5 hover:bg-bg2/80 transition-all"
                  >
                    إلغاء
                  </button>
                  <button 
                    onClick={redeemCoupon}
                    className="flex-[2] py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-lt transition-all flex items-center justify-center gap-2"
                  >
                    تفعيل الخصم
                    <CheckCircle2 size={20} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
