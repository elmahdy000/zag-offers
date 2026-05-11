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

const CAT_ASSETS: Record<string, string> = {
  'دلع كرشك':         '/categories/food.png',
  'دلع كرشك 🍔':      '/categories/food.png',
  'روقان':           '/categories/cafe.png',
  'روقان ☕':         '/categories/cafe.png',
  'حلي بؤك':         '/categories/sweets.png',
  'دلع بنات':         '/categories/beauty.png',
  'دلع بنات 💄':      '/categories/beauty.png',
  'شياكة':           '/categories/barber.png',
  'شياكة 👔':         '/categories/barber.png',
  'فورمة':           '/categories/gym.png',
  'فورمة 🦾':          '/categories/gym.png',
  'بيتك ومطرحك':     '/categories/home.png',
  'بيتك ومطرحك 🏠':   '/categories/home.png',
  'تكنولوجى':         '/categories/tech.png',
  'على الزيرو':      '/categories/car.png',
  'على الزيرو 🏎️':   '/categories/car.png',
  'صحتك بالدنيا':    '/categories/medical.png',
  'صحتك بالدنيا 🏥':  '/categories/medical.png',
  'على نور':         '/categories/education.png',
  'ثقف نفسك 💡':     '/categories/education.png',
  'ليلة العمر':       '/categories/wedding.png',
  'عروستى 👰':       '/categories/wedding.png',
  'غيّر جو':         '/categories/travel.png',
  'default':         '/categories/food.png',
};

const CACHE_KEY = 'zag_offers_home_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function HomePageContent() {
  const searchParams = useSearchParams();
  const catIdParam = searchParams.get('categoryId');
  const { trackEvent } = useAnalytics();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [recommended, setRecommended] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState(catIdParam || '');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

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
            setRecommended(data.recommended || []);
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
            setRecommended(data.recommended || []);
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
      // Get token for personalized recommendations
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [offRes, catRes, storeRes, recRes] = await Promise.all([
        fetch(`${API_URL}/offers?limit=100`),
        fetch(`${API_URL}/stores/categories`),
        fetch(`${API_URL}/stores?limit=12`),
        fetch(`${API_URL}/recommendations`, { headers }),
      ]);

      let newOffers: Offer[] = [];
      let newRecommended: Offer[] = [];
      let newCategories: Category[] = [];
      let newStores: Store[] = [];

      if (offRes.ok) {
        const data = await offRes.json();
        newOffers = Array.isArray(data) ? data : (data.items || []);
        setOffers(newOffers);
      }
      if (recRes.ok) {
        newRecommended = await recRes.json();
        setRecommended(newRecommended);
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
          data: {
            offers: newOffers,
            recommended: newRecommended,
            categories: newCategories,
            stores: newStores
          },
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
            <br className="hidden sm:block" /> في زاج
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
              { value: offers.length || '…', label: 'عرض نشط' },
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
            const imgPath = CAT_ASSETS[c.name] || CAT_ASSETS.default;
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

      {/* ─── Recommended Section ────────────────────────────── */}
      {!activeCat && !search && recommended.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#FF6B00]/10 rounded-2xl flex items-center justify-center text-[#FF6B00]">
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

      {/* ─── Offers by Category (Mutaqa'a Sections) ─────────── */}
      {!activeCat && !search && categories.map(cat => {
        const catOffers = offers.filter(o => o.store.categoryId === cat.id || o.store.category?.id === cat.id).slice(0, 8);
        if (catOffers.length === 0) return null;

        const imgPath = CAT_ASSETS[cat.name] || CAT_ASSETS.default;

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
      )}
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
