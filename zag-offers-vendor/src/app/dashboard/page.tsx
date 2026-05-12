'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Tag, Clock, ArrowUpRight, ChevronLeft, Activity,
  Plus, Bell, CheckCircle2, Sparkles, Users, QrCode, 
  History, MessageSquare, TrendingUp, TrendingDown,
  LayoutDashboard, Store, ArrowRight, Zap, Target,
  MousePointer2, Eye, ShieldCheck, RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveImageUrl, Offer } from '@/lib/api';
import { useVendorStats, useVendorOffers } from '@/hooks/use-vendor-api';
import { useSocket } from '@/hooks/useSocket';
import PullToRefresh from '@/components/PullToRefresh';
import { secureStorage, secureUserData } from '@/lib/crypto';

// ── Components ──

/**
 * الرسم البياني المصغر المتطور (Enhanced Sparkline)
 */
const ModernSparkline = ({ color, trend }: { color: string, trend: number }) => {
  const points = useMemo(() => {
    return [30, 35, 25, 45, 30, 50, 40].map((v, i) => `${i * 15},${50 - v}`).join(' ');
  }, []);
  
  return (
    <div className="relative h-10 w-24 overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 100 50">
        <defs>
          <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" className={`stop-${color} opacity-20`} />
            <stop offset="100%" className="stop-transparent opacity-0" />
          </linearGradient>
        </defs>
        <motion.polyline
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className={`${color} filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]`}
        />
      </svg>
    </div>
  );
};

/**
 * كرت الإحصائيات الفاخر (Premium Stat Card)
 */
const StatCard = ({ card, index, loading = false }: { card: any, index: number, loading?: boolean }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, delay: index * 0.1 }}
    className="group relative"
  >
    <div className={`absolute inset-0 ${card.bg} blur-3xl opacity-0 group-hover:opacity-20 transition-opacity rounded-[2.5rem]`} />
    <div className={`glass rounded-[2.5rem] p-6 border ${card.border} relative overflow-hidden flex flex-col justify-between min-h-[180px] hover:border-white/20 transition-all duration-500`}>
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="flex justify-between">
            <div className="w-12 h-12 bg-white/5 rounded-2xl" />
            <div className="w-16 h-8 bg-white/5 rounded-xl" />
          </div>
          <div className="space-y-2">
            <div className="h-2 w-20 bg-white/5 rounded" />
            <div className="h-8 w-24 bg-white/5 rounded" />
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start">
            <div className={`w-12 h-12 ${card.bg} rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-xl`}>
              <card.icon size={24} className={card.color} />
            </div>
            <ModernSparkline color={card.color} trend={card.trend} />
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-text-dimmer uppercase tracking-[0.2em]">{card.label}</span>
              {card.trend !== 0 && (
                <div className={`flex items-center text-[9px] font-black px-1.5 py-0.5 rounded-full ${card.trend > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {card.trend > 0 ? '+' : ''}{card.trend}%
                </div>
              )}
            </div>
            <h3 className="text-3xl font-black text-text tracking-tighter tabular-nums group-hover:translate-x-1 transition-transform">
              {typeof card.value === 'number' ? card.value.toLocaleString('ar-EG') : card.value}
            </h3>
          </div>
          
          <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
             <ArrowUpRight size={14} className="text-text-dimmer" />
          </div>
        </>
      )}
    </div>
  </motion.div>
);

// ── Main Dashboard ──

export default function MerchantDashboard() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useVendorStats();
  const { data: offers, isLoading: offersLoading, refetch: refetchOffers } = useVendorOffers();
  const [cachedStats, setCachedStats] = useState<any>(null);
  const [notification, setNotification] = useState<{ title: string; body: string; type?: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load cached data immediately
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    const cached = secureStorage.get('cache_vendor_stats');
    if (cached) {
      setCachedStats(cached);
      setLastUpdated(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
    }
  }, []);

  const vendorUser = useMemo(() => {
    if (typeof window === 'undefined') return { id: '', name: 'تاجر' };
    try { return secureUserData.load() || { id: '', name: 'تاجر' }; } catch { return { id: '', name: 'تاجر' }; }
  }, []);
  
  const merchantId = vendorUser?.id ?? '';
  const storeName = stats?.storeName ?? vendorUser?.name ?? 'متجرك';

  // Update cache and timestamp when new stats arrive
  useEffect(() => {
    if (stats) {
      secureStorage.set('cache_vendor_stats', stats);
      setCachedStats(stats);
      setLastUpdated(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
    }
  }, [stats]);

  const socketRef = useSocket(merchantId);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handleNotify = (data: any) => {
      let title = 'إشعار جديد';
      let body = '';
      let type = 'info';
      
      if (data.type === 'COUPON_GENERATED') { 
        title = 'كوبون جديد 🎫'; 
        body = `عميل طلب كوبون لـ "${data.offerTitle}"`; 
        type = 'success';
        refetchStats(); 
      } else if (data.type === 'OFFER_APPROVED') { 
        title = 'تمت الموافقة ✅'; 
        body = `عرض "${data.offerTitle}" نشط الآن`;
        type = 'success';
        refetchOffers();
      }
      
      setNotification({ title, body: body || data.body || '', type });
      setTimeout(() => setNotification(null), 6000);
    };
    socket.on('merchant_notification', handleNotify);
    return () => { socket.off('merchant_notification', handleNotify); };
  }, [socketRef, refetchStats, refetchOffers]);

  const displayStats = stats || cachedStats;

  const statCards = useMemo(() => [
    { label: 'طلبات اليوم', value: displayStats?.todayClaims ?? 0, icon: Zap, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20', trend: 15 },
    { label: 'مسح اليوم', value: displayStats?.scansToday ?? 0, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', trend: 5 },
    { label: 'الزيارات', value: displayStats?.totalViewsCount ?? 0, icon: Eye, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', trend: 8 },
    { label: 'قاعدة العملاء', value: displayStats?.totalClaimsCount ?? 0, icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', trend: 12 },
  ], [displayStats]);

  const handleRefresh = async () => {
    setIsSyncing(true);
    await Promise.all([refetchStats(), refetchOffers()]);
    setTimeout(() => setIsSyncing(false), 800);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="relative min-h-screen pb-32 overflow-hidden bg-bg">
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

        <div className="p-4 sm:p-8 lg:p-12 dir-rtl max-w-7xl mx-auto">
          {/* Real-time Notification Portal */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="fixed top-24 left-4 right-4 sm:left-auto sm:right-8 sm:w-96 z-[1000] glass-heavy rounded-[2.5rem] border border-white/10 p-6 shadow-2xl flex gap-5 items-center shadow-primary/10"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${notification.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary/20 text-primary'}`}>
                  <Bell size={24} className="animate-bounce" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-black text-text tracking-tight">{notification.title}</h4>
                  <p className="text-[11px] text-text-dim mt-1 font-bold leading-relaxed">{notification.body}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-8">
            <div className="space-y-2">
              <motion.div 
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 px-3 py-1 bg-white/5 border border-white/5 rounded-full w-fit"
              >
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-text-dim uppercase tracking-[0.2em]">
                  المتجر نشط الآن {lastUpdated && `• تحديث ${lastUpdated}`}
                </span>
                {isSyncing && <RefreshCcw size={10} className="animate-spin text-primary ml-1" />}
              </motion.div>
              <h1 className="text-4xl sm:text-5xl font-black text-text tracking-tighter leading-[1.1]">
                مرحباً بك، <br className="sm:hidden" />
                <span className="bg-gradient-to-l from-primary to-primary-lt bg-clip-text text-transparent">{storeName}</span> ✨
              </h1>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link href="/dashboard/offers/new" className="flex-1 sm:flex-none bg-primary text-white h-14 px-8 rounded-2xl font-black text-sm shadow-2xl shadow-primary/30 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center gap-3">
                <Plus size={20} strokeWidth={3} /> إضافة عرض
              </Link>
              <button onClick={handleRefresh} className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-text-dim hover:text-primary transition-all border border-white/5 active:rotate-180 duration-500">
                <RefreshCcw size={20} className={isSyncing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {statsLoading && !cachedStats ? (
              Array.from({ length: 4 }).map((_, i) => <StatCard key={i} card={{}} index={i} loading={true} />)
            ) : (
              statCards.map((card, i) => <StatCard key={card.label} card={card} index={i} />)
            )}
          </div>

          {/* Quick Actions Hub */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
            {[
              { label: 'العروض', icon: Tag, href: '/dashboard/offers', color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
              { label: 'مسح الكود', icon: QrCode, href: '/dashboard/scan', color: 'text-primary', bg: 'bg-primary/5' },
              { label: 'الكوبونات', icon: History, href: '/dashboard/coupons', color: 'text-purple-400', bg: 'bg-purple-500/5' },
              { label: 'الملف الشخصي', icon: Store, href: '/dashboard/profile', color: 'text-blue-400', bg: 'bg-blue-500/5' },
            ].map((action, i) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <Link href={action.href} className={`flex flex-col items-center justify-center gap-4 p-8 rounded-[2.5rem] glass border border-white/5 hover:border-white/20 transition-all group active:scale-95 ${action.bg}`}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:bg-white/10`}>
                    <action.icon size={28} className={action.color} strokeWidth={2.5} />
                  </div>
                  <span className="text-[12px] font-black text-text tracking-tight">{action.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Main Insights Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Top Performing Offers */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
              className="lg:col-span-7 glass rounded-[3rem] border border-white/5 overflow-hidden"
            >
              <div className="px-8 py-7 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary shadow-lg">
                    <Target size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-text">الأكثر تأثيراً</h2>
                    <p className="text-[10px] font-bold text-text-dim mt-0.5">أعلى العروض تفاعلاً من قبل المستخدمين</p>
                  </div>
                </div>
                <TrendingUp size={20} className="text-secondary opacity-50" />
              </div>

              <div className="p-4 space-y-3">
                {displayStats?.topOffers?.length > 0 ? displayStats.topOffers.slice(0, 5).map((offer: any, idx: number) => (
                  <div key={offer.id} className="p-4 rounded-3xl hover:bg-white/[0.03] transition-all group border border-transparent hover:border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="text-[10px] font-black text-text-dimmer w-5 italic">#{idx + 1}</div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-black text-text leading-tight group-hover:text-primary transition-colors">{offer.title}</span>
                          <span className="text-[10px] font-bold text-secondary mt-1">{offer.discount} خصم</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-black text-text tabular-nums">
                        {offer.couponsCount} <span className="text-text-dim text-[9px] font-bold">كوبون</span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${Math.min((offer.couponsCount / (displayStats.totalClaimsCount || 1)) * 100 * 2, 100)}%` }}
                         className="h-full bg-gradient-to-r from-secondary to-emerald-400 rounded-full"
                       />
                    </div>
                  </div>
                )) : (
                  <div className="py-20 flex flex-col items-center text-center opacity-30">
                    <Zap size={48} strokeWidth={1} className="mb-4" />
                    <p className="text-[11px] font-black max-w-[180px]">ابدأ بإضافة عروضك لتظهر هنا إحصائيات التفاعل</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Right: Real-time Activity Feed */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}
              className="lg:col-span-5 glass rounded-[3rem] border border-white/5 overflow-hidden"
            >
              <div className="px-8 py-7 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-lg">
                    <Activity size={20} />
                  </div>
                  <h2 className="text-sm font-black text-text">النشاط المباشر</h2>
                </div>
                <Link href="/dashboard/coupons" className="text-[10px] font-black text-primary bg-primary/10 px-4 py-2 rounded-xl hover:bg-primary/20 transition-all">سجل العمليات</Link>
              </div>

              <div className="divide-y divide-white/5">
                {displayStats?.recentCoupons?.length > 0 ? displayStats.recentCoupons.slice(0, 6).map((c: any) => (
                  <div key={c.id} className="p-5 flex items-start gap-4 hover:bg-white/[0.02] transition-colors relative">
                    <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border border-white/5 ${c.status === 'USED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-primary/10 text-primary'}`}>
                      {c.status === 'USED' ? <ShieldCheck size={18} /> : <MousePointer2 size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-black text-text truncate">{c.customerName || 'عميل مجهول'}</span>
                        <span className="text-[9px] font-black text-text-dimmer tabular-nums">{new Date(c.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[10px] font-bold text-text-dim truncate">{c.offerTitle}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${c.status === 'USED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-primary/10 text-primary'}`}>
                          {c.status === 'USED' ? 'تم المسح ✅' : 'طلب كوبون 🎫'}
                        </span>
                        <span className="text-[8px] font-mono text-text-dimmer">#{c.code}</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-20 flex flex-col items-center text-center opacity-30">
                    <History size={48} strokeWidth={1} className="mb-4" />
                    <p className="text-[11px] font-black max-w-[180px]">بانتظار تفاعل العملاء مع عروضك قريباً</p>
                  </div>
                )}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </PullToRefresh>
  );
}
