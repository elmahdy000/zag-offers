'use client';
import { useState, useEffect } from 'react';
import { Tag, Edit3, Trash2, Plus, TrendingUp, Users, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, PauseCircle, Layers, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { vendorApi, resolveImageUrl } from '@/lib/api';
import { DashboardSkeleton } from '@/components/Skeleton';
import { motion } from 'framer-motion';

interface Offer {
  id: string;
  title: string;
  discount: string;
  status: string;
  views: number;
  endDate: string;
  createdAt: string;
  images: string[];
  store?: { category?: { name: string } };
  _count: { coupons: number };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; order: number }> = {
  PENDING:  { label: 'مراجعة', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: <AlertCircle size={10} />, order: 1 },
  ACTIVE:   { label: 'نشط',     color: 'bg-secondary/10 text-secondary border-secondary/20',  icon: <CheckCircle2 size={10} />, order: 2 },
  PAUSED:   { label: 'متوقف',   color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',   icon: <PauseCircle size={10} />, order: 3 },
  REJECTED: { label: 'مرفوض',   color: 'bg-red-500/10 text-red-500 border-red-500/20',    icon: <XCircle size={10} />, order: 4 },
  EXPIRED:  { label: 'منتهي',   color: 'bg-white/5 text-text-dim border-white/5',       icon: <Clock size={10} />, order: 5 },
};

function OfferCard({ offer, onDelete }: { offer: Offer; onDelete: (id: string) => void }) {
  const cfg = STATUS_CONFIG[offer.status] || STATUS_CONFIG.EXPIRED;
  const daysLeft = Math.ceil((new Date(offer.endDate).getTime() - Date.now()) / 86_400_000);
  const isExpired = daysLeft <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-[2rem] overflow-hidden group hover:border-primary/30 transition-all flex flex-col bg-white/[0.01]"
    >
      {/* Image Section */}
      <div className="relative h-32 bg-white/5 overflow-hidden">
        {offer.images?.length > 0 ? (
          <img
            src={resolveImageUrl(offer.images[0])}
            alt={offer.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Tag size={32} className="text-white/5" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />

        {/* Status & Category */}
        <div className="absolute top-3 inset-x-3 flex justify-between items-start">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black border backdrop-blur-md uppercase tracking-wider ${cfg.color}`}>
            {cfg.icon}
            {cfg.label}
          </div>
          {offer.discount && (
            <div className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-xl shadow-primary/20">
              {offer.discount}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-[13px] font-black text-text group-hover:text-primary transition-colors line-clamp-2 leading-relaxed mb-4">
          {offer.title}
        </h3>

        {/* Grid Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 flex flex-col items-center justify-center text-center">
            <p className="text-[8px] font-black text-text-dim uppercase tracking-[0.1em] mb-1">المشاهدات</p>
            <p className="text-sm font-black text-text">{offer.views || 0}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 flex flex-col items-center justify-center text-center">
            <p className="text-[8px] font-black text-text-dim uppercase tracking-[0.1em] mb-1">الطلبات</p>
            <p className="text-sm font-black text-text">{offer._count?.coupons || 0}</p>
          </div>
        </div>

        {/* Expiry Bar */}
        <div className={`mt-auto flex items-center justify-between gap-2 text-[10px] font-black px-3 py-2 rounded-xl border border-white/5 ${
          isExpired ? 'text-red-500 bg-red-500/5' :
          daysLeft <= 3 ? 'text-yellow-500 bg-yellow-500/5' :
          'text-text-dim bg-white/5'
        }`}>
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            {isExpired ? 'منتهي الصلاحية' : `ينتهي خلال ${daysLeft} يوم`}
          </div>
          {!isExpired && (
            <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
               <div 
                 className={`h-full transition-all duration-1000 ${daysLeft <= 3 ? 'bg-yellow-500' : 'bg-primary'}`} 
                 style={{ width: `${Math.min(100, (daysLeft / 30) * 100)}%` }} 
               />
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <Link
          href={`/dashboard/offers/${offer.id}/edit`}
          className="flex-1 bg-white/5 hover:bg-white/10 text-text font-black text-[10px] uppercase tracking-wider py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/5"
        >
          <Edit3 size={12} /> تعديل
        </Link>
        <button
          onClick={() => onDelete(offer.id)}
          className="w-10 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all border border-red-500/10"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </motion.div>
  );
}

export default function OffersListPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  useEffect(() => {
    vendorApi()
      .get<Offer[]>('/offers/my')
      .then((res) => setOffers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذا العرض؟')) return;
    try {
      await vendorApi().delete(`/offers/${id}`);
      setOffers((prev) => prev.filter((o) => o.id !== id));
    } catch {
      alert('فشل الحذف، حاول مرة أخرى');
    }
  };

  if (loading) return <DashboardSkeleton />;

  const filters = ['ALL', 'PENDING', 'ACTIVE', 'PAUSED', 'REJECTED', 'EXPIRED'];
  const filtered = activeFilter === 'ALL' ? offers : offers.filter(o => o.status === activeFilter);

  const grouped = filtered.reduce<Record<string, Offer[]>>((acc, offer) => {
    const cat = offer.store?.category?.name || 'عروض متنوعة';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(offer);
    return acc;
  }, {});

  const counts: Record<string, number> = { ALL: offers.length };
  filters.slice(1).forEach(s => { counts[s] = offers.filter(o => o.status === s).length; });

  return (
    <div className="p-4 sm:p-8 dir-rtl animate-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-black text-text tracking-tight">قائمة العروض</h1>
          <p className="text-text-dim mt-2 font-bold flex items-center gap-2 text-xs">
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
            إجمالي {offers.length} عرض — {offers.filter(o => o.status === 'ACTIVE').length} نشط حالياً
          </p>
        </div>
        <Link
          href="/dashboard/offers/new"
          className="bg-primary text-white px-6 py-3.5 rounded-xl font-black text-[13px] shadow-lg shadow-primary/20 hover:bg-primary-lt active:scale-95 transition-all flex items-center gap-2 w-full md:w-auto justify-center"
        >
          <Plus size={18} /> إضافة عرض جديد
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none border-b border-white/5">
        {filters.map(f => {
          const cfg = f === 'ALL' ? null : STATUS_CONFIG[f];
          const label = f === 'ALL' ? 'الكل' : cfg?.label || f;
          const count = counts[f] || 0;
          const isActive = activeFilter === f;
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black transition-all shrink-0 border ${
                isActive
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                  : 'bg-white/5 text-text-dim border-white/5 hover:border-white/10 hover:text-text'
              }`}
            >
              {cfg?.icon}
              {label}
              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${isActive ? 'bg-white/20' : 'bg-white/5 text-text-dimmer'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="py-24 glass rounded-[2.5rem] flex flex-col items-center justify-center text-center border-dashed border-white/10">
          <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 border border-white/5">
            <Tag size={36} className="text-white/10" />
          </div>
          <h3 className="text-lg font-black text-text mb-2">لا توجد نتائج</h3>
          <p className="text-text-dim font-bold text-xs">
            {activeFilter === 'ALL' ? 'ابدأ بإضافة عرضك الأول لجذب العملاء' : `لا يوجد عروض في قسم "${STATUS_CONFIG[activeFilter]?.label}" حالياً`}
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([category, catOffers]) => (
          <div key={category} className="mb-14">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                <Layers size={14} className="text-primary" />
              </div>
              <h2 className="text-sm font-black text-text uppercase tracking-wider">{category}</h2>
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[10px] font-black text-text-dim bg-white/5 px-2 py-1 rounded-lg">
                {catOffers.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {catOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
