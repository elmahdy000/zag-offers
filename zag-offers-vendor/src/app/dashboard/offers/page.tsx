'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Tag, Edit3, Trash2, Plus, TrendingUp, Users, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, PauseCircle, Layers, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { vendorApi, resolveImageUrl } from '@/lib/api';
import { useVendorOffers, useDeleteOffer } from '@/hooks/use-vendor-api';
import { DashboardSkeleton } from '@/components/Skeleton';
import { motion } from 'framer-motion';
import { secureStorage } from '@/lib/crypto';

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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-[2rem] overflow-hidden group hover:border-primary/40 transition-all flex flex-col bg-white/[0.01] border border-white/5 shadow-xl"
    >
      {/* Header Info */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="relative w-16 h-16 rounded-2xl bg-white/5 overflow-hidden border border-white/10 shrink-0">
            {offer.images && offer.images.length > 0 ? (
              <Image
                src={resolveImageUrl(offer.images[0])}
                alt={offer.title}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/10">
                <Tag size={24} />
              </div>
            )}
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black border flex items-center gap-1.5 h-fit ${cfg.color}`}>
            {cfg.icon}
            {cfg.label}
          </div>
        </div>

        <h3 className="text-sm font-black text-white group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-4 min-h-[2.5rem]">
          {offer.title}
        </h3>

        {/* Dense Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white/[0.03] rounded-2xl p-3 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
               <TrendingUp size={12} className="text-primary" />
               <span className="text-[10px] font-black text-text-dim">المشاهدات</span>
            </div>
            <span className="text-lg font-black text-white tabular-nums">{offer.views || 0}</span>
          </div>
          <div className="bg-white/[0.03] rounded-2xl p-3 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
               <Users size={12} className="text-secondary" />
               <span className="text-[10px] font-black text-text-dim">الكوبونات</span>
            </div>
            <span className="text-lg font-black text-white tabular-nums">{offer._count?.coupons || 0}</span>
          </div>
        </div>

        {/* Date Info */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="text-text-dimmer flex items-center gap-1.5"><Calendar size={12} /> تاريخ البدء</span>
            <span className="text-text-dim">{new Date(offer.createdAt).toLocaleDateString('ar-EG')}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="text-text-dimmer flex items-center gap-1.5"><Clock size={12} /> الصلاحية</span>
            <span className={isExpired ? 'text-red-500' : daysLeft <= 3 ? 'text-yellow-500' : 'text-emerald-500'}>
              {isExpired ? 'منتهي' : `باقي ${daysLeft} يوم`}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-4 border-t border-white/5">
          <Link
            href={`/dashboard/offers/${offer.id}/edit`}
            className="flex-1 bg-primary text-white font-black text-[11px] py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95"
          >
            <Edit3 size={14} /> تعديل
          </Link>
          <button
            onClick={() => onDelete(offer.id)}
            className="w-11 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all border border-red-500/10 active:scale-95"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function OffersListPage() {
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cachedOffers, setCachedOffers] = useState<Offer[]>([]);

  const { data: offers, isLoading, refetch } = useVendorOffers();
  const { mutate: deleteOffer } = useDeleteOffer();

  useEffect(() => {
    const cached = secureStorage.get<Offer[]>('cache_vendor_offers_list');
    if (cached) setCachedOffers(cached);
  }, []);

  useEffect(() => {
    if (offers) {
      secureStorage.set('cache_vendor_offers_list', offers);
      setCachedOffers(offers);
    }
  }, [offers]);

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذا العرض نهائياً؟')) return;
    deleteOffer(id);
  };

  const displayOffers = Array.isArray(offers) ? offers : cachedOffers;
  const offersArray = Array.isArray(displayOffers) ? displayOffers : [];
  
  // Advanced Filtering & Search
  const filtered = offersArray.filter((o: Offer) => {
    const matchesFilter = activeFilter === 'ALL' || o.status === activeFilter;
    const matchesSearch = o.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.discount.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const grouped = filtered.reduce((acc: Record<string, Offer[]>, offer: Offer) => {
    const cat = offer.store?.category?.name || 'عروض عامة';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(offer);
    return acc;
  }, {} as Record<string, Offer[]>);

  const filters = ['ALL', 'PENDING', 'ACTIVE', 'PAUSED', 'REJECTED', 'EXPIRED'];
  const counts: Record<string, number> = { 
    ALL: offersArray.length,
    ...filters.slice(1).reduce((acc, f) => ({ ...acc, [f]: offersArray.filter(o => o.status === f).length }), {})
  };

  if (isLoading && cachedOffers.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="h-20 bg-white/5 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-white/5 rounded-3xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-10 dir-rtl max-w-7xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-black text-text tracking-tighter">إدارة العروض</h1>
            <button 
              onClick={() => refetch()} 
              className={`p-2.5 rounded-xl bg-white/5 border border-white/10 text-text-dim hover:text-primary hover:bg-primary/10 transition-all ${isLoading ? 'animate-spin' : ''}`}
              title="تحديث البيانات"
            >
              <TrendingUp size={18} className="rotate-90" />
            </button>
          </div>
          <p className="text-text-dim text-sm font-bold flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            {searchQuery ? `تم العثور على ${filtered.length} نتيجة بحث` : `لديك ${counts.ACTIVE} عرض نشط من إجمالي ${counts.ALL}`}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative flex-1 sm:min-w-[320px]">
             <input 
               type="text"
               placeholder="ابحث بالعنوان، الوصف، أو قيمة الخصم..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-4 pl-12 text-sm font-bold focus:border-primary transition-all text-right placeholder:text-text-dimmer"
             />
             <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
               {searchQuery && (
                 <button onClick={() => setSearchQuery('')} className="text-text-dimmer hover:text-white transition-colors">
                    <XCircle size={18} />
                 </button>
               )}
               <Tag size={18} className="text-white/20" />
             </div>
          </div>
          <Link
            href="/dashboard/offers/new"
            className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 border border-primary/20"
          >
            <Plus size={20} strokeWidth={3} /> إضافة عرض جديد
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-6 mb-10 scrollbar-none border-b border-white/5">
        {filters.map(f => {
          const cfg = f === 'ALL' ? null : STATUS_CONFIG[f];
          const isActive = activeFilter === f;
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-xs font-black transition-all shrink-0 border ${
                isActive
                  ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20'
                  : 'bg-white/5 text-text-dim border-white/5 hover:border-white/10 hover:text-text'
              }`}
            >
              {cfg?.icon}
              {f === 'ALL' ? 'كل العروض' : cfg?.label}
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${isActive ? 'bg-white/20' : 'bg-white/5 text-text-dimmer'}`}>
                {counts[f] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid Content */}
      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 glass rounded-[3rem] flex flex-col items-center justify-center text-center border-dashed border-white/10">
          <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-8 border border-white/5">
            <Tag size={40} className="text-white/10" />
          </div>
          <h3 className="text-2xl font-black text-text mb-3">لم يتم العثور على عروض</h3>
          <p className="text-text-dim font-bold text-sm max-w-xs mx-auto leading-relaxed">
            {searchQuery ? `لا يوجد نتائج تطابق بحث "${searchQuery}"` : 'ابدأ بإضافة أول عرض لمتجرك الآن'}
          </p>
        </motion.div>
      ) : (
        (Object.entries(grouped) as [string, Offer[]][]).map(([category, catOffers]) => (
          <div key={category} className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                <Layers size={18} className="text-primary" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">{category}</h2>
              <div className="flex-1 h-px bg-gradient-to-l from-white/10 to-transparent" />
              <span className="text-[11px] font-black text-text-dim bg-white/5 px-3 py-1 rounded-xl border border-white/5">
                {catOffers.length} عرض
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
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
