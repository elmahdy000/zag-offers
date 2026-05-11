"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Flame, Sparkles, Store, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { API_URL } from '@/lib/constants';
import { resolveImageUrl } from '@/lib/utils';
import { OfferCard, SkeletonCard } from '@/components/offer-card';

// â”€â”€â”€ Debounce Hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// â”€â”€â”€ Analytics Hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

const CAT_ASSETS: Record<string, string> = {
  'food': '/categories/food.png',
  'cafe': '/categories/cafe.png',
  'sweets': '/categories/sweets.png',
  'beauty': '/categories/beauty.png',
  'barber': '/categories/barber.png',
  'gym': '/categories/gym.png',
  'home': '/categories/home.png',
  'tech': '/categories/tech.png',
  'car': '/categories/car.png',
  'medical': '/categories/medical.png',
  'education': '/categories/education.png',
  'wedding': '/categories/wedding.png',
  'travel': '/categories/travel.png',
  'default': '/categories/food.png',
};

const normalizeArabic = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[\u064B-\u0652\u0670]/g, '') // Remove Tashkeel
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const CATEGORY_KEYWORDS: Array<{ asset: string; keywords: string[] }> = [
  { asset: CAT_ASSETS.food, keywords: ['اكل', 'مطعم', 'اكل', 'وجبات'] },
  { asset: CAT_ASSETS.cafe, keywords: ['كافيه', 'قهوه', 'روقان', 'مشروبات'] },
  { asset: CAT_ASSETS.sweets, keywords: ['حلو', 'حلي', 'حلويات'] },
  { asset: CAT_ASSETS.beauty, keywords: ['بنات', 'تجميل', 'مكياج'] },
  { asset: CAT_ASSETS.barber, keywords: ['حلاق', 'حلاقه', 'شياكه'] },
  { asset: CAT_ASSETS.gym, keywords: ['لياقه', 'جيم', 'رياضه', 'فورمه'] },
  { asset: CAT_ASSETS.home, keywords: ['منزل', 'اثاث', 'بيت', 'ديكور'] },
  { asset: CAT_ASSETS.tech, keywords: ['تكنولوجيا', 'موبايلات', 'كمبيوتر'] },
  { asset: CAT_ASSETS.car, keywords: ['سيارات', 'غسيل', 'زيوت', 'صيانه'] },
  { asset: CAT_ASSETS.medical, keywords: ['صحه', 'طب', 'عيادة', 'مستشفي'] },
  { asset: CAT_ASSETS.education, keywords: ['علم', 'دراسه', 'كتب', 'نور'] },
  { asset: CAT_ASSETS.wedding, keywords: ['فرح', 'مناسبات', 'حب', 'زفاف'] },
  { asset: CAT_ASSETS.travel, keywords: ['سفر', 'رحله', 'فسحه', 'سياحه'] },
];

const resolveCatAsset = (name: string) => {
  const normalized = normalizeArabic(name);
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keywords.some((keyword) => normalized.includes(normalizeArabic(keyword)))) {
      return entry.asset;
    }
  }
  return CAT_ASSETS.default;
};

const CACHE_KEY = 'zag_offers_home_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function HomePageContent() {
  const searchParams = useSearchParams();
  const catIdParam = searchParams.get('category');

  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [recommended, setRecommended] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<string>(catIdParam || '');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const debouncedSearch = useDebounce(search, 400);

  const { trackEvent } = useAnalytics();

  const fetchData = useCallback(async (force = false) => {
    try {
      if (!force) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setOffers(data.offers);
            setCategories(data.categories);
            setStores(data.stores);
            setRecommended(data.recommended);
            setLoading(false);
            return;
          }
        }
      }

      setLoading(true);
      const [oRes, cRes, sRes, rRes] = await Promise.all([
        fetch(`${API_URL}/offers?limit=100`),
        fetch(`${API_URL}/stores/categories`),
        fetch(`${API_URL}/stores?limit=12`),
        fetch(`${API_URL}/recommendations`)
      ]);

      const [oData, cData, sData, rData] = await Promise.all([
        oRes.json(), cRes.json(), sRes.json(), rRes.json()
      ]);

      setOffers(oData);
      setCategories(cData);
      setStores(sData);
      setRecommended(rData);

      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: { offers: oData, categories: cData, stores: sData, recommended: rData },
        timestamp: Date.now()
      }));

    } catch (e) {
      console.error(e);
      setError('فشل تحميل البيانات. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.');
      trackEvent('fetch_error', { error: String(e) });
    }
    finally { setLoading(false); }
  }, [trackEvent]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Handle URL category sync
  useEffect(() => {
    if (catIdParam) setActiveCat(catIdParam);
  }, [catIdParam]);

  // Track search analytics (debounced) — compute count inline to avoid stale closure
  useEffect(() => {
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      const count = offers.filter(o =>
        o.title.toLowerCase().includes(q) ||
        o.store.name.toLowerCase().includes(q)
      ).length;

      trackEvent('search', { query: debouncedSearch, resultsCount: count });
    }
  }, [debouncedSearch, trackEvent, offers]);

  const filteredOffers = useMemo(() => {
    let result = [...offers];

    // Filter by Category
    if (activeCat) {
      result = result.filter(o => o.store.categoryId === activeCat || o.store.category?.id === activeCat);
    }

    // Filter by Search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(o =>
        o.title.toLowerCase().includes(q) ||
        o.store.name.toLowerCase().includes(q) ||
        o.store.category?.name.toLowerCase().includes(q)
      );
    }

    // Sort
    return result.sort((a, b) => {
      if (sortBy === 'newest') {
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        return dateB - dateA;
      }
      if (sortBy === 'expiring') {
        const dateA = a.endDate ? new Date(a.endDate).getTime() : 0;
        const dateB = b.endDate ? new Date(b.endDate).getTime() : 0;
        return dateA - dateB;
      }
      if (sortBy === 'discount') {
        const getVal = (d: string) => parseInt(d?.replace(/[^0-9]/g, '') || '0');
        return getVal(b.discount) - getVal(a.discount);
      }
      if (sortBy === 'popular') return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      return 0;
    });
  }, [offers, activeCat, debouncedSearch, sortBy]);

  return (
    <div className="pb-20" dir="rtl">

      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative pt-12 pb-16 px-4 overflow-hidden text-center">
        {/* glow bg */}
        <div className="absolute inset-x-0 top-0 h-[420px] -z-10
                        bg-gradient-to-b from-[#FF6B00]/10 via-transparent to-transparent opacity-60" />

        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6
                          bg-[#FF6B00]/10 border border-[#FF6B00]/25
                          rounded-full text-[#FF6B00] text-xs font-black tracking-widest">
            <span className="live-dot" />
            عروض حية في الزقازيق
          </div>

          {/* heading */}
          <h1 className="text-4xl sm:text-6xl font-black mb-6 leading-[1.15] text-[#F0F0F0]">
            اكتشف أفضل{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#FF6B00] to-[#FF8C35]">
              العروض والخصومات
            </span>
            <br className="hidden sm:block" /> في زاج
          </h1>

          <p className="text-[#9A9A9A] text-base sm:text-lg font-medium max-w-xl mx-auto leading-relaxed">
            وفّر أكثر مع كوبونات حصرية من أفضل المطاعم، الكافيهات، المحلات والخدمات في الزقازيق
          </p>

          {/* search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 max-w-2xl mx-auto flex items-center bg-[#252525]
                       p-2 rounded-2xl border border-white/[0.08] shadow-2xl focus-within:border-[#FF6B00]/40 transition-all"
          >
            <Search className="text-[#FF6B00] mx-2 flex-shrink-0" size={18} />
            <input
              type="text"
              placeholder="ابحث عن عرض، محل، أو قسم..."
              className="flex-1 bg-transparent border-none outline-none text-[#F0F0F0]
                         text-sm font-bold placeholder:text-[#9A9A9A] min-w-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="hidden sm:block px-8 py-3 bg-[#FF6B00] text-white font-black text-sm rounded-xl
                         shadow-[0_4px_15px_rgba(255,107,0,0.3)]
                         hover:shadow-[0_6px_20px_rgba(255,107,0,0.45)]
                         hover:scale-[1.02] active:scale-95 transition-all"
            >
              بحث
            </button>
          </motion.div>

          {/* stats */}
          <div className="flex justify-center gap-8 pt-2 flex-wrap">
            {[
              { value: offers.length || '…', label: 'عرض نشط' },
              { value: [...new Set(offers.map(o => o.store?.id))].length || '…', label: 'متجر معتمد' },
              { value: categories.length || '…', label: 'فئة متنوعة' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-black text-[#FF6B00]">{s.value}</div>
                <div className="text-[10px] text-[#9A9A9A] font-black uppercase tracking-tighter mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Categories Bar ────────────────────────────────── */}
      <section className="px-4 mb-12 sticky top-16 z-30 bg-[#1a1a1a]/80 backdrop-blur-md py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setActiveCat('')}
            className={`flex-shrink-0 px-5 py-2 rounded-xl text-sm font-black whitespace-nowrap transition-all flex items-center gap-2 border
              ${activeCat === ''
                ? 'bg-[#FF6B00] text-white border-transparent shadow-[0_8px_20px_rgba(255,107,0,0.3)]'
                : 'bg-[#252525] border-white/[0.05] text-[#9A9A9A] hover:border-[#FF6B00]/40 hover:text-[#FF6B00]'}`}
          >
            🌟 الكل
          </button>

          {categories.map(c => {
            const imgPath = resolveCatAsset(c.name);
            return (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-black whitespace-nowrap transition-all flex items-center gap-2.5 border
                  ${activeCat === c.id
                    ? 'bg-[#FF6B00] text-white border-transparent shadow-[0_8px_20px_rgba(255,107,0,0.3)]'
                    : 'bg-[#252525] border-white/[0.05] text-[#9A9A9A] hover:border-[#FF6B00]/40 hover:text-[#FF6B00]'}`}
              >
                <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                  <img src={imgPath} alt="" className="w-full h-full object-cover" />
                </div>
                {c.name}
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

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {stores.map(store => (
              <Link key={store.id} href={`/stores/${store.id}`} className="group relative">
                <div className="aspect-square rounded-2xl overflow-hidden bg-[#252525] border border-white/[0.05]
                                group-hover:border-[#FF6B00]/30 transition-all shadow-lg group-hover:shadow-[#FF6B00]/5">
                  <img
                    src={resolveImageUrl(store.logo)}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    alt={store.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-center">
                    <div className="text-sm font-black text-white truncate">{store.name}</div>
                    <div className="text-[9px] text-[#FF6B00] font-black uppercase tracking-widest mt-0.5">
                      {store.category?.name || 'متجر'}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── Recommended Section ────────────────────────────── */}
      {!activeCat && !search && recommended.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B00] to-[#FF8C35] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#FF6B00]/20">
              <Sparkles size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-black">مختارات لك</h2>
              <p className="text-xs text-[#9A9A9A] font-bold mt-0.5">بناءً على اهتماماتك ومنطقتك</p>
            </div>
          </div>

          <div className="flex gap-5 overflow-x-auto no-scrollbar pb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
            {recommended.map((offer, i) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="w-[280px] sm:w-[320px] flex-shrink-0"
              >
                <OfferCard offer={offer} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Offers by Category (Mutaqa'a Sections) ───────── */}
      {!activeCat && !search && categories.map(cat => {
        const catOffers = offers.filter(o => o.store.categoryId === cat.id || o.store.category?.id === cat.id).slice(0, 8);
        if (catOffers.length === 0) return null;

        const imgPath = resolveCatAsset(cat.name);

        return (
          <section key={cat.id} className="max-w-7xl mx-auto px-4 mb-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                  <img src={imgPath} alt={cat.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">{cat.name}</h2>
                  <p className="text-xs text-[#9A9A9A] font-bold mt-0.5">أقوى عروض الـ {cat.name.split(' ')[0]}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveCat(cat.id)}
                className="text-sm font-bold text-[#FF6B00] hover:underline"
              >
                عرض الكل ←
              </button>
            </div>

            <div className="flex gap-5 overflow-x-auto no-scrollbar pb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
              {catOffers.map((offer) => (
                <div key={offer.id} className="w-[280px] sm:w-[320px] flex-shrink-0">
                  <OfferCard offer={offer} />
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* ─── Global Offers Grid (Search/Filter OR Fallback) ────── */}
      <section className="max-w-7xl mx-auto px-4 mt-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF6B00]/10 rounded-2xl flex items-center justify-center text-[#FF6B00]">
              <Flame size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-black">
                {activeCat ? `عروض ${categories.find(c => c.id === activeCat)?.name}` : search ? 'نتائج البحث' : 'كل العروض اللي في الزقازيق 🚀'}
              </h2>
              <p className="text-xs text-[#9A9A9A] font-bold mt-0.5">أفضل الصفقات واللقطات</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none bg-[#1E1E1E] border border-white/[0.07] text-[#F0F0F0] text-sm font-bold rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-[#FF6B00]/50 cursor-pointer"
              >
                <option value="newest">📅 الأحدث</option>
                <option value="expiring">⏰ ينتهي قريباً</option>
                <option value="popular">🔥 الأشهر</option>
                <option value="discount">💰 أعلى خصم</option>
              </select>
              <ArrowUpDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9A9A] pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {loading && Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={`home-skeleton-${i}`} />
          ))}
          <AnimatePresence mode="popLayout">
            {(activeCat || search ? filteredOffers : offers).slice(0, 48).map((offer, i) => (
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

        {!loading && (activeCat || search) && filteredOffers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-20 h-20 bg-[#252525] rounded-full flex items-center justify-center text-4xl">ðŸ”</div>
            <h3 className="text-lg font-bold text-[#F0F0F0]">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¹Ø±ÙˆØ¶ Ù…Ø·Ø§Ø¨Ù‚Ø©</h3>
            <p className="text-sm text-[#9A9A9A] max-w-xs leading-relaxed">Ø¬Ø±Ù‘Ø¨ ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ø¨Ø­Ø«</p>
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
        Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø²Ø§Ø¬ Ø£ÙˆÙØ±Ø²...
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}

