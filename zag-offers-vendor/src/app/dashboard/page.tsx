'use client';
import { useState, useEffect } from 'react';
import { LayoutDashboard, Tag, TrendingUp, Plus, ScanLine, Loader2, Bell, CheckCircle2, Clock, Users, ArrowUpRight, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardSkeleton } from '@/components/Skeleton';
import { io } from 'socket.io-client';
import { vendorApi, getCookie, getVendorUser } from '@/lib/api';

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

export default function MerchantDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const vendorUser = getVendorUser();
  const merchantId = vendorUser?.id ?? '';
  const storeName = stats?.storeName ?? vendorUser?.name ?? 'متجرك';
  const storeId = stats?.storeId;

  useEffect(() => {
    vendorApi()
      .get<DashboardStats>('/stores/my-dashboard')
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));

    const token = getCookie('auth_token');
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      if (merchantId) {
        socket.emit('join_room', { token, userId: merchantId });
      }
    });

    socket.on('merchant_notification', (data: any) => {
      let msg = '🔔 إشعار جديد';
      if (data.type === 'STORE_APPROVED') msg = `✅ تم قبول متجرك "${data.storeName}"!`;
      else if (data.type === 'STORE_REJECTED') msg = `❌ تم رفض متجرك "${data.storeName}".`;
      else if (data.type === 'NEW_REVIEW') msg = `🔔 تقييم جديد: ${data.comment || 'بدون تعليق'}`;
      else if (data.type === 'OFFER_REJECTED') msg = `❌ تم رفض عرضك "${data.offerTitle}"`;
      else if (data.type === 'COUPON_GENERATED') {
        msg = `🎫 عميل جديد طلب كوبون لعرض "${data.offerTitle || ''}"`;
        // Update stats real-time
        setStats(prev => prev ? { ...prev, claimsToday: prev.claimsToday + 1, totalClaims: prev.totalClaims + 1 } : null);
      }
      else if (data.type === 'COUPON_REDEEMED') {
        msg = `✅ تم تفعيل كوبون بنجاح!`;
        // Update stats real-time
        setStats(prev => prev ? { ...prev, scansToday: prev.scansToday + 1 } : null);
        // Refresh full stats after a delay to get accurate derived data
        setTimeout(() => {
          vendorApi().get<DashboardStats>('/stores/my-dashboard').then(res => setStats(res.data));
        }, 2000);
      }
      else if (data.message) msg = `📢 ${data.message}`;
      
      setNotification(msg);
      setTimeout(() => setNotification(null), 7000);
    });

    return () => { socket.disconnect(); };
  }, [merchantId]);

  const handleRedeem = async () => {
    if (!couponCode || !storeId) {
      setMessage({ type: 'error', text: '❌ لا يوجد متجر مرتبط بحسابك' });
      return;
    }
    setRedeeming(true);
    setMessage(null);

    try {
      await vendorApi().post('/coupons/redeem', { code: couponCode, storeId });
      setMessage({ type: 'success', text: '🎉 تم تفعيل الكوبون بنجاح!' });
      setCouponCode('');
      const res = await vendorApi().get<DashboardStats>('/stores/my-dashboard');
      setStats(res.data);
    } catch {
      setMessage({ type: 'error', text: '❌ الكود غير صحيح أو منتهي الصلاحية' });
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  const statCards = [
    { label: 'طلبات اليوم', value: stats?.claimsToday ?? 0, icon: Bell, color: 'text-orange-500', bg: 'bg-orange-500/10', trend: 'نشاط مرتفع' },
    { label: 'مسح اليوم', value: stats?.scansToday ?? 0, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', trend: 'استقرار' },
    { label: 'عروض نشطة', value: stats?.activeOffers ?? 0, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10', trend: 'أداء ممتاز' },
    { label: 'إجمالي الطلبات', value: stats?.totalClaims ?? 0, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10', trend: 'تراكمي' },
  ];

  return (
    <div className="p-8 dir-rtl animate-in max-w-7xl mx-auto relative">
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
            className="fixed top-8 right-8 glass p-6 rounded-[2rem] shadow-2xl z-[100] flex items-center gap-4 max-w-sm border-primary/20">
            <div className="bg-primary/20 p-3 rounded-2xl"><Bell className="text-primary" size={24} /></div>
            <p className="text-sm font-black leading-relaxed text-white">{notification}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-tight">أهلاً بك، {storeName} 👋</h1>
          <div className="flex items-center gap-3 mt-2 text-text-dim">
            <Calendar size={16} className="text-primary" />
            <span className="text-sm font-bold">{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        <button onClick={() => (window.location.href = '/dashboard/offers/new')}
          className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
          <Plus size={20} /> إضافة عرض جديد
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {statCards.map((card, i) => (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            key={card.label} className="glass p-6 rounded-[2.5rem] hover:border-primary/30 transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 ${card.bg} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500`}>
                <card.icon className={card.color} size={28} />
              </div>
              <ArrowUpRight className="text-white/10 group-hover:text-primary transition-colors" size={24} />
            </div>
            <div>
              <p className="text-text-dim font-bold text-[10px] uppercase tracking-widest mb-1">{card.label}</p>
              <h3 className="text-3xl font-black text-white leading-none">{card.value.toLocaleString('ar-EG')}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mt-3">{card.trend}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 glass rounded-[2.5rem] overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <h2 className="text-xl font-black text-white flex items-center gap-3">
              <Clock className="text-primary" size={22} /> النشاط الأخير
            </h2>
            <button className="text-xs font-black text-primary uppercase tracking-widest hover:underline">عرض السجل</button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {stats?.recentCoupons && stats.recentCoupons.length > 0 ? (
              <div className="divide-y divide-white/5">
                {stats.recentCoupons.map((coupon) => (
                  <div key={coupon.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 font-black text-white/20">
                        {coupon.customerName?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-white leading-tight">{coupon.customerName || 'عميل مميز'}</p>
                        <p className="text-xs text-text-dim mt-1">طلب كوبون لـ: <span className="text-white/60 font-bold">{coupon.offerTitle}</span></p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black text-primary uppercase tracking-widest leading-none font-mono">{coupon.code}</p>
                      <p className="text-[10px] text-text-dim mt-1.5 font-bold">{new Date(coupon.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-text-dim p-12 text-center">
                <Tag size={48} className="opacity-10 mb-4" />
                <p className="font-bold">لا يوجد نشاط حالي لليوم</p>
              </div>
            )}
          </div>
        </div>

        {/* Redemption Panel */}
        <div className="space-y-8">
          <div className="glass p-8 rounded-[2.5rem] relative overflow-hidden border-primary/20">
            <h3 className="text-xl font-black text-white mb-2">تفعيل الكوبونات</h3>
            <p className="text-xs text-text-dim mb-6 leading-relaxed">أدخل الكود المقدم من العميل لتأكيد عملية الخصم فوراً.</p>
            
            <div className="space-y-4">
              <input type="text" value={couponCode} onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setMessage(null); }}
                placeholder="مثال: ZAG-X7Y2Z"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-center text-xl font-mono font-black tracking-widest focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-white/10" />
              
              <button disabled={redeeming || !storeId} onClick={handleRedeem}
                className="w-full bg-white text-bg py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-primary hover:text-white transition-all shadow-xl shadow-black/40 disabled:opacity-50">
                {redeeming ? <Loader2 className="animate-spin" /> : <ScanLine size={20} />}
                تأكيد الكود
              </button>
            </div>

            <AnimatePresence>
              {message && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className={`mt-4 p-4 rounded-2xl text-xs font-black text-center ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="glass p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-transparent border-primary/10 group">
             <div className="flex justify-between items-start mb-6">
                <TrendingUp className="text-primary group-hover:scale-125 transition-transform" size={32} />
                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-lg uppercase tracking-widest">Growth Tip</span>
             </div>
             <h3 className="text-lg font-black text-white mb-2 leading-tight">عروض التوفير تجذب<br/>عملاء أكثر!</h3>
             <p className="text-xs text-text-dim leading-relaxed font-medium">المتاجر التي تقدم خصماً بنسبة 30% أو أكثر تحقق معدل تحويل أعلى بـ 3 مرات.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
