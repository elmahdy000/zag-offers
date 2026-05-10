'use client';
import { useState } from 'react';
import { Tag, Edit3, Trash2, Plus, TrendingUp, Users, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, PauseCircle, Layers, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { vendorApi, resolveImageUrl } from '@/lib/api';
import { useVendorOffers, useDeleteOffer } from '@/hooks/use-vendor-api';
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
  // eslint-disable-next-line react-hooks/purity
  const daysLeft = Math.ceil((new Date(offer.endDate).getTime() - Date.now()) / 86_400_000);
  const isExpired = daysLeft <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl overflow-hidden group hover:border-primary/40 transition-all flex flex-col bg-white/[0.02] border border-white/5"
    >
      {/* Mini Image & Header */}
      <div className="relative h-28 bg-white/5 overflow-hidden">
        {offer.images && offer.images.length > 0 ? (
          <img
            src={resolveImageUrl(offer.images[0])}
            alt={offer.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
            <Tag size={24} className="text-white/20" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-[12px] font-black text-text group-hover:text-primary transition-colors line-clamp-1 leading-tight mb-3">
          {offer.title}
        </h3>

        {/* High-Density Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-white/5 rounded-xl px-3 py-2 border border-white/5 flex items-center justify-between">
            <TrendingUp size={11} className="text-primary/60" />
            <span className="text-[11px] font-black text-text">{offer.views || 0}</span>
          </div>
          <div className="bg-white/5 rounded-xl px-3 py-2 border border-white/5 flex items-center justify-between">
            <Users size={11} className="text-secondary/60" />
            <span className="text-[11px] font-black text-text">{offer._count?.coupons || 0}</span>
          </div>
        </div>

        {/* Expiry Status */}
        <div className={`flex items-center gap-2 text-[9px] font-black mb-4 ${
          isExpired ? 'text-red-500' : daysLeft <= 3 ? 'text-yellow-500' : 'text-text-dimmer'
        }`}>
          <Clock size={10} />
          {isExpired ? 'منتهي الصلاحية' : `ينتهي خلال ${daysLeft} يوم`}
        </div>

        {/* Actions - Modern & Compact */}
        <div className="mt-auto flex gap-2">
          <Link
            href={`/dashboard/offers/${offer.id}/edit`}
            className="flex-1 bg-white/5 hover:bg-white/10 text-text font-black text-[9px] uppercase tracking-wider py-2 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/5"
          >
            <Edit3 size={11} /> تعديل
          </Link>
          <button
            onClick={() => onDelete(offer.id)}
            className="w-9 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all border border-red-500/10"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function OffersListPage() {
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  // React Query hooks
  const { data: offers, isLoading, refetch } = useVendorOffers();
  const { mutate: deleteOffer, isPending: deleting } = useDeleteOffer();

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذا العرض؟')) return;
    
    deleteOffer(id, {
      onSuccess: () => {
        // Offers will be refetched automatically by React Query
      },
      onError: () => {
        alert('فشل الحذف، حاول مرة أخرى');
      },
    });
  };

  if (isLoading) return <DashboardSkeleton />;

  const filters = ['ALL', 'PENDING', 'ACTIVE', 'PAUSED', 'REJECTED', 'EXPIRED'];
  const offersArray = Array.isArray(offers) ? offers : [];
  const filtered = activeFilter === 'ALL' ? offersArray : offersArray.filter((o: Offer) => o.status === activeFilter);

  const grouped = filtered ? filtered.reduce((acc: Record<string, Offer[]>, offer: Offer) => {
    const cat = offer.store?.category?.name || 'عروض متنوعة';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(offer);
    return acc;
  }, {} as Record<string, Offer[]>) : {} as Record<string, Offer[]>;

  const counts: Record<string, number> = { ALL: offersArray.length };
  filters.slice(1).forEach((s: string) => { 
    counts[s] = offersArray.filter((o: Offer) => o.status === s).length; 
  });

  return (
    <div className="p-4 sm:p-8 dir-rtl animate-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-black text-text tracking-tight">قائمة العروض</h1>
          <p className="text-text-dim mt-2 font-bold flex items-center gap-2 text-xs">
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
            إجمالي {offers ? offers.length : 0} عرض — {offers ? offers.filter((o: Offer) => o.status === 'ACTIVE').length : 0} نشط حالياً
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
        (Object.entries(grouped) as [string, Offer[]][]).map(([category, catOffers]) => {
          const catOffersArray = (Array.isArray(catOffers) ? catOffers : []) as Offer[];
          return (
            <div key={category} className="mb-14">
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                  <Layers size={14} className="text-primary" />
                </div>
                <h2 className="text-sm font-black text-text uppercase tracking-wider">{category}</h2>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[10px] font-black text-text-dim bg-white/5 px-2 py-1 rounded-lg">
                  {catOffersArray.length}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {catOffersArray.map((offer: Offer) => (
                  <OfferCard key={offer.id} offer={offer} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
