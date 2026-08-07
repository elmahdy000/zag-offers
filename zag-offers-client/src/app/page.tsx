"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiSearch2Line, RiFireFill, RiSparkling2Fill, 
  RiStore3Fill, RiArrowUpDownLine, RiMapPin2Fill,
  RiCloseLine
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
import { CategoryIcon } from '@/components/category-icon';
import { BrandMark } from '@/components/brand-mark';

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
      const t = Date.now();
      const responses = await Promise.all([
        fetch(`${API_URL}/offers?limit=24&_t=${t}`, { cache: 'no-store' }),
        fetch(`${API_URL}/offers/categories?_t=${t}`, { cache: 'no-store' }),
        fetch(`${API_URL}/stores?limit=12&_t=${t}`, { cache: 'no-store' }),
        fetch(`${API_URL}/recommendations?_t=${t}`, { cache: 'no-store' }),
        fetch(`${API_URL}/offers/banners?_t=${t}`, { cache: 'no-store' })
      ]);

      for (const res of responses) {
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${res.url}`);
      }

      const [oData, cData, sData, rData, bData] = await Promise.all([
        responses[0].json(), responses[1].json(), responses[2].json(), responses[3].json(), responses[4].json()
      ]);

      const normalizedCats = normalizeCategories(cData);

      const offerItems = extractItems<Offer>(oData);
      const storeItems = extractItems<Store>(sData);
      const recommendationItems = extractItems<Offer>(rData);

      setOffers(offerItems);
      setCategories(normalizedCats);
      setStores(storeItems);
      setRecommended(recommendationItems);
      setBanners(Array.isArray(bData) ? bData : []);
      
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

  // Polling fallback when socket is not connected
  useEffect(() => {
    if (isConnected) return;
    if (!navigator.onLine) return;

    const interval = setInterval(() => {
      fetchDataRef.current(true);
    }, 30000);

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
      <section className="brand-hero border-b border-[#25344A] px-4 py-10 sm:py-14">
        <div className="site-container grid min-h-[360px] items-center gap-7 lg:grid-cols-[1.15fr_.85fr] lg:gap-12">
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
            className="text-[34px] font-bold leading-[1.25] tracking-tight text-white sm:text-[46px]"
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
            <Link href="/offers" className="rounded-xl bg-[#FF8A32] px-5 py-2.5 text-sm font-bold text-[#07101F] hover:bg-[#FF9B4F]">استكشف العروض ←</Link>
            <Link href="/stores" className="rounded-xl border border-[#34445B] px-5 py-2.5 text-sm font-bold text-white hover:border-[#FF8A32]">تصفح المتاجر</Link>
          </div>
          </div>

          <motion.div
            initial={false}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="brand-hero-mark relative mx-auto hidden h-[330px] w-full max-w-[430px] lg:block"
          >
            <span className="brand-orbit brand-orbit-one" />
            <span className="brand-orbit brand-orbit-two" />
            <BrandMark priority className="relative z-10 h-full w-full p-3 drop-shadow-[0_24px_30px_rgba(0,0,0,.3)]" />
            <span className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-[#071426]/80 px-5 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md">
              <span className="text-[#FF6500]">zag offers</span> · عروض قريبة منك
            </span>
          </motion.div>
        </div>
      </section>

      {/* ─── Banners Carousel ──────────────────────────── */}
      {banners.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mt-8 mb-8">
          <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {banners.map((banner) => (
              <a
                key={banner.id}
                href={banner.actionUrl || '#'}
                className="group relative flex-shrink-0 w-[85vw] sm:w-[500px] h-[160px] sm:h-[200px] rounded-[2rem] overflow-hidden border border-white/5 bg-[#252525] transition-all duration-500 hover:border-[#FF6B00]/30"
              >
                {banner.image ? (
                  <Image
                    src={resolveImageUrl(banner.image) ?? '/placeholder-offer.jpg'}
                    alt={banner.title}
                    fill
                    className="object-cover transition-all duration-700 group-hover:scale-105"
                    sizes="(max-width: 640px) 85vw, 500px"
                    quality={85}
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#162338]" />
                )}
                <div className="absolute inset-0 bg-black/35" />
                {banner.tag && (
                  <span className="absolute top-3 right-3 px-3 py-1 bg-[#FF6B00] text-white text-[10px] font-black rounded-full">
                    {banner.tag}
                  </span>
                )}
                <div className="absolute bottom-4 right-4 left-4">
                  <h3 className="text-white text-base sm:text-lg font-black">{banner.title}</h3>
                  {banner.subtitle && (
                    <p className="text-white/70 text-xs sm:text-sm font-semibold mt-1">{banner.subtitle}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ─── Categories & Areas Filter ──────────────────────────── */}
      <section className="site-container mb-12 mt-9">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white sm:text-2xl">تصفح حسب القسم</h2>
          <Link href="/categories" className="text-sm font-semibold text-[#FF8A32] hover:text-[#FFAC6E]">كل الأقسام ←</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.slice(0, 6).map((category) => (
            <Link key={category.id} href={`/offers?category=${category.id}`} className="global-card group flex h-44 flex-col items-center justify-center rounded-[20px] border border-[#25344A] bg-[#101A2B] p-5 text-center transition-all hover:-translate-y-1 hover:border-[#FF8A32]/70">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#1B2940] text-[#FF8A32] group-hover:scale-110">
                <CategoryIcon name={category.name} size={23} />
              </span>
              <span className="text-base font-bold text-white">{getCatName(category.name)}</span>
              <span className="mt-2 text-sm text-[#91A0B6]">اكتشف العروض</span>
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
            <Link href="/stores" className="text-xs font-black text-[#FF6B00] bg-[#FF6B00]/10 px-4 py-2 rounded-full hover:bg-[#FF6B00] hover:text-white transition-all">كل المتاجر</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {stores.slice(0, 12).map(store => (
              <Link key={store.id} href={`/stores/${store.id}`} className="group">
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
                  <OfferCard offer={offer} priority={i < 2} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {!loading && filteredOffers.length >= 24 && (
          <div className="mt-20 text-center">
            <Link 
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


