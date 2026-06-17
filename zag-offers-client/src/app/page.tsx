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
import { useSearchParams } from 'next/navigation';
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

import { Offer, Category, Store, Banner, SortOption } from '@/lib/types';
import { API_URL, CAT_ASSETS, DISPLAY_NAMES, ZAGAZIG_AREAS } from '@/lib/constants';
import { normalizeCategories } from '@/lib/category-utils';
import { usePublicSocket } from '@/lib/socket';

const getCatName = (name: string) => DISPLAY_NAMES[name] || name;

const normalizeArabic = (str: string) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[\u064B-\u0652]/g, '');
};



const CACHE_KEY = 'zag_offers_home_cache_v4';
const CACHE_DURATION = 5 * 60 * 1000;

function HomePageContent() {
  const searchParams = useSearchParams();
  const catIdParam = searchParams.get('category');

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
  }, [activeCat, activeArea]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll after search debounce settles — only if user stopped typing
  useEffect(() => {
    if (!debouncedSearch) return;
    const timer = setTimeout(() => {
      if (document.activeElement !== searchInputRef.current) {
        scrollToGrid();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const { trackEvent } = useAnalytics();

  const [isOffline, setIsOffline] = useState(false);
  const { socket, isConnected } = usePublicSocket();

  const fetchData = useCallback(async (force = false) => {
    // Try to load from cache first
    const cachedData = localStorage.getItem(CACHE_KEY);
    let hasFreshCache = false;

    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        const age = Date.now() - (parsed.timestamp || 0);
        if (age > CACHE_DURATION) {
          localStorage.removeItem(CACHE_KEY);
        } else {
          hasFreshCache = true;
          if (offers.length === 0) {
            setOffers(parsed.offers || []);
            setCategories(parsed.categories || []);
            setStores(parsed.stores || []);
            setRecommended(parsed.recommended || []);
            setBanners(parsed.banners || []);
            setLoading(false);
          }
        }
      } catch (e) {
        console.error('Error parsing cache:', e);
      }
    }

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

      setOffers(oData);
      setCategories(normalizedCats);
      setStores(sData);
      setRecommended(rData);
      setBanners(Array.isArray(bData) ? bData : []);
      
      // Save to cache
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        offers: oData,
        categories: normalizedCats,
        stores: sData,
        recommended: rData,
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
  }, [offers.length]);

  // Stable ref so socket/polling/online handlers never get stale closures
  const fetchDataRef = useRef(fetchData);
  fetchDataRef.current = fetchData;

  useEffect(() => { fetchDataRef.current(); }, []);

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
    return () => {
      socket.off('categories_updated', handleCategoriesUpdated);
      socket.off('banners_updated', handleBannersUpdated);
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
    let result = [...offers];
    const now = Date.now();
    result = result.filter(o => {
      const end = o.endDate ? new Date(o.endDate).getTime() : 0;
      return end > now;
    });

    if (activeCat) {
      result = result.filter(o => o.store.categoryId === activeCat || o.store.category?.id === activeCat);
    }

    if (activeArea) {
      result = result.filter(o => o.store.area === activeArea);
    }

    if (debouncedSearch) {
      const q = normalizeArabic(debouncedSearch);
      result = result.filter(o => {
        const title = normalizeArabic(o.title || '');
        const desc = normalizeArabic(o.description || '');
        const storeName = normalizeArabic(o.store?.name || '');
        const areaName = normalizeArabic(o.store?.area || '');
        const catName = normalizeArabic(getCatName(o.store?.category?.name || ''));
        
        return (
          title.includes(q) ||
          desc.includes(q) ||
          storeName.includes(q) ||
          areaName.includes(q) ||
          catName.includes(q)
        );
      });
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
    <div className="relative pb-24 overflow-x-hidden bg-[#1A1A1A]" dir="rtl">
      
      {/* ─── Premium Background Blobs ─────────────────────── */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF6B00]/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3 -z-10" />
      <div className="absolute top-[20%] left-0 w-[400px] h-[400px] bg-[#D95A00]/5 blur-[100px] rounded-full -translate-x-1/2 -z-10" />

      {/* ─── Hero Section ────────────────────────────────── */}
      <section className="pt-10 sm:pt-16 pb-12 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-full"
          >
            <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
            <span className="text-[11px] sm:text-xs font-black text-[#FF6B00] uppercase tracking-wider">عروض الزقازيق الحصرية</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight"
          >
            <span className="text-[#F0F0F0]">أفضل</span> <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#FF6B00] via-[#FF8C35] to-[#FFA15A]">العروض والخصومات في</span> <span className="text-white">زاج</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[#9A9A9A] text-[11px] sm:text-sm font-semibold max-w-xl mx-auto leading-relaxed"
          >
            بوابتك لأفضل كوبونات الخصم والعروض المباشرة من أقوى محلات ومطاعم مدينتك.
          </motion.p>

          {/* Search Box - Premium Style */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-xl mx-auto relative group"
          >
            {/* Pulsing Aura */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#FF6B00] via-[#FF8C35] to-[#FFA15A] rounded-[2.5rem] blur-xl opacity-0 group-focus-within:opacity-20 transition-all duration-700 animate-pulse" />
            
            <div className="relative flex items-center bg-[#1E1E1E]/95 backdrop-blur-3xl border border-white/5 p-1.5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 group-focus-within:border-[#FF6B00]/40">
              {/* Search Icon */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 mx-1 flex-shrink-0">
                <RiSearch2Line className="text-[#FF6B00]" size={20} />
              </div>

              {/* Text Input */}
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="ابحث مباشرة عن عرض، محل، أو صنف..."
                className="no-focus-ring flex-1 bg-transparent py-2.5 text-xs sm:text-sm font-semibold text-white placeholder:text-[#9A9A9A]/30 border-0 focus:ring-0 focus:border-0 outline-none pr-3 pl-2"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {/* Clear button (appears only when text is entered) */}
              {search && (
                <button 
                  onClick={() => { setSearch(''); searchInputRef.current?.focus(); }}
                  className="p-1.5 ml-1 rounded-full hover:bg-white/5 text-[#9A9A9A] hover:text-white transition-all duration-200"
                  title="مسح البحث"
                >
                  <RiCloseLine size={18} />
                </button>
              )}

              {/* Keyboard Shortcut Hint */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl ml-2 text-[9px] font-black text-[#5A5A5A] uppercase tracking-wider select-none flex-shrink-0">
                <span>CTRL</span>
                <span>K</span>
              </div>

              {/* Action Button */}
              <button 
                onClick={() => searchInputRef.current?.blur()}
                className="px-6 py-2.5 bg-gradient-to-r from-[#FF6B00] to-[#D95A00] text-white font-bold text-[11px] rounded-[1.5rem] hover:scale-105 active:scale-95 transition-all shadow-[0_8px_16px_rgba(255,107,0,0.2)] flex-shrink-0"
              >
                بحث
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Banners Carousel ──────────────────────────── */}
      {banners.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-10">
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
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B00]/20 to-[#D95A00]/10" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
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
      <section className="max-w-7xl mx-auto px-4 mb-12">
        <div className="flex flex-col gap-8">
          
          {/* Categories Row */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#FF6B00] rounded-full" />
                <h2 className="text-lg sm:text-xl font-black text-white">الأقسام</h2>
              </div>
              <div className="flex items-center gap-1.5 bg-white/[0.02] border border-white/5 p-1 rounded-xl">
                {(['newest', 'expiring', 'discount'] as SortOption[]).map((option) => {
                  const label = option === 'newest' ? 'الأحدث' : option === 'expiring' ? 'ينتهي قريباً' : 'الأعلى خصماً';
                  const icon = option === 'newest' ? '📅' : option === 'expiring' ? '⏰' : '💰';
                  return (
                    <button
                      key={option}
                      onClick={() => setSortBy(option)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1.5
                        ${sortBy === option 
                          ? 'bg-gradient-to-r from-[#FF6B00] to-[#D95A00] text-white shadow-[0_4px_12px_rgba(255,107,0,0.25)]' 
                          : 'text-[#9A9A9A] hover:text-white hover:bg-white/5'}`}
                    >
                      <span>{icon}</span>
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              <Link 
                href="/offers"
                className={`flex-shrink-0 group relative w-24 sm:w-28 aspect-[4/5] rounded-[2rem] overflow-hidden border transition-all duration-500
                  ${!activeCat 
                    ? 'border-[#FF6B00]/40 bg-gradient-to-br from-[#FF6B00]/25 to-[#D95A00]/5 shadow-[0_10px_30px_rgba(255,107,0,0.15)]' 
                    : 'border-white/5 bg-[#252525] opacity-80 hover:opacity-100 hover:border-[#FF6B00]/30 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(255,107,0,0.1)]'}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B00]/10 to-transparent opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                  <div className={`p-2 rounded-xl mb-1 bg-white/5 transition-all duration-300 ${!activeCat ? 'bg-[#FF6B00]/25 text-[#FF6B00] scale-110' : 'text-white/40 group-hover:text-white group-hover:scale-110'}`}>
                    <RiSparkling2Fill size={18} />
                  </div>
                  <span className={`text-[10px] sm:text-xs font-bold tracking-wider transition-all duration-300 ${!activeCat ? 'text-[#FF6B00] font-black' : 'text-white/40 group-hover:text-white'}`}>الكل</span>
                  {!activeCat && <div className="absolute bottom-3 w-1.5 h-1.5 bg-[#FF6B00] rounded-full shadow-[0_0_8px_#FF6B00]" />}
                </div>
              </Link>

              {categories.map((c, idx) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                >
                  <Link 
                    href={`/offers?category=${c.id}`}
                    className={`flex-shrink-0 group relative block w-24 sm:w-28 aspect-[4/5] rounded-[2rem] overflow-hidden border transition-all duration-500
                      ${activeCat === c.id 
                        ? 'border-[#FF6B00]/40 bg-[#FF6B00]/10 shadow-[0_10px_30px_rgba(255,107,0,0.2)] scale-105' 
                        : 'border-white/5 bg-[#252525] opacity-80 hover:opacity-100 hover:border-[#FF6B00]/30 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(255,107,0,0.1)]'}`}
                  >
                    <div className="absolute inset-0 bg-[#151515]">
                      <Image 
                        src={c.image ? resolveImageUrl(c.image)! : (c.icon ? resolveImageUrl(c.icon)! : (CAT_ASSETS[c.name] || CAT_ASSETS.default))} 
                        alt={c.name} 
                        fill
                        className={`object-cover transition-all duration-700 ${activeCat === c.id ? 'scale-110 blur-[1px]' : 'group-hover:scale-110'}`} 
                        sizes="(max-width: 640px) 112px, 128px"
                        quality={70}
                      />
                    </div>
                    <div className={`absolute inset-0 bg-gradient-to-t transition-all duration-500 ${activeCat === c.id ? 'from-[#FF6B00]/60 via-[#FF6B00]/10 to-transparent' : 'from-black/90 via-black/30 to-transparent'}`} />
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-5 z-20">
                      <span className={`text-[9px] sm:text-[10px] font-bold tracking-widest transition-all duration-300 ${activeCat === c.id ? 'text-white scale-110' : 'text-white/70 group-hover:text-white'}`}>
                        {getCatName(c.name)}
                      </span>
                      {activeCat === c.id && <div className="absolute bottom-2.5 w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white]" />}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Areas Row */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-[#E0E0E0] mr-1">
              <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center text-[#FF6B00]">
                <RiMapPin2Fill size={16} />
              </div>
              <span className="text-xs sm:text-sm font-bold">تصفح العروض حسب المنطقة في الزقازيق:</span>
            </div>
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
              {ZAGAZIG_AREAS.map((area) => {
                const isActive = (area === 'الكل' && !activeArea) || activeArea === area;
                return (
                  <button
                    key={area}
                    onClick={(e) => {
                      setActiveArea(area === 'الكل' ? '' : area);
                      scrollActiveIntoView(e);
                    }}
                    className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 border
                      ${isActive
                        ? 'bg-gradient-to-r from-[#FF6B00] to-[#D95A00] text-white border-[#FF6B00]/30 shadow-[0_8px_20px_rgba(255,107,0,0.2)] hover:shadow-[0_10px_25px_rgba(255,107,0,0.35)] -translate-y-0.5'
                        : 'bg-white/[0.03] backdrop-blur-md text-[#9A9A9A] border-white/5 hover:text-white hover:bg-white/[0.08] hover:-translate-y-0.5'}`}
                  >
                    {area}
                  </button>
                );
              })}
            </div>
          </div>

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
            <h2 className="text-lg sm:text-xl font-black text-white">براندات بنحبها</h2>
            <Link href="/stores" className="text-xs font-black text-[#FF6B00] bg-[#FF6B00]/10 px-4 py-2 rounded-full hover:bg-[#FF6B00] hover:text-white transition-all">كل المتاجر</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {stores.slice(0, 12).map(store => (
              <Link key={store.id} href={`/stores/${store.id}`} className="group">
                <div className="bg-white/[0.03] backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center space-y-3 hover:border-[#FF6B00]/30 hover:bg-gradient-to-b hover:from-[#FF6B00]/5 hover:to-transparent hover:shadow-[0_10px_25px_rgba(255,107,0,0.05)] hover:-translate-y-0.5 transition-all duration-300">
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
      <section ref={offersGridRef} className="max-w-7xl mx-auto px-4 scroll-mt-24">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF6B00]/10 rounded-xl flex items-center justify-center text-[#FF6B00]">
              <RiFireFill size={20} />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              {activeCat ? `عروض ${getCatName(categories.find(c => c.id === activeCat)?.name || '')}` : 'أحدث العروض'}
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
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
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
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


