"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiSearch2Line, RiFireFill, RiSparkling2Fill, RiMapPin2Fill,
  RiCloseLine, RiArrowLeftSLine, RiArrowRightSLine, RiArrowDownSLine,
  RiCoupon3Line, RiCompass3Line, RiArrowLeftLine, RiStore3Line,
  RiCheckboxCircleFill, RiStarFill, RiRestaurant2Line, RiShieldCheckFill,
  RiPercentLine, RiTimeLine
} from 'react-icons/ri';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { resolveImageUrl, calculateDaysLeft } from '@/lib/utils';
import { OfferCard, SkeletonCard } from '@/components/offer-card';
import { Offer, Category, Store, Banner, SortOption } from '@/lib/types';
import { API_URL, DISPLAY_NAMES, ZAGAZIG_AREAS } from '@/lib/constants';
import { normalizeCategories } from '@/lib/category-utils';
import { useNotifications } from '@/components/notification-provider';
import { extractItems, filterOffers, sortOffers } from '@/lib/catalog-utils';
import { CategoryIcon } from '@/components/category-icon';
import { AreaPickerModal } from '@/components/area-picker-modal';
import { resolveOfferPricing, formatPrice } from '@/lib/offer-pricing';

// --- Debounce Hook ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const getCatName = (name: string) => DISPLAY_NAMES[name] || name;
const getBannerTitle = (title: string) => title;
const getBannerTag = (tag?: string) => tag?.trim() === 'مصايف' ? 'عروض المصيف' : tag;
const getBannerAction = (url?: string) => url?.startsWith('/stores/') ? 'استكشف المتجر' : url?.startsWith('/offers/') ? 'احصل على العرض' : url ? 'اعرف التفاصيل' : 'اكتشف العروض';

const CACHE_KEY = 'zag_offers_home_cache_v5';
const CACHE_DURATION = 5 * 60 * 1000;

const POPULAR_SEARCH_TAGS = [
  { label: 'برجر 🍔', query: 'برجر' },
  { label: 'كافيهات المشاية ☕', query: 'كافيه' },
  { label: 'بيتزا 🍕', query: 'بيتزا' },
  { label: 'ملابس القومية 👗', query: 'ملابس' },
  { label: 'حلويات 🍰', query: 'حلويات' },
  { label: 'شاورما 🌯', query: 'شاورما' },
];

function HomePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const catIdParam = searchParams.get('category');

  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [recommended, setRecommended] = useState<Offer[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeBanner, setActiveBanner] = useState(0);
  const [bannerPaused, setBannerPaused] = useState(false);
  const [bannerTimerKey, setBannerTimerKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<string>(catIdParam || '');
  const [activeArea, setActiveArea] = useState('');
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [currentTime, setCurrentTime] = useState(0);
  const debouncedSearch = useDebounce(search, 400);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const offersGridRef = useRef<HTMLDivElement>(null);
  const isFirstMount = useRef(true);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (search.trim()) {
      router.push(`/offers?q=${encodeURIComponent(search.trim())}${activeArea ? `&area=${encodeURIComponent(activeArea)}` : ''}`);
    }
  };

  const showNextBanner = () => {
    setActiveBanner((current) => banners.length ? (current + 1) % banners.length : 0);
    setBannerTimerKey((key) => key + 1);
  };

  const showPreviousBanner = () => {
    setActiveBanner((current) => banners.length ? (current - 1 + banners.length) % banners.length : 0);
    setBannerTimerKey((key) => key + 1);
  };

  useEffect(() => {
    if (banners.length < 2 || bannerPaused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      setActiveBanner((current) => (current + 1) % banners.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [banners.length, bannerPaused, bannerTimerKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => setCurrentTime(Date.now()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Reliable scroll helper — waits for DOM paint then scrolls
  const scrollToGrid = (delay = 0) => {
    const run = () => {
      const el = offersGridRef.current;
      if (!el) return;
      requestAnimationFrame(() => {
        const top = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      });
    };
    if (delay > 0) setTimeout(run, delay);
    else run();
  };

  // Scroll when category / area changes (immediate)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    scrollToGrid();
  }, [activeCat, activeArea]);

  // Scroll after search debounce settles — only if user stopped typing
  useEffect(() => {
    if (!debouncedSearch) return;
    const timer = setTimeout(() => {
      if (document.activeElement !== searchInputRef.current) {
        scrollToGrid();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [debouncedSearch]);

  const scrollActiveIntoView = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    const target = e.currentTarget;
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [, setIsOffline] = useState(false);
  const { socket, isConnected } = useNotifications();

  const fetchData = useCallback(async (force = false) => {
    // Try to load from cache first
    const cachedData = localStorage.getItem(CACHE_KEY);
    let hasFreshCache = false;
    let cacheAge = Number.POSITIVE_INFINITY;

    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        cacheAge = Date.now() - (parsed.timestamp || 0);
        if (cacheAge > CACHE_DURATION) {
          localStorage.removeItem(CACHE_KEY);
        } else {
          hasFreshCache = true;
          setOffers(parsed.offers || []);
          setCategories(parsed.categories || []);
          setStores(parsed.stores || []);
          setRecommended(parsed.recommended || []);
          setBanners(parsed.banners || []);
          setLoading(false);
        }
      } catch (e) {
        console.error('Error parsing cache:', e);
      }
    }

    if (hasFreshCache && cacheAge < 60_000 && !force) return;

    const shouldShowLoading = !hasFreshCache || force;

    try {
      if (shouldShowLoading) {
        setLoading(true);
      }
      const primaryResponses = await Promise.all([
        fetch(`${API_URL}/offers?limit=32`, { cache: 'no-store' }),
        fetch(`${API_URL}/offers/categories`, { cache: 'no-store' }),
        fetch(`${API_URL}/offers/banners`, { cache: 'no-store' }),
      ]);
      for (const res of primaryResponses) {
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${res.url}`);
      }

      const [oData, cData, bData] = await Promise.all([
        primaryResponses[0].json(),
        primaryResponses[1].json(),
        primaryResponses[2].json(),
      ]);

      const normalizedCats = normalizeCategories(cData);
      const offerItems = extractItems<Offer>(oData);
      setOffers(offerItems);
      setCategories(normalizedCats);
      setBanners(Array.isArray(bData) ? bData : []);
      setLoading(false);

      const secondaryResponses = await Promise.all([
        fetch(`${API_URL}/stores?limit=12`, { cache: 'no-store' }),
        fetch(`${API_URL}/recommendations`, { cache: 'no-store' }),
      ]);
      for (const res of secondaryResponses) {
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${res.url}`);
      }
      const [sData, rData] = await Promise.all([
        secondaryResponses[0].json(),
        secondaryResponses[1].json(),
      ]);
      const storeItems = extractItems<Store>(sData);
      const recommendationItems = extractItems<Offer>(rData);
      setStores(storeItems);
      setRecommended(recommendationItems);

      localStorage.setItem(CACHE_KEY, JSON.stringify({
        offers: offerItems,
        categories: normalizedCats,
        stores: storeItems,
        recommended: recommendationItems,
        banners: Array.isArray(bData) ? bData : [],
        timestamp: Date.now()
      }));
      setIsOffline(false);
    } catch (e) {
      console.error('Fetch error:', e);
      setIsOffline(true);
      if (!localStorage.getItem(CACHE_KEY)) {
        setError('فشل تحميل البيانات. يرجى التأكد من اتصالك بالإنترنت.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    const timer = window.setTimeout(() => fetchDataRef.current(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleCategoriesUpdated = () => {
      localStorage.removeItem(CACHE_KEY);
      fetchDataRef.current(true);
    };
    socket.on('categories_updated', handleCategoriesUpdated);
    socket.on('banners_updated', handleCategoriesUpdated);
    socket.on('offers_updated', handleCategoriesUpdated);
    socket.on('new_offer', handleCategoriesUpdated);
    return () => {
      socket.off('categories_updated', handleCategoriesUpdated);
      socket.off('banners_updated', handleCategoriesUpdated);
      socket.off('offers_updated', handleCategoriesUpdated);
      socket.off('new_offer', handleCategoriesUpdated);
    };
  }, [socket]);

  useEffect(() => {
    if (isConnected || !navigator.onLine) return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchDataRef.current(false);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    const handleOnline = () => { fetchDataRef.current(true); setIsOffline(false); };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Filter & catalog logic
  const filteredOffers = useMemo(() => {
    return sortOffers(filterOffers(offers, {
      query: debouncedSearch,
      categoryId: activeCat,
      area: activeArea,
      activeOnly: true,
    }), sortBy);
  }, [offers, activeCat, activeArea, debouncedSearch, sortBy]);

  // Spotlight Deal (Highest savings or featured offer)
  const spotlightOffer = useMemo(() => {
    if (offers.length === 0) return null;
    const featured = offers.find(o => o.isFeatured);
    if (featured) return featured;
    return [...offers].sort((a, b) => {
      const pA = resolveOfferPricing(a);
      const pB = resolveOfferPricing(b);
      return (pB.savingsPercentage || 0) - (pA.savingsPercentage || 0);
    })[0] || offers[0];
  }, [offers]);

  // Trending Offers ("الأكثر انتشاراً" - sorted by popularity/coupons)
  const trendingOffers = useMemo(() => {
    return [...offers]
      .sort((a, b) => (b._count?.coupons || b.views || 0) - (a._count?.coupons || a.views || 0))
      .slice(0, 8);
  }, [offers]);

  // Food & Dining Corner ("ركن الأكل والمطاعم 🍔")
  const foodOffers = useMemo(() => {
    return offers.filter(o => {
      const name = (o.store?.category?.name || '').toLowerCase();
      const title = (o.title || '').toLowerCase();
      return (
        name.includes('أكل') || name.includes('مطاعم') || name.includes('كرشك') ||
        name.includes('كافيه') || name.includes('مشروبات') || name.includes('food') ||
        title.includes('برجر') || title.includes('بيتزا') || title.includes('وجبة') ||
        title.includes('ساندوتش') || title.includes('كريب') || title.includes('شاورما')
      );
    }).slice(0, 8);
  }, [offers]);

  // Count active offers per category for count badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const offer of offers) {
      const catId = offer.store?.category?.id;
      if (catId) counts[catId] = (counts[catId] || 0) + 1;
    }
    return counts;
  }, [offers]);

  const nearbyOffers = useMemo(() => {
    if (!activeArea) return [];
    return offers.filter((offer) => offer.store?.area === activeArea).slice(0, 4);
  }, [offers, activeArea]);

  const endingSoonOffers = useMemo(() => {
    if (!currentTime) return [];
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return offers
      .filter((offer) => {
        const end = new Date(offer.endDate).getTime();
        return Number.isFinite(end) && end > currentTime && end - currentTime <= sevenDays;
      })
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
      .slice(0, 4);
  }, [offers, currentTime]);

  const safeActiveBanner = banners.length ? activeBanner % banners.length : 0;

  return (
    <div className="homepage relative overflow-x-hidden pb-16" dir="rtl" lang="ar">
      {/* ─── Grand Hero Section ─────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#071426] pt-8 pb-14 lg:pt-14 lg:pb-20 border-b border-[#1E293B]" aria-labelledby="home-hero-title">
        {/* Ambient atmospheric backdrop */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
          <Image
            src="/hero-local-market.webp"
            alt="سوق محلي يضم متاجر ومطاعم وخدمات متنوعة"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center filter blur-[1px] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#071426]/90 via-[#071426]/95 to-[#071426]" />
        </div>

        {/* Ambient Radial Mesh Gradients */}
        <div className="absolute -top-32 right-1/4 w-[500px] h-[500px] bg-[#FF6500]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-8 w-[450px] h-[450px] bg-[#0284C7]/12 rounded-full blur-[130px] pointer-events-none" />

        <div className="home-container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* ── Right Column: The Core Value & Command Bar (7 cols) ── */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-right">
              {/* Live Active Pulse Badge */}
              <motion.div
                initial={false}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 shadow-[0_2px_14px_rgba(16,185,129,0.18)] backdrop-blur-md"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-xs font-bold text-emerald-300">
                  {offers.length > 0
                    ? `مباشر: ${offers.length} عرض وخصم متاح الآن في الزقازيق`
                    : 'منصة عروض وخصومات الزقازيق الحصرية'}
                </span>
              </motion.div>

              {/* Grand Headline */}
              <div className="space-y-3">
                <h1
                  id="home-hero-title"
                  className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.25]"
                >
                  عروض وخصومات الزقازيق <br />
                  <span className="bg-gradient-to-r from-[#FF6500] via-[#FF8A32] to-[#FFA756] bg-clip-text text-transparent">
                    في مكان واحد وبدون دفع أونلاين
                  </span>
                </h1>
                <p className="text-[15px] sm:text-base text-[#94A3B8] leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  احصل على كوبونات خصم مجانية فورية من أشهر مطاعم، كافيهات، ومحلات القومية، فلل الجامعة، وكل أحياء الزقازيق. اطلب كوبونك ووفر على فاتورتك في المتجر مباشرة!
                </p>
              </div>

              {/* Unified Luxury Command Bar */}
              <div className="rounded-2xl border border-white/10 bg-[#0F1B2E]/90 p-2 shadow-2xl backdrop-blur-xl">
                <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch gap-2">
                  
                  {/* Area Picker Button Trigger */}
                  <button
                    type="button"
                    onClick={() => setAreaModalOpen(true)}
                    aria-haspopup="dialog"
                    className="flex min-h-[48px] items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#16253B] px-3.5 py-2 text-white hover:border-[#FF6500]/50 hover:bg-[#1A2D47] transition-all flex-shrink-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <RiMapPin2Fill className="text-[#FF6500] flex-shrink-0" size={18} />
                      <span className="text-xs sm:text-sm font-bold truncate max-w-[120px] sm:max-w-[140px]">
                        {activeArea || 'كل أحياء الزقازيق'}
                      </span>
                    </div>
                    <RiArrowDownSLine size={18} className="text-slate-400" />
                  </button>

                  {/* Search Input Box */}
                  <div className="relative flex-1 flex items-center min-w-0 bg-[#0B1524] rounded-xl border border-white/5 focus-within:border-[#FF6500]/60 transition-all">
                    <div className="pr-3 pl-2 text-slate-400">
                      <RiSearch2Line size={19} />
                    </div>
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="ابحث عن مطعم، كافيه، براند أو عرض..."
                      className="w-full bg-transparent py-3 pr-1 pl-3 text-sm text-white placeholder:text-slate-500 outline-none border-none focus:ring-0"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => { setSearch(''); searchInputRef.current?.focus(); }}
                        className="p-2 text-slate-400 hover:text-white"
                        title="مسح"
                      >
                        <RiCloseLine size={18} />
                      </button>
                    )}
                  </div>

                  {/* Submit Action Button */}
                  <button
                    type="submit"
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6500] to-[#FF8A32] px-6 py-2.5 text-sm font-black text-white shadow-[0_4px_18px_rgba(255,101,0,0.35)] hover:shadow-[0_6px_24px_rgba(255,101,0,0.5)] active:scale-95 transition-all flex-shrink-0"
                  >
                    <span>بحث</span>
                    <RiArrowLeftLine size={16} />
                  </button>
                </form>
              </div>

              {/* Quick Trending Searches */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <RiFireFill className="text-[#FF6500]" size={14} /> الأكثر طلباً:
                </span>
                {POPULAR_SEARCH_TAGS.map(({ label, query }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setSearch(query);
                      router.push(`/offers?q=${encodeURIComponent(query)}`);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 hover:border-[#FF6500]/40 hover:bg-[#FF6500]/10 text-xs font-semibold text-slate-300 hover:text-white transition-all active:scale-95"
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Trust & Value Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-right">
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 backdrop-blur-sm">
                  <div className="text-xl font-black text-white">{offers.length > 0 ? `${offers.length}+` : '50+'}</div>
                  <div className="text-xs text-slate-400 font-medium">عروض حصرية نشطة</div>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 backdrop-blur-sm">
                  <div className="text-xl font-black text-emerald-400">{stores.length > 0 ? `${stores.length}+` : '30+'}</div>
                  <div className="text-xs text-slate-400 font-medium">متجر ومطعم معتمد</div>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 backdrop-blur-sm">
                  <div className="text-xl font-black text-amber-400">70%</div>
                  <div className="text-xs text-slate-400 font-medium">خصومات حقيقية موثقة</div>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 backdrop-blur-sm">
                  <div className="text-xl font-black text-[#FF8A32]">0 ج.م</div>
                  <div className="text-xs text-slate-400 font-medium">كوبونات مجانية 100%</div>
                </div>
              </div>
            </div>

            {/* ── Left Column: Spotlight Deal Card (5 cols) ── */}
            <div className="lg:col-span-5 hidden lg:block">
              {spotlightOffer ? (
                <SpotlightHeroCard offer={spotlightOffer} />
              ) : (
                <div className="h-[430px] rounded-3xl border border-white/10 bg-[#0F1B2E]/60 animate-pulse" />
              )}
            </div>

          </div>
        </div>
      </section>

      {error && !loading && (
        <div className="home-container home-api-error my-6" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => fetchDataRef.current(true)}>إعادة المحاولة</button>
        </div>
      )}

      {/* ─── Categories Navigation Strip ─────────────────────── */}
      {categories.length > 0 && (
        <section className="home-container home-section" aria-labelledby="home-categories-title">
          <div className="home-section-heading">
            <div>
              <span className="home-section-kicker">اختار اللي يناسب خروجتك</span>
              <h2 id="home-categories-title" className="home-section-title">تصفح حسب الأقسام</h2>
            </div>
            <Link prefetch={false} href="/categories" className="home-section-link">
              كل الأقسام ({categories.length}) <RiArrowLeftLine />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
            {categories.slice(0, 8).map((category) => {
              const catName = getCatName(category.name);
              const count = categoryCounts[category.id] || 0;
              const isActive = activeCat === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setActiveCat(isActive ? '' : category.id);
                  }}
                  className={`group relative flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border transition-all text-center ${
                    isActive
                      ? 'border-[#FF6500] bg-gradient-to-b from-[#FF6500]/20 to-[#101A2B] shadow-[0_8px_20px_rgba(255,101,0,0.25)]'
                      : 'border-[#25344A] bg-[#101A2B] hover:border-[#FF8A32]/60 hover:bg-[#152238] hover:-translate-y-1'
                  }`}
                  aria-label={`تصفية حسب قسم ${catName}`}
                >
                  {/* Category Icon with luxury glass container */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110 ${
                    isActive ? 'bg-[#FF6500] text-white' : 'bg-white/5 text-[#FF8A32] group-hover:bg-[#FF6500]/20'
                  }`}>
                    <CategoryIcon name={catName} size={24} />
                  </div>

                  <strong className="text-xs sm:text-sm font-bold text-white truncate max-w-full">
                    {catName}
                  </strong>

                  <span className={`text-[10px] mt-1 font-medium transition-colors ${
                    isActive ? 'text-amber-300' : 'text-slate-400 group-hover:text-slate-300'
                  }`}>
                    {count > 0 ? `${count} عرض` : 'عروض مميزة'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Area Filter Pills */}
          <div className="home-areas-row mt-6" aria-label="تصفية العروض حسب المنطقة">
            <RiMapPin2Fill aria-hidden="true" className="flex-shrink-0 text-[#FF8A32]" />
            {ZAGAZIG_AREAS.map((area) => {
              const isActive = (area === 'الكل' && !activeArea) || activeArea === area;
              return (
                <button
                  key={area}
                  type="button"
                  onClick={(event) => {
                    setActiveArea(area === 'الكل' ? '' : area);
                    scrollActiveIntoView(event);
                  }}
                  className={`home-area-chip ${isActive ? 'is-active' : ''}`}
                >
                  {area}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── Trending Offers ("الأكثر انتشاراً في الزقازيق 🔥") ─ */}
      {!activeCat && !search && trendingOffers.length > 0 && (
        <section className="home-container home-section" aria-labelledby="trending-offers-title">
          <div className="home-section-heading flex-wrap">
            <div className="flex items-center gap-3">
              <div className="home-heading-icon bg-gradient-to-tr from-[#FF6500] to-[#FF8A32] text-white shadow-[0_4px_14px_rgba(255,101,0,0.4)]">
                <RiFireFill size={20} />
              </div>
              <div>
                <span className="home-section-kicker">عروض يكثر عليها الطلب الآن</span>
                <h2 id="trending-offers-title" className="home-section-title">الأكثر انتشاراً في الزقازيق 🔥</h2>
              </div>
            </div>
            <Link prefetch={false} href="/offers" className="home-section-link">
              عرض كل العروض <RiArrowLeftLine size={16} />
            </Link>
          </div>

          <div className="home-horizontal-offers">
            {trendingOffers.map((offer) => (
              <div key={offer.id} className="home-horizontal-offer">
                <OfferCard offer={offer} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Recommended Offers ("عروض مقترحة لك ✨") ──────── */}
      {!activeCat && !search && recommended.length > 0 && (
        <section className="home-container home-section" aria-labelledby="recommended-offers-title">
          <div className="home-section-heading flex-wrap">
            <div className="flex items-center gap-3">
              <div className="home-heading-icon bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-[0_4px_14px_rgba(2,132,199,0.4)]">
                <RiSparkling2Fill size={20} />
              </div>
              <div>
                <span className="home-section-kicker">تناسب ذوقك واهتماماتك</span>
                <h2 id="recommended-offers-title" className="home-section-title">عروض مقترحة لك خصيصاً ✨</h2>
              </div>
            </div>
            <Link prefetch={false} href="/offers" className="home-section-link">
              عرض كل العروض <RiArrowLeftLine size={16} />
            </Link>
          </div>

          <div className="home-horizontal-offers">
            {recommended.map((offer) => (
              <div key={offer.id} className="home-horizontal-offer">
                <OfferCard offer={offer} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Featured Advertisements Carousel ───────────────── */}
      {banners.length > 0 && (
        <section
          className="featured-ads-section ad-carousel home-container home-section"
          aria-roledescription="carousel"
          aria-label="إعلانات وعروض مميزة"
          aria-live="off"
          data-paused={bannerPaused ? 'true' : 'false'}
          onMouseEnter={() => setBannerPaused(true)}
          onMouseLeave={() => setBannerPaused(false)}
          onFocusCapture={() => setBannerPaused(true)}
          onBlurCapture={() => setBannerPaused(false)}
        >
          <div className="ad-carousel-heading">
            <div>
              <span className="ad-carousel-kicker"><RiSparkling2Fill /> مختار ليك بعناية</span>
              <h2>عروض وإعلانات مميزة ✨</h2>
            </div>
          </div>

          <div className="ad-carousel-stage">
            <AnimatePresence mode="wait" initial={false}>
              <motion.a
                key={banners[safeActiveBanner].id}
                href={banners[safeActiveBanner].actionUrl || '/offers'}
                className="featured-billboard ad-carousel-main group"
                aria-label={`${getBannerTitle(banners[safeActiveBanner].title)} — ${getBannerAction(banners[safeActiveBanner].actionUrl)}`}
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                drag={banners.length > 1 ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -55) showNextBanner();
                  if (info.offset.x > 55) showPreviousBanner();
                }}
              >
                <div className="featured-billboard-media">
                  {banners[safeActiveBanner].image ? (
                    <Image
                      src={resolveImageUrl(banners[safeActiveBanner].image) ?? '/placeholder-offer.jpg'}
                      alt={getBannerTitle(banners[safeActiveBanner].title)}
                      fill
                      className="featured-billboard-image object-cover transition-transform duration-700 group-hover:scale-[1.015]"
                      sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1200px) 75vw, 1100px"
                      quality={86}
                      preload={safeActiveBanner === 0}
                    />
                  ) : <div className="featured-billboard-image-fallback"><RiSparkling2Fill /></div>}
                  <span className="ad-carousel-shade" aria-hidden="true" />
                </div>
                <div className="featured-billboard-content ad-carousel-copy">
                  {banners[safeActiveBanner].tag && <span className="featured-billboard-badge ad-carousel-tag">{getBannerTag(banners[safeActiveBanner].tag)}</span>}
                  <h3 className="featured-billboard-title">{getBannerTitle(banners[safeActiveBanner].title)}</h3>
                  {banners[safeActiveBanner].subtitle && banners[safeActiveBanner].subtitle !== banners[safeActiveBanner].title && <p className="featured-billboard-description">{banners[safeActiveBanner].subtitle}</p>}
                  <span className="featured-billboard-cta ad-carousel-action">{getBannerAction(banners[safeActiveBanner].actionUrl)} <RiArrowLeftSLine /></span>
                </div>
                {banners.length > 1 && <span className="ad-carousel-count"><b>{String(safeActiveBanner + 1).padStart(2, '0')}</b> / {String(banners.length).padStart(2, '0')}</span>}
              </motion.a>
            </AnimatePresence>

            {banners.length > 1 && <>
              <button type="button" className="billboard-control billboard-control-previous" onClick={showPreviousBanner} aria-label="الإعلان السابق"><RiArrowRightSLine /></button>
              <button type="button" className="billboard-control billboard-control-next" onClick={showNextBanner} aria-label="الإعلان التالي"><RiArrowLeftSLine /></button>
            </>}

            {banners.length > 1 && (
              <button type="button" className="ad-carousel-preview" onClick={showNextBanner} aria-label={`عرض الإعلان التالي: ${banners[(safeActiveBanner + 1) % banners.length].title}`}>
                {banners[(safeActiveBanner + 1) % banners.length].image && (
                  <Image src={resolveImageUrl(banners[(safeActiveBanner + 1) % banners.length].image) ?? '/placeholder-offer.jpg'} alt="" fill className="object-cover" sizes="320px" />
                )}
                <span className="ad-carousel-preview-shade" />
                <span className="ad-carousel-preview-label">التالي</span>
                <strong>{getBannerTitle(banners[(safeActiveBanner + 1) % banners.length].title)}</strong>
              </button>
            )}
          </div>

          {banners.length > 1 && (
            <div className="ad-carousel-pagination">
              {banners.map((banner, index) => (
                <button key={banner.id} type="button" className={index === safeActiveBanner ? 'is-active' : ''} onClick={() => setActiveBanner(index)} aria-label={`الانتقال إلى الإعلان ${index + 1}`} aria-current={index === safeActiveBanner ? 'true' : undefined}>
                  <span />
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ─── Food & Dining Showcase ("ركن الأكل والمطاعم 🍔") ── */}
      {!activeCat && !search && foodOffers.length > 0 && (
        <section className="home-container home-section" aria-labelledby="food-offers-title">
          <div className="home-section-heading flex-wrap">
            <div className="flex items-center gap-3">
              <div className="home-heading-icon bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-[0_4px_14px_rgba(245,158,11,0.4)]">
                <RiRestaurant2Line size={20} />
              </div>
              <div>
                <span className="home-section-kicker">برجر، بيتزا، كافيهات وحلويات</span>
                <h2 id="food-offers-title" className="home-section-title">ركن الأكل والمطاعم 🍔</h2>
              </div>
            </div>
            <Link prefetch={false} href="/offers?q=أكل" className="home-section-link">
              عرض كل المطاعم <RiArrowLeftLine size={16} />
            </Link>
          </div>

          <div className="home-horizontal-offers">
            {foodOffers.map((offer) => (
              <div key={offer.id} className="home-horizontal-offer">
                <OfferCard offer={offer} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Offers near the selected area ─────────────────── */}
      {activeArea && nearbyOffers.length > 0 && (
        <HomeOffersSection id="nearby-offers" title="عروض قريبة منك" subtitle={`عروض متاحة في ${activeArea}`} offers={nearbyOffers} />
      )}

      {/* ─── Featured Verified Stores ──────────────────────── */}
      {!activeCat && !search && stores.length > 0 && (
        <section className="featured-stores-section home-section" aria-labelledby="featured-stores-title">
          <div className="featured-stores-container">
            <div className="featured-stores-header">
              <div>
                <span className="home-section-kicker">شركاؤنا في المدينة</span>
                <h2 id="featured-stores-title">متاجر معتمدة في الزقازيق 🏪</h2>
                <p>اكتشف أشهر المطاعم والبراندات الموثوقة القريبة منك</p>
              </div>
              <Link prefetch={false} href="/stores" className="featured-stores-all">
                كل المتاجر ({stores.length}) <RiArrowLeftLine />
              </Link>
            </div>
            <div className="featured-stores-grid">
              {stores.slice(0, 3).map(store => <FeaturedStoreCard key={store.id} store={store} />)}
              {stores.length < 3 && <FeaturedStoresCta />}
            </div>
          </div>
        </section>
      )}

      {/* ─── Ending soon flash deals ───────────────────────── */}
      {endingSoonOffers.length > 0 && (
        <HomeOffersSection id="ending-soon" title="عروض تنتهي قريبًا ⏳" subtitle="الحق الخصم قبل انتهاء مدة الكوبون" offers={endingSoonOffers} />
      )}

      {/* ─── Main Offers Feed with Filter & Sorting ─────────── */}
      <section ref={offersGridRef} className="home-container home-section scroll-mt-24" aria-labelledby="latest-offers-title">
        <div className="home-section-heading flex-wrap">
          <div className="flex items-center gap-3">
            <div className="home-heading-icon"><RiSparkling2Fill size={20} /></div>
            <div>
              <span className="home-section-kicker">
                {activeCat ? 'تصنيف محدد' : activeArea ? `في ${activeArea}` : 'عروض متجددة باستمرار'}
              </span>
              <h2 id="latest-offers-title" className="home-section-title">
                {activeCat ? `عروض قسم ${getCatName(categories.find(c => c.id === activeCat)?.name || '')}` : 'جميع العروض المتاحة'}
              </h2>
            </div>
          </div>
          <div className="home-sort-control flex items-center gap-1 rounded-xl border border-[#25344A] bg-[#0D1728] p-1">
            {(['newest', 'expiring', 'discount'] as SortOption[]).map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  sortBy === option ? 'bg-[#FF8A32] text-[#07101F]' : 'text-[#95A3B7] hover:text-white'
                }`}
              >
                {option === 'newest' ? 'الأحدث' : option === 'expiring' ? 'ينتهي قريبًا' : 'الأعلى خصمًا'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="home-offers-grid">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredOffers.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="home-offers-empty rounded-2xl border border-[#25344A] bg-[#101A2B] py-14 px-6 text-center max-w-lg mx-auto my-8 shadow-lg"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#FF6500]/10 border border-[#FF6500]/20 flex items-center justify-center text-[#FF6500]">
              <RiSearch2Line size={32} />
            </div>
            <h3 className="text-lg font-black text-white">لا توجد عروض مطابقة لبحثك حالياً</h3>
            <p className="text-sm text-[#8FA0B8] mt-2 mb-6 leading-relaxed">
              جرّب تغيير كلمات البحث أو استعراض كل الأقسام والمناطق المتاحة في الزقازيق.
            </p>
            <button 
              type="button"
              onClick={() => { setActiveCat(''); setSearch(''); setActiveArea(''); }} 
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6500] to-[#FF8A32] text-white text-sm font-bold shadow-[0_4px_14px_rgba(255,101,0,0.3)] hover:shadow-[0_6px_20px_rgba(255,101,0,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6500] active:scale-95 transition-all"
            >
              إعادة ضبط الفلاتر وعرض الكل
            </button>
          </motion.div>
        ) : (
          <div className="home-offers-grid">
            {filteredOffers.slice(0, 24).map((offer, i) => (
              <div key={offer.id} className="content-auto">
                <OfferCard offer={offer} priority={i < 2} />
              </div>
            ))}
          </div>
        )}

        {!loading && filteredOffers.length > 0 && (
          <div className="mt-10 text-center">
            <Link 
              prefetch={false}
              href="/offers"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6500] to-[#FF8A32] px-8 text-sm font-black text-white shadow-[0_4px_18px_rgba(255,101,0,0.35)] hover:shadow-[0_6px_24px_rgba(255,101,0,0.5)] active:scale-95 transition-all"
            >
              <span>عرض كل العروض في كتالوج الزقازيق</span>
              <RiArrowLeftLine size={18} />
            </Link>
          </div>
        )}
      </section>

      {/* ─── Why Zag Offers ("ليه تختار زاج أوفرز؟ 💡") ────── */}
      <section className="home-container home-section" aria-labelledby="why-zag-title">
        <div className="home-section-heading">
          <div>
            <span className="home-section-kicker">مميزات المنصة</span>
            <h2 id="why-zag-title" className="home-section-title">ليه تختار زاج أوفرز؟ 💡</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-[#25344A] bg-[#101A2B] p-6 space-y-3 hover:border-[#FF6500]/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#FF6500]/10 border border-[#FF6500]/20 flex items-center justify-center text-[#FF6500]">
              <RiCoupon3Line size={24} />
            </div>
            <h3 className="text-base font-black text-white">كوبونات مجانية 100%</h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              احجز كوبونك بضغطة واحدة من موبايلك، بدون أي رسوم أو دفع إلكتروني أو الحاجة لكروت بنكية.
            </p>
          </div>

          <div className="rounded-2xl border border-[#25344A] bg-[#101A2B] p-6 space-y-3 hover:border-emerald-500/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <RiShieldCheckFill size={24} />
            </div>
            <h3 className="text-base font-black text-white">خصومات حقيقية وموثقة</h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              كل العروض والخصومات متفق عليها ومؤكدة مباشرة مع أصحاب المحلات والمطاعم المعتمدة بالزقازيق.
            </p>
          </div>

          <div className="rounded-2xl border border-[#25344A] bg-[#101A2B] p-6 space-y-3 hover:border-[#0284C7]/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#0284C7]/10 border border-[#0284C7]/20 flex items-center justify-center text-[#0284C7]">
              <RiPercentLine size={24} />
            </div>
            <h3 className="text-base font-black text-white">توفير فوري عند الكاشير</h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              اعرض كود الكوبون أو الـ QR داخل المحل عند الدفع واستمتع بالخصم المباشر في فاتورتك.
            </p>
          </div>
        </div>
      </section>

      {/* ─── How it works steps ────────────────────────────── */}
      <section className="home-container home-section" aria-labelledby="how-zag-works">
        <div className="home-section-heading">
          <div>
            <span className="home-section-kicker">بخطوات بسيطة وسريعة</span>
            <h2 id="how-zag-works" className="home-section-title">كيف تستخدم زاج؟</h2>
          </div>
        </div>
        <div className="home-steps-grid">
          {[
            ['1', <RiMapPin2Fill key="map" />, 'اختر منطقتك', 'حدد منطقتك في الزقازيق (القومية، فلل الجامعة، المشاية، ...) لتظهر لك العروض الأقرب.'],
            ['2', <RiCompass3Line key="compass" />, 'اكتشف العرض المناسب', 'تصفح الخصومات الحقيقية في المطاعم، الكافيهات، والمتاجر.'],
            ['3', <RiCoupon3Line key="coupon" />, 'احصل على الكوبون فوراً', 'احفظ الكوبون مجاناً واعرض الكود أو الـ QR داخل المتجر عند الدفع.'],
          ].map(([number, icon, title, description]) => (
            <div key={number as string} className="home-step-card">
              <div className="home-step-top">
                <span className="home-step-icon">{icon}</span>
                <span className="home-step-number">{number}</span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>

        {/* Merchant Call to Action Banner */}
        <div className="home-merchant-cta mt-8">
          <div>
            <h2>عندك متجر أو مطعم في الزقازيق؟ 🚀</h2>
            <p>انضم لشبكة تجار زاج أوفرز، انشر عروضك الحصرية، واستقبل آلاف العملاء الجدد من مدينتك.</p>
          </div>
          <Link href="https://vendor.zagoffers.online" target="_blank" className="home-primary-link">
            سجّل متجرك كتاجر الآن <RiArrowLeftLine />
          </Link>
        </div>

        {/* Area Picker Modal */}
        <AreaPickerModal
          isOpen={areaModalOpen}
          onClose={() => setAreaModalOpen(false)}
          selectedArea={activeArea}
          onSelectArea={setActiveArea}
        />
      </section>
    </div>
  );
}

// ─── Floating Spotlight Hero Card Component ────────────────
function SpotlightHeroCard({ offer }: { offer: Offer }) {
  const pricing = resolveOfferPricing(offer);
  const [imgFailed, setImgFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  
  const imgUrl = !imgFailed && offer.images?.[0] ? resolveImageUrl(offer.images[0]) : null;
  const logoUrl = !logoFailed && offer.store?.logo ? resolveImageUrl(offer.store.logo) : null;
  const storeRating = offer.store?.ratingAvg || 4.8;
  const daysLeft = calculateDaysLeft(offer.endDate);

  return (
    <div className="relative group rounded-3xl p-1 bg-gradient-to-b from-[#FF8A32]/40 via-white/10 to-transparent shadow-[0_20px_60px_rgba(255,101,0,0.2)]">
      {/* Ambient background glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#FF6500]/25 to-[#0284C7]/25 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500" />
      
      <div className="relative rounded-[22px] bg-[#0E1A2D]/95 backdrop-blur-xl border border-white/10 p-5 overflow-hidden text-right">
        {/* Top Header Tag Row */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#FF6500]/20 to-[#FF8A32]/10 border border-[#FF6500]/30 text-xs font-black text-[#FF8A32]">
            <RiFireFill size={14} />
            <span>عرض اليوم الحصري بالزقازيق 🔥</span>
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400">
            <RiStarFill size={13} />
            <span>{storeRating.toFixed(1)}</span>
          </div>
        </div>

        {/* Offer Media */}
        <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-[#17253B] mb-4">
          {imgUrl ? (
            <Image
              src={imgUrl}
              alt={offer.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="420px"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-[#FF8A32]">
              <RiSparkling2Fill size={48} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E1A2D] via-transparent to-black/30" />

          {/* Discount Pill */}
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-[#FF6500] text-white font-black text-sm shadow-lg">
            {pricing.topDiscountBadge || 'خصم خاص'}
          </div>

          {/* Expiry Pill */}
          {daysLeft > 0 && (
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-bold text-orange-300">
              <RiTimeLine size={13} />
              <span>متبقي {daysLeft} أيام</span>
            </div>
          )}

          {/* Store Monogram / Logo Avatar */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#0E1A2D]/90 backdrop-blur-md border border-white/10">
            <div className="w-6 h-6 rounded-lg bg-[#FF6500]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
              {logoUrl ? (
                <Image src={logoUrl} alt={offer.store.name} width={24} height={24} className="object-contain" onError={() => setLogoFailed(true)} />
              ) : (
                <span className="text-xs font-black text-[#FF6500]">{offer.store.name.charAt(0)}</span>
              )}
            </div>
            <span className="text-xs font-bold text-white truncate max-w-[140px]">{offer.store.name}</span>
            <RiCheckboxCircleFill className="text-[#0284C7] flex-shrink-0" size={14} title="متجر معتمد" />
          </div>
        </div>

        {/* Offer Details */}
        <div className="space-y-1.5 mb-3.5">
          <h3 className="text-base font-black text-white line-clamp-1 group-hover:text-[#FF8A32] transition-colors">
            {offer.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {offer.store.area && (
              <span className="flex items-center gap-1">
                <RiMapPin2Fill className="text-[#FF6500]" size={13} />
                {offer.store.area}
              </span>
            )}
            {offer.store.area && <span>•</span>}
            <span className="text-emerald-400 font-semibold">جاهز للاستخدام الفوري ✨</span>
          </div>
        </div>

        {/* Pricing & Savings */}
        <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/5 mb-4">
          <div>
            <div className="text-[11px] text-slate-400">السعر بعد الخصم</div>
            <div className="flex items-baseline gap-1.5">
              {pricing.finalPrice !== null ? (
                <>
                  <span className="text-xl font-black text-white">{formatPrice(pricing.finalPrice)}</span>
                  <span className="text-xs text-slate-400">ج.م</span>
                  {pricing.originalPrice && (
                    <span className="text-xs text-slate-500 line-through mr-1.5">
                      {formatPrice(pricing.originalPrice)} ج.م
                    </span>
                  )}
                </>
              ) : (
                <span className="text-base font-black text-[#FF8A32]">خصم حصري على الفاتورة</span>
              )}
            </div>
          </div>

          {pricing.hasSavings && pricing.savingsAmount > 0 && (
            <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
              وفرت {formatPrice(pricing.savingsAmount)} ج.م
            </div>
          )}
        </div>

        {/* CTA Button */}
        <Link
          href={`/offers/${offer.id}`}
          className="w-full flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6500] to-[#FF8A32] text-sm font-bold text-white shadow-[0_4px_16px_rgba(255,101,0,0.35)] hover:shadow-[0_6px_22px_rgba(255,101,0,0.5)] active:scale-[0.98] transition-all"
        >
          <RiCoupon3Line size={18} />
          <span>احصل على الكوبون مجاناً</span>
          <RiArrowLeftLine size={16} />
        </Link>
      </div>
    </div>
  );
}

// ─── Curated Offers Section Wrapper ────────────────────────
function HomeOffersSection({ id, title, subtitle, offers }: { id: string; title: string; subtitle: string; offers: Offer[] }) {
  return (
    <section className="home-container home-section" aria-labelledby={id}>
      <div className="home-section-heading">
        <div>
          <span className="home-section-kicker">{subtitle}</span>
          <h2 id={id} className="home-section-title">{title}</h2>
        </div>
        <Link prefetch={false} href="/offers" className="home-section-link">
          عرض كل العروض <RiArrowLeftLine />
        </Link>
      </div>
      <div className="home-offers-grid home-offers-grid-compact">
        {offers.map((offer) => (
          <div key={offer.id} className="content-auto">
            <OfferCard offer={offer} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Featured Verified Store Card ──────────────────────────
function FeaturedStoreCard({ store }: { store: Store }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const logoUrl = !logoFailed ? resolveImageUrl(store.logo) : '';
  const coverUrl = !coverFailed ? resolveImageUrl(store.coverImage) : '';
  const categoryName = store.category?.name ? getCatName(store.category.name) : '';
  const rating = store.ratingAvg || 4.8;

  return (
    <Link prefetch={false} href={`/stores/${store.id}`} className="featured-store-card group" aria-label={`استكشف متجر ${store.name}`}>
      <div className="featured-store-cover">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={`غلاف متجر ${store.name}`}
            fill
            sizes="(max-width: 640px) 84vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            quality={78}
            loading="lazy"
            onError={() => setCoverFailed(true)}
          />
        ) : (
          <div className="featured-store-cover-fallback" aria-hidden="true">
            <span className="featured-store-pattern pattern-one" />
            <span className="featured-store-pattern pattern-two" />
            <CategoryIcon name={categoryName || store.name} size={38} />
          </div>
        )}
        <div className="featured-store-logo">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`شعار ${store.name}`}
              width={76}
              height={76}
              className="h-full w-full object-contain"
              quality={76}
              loading="lazy"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <span>{store.name.trim().charAt(0)}</span>
          )}
        </div>
      </div>
      <div className="featured-store-content">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <h3 className="flex items-center gap-1.5">
            <span>{store.name}</span>
            <RiCheckboxCircleFill className="text-[#0284C7] flex-shrink-0" size={17} title="متجر معتمد" />
          </h3>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400">
            <RiStarFill size={12} />
            <span>{rating.toFixed(1)}</span>
          </div>
        </div>

        {(categoryName || store.area) && (
          <div className="featured-store-meta">
            {categoryName && <span>{categoryName}</span>}
            {categoryName && store.area && <i aria-hidden="true">•</i>}
            {store.area && (
              <span>
                <RiMapPin2Fill aria-hidden="true" className="text-[#FF8A32]" /> {store.area}
              </span>
            )}
          </div>
        )}
        <span className="featured-store-action">
          استكشف المتجر والعروض <RiArrowLeftLine />
        </span>
      </div>
    </Link>
  );
}

function FeaturedStoresCta() {
  return (
    <Link prefetch={false} href="/stores" className="featured-stores-cta" aria-label="اكتشف متاجر أكثر في الزقازيق">
      <div className="featured-stores-cta-visual" aria-hidden="true">
        <span className="featured-store-pattern pattern-one" />
        <span className="featured-store-pattern pattern-two" />
        <RiStore3Line />
      </div>
      <div className="featured-stores-cta-content">
        <h3>اكتشف متاجر أكثر في الزقازيق</h3>
        <p>مئات المتاجر، المطاعم، والخدمات الموثوقة بالقرب منك في مكان واحد</p>
        <span>عرض كل المتاجر <RiArrowLeftLine /></span>
      </div>
    </Link>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#FF6500] font-black">جاري التحميل...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
