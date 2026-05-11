"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Flame, Sparkles, Store, ArrowUpDown, MapPin } from 'lucide-react';
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
    } catch (e) {
      console.error(e);
      setError('فشل تحميل البيانات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredOffers = useMemo(() => {
    let result = [...offers];
    const now = Date.now();
    result = result.filter(o => {
      const end = o.endDate ? new Date(o.endDate).getTime() : 0;
      return end > now;
    });

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
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'expiring') return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      if (sortBy === 'discount') {
        const getVal = (d: string) => parseInt(d?.replace(/[^0-9]/g, '') || '0');
        return getVal(b.discount) - getVal(a.discount);
      }
      return 0;
    });
  }, [offers, activeCat, debouncedSearch, sortBy]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center">
        <div>
          <h2 className="text-xl font-black text-white mb-4">{error}</h2>
          <button onClick={() => fetchData(true)} className="px-6 py-2 bg-[#FF6B00] text-white rounded-lg">إعادة المحاولة</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" dir="rtl">
      
      {/* ─── Page Title ──────────────────────────────────── */}
      <div className="mb-6 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF6B00]/10 rounded-xl flex items-center justify-center text-[#FF6B00]">
            <Flame size={22} />
          </div>
          الرئيسية
        </h1>
        <p className="text-[#9A9A9A] text-xs sm:text-sm font-bold mt-2">
          اكتشف أحدث العروض والخصومات في الزقازيق اليوم
        </p>
      </div>

      {/* ─── Filters Card ────────────────────────────────── */}
      <div className="bg-[#252525] border border-white/[0.07] rounded-2xl p-4 sm:p-6 mb-10 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9A9A9A]" size={18} />
          <input
            type="text"
            placeholder="ابحث عن عرض أو محل..."
            className="w-full bg-[#1E1E1E] border border-white/[0.05] rounded-xl pr-12 pl-4 py-3.5 text-sm font-bold text-[#F0F0F0] outline-none focus:border-[#FF6B00] transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Categories Ribbon */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
          <button
            onClick={() => setActiveCat('')}
            className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black border transition-all ${!activeCat ? 'bg-[#FF6B00] text-white border-transparent' : 'bg-[#1E1E1E] border-white/[0.05] text-[#9A9A9A]'}`}
          >
            ✨ الكل
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black border transition-all ${activeCat === c.id ? 'bg-[#FF6B00] text-white border-transparent' : 'bg-[#1E1E1E] border-white/[0.05] text-[#9A9A9A]'}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-[#9A9A9A] text-xs font-bold">
            <ArrowUpDown size={14} />
            ترتيب حسب:
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-transparent text-[#FF6B00] text-xs sm:text-sm font-black outline-none cursor-pointer"
          >
            <option value="newest">📅 الأحدث</option>
            <option value="expiring">⏰ ينتهي قريباً</option>
            <option value="discount">💰 أعلى خصم</option>
          </select>
        </div>
      </div>

      {/* ─── Recommendations ─────────────────────────────── */}
      {!activeCat && !search && recommended.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500">
              <Sparkles size={18} />
            </div>
            <h2 className="text-xl font-black">اقتراحات لك</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
            {recommended.map((offer) => (
              <div key={offer.id} className="min-w-[280px] sm:min-w-[320px]">
                <OfferCard offer={offer} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Featured Stores ─────────────────────────────── */}
      {!activeCat && !search && stores.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                <Store size={18} />
              </div>
              <h2 className="text-xl font-black">أبرز الشركاء</h2>
            </div>
            <Link href="/stores" className="text-xs font-black text-[#FF6B00]">عرض الكل ←</Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {stores.map(store => (
              <Link key={store.id} href={`/stores/${store.id}`} className="group">
                <div className="aspect-square bg-[#252525] rounded-2xl border border-white/[0.05] p-2 sm:p-4 flex flex-col items-center justify-center text-center gap-2 group-hover:border-[#FF6B00]/40 transition-all">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-black/20 rounded-xl overflow-hidden">
                    <img src={resolveImageUrl(store.logo)} className="w-full h-full object-cover" alt={store.name} />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-[#9A9A9A] truncate w-full">{store.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── Main Offers Grid ────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500">
            <Flame size={18} />
          </div>
          <h2 className="text-xl font-black">
            {activeCat ? `عروض ${categories.find(c => c.id === activeCat)?.name}` : 'كل العروض'}
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="text-center py-20 bg-[#252525]/50 rounded-3xl border border-white/[0.05]">
            <Search size={40} className="mx-auto mb-4 text-white/10" />
            <h3 className="text-lg font-black text-white">لا توجد نتائج</h3>
            <button onClick={() => { setActiveCat(''); setSearch(''); }} className="mt-4 text-[#FF6B00] font-black text-sm">مسح الفلاتر</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredOffers.slice(0, 48).map((offer) => (
                <motion.div 
                  key={offer.id} 
                  layout 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#FF6B00] font-black">جاري التحميل...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
