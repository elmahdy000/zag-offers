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
const StatCard = ({ card, index, loading = false }: { card: any, index: number, loading?: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.02 }}
    className={`glass rounded-[2rem] p-5 border ${card.border} relative overflow-hidden group hover:scale-[1.02] transition-all`}
  >
    {loading ? (
       <div className="animate-pulse space-y-3">
          <div className="w-10 h-10 bg-white/5 rounded-xl" />
          <div className="h-2 w-16 bg-white/5 rounded" />
          <div className="h-6 w-20 bg-white/5 rounded" />
       </div>
    ) : (
      <>
        <div className={`w-11 h-11 ${card.bg} rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform`}>
          <card.icon size={22} className={card.color} />
        </div>
        <p className="text-[11px] font-black text-text-dimmer uppercase tracking-widest mb-1.5">{card.label}</p>
        <h3 className="text-3xl font-black text-white leading-none tabular-nums">
          {typeof card.value === 'number' ? card.value.toLocaleString('ar-EG') : card.value}
        </h3>
        {/* Decorative background icon */}
        <card.icon size={80} className={`absolute -bottom-4 -left-4 opacity-[0.03] rotate-12 ${card.color}`} />
      </>
    )}
  </motion.div>
);

export default function MerchantDashboard() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useVendorStats();
  const { data: offers, isLoading: offersLoading, refetch: refetchOffers } = useVendorOffers();
  const [cachedStats, setCachedStats] = useState<any>(null);
  const [notification, setNotification] = useState<{ title: string; body: string } | null>(null);

  // تحميل الكاش فوراً
  useEffect(() => {
    const cached = localStorage.getItem('cache_vendor_stats');
    if (cached) setCachedStats(JSON.parse(cached));
  }, []);

  const vendorUser = useMemo(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem('vendor_user') || '{}'); } catch { return {}; }
  }, []);
  
  const merchantId = vendorUser?.id ?? '';
  const storeName = stats?.storeName ?? vendorUser?.name ?? 'متجرك';

  // تحديث الكاش عند وصول البيانات
  useEffect(() => {
    if (stats) {
      localStorage.setItem('cache_vendor_stats', JSON.stringify(stats));
      setCachedStats(stats);
    }
  }, [stats]);

  // استخراج آخر 3 عروض
  const recentOffers = useMemo(() => {
    const arr = Array.isArray(offers) ? offers : [];
    if (arr.length > 0) return arr.slice(0, 3);
    
    // محاولة قراءة من كاش العروض
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('cache_vendor_offers_list');
      if (cached) {
        const cachedArr = JSON.parse(cached);
        return Array.isArray(cachedArr) ? cachedArr.slice(0, 3) : [];
      }
    }
    return [];
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
        refetchStats(); 
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
    { label: 'طلبات اليوم',      value: displayStats?.todayClaims ?? displayStats?.claimsToday ?? 0,  icon: Bell,         color: 'text-orange-400',  bg: 'bg-orange-400/10',  border: 'border-orange-400/20' },
    { label: 'مسح اليوم',        value: displayStats?.todayScans ?? displayStats?.scansToday ?? 0,   icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
    { label: 'عروض نشطة',        value: displayStats?.activeOffersCount ?? displayStats?.activeOffers ?? 0, icon: Sparkles,     color: 'text-blue-400',    bg: 'bg-blue-400/10',    border: 'border-blue-400/20' },
    { label: 'إجمالي الكوبونات', value: displayStats?.totalClaimsCount ?? displayStats?.totalClaims ?? 0,  icon: Users,        color: 'text-purple-400',  bg: 'bg-purple-400/10',  border: 'border-purple-400/20' },
  ], [displayStats]);

  const isActuallyLoading = statsLoading && !cachedStats;

  return (
    <div className="p-4 sm:p-6 lg:p-10 dir-rtl max-w-7xl mx-auto pb-28">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="fixed top-6 left-6 right-6 sm:left-auto sm:w-80 z-[500] bg-bg/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl p-5 flex gap-4 items-start"
          >
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center shrink-0"><Bell size={20} className="text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-text leading-tight">{notification.title}</p>
              <p className="text-[11px] text-text-dim mt-1.5 font-bold leading-relaxed">{notification.body}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-6">
        <div>
          <p className="text-[11px] font-black text-text-dimmer uppercase tracking-[0.25em] mb-2">نظرة عامة</p>
          <h1 className="text-4xl font-black text-text tracking-tight leading-tight">أهلاً، <span className="text-primary">{storeName}</span> ✨</h1>
        </div>
        <Link href="/dashboard/offers/new" className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 w-full sm:w-auto justify-center">
          <Plus size={20} strokeWidth={3} /> إضافة عرض
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {isActuallyLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCard key={i} card={{}} index={i} loading={true} />)
        ) : (
          statCards.map((card, i) => <StatCard key={card.label} card={card} index={i} />)
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {[
          { label: 'عرض جديد', icon: Plus,           href: '/dashboard/offers/new', bg: 'bg-primary text-white shadow-primary/20' },
          { label: 'مسح الكود', icon: QrCode,         href: '/dashboard/scan',       bg: 'bg-white/5 text-text border border-white/10 hover:bg-white/10' },
          { label: 'الكوبونات', icon: History,        href: '/dashboard/coupons',    bg: 'bg-white/5 text-text border border-white/10 hover:bg-white/10' },
          { label: 'الدعم الفني', icon: MessageSquare,  href: '/dashboard/chat',       bg: 'bg-white/5 text-text border border-white/10 hover:bg-white/10' },
        ].map(ql => (
          <Link key={ql.label} href={ql.href} className={`flex flex-col items-center gap-3 py-6 rounded-3xl font-black text-xs transition-all active:scale-95 ${ql.bg}`}>
            <ql.icon size={24} strokeWidth={2.5} /> {ql.label}
          </Link>
        ))}
      </div>

      {/* Lists Section - Side by Side on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        {/* Top Performing Offers */}
        <div className="glass rounded-[2rem] overflow-hidden border border-white/5 bg-white/[0.01]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/[0.01]">
            <h2 className="text-[12px] font-black text-text flex items-center gap-2">
              <TrendingUp size={16} className="text-secondary" /> الأكثر تفاعلاً
            </h2>
            <span className="text-[10px] font-bold text-text-dim px-2 py-0.5 bg-white/5 rounded-lg">أفضل الأداء</span>
          </div>
          <div className="divide-y divide-white/5">
            {displayStats?.topOffers?.length > 0 ? displayStats.topOffers.map((offer: any, idx: number) => (
              <div key={offer.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary font-black text-[11px] border border-secondary/10 shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-[12px] font-black text-text truncate leading-tight">{offer.title}</p>
                    <p className="text-[9px] font-bold text-secondary mt-0.5">{offer.discount} خصم</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-black text-text">{offer.couponsCount}</span>
                    <span className="text-[8px] font-bold text-text-dimmer uppercase">كوبون</span>
                  </div>
                  <div className="w-px h-6 bg-white/5" />
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-black text-text-dim">{offer.views}</span>
                    <span className="text-[8px] font-bold text-text-dimmer uppercase">مشاهدة</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-12 text-center flex flex-col items-center opacity-40">
                <Sparkles size={20} className="mb-2" />
                <p className="text-[10px] font-bold">لا يوجد بيانات كافية حالياً</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass rounded-[2rem] overflow-hidden border border-white/5 bg-white/[0.01]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/[0.01]">
            <h2 className="text-[12px] font-black text-text flex items-center gap-2">
              <History size={16} className="text-primary" /> آخر العمليات
            </h2>
            <Link href="/dashboard/coupons" className="text-[10px] font-bold text-primary">الكل</Link>
          </div>
          <div className="divide-y divide-white/5">
            {displayStats?.recentCoupons?.length > 0 ? displayStats.recentCoupons.slice(0, 4).map((c: any) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0 border border-white/5">
                  <QrCode size={16} className="text-text-dim" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[12px] font-black text-text truncate">{c.customerName || 'عميل'}</p>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-lg border ${
                      c.status === 'USED' ? 'bg-secondary/10 text-secondary border-secondary/20' : 'bg-primary/10 text-primary border-primary/20'
                    }`}>
                      {c.status === 'USED' ? 'تم المسح' : 'طلب'}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-text-dim truncate">{c.offerTitle}</p>
                </div>
                <div className="text-left shrink-0">
                   <p className="text-[10px] font-black text-text font-mono tracking-tighter">{c.code}</p>
                   <p className="text-[8px] font-bold text-text-dimmer mt-0.5">
                     {new Date(c.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                   </p>
                </div>
              </div>
            )) : (
              <div className="py-12 text-center flex flex-col items-center opacity-40">
                <Clock size={20} className="mb-2" />
                <p className="text-[10px] font-bold">لا توجد عمليات حالياً</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
