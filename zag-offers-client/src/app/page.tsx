"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiSearch2Line, RiFireFill, RiSparkling2Fill, 
  RiStore3Fill, RiArrowUpDownLine, RiMapPin2Fill,
  RiCloseLine, RiArrowLeftSLine, RiArrowRightSLine
} from 'react-icons/ri';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
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

import { Offer, Category, Store, Banner, SortOption } from '@/lib/types';
import { API_URL, DISPLAY_NAMES, ZAGAZIG_AREAS } from '@/lib/constants';
import { normalizeCategories } from '@/lib/category-utils';
import { useNotifications } from '@/components/notification-provider';
import { extractItems, filterOffers, sortOffers } from '@/lib/catalog-utils';
import { CategoryImageCard } from '@/components/category-image-card';

const getCatName = (name: string) => DISPLAY_NAMES[name] || name;

const CACHE_KEY = 'zag_offers_home_cache_v4';
const CACHE_DURATION = 5 * 60 * 1000;

function HomePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const catIdParam = searchParams.get('category');

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (search.trim()) {
      router.push(`/offers?q=${encodeURIComponent(search.trim())}`);
    }
  };

  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [recommended, setRecommended] = useState<Offer[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeBanner, setActiveBanner] = useState(0);
  const [bannerPaused, setBannerPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<string>(catIdParam || '');
  const [activeArea, setActiveArea] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const debouncedSearch = useDebounce(search, 400);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const offersGridRef = useRef<HTMLDivElement>(null);
  const isFirstMount = useRef(true);

  const showNextBanner = useCallback(() => {
    setActiveBanner((current) => banners.length ? (current + 1) % banners.length : 0);
  }, [banners.length]);

  const showPreviousBanner = useCallback(() => {
    setActiveBanner((current) => banners.length ? (current - 1 + banners.length) % banners.length : 0);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length < 2 || bannerPaused) return;
    const timer = window.setInterval(showNextBanner, 5000);
    return () => window.clearInterval(timer);
  }, [banners.length, bannerPaused, showNextBanner]);

  useEffect(() => {
    if (activeBanner >= banners.length) setActiveBanner(0);
  }, [activeBanner, banners.length]);

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

    // Fast return on quick revisits; socket events keep this cache current.
    if (hasFreshCache && cacheAge < 60_000 && !force) return;

    const shouldShowLoading = !hasFreshCache || force;

    try {
      if (shouldShowLoading) {
        setLoading(true);
      }
      const primaryResponses = await Promise.all([
        fetch(`${API_URL}/offers?limit=24`, { cache: 'no-store' }),
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

      // Below-the-fold data must not delay the first useful render.
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

      // Save to cache
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
  }, [setOffers, setCategories, setStores, setRecommended, setBanners, setLoading, setError, setIsOffline]);

  // Stable ref so socket/polling/online handlers never get stale closures
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

    const handleBannersUpdated = () => {
      localStorage.removeItem(CACHE_KEY);
      fetchDataRef.current(true);
    };

    socket.on('banners_updated', handleBannersUpdated);
    socket.on('offers_updated', handleCategoriesUpdated);
    socket.on('new_offer', handleCategoriesUpdated);
    return () => {
      socket.off('categories_updated', handleCategoriesUpdated);
      socket.off('banners_updated', handleBannersUpdated);
      socket.off('offers_updated', handleCategoriesUpdated);
      socket.off('new_offer', handleCategoriesUpdated);
    };
  }, [socket]);

  // Conservative fallback only when realtime stays unavailable.
  useEffect(() => {
    if (isConnected) return;
    if (!navigator.onLine) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchDataRef.current(false);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  // Monitor online status
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

  const filteredOffers = useMemo(() => {
    return sortOffers(filterOffers(offers, {
      query: debouncedSearch,
      categoryId: activeCat,
      area: activeArea,
      activeOnly: true,
    }), sortBy);
  }, [offers, activeCat, activeArea, debouncedSearch, sortBy]);

  if (error && !loading && offers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center">
        <div>
          <h2 className="text-xl font-black text-white mb-4">{error}</h2>
          <button onClick={() => fetchDataRef.current(true)} className="px-6 py-2 bg-[#FF6B00] text-white rounded-lg">إعادة المحاولة</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-hidden bg-[#07101F] pb-20" dir="rtl">
      {/* ─── Hero Section ────────────────────────────────── */}
      <section className="brand-hero border-b border-[#25344A] px-4 py-7 sm:py-10">
        <div className="site-container grid min-h-[300px] items-center gap-6 lg:grid-cols-[1.3fr_.7fr] lg:gap-9">
          <div className="w-full space-y-5 text-center lg:text-right">
          <motion.div 
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#25344A] bg-[#0C1627] px-3 py-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
            <span className="text-xs font-semibold text-[#D7DFEA]">منصة عروض محلية في الزقازيق</span>
          </motion.div>

          <motion.h1 
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[32px] font-bold leading-[1.3] tracking-tight text-white sm:text-[42px]"
          >
            عروض الزقازيق في مكان واحد
          </motion.h1>

          <motion.p 
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto max-w-2xl text-[15px] font-normal leading-7 text-[#B2BED0] lg:mx-0"
          >
            اكتشف خصومات المطاعم والمتاجر والخدمات القريبة منك، واحصل على أفضل العروض بسهولة.
          </motion.p>

          {/* Search Box - Premium Style */}
          <motion.div 
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="group relative mx-auto max-w-2xl lg:mx-0"
          >
            <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2 rounded-xl border border-[#2C3A50] bg-[#0B1526] p-1.5 transition-colors group-focus-within:border-[#FF8A32]">
              {/* Search Icon */}
              <div className="mx-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-[#95A3B7]">
                <RiSearch2Line size={20} />
              </div>

              {/* Text Input */}
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="ابحث عن متجر، منتج أو عرض"
                className="no-focus-ring flex-1 bg-transparent py-2.5 text-sm font-normal text-white placeholder:text-[#74839A] border-0 focus:ring-0 focus:border-0 outline-none pr-3 pl-2"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {/* Clear button (appears only when text is entered) */}
              {search && (
                <button 
                  type="button"
                  onClick={() => { setSearch(''); searchInputRef.current?.focus(); }}
                  className="p-1.5 ml-1 rounded-full hover:bg-white/5 text-[#9A9A9A] hover:text-white transition-all duration-200"
                  title="مسح البحث"
                >
                  <RiCloseLine size={18} />
                </button>
              )}

              {/* Action Button */}
              <button 
                type="submit"
                className="flex-shrink-0 rounded-lg bg-[#FF8A32] px-8 py-2.5 text-sm font-bold text-[#07101F] transition-all hover:bg-[#FF9B4F] active:scale-[.98]"
              >
                بحث
              </button>
            </form>
          </motion.div>
          <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link prefetch={false} href="/offers" className="rounded-xl bg-[#FF8A32] px-5 py-2.5 text-sm font-bold text-[#07101F] hover:bg-[#FF9B4F]">استكشف العروض ←</Link>
            <Link prefetch={false} href="/stores" className="rounded-xl border border-[#34445B] px-5 py-2.5 text-sm font-bold text-white hover:border-[#FF8A32]">تصفح المتاجر</Link>
          </div>
          </div>

          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="hero-offers-visual relative mx-auto hidden h-[270px] w-full max-w-[350px] lg:block"
          >
            <div className="hero-offers-photo">
              <Image
                src="/categories/all.png"
                alt="متاجر وعروض محلية قريبة منك"
                fill
                priority
                sizes="350px"
                className="object-cover"
              />
              <span className="hero-offers-photo-shade" aria-hidden="true" />
              <span className="hero-offers-location">
                <RiMapPin2Fill aria-hidden="true" />
                من قلب الزقازيق
              </span>
            </div>

            <div className="hero-offers-ticket" aria-label="خصومات تصل إلى خمسين بالمائة">
              <span className="hero-offers-ticket-label">خصومات حقيقية</span>
              <strong>حتى 50%</strong>
              <span>في متاجر قريبة منك</span>
            </div>

            <div className="hero-offers-categories" aria-label="فئات عروض رائجة">
              <span className="hero-offers-thumb">
                <Image src="/categories/food.png" alt="عروض المطاعم" fill sizes="46px" className="object-cover" />
              </span>
              <span className="hero-offers-thumb">
                <Image src="/categories/tech.png" alt="عروض الإلكترونيات" fill sizes="46px" className="object-cover" />
              </span>
              <span className="hero-offers-category-copy">
                <strong>عروض بتتجدد</strong>
                <small>كل يوم، في كل الفئات</small>
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Banners Carousel ──────────────────────────── */}
      {banners.length > 0 && (
        <section
          className="ad-carousel site-container my-8"
          aria-roledescription="carousel"
          aria-label="إعلانات وعروض مميزة"
          data-paused={bannerPaused ? 'true' : 'false'}
          onMouseEnter={() => setBannerPaused(true)}
          onMouseLeave={() => setBannerPaused(false)}
          onFocusCapture={() => setBannerPaused(true)}
          onBlurCapture={() => setBannerPaused(false)}
        >
          <div className="ad-carousel-heading">
            <div>
              <span className="ad-carousel-kicker"><RiSparkling2Fill /> مختار ليك</span>
              <h2>عروض وإعلانات مميزة</h2>
            </div>
            {banners.length > 1 && (
              <div className="ad-carousel-controls">
                <button type="button" onClick={showPreviousBanner} aria-label="الإعلان السابق"><RiArrowRightSLine /></button>
                <button type="button" onClick={showNextBanner} aria-label="الإعلان التالي"><RiArrowLeftSLine /></button>
              </div>
            )}
          </div>

          <div className="ad-carousel-stage">
            <AnimatePresence mode="wait" initial={false}>
              <motion.a
                key={banners[activeBanner].id}
                href={banners[activeBanner].actionUrl || '#'}
                className="ad-carousel-main group"
                initial={{ opacity: 0, x: 34, scale: 0.985 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -28, scale: 0.985 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                drag={banners.length > 1 ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -55) showNextBanner();
                  if (info.offset.x > 55) showPreviousBanner();
                }}
              >
                {banners[activeBanner].image ? (
                  <Image
                    src={resolveImageUrl(banners[activeBanner].image) ?? '/placeholder-offer.jpg'}
                    alt={banners[activeBanner].title}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-[1.025]"
                    sizes="(max-width: 768px) 100vw, 950px"
                    quality={88}
                    priority={activeBanner === 0}
                  />
                ) : <div className="absolute inset-0 bg-[#162338]" />}
                <span className="ad-carousel-shade" aria-hidden="true" />
                <div className="ad-carousel-copy">
                  {banners[activeBanner].tag && <span className="ad-carousel-tag">{banners[activeBanner].tag}</span>}
                  <h3>{banners[activeBanner].title}</h3>
                  {banners[activeBanner].subtitle && <p>{banners[activeBanner].subtitle}</p>}
                  {banners[activeBanner].actionUrl && <span className="ad-carousel-action">اكتشف العرض <RiArrowLeftSLine /></span>}
                </div>
                <span className="ad-carousel-count"><b>{String(activeBanner + 1).padStart(2, '0')}</b> / {String(banners.length).padStart(2, '0')}</span>
              </motion.a>
            </AnimatePresence>

            {banners.length > 1 && (
              <button type="button" className="ad-carousel-preview" onClick={showNextBanner} aria-label={`عرض الإعلان التالي: ${banners[(activeBanner + 1) % banners.length].title}`}>
                {banners[(activeBanner + 1) % banners.length].image && (
                  <Image src={resolveImageUrl(banners[(activeBanner + 1) % banners.length].image) ?? '/placeholder-offer.jpg'} alt="" fill className="object-cover" sizes="320px" />
                )}
                <span className="ad-carousel-preview-shade" />
                <span className="ad-carousel-preview-label">التالي</span>
                <strong>{banners[(activeBanner + 1) % banners.length].title}</strong>
                <RiArrowLeftSLine className="ad-carousel-preview-arrow" />
              </button>
            )}
          </div>

          {banners.length > 1 && (
            <div className="ad-carousel-pagination">
              {banners.map((banner, index) => (
                <button key={banner.id} type="button" className={index === activeBanner ? 'is-active' : ''} onClick={() => setActiveBanner(index)} aria-label={`الانتقال إلى الإعلان ${index + 1}`} aria-current={index === activeBanner ? 'true' : undefined}>
                  <span />
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ─── Categories & Areas Filter ──────────────────────────── */}
      <section className="site-container mb-12 mt-9">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white sm:text-2xl">تصفح حسب القسم</h2>
          <Link prefetch={false} href="/categories" className="text-sm font-semibold text-[#FF8A32] hover:text-[#FFAC6E]">كل الأقسام ←</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.slice(0, 6).map((category) => (
            <Link prefetch={false} key={category.id} href={`/offers?category=${category.id}`} className="group block transition-transform hover:-translate-y-1">
              <CategoryImageCard name={getCatName(category.name)} image={category.image} compact />
            </Link>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <RiMapPin2Fill size={17} className="flex-shrink-0 text-[#FF8A32]" />
              {ZAGAZIG_AREAS.map((area) => {
                const isActive = (area === 'الكل' && !activeArea) || activeArea === area;
                return (
                  <button
                    key={area}
                    onClick={(e) => {
                      setActiveArea(area === 'الكل' ? '' : area);
                      scrollActiveIntoView(e);
                    }}
                    className={`flex-shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-all
                      ${isActive
                        ? 'border-[#FF8A32] bg-[#FF8A32] text-[#07101F]'
                        : 'border-[#25344A] bg-[#0D1728] text-[#AAB5C6] hover:border-[#FF8A32]/60 hover:text-white'}`}
                  >
                    {area}
                  </button>
                );
              })}
        </div>
      </section>

      {/* ─── Smart Recommendations ───────────────────────── */}
      <AnimatePresence>
        {!activeCat && !search && recommended.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-7xl mx-auto px-4 mb-16"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FF6B00]/10 rounded-xl flex items-center justify-center text-[#FF6B00]">
                  <RiSparkling2Fill size={20} />
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white">عروض مختارة لك</h2>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
              {recommended.map((offer) => (
                <div key={offer.id} className="min-w-[240px] sm:min-w-[280px]">
                  <OfferCard 
                    offer={offer} 
                    priority={offer.id === recommended[0]?.id || offer.id === recommended[1]?.id} 
                  />
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ─── Featured Stores Bento ───────────────────────── */}
      {!activeCat && !search && stores.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-title text-white">براندات بنحبها</h2>
            <Link prefetch={false} href="/stores" className="text-xs font-black text-[#FF6B00] bg-[#FF6B00]/10 px-4 py-2 rounded-full hover:bg-[#FF6B00] hover:text-white transition-all">كل المتاجر</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {stores.slice(0, 12).map(store => (
              <Link prefetch={false} key={store.id} href={`/stores/${store.id}`} className="group">
                <div className="bg-[#0F1A2B] border border-[#2A3A52] rounded-2xl p-4 flex flex-col items-center justify-center space-y-3 hover:border-[#FF6B00]/50 hover:bg-[#162338] hover:-translate-y-0.5 transition-all duration-300">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center p-2 group-hover:scale-105 transition-transform duration-500 shadow-inner">
                    {store.logo ? (
                      <Image 
                        src={resolveImageUrl(store.logo)!} 
                        alt={store.name} 
                        width={56}
                        height={56}
                        className="w-full h-full object-contain" 
                        quality={70}
                      />
                    ) : (
                      <RiStore3Fill className="text-white/20" size={20} />
                    )}
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-white/70 group-hover:text-white transition-colors text-center">{store.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── Main Content Grid ───────────────────────────── */}
      <section ref={offersGridRef} className="site-container scroll-mt-24">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF6B00]/10 rounded-xl flex items-center justify-center text-[#FF6B00]">
              <RiFireFill size={20} />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              {activeCat ? `عروض ${getCatName(categories.find(c => c.id === activeCat)?.name || '')}` : 'أحدث العروض'}
            </h2>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-[#25344A] bg-[#0D1728] p-1">
            {(['newest', 'expiring', 'discount'] as SortOption[]).map((option) => (
              <button key={option} onClick={() => setSortBy(option)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${sortBy === option ? 'bg-[#FF8A32] text-[#07101F]' : 'text-[#95A3B7] hover:text-white'}`}>
                {option === 'newest' ? 'الأحدث' : option === 'expiring' ? 'ينتهي قريبًا' : 'الأعلى خصمًا'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredOffers.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-[#25344A] bg-[#101A2B] py-20 text-center"
          >
            <h3 className="text-lg font-black text-white">للأسف مفيش عروض هنا حالياً</h3>
            <button onClick={() => { setActiveCat(''); setSearch(''); }} className="mt-4 text-[#FF6B00] font-black text-sm hover:underline">عرض كل العروض</button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredOffers.slice(0, 24).map((offer, i) => (
                <div key={offer.id} className="content-auto">
                  <OfferCard offer={offer} priority={i < 2} />
                </div>
              ))}
          </div>
        )}

        {!loading && filteredOffers.length >= 24 && (
          <div className="mt-20 text-center">
            <Link 
              prefetch={false}
              href="/offers"
              className="inline-flex items-center gap-3 px-12 py-5 bg-[#FF6B00] rounded-2xl font-black text-white hover:bg-[#D95A00] transition-all shadow-[0_10px_30px_rgba(255,107,0,0.3)] hover:scale-105 active:scale-95"
            >
              استكشف كل العروض الحصرية
              <RiArrowUpDownLine size={20} className="rotate-90" />
            </Link>
          </div>
        )}
      </section>

      <section className="site-container mt-16">
        <h2 className="mb-6 text-2xl font-bold text-white">كيف تستخدم زاج؟</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['1', 'اختر منطقتك', 'حدد منطقتك في الزقازيق لتصلك العروض القريبة منك.'],
            ['2', 'تصفح العروض', 'اكتشف الخصومات والكوبونات المتاحة في المطاعم والمتاجر.'],
            ['3', 'احصل على الكوبون', 'احفظ الكوبون واستخدمه في المتجر مباشرة.'],
          ].map(([number, title, description]) => (
            <div key={number} className="surface-card p-6">
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#1B2940] text-lg font-bold text-[#FF8A32]">{number}</span>
              <h3 className="text-lg font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-[#9EABBE]">{description}</p>
            </div>
          ))}
        </div>

        <div className="surface-card mt-8 flex flex-col items-start justify-between gap-5 p-7 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-white">عندك متجر في الزقازيق؟</h2>
            <p className="mt-2 text-sm text-[#9EABBE]">أضف متجرك على زاج ووصل عروضك لآلاف العملاء المحليين.</p>
          </div>
          <Link href="https://vendor.zagoffers.online" target="_blank" className="rounded-xl bg-[#FF8A32] px-6 py-3 text-sm font-bold text-[#07101F] hover:bg-[#FF9B4F]">أضف متجرك</Link>
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


