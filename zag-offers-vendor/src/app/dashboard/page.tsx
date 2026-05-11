'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Tag, TrendingUp, Plus, Loader2, Bell, CheckCircle2,
  Clock, Users, ArrowUpRight, Calendar, ChevronLeft,
  Store, History, Sparkles, MessageSquare, QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { vendorApi, resolveImageUrl } from '@/lib/api';
import { useVendorStats } from '@/hooks/use-vendor-api';
import { useSocket } from '@/hooks/useSocket';

interface Offer {
  id: string;
  title: string;
  discount: string;
  status: string;
  images: string[];
  _count: { coupons: number };
  endDate: string;
}

function greet() {
  const h = new Date().getHours();
  if (h < 12) return 'صباح الخير';
  if (h < 17) return 'مساء الخير';
  return 'مساء النور';
}

export default function MerchantDashboard() {
  const { data: stats, isLoading: statsLoading, refetch } = useVendorStats();
  const [recentOffers, setRecentOffers] = useState<Offer[]>([]);
  const [notification, setNotification] = useState<{ title: string; body: string } | null>(null);

  const vendorUser = (() => {
    try { return JSON.parse(localStorage.getItem('vendor_user') || '{}'); } catch { return {}; }
  })();
  const merchantId = vendorUser?.id ?? '';
  const storeName = stats?.storeName ?? vendorUser?.name ?? 'متجرك';

  const socketRef = useSocket(merchantId);

  useEffect(() => {
    vendorApi().get('/offers/my-offers').then(r => {
      const arr = Array.isArray(r.data) ? r.data : r.data?.items ?? [];
      setRecentOffers(arr.slice(0, 3));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.on('merchant_notification', (data: { type: string; title?: string; body?: string; offerTitle?: string; storeName?: string }) => {
      let title = 'إشعار جديد';
      let body = '';
      if (data.type === 'OFFER_APPROVED') { title = 'تمت الموافقة على عرضك ✅'; body = `عرض "${data.offerTitle}" متاح الآن للعملاء`; }
      else if (data.type === 'OFFER_REJECTED') { title = 'تم رفض العرض ❌'; body = `عرض "${data.offerTitle}" تم رفضه`; }
      else if (data.type === 'STORE_APPROVED') { title = 'تمت الموافقة على متجرك ✅'; body = `متجرك "${data.storeName}" معتمد الآن`; }
      else if (data.type === 'COUPON_GENERATED') { title = 'كوبون جديد 🎫'; body = `عميل طلب كوبون لـ "${data.offerTitle}"`; refetch(); }
      else { title = data.title || title; body = data.body || ''; }
      setNotification({ title, body });
      setTimeout(() => setNotification(null), 7000);
    });
    return () => { socket.off('merchant_notification'); };
  }, [socketRef, refetch]);

  const today = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const statCards = [
    { label: 'طلبات اليوم',      value: stats?.claimsToday ?? 0,  icon: Bell,         color: 'text-orange-400',  bg: 'bg-orange-400/10',  border: 'border-orange-400/20' },
    { label: 'مسح اليوم',        value: stats?.scansToday ?? 0,   icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
    { label: 'عروض نشطة',        value: stats?.activeOffers ?? 0, icon: Sparkles,     color: 'text-blue-400',    bg: 'bg-blue-400/10',    border: 'border-blue-400/20' },
    { label: 'إجمالي الكوبونات', value: stats?.totalClaims ?? 0,  icon: Users,        color: 'text-purple-400',  bg: 'bg-purple-400/10',  border: 'border-purple-400/20' },
  ];

  const quickLinks = [
    { label: 'عرض جديد',  icon: Plus,           href: '/dashboard/offers/new', color: 'bg-primary text-white shadow-primary/30' },
    { label: 'مسح كوبون', icon: QrCode,          href: '/dashboard/scan',       color: 'bg-white/5 text-text border border-white/10' },
    { label: 'الكوبونات', icon: History,         href: '/dashboard/coupons',    color: 'bg-white/5 text-text border border-white/10' },
    { label: 'الدعم',     icon: MessageSquare,   href: '/dashboard/chat',       color: 'bg-white/5 text-text border border-white/10' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 dir-rtl max-w-5xl mx-auto pb-28">
      {/* ── Real-time Toast Notification ── */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[500] bg-bg/95 backdrop-blur-xl border border-white/10 rounded-[1.8rem] shadow-2xl overflow-hidden"
          >
            <div className="flex items-start gap-3 p-4">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                <Bell size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black text-text leading-tight">{notification.title}</p>
                {notification.body && <p className="text-[11px] text-text-dim mt-1 font-medium">{notification.body}</p>}
              </div>
              <button onClick={() => setNotification(null)} className="text-text-dimmer hover:text-text p-1">
                <ArrowUpRight size={14} />
              </button>
            </div>
            <motion.div
              initial={{ width: '100%' }} animate={{ width: '0%' }}
              transition={{ duration: 7, ease: 'linear' }}
              className="h-0.5 bg-primary absolute bottom-0 left-0"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8 pt-2">
        <div>
          <p className="text-[11px] font-bold text-text-dimmer uppercase tracking-[0.2em] mb-1">{today}</p>
          <h1 className="text-2xl font-black text-text tracking-tight leading-tight">
            {greet()}،<br />
            <span className="text-primary">{storeName}</span>
          </h1>
        </div>
        <Link href="/dashboard/offers/new"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-2xl font-black text-[12px] shadow-lg shadow-primary/30 active:scale-95 transition-all">
          <Plus size={16} /> عرض جديد
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 glass rounded-[1.8rem] animate-pulse" />
            ))
          : statCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`glass rounded-[1.8rem] p-4 border ${card.border} relative overflow-hidden`}
              >
                <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <card.icon size={18} className={card.color} />
                </div>
                <p className="text-[10px] font-bold text-text-dimmer uppercase tracking-wider mb-0.5">{card.label}</p>
                <h3 className="text-2xl font-black text-text leading-none">{card.value.toLocaleString('ar-EG')}</h3>
              </motion.div>
            ))
        }
      </div>

      {/* ── Quick Links ── */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {quickLinks.map(ql => (
          <Link key={ql.label} href={ql.href}
            className={`flex flex-col items-center gap-2 py-3.5 rounded-2xl font-black text-[10px] tracking-wide transition-all active:scale-95 ${ql.color}`}>
            <ql.icon size={20} />
            {ql.label}
          </Link>
        ))}
      </div>

      {/* ── Recent Offers ── */}
      <div className="glass rounded-[2rem] overflow-hidden mb-5">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="text-[13px] font-black text-text flex items-center gap-2">
            <Tag size={16} className="text-primary" /> عروضي الأخيرة
          </h2>
          <Link href="/dashboard/offers" className="text-[11px] font-bold text-primary hover:underline">عرض الكل</Link>
        </div>

        {recentOffers.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-3 text-center px-6">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center">
              <Tag size={24} className="text-white/10" />
            </div>
            <p className="text-text-dim font-bold text-sm">لا توجد عروض بعد</p>
            <Link href="/dashboard/offers/new"
              className="text-[11px] font-black text-primary border border-primary/30 px-4 py-2 rounded-xl hover:bg-primary/10 transition-all">
              أضف أول عرض
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {recentOffers.map(offer => {
              const cfg: Record<string, { label: string; color: string }> = {
                ACTIVE: { label: 'نشط', color: 'text-emerald-400 bg-emerald-400/10' },
                PENDING: { label: 'مراجعة', color: 'text-yellow-400 bg-yellow-400/10' },
                REJECTED: { label: 'مرفوض', color: 'text-red-400 bg-red-400/10' },
                PAUSED: { label: 'متوقف', color: 'text-blue-400 bg-blue-400/10' },
                EXPIRED: { label: 'منتهي', color: 'text-text-dim bg-white/5' },
              };
              const s = cfg[offer.status] || cfg.EXPIRED;
              return (
                <Link key={offer.id} href={`/dashboard/offers/${offer.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors group">
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-white/5 border border-white/5">
                    {offer.images?.[0]
                      ? <img src={resolveImageUrl(offer.images[0])} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full flex items-center justify-center"><Tag size={16} className="text-white/20" /></div>
                    }
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-text truncate group-hover:text-primary transition-colors">{offer.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-primary font-black text-[11px]">{offer.discount}</span>
                      <span className="flex items-center gap-1 text-[10px] text-text-dim">
                        <Users size={10} /> {offer._count?.coupons || 0}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-1 rounded-lg shrink-0 ${s.color}`}>{s.label}</span>
                  <ChevronLeft size={14} className="text-text-dimmer group-hover:text-primary transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Recent Coupons ── */}
      <div className="glass rounded-[2rem] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="text-[13px] font-black text-text flex items-center gap-2">
            <Clock size={16} className="text-primary" /> آخر الكوبونات
          </h2>
          <Link href="/dashboard/coupons" className="text-[11px] font-bold text-primary hover:underline">عرض الكل</Link>
        </div>

        {!stats?.recentCoupons || stats.recentCoupons.length === 0 ? (
          <div className="py-10 text-center text-text-dim">
            <History size={28} className="mx-auto mb-2 opacity-20" />
            <p className="text-xs font-bold">لا توجد كوبونات حتى الآن</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {stats.recentCoupons.slice(0, 5).map((c: { id: string; customerName: string; offerTitle: string; code: string; createdAt: string }) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 font-black text-[13px] text-text-dimmer uppercase shrink-0">
                  {c.customerName?.[0] || 'ع'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-text truncate">{c.customerName || 'عميل زاچ'}</p>
                  <p className="text-[10px] text-text-dim truncate">{c.offerTitle}</p>
                </div>
                <div className="text-left shrink-0">
                  <p className="text-[10px] font-black text-primary font-mono">{c.code}</p>
                  <p className="text-[9px] text-text-dimmer mt-0.5">
                    {new Date(c.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
