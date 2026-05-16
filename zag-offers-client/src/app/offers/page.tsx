"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search, Flame, Utensils, Coffee, Shirt, Dumbbell, Sparkles, Hospital, ShoppingCart, BookOpen, Car, Wrench, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OfferCard, SkeletonCard } from '@/components/offer-card';
import { API_URL, DISPLAY_NAMES, ZAGAZIG_AREAS } from '@/lib/constants';

import { Offer, Category, SortOption } from '@/lib/types';

const AREAS = ZAGAZIG_AREAS;

const CAT_ICONS: Record<string, React.ReactNode> = {
  'مطاعم':         <Utensils size={14} />,
  'كافيهات':       <Coffee size={14} />,
  'ملابس':         <Shirt size={14} />,
  'جيم':           <Dumbbell size={14} />,
  'تجميل':         <Sparkles size={14} />,
  'عيادات':        <Hospital size={14} />,
  'سوبرماركت':    <ShoppingCart size={14} />,
  'دورات':         <BookOpen size={14} />,
  'خدمات سيارات': <Car size={14} />,
  'خدمات محلية':  <Wrench size={14} />,
  'default':       <Sparkles size={14} />,
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
  
  // Initial values from URL
  const initialCat    = searchParams.get('category') || searchParams.get('categoryId') || '';
  const initialArea   = searchParams.get('area') || '';
  const initialSearch = searchParams.get('q') || '';
  const initialSort   = (searchParams.get('sort') as SortOption) || 'newest';

  const [offers,     setOffers]     = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
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

  const [isOffline, setIsOffline] = useState(false);

  const fetchData = useCallback(async () => {
    // Try to load from cache first for instant view
    const cachedOffers = localStorage.getItem('cache_offers');
    const cachedCats = localStorage.getItem('cache_categories');
    
    if (cachedOffers && offers.length === 0) {
      setOffers(JSON.parse(cachedOffers));
      setLoading(false); // Hide initial loader if we have cache
    }
    if (cachedCats && categories.length === 0) {
      setCategories(JSON.parse(cachedCats));
    }

    try {
      const [offRes, catRes] = await Promise.all([
        fetch(`${API_URL}/offers?limit=40`, { cache: 'no-store' }),
        fetch(`${API_URL}/stores/categories`, { cache: 'no-store' }),
      ]);
      
      if (offRes.ok) {
        const data = await offRes.json();
        const items = Array.isArray(data) ? data : (data.items || []);
        setOffers(items);
        localStorage.setItem('cache_offers', JSON.stringify(items));
        setIsOffline(false);
      }
      if (catRes.ok) {
        const cats = await catRes.json();
        const filteredCats = cats.filter((c: Category) => c.name !== 'عيادات');
        setCategories(filteredCats);
        localStorage.setItem('cache_categories', JSON.stringify(filteredCats));
      }
    } catch (e) { 
      console.error('Fetch error (possibly offline):', e); 
      setIsOffline(true);
    } finally { 
      setLoading(false); 
    }
  }, [offers.length, categories.length]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
      const q = debouncedSearch.toLowerCase();
      const matchSearch = !q
        || o.title.toLowerCase().includes(q)
        || o.store?.name?.toLowerCase().includes(q);
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
  }, [offers, search, activeCat, area, sort]);

  const grouped = useMemo(() => {
    const groups: Record<string, Offer[]> = {};
    filtered.forEach(o => {
      const rawName = o.store?.category?.name || 'عروض أخرى';
      const catName = DISPLAY_NAMES[rawName] || rawName;
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(o);
    });
    return groups;
  }, [filtered]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" dir="rtl">

      {/* ─── Page Title ──────────────────────────────────── */}
      <div className="mb-6 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF6B00]/10 rounded-xl flex items-center justify-center text-[#FF6B00]">
            <Flame size={22} />
          </div>
          استكشف العروض
        </h1>
        <p className="text-[#9A9A9A] text-xs sm:text-sm font-bold mt-2">
          عروض حية ومعتمدة من أفضل المحلات في الزقازيق
        </p>
      </div>

      {/* ─── Filters Card ────────────────────────────────── */}
      <div className="bg-[#252525] border border-white/[0.07] rounded-2xl p-5 mb-8 space-y-4">

        {/* Search */}
        <div className="relative">
          <Search
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9A9A9A] pointer-events-none"
            size={18}
          />
          <input
            type="text"
            placeholder="ابحث عن عرض أو محل..."
            className="w-full bg-[#1E1E1E] border border-white/[0.07] rounded-xl
                       pr-11 pl-4 py-3 text-sm font-bold text-[#F0F0F0]
                       placeholder:text-[#9A9A9A] outline-none
                       focus:border-[#FF6B00] focus:shadow-[0_0_0_3px_rgba(255,107,0,0.15)]
                       transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Category Ribbon */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth -mx-1 px-1">
          <button
            onClick={() => setActiveCat('')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl whitespace-nowrap font-black transition-all text-xs sm:text-sm ${
              !activeCat 
              ? 'bg-[#FF6B00] text-white shadow-lg shadow-[#FF6B00]/20' 
              : 'bg-[#252525] text-white/60 hover:bg-[#252525] hover:text-white border border-white/5'
            }`}
          >
            <Layers size={14} /> الكل
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl whitespace-nowrap font-black transition-all text-xs sm:text-sm ${
                activeCat === cat.id 
                ? 'bg-[#FF6B00] text-white shadow-lg shadow-[#FF6B00]/20' 
                : 'bg-[#252525] text-white/60 hover:bg-[#252525] hover:text-white border border-white/5'
              }`}
            >
              {CAT_ICONS[cat.name] || CAT_ICONS.default} {DISPLAY_NAMES[cat.name] || cat.name}
            </button>
          ))}
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            className="w-full bg-[#1E1E1E] border border-white/[0.07] rounded-xl
                       pr-4 py-3 text-sm font-bold text-[#F0F0F0] cursor-pointer outline-none
                       focus:border-[#FF6B00] transition-all appearance-none"
            value={area}
            onChange={e => setArea(e.target.value)}
          >
            <option value="">📍 كل المناطق</option>
            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select
            className="flex-1 min-w-[160px] bg-[#1E1E1E] border border-white/[0.07] rounded-xl
                       pr-4 py-3 text-sm font-bold text-[#F0F0F0] cursor-pointer outline-none
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
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm font-semibold text-[#9A9A9A]">
            وجدنا <span className="text-[#F0F0F0] font-bold">{filtered.length}</span> عرض متاح
          </p>
          {(search || activeCat || area) && (
            <button
              onClick={() => { setSearch(''); setActiveCat(''); setArea(''); }}
              className="text-xs font-bold text-[#FF6B00] hover:underline"
            >
              ✕ مسح الفلاتر
            </button>
          )}
        </div>
      )}

      {/* ─── Grouped Content ─────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-24 gap-4 text-center">
          <div className="w-20 h-20 bg-[#252525] rounded-full flex items-center justify-center text-4xl">🔍</div>
          <h3 className="text-lg font-bold">لا توجد عروض تطابق بحثك</h3>
          <p className="text-sm text-[#9A9A9A] max-w-xs leading-relaxed">
            جرّب تغيير كلمة البحث أو تحديد فلاتر مختلفة
          </p>
        </div>
      ) : (
        /* Render Grouped by Category */
        <div className="space-y-16">
          {Object.entries(grouped).map(([categoryName, categoryOffers]) => (
            <div key={categoryName} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-[#FF6B00]/10 rounded-lg flex items-center justify-center text-[#FF6B00]">
                  {CAT_ICONS[categoryName] || <Layers size={16} />}
                </div>
                <h2 className="text-lg sm:text-xl font-black text-[#F0F0F0]">{categoryName}</h2>
                <div className="h-px flex-1 bg-white/[0.04]" />
                <span className="text-[9px] font-black text-[#9A9A9A] uppercase tracking-wider bg-white/[0.02] px-3 py-1 rounded-full border border-white/[0.05]">
                  {categoryOffers.length}
                </span>
              </div>

              {/* Offers Grid for this category */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
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
