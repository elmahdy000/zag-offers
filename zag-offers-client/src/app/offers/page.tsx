"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search, Flame, Utensils, Coffee, Shirt, Dumbbell, Sparkles, Hospital, ShoppingCart, BookOpen, Car, Wrench, Layers, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OfferCard, SkeletonCard } from '@/components/offer-card';
import { ErrorDisplay, safeJsonParse } from '@/components/error-display';
import { API_URL, ZAGAZIG_AREAS } from '@/lib/constants';
import { normalizeCategories } from '@/lib/category-utils';
import { usePublicSocket } from '@/lib/socket';

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

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    // Scroll to results list smoothly when filters change
    if (activeCat || area || debouncedSearch || sort !== 'newest') {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeCat, area, debouncedSearch, sort]);

  const [isOffline, setIsOffline] = useState(false);
  const { socket } = usePublicSocket();

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
        const items = Array.isArray(data) ? data : (data.items || []);
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

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!socket) return;

    const handleCategoriesUpdated = () => {
      localStorage.removeItem('cache_offers');
      fetchData();
    };

    socket.on('categories_updated', handleCategoriesUpdated);
    return () => {
      socket.off('categories_updated', handleCategoriesUpdated);
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
    let list = offers.filter(o => {
      const q = normalizeArabic(debouncedSearch);
      const matchSearch = !q
        || normalizeArabic(o.title || '').includes(q)
        || normalizeArabic(o.description || '').includes(q)
        || normalizeArabic(o.store?.name || '').includes(q)
        || normalizeArabic(o.store?.area || '').includes(q)
        || normalizeArabic(o.store?.category?.name || '').includes(q);
      const matchCat  = activeCat ? (o.store?.category?.id === activeCat || o.store?.categoryId === activeCat) : true;
      const matchArea = area ? o.store?.area === area : true;
      return matchSearch && matchCat && matchArea;
    });

    if (sort === 'expiring') {
      list = [...list].sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    } else if (sort === 'discount') {
      const getVal = (d: string) => parseInt(d?.replace(/[^0-9]/g, '') || '0');
      list = [...list].sort((a, b) => getVal(b.discount) - getVal(a.discount));
    } else {
      list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
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
    <div className="max-w-7xl mx-auto px-4 py-6" dir="rtl">

      {/* ─── Page Title ──────────────────────────────────── */}
      <div className="mb-5 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#FF6B00]/10 rounded-xl flex items-center justify-center text-[#FF6B00]">
            <Flame size={19} />
          </div>
          استكشف العروض
        </h1>
        <p className="text-[#9A9A9A] text-[11px] sm:text-xs font-bold mt-1.5">
          عروض حية ومعتمدة من أفضل المحلات في الزقازيق
        </p>
      </div>

      {/* ─── Filters Card ────────────────────────────────── */}
      <div className="bg-[#252525] border border-white/[0.07] rounded-2xl p-4 mb-6 space-y-3">

        {/* Search */}
        <div className="relative">
          <Search
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A] pointer-events-none"
            size={16}
          />
          <input
            type="text"
            placeholder="ابحث بالاسم أو المحل أو المنطقة أو الصنف..."
            className="w-full bg-[#1E1E1E] border border-white/[0.07] rounded-xl
                       pr-10 pl-10 py-2.5 text-sm font-bold text-[#F0F0F0]
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
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth -mx-0.5 px-0.5">
          <button
            onClick={(e) => { setActiveCat(''); scrollActiveIntoView(e); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl whitespace-nowrap font-black transition-all text-[11px] sm:text-xs ${
              !activeCat 
              ? 'bg-[#FF6B00] text-white shadow-lg shadow-[#FF6B00]/20' 
              : 'bg-[#252525] text-white/60 hover:bg-[#252525] hover:text-white border border-white/5'
            }`}
          >
            <Layers size={12} /> الكل
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={(e) => { setActiveCat(cat.id); scrollActiveIntoView(e); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl whitespace-nowrap font-black transition-all text-[11px] sm:text-xs ${
                activeCat === cat.id 
                ? 'bg-[#FF6B00] text-white shadow-lg shadow-[#FF6B00]/20' 
                : 'bg-[#252525] text-white/60 hover:bg-[#252525] hover:text-white border border-white/5'
              }`}
            >
              {CAT_ICONS[cat.name] || CAT_ICONS.default} {cat.name}
            </button>
          ))}
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select
            className="w-full bg-[#1E1E1E] border border-white/[0.07] rounded-xl
                       pr-3.5 py-2.5 text-xs font-bold text-[#F0F0F0] cursor-pointer outline-none
                       focus:border-[#FF6B00] transition-all appearance-none"
            value={area}
            onChange={e => setArea(e.target.value)}
          >
            <option value="">📍 كل المناطق</option>
            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select
            className="flex-1 min-w-[160px] bg-[#1E1E1E] border border-white/[0.07] rounded-xl
                       pr-3.5 py-2.5 text-xs font-bold text-[#F0F0F0] cursor-pointer outline-none
                       focus:border-[#FF6B00] transition-all appearance-none"
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
          >
            <option value="newest">🕐 الأحدث أولاً</option>
            <option value="expiring">⏰ ينتهي قريباً</option>
            <option value="discount">💰 أعلى خصم</option>
          </select>
        </div>
      </div>

      {/* ─── Results Bar ─────────────────────────────────── */}
      {!loading && (
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs font-semibold text-[#9A9A9A]">
            وجدنا <span className="text-[#F0F0F0] font-bold">{filtered.length}</span> عرض متاح
          </p>
          {(search || activeCat || area) && (
            <button
              onClick={() => { setSearch(''); setActiveCat(''); setArea(''); }}
              className="text-[11px] font-bold text-[#FF6B00] hover:underline"
            >
              ✕ مسح الفلاتر
            </button>
          )}
        </div>
      )}

      {/* ─── Grouped Content ─────────────────────────────── */}
      <div ref={resultsRef} className="scroll-mt-20" />
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorDisplay message={error} onRetry={fetchData} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3 text-center">
          <div className="w-16 h-16 bg-[#252525] rounded-full flex items-center justify-center text-2xl">🔍</div>
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
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 bg-[#FF6B00]/10 rounded-lg flex items-center justify-center text-[#FF6B00]">
                  {CAT_ICONS[categoryName] || <Layers size={13} />}
                </div>
                <h2 className="text-sm sm:text-base font-black text-[#F0F0F0]">{categoryName}</h2>
                <div className="h-px flex-1 bg-white/[0.04]" />
                <span className="text-[8px] font-black text-[#9A9A9A] uppercase tracking-wider bg-white/[0.02] px-2.5 py-0.5 rounded-full border border-white/[0.05]">
                  {categoryOffers.length}
                </span>
              </div>

              {/* Offers Grid for this category */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
                {categoryOffers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
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


