'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Tag, TrendingUp, Plus, Bell, CheckCircle2,
  Clock, Users, ArrowUpRight, Sparkles, MessageSquare, QrCode, History, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { vendorApi, resolveImageUrl } from '@/lib/api';
import { useVendorStats, useVendorOffers } from '@/hooks/use-vendor-api';
import { useSocket } from '@/hooks/useSocket';

// تحسين: استخدام مكونات ثابتة لتقليل إعادة الرندر
const StatCard = ({ card, index }: { card: any, index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.05 }}
    className={`glass rounded-[1.8rem] p-4 border ${card.border} relative overflow-hidden`}
  >
    <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
      <card.icon size={18} className={card.color} />
    </div>
    <p className="text-[10px] font-bold text-text-dimmer uppercase tracking-wider mb-0.5">{card.label}</p>
    <h3 className="text-2xl font-black text-text leading-none">{card.value.toLocaleString('ar-EG')}</h3>
  </motion.div>
);

export default function MerchantDashboard() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useVendorStats();
  const { data: offers, isLoading: offersLoading, refetch: refetchOffers } = useVendorOffers();
  const [cachedStats, setCachedStats] = useState<any>(null);
  const [notification, setNotification] = useState<{ title: string; body: string } | null>(null);

  const vendorUser = useMemo(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem('vendor_user') || '{}'); } catch { return {}; }
  }, []);
  
  const merchantId = vendorUser?.id ?? '';
  const storeName = stats?.storeName ?? vendorUser?.name ?? 'متجرك';

  // تحسين: إدارة الكاش للإحصائيات
  useEffect(() => {
    if (stats) {
      localStorage.setItem('cache_vendor_stats', JSON.stringify(stats));
      setCachedStats(stats);
    } else {
      const cached = localStorage.getItem('cache_vendor_stats');
      if (cached) setCachedStats(JSON.parse(cached));
    }
  }, [stats]);

  // استخراج آخر 3 عروض من قائمة العروض الكلية
  const recentOffers = useMemo(() => {
    if (!offers) {
      const cached = localStorage.getItem('cache_vendor_offers_list');
      if (cached) {
        const arr = JSON.parse(cached);
        return Array.isArray(arr) ? arr.slice(0, 3) : [];
      }
      return [];
    }
    const arr = Array.isArray(offers) ? offers : [];
    return arr.slice(0, 3);
  }, [offers]);

  // تحديث البيانات عند عودة الاتصال
  useEffect(() => {
    const handleOnline = () => {
      refetchStats();
      refetchOffers();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [refetchStats, refetchOffers]);

  const socketRef = useSocket(merchantId);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handleNotify = (data: any) => {
      let title = 'إشعار جديد';
      let body = '';
      if (data.type === 'COUPON_GENERATED') { 
        title = 'كوبون جديد 🎫'; body = `عميل طلب كوبون لـ "${data.offerTitle}"`; 
        refetchStats(); // تحديث الإحصائيات فوراً
      } else if (data.type === 'OFFER_APPROVED') { title = 'تمت الموافقة ✅'; body = `عرض "${data.offerTitle}" نشط الآن`; }
      else if (data.type === 'OFFER_REJECTED') { title = 'تم الرفض ❌'; body = `عرض "${data.offerTitle}" تم رفضه`; }
      
      setNotification({ title, body: body || data.body || '' });
      setTimeout(() => setNotification(null), 6000);
    };
    socket.on('merchant_notification', handleNotify);
    return () => { socket.off('merchant_notification', handleNotify); };
  }, [socketRef, refetchStats]);

  const displayStats = stats || cachedStats;

  const statCards = useMemo(() => [
    { label: 'طلبات اليوم',      value: displayStats?.claimsToday ?? 0,  icon: Bell,         color: 'text-orange-400',  bg: 'bg-orange-400/10',  border: 'border-orange-400/20' },
    { label: 'مسح اليوم',        value: displayStats?.scansToday ?? 0,   icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
    { label: 'عروض نشطة',        value: displayStats?.activeOffers ?? 0, icon: Sparkles,     color: 'text-blue-400',    bg: 'bg-blue-400/10',    border: 'border-blue-400/20' },
    { label: 'إجمالي الكوبونات', value: displayStats?.totalClaims ?? 0,  icon: Users,        color: 'text-purple-400',  bg: 'bg-purple-400/10',  border: 'border-purple-400/20' },
  ], [displayStats]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 dir-rtl max-w-5xl mx-auto pb-28">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="fixed top-6 left-6 right-6 sm:left-auto sm:w-80 z-[500] bg-bg/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl p-4 flex gap-4 items-start"
          >
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shrink-0"><Bell size={18} className="text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-black text-text leading-tight">{notification.title}</p>
              <p className="text-[10px] text-text-dim mt-1 font-bold">{notification.body}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 pt-2">
        <div>
          <p className="text-[10px] font-bold text-text-dimmer uppercase tracking-[0.2em] mb-1">لوحة التحكم</p>
          <h1 className="text-2xl font-black text-text tracking-tight">أهلاً بك، <span className="text-primary">{storeName}</span></h1>
        </div>
        <Link href="/dashboard/offers/new" className="bg-primary text-white px-4 py-2.5 rounded-2xl font-black text-[12px] shadow-lg shadow-primary/30 active:scale-95 transition-all flex items-center gap-2">
          <Plus size={16} /> عرض جديد
        </Link>
      </div>

      {/* Stats Grid - Optimized rendering */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statsLoading && !cachedStats ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 glass rounded-[1.8rem] animate-pulse" />)
        ) : (
          statCards.map((card, i) => <StatCard key={card.label} card={card} index={i} />)
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2 mb-8">
        {[
          { label: 'عرض جديد', icon: Plus,           href: '/dashboard/offers/new', bg: 'bg-primary text-white shadow-primary/20' },
          { label: 'مسح الكود', icon: QrCode,         href: '/dashboard/scan',       bg: 'bg-white/5 text-text border border-white/10' },
          { label: 'الكوبونات', icon: History,        href: '/dashboard/coupons',    bg: 'bg-white/5 text-text border border-white/10' },
          { label: 'الدعم',     icon: MessageSquare,  href: '/dashboard/chat',       bg: 'bg-white/5 text-text border border-white/10' },
        ].map(ql => (
          <Link key={ql.label} href={ql.href} className={`flex flex-col items-center gap-2 py-4 rounded-2xl font-black text-[10px] transition-all active:scale-95 ${ql.bg}`}>
            <ql.icon size={20} /> {ql.label}
          </Link>
        ))}
      </div>

      {/* Lists Section - Side by Side on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Offers */}
        <div className="glass rounded-[2rem] overflow-hidden border border-white/5">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/[0.01]">
            <h2 className="text-[12px] font-black text-text flex items-center gap-2"><Tag size={16} className="text-primary" /> عروضي الأخيرة</h2>
            <Link href="/dashboard/offers" className="text-[10px] font-bold text-primary">الكل</Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentOffers.length > 0 ? recentOffers.map(offer => (
              <Link key={offer.id} href={`/dashboard/offers/${offer.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors group">
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-white/5 border border-white/5 shrink-0">
                  <img src={resolveImageUrl(offer.images?.[0])} className="w-full h-full object-cover" loading="lazy" alt="" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black text-text truncate group-hover:text-primary transition-colors">{offer.title}</p>
                  <p className="text-[10px] font-bold text-primary mt-0.5">{offer.discount}</p>
                </div>
                <ChevronLeft size={14} className="text-text-dimmer group-hover:text-primary" />
              </Link>
            )) : <div className="py-10 text-center text-[11px] text-text-dimmer font-bold">لا توجد عروض حالياً</div>}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass rounded-[2rem] overflow-hidden border border-white/5">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/[0.01]">
            <h2 className="text-[12px] font-black text-text flex items-center gap-2"><Clock size={16} className="text-primary" /> آخر العمليات</h2>
            <Link href="/dashboard/coupons" className="text-[10px] font-bold text-primary">الكل</Link>
          </div>
          <div className="divide-y divide-white/5">
            {stats?.recentCoupons?.slice(0, 4).map((c: any) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center font-black text-primary text-[12px] shrink-0">
                  {c.customerName?.[0] || 'ع'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-text truncate">{c.customerName || 'عميل'}</p>
                  <p className="text-[9px] text-text-dimmer truncate">{c.offerTitle}</p>
                </div>
                <span className="text-[10px] font-black text-primary font-mono bg-primary/5 px-2 py-1 rounded-lg">{c.code}</span>
              </div>
            )) || <div className="py-10 text-center text-[11px] text-text-dimmer font-bold">لا توجد عمليات حالياً</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
