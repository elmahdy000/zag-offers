'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Tag, TrendingUp, Plus, ScanLine, Loader2, Bell, CheckCircle2, Clock, Users, ArrowUpRight, Calendar, ChevronLeft } from 'lucide-react';
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
        msg = `🎫 عميل جديد طلب كوبون لـ "${data.offerTitle || ''}"`;
        setStats(prev => prev ? { ...prev, claimsToday: prev.claimsToday + 1, totalClaims: prev.totalClaims + 1 } : null);
      }
      else if (data.type === 'COUPON_REDEEMED') {
        msg = `✅ تم تفعيل كوبون بنجاح!`;
        setStats(prev => prev ? { ...prev, scansToday: prev.scansToday + 1 } : null);
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
      setMessage({ type: 'error', text: 'لا يوجد متجر مرتبط بحسابك' });
      return;
    }
    setRedeeming(true);
    setMessage(null);

    let finalCode = couponCode.toUpperCase().trim();
    if (finalCode && !finalCode.startsWith('ZAG-') && finalCode.length === 6) {
      finalCode = `ZAG-${finalCode}`;
    }

    try {
      await vendorApi().post('/coupons/redeem', { code: finalCode, storeId });
      setMessage({ type: 'success', text: '🎉 تم تفعيل الكوبون بنجاح!' });
      setCouponCode('');
      const res = await vendorApi().get<DashboardStats>('/stores/my-dashboard');
      setStats(res.data);
    } catch {
      setMessage({ type: 'error', text: 'الكود غير صحيح أو منتهي الصلاحية' });
    } finally {
      setRedeeming(false);
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
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
            className="fixed top-8 left-8 glass p-5 rounded-2xl shadow-2xl z-[100] flex items-center gap-4 max-w-sm border-primary/20">
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
        {/* Recent Activity */}
        <div className="lg:col-span-2 glass rounded-[2rem] overflow-hidden flex flex-col min-h-[450px]">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
            <h2 className="text-base font-black text-text flex items-center gap-2.5">
              <Clock className="text-primary" size={18} /> النشاط الأخير
            </h2>
            <Link href="/dashboard/coupons" className="text-[11px] font-black text-primary uppercase tracking-wider hover:underline">عرض الكل</Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            {stats?.recentCoupons && stats.recentCoupons.length > 0 ? (
              <div className="divide-y divide-white/5">
                {stats.recentCoupons.map((coupon) => (
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
                    <div className="text-left">
                      <p className="text-[11px] font-black text-primary uppercase tracking-widest font-mono">{coupon.code}</p>
                      <p className="text-[9px] text-text-dimmer mt-1 font-bold">{new Date(coupon.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-text-dim p-12 text-center">
                <Tag size={40} className="opacity-10 mb-4" />
                <p className="font-bold text-sm">لا يوجد نشاط مسجل اليوم</p>
              </div>
            )}
          </div>
        </div>

        {/* Redemption Panel */}
        <div className="space-y-6">
          <div className="glass p-7 rounded-[2rem] relative overflow-hidden border-primary/20 bg-gradient-to-br from-white/[0.02] to-transparent">
            <h3 className="text-base font-black text-text mb-2">تفعيل الكوبونات</h3>
            <p className="text-[11px] text-text-dim mb-6 leading-relaxed">تحقق من صحة الكوبون وقم بتفعيله فوراً لخدمة العميل.</p>
            
            <div className="space-y-4">
              <input type="text" value={couponCode} onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setMessage(null); }}
                placeholder="ZAG-XXXXX"
                className="w-full bg-bg border border-white/5 rounded-xl px-4 py-3.5 text-center text-lg font-mono font-black tracking-[0.2em] focus:border-primary outline-none transition-all placeholder:text-text-dimmer/30" />
              
              <button disabled={redeeming || !storeId} onClick={handleRedeem}
                className="w-full bg-primary text-white py-4 rounded-xl font-black text-[13px] flex items-center justify-center gap-2.5 hover:bg-primary-lt transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
                {redeeming ? <Loader2 className="animate-spin" size={18} /> : <ScanLine size={18} />}
                تأكيد الكود
              </button>
            </div>

            <AnimatePresence>
              {message && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className={`mt-4 p-3 rounded-xl text-[11px] font-black text-center ${message.type === 'success' ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
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
    </div>
  );
}
