'use client';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Tag, Edit3, Trash2, Plus, TrendingUp, Users, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, PauseCircle, Layers, Search, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { resolveImageUrl } from '@/lib/api';
import { useVendorOffers, useDeleteOffer } from '@/hooks/use-vendor-api';
import { motion } from 'framer-motion';
import { secureStorage } from '@/lib/crypto';
import { ConfirmModal } from '@/components/ConfirmModal';

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
  EXPIRED:  { label: 'منتهي',   color: 'bg-glass-heavy text-text-dim border-glass-border',       icon: <Clock size={10} />, order: 5 },
};

function OfferCard({ offer, onDelete, now }: { offer: Offer; onDelete: (id: string) => void; now: number }) {
  const cfg = STATUS_CONFIG[offer.status] || STATUS_CONFIG.EXPIRED;
  const daysLeft = Math.ceil((new Date(offer.endDate).getTime() - now) / 86_400_000);
  const isExpired = daysLeft <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="vendor-offer-card glass rounded-[1.25rem] overflow-hidden group hover:border-primary/40 transition-all flex flex-col bg-glass border border-glass-border"
    >
      {/* Header Info */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="relative w-16 h-16 rounded-2xl bg-glass-heavy overflow-hidden border border-glass-border shrink-0">
            {offer.images && offer.images.length > 0 ? (
              <Image
                src={resolveImageUrl(offer.images[0])}
                alt={offer.title}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                <Tag size={24} />
              </div>
            )}
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black border flex items-center gap-1.5 h-fit ${cfg.color}`}>
            {cfg.icon}
            {cfg.label}
          </div>
        </div>

        <h3 className="text-sm font-black text-text group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-4 min-h-[2.5rem]">
          {offer.title}
        </h3>

        {/* Dense Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="vendor-offer-stat bg-glass-heavy rounded-2xl p-3 border border-glass-border">
            <div className="flex items-center gap-2 mb-1">
               <TrendingUp size={12} className="text-primary" />
               <span className="text-[10px] font-black text-text-dim">المشاهدات</span>
            </div>
            <span className="text-lg font-black text-text tabular-nums">{offer.views || 0}</span>
          </div>
          <div className="vendor-offer-stat bg-glass-heavy rounded-2xl p-3 border border-glass-border">
            <div className="flex items-center gap-2 mb-1">
               <Users size={12} className="text-secondary" />
               <span className="text-[10px] font-black text-text-dim">الكوبونات</span>
            </div>
            <span className="text-lg font-black text-text tabular-nums">{offer._count?.coupons || 0}</span>
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
        <div className="mt-auto flex gap-2 pt-4 border-t border-glass-border">
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
  const [cachedOffers] = useState<Offer[]>(() => secureStorage.get<Offer[]>('cache_vendor_offers_list') || []);
  const [now] = useState(() => Date.now());
  
  // State for Custom Confirm Modal
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  const { data: offers, isLoading, refetch } = useVendorOffers();
  const { mutate: deleteOffer, isPending: isDeleting } = useDeleteOffer();

  // تحميل الكاش من التخزين الآمن
  // تحديث الكاش عند النجاح
  useEffect(() => {
    if (offers) {
      secureStorage.set('cache_vendor_offers_list', offers);
    }
  }, [offers]);

  const handleDelete = (id: string) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = () => {
    if (deleteModal.id) {
      deleteOffer(deleteModal.id, {
        onSuccess: () => {
          setDeleteModal({ isOpen: false, id: null });
        }
      });
    }
  };

  const displayOffers = Array.isArray(offers) ? offers : cachedOffers;
  const offersArray = useMemo(() => Array.isArray(displayOffers) ? displayOffers : [], [displayOffers]);
  
  const filters = useMemo(() => ['ALL', 'PENDING', 'ACTIVE', 'PAUSED', 'REJECTED', 'EXPIRED'], []);

  const filtered = useMemo(() => offersArray.filter((o: Offer) => {
    const matchesFilter = activeFilter === 'ALL' || o.status === activeFilter;
    const matchesSearch = o.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.discount.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  }), [offersArray, activeFilter, searchQuery]);

  const grouped = useMemo(() => filtered.reduce((acc: Record<string, Offer[]>, offer: Offer) => {
    const cat = offer.store?.category?.name || 'عروض عامة';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(offer);
    return acc;
  }, {} as Record<string, Offer[]>), [filtered]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { ALL: offersArray.length };
    for (const f of filters.slice(1)) {
      result[f] = offersArray.filter((o: Offer) => o.status === f).length;
    }
    return result;
  }, [offersArray, filters]);

  if (isLoading && cachedOffers.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-5">
        <div className="h-20 bg-glass-heavy rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-glass-heavy rounded-3xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="vendor-offers-page p-4 sm:p-10 dir-rtl max-w-7xl mx-auto pb-20">
      {/* Header Section */}
      <section className="vendor-offers-hero flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 mb-5">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black text-text tracking-tight">إدارة العروض</h1>
            <button 
              onClick={() => refetch()} 
              className={`p-2.5 rounded-xl bg-glass-heavy border border-glass-border text-text-dim hover:text-primary hover:bg-primary/10 transition-all ${isLoading ? 'animate-spin' : ''}`}
              title="تحديث البيانات"
            >
              <RefreshCw size={18} />
            </button>
          </div>
          <p className="text-text-dim text-sm font-bold flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            {searchQuery ? `تم العثور على ${filtered.length} نتيجة بحث` : `لديك ${counts.ACTIVE} عرض نشط من إجمالي ${counts.ALL}`}
          </p>
        </div>
        <div className="vendor-offers-tools flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <label className="relative w-full sm:w-[300px]">
            <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dimmer" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="ابحث في عروضك"
              className="h-12 w-full rounded-xl border border-glass-border bg-card pr-11 pl-4 text-xs font-bold text-text"
            />
          </label>
          <Link
            href="/dashboard/offers/new"
            className="bg-primary text-white px-6 h-12 rounded-xl font-black text-xs shadow-lg shadow-primary/20 hover:bg-primary-lt active:scale-95 transition-all flex items-center justify-center gap-2 border border-primary/20 shrink-0 whitespace-nowrap"
          >
            <Plus size={20} strokeWidth={3} /> إضافة عرض جديد
          </Link>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="vendor-offers-filters flex gap-2 overflow-x-auto mb-7 scrollbar-none">
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
                  : 'bg-glass-heavy text-text-dim border-glass-border hover:border-glass-border hover:text-text'
              }`}
            >
              {cfg?.icon}
              {f === 'ALL' ? 'كل العروض' : cfg?.label}
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${isActive ? 'bg-white/20' : 'bg-glass-heavy text-text-dimmer'}`}>
                {counts[f] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid Content */}
      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="vendor-offers-empty glass rounded-[1.25rem] flex flex-col items-center justify-center text-center border-glass-border">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 border border-primary/20">
            <Tag size={28} className="text-primary" />
          </div>
          <h3 className="text-2xl font-black text-text mb-3">لم يتم العثور على عروض</h3>
          <p className="text-text-dim font-bold text-sm max-w-xs mx-auto leading-relaxed">
            {searchQuery ? `لا يوجد نتائج تطابق بحث "${searchQuery}"` : 'ابدأ بإضافة أول عرض لمتجرك الآن'}
          </p>
          {searchQuery ? (
            <button type="button" onClick={() => setSearchQuery('')} className="vendor-empty-action">
              عرض كل العروض
            </button>
          ) : (
            <Link href="/dashboard/offers/new" className="vendor-empty-action">
              <Plus size={17} /> إضافة أول عرض
            </Link>
          )}
        </motion.div>
      ) : (
        (Object.entries(grouped) as [string, Offer[]][]).map(([category, catOffers]) => (
          <section key={category} className="vendor-offers-category mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                <Layers size={18} className="text-primary" />
              </div>
              <h2 className="text-base font-black text-text tracking-tight">{category}</h2>
              <div className="flex-1 h-px bg-glass-border" />
              <span className="text-[11px] font-black text-text-dim bg-glass-heavy px-3 py-1 rounded-xl border border-glass-border">
                {catOffers.length} عرض
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {catOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} onDelete={handleDelete} now={now} />
              ))}
            </div>
          </section>
        ))
      )}
      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="حذف العرض"
        message="هل أنت متأكد من حذف هذا العرض نهائياً؟ لا يمكن التراجع عن هذه العملية."
      />
    </div>
  );
}
