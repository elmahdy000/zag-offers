'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Tag, TrendingUp, Plus, ScanLine, Loader2, Bell, CheckCircle2, Clock, Users, ArrowUpRight, Calendar, ChevronLeft, Camera, Keyboard, Store, ChevronDown, History, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardSkeleton } from '@/components/Skeleton';
import { io } from 'socket.io-client';
import { vendorApi, getCookie, getVendorUser, getVendorStoreId } from '@/lib/api';
import { useVendorStats, useRedeemCoupon } from '@/hooks/use-vendor-api';
import { useSocket } from '@/hooks/useSocket';
import QRScanner from '@/components/QRScanner';
import EmptyState from '@/components/EmptyState';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online';

interface DashboardStats {
  storeName: string;
  storeId: string;
  storeStatus: string;
  activeOffers: number;
  scansToday: number;
  claimsToday: number;
  totalClaims: number;
  recentCoupons: Array<{
    id: string;
    code: string;
    status: string;
    createdAt: string;
    redeemedAt: string | null;
    offerTitle: string;
    customerName: string;
  }>;
}

interface MerchantStore {
  id: string;
  name: string;
  logo: string | null;
  area: string | null;
  status: string;
  category: { name: string };
}

interface ScannedCoupon {
  code: string;
  offerTitle: string;
  customerName: string;
  scannedAt: string;
  status: 'success' | 'error';
  errorMessage?: string;
}

export default function MerchantDashboard() {
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [stores, setStores] = useState<MerchantStore[]>([]);
  const [showStoreSelector, setShowStoreSelector] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScannedCoupon[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // React Query hooks
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useVendorStats();
  const { mutate: redeemCoupon, isPending: redeeming } = useRedeemCoupon();

  const handleScan = (decodedText: string) => {
    setShowScanner(false);
    const code = decodedText.toUpperCase().trim();
    setCouponCode(code);
    handleRedeem(code);
  };

  const saveToScanHistory = (coupon: ScannedCoupon) => {
    const newHistory = [coupon, ...scanHistory].slice(0, 20);
    setScanHistory(newHistory);
    localStorage.setItem('scan_history', JSON.stringify(newHistory));
  };

  const playSuccessSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      console.error('Failed to play sound:', e);
    }
  };

  const playErrorSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 300;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch (e) {
      console.error('Failed to play sound:', e);
    }
  };

  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const validateCouponBeforeRedeem = async (code: string) => {
    try {
      const res = await vendorApi().get(`/coupons/by-code/${code}`);
      const coupon = res.data as {
        status: string;
        offer: { status: string; endDate: string };
        expiresAt: string;
      };

      if (coupon.status !== 'GENERATED') {
        throw new Error('الكوبون تم استخدامه أو منتهي');
      }

      if (coupon.offer.status !== 'ACTIVE') {
        throw new Error('العرض غير متاح حالياً');
      }

      if (coupon.offer.endDate && new Date(coupon.offer.endDate) < new Date()) {
        throw new Error('العرض منتهي الصلاحية');
      }

      if (new Date(coupon.expiresAt) < new Date()) {
        throw new Error('الكوبون منتهي الصلاحية');
      }

      return true;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      throw new Error(error.response?.data?.message || (err as Error).message);
    }
  };

  const handleStoreSelect = (store: MerchantStore) => {
    localStorage.setItem('vendor_store_id', store.id);
    // Stats will be refetched automatically by React Query
    refetchStats();
    setShowStoreSelector(false);
  };

  const vendorUser = getVendorUser();
  const merchantId = vendorUser?.id ?? '';
  const storeName = stats?.storeName ?? vendorUser?.name ?? 'متجرك';
  const storeId = stats?.storeId;

  const socketRef = useSocket(merchantId);
  const socket = socketRef.current;
  
  useEffect(() => {
    // Load scan history from localStorage
    const savedHistory = localStorage.getItem('scan_history');
    if (savedHistory) {
      try {
        setScanHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to load scan history:', e);
      }
    }

    // Load all stores for this merchant
    vendorApi()
      .get('/stores/my-stores')
      .then((res) => setStores(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('merchant_notification', (data: any) => {
      let msg = '🔔 إشعار جديد';
      if (data.type === 'STORE_APPROVED') msg = `✅ تم قبول متجرك "${data.storeName}"!`;
      else if (data.type === 'STORE_REJECTED') msg = `❌ تم رفض متجرك "${data.storeName}".`;
      else if (data.type === 'NEW_REVIEW') msg = `🔔 تقييم جديد: ${data.comment || 'بدون تعليق'}`;
      else if (data.type === 'OFFER_REJECTED') msg = `❌ تم رفض عرضك "${data.offerTitle}"`;
      else if (data.type === 'COUPON_GENERATED') {
        msg = `🎫 عميل جديد طلب كوبون لـ "${data.offerTitle || ''}"`;
        // Stats will be updated automatically by React Query
        refetchStats();
      }
      else if (data.type === 'COUPON_REDEEMED') {
        msg = `✅ تم تفعيل كوبون بنجاح!`;
        // Stats will be updated automatically by React Query
        setTimeout(() => {
          refetchStats();
        }, 2000);
      }
      else if (data.message) msg = `📢 ${data.message}`;
      
      setNotification(msg);
      setTimeout(() => setNotification(null), 7000);
    });

    return () => {
      socket.off('merchant_notification');
    };
  }, [socket, refetchStats]);

  const handleRedeem = async (codeToRedeem?: string) => {
    const targetCode = codeToRedeem || couponCode;

    if (!targetCode || !storeId) {
      setMessage({ type: 'error', text: 'لا يوجد متجر مرتبط بحسابك أو الكود فارغ' });
      return;
    }

    setMessage(null);

    let finalCode = targetCode.toUpperCase().trim();
    if (finalCode && !finalCode.startsWith('ZAG-') && finalCode.length === 6) {
      finalCode = `ZAG-${finalCode}`;
    }

    try {
      // Pre-validate coupon before redeeming
      await validateCouponBeforeRedeem(finalCode);

      // Use React Query mutation
      redeemCoupon(
        { code: finalCode, storeId },
        {
          onSuccess: (res: any) => {
            setMessage({ type: 'success', text: '🎉 تم تفعيل الكوبون بنجاح!' });
            setCouponCode('');

            // Play success sound and vibrate
            playSuccessSound();
            vibrate([100, 50, 100]);

            // Save to scan history
            saveToScanHistory({
              code: finalCode,
              offerTitle: res.offer?.title || 'عرض غير معروف',
              customerName: res.customerName || 'غير معروف',
              scannedAt: new Date().toISOString(),
              status: 'success',
            });

            // Stats will be updated automatically by React Query
            refetchStats();
          },
          onError: (err: unknown) => {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            let errorMessage = axiosErr.response?.data?.message ?? (err as Error).message ?? 'الكود غير صحيح أو منتهي الصلاحية';

            // Add helpful suggestions based on error type
            let suggestion = '';
            if (errorMessage.includes('منتهي')) {
              suggestion = '\n💡 تواصل مع العميل للتأكد من صلاحية الكوبون';
            } else if (errorMessage.includes('استخدامه')) {
              suggestion = '\n💡 هذا الكوبون تم استخدامه من قبل';
            } else if (errorMessage.includes('مش صحيح')) {
              suggestion = '\n💡 تأكد من صحة الكود وحاول مرة أخرى';
            } else if (errorMessage.includes('المحل')) {
              suggestion = '\n💡 تأكد من اختيار المتجر الصحيح';
            }

            setMessage({ type: 'error', text: errorMessage + suggestion });

            // Play error sound and vibrate
            playErrorSound();
            vibrate([200]);

            // Save failed scan to history
            saveToScanHistory({
              code: finalCode,
              offerTitle: 'غير معروف',
              customerName: 'غير معروف',
              scannedAt: new Date().toISOString(),
              status: 'error',
              errorMessage: errorMessage,
            });
          },
        }
      );
    } catch (err: unknown) {
      // Pre-validation error
      const errorMessage = (err as Error).message ?? 'حدث خطأ أثناء التحقق من الكوبون';
      setMessage({ type: 'error', text: errorMessage });
      playErrorSound();
      vibrate([200]);
    }
  };

  if (loading) return <DashboardSkeleton />;

  const statCards = [
    { label: 'طلبات اليوم', value: stats?.claimsToday ?? 0, icon: Bell, color: 'text-orange-500', bg: 'bg-orange-500/10', trend: 'نشاط مرتفع' },
    { label: 'مسح اليوم', value: stats?.scansToday ?? 0, icon: CheckCircle2, color: 'text-secondary', bg: 'bg-secondary/10', trend: 'استقرار' },
    { label: 'عروض نشطة', value: stats?.activeOffers ?? 0, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-400/10', trend: 'أداء ممتاز' },
    { label: 'إجمالي الطلبات', value: stats?.totalClaims ?? 0, icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10', trend: 'تراكمي' },
  ];

  return (
    <div className="p-4 sm:p-8 dir-rtl animate-in max-w-7xl mx-auto relative min-h-screen">
      {/* Floating Action Button for Scanner (Mobile Only) */}
      <button 
        onClick={() => setShowScanner(true)}
        className="lg:hidden fixed bottom-24 left-6 w-16 h-16 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center z-[50] active:scale-90 transition-all border-4 border-bg"
      >
        <ScanLine size={28} />
      </button>

      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
            className="fixed top-8 right-8 glass p-5 rounded-2xl shadow-2xl z-[100] flex items-center gap-4 max-w-sm border-primary/20">
            <div className="bg-primary/20 p-2.5 rounded-xl"><Bell className="text-primary" size={20} /></div>
            <p className="text-[13px] font-black leading-relaxed text-text">{notification}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-black text-text tracking-tight">أهلاً بك، {storeName}</h1>
          <div className="flex items-center gap-2 mt-2 text-text-dim">
            <Calendar size={14} className="text-primary" />
            <span className="text-xs font-bold">{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        <button onClick={() => (window.location.href = '/dashboard/offers/new')}
          className="bg-primary text-white px-6 py-3.5 rounded-xl font-black text-[13px] shadow-lg shadow-primary/20 hover:bg-primary-lt active:scale-95 transition-all flex items-center gap-2">
          <Plus size={18} /> إضافة عرض جديد
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {statCards.map((card, i) => (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            key={card.label} className="glass p-6 rounded-[2rem] hover:border-primary/30 transition-all group">
            <div className="flex justify-between items-start mb-5">
              <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                <card.icon className={card.color} size={24} />
              </div>
              <ArrowUpRight className="text-text-dimmer group-hover:text-primary transition-colors" size={20} />
            </div>
            <div>
              <p className="text-text-dim font-black text-[9px] uppercase tracking-[0.15em] mb-1">{card.label}</p>
              <h3 className="text-2xl font-black text-text leading-none">{card.value.toLocaleString('ar-EG')}</h3>
              <p className="text-[9px] font-black uppercase tracking-wider text-primary/60 mt-3">{card.trend}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity (order-2 on mobile, order-1 on desktop) */}
        <div className="lg:col-span-2 glass rounded-[2rem] overflow-hidden flex flex-col min-h-[450px] order-2 lg:order-1">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
            <h2 className="text-base font-black text-text flex items-center gap-2.5">
              <Clock className="text-primary" size={18} /> النشاط الأخير
            </h2>
            <Link href="/dashboard/coupons" className="text-[11px] font-black text-primary uppercase tracking-wider hover:underline">عرض الكل</Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            {stats?.recentCoupons && stats.recentCoupons.length > 0 ? (
              <div className="divide-y divide-white/5">
                {stats.recentCoupons.map((coupon: any) => (
                  <div key={coupon.id} className="p-5 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 font-black text-[15px] text-text-dimmer uppercase">
                        {coupon.customerName?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-text text-[13px]">{coupon.customerName || 'عميل زاچ'}</p>
                        <p className="text-[11px] text-text-dim mt-0.5">طلب كوبون: <span className="text-text/70 font-bold">{coupon.offerTitle}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-left flex items-center gap-4">
                        <div className="hidden sm:block">
                           <p className="text-[11px] font-black text-primary uppercase tracking-widest font-mono">{coupon.code}</p>
                           <p className="text-[9px] text-text-dimmer mt-1 font-bold">{new Date(coupon.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <ChevronLeft size={14} className="text-text-dimmer group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-8">
                <EmptyState 
                  title="لا يوجد نشاط اليوم" 
                  description="لم يتم طلب أي كوبونات لعروضك حتى الآن. تأكد من تفعيل عروض جذابة لجذب العملاء!" 
                  actionText="إضافة عرض جديد"
                  onAction={() => window.location.href = '/dashboard/offers/new'}
                />
              </div>
            )}
          </div>
        </div>

        {/* Redemption Panel (order-1 on mobile, order-2 on desktop) */}
        <div className="space-y-6 order-1 lg:order-2">
          <div className="glass p-7 rounded-[2rem] relative overflow-hidden border-primary/20 bg-gradient-to-br from-white/[0.02] to-transparent">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-base font-black text-text">تفعيل الكوبونات</h3>
              {stores.length > 1 && (
                <button
                  onClick={() => setShowStoreSelector(!showStoreSelector)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 rounded-full border border-orange-500/20 hover:bg-orange-500/20 transition-all"
                >
                  <Store size={12} className="text-orange-500" />
                  <span className="text-orange-500 text-[10px] font-black">{storeName || 'اختر المتجر'}</span>
                  <ChevronDown size={12} className="text-orange-500" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-text-dim mb-6 leading-relaxed">تحقق من صحة الكوبون وقم بتفعيله فوراً لخدمة العميل.</p>

            <AnimatePresence>
              {showStoreSelector && stores.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 top-16 bg-gray-800 border border-white/10 rounded-xl overflow-hidden z-50"
                >
                  {stores.map((store) => (
                    <button
                      key={store.id}
                      onClick={() => handleStoreSelect(store)}
                      className={`w-full text-right px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-all ${
                        storeId === store.id ? 'bg-orange-500/10' : ''
                      }`}
                    >
                      <Store size={14} className={storeId === store.id ? 'text-orange-500' : 'text-gray-400'} />
                      <div className="flex-1">
                        <p className={`text-xs font-black ${storeId === store.id ? 'text-orange-500' : 'text-white'}`}>
                          {store.name}
                        </p>
                        <p className="text-[10px] text-gray-400">{store.area}</p>
                      </div>
                      {store.status !== 'APPROVED' && (
                        <span className="text-[10px] text-yellow-500 font-black">{store.status}</span>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <input type="text" value={couponCode}
                autoFocus
                autoCapitalize="characters"
                spellCheck={false}
                onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setMessage(null); }}
                placeholder="ZAG-XXXXX"
                className="w-full bg-bg border border-white/5 rounded-xl px-4 py-3.5 text-center text-lg font-mono font-black tracking-[0.2em] focus:border-primary outline-none transition-all placeholder:text-text-dimmer/30" />

              <button disabled={redeeming || !storeId} onClick={() => handleRedeem()}
                id="redeem-btn"
                className="w-full bg-primary text-white py-4 rounded-xl font-black text-[13px] flex items-center justify-center gap-2.5 hover:bg-primary-lt transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
                {redeeming ? <Loader2 className="animate-spin" size={18} /> : <ScanLine size={18} />}
                تأكيد الكود
              </button>

              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="w-full glass py-3.5 rounded-xl font-black text-[11px] text-text-dim flex items-center justify-center gap-2 border border-white/5 hover:border-primary/30 transition-all"
              >
                <Camera size={16} /> فتح الكاميرا للمسح
              </button>

              {scanHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowHistory(true)}
                  className="w-full text-[10px] text-text-dimmer hover:text-text transition-all flex items-center justify-center gap-2"
                >
                  <History size={12} />
                  عرض سجل المسح ({scanHistory.length})
                </button>
              )}
            </div>

            <AnimatePresence>
              {showScanner && (
                <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {message && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className={`mt-4 p-3 rounded-xl text-[11px] font-black text-center whitespace-pre-line ${message.type === 'success' ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="glass p-7 rounded-[2rem] bg-gradient-to-br from-primary/10 to-transparent border-primary/5 group relative overflow-hidden">
             <div className="flex justify-between items-start mb-5">
                <TrendingUp className="text-primary group-hover:scale-110 transition-transform" size={24} />
                <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase tracking-wider">نصيحة اليوم</span>
             </div>
             <h3 className="text-[15px] font-black text-text mb-2 leading-tight">عروض التوفير تجذب عملاء أكثر!</h3>
             <p className="text-[11px] text-text-dim leading-relaxed">المتاجر التي تقدم خصماً بنسبة 30% أو أكثر تحقق معدل طلبات أعلى بـ 3 مرات.</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-white/10 rounded-[2rem] p-6 max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <History className="text-orange-500" size={24} />
                  <h2 className="text-xl font-black">سجل المسح</h2>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                {scanHistory.length === 0 ? (
                  <p className="text-center text-gray-400 py-10">لا يوجد سجل مسح</p>
                ) : (
                  scanHistory.map((item, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border ${
                        item.status === 'success'
                          ? 'bg-green-500/10 border-green-500/20'
                          : 'bg-red-500/10 border-red-500/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-gray-400">
                          {new Date(item.scannedAt).toLocaleString('ar-EG')}
                        </span>
                        {item.status === 'success' ? (
                          <CheckCircle2 className="text-green-500" size={16} />
                        ) : (
                          <AlertCircle className="text-red-500" size={16} />
                        )}
                      </div>
                      <p className="text-sm font-black mb-1">{item.code}</p>
                      <p className="text-xs text-gray-400">{item.offerTitle}</p>
                      <p className="text-xs text-gray-400">العميل: {item.customerName}</p>
                      {item.errorMessage && (
                        <p className="text-xs text-red-400 mt-1">{item.errorMessage}</p>
                      )}
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => {
                  setScanHistory([]);
                  localStorage.removeItem('scan_history');
                  setShowHistory(false);
                }}
                className="mt-4 w-full py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-black text-sm hover:bg-red-500/20 transition-all"
              >
                مسح السجل
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
