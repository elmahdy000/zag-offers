'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, X, Camera, RefreshCw, CheckCircle2, AlertCircle, Loader2, ChevronRight, Keyboard, Scan, CloudOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { vendorApi } from '@/lib/api';
import { OfflineSync } from '@/lib/offline-sync';
import { secureStorage } from '@/lib/crypto';

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
  const [pendingSyncs, setPendingSyncs] = useState(0);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const [recentScans, setRecentScans] = useState<any[]>([]);

  useEffect(() => {
    setPendingSyncs(OfflineSync.getQueue().length);
    const handleSyncComplete = () => {
      setPendingSyncs(OfflineSync.getQueue().length);
    };
    window.addEventListener('offline-sync-completed', handleSyncComplete);
    return () => window.removeEventListener('offline-sync-completed', handleSyncComplete);
  }, []);

  // Sound effects
  const playSuccessSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
      audio.play().catch(() => {});
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } catch (e) {}
  };

  const playErrorSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      audio.play().catch(() => {});
      if (navigator.vibrate) navigator.vibrate(300);
    } catch (e) {}
  };

  const startScanner = async () => {
    try {
      setIsManual(false);
      setScanning(true);
      setStatus('idle');
      setMessage('');
      setResult(null);

      const cached = secureStorage.get<any[]>('vendor_recent_scans');
      if (cached) setRecentScans(cached);

      setTimeout(async () => {
        try {
          const html5QrCode = new Html5Qrcode("reader");
          scannerRef.current = html5QrCode;
          const config = { fps: 20, qrbox: { width: 280, height: 280 } };
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
    if (!code) return;
    
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const api = vendorApi();
      const res = await api.get(`/coupons/by-code/${code.trim()}`);
      setCouponData(res.data);
      setResult(code.trim()); 
      playSuccessSound();
    } catch (err: any) {
      if (!navigator.onLine || err.message === 'Network Error') {
        // لو مفيش نت بس الكود موجود يدوي أو ممسوح، هنسمح بالانتقال لمرحلة التفعيل
        setResult(code.trim());
        setCouponData({ offer: { title: 'كوبون (غير محقق - أوفلاين)', discount: '??%' } });
        return;
      }
      setStatus('error');
      setMessage(err.response?.data?.message || 'الكود غير صحيح أو منتهي الصلاحية');
      setCouponData(null);
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  const redeemCoupon = async () => {
    const code = result || manualCode;
    if (!code) return;

    setLoading(true);
    try {
      const api = vendorApi();
      const res = await api.post(`/coupons/redeem`, { code: code.trim() });
      
      setStatus('success');
      setMessage(res.data?.message || 'تم تفعيل الخصم بنجاح!');
      playSuccessSound();

      const newScan = {
        id: Date.now(),
        code: code.trim(),
        offerTitle: couponData?.offer?.title || 'خصم مباشر',
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
      const updatedRecent = [newScan, ...recentScans.slice(0, 2)];
      setRecentScans(updatedRecent);
      secureStorage.set('vendor_recent_scans', updatedRecent);

    } catch (err: any) {
      if (!navigator.onLine || err.message === 'Network Error' || !err.response) {
        await OfflineSync.addToQueue('REDEEM_COUPON', { code: code.trim() });
        setPendingSyncs(OfflineSync.getQueue().length);
        
        setStatus('success');
        setMessage('تم حفظ العملية! سيتم تفعيل الكوبون تلقائياً فور عودة الإنترنت.');
        playSuccessSound();
        return;
      }

      setStatus('error');
      setMessage(err.response?.data?.message || 'فشل في تفعيل الكوبون');
      playErrorSound();
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
      
      {/* Header */}
      <div className="relative px-6 pt-4 pb-2 flex items-center justify-between z-50">
        <button onClick={() => router.back()} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-text-dim border border-white/5 active:scale-90">
          <ChevronRight size={20} />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-lg font-black text-text tracking-tight">تفعيل الكوبونات</h1>
          <div className="flex items-center gap-1.5 mt-1">
             <div className={`w-1.5 h-1.5 rounded-full ${scanning ? 'bg-primary animate-pulse' : 'bg-white/20'}`} />
             <span className="text-[10px] font-bold text-text-dimmer uppercase tracking-widest">{scanning ? 'نشط الآن' : 'في انتظار المسح'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingSyncs > 0 && (
            <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-xl border border-amber-500/20">
               <CloudOff size={14} />
               <span className="text-[10px] font-black">{pendingSyncs}</span>
            </div>
          )}
          <button 
            onClick={() => {
              if (isManual) { setIsManual(false); startScanner(); } 
              else { stopScanner(); setIsManual(true); }
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border border-white/5 active:scale-90 ${isManual ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'glass text-text-dim'}`}
          >
            {isManual ? <Scan size={18} /> : <Keyboard size={18} />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 overflow-y-auto pb-8">
        <AnimatePresence mode="wait">
          {(!result && !isManual) ? (
            <motion.div key="scanner-ui" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full mt-2 space-y-4">
              <div className="relative aspect-square w-full bg-black rounded-[3rem] overflow-hidden border-2 border-white/5 shadow-2xl">
                <div id="reader" className="w-full h-full" />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-10 right-10 w-14 h-14 border-t-4 border-r-4 border-primary rounded-tr-3xl" />
                  <div className="absolute top-10 left-10 w-14 h-14 border-t-4 border-l-4 border-primary rounded-tl-3xl" />
                  <div className="absolute bottom-10 right-10 w-14 h-14 border-b-4 border-r-4 border-primary rounded-br-3xl" />
                  <div className="absolute bottom-10 left-10 w-14 h-14 border-b-4 border-l-4 border-primary rounded-bl-3xl" />
                </div>
                {!scanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl px-8 text-center">
                    <button onClick={startScanner} className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all">تفعيل الكاميرا</button>
                  </div>
                )}
              </div>
              <div className="text-center px-4">
                <h3 className="text-lg font-black text-text">وجه الكاميرا نحو الكود</h3>
                <p className="text-text-dim text-xs font-bold leading-relaxed mt-1">سيقوم النظام بالتعرف على الكود تلقائياً</p>
              </div>

              {recentScans.length > 0 && (
                <div className="mt-8 space-y-3">
                  <p className="text-[10px] font-black text-text-dimmer uppercase tracking-widest text-center">آخر العمليات</p>
                  <div className="space-y-2">
                    {recentScans.map((scan) => (
                      <div key={scan.id} className="glass p-3 rounded-2xl border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                            <CheckCircle2 size={16} />
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-text line-clamp-1">{scan.offerTitle}</p>
                            <p className="text-[9px] font-bold text-text-dimmer uppercase tracking-tighter">{scan.time}</p>
                          </div>
                        </div>
                        <span className="font-mono font-black text-primary text-[11px] bg-primary/5 px-2 py-1 rounded-lg">
                          {scan.code}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : isManual && !result ? (
            <motion.div key="manual-ui" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm mt-8">
              <div className="glass p-8 rounded-[3rem] border border-white/10 shadow-2xl space-y-8">
                <div className="text-center">
                  <h3 className="text-xl font-black text-text">إدخال يدوي</h3>
                  <p className="text-text-dim text-sm font-bold">اكتب كود الكوبون المكون من 6-8 أرقام</p>
                </div>
                <input 
                  type="text" value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-6 text-center text-3xl font-black tracking-[0.3em] text-primary outline-none focus:border-primary/30"
                  maxLength={10}
                />
                <button 
                  disabled={manualCode.length < 4 || loading}
                  onClick={() => validateCoupon(manualCode)}
                  className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 disabled:opacity-30"
                >
                  {loading ? <Loader2 size={24} className="animate-spin" /> : 'تحقق من الكود'}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="result-ui" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm mt-6">
              <div className="glass p-8 rounded-[3rem] border border-white/10 shadow-2xl relative">
                {status === 'success' ? (
                  <div className="py-4 text-center space-y-8">
                    <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto border-4 border-emerald-500/10"><CheckCircle2 size={50} /></div>
                    <h3 className="text-3xl font-black text-text">تم التفعيل!</h3>
                    <p className="text-emerald-500/80 font-bold text-lg">{message}</p>
                    <button onClick={() => { setResult(null); setManualCode(''); setStatus('idle'); startScanner(); }} className="w-full py-5 bg-text text-bg font-black rounded-2xl">إنهاء ومسح آخر</button>
                  </div>
                ) : status === 'error' ? (
                  <div className="py-6 text-center space-y-8">
                    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto border-4 border-red-500/10"><AlertCircle size={50} /></div>
                    <h3 className="text-2xl font-black text-text">خطأ</h3>
                    <p className="text-red-500/80 font-bold">{message}</p>
                    <button onClick={() => { setResult(null); setManualCode(''); setStatus('idle'); startScanner(); }} className="w-full py-5 bg-white/5 text-text font-black rounded-2xl border border-white/10">إعادة المحاولة</button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h3 className="text-2xl font-black text-text">تأكيد الكوبون</h3>
                      <p className="text-text-dim text-sm font-bold mt-1">راجع البيانات قبل التفعيل النهائي</p>
                    </div>
                    <div className="p-6 bg-white/[0.03] rounded-[2.5rem] border border-white/5 space-y-4 text-right">
                        <p className="text-[10px] font-black text-text-dim uppercase tracking-wider">العرض</p>
                        <p className="text-xl font-black text-text leading-tight">{couponData?.offer?.title || 'جاري التحميل...'}</p>
                        <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                           <div><p className="text-[10px] font-black text-text-dim">الخصم</p><p className="text-3xl font-black text-primary">{couponData?.offer?.discount}</p></div>
                           <div className="text-left"><p className="text-[10px] font-black text-text-dim">الكود</p><p className="text-sm font-black text-text font-mono">{result}</p></div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => { setResult(null); setManualCode(''); startScanner(); }} className="flex-1 py-4 glass text-text-dim font-black rounded-2xl">تراجع</button>
                      <button onClick={redeemCoupon} disabled={loading} className="flex-[2] py-4 bg-primary text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2">
                        {loading ? <Loader2 size={20} className="animate-spin" /> : 'تفعيل الآن'}
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
        #reader video { object-fit: cover !important; border-radius: 2rem !important; }
      `}</style>
    </div>
  );
}
