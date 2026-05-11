'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, X, Camera, RefreshCw, CheckCircle2, AlertCircle, Loader2, ChevronRight, Keyboard, Scan } from 'lucide-react';
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
  const [isManual, setIsManual] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startScanner = async () => {
    try {
      setIsManual(false);
      setScanning(true);
      setStatus('idle');
      setMessage('');
      setResult(null);

      // Give a tiny delay for DOM to be ready
      setTimeout(async () => {
        try {
          const html5QrCode = new Html5Qrcode("reader");
          scannerRef.current = html5QrCode;
          const config = { fps: 10, qrbox: { width: 250, height: 250 } };
          await html5QrCode.start(
            { facingMode: "environment" }, 
            config,
            (decodedText) => {
              handleScanSuccess(decodedText);
            },
            () => {} 
          );
        } catch (e) {
          console.error("Scanner start error", e);
          setScanning(false);
        }
      }, 100);
    } catch (err) {
      console.error(err);
      setScanning(false);
      setStatus('error');
      setMessage('يرجى السماح بالوصول إلى الكاميرا');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.error("Scanner stop error", e);
      }
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

    try {
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
    if (!result && !manualCode) return;
    const code = result || manualCode;
    setLoading(true);
    const token = document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];
    const storeId = localStorage.getItem('vendor_store_id');

    try {
      await axios.post(`${API_URL}/coupons/redeem`, 
        { code, storeId },
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
    <div className="fixed inset-0 bg-bg z-[100] flex flex-col overflow-hidden dir-rtl" dir="rtl">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Modern Top Header */}
      <div className="relative px-6 pt-4 pb-2 flex items-center justify-between z-50">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 glass rounded-xl flex items-center justify-center text-text-dim hover:text-primary transition-all border border-white/5 active:scale-90"
        >
          <ChevronRight size={20} />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-lg font-black text-text tracking-tight">تفعيل العروض</h1>
          <div className="flex items-center gap-1.5 mt-1">
             <div className={`w-1.5 h-1.5 rounded-full ${scanning ? 'bg-primary animate-pulse' : 'bg-white/20'}`} />
             <span className="text-[10px] font-bold text-text-dimmer uppercase tracking-widest">{scanning ? 'نشط الآن' : 'في انتظار المسح'}</span>
          </div>
        </div>
        <button 
          onClick={() => {
            if (isManual) {
              setIsManual(false);
              startScanner();
            } else {
              stopScanner();
              setIsManual(true);
            }
          }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border border-white/5 active:scale-90 ${isManual ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'glass text-text-dim'}`}
        >
          {isManual ? <Scan size={18} /> : <Keyboard size={18} />}
        </button>
      </div>

      {/* Main Content Area - Scrollable but optimized for view */}
      <div className="flex-1 flex flex-col items-center px-6 overflow-y-auto pb-4">
        <AnimatePresence mode="wait">
          {(!result && !isManual) ? (
            <motion.div 
              key="scanner-ui"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full max-w-sm mt-2 space-y-4"
            >
              <div className="relative aspect-square w-full bg-black rounded-[2.5rem] overflow-hidden border-2 border-white/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
                <div id="reader" className="w-full h-full" />
                
                {/* Scanner Viewport Decoration */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corners */}
                  <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-3xl" />
                  <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-3xl" />
                  <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-3xl" />
                  <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-3xl" />
                  
                  {/* Scanning Animation */}
                  <div className="absolute inset-12 border border-white/10 rounded-2xl overflow-hidden">
                    <motion.div 
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_20px_rgba(255,107,0,0.8)] z-10" 
                    />
                  </div>
                </div>

                {!scanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl px-8 text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary mb-6 border border-primary/20">
                      <Camera size={40} />
                    </div>
                    <h3 className="text-white font-black text-lg mb-2">الكاميرا غير مفعلة</h3>
                    <p className="text-white/40 text-sm font-bold mb-8">نحتاج للوصول للكاميرا لقراءة الكود</p>
                    <button 
                      onClick={startScanner}
                      className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 active:scale-95 transition-all"
                    >
                      تفعيل الكاميرا
                    </button>
                  </div>
                )}
              </div>

              <div className="text-center space-y-2 px-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                  <RefreshCw size={12} className="text-primary animate-spin-slow" />
                  <span className="text-[9px] font-black text-text-dim uppercase tracking-widest">بحث تلقائي نشط</span>
                </div>
                <h3 className="text-lg font-black text-text">وجه الكاميرا نحو الكود</h3>
                <p className="text-text-dim text-xs font-bold leading-relaxed">
                  سيقوم النظام بقراءة كود العميل وتفعيل الخصم.
                </p>
              </div>
            </motion.div>
          ) : isManual && !result ? (
            <motion.div 
              key="manual-ui"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm mt-8 space-y-6"
            >
              <div className="glass p-8 rounded-[3rem] border border-white/10 shadow-2xl space-y-8">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-text-dim mx-auto mb-4 border border-white/5">
                    <Keyboard size={32} />
                  </div>
                  <h3 className="text-xl font-black text-text">إدخال يدوي</h3>
                  <p className="text-text-dim text-sm font-bold">اكتب كود الكوبون المكون من 6 أرقام</p>
                </div>

                <div className="relative group">
                   <input 
                    type="text" 
                    placeholder="X Y Z 1 2 3"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-6 text-center text-3xl font-black tracking-[0.3em] text-primary placeholder:text-white/10 outline-none focus:border-primary/30 transition-all"
                    maxLength={8}
                   />
                </div>

                <button 
                  disabled={manualCode.length < 4 || loading}
                  onClick={() => validateCoupon(manualCode)}
                  className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 disabled:opacity-30 disabled:grayscale transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  {loading ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle2 size={24} />}
                  تحقق من الكود
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="result-ui"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm mt-6"
            >
              <div className="glass p-8 rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden relative">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
                
                {loading ? (
                  <div className="py-12 flex flex-col items-center gap-6">
                    <div className="relative">
                      <Loader2 className="animate-spin text-primary" size={64} />
                      <QrCode className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20" size={24} />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-black text-text">جاري المعالجة</p>
                      <p className="text-text-dim text-xs font-bold mt-1">نتأكد من صلاحية الكوبون...</p>
                    </div>
                  </div>
                ) : status === 'success' ? (
                  <div className="py-4 text-center space-y-8">
                    <motion.div 
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-28 h-28 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto border-4 border-emerald-500/10 shadow-inner"
                    >
                      <CheckCircle2 size={60} />
                    </motion.div>
                    <div>
                      <h3 className="text-3xl font-black text-text">تم التفعيل!</h3>
                      <p className="text-emerald-500/80 font-bold mt-2 text-lg">{message}</p>
                    </div>
                    
                    <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/10 text-right space-y-4">
                      <div className="flex items-center justify-between border-b border-emerald-500/10 pb-3">
                         <span className="text-[10px] font-black text-emerald-500/40 uppercase tracking-widest">تفاصيل العملية</span>
                         <span className="text-[10px] font-black text-text-dimmer">{new Date().toLocaleTimeString('ar-EG')}</span>
                      </div>
                      <div>
                        <p className="text-xl font-black text-text leading-tight">{couponData?.offer?.title}</p>
                        <p className="text-2xl font-black text-primary mt-2">خصم {couponData?.offer?.discount}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => { setResult(null); setManualCode(''); setStatus('idle'); startScanner(); }}
                      className="w-full py-5 bg-text text-bg font-black rounded-2xl shadow-xl active:scale-95 transition-all"
                    >
                      إنهاء ومسح آخر
                    </button>
                  </div>
                ) : status === 'error' ? (
                  <div className="py-6 text-center space-y-8">
                    <div className="w-28 h-28 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto border-4 border-red-500/10">
                      <AlertCircle size={60} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-text">خطأ في الكود</h3>
                      <p className="text-red-500/80 font-bold mt-2">{message}</p>
                    </div>
                    <button 
                      onClick={() => { setResult(null); setManualCode(''); setStatus('idle'); startScanner(); }}
                      className="w-full py-5 bg-white/5 text-text font-black rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
                    >
                      إعادة المحاولة
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary mx-auto mb-4 border border-primary/20 shadow-inner">
                        <QrCode size={40} />
                      </div>
                      <h3 className="text-2xl font-black text-text">تأكيد الكوبون</h3>
                      <p className="text-text-dim text-sm font-bold mt-1">راجع البيانات قبل التفعيل النهائي</p>
                    </div>

                    <div className="p-6 bg-white/[0.03] rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                       <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
                       
                       <div className="space-y-6 relative">
                          <div className="flex items-center justify-between">
                             <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-black rounded-full border border-emerald-500/20">
                                كوبون متاح
                             </div>
                             <div className="text-left">
                                <p className="text-[10px] font-black text-text-dimmer uppercase">الكود</p>
                                <p className="text-sm font-black text-text tracking-widest">{couponData?.code || result}</p>
                             </div>
                          </div>

                          <div className="space-y-1">
                             <p className="text-[10px] font-black text-text-dim uppercase tracking-wider">العرض المقدم</p>
                             <p className="text-xl font-black text-text leading-tight">{couponData?.offer?.title}</p>
                          </div>

                          <div className="pt-5 border-t border-white/5 flex items-center justify-between">
                             <div>
                                <p className="text-[10px] font-black text-text-dim uppercase">قيمة الخصم</p>
                                <p className="text-3xl font-black text-primary tracking-tighter">{couponData?.offer?.discount}</p>
                             </div>
                             <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-lg shadow-primary/10">
                                <CheckCircle2 size={32} />
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => { setResult(null); setManualCode(''); startScanner(); }}
                        className="flex-1 py-5 glass text-text-dim font-black rounded-2xl border border-white/5 active:scale-95 transition-all"
                      >
                        تراجع
                      </button>
                      <button 
                        onClick={redeemCoupon}
                        className="flex-[2.5] py-5 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/40 hover:bg-primary-lt active:scale-95 transition-all flex items-center justify-center gap-3"
                      >
                        تفعيل الآن
                        <ChevronRight size={20} className="rotate-180" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        #reader { border: none !important; }
        #reader video { 
          object-fit: cover !important;
          border-radius: 3rem !important;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

