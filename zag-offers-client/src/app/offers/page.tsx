"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Flame, Utensils, Coffee, Shirt, Dumbbell, Sparkles, Hospital, ShoppingCart, BookOpen, Car, Wrench, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OfferCard, SkeletonCard } from '@/components/offer-card';
import { API_URL } from '@/lib/constants';

const AREAS = [
  'الجامعة', 'القومية', 'وسط البلد', 'المحافظة', 'طلبة عويضة', 'منطقة الفيلات',
];

interface Category {
  id: string;
  name: string;
}

interface Offer {
  id: string;
  title: string;
  discount: string;
  endDate: string;
  createdAt: string;
  images: string[];
  store: {
    id: string;
    name: string;
    area: string;
    categoryId?: string;
    category?: Category;
  };
}

const CAT_ICONS: Record<string, React.ReactNode> = {
  'مطاعم':         <Utensils size={14} />,
  'كافيهات':       <Coffee size={14} />,
  'ملابس':         <Shirt size={14} />,
  'جيم':           <Dumbbell size={14} />,
  'تجميل':         <Sparkles size={14} />,
  'عيادات':        <Hospital size={14} />,
  'سوبرماركت':    <ShoppingCart size={14} />,
  'دورات':         <BookOpen size={14} />,
  'خدمات سيارات': <Car size={14} />,
  'خدمات محلية':  <Wrench size={14} />,
  'default':       <Sparkles size={14} />,
};

function OffersPageContent() {
  const searchParams  = useSearchParams();
  const initialCat    = searchParams.get('categoryId') || '';

  const [offers,     setOffers]     = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [activeCat,  setActiveCat]  = useState(initialCat);
  const [area,       setArea]       = useState('');
  const [sort,       setSort]       = useState('newest');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [offRes, catRes] = await Promise.all([
          fetch(`${API_URL}/offers?limit=200`),
          fetch(`${API_URL}/stores/categories`),
        ]);
        if (offRes.ok) {
          const data = await offRes.json();
          setOffers(Array.isArray(data) ? data : (data.items || []));
        }
        if (catRes.ok) setCategories(await catRes.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    let list = offers.filter(o => {
      const q = search.toLowerCase();
      const matchSearch = !q
        || o.title.toLowerCase().includes(q)
        || o.store?.name?.toLowerCase().includes(q);
      const matchCat  = activeCat ? (o.store?.category?.id === activeCat || o.store?.categoryId === activeCat) : true;
      const matchArea = area ? o.store?.area === area : true;
      return matchSearch && matchCat && matchArea;
    });

    if (sort === 'expiry') {
      list = [...list].sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    } else if (sort === 'discount') {
      list = [...list].sort((a, b) => (parseInt(b.discount) || 0) - (parseInt(a.discount) || 0));
    } else {
      list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [offers, search, activeCat, area, sort]);

  // Grouping logic
  const grouped = useMemo(() => {
    const groups: Record<string, Offer[]> = {};
    filtered.forEach(o => {
      const catName = o.store?.category?.name || 'عروض أخرى';
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(o);
    });
    return groups;
  }, [filtered]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" dir="rtl">

      {/* ─── Page Title ──────────────────────────────────── */}
      <div className="mb-6 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF6B00]/10 rounded-xl flex items-center justify-center text-[#FF6B00]">
            <Flame size={22} />
          </div>
          استكشف العروض
        </h1>
        <p className="text-[#9A9A9A] text-xs sm:text-sm font-bold mt-2">
          عروض حية ومعتمدة من أفضل المحلات في الزقازيق
        </p>
      </div>

      {/* ─── Filters Card ────────────────────────────────── */}
      <div className="bg-[#252525] border border-white/[0.07] rounded-2xl p-5 mb-8 space-y-4">

        {/* Search */}
        <div className="relative">
          <Search
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9A9A9A] pointer-events-none"
            size={18}
          />
          <input
            type="text"
            placeholder="ابحث عن عرض أو محل..."
            className="w-full bg-[#1E1E1E] border border-white/[0.07] rounded-xl
                       pr-11 pl-4 py-3 text-sm font-bold text-[#F0F0F0]
                       placeholder:text-[#9A9A9A] outline-none
                       focus:border-[#FF6B00] focus:shadow-[0_0_0_3px_rgba(255,107,0,0.15)]
                       transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Category Ribbon */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth -mx-1 px-1">
          <button
            onClick={() => setActiveCat('')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm whitespace-nowrap transition-all border
                       ${!activeCat 
                         ? 'bg-[#FF6B00] border-transparent text-white shadow-lg' 
                         : 'bg-[#1E1E1E] border-white/[0.05] text-[#9A9A9A] hover:border-white/20'}`}
          >
            <Sparkles size={14} /> الكل
          </button>
          {categories.map(c => {
            const isActive = activeCat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all border
                           ${isActive 
                             ? 'bg-[#FF6B00] border-[#FF6B00] text-white shadow-[0_8px_20px_rgba(255,107,0,0.3)]' 
                             : 'bg-[#1E1E1E] border-white/[0.07] text-[#9A9A9A] hover:border-white/20'}`}
              >
                {CAT_ICONS[c.name] || CAT_ICONS.default} {c.name}
              </button>
            );
          })}
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            className="w-full bg-[#1E1E1E] border border-white/[0.07] rounded-xl
                       pr-4 py-3 text-sm font-bold text-[#F0F0F0] cursor-pointer outline-none
                       focus:border-[#FF6B00] transition-all appearance-none"
            value={area}
            onChange={e => setArea(e.target.value)}
          >
            <option value="">📍 كل المناطق</option>
            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select
            className="flex-1 min-w-[160px] bg-[#1E1E1E] border border-white/[0.07] rounded-xl
                       pr-4 py-3 text-sm font-bold text-[#F0F0F0] cursor-pointer outline-none
                       focus:border-[#FF6B00] transition-all appearance-none"
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            <option value="newest">🕐 الأحدث أولاً</option>
            <option value="expiry">⏰ ينتهي قريباً</option>
            <option value="discount">💰 أعلى خصم</option>
          </select>
        </div>
      </div>

      {/* ─── Results Bar ─────────────────────────────────── */}
      {!loading && (
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm font-semibold text-[#9A9A9A]">
            وجدنا <span className="text-[#F0F0F0] font-bold">{filtered.length}</span> عرض متاح
          </p>
          {(search || activeCat || area) && (
            <button
              onClick={() => { setSearch(''); setActiveCat(''); setArea(''); }}
              className="text-xs font-bold text-[#FF6B00] hover:underline"
            >
              ✕ مسح الفلاتر
            </button>
          )}
        </div>
      )}

      {/* ─── Grouped Content ─────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-24 gap-4 text-center">
          <div className="w-20 h-20 bg-[#252525] rounded-full flex items-center justify-center text-4xl">🔍</div>
          <h3 className="text-lg font-bold">لا توجد عروض تطابق بحثك</h3>
          <p className="text-sm text-[#9A9A9A] max-w-xs leading-relaxed">
            جرّب تغيير كلمة البحث أو تحديد فلاتر مختلفة
          </p>
        </div>
      ) : (
        /* Render Grouped by Category */
        <div className="space-y-16">
          {Object.entries(grouped).map(([categoryName, categoryOffers]) => (
            <div key={categoryName} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-[#FF6B00]/10 rounded-lg flex items-center justify-center text-[#FF6B00]">
                  {CAT_ICONS[categoryName] || <Layers size={16} />}
                </div>
                <h2 className="text-lg sm:text-xl font-black text-[#F0F0F0]">{categoryName}</h2>
                <div className="h-px flex-1 bg-white/[0.04]" />
                <span className="text-[9px] font-black text-[#9A9A9A] uppercase tracking-wider bg-white/[0.02] px-3 py-1 rounded-full border border-white/[0.05]">
                  {categoryOffers.length}
                </span>
              </div>

              {/* Offers Grid for this category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {categoryOffers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OffersListingPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-[#9A9A9A] font-bold">
        جاري تهيئة العروض...
      </div>
    }>
      <OffersPageContent />
    </Suspense>
  );
}
