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

    // Filter out expired offers by default
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

  // Analytics for search
  useEffect(() => {
    if (debouncedSearch) {
      trackEvent('search', { query: debouncedSearch });
    }
  }, [debouncedSearch, trackEvent]);

  // Analytics for category
  const handleCatChange = (id: string, name: string) => {
    setActiveCat(id);
    trackEvent('category_filter', { category_id: id, category_name: name });
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A] p-4 text-center">
        <div className="max-w-md">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-black text-white mb-4">{error}</h2>
          <button 
            onClick={() => fetchData(true)}
            className="px-8 py-3 bg-[#FF6B00] text-white rounded-xl font-bold hover:bg-[#FF8C35] transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 bg-[#1A1A1A] overflow-hidden" dir="rtl">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FF6B00]/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-[#FF8C35]/5 blur-[100px] rounded-full -z-10" />

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 px-4 text-center overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 -z-10 opacity-[0.03]" 
             style={{ backgroundImage: 'radial-gradient(#FF6B00 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="max-w-5xl mx-auto relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-5 py-2 mb-8 bg-gradient-to-r from-[#FF6B00]/10 to-transparent border border-[#FF6B00]/20 rounded-full text-[#FF6B00] text-[13px] font-black shadow-[0_0_20px_rgba(255,107,0,0.05)]"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C853] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00C853]"></span>
            </span>
            عروض حية وحصرية الآن في الزقازيق
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black mb-6 leading-[1.1] text-[#F0F0F0] tracking-tight"
          >
            وفر أكتر مع <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#FF6B00] via-[#FF8C35] to-[#FFA15A] drop-shadow-sm">أقوى خصومات</span> زاج
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[#9A9A9A] text-lg sm:text-2xl font-medium max-w-3xl mx-auto leading-relaxed"
          >
            من مطاعمك المفضلة لمحلات الموضة والجمال، كل اللي تحتاجه في الزقازيق بخصومات حصرية وكوبونات فورية.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-14 max-w-3xl mx-auto group relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-[#FF6B00] to-[#FF8C35] rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-[#242424]/80 backdrop-blur-md p-2.5 rounded-[2rem] border border-white/[0.08] shadow-2xl focus-within:border-[#FF6B00]/40 transition-all duration-300">
              <Search className="text-[#FF6B00] mx-4 flex-shrink-0" size={24} />
              <input
                type="text"
                placeholder="ابحث عن مطعم، كافيه، أو عرض معين..."
                className="flex-1 bg-transparent border-none outline-none text-[#F0F0F0] text-lg font-bold py-4 placeholder:text-[#9A9A9A]/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="hidden sm:block px-12 py-4 bg-gradient-to-r from-[#FF6B00] to-[#FF8C35] text-white font-black text-base rounded-[1.5rem] hover:shadow-[0_8px_25px_rgba(255,107,0,0.4)] hover:scale-[1.02] active:scale-95 transition-all duration-300">
                ابحث الآن
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories Bar */}
      <section className="px-4 mb-12 sticky top-[64px] sm:top-[80px] z-40 bg-[#1A1A1A]/90 backdrop-blur-2xl py-4 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            onClick={() => handleCatChange('', 'All')}
            className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black border transition-all duration-300 ${activeCat === '' ? 'bg-[#FF6B00] text-white border-transparent shadow-[0_8px_20px_rgba(255,107,0,0.3)] scale-105' : 'bg-[#252525] border-white/[0.08] text-[#9A9A9A] hover:bg-[#2a2a2a] hover:border-white/20'}`}
          >
            ✨ الكل
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => handleCatChange(c.id, c.name)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2.5 border transition-all duration-300 ${activeCat === c.id ? 'bg-[#FF6B00] text-white border-transparent shadow-[0_8px_20px_rgba(255,107,0,0.3)] scale-105' : 'bg-[#252525] border-white/[0.08] text-[#9A9A9A] hover:bg-[#2a2a2a] hover:border-white/20'}`}
            >
              <div className="w-6 h-6 rounded-lg overflow-hidden flex-shrink-0 bg-white/10 flex items-center justify-center text-[10px]">
                <span>🏷️</span>
              </div>
              {c.name}
            </button>
          ))}
        </div>
      </section>

      {/* Recommendations Section */}
      {!activeCat && !search && recommended.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-20 overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B00] to-[#FF8C35] rounded-2xl flex items-center justify-center text-white shadow-[0_8px_20px_rgba(255,107,0,0.2)]">
                <Sparkles size={24} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-[#F0F0F0]">اقتراحات ذكية</h2>
                <p className="text-[#9A9A9A] text-sm font-bold mt-1">عروض اخترناها لك بعناية اليوم</p>
              </div>
            </div>
          </div>
          <div className="flex gap-6 overflow-x-auto no-scrollbar pb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
            {recommended.map((offer) => (
              <div key={offer.id} className="min-w-[300px] sm:min-w-[340px] flex-shrink-0">
                <OfferCard offer={offer} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Stores */}
      {!activeCat && !search && stores.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-20">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/[0.03] border border-white/[0.08] rounded-2xl flex items-center justify-center text-[#FF6B00]">
                <Store size={24} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-[#F0F0F0]">أبرز الشركاء</h2>
                <p className="text-[#9A9A9A] text-sm font-bold mt-1">أفضل الماركات اللي بتثق فيها</p>
              </div>
            </div>
            <Link href="/stores" className="group flex items-center gap-2 text-[#FF6B00] font-black text-sm bg-[#FF6B00]/5 px-5 py-2.5 rounded-xl border border-[#FF6B00]/10 hover:bg-[#FF6B00] hover:text-white transition-all duration-300">
              <span>عرض الكل</span>
              <span className="group-hover:translate-x-[-4px] transition-transform">←</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {stores.map(store => (
              <Link key={store.id} href={`/stores/${store.id}`} className="group relative">
                <div className="aspect-square rounded-[2rem] overflow-hidden bg-[#242424] border border-white/[0.05] group-hover:border-[#FF6B00]/30 transition-all duration-500 shadow-xl group-hover:shadow-[#FF6B00]/5">
                  <img src={resolveImageUrl(store.logo)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" alt={store.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-90 transition-opacity" />
                  <div className="absolute bottom-5 left-4 right-4 text-center">
                    <div className="text-sm font-black text-white truncate mb-1">{store.name}</div>
                    <div className="text-[10px] font-bold text-[#9A9A9A] uppercase tracking-widest flex items-center justify-center gap-1">
                      <MapPin size={10} className="text-[#FF6B00]" />
                      {store.area}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Offers Section */}
      <section className="max-w-7xl mx-auto px-4 relative">
        <div className="flex items-center justify-between mb-10 flex-wrap gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B00]/20 to-transparent rounded-2xl flex items-center justify-center text-[#FF6B00] shadow-[0_0_20px_rgba(255,107,0,0.1)]">
              <Flame size={26} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-[#F0F0F0]">
                {activeCat ? `عروض ${categories.find(c => c.id === activeCat)?.name}` : search ? 'نتائج البحث' : 'كل العروض المتاحة'}
              </h2>
              <p className="text-[#9A9A9A] text-sm font-bold mt-1">اكتشف أحدث ما وصل زاج اليوم</p>
            </div>
          </div>
          <div className="relative group min-w-[180px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full appearance-none bg-[#242424] border border-white/[0.08] text-[#F0F0F0] text-sm font-bold rounded-2xl px-6 py-4 pr-12 outline-none cursor-pointer group-hover:border-[#FF6B00]/40 transition-all shadow-xl"
            >
              <option value="newest">📅 الأحدث أولاً</option>
              <option value="expiring">⏰ ينتهي قريباً</option>
              <option value="popular">🔥 الأكثر شهرة</option>
              <option value="discount">💰 أعلى نسبة خصم</option>
            </select>
            <ArrowUpDown size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#9A9A9A] pointer-events-none group-hover:text-[#FF6B00] transition-colors" />
          </div>
        </div>

        {filteredOffers.length === 0 && !loading ? (
          <div className="py-28 text-center bg-[#242424]/50 rounded-[3rem] border border-white/[0.05] shadow-inner relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#FF6B00]/5 to-transparent opacity-30" />
            <div className="relative z-10">
              <div className="w-24 h-24 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-8 border border-white/[0.05]">
                <Search size={36} className="text-[#9A9A9A]/50" />
              </div>
              <h3 className="text-2xl font-black mb-3 text-white">للأسف، مفيش نتائج</h3>
              <p className="text-[#9A9A9A] font-bold mb-10 text-lg max-w-md mx-auto">جرب تغير كلمات البحث أو تختار قسم تاني عشان تلاقي عروض تهمك.</p>
              <button 
                onClick={() => { setActiveCat(''); setSearch(''); }}
                className="px-10 py-4 bg-gradient-to-r from-[#FF6B00] to-[#FF8C35] text-white rounded-2xl font-black hover:shadow-[0_10px_30px_rgba(255,107,0,0.3)] transition-all active:scale-95"
              >
                رجوع لكل العروض
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {loading ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />) : (
              <AnimatePresence mode="popLayout">
                {filteredOffers.slice(0, 48).map((offer, i) => (
                  <motion.div 
                    key={offer.id} 
                    layout 
                    initial={{ opacity: 0, y: 30 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, delay: i * 0.05 < 0.6 ? i * 0.05 : 0 }}
                  >
                    <OfferCard offer={offer} />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        )}
        
        {!loading && filteredOffers.length > 48 && (
          <div className="mt-20 text-center">
            <button className="px-16 py-5 bg-[#242424] border border-white/[0.08] rounded-[2rem] font-black text-[#F0F0F0] hover:border-[#FF6B00]/40 hover:text-[#FF6B00] transition-all duration-300 shadow-2xl group flex items-center gap-3 mx-auto">
              <span>عرض باقي العروض المميزة</span>
              <span className="text-xl group-hover:translate-y-1 transition-transform">↓</span>
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
