"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OfferCard, SkeletonCard } from '@/components/offer-card';
import { API_URL } from '@/lib/constants';

const AREAS = [
  'الجامعة', 'القومية', 'وسط البلد', 'المحافظة', 'طلبة عويضة', 'منطقة الفيلات',
];

const CAT_ICONS: Record<string, string> = {
  'مطاعم': '🍔', 'كافيهات': '☕', 'ملابس': '👗', 'جيم': '💪',
  'تجميل': '💅', 'عيادات': '🏥', 'سوبرماركت': '🛒', 'default': '🏷️',
};

function OffersPageContent() {
  const searchParams  = useSearchParams();
  const initialCat    = searchParams.get('categoryId') || '';

  const [offers,     setOffers]     = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
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
    }

    return list;
  }, [offers, search, activeCat, area, sort]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" dir="rtl">

      {/* ─── Page Title ──────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-3xl font-black flex items-center gap-3">
          <span className="w-10 h-10 bg-[#FF6B00]/10 rounded-xl flex items-center justify-center text-[#FF6B00]">
            <Flame size={20} />
          </span>
          استكشف جميع العروض
        </h1>
        <p className="text-[#9A9A9A] text-sm font-semibold mt-1 mr-13">
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

        {/* Second row: area + category + sort */}
        <div className="flex flex-wrap gap-3">

          {/* Area select */}
          <select
            className="flex-1 min-w-[160px] bg-[#1E1E1E] border border-white/[0.07] rounded-xl
                       pr-4 py-3 text-sm font-bold text-[#F0F0F0] cursor-pointer outline-none
                       focus:border-[#FF6B00] transition-all appearance-none"
            value={area}
            onChange={e => setArea(e.target.value)}
          >
            <option value="">📍 كل المناطق</option>
            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          {/* Category select */}
          <select
            className="flex-1 min-w-[160px] bg-[#1E1E1E] border border-white/[0.07] rounded-xl
                       pr-4 py-3 text-sm font-bold text-[#F0F0F0] cursor-pointer outline-none
                       focus:border-[#FF6B00] transition-all appearance-none"
            value={activeCat}
            onChange={e => setActiveCat(e.target.value)}
          >
            <option value="">📂 كل الفئات</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {CAT_ICONS[c.name] || '🏷️'} {c.name}
              </option>
            ))}
          </select>

          {/* Sort select */}
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
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-semibold text-[#9A9A9A]">
            عرض <span className="text-[#F0F0F0] font-bold">{filtered.length}</span> نتيجة
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

      {/* ─── Grid ────────────────────────────────────────── */}
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
          <button
            onClick={() => { setSearch(''); setActiveCat(''); setArea(''); }}
            className="mt-2 px-6 py-2.5 bg-[#FF6B00] text-white text-sm font-bold rounded-full hover:opacity-90 transition-opacity"
          >
            🔄 إعادة ضبط الفلاتر
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((offer, i) => (
              <motion.div
                key={offer.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.25) }}
              >
                <OfferCard offer={offer} />
              </motion.div>
            ))}
          </AnimatePresence>
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
