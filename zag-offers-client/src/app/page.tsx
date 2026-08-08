"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiSearch2Line, RiFireFill, RiSparkling2Fill, RiMapPin2Fill,
  RiCloseLine, RiArrowLeftSLine, RiArrowRightSLine,
  RiCoupon3Line, RiMapPinLine, RiCompass3Line, RiArrowLeftLine, RiStore3Line
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
import { CategoryIcon } from '@/components/category-icon';

const getCatName = (name: string) => DISPLAY_NAMES[name] || name;
const getBannerTitle = (title: string) => /المطاعم.*بانتظاركم/.test(title.trim()) ? 'أشهى الأكلات مستنياك' : title;
const getBannerTag = (tag?: string) => tag?.trim() === 'مصايف' ? 'عروض المصيف' : tag;

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
  const [currentTime, setCurrentTime] = useState(0);
  const debouncedSearch = useDebounce(search, 400);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const offersGridRef = useRef<HTMLDivElement>(null);
  const isFirstMount = useRef(true);

  const showNextBanner = () => {
    setActiveBanner((current) => banners.length ? (current + 1) % banners.length : 0);
  };

  const showPreviousBanner = () => {
    setActiveBanner((current) => banners.length ? (current - 1 + banners.length) % banners.length : 0);
  };

  useEffect(() => {
    if (banners.length < 2 || bannerPaused) return;
    const timer = window.setInterval(() => {
      setActiveBanner((current) => (current + 1) % banners.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [banners.length, bannerPaused]);

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
      {/* ─── Hero Section ────────────────────────────────── */}
      <section className="brand-hero brand-hero-market" aria-labelledby="home-hero-title">
        <Image
          src="/hero-local-market.webp"
          alt="سوق محلي يضم متاجر ومطاعم وخدمات متنوعة"
          fill
          priority
          sizes="100vw"
          className="brand-hero-market-image object-cover"
        />
        <span className="brand-hero-market-overlay" aria-hidden="true" />
        <div className="home-container flex h-full items-center">
          <div className="brand-hero-market-copy w-full max-w-[720px] space-y-5 text-center lg:text-right">
          <motion.div 
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#25344A] bg-[#0C1627] px-3 py-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
            <span className="text-xs font-semibold text-[#D7DFEA]">منصة عروض محلية في الزقازيق</span>
          </motion.div>

          <motion.h1
            id="home-hero-title"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="home-hero-title font-bold text-white"
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
            <form onSubmit={handleSearchSubmit} className="home-hero-search relative flex items-center gap-2 rounded-xl border border-[#41516A] bg-[#071426] p-1.5 transition-colors group-focus-within:border-[#FF8A32]">
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
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-[#AEB9C9] hover:bg-white/5 hover:text-white"
                  title="مسح البحث"
                  aria-label="مسح البحث"
                >
                  <RiCloseLine size={18} />
                </button>
              )}

              {/* Action Button */}
              <button 
                type="submit"
                className="min-h-11 flex-shrink-0 rounded-lg bg-[#FF6B00] px-7 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#E85F00]"
              >
                بحث
              </button>
            </form>
          </motion.div>
          <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <label htmlFor="hero-area" className="sr-only">اختر منطقتك</label>
            <div className="home-hero-location flex min-h-11 items-center gap-2 rounded-xl border border-[#41516A] bg-[#071426] px-3">
              <RiMapPin2Fill aria-hidden="true" className="text-[#FF8A32]" />
              <select id="hero-area" value={activeArea} onChange={(event) => setActiveArea(event.target.value)} className="min-w-[150px] bg-transparent text-sm font-medium text-white outline-none">
                {ZAGAZIG_AREAS.map((area) => <option key={area} value={area === 'الكل' ? '' : area}>{area === 'الكل' ? 'كل المناطق' : area}</option>)}
              </select>
            </div>
            <Link prefetch={false} href="/offers" className="home-primary-link inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#FF6B00] px-5 text-sm font-bold text-white hover:bg-[#E85F00]">استكشف العروض <RiArrowLeftLine /></Link>
          </div>
          </div>
        </div>
      </section>

      {error && !loading && (
        <div className="home-container home-api-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => fetchDataRef.current(true)}>إعادة المحاولة</button>
        </div>
      )}

      {/* ─── Categories ───────────────────────────────── */}
      {categories.length > 0 && (
        <section className="home-container home-section" aria-labelledby="home-categories-title">
          <div className="home-section-heading">
            <div>
              <span className="home-section-kicker">اختار اللي يناسبك</span>
              <h2 id="home-categories-title" className="home-section-title">تصفح حسب القسم</h2>
            </div>
            <Link prefetch={false} href="/categories" className="home-section-link">كل الأقسام <RiArrowLeftLine /></Link>
          </div>
          <div className="home-categories-row">
            {categories.slice(0, 8).map((category) => (
              <Link prefetch={false} key={category.id} href={`/offers?category=${category.id}`} className="home-category-link group" aria-label={`عرض قسم ${getCatName(category.name)}`}>
                <CategoryImageCard name={getCatName(category.name)} image={category.image} compact />
              </Link>
            ))}
          </div>
          <div className="home-areas-row" aria-label="تصفية العروض حسب المنطقة">
            <RiMapPin2Fill aria-hidden="true" className="flex-shrink-0 text-[#FF8A32]" />
            {ZAGAZIG_AREAS.map((area) => {
              const isActive = (area === 'الكل' && !activeArea) || activeArea === area;
              return <button key={area} type="button" onClick={(event) => { setActiveArea(area === 'الكل' ? '' : area); scrollActiveIntoView(event); }} className={`home-area-chip ${isActive ? 'is-active' : ''}`}>{area}</button>;
            })}
          </div>
        </section>
      )}

      {/* ─── Offers near the selected area ─────────────── */}
      {activeArea && nearbyOffers.length > 0 && (
        <HomeOffersSection id="nearby-offers" title="عروض قريبة منك" subtitle={`عروض متاحة في ${activeArea}`} offers={nearbyOffers} />
      )}

      {/* ─── Featured advertisements ───────────────────── */}
      {banners.length > 0 && (
        <section
          className="ad-carousel home-container home-section"
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
                key={banners[safeActiveBanner].id}
                href={banners[safeActiveBanner].actionUrl || '/offers'}
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
                {banners[safeActiveBanner].image ? (
                  <Image
                    src={resolveImageUrl(banners[safeActiveBanner].image) ?? '/placeholder-offer.jpg'}
                    alt={getBannerTitle(banners[safeActiveBanner].title)}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-[1.025]"
                    sizes="(max-width: 768px) 100vw, 950px"
                    quality={88}
                    priority={safeActiveBanner === 0}
                  />
                ) : <div className="absolute inset-0 bg-[#162338]" />}
                <span className="ad-carousel-shade" aria-hidden="true" />
                <div className="ad-carousel-copy">
                  {banners[safeActiveBanner].tag && <span className="ad-carousel-tag">{getBannerTag(banners[safeActiveBanner].tag)}</span>}
                  <h3>{getBannerTitle(banners[safeActiveBanner].title)}</h3>
                  {banners[safeActiveBanner].subtitle && <p>{banners[safeActiveBanner].subtitle}</p>}
                  <span className="ad-carousel-action">اكتشف العرض <RiArrowLeftSLine /></span>
                </div>
                {banners.length > 1 && <span className="ad-carousel-count"><b>{String(safeActiveBanner + 1).padStart(2, '0')}</b> / {String(banners.length).padStart(2, '0')}</span>}
              </motion.a>
            </AnimatePresence>

            {banners.length > 1 && (
              <button type="button" className="ad-carousel-preview" onClick={showNextBanner} aria-label={`عرض الإعلان التالي: ${banners[(safeActiveBanner + 1) % banners.length].title}`}>
                {banners[(safeActiveBanner + 1) % banners.length].image && (
                  <Image src={resolveImageUrl(banners[(safeActiveBanner + 1) % banners.length].image) ?? '/placeholder-offer.jpg'} alt="" fill className="object-cover" sizes="320px" />
                )}
                <span className="ad-carousel-preview-shade" />
                <span className="ad-carousel-preview-label">التالي</span>
                <strong>{getBannerTitle(banners[(safeActiveBanner + 1) % banners.length].title)}</strong>
                <RiArrowLeftSLine className="ad-carousel-preview-arrow" />
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

      {/* ─── Featured offers ─────────────────────────────── */}
      <AnimatePresence>
        {!activeCat && !search && recommended.length > 0 && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="home-container home-section">
            <div className="home-section-heading"><div><span className="home-section-kicker">مقترحة لك</span><h2 className="home-section-title">عروض مختارة لك</h2></div></div>
            <div className="home-horizontal-offers">
              {recommended.map((offer) => (
                <div key={offer.id} className="home-horizontal-offer">
                  <OfferCard offer={offer} />
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ─── Latest offers ───────────────────────────────── */}
      <section ref={offersGridRef} className="home-container home-section scroll-mt-24" aria-labelledby="latest-offers-title">
        <div className="home-section-heading flex-wrap">
          <div className="flex items-center gap-3">
            <div className="home-heading-icon"><RiFireFill size={20} /></div>
            <div>
              <span className="home-section-kicker">اتضافت مؤخرًا</span>
              <h2 id="latest-offers-title" className="home-section-title">
                {activeCat ? `عروض ${getCatName(categories.find(c => c.id === activeCat)?.name || '')}` : 'أحدث العروض'}
              </h2>
            </div>
          </div>
          <div className="home-sort-control flex items-center gap-1 rounded-xl border border-[#25344A] bg-[#0D1728] p-1">
            {(['newest', 'expiring', 'discount'] as SortOption[]).map((option) => (
              <button key={option} onClick={() => setSortBy(option)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${sortBy === option ? 'bg-[#FF8A32] text-[#07101F]' : 'text-[#95A3B7] hover:text-white'}`}>
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="home-offers-empty rounded-2xl border border-[#25344A] bg-[#101A2B] py-12 text-center"
          >
            <h3 className="text-lg font-black text-white">للأسف مفيش عروض هنا حالياً</h3>
            <button onClick={() => { setActiveCat(''); setSearch(''); }} className="mt-4 text-[#FF6B00] font-black text-sm hover:underline">عرض كل العروض</button>
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
          <div className="mt-8 text-center">
            <Link 
              prefetch={false}
              href="/offers"
              className="home-primary-link inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#FF6B00] px-6 text-sm font-bold text-white hover:bg-[#E85F00]"
            >
              عرض كل العروض <RiArrowLeftLine />
            </Link>
          </div>
        )}
      </section>

      {/* ─── Featured stores ─────────────────────────────── */}
      {!activeCat && !search && stores.length > 0 && (
        <section className="featured-stores-section home-section" aria-labelledby="featured-stores-title">
          <div className="featured-stores-container">
            <div className="featured-stores-header">
              <div>
                <h2 id="featured-stores-title">متاجر مميزة في الزقازيق</h2>
                <p>اكتشف متاجر موثوقة وعروض قريبة منك</p>
              </div>
              <Link prefetch={false} href="/stores" className="featured-stores-all">عرض كل المتاجر <RiArrowLeftLine /></Link>
            </div>
            <div className="featured-stores-grid">
              {stores.slice(0, 3).map(store => <FeaturedStoreCard key={store.id} store={store} />)}
              {stores.length < 3 && <FeaturedStoresCta />}
            </div>
          </div>
        </section>
      )}

      {/* ─── Ending soon ─────────────────────────────────── */}
      {endingSoonOffers.length > 0 && <HomeOffersSection id="ending-soon" title="عروض تنتهي قريبًا" subtitle="المدة المتبقية محسوبة من تاريخ انتهاء العرض" offers={endingSoonOffers} />}

      {/* ─── How it works ────────────────────────────────── */}
      <section className="home-container home-section" aria-labelledby="how-zag-works">
        <div className="home-section-heading"><div><span className="home-section-kicker">بخطوات بسيطة</span><h2 id="how-zag-works" className="home-section-title">كيف تستخدم زاج؟</h2></div></div>
        <div className="home-steps-grid">
          {[
            ['1', <RiMapPinLine key="map" />, 'اختر منطقتك', 'حدد منطقتك في الزقازيق لتظهر لك العروض القريبة منك.'],
            ['2', <RiCompass3Line key="compass" />, 'اكتشف العرض المناسب', 'تصفح الخصومات والكوبونات المتاحة في المطاعم والمتاجر والخدمات.'],
            ['3', <RiCoupon3Line key="coupon" />, 'احصل على الكوبون', 'احفظ الكوبون واعرض الكود أو QR داخل المتجر.'],
          ].map(([number, icon, title, description]) => (
            <div key={number as string} className="home-step-card">
              <div className="home-step-top"><span className="home-step-icon">{icon}</span><span className="home-step-number">{number}</span></div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>

        <div className="home-merchant-cta">
          <div>
            <h2>عندك متجر في الزقازيق؟</h2>
            <p>أضف متجرك على زاج أوفرز، انشر عروضك ووصل لعملاء قريبين منك.</p>
          </div>
          <Link href="https://vendor.zagoffers.online" target="_blank" className="home-primary-link">سجّل متجرك <RiArrowLeftLine /></Link>
        </div>
      </section>
    </div>
  );
}

function HomeOffersSection({ id, title, subtitle, offers }: { id: string; title: string; subtitle: string; offers: Offer[] }) {
  return (
    <section className="home-container home-section" aria-labelledby={id}>
      <div className="home-section-heading">
        <div>
          <span className="home-section-kicker">{subtitle}</span>
          <h2 id={id} className="home-section-title">{title}</h2>
        </div>
        <Link prefetch={false} href="/offers" className="home-section-link">عرض كل العروض <RiArrowLeftLine /></Link>
      </div>
      <div className="home-offers-grid home-offers-grid-compact">
        {offers.map((offer) => <div key={offer.id} className="content-auto"><OfferCard offer={offer} /></div>)}
      </div>
    </section>
  );
}

function FeaturedStoreCard({ store }: { store: Store }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const logoUrl = !logoFailed ? resolveImageUrl(store.logo) : '';
  const coverUrl = !coverFailed ? resolveImageUrl(store.coverImage) : '';
  const categoryName = store.category?.name ? getCatName(store.category.name) : '';
  return (
    <Link prefetch={false} href={`/stores/${store.id}`} className="featured-store-card group" aria-label={`استكشف متجر ${store.name}`}>
      <div className="featured-store-cover">
        {coverUrl ? (
          <Image src={coverUrl} alt={`غلاف متجر ${store.name}`} fill sizes="(max-width: 640px) 84vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" quality={78} loading="lazy" onError={() => setCoverFailed(true)} />
        ) : (
          <div className="featured-store-cover-fallback" aria-hidden="true">
            <span className="featured-store-pattern pattern-one" />
            <span className="featured-store-pattern pattern-two" />
            <CategoryIcon name={categoryName || store.name} size={38} />
          </div>
        )}
        <div className="featured-store-logo">
          {logoUrl ? <Image src={logoUrl} alt={`شعار ${store.name}`} width={76} height={76} className="h-full w-full object-contain" quality={76} loading="lazy" onError={() => setLogoFailed(true)} /> : <span>{store.name.trim().charAt(0)}</span>}
        </div>
      </div>
      <div className="featured-store-content">
        <h3>{store.name}</h3>
        {(categoryName || store.area) && (
          <div className="featured-store-meta">
            {categoryName && <span>{categoryName}</span>}
            {categoryName && store.area && <i aria-hidden="true">•</i>}
            {store.area && <span><RiMapPin2Fill aria-hidden="true" /> {store.area}</span>}
          </div>
        )}
        <span className="featured-store-action">استكشف المتجر <RiArrowLeftLine /></span>
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
        <h3>اكتشف متاجر أكثر</h3>
        <p>متاجر وخدمات قريبة منك في مكان واحد</p>
        <span>عرض المتاجر <RiArrowLeftLine /></span>
      </div>
    </Link>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#FF6B00] font-black">جاري التحميل...</div>}>
      <HomePageContent />
    </Suspense>
  );
}


