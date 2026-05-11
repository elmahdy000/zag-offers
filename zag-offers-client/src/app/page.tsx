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
    <div className="relative pb-24 overflow-x-hidden bg-[#1A1A1A]" dir="rtl">
      
      {/* ─── Premium Background Blobs ─────────────────────── */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF6B00]/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3 -z-10" />
      <div className="absolute top-[20%] left-0 w-[400px] h-[400px] bg-[#D95A00]/5 blur-[100px] rounded-full -translate-x-1/2 -z-10" />

      {/* ─── Hero Section ────────────────────────────────── */}
      <section className="pt-12 sm:pt-20 pb-16 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-full"
          >
            <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
            <span className="text-[11px] sm:text-xs font-black text-[#FF6B00] uppercase tracking-wider">عروض الزقازيق الحصرية</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black text-[#F0F0F0] leading-tight tracking-tight"
          >
            وفر أكتر في <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#FF6B00] via-[#FF8C35] to-[#FFA15A]">كل مشوار</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[#9A9A9A] text-sm sm:text-lg font-bold max-w-2xl mx-auto leading-relaxed"
          >
            بوابتك لأفضل كوبونات الخصم والعروض المباشرة من أقوى محلات ومطاعم مدينتك.
          </motion.p>

          {/* Search Box - Premium Style */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-[#FF6B00] to-[#FF8C35] rounded-[2rem] blur-md opacity-20 group-focus-within:opacity-40 transition-all duration-500" />
            <div className="relative flex items-center bg-[#252525]/80 backdrop-blur-2xl border border-white/10 p-2 rounded-[2rem] shadow-2xl">
              <Search className="text-[#9A9A9A] mx-4" size={20} />
              <input 
                type="text" 
                placeholder="ابحث عن عرض، محل، أو صنف..."
                className="flex-1 bg-transparent py-4 text-sm sm:text-base font-bold text-white outline-none placeholder:text-[#9A9A9A]/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="hidden sm:block px-8 py-4 bg-[#FF6B00] text-white font-black text-sm rounded-[1.5rem] hover:bg-[#FF8C35] transition-all shadow-lg">
                ابحث الآن
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Categories Ribbon ──────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 mb-16">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-4">
          <button 
            onClick={() => setActiveCat('')}
            className={`flex-shrink-0 px-6 py-3 rounded-2xl text-xs sm:text-sm font-black border transition-all duration-300
              ${!activeCat ? 'bg-[#FF6B00] border-transparent text-white shadow-xl' : 'bg-[#252525] border-white/5 text-[#9A9A9A] hover:border-white/10'}`}
          >
            الكل
          </button>
          {categories.map(c => (
            <button 
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`flex-shrink-0 px-6 py-3 rounded-2xl text-xs sm:text-sm font-black border transition-all duration-300
                ${activeCat === c.id ? 'bg-[#FF6B00] border-transparent text-white shadow-xl' : 'bg-[#252525] border-white/5 text-[#9A9A9A] hover:border-white/10'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>

      {/* ─── Smart Recommendations ───────────────────────── */}
      <AnimatePresence>
        {!activeCat && !search && recommended.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-7xl mx-auto px-4 mb-20"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FF6B00]/10 rounded-xl flex items-center justify-center text-[#FF6B00]">
                  <Sparkles size={20} />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">عروض ننصحك بها</h2>
              </div>
            </div>
            <div className="flex gap-6 overflow-x-auto no-scrollbar pb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
              {recommended.map((offer) => (
                <div key={offer.id} className="min-w-[280px] sm:min-w-[340px]">
                  <OfferCard offer={offer} />
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ─── Featured Stores Bento ───────────────────────── */}
      {!activeCat && !search && stores.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl sm:text-2xl font-black text-white">أبرز شركائنا</h2>
            <Link href="/stores" className="text-xs font-black text-[#FF6B00] bg-[#FF6B00]/10 px-4 py-2 rounded-full hover:bg-[#FF6B00] hover:text-white transition-all">تصفح المتاجر</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {stores.slice(0, 12).map(store => (
              <Link key={store.id} href={`/stores/${store.id}`} className="group">
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-[#252525] border border-white/[0.05] rounded-3xl p-4 sm:p-6 text-center space-y-3 hover:border-[#FF6B00]/40 transition-all shadow-xl"
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-[#1A1A1A] rounded-2xl border border-white/5 overflow-hidden shadow-inner flex items-center justify-center">
                    <img src={resolveImageUrl(store.logo)} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={store.name} />
                  </div>
                  <h3 className="text-[10px] sm:text-xs font-black text-[#F0F0F0] truncate">{store.name}</h3>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── Main Content Grid ───────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF6B00]/10 rounded-xl flex items-center justify-center text-[#FF6B00]">
              <Flame size={20} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {activeCat ? `عروض ${categories.find(c => c.id === activeCat)?.name}` : 'أحدث العروض'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-[#252525] border border-white/5 text-[#F0F0F0] text-xs font-black px-4 py-2 rounded-xl outline-none cursor-pointer"
            >
              <option value="newest">📅 الأحدث</option>
              <option value="expiring">⏰ ينتهي قريباً</option>
              <option value="discount">💰 الأعلى خصم</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredOffers.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-24 text-center bg-[#252525]/50 rounded-[3rem] border border-white/5"
          >
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-black text-white">للأسف مفيش عروض هنا حالياً</h3>
            <button onClick={() => { setActiveCat(''); setSearch(''); }} className="mt-4 text-[#FF6B00] font-black text-sm hover:underline">عرض كل العروض</button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            <AnimatePresence mode="popLayout">
              {filteredOffers.slice(0, 48).map((offer, i) => (
                <motion.div 
                  key={offer.id} 
                  layout 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: i < 12 ? i * 0.05 : 0 }}
                >
                  <OfferCard offer={offer} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {!loading && filteredOffers.length > 48 && (
          <div className="mt-20 text-center">
            <button className="px-12 py-5 bg-[#252525] border border-white/10 rounded-2xl font-black text-white hover:border-[#FF6B00] transition-all shadow-xl">
              عرض المزيد من العروض المميزة
            </button>
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
