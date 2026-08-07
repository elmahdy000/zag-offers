"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search, Flame, Utensils, Coffee, Shirt, Dumbbell, Sparkles, Hospital, ShoppingCart, BookOpen, Car, Wrench, Layers, X, BadgePercent, MapPin, ArrowUpDown, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { OfferCard, SkeletonCard } from '@/components/offer-card';
import { ErrorDisplay, safeJsonParse } from '@/components/error-display';
import { API_URL, ZAGAZIG_AREAS } from '@/lib/constants';
import { normalizeCategories } from '@/lib/category-utils';
import { useNotifications } from '@/components/notification-provider';
import { extractItems, filterOffers, sortOffers } from '@/lib/catalog-utils';

import { Offer, Category, SortOption } from '@/lib/types';

const AREAS = ZAGAZIG_AREAS;

const CAT_ICONS: Record<string, React.ReactNode> = {
  'مطاعم':         <Utensils size={12} />,
  'كافيهات':       <Coffee size={12} />,
  'ملابس':         <Shirt size={12} />,
  'جيم':           <Dumbbell size={12} />,
  'تجميل':         <Sparkles size={12} />,
  'عيادات':        <Hospital size={12} />,
  'سوبرماركت':    <ShoppingCart size={12} />,
  'دورات':         <BookOpen size={12} />,
  'خدمات سيارات': <Car size={12} />,
  'خدمات محلية':  <Wrench size={12} />,
  'default':       <Sparkles size={12} />,
};

// --- Debounce Hook ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function OffersPageContent() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const pathname      = usePathname();

  const resultsRef = useRef<HTMLDivElement>(null);
  const isFirstMount = useRef(true);

  const scrollActiveIntoView = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  // Reliable scroll helper — waits one animation frame after re-render
  const scrollToResults = (delay = 0) => {
    const run = () => {
      const el = resultsRef.current;
      if (!el) return;
      requestAnimationFrame(() => {
        const top = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      });
    };
    if (delay > 0) setTimeout(run, delay);
    else run();
  };
  
  // Initial values from URL
  const initialCat    = searchParams.get('category') || searchParams.get('categoryId') || '';
  const initialArea   = searchParams.get('area') || '';
  const initialSearch = searchParams.get('q') || '';
  const initialSort   = (searchParams.get('sort') as SortOption) || 'newest';

  const [offers,     setOffers]     = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [search,     setSearch]     = useState(initialSearch);
  const [activeCat,  setActiveCat]  = useState(initialCat);
  const [area,       setArea]       = useState(initialArea);
  const [sort,       setSort]       = useState<SortOption>(initialSort);
  const debouncedSearch = useDebounce(search, 400);

  // Sync state with URL whenever filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (activeCat) params.set('category', activeCat); else params.delete('category');
    if (area) params.set('area', area); else params.delete('area');
    if (search) params.set('q', search); else params.delete('q');
    if (sort !== 'newest') params.set('sort', sort); else params.delete('sort');
    
    // Use replace to avoid polluting history stack with every keystroke
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [activeCat, area, search, sort, pathname, router, searchParams]);

  // Scroll when category / area / sort changes (immediate)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    scrollToResults();
  }, [activeCat, area, sort]);

  // Scroll after search debounce settles — only if user stopped typing
  useEffect(() => {
    if (!debouncedSearch) return;
    const timer = setTimeout(() => {
      const activeEl = document.activeElement as HTMLElement;
      if (activeEl?.tagName !== 'INPUT') {
        scrollToResults();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [debouncedSearch]);

  const [, setIsOffline] = useState(false);
  const { socket } = useNotifications();

  const fetchData = useCallback(async () => {
    const cachedOffers = safeJsonParse<Offer[]>(localStorage.getItem('cache_offers'), []);
    
    if (cachedOffers.length > 0 && offers.length === 0) {
      setOffers(cachedOffers);
      setLoading(false);
    }

    try {
      const [offRes, catRes] = await Promise.all([
        fetch(`${API_URL}/offers?limit=40`, { cache: 'no-store' }),
        fetch(`${API_URL}/offers/categories`, { cache: 'no-store' }),
      ]);
      
      if (offRes.ok) {
        const data = await offRes.json();
        const items = extractItems<Offer>(data);
        setOffers(items);
        localStorage.setItem('cache_offers', JSON.stringify(items));
        setIsOffline(false);
      }
      if (catRes.ok) {
        const catsRaw = await catRes.json();
        const cats = normalizeCategories(catsRaw);
        setCategories(cats);
      } else {
        setCategories([]);
      }
      setError(null);
    } catch (e) { 
      console.error('Fetch error (possibly offline):', e); 
      setIsOffline(true);
      setCategories([]);
      if (!cachedOffers.length) {
        setError('فشل تحميل العروض. يرجى التأكد من اتصالك بالإنترنت.');
      }
    } finally { 
      setLoading(false); 
    }
  }, [offers.length]);

  useEffect(() => {
    const timer = window.setTimeout(() => fetchData(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  useEffect(() => {
    if (!socket) return;

    const handleCategoriesUpdated = () => {
      localStorage.removeItem('cache_offers');
      fetchData();
    };

    socket.on('categories_updated', handleCategoriesUpdated);
    socket.on('offers_updated', handleCategoriesUpdated);
    socket.on('new_offer', handleCategoriesUpdated);
    return () => {
      socket.off('categories_updated', handleCategoriesUpdated);
      socket.off('offers_updated', handleCategoriesUpdated);
      socket.off('new_offer', handleCategoriesUpdated);
    };
  }, [socket, fetchData]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); fetchData(); };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchData]);

  const filtered = useMemo(() => {
    return sortOffers(filterOffers(offers, {
      query: debouncedSearch,
      categoryId: activeCat,
      area,
      activeOnly: true,
    }), sort);
  }, [offers, debouncedSearch, activeCat, area, sort]);

  const grouped = useMemo(() => {
    const groups: Record<string, Offer[]> = {};
    filtered.forEach(o => {
      const catName = o.store?.category?.name || 'عروض أخرى';
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(o);
    });
    return groups;
  }, [filtered]);

  return (
    <div className="offers-page pb-16" dir="rtl">
      <section className="offers-hero">
        <div className="site-container offers-hero-inner">
          <div className="offers-hero-copy">
            <div className="offers-kicker"><Flame size={15} /> عروض حقيقية تتجدد كل يوم</div>
            <h1>اكتشف عرضك القادم</h1>
            <p>خصومات مختارة من أفضل المتاجر والخدمات في الزقازيق، في تجربة أسرع وأسهل.</p>
            <div className="offers-trust-row">
              <span><CheckCircle2 size={15} /> عروض موثوقة</span>
              <span><MapPin size={15} /> قريبة منك</span>
              <span><BadgePercent size={15} /> خصومات حصرية</span>
            </div>
          </div>
          <div className="offers-hero-art" aria-hidden="true">
            <div className="offers-ticket">
              <span className="offers-ticket-label">ZAG DEALS</span>
              <BadgePercent size={54} />
              <b>خصم يستاهل</b>
              <small>اختار • وفّر • استمتع</small>
            </div>
          </div>
        </div>
      </section>
      <div className="site-container offers-content">

      {/* ─── Filters Card ────────────────────────────────── */}
      <div className="offers-filter-panel">
        <div className="offers-filter-heading">
          <div><SlidersHorizontal size={18} /><span>اعثر على العرض المناسب</span></div>
          <small>فلترة ذكية وسريعة</small>
        </div>

        {/* Search */}
        <div className="relative offers-search">
          <Search
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A] pointer-events-none"
            size={16}
          />
          <input
            type="text"
            placeholder="ابحث بالاسم أو المحل أو المنطقة أو الصنف..."
            className="w-full bg-[#0B1526] border border-[#25344A] rounded-xl
                       pr-11 pl-11 py-3.5 text-sm font-bold text-[#F0F0F0]
                       placeholder:text-[#9A9A9A] outline-none
                       focus:border-[#FF6B00] focus:shadow-[0_0_0_3px_rgba(255,107,0,0.15)]
                       transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9A9A] hover:text-white transition-colors p-0.5 rounded-full hover:bg-white/10"
              title="مسح البحث"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Category Ribbon */}
        <div className="offers-category-ribbon no-scrollbar">
          <button
            onClick={(e) => { setActiveCat(''); scrollActiveIntoView(e); }}
            className={`offers-category-chip ${
              !activeCat 
              ? 'is-active' 
              : ''
            }`}
          >
            <Layers size={12} /> الكل
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={(e) => { setActiveCat(cat.id); scrollActiveIntoView(e); }}
              className={`offers-category-chip ${
                activeCat === cat.id 
                ? 'is-active' 
                : ''
              }`}
            >
              {CAT_ICONS[cat.name] || CAT_ICONS.default} {cat.name}
            </button>
          ))}
        </div>

        {/* Filters Grid */}
        <div className="offers-select-grid">
          <label className="offers-select-wrap"><MapPin size={16} /><span>المنطقة</span><select
            className="w-full bg-[#0B1526] border border-[#25344A] rounded-xl
                       pr-3.5 py-2.5 text-xs font-bold text-[#F0F0F0] cursor-pointer outline-none
                       focus:border-[#FF6B00] transition-all appearance-none"
            value={area}
            onChange={e => setArea(e.target.value)}
          >
            <option value="">كل المناطق</option>
            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select></label>

          <label className="offers-select-wrap"><ArrowUpDown size={16} /><span>الترتيب</span><select
            className="flex-1 min-w-[160px] bg-[#0B1526] border border-[#25344A] rounded-xl
                       pr-3.5 py-2.5 text-xs font-bold text-[#F0F0F0] cursor-pointer outline-none
                       focus:border-[#FF6B00] transition-all appearance-none"
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
          >
            <option value="newest">الأحدث أولاً</option>
            <option value="expiring">ينتهي قريباً</option>
            <option value="discount">أعلى خصم</option>
          </select></label>
        </div>
      </div>

      {/* ─── Results Bar ─────────────────────────────────── */}
      {!loading && (
        <div className="offers-results-bar">
          <p><span className="offers-result-count">{filtered.length}</span><span>عرض متاح لك الآن</span>
          </p>
          {(search || activeCat || area) && (
            <button
              onClick={() => { setSearch(''); setActiveCat(''); setArea(''); }}
              className="offers-clear-button"
            >
              مسح الفلاتر
            </button>
          )}
        </div>
      )}

      {/* ─── Grouped Content ─────────────────────────────── */}
      <div ref={resultsRef} className="scroll-mt-20" />
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorDisplay message={error} onRetry={fetchData} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1B2940] text-[#FF8A32]"><Search size={24} /></div>
          <h3 className="text-base font-bold">لا توجد عروض تطابق بحثك</h3>
          <p className="text-xs text-[#9A9A9A] max-w-xs leading-relaxed">
            جرّب تغيير كلمة البحث أو تحديد فلاتر مختلفة
          </p>
        </div>
      ) : (
        /* Render Grouped by Category */
        <div className="space-y-10">
          {Object.entries(grouped).map(([categoryName, categoryOffers]) => (
            <div key={categoryName} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Category Header */}
              <div className="offers-group-header">
                <div className="offers-group-icon">
                  {CAT_ICONS[categoryName] || <Layers size={13} />}
                </div>
                <h2>{categoryName}</h2>
                <div className="h-px flex-1 bg-white/[0.04]" />
                <span className="offers-group-count">
                  {categoryOffers.length}
                </span>
              </div>

              {/* Offers Grid for this category */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {categoryOffers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

export default function OffersListingPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-[#9A9A9A] font-bold">
        جاري تهيئة العروض...
      </div>
    }>
      <OffersPageContent />
    </Suspense>
  );
}


