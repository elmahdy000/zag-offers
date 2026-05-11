"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Flame, Sparkles, Store, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { API_URL } from '@/lib/constants';
import { resolveImageUrl } from '@/lib/utils';
import { OfferCard, SkeletonCard } from '@/components/offer-card';

// --- Debounce Hook ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// --- Analytics Hook ---
function useAnalytics() {
  const trackEvent = useCallback((event: string, params?: Record<string, unknown>) => {
    // Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, params);
    }
    // Mixpanel or other tools could go here
    console.log(`[Analytics] ${event}`, params);
  }, []);
  return { trackEvent };
}

interface Store {
  id: string;
  name: string;
  logo?: string;
  area: string;
  categoryId: string;
  category?: Category;
}

interface Category {
  id: string;
  name: string;
}

interface Offer {
  id: string;
  title: string;
  discount: string;
  description: string;
  expiryDate: string;
  endDate: string;
  createdAt: string;
  images: string[];
  views?: number;
  featured?: boolean;
  store: Store;
  _count?: {
    coupons?: number;
  };
}

type SortOption = 'newest' | 'expiring' | 'popular' | 'discount';

const CAT_ASSETS = {
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
  { asset: CAT_ASSETS.food, keywords: ['اكل', 'مطعم', 'كرشك', 'وجبات'] },
  { asset: CAT_ASSETS.cafe, keywords: ['كافيه', 'قهوه', 'روقان', 'مشروبات'] },
  { asset: CAT_ASSETS.sweets, keywords: ['حلو', 'حلي', 'حلويات'] },
  { asset: CAT_ASSETS.beauty, keywords: ['بنات', 'تجميل', 'مكياج', 'شياكه'] },
  { asset: CAT_ASSETS.barber, keywords: ['حلاق', 'حلاقه', 'شياكه'] },
  { asset: CAT_ASSETS.gym, keywords: ['لياقه', 'جيم', 'رياضه', 'فورمه'] },
  { asset: CAT_ASSETS.home, keywords: ['منزل', 'اثاث', 'بيت', 'ديكور'] },
  { asset: CAT_ASSETS.tech, keywords: ['تكنولوجيا', 'تكنولوجى', 'موبايلات', 'كمبيوتر'] },
  { asset: CAT_ASSETS.car, keywords: ['سيارات', 'غسيل', 'زيوت', 'الزيرو'] },
  { asset: CAT_ASSETS.medical, keywords: ['صحه', 'طب', 'عيادة', 'صحتك'] },
  { asset: CAT_ASSETS.education, keywords: ['علم', 'دراسه', 'كتب', 'نور'] },
  { asset: CAT_ASSETS.wedding, keywords: ['فرح', 'مناسبات', 'العمر', 'زفاف'] },
  { asset: CAT_ASSETS.travel, keywords: ['سفر', 'رحله', 'فسحه', 'جو'] },
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

const CACHE_KEY = 'zag_offers_home_cache_v2';
const CACHE_DURATION = 5 * 60 * 1000;

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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (catIdParam) setActiveCat(catIdParam);
  }, [catIdParam]);

  const filteredOffers = useMemo(() => {
    let result = [...offers];

    if (activeCat) {
      result = result.filter(o => o.store.categoryId === activeCat || o.store.category?.id === activeCat);
    }

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(o =>
        o.title.toLowerCase().includes(q) ||
        o.store.name.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => {
      if (sortBy === 'newest') {
        const dB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        const dA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        return dB - dA;
      }
      if (sortBy === 'expiring') {
        const dA = a.endDate ? new Date(a.endDate).getTime() : 0;
        const dB = b.endDate ? new Date(b.endDate).getTime() : 0;
        return dA - dB;
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
      {/* Hero */}
      <section className="relative pt-12 pb-16 px-4 text-center">
        <div className="absolute inset-x-0 top-0 h-[420px] -z-10 bg-gradient-to-b from-[#FF6B00]/10 via-transparent opacity-60" />
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 bg-[#FF6B00]/10 border border-[#FF6B00]/25 rounded-full text-[#FF6B00] text-xs font-black">
            <span className="live-dot" /> عروض حية في الزقازيق
          </div>
          <h1 className="text-4xl sm:text-6xl font-black mb-6 leading-[1.15] text-[#F0F0F0]">
            اكتشف أفضل <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#FF6B00] to-[#FF8C35]">العروض والخصومات</span> في زاج
          </h1>
          <p className="text-[#9A9A9A] text-base sm:text-lg font-medium max-w-xl mx-auto">
            وفّر أكثر مع كوبونات حصرية من أفضل المطاعم والمحلات في الزقازيق
          </p>

          <div className="mt-10 max-w-2xl mx-auto flex items-center bg-[#252525] p-2 rounded-2xl border border-white/[0.08] shadow-2xl">
            <Search className="text-[#FF6B00] mx-2 flex-shrink-0" size={18} />
            <input
              type="text"
              placeholder="ابحث عن عرض، محل، أو قسم..."
              className="flex-1 bg-transparent border-none outline-none text-[#F0F0F0] text-sm font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="hidden sm:block px-8 py-3 bg-[#FF6B00] text-white font-black text-sm rounded-xl">بحث</button>
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      <section className="px-4 mb-12 sticky top-16 z-30 bg-[#1a1a1a]/80 backdrop-blur-md py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveCat('')}
            className={`flex-shrink-0 px-5 py-2 rounded-xl text-sm font-black border transition-all ${activeCat === '' ? 'bg-[#FF6B00] text-white border-transparent shadow-lg' : 'bg-[#252525] border-white/[0.05] text-[#9A9A9A]'}`}
          >
            🌟 الكل
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2.5 border transition-all ${activeCat === c.id ? 'bg-[#FF6B00] text-white border-transparent shadow-lg' : 'bg-[#252525] border-white/[0.05] text-[#9A9A9A]'}`}
            >
              <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                <img src={resolveCatAsset(c.name)} alt="" className="w-full h-full object-cover" />
              </div>
              {c.name}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Stores */}
      {!activeCat && !search && stores.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FF6B00]/10 rounded-2xl flex items-center justify-center text-[#FF6B00]"><Sparkles size={20} /></div>
              <h2 className="text-2xl font-black">أبرز الشركاء</h2>
            </div>
            <Link href="/stores" className="text-sm font-bold text-[#FF6B00] hover:underline">اكتشف المزيد ←</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {stores.map(store => (
              <Link key={store.id} href={`/stores/${store.id}`} className="group relative">
                <div className="aspect-square rounded-2xl overflow-hidden bg-[#252525] border border-white/[0.05] group-hover:border-[#FF6B00]/30 transition-all shadow-lg">
                  <img src={resolveImageUrl(store.logo)} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={store.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-center text-sm font-black text-white truncate">{store.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Offers Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF6B00]/10 rounded-2xl flex items-center justify-center text-[#FF6B00]"><Flame size={22} /></div>
            <h2 className="text-2xl font-black">{activeCat ? `عروض ${categories.find(c => c.id === activeCat)?.name}` : search ? 'نتائج البحث' : 'كل العروض 🚀'}</h2>
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none bg-[#1E1E1E] border border-white/[0.07] text-[#F0F0F0] text-sm font-bold rounded-xl px-4 py-2.5 pr-10 outline-none cursor-pointer"
            >
              <option value="newest">📅 الأحدث</option>
              <option value="expiring">⏰ ينتهي قريباً</option>
              <option value="popular">🔥 الأشهر</option>
              <option value="discount">💰 أعلى خصم</option>
            </select>
            <ArrowUpDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9A9A] pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {loading ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />) : (
            <AnimatePresence mode="popLayout">
              {filteredOffers.slice(0, 48).map((offer, i) => (
                <motion.div key={offer.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <OfferCard offer={offer} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#FF6B00] font-black">جاري التحميل...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
