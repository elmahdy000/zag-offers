"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Flame, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { API_URL } from '@/lib/constants';
import { OfferCard, SkeletonCard } from '@/components/offer-card';

interface Offer {
  id: string;
  title: string;
  discount: string;
  endDate: string;
  featured: boolean;
  store: {
    id: string;
    name: string;
    logo: string;
    area: string;
    categoryId?: string;
    category?: { id: string; name: string };
  };
}

const CAT_ICONS: Record<string, string> = {
  'مطاعم': '🍔', 'كافيهات': '☕', 'ملابس': '👗', 'جيم': '💪',
  'تجميل': '💅', 'عيادات': '🏥', 'سوبرماركت': '🛒',
  'دورات': '📚', 'خدمات سيارات': '🚗', 'default': '🏷️',
};

function HomePageContent() {
  const searchParams = useSearchParams();
  const catIdParam = searchParams.get('categoryId');

  const [offers,     setOffers]     = useState<Offer[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [activeCat,  setActiveCat]  = useState(catIdParam || '');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [offRes, catRes] = await Promise.all([
        fetch(`${API_URL}/offers?limit=100`),
        fetch(`${API_URL}/stores/categories`),
      ]);
      if (offRes.ok) {
        const data = await offRes.json();
        setOffers(Array.isArray(data) ? data : (data.items || []));
      }
      if (catRes.ok) setCategories(await catRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (catIdParam) setActiveCat(catIdParam); }, [catIdParam]);

  const filteredOffers = useMemo(() => {
    return offers.filter(o => {
      const q = search.toLowerCase();
      const matchSearch = !q
        || o.title.toLowerCase().includes(q)
        || o.store.name.toLowerCase().includes(q);
      const matchCat = activeCat
        ? (o.store.category?.id === activeCat || o.store.categoryId === activeCat)
        : true;
      return matchSearch && matchCat;
    });
  }, [offers, search, activeCat]);

  return (
    <div className="pb-20" dir="rtl">

      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative pt-12 pb-16 px-4 overflow-hidden text-center">
        {/* glow bg */}
        <div className="absolute inset-x-0 top-0 h-[420px] -z-10
                        bg-[radial-gradient(ellipse_700px_300px_at_50%_-60px,rgba(255,107,0,0.18),transparent)]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto space-y-5"
        >
          {/* badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5
                          bg-[#FF6B00]/10 border border-[#FF6B00]/25
                          rounded-full text-[#FF6B00] text-xs font-black tracking-widest">
            <span className="live-dot" />
            عروض حية في الزقازيق
          </div>

          {/* heading */}
          <h1 className="text-4xl sm:text-5xl font-black leading-tight">
            اكتشف أفضل{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#FF6B00] to-[#FF8C35]">
              العروض والخصومات
            </span>
            <br className="hidden sm:block" /> في مدينتك
          </h1>

          <p className="text-[#9A9A9A] text-base sm:text-lg font-medium max-w-xl mx-auto leading-relaxed">
            وفّر أكثر مع كوبونات حصرية من أفضل المطاعم، الكافيهات، المحلات والخدمات في الزقازيق
          </p>

          {/* search bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="flex items-center gap-2 max-w-xl mx-auto
                       bg-[#252525] border border-white/[0.07] rounded-2xl
                       p-2 shadow-[0_8px_32px_rgba(0,0,0,0.45)]
                       focus-within:border-[#FF6B00] focus-within:shadow-[0_0_24px_rgba(255,107,0,0.2)]
                       transition-all duration-200"
          >
            <Search className="text-[#9A9A9A] mx-2 flex-shrink-0" size={18} />
            <input
              type="text"
              placeholder="ابحث عن عرض، محل، أو قسم..."
              className="flex-1 bg-transparent border-none outline-none text-[#F0F0F0]
                         text-sm font-bold placeholder:text-[#9A9A9A] min-w-0"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button
              className="flex-shrink-0 px-5 py-3 bg-gradient-to-br from-[#FF6B00] to-[#D95A00]
                         text-white text-sm font-black rounded-xl
                         shadow-[0_4px_14px_rgba(255,107,0,0.35)]
                         hover:shadow-[0_6px_20px_rgba(255,107,0,0.45)]
                         hover:scale-[1.02] active:scale-95 transition-all"
            >
              🔍 بحث
            </button>
          </motion.div>

          {/* quick stats */}
          <div className="flex justify-center gap-8 pt-2 flex-wrap">
            {[
              { value: offers.length  || '…', label: 'عرض نشط' },
              { value: [...new Set(offers.map(o => o.store?.id))].length || '…', label: 'متجر معتمد' },
              { value: categories.length || '…', label: 'فئة متنوعة' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-black text-[#FF6B00]">{s.value}</div>
                <div className="text-xs text-[#9A9A9A] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── Categories Bar ────────────────────────────────── */}
      <section className="px-4 mb-10">
        <div className="max-w-7xl mx-auto flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setActiveCat('')}
            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all
              ${activeCat === ''
                ? 'bg-[#FF6B00] text-white shadow-[0_4px_12px_rgba(255,107,0,0.35)]'
                : 'bg-[#252525] border border-white/[0.07] text-[#9A9A9A] hover:border-[#FF6B00]/40 hover:text-[#FF6B00]'}`}
          >
            🌟 الكل
          </button>

          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all
                ${activeCat === c.id
                  ? 'bg-[#FF6B00] text-white shadow-[0_4px_12px_rgba(255,107,0,0.35)]'
                  : 'bg-[#252525] border border-white/[0.07] text-[#9A9A9A] hover:border-[#FF6B00]/40 hover:text-[#FF6B00]'}`}
            >
              {CAT_ICONS[c.name] || '🏷️'} {c.name}
            </button>
          ))}
        </div>
      </section>

      {/* ─── Offers Grid ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4">
        {/* section header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#FF6B00]/10 rounded-xl flex items-center justify-center text-[#FF6B00]">
              <Flame size={18} />
            </div>
            <div>
              <h2 className="text-xl font-black">أحدث العروض الحصرية</h2>
              {!loading && (
                <p className="text-xs text-[#9A9A9A] font-semibold mt-0.5">
                  {filteredOffers.length} عرض متاح
                </p>
              )}
            </div>
          </div>
          <Link
            href="/offers"
            className="text-sm font-bold text-[#FF6B00] hover:underline flex items-center gap-1"
          >
            عرض الكل ←
          </Link>
        </div>

        {/* grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="flex flex-col items-center justify-content py-24 gap-4 text-center">
            <div className="w-20 h-20 bg-[#252525] rounded-full flex items-center justify-center text-4xl">🔍</div>
            <h3 className="text-lg font-bold text-[#F0F0F0]">لا توجد عروض مطابقة</h3>
            <p className="text-sm text-[#9A9A9A] max-w-xs leading-relaxed">
              جرّب تغيير كلمة البحث أو اختر فئة مختلفة
            </p>
            <button
              onClick={() => { setSearch(''); setActiveCat(''); }}
              className="mt-2 px-6 py-2.5 bg-[#FF6B00] text-white text-sm font-bold rounded-full
                         hover:opacity-90 transition-opacity"
            >
              🔄 إعادة ضبط الفلاتر
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence mode="popLayout">
              {filteredOffers.map((offer, i) => (
                <motion.div
                  key={offer.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                >
                  <OfferCard offer={offer} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-[#FF6B00] font-black">
        جاري تحميل زاج أوفرز...
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
