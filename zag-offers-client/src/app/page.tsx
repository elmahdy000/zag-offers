"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Flame, Sparkles, Utensils, Coffee, Shirt, Dumbbell, Hospital, ShoppingCart, BookOpen, Car, Wrench, Store, ArrowUpDown, Clock, TrendingUp, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { API_URL } from '@/lib/constants';
import { resolveImageUrl } from '@/lib/utils';
import { OfferCard, SkeletonCard } from '@/components/offer-card';

// ─── Debounce Hook ────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// ─── Analytics Hook ───────────────────────────────────
function useAnalytics() {
  const trackEvent = useCallback((event: string, params?: Record<string, unknown>) => {
    // Google Analytics 4
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).gtag) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).gtag('event', event, params);
    }
    // Custom analytics logging
    console.log('[Analytics]', event, params);
  }, []);
  return { trackEvent };
}

type SortOption = 'newest' | 'expiring' | 'popular' | 'discount';

interface Category {
  id: string;
  name: string;
}

interface Store {
  id: string;
  name: string;
  logo: string;
  area: string;
  categoryId?: string;
  category?: Category;
}

interface Offer {
  id: string;
  title: string;
  discount: string;
  endDate: string;
  createdAt?: string;
  featured: boolean;
  images: string[];
  store: Store;
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

const CACHE_KEY = 'zag_offers_home_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function HomePageContent() {
  const searchParams = useSearchParams();
  const catIdParam = searchParams.get('categoryId');
  const { trackEvent } = useAnalytics();

  const [offers,     setOffers]     = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores,     setStores]     = useState<Store[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [search,     setSearch]     = useState('');
  const [activeCat,  setActiveCat]  = useState(catIdParam || '');
  const [sortBy,     setSortBy]     = useState<SortOption>('newest');

  // Debounced search for analytics (reduces tracking events)
  const debouncedSearch = useDebounce(search, 500);

  // Load from cache on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setTimeout(() => {
            setOffers(data.offers || []);
            setCategories(data.categories || []);
            setStores(data.stores || []);
            setLoading(false);
          }, 0);
          trackEvent('cache_hit', { source: 'localStorage' });
        }
      }
    } catch { /* ignore cache errors */ }
  }, [trackEvent]);

  const fetchData = useCallback(async (force = false) => {
    // Check cache first if not forcing refresh
    if (!force) {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setOffers(data.offers || []);
            setCategories(data.categories || []);
            setStores(data.stores || []);
            setLoading(false);
            return;
          }
        }
      } catch { /* ignore */ }
    }

    setLoading(true);
    setError(null);
    try {
      const [offRes, catRes, storeRes] = await Promise.all([
        fetch(`${API_URL}/offers?limit=100`),
        fetch(`${API_URL}/stores/categories`),
        fetch(`${API_URL}/stores?limit=12`),
      ]);

      let newOffers: Offer[] = [];
      let newCategories: Category[] = [];
      let newStores: Store[] = [];

      if (offRes.ok) {
        const data = await offRes.json();
        newOffers = Array.isArray(data) ? data : (data.items || []);
        setOffers(newOffers);
      }
      if (catRes.ok) {
        newCategories = await catRes.json();
        setCategories(newCategories);
      }
      if (storeRes.ok) {
        const data = await storeRes.json();
        newStores = Array.isArray(data) ? data : (data.items || []);
        setStores(newStores);
      }

      // Save to cache
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: { offers: newOffers, categories: newCategories, stores: newStores },
          timestamp: Date.now()
        }));
        trackEvent('cache_save', { offersCount: newOffers.length });
      } catch { /* ignore quota errors */ }

    } catch (e) {
      console.error(e);
      setError('فشل تحميل البيانات. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.');
      trackEvent('fetch_error', { error: String(e) });
    }
    finally { setLoading(false); }
  }, [trackEvent]);

  useEffect(() => { setTimeout(() => fetchData(), 0); }, [fetchData]);
  useEffect(() => { 
    if (catIdParam) {
      setTimeout(() => setActiveCat(catIdParam), 0);
    }
  }, [catIdParam]);

  // Track search analytics (debounced) — compute count inline to avoid stale closure
  useEffect(() => {
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      const count = offers.filter(o =>
        o.title.toLowerCase().includes(q) || o.store.name.toLowerCase().includes(q)
      ).length;
      trackEvent('search', { query: debouncedSearch, resultsCount: count });
    }
  }, [debouncedSearch, offers, trackEvent]);

  // Track category filter
  useEffect(() => {
    if (activeCat) {
      trackEvent('filter_category', { categoryId: activeCat });
    }
  }, [activeCat, trackEvent]);

  const filteredOffers = useMemo(() => {
    let result = offers.filter(o => {
      const q = search.toLowerCase();
      const matchSearch = !q
        || o.title.toLowerCase().includes(q)
        || o.store.name.toLowerCase().includes(q);
      const matchCat = activeCat
        ? (o.store.category?.id === activeCat || o.store.categoryId === activeCat)
        : true;
      return matchSearch && matchCat;
    });

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        // Sort by creation date DESC (most recently added first)
        result = result.sort((a, b) => new Date(b.createdAt ?? b.endDate).getTime() - new Date(a.createdAt ?? a.endDate).getTime());
        break;
      case 'expiring':
        result = result.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
        break;
      case 'discount':
        result = result.sort((a, b) => {
          const getDiscountValue = (discount: string) => {
            const num = parseInt(discount.replace(/[^0-9]/g, ''));
            return isNaN(num) ? 0 : num;
          };
          return getDiscountValue(b.discount) - getDiscountValue(a.discount);
        });
        break;
      case 'popular':
        result = result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    return result;
  }, [offers, search, activeCat, sortBy]);

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
                       bg-[#1E1E1E] border border-white/[0.07] rounded-2xl
                       p-2 shadow-[0_8px_32px_rgba(0,0,0,0.45)]
                       focus-within:border-[#FF6B00] focus-within:shadow-[0_0_0_3px_rgba(255,107,0,0.15)]
                       transition-all duration-200"
          >
            <Search className="text-[#FF6B00] mx-2 flex-shrink-0" size={18} />
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
              بحث
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
      <section className="px-4 mb-12 sticky top-16 z-30 bg-[#1a1a1a]/80 backdrop-blur-md py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setActiveCat('')}
            className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-sm font-black whitespace-nowrap transition-all border
              ${activeCat === ''
                ? 'bg-[#FF6B00] text-white border-transparent shadow-[0_8px_20px_rgba(255,107,0,0.3)]'
                : 'bg-[#252525] border-white/[0.05] text-[#9A9A9A] hover:border-[#FF6B00]/40 hover:text-[#FF6B00]'}`}
          >
            🌟 الكل
          </button>

          {categories.map(c => {
            const Icon = CAT_ICONS[c.name] || CAT_ICONS.default;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-black whitespace-nowrap transition-all flex items-center gap-2 border
                  ${activeCat === c.id
                    ? 'bg-[#FF6B00] text-white border-transparent shadow-[0_8px_20px_rgba(255,107,0,0.3)]'
                    : 'bg-[#252525] border-white/[0.05] text-[#9A9A9A] hover:border-[#FF6B00]/40 hover:text-[#FF6B00]'}`}
              >
                {Icon} {c.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── Featured Stores ────────────────────────────────── */}
      {!activeCat && !search && stores.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FF6B00]/10 rounded-2xl flex items-center justify-center text-[#FF6B00]">
                <Sparkles size={20} />
              </div>
              <h2 className="text-2xl font-black">أبرز الشركاء</h2>
            </div>
            <Link href="/stores" className="text-sm font-bold text-[#FF6B00] hover:underline">
              اكتشف المزيد ←
            </Link>
          </div>

          <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            {stores.map((s) => (
              <Link key={s.id} href={`/stores/${s.id}`} className="flex-shrink-0 group">
                <motion.div 
                  whileHover={{ y: -8 }}
                  className="w-32 sm:w-40 flex flex-col items-center text-center gap-3"
                >
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-[#252525] border border-white/[0.07] rounded-3xl 
                                  flex items-center justify-center overflow-hidden shadow-lg
                                  group-hover:border-[#FF6B00]/50 transition-all">
                    {s.logo ? (
                      <img 
                        src={resolveImageUrl(s.logo)} 
                        alt={s.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="text-[#9A9A9A]/30" size={32} />
                    )}
                    <div className="absolute inset-0 bg-[#FF6B00]/0 group-hover:bg-[#FF6B00]/5 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs sm:text-sm font-black text-[#F0F0F0] group-hover:text-[#FF6B00] transition-colors truncate w-full px-2">
                      {s.name}
                    </h3>
                    <p className="text-[10px] text-[#9A9A9A] font-bold">{s.area}</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── Offers Grid ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4">
        {/* section header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
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

          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => {
                  const newSort = e.target.value as SortOption;
                  setSortBy(newSort);
                  trackEvent('sort_change', { sortBy: newSort });
                }}
                className="appearance-none bg-[#252525] border border-white/[0.07] text-[#F0F0F0] text-sm font-bold rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-[#FF6B00]/50 cursor-pointer hover:bg-[#2a2a2a] transition-colors"
              >
                <option value="newest">📅 الأحدث</option>
                <option value="expiring">⏰ ينتهي قريباً</option>
                <option value="discount">🏷️ الأعلى خصماً</option>
                <option value="popular">🔥 الأشهر</option>
              </select>
              <ArrowUpDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9A9A] pointer-events-none" />
            </div>

            <Link
              href="/offers"
              className="text-sm font-bold text-[#FF6B00] hover:underline flex items-center gap-1"
            >
              عرض الكل ←
            </Link>
          </div>
        </div>

        {/* grid */}
        {error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-4xl">⚠️</div>
            <h3 className="text-lg font-bold text-[#F0F0F0]">حدث خطأ</h3>
            <p className="text-sm text-[#9A9A9A] max-w-xs leading-relaxed">{error}</p>
            <button
              onClick={() => fetchData(true)}
              className="mt-2 px-6 py-2.5 bg-[#FF6B00] text-white text-sm font-bold rounded-full hover:opacity-90 transition-opacity"
            >
              🔄 إعادة المحاولة
            </button>
          </div>
        ) : loading ? (
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
                  onClick={() => trackEvent('offer_click', {
                    offerId: offer.id,
                    offerTitle: offer.title,
                    storeId: offer.store.id,
                    storeName: offer.store.name,
                    position: i,
                    source: 'homepage'
                  })}
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
