"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search, Flame, Layers, X, BadgePercent, MapPin, ArrowUpDown, SlidersHorizontal, CheckCircle2, ChevronDown, Check, RotateCcw } from 'lucide-react';
import { OfferCard, SkeletonCard } from '@/components/offer-card';
import { CategoryIcon } from '@/components/category-icon';
import { ErrorDisplay, safeJsonParse } from '@/components/error-display';
import { API_URL, ZAGAZIG_AREAS } from '@/lib/constants';
import { normalizeCategories } from '@/lib/category-utils';
import { useNotifications } from '@/components/notification-provider';
import { extractItems, filterOffers, sortOffers } from '@/lib/catalog-utils';
import { resolveImageUrl } from '@/lib/utils';
import { AreaPickerModal } from '@/components/area-picker-modal';

import { Offer, Category, SortOption } from '@/lib/types';

const AREAS = ZAGAZIG_AREAS;

// --- Debounce Hook ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function FilterDropdown({
  label, icon, value, options, onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={dropdownRef} className={`offers-filter-dropdown ${open ? 'is-open' : ''}`}>
      <button type="button" className="offers-filter-trigger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6500]" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
        <span className="offers-filter-trigger-icon">{icon}</span>
        <span className="offers-filter-trigger-copy"><small>{label}</small><strong>{selected.label}</strong></span>
        <ChevronDown className="offers-filter-chevron" size={15} />
      </button>
      {open && (
        <div className="offers-filter-menu" role="listbox">
          {options.map((option) => (
            <button type="button" role="option" aria-selected={option.value === value} key={option.value} className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6500] ${option.value === value ? 'is-selected' : ''}`} onClick={() => { onChange(option.value); setOpen(false); }}>
              <span>{option.label}</span>
              {option.value === value && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
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
  const initialCat         = searchParams.get('category') || searchParams.get('categoryId') || '';
  const initialArea        = searchParams.get('area') || '';
  const initialSearch      = searchParams.get('q') || '';
  const initialSort        = (searchParams.get('sort') as SortOption) || 'newest';
  const initialMinDiscount = parseInt(searchParams.get('discount') || '0', 10) || 0;

  const [offers,        setOffers]        = useState<Offer[]>([]);
  const [categories,    setCategories]    = useState<Category[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [search,        setSearch]        = useState(initialSearch);
  const [activeCat,     setActiveCat]     = useState(initialCat);
  const [area,          setArea]          = useState(initialArea);
  const [sort,          setSort]          = useState<SortOption>(initialSort);
  const [minDiscount,   setMinDiscount]   = useState<number>(initialMinDiscount);
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  // Sync state with URL whenever filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (activeCat) params.set('category', activeCat); else params.delete('category');
    if (area) params.set('area', area); else params.delete('area');
    if (search) params.set('q', search); else params.delete('q');
    if (sort !== 'newest') params.set('sort', sort); else params.delete('sort');
    if (minDiscount > 0) params.set('discount', String(minDiscount)); else params.delete('discount');
    
    // Use replace to avoid polluting history stack with every keystroke
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [activeCat, area, search, sort, minDiscount, pathname, router, searchParams]);

  // Scroll when category / area / sort / discount changes (immediate)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    scrollToResults();
  }, [activeCat, area, sort, minDiscount]);

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
      minDiscount,
      activeOnly: true,
    }), sort);
  }, [offers, debouncedSearch, activeCat, area, minDiscount, sort]);

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
              type="button"
              onClick={() => setSearch('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-[#9A9A9A] hover:text-white transition-colors rounded-lg hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6500]"
              title="مسح البحث"
              aria-label="مسح البحث"
            >
              <X size={16} />
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
            <span className="offers-category-thumb is-all"><Layers size={15} /></span> الكل
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
              <span className="offers-category-thumb">
                {resolveImageUrl(cat.image) ? (
                  <Image src={resolveImageUrl(cat.image)!} alt="" fill sizes="32px" className="object-cover" />
                ) : (<CategoryIcon name={cat.name} size={14} />)}
              </span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Quick Discount Pills (matching Flutter FilterBottomSheet) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs font-bold" aria-label="تصفية حسب نسبة الخصم">
          <span className="text-[#8FA0B8] shrink-0 text-xs pl-1">نسبة الخصم:</span>
          {[
            { value: 0, label: 'الكل' },
            { value: 50, label: 'خصم 50%+ 🔥' },
            { value: 30, label: 'خصم 30%+' },
            { value: 20, label: 'خصم 20%+' },
            { value: 10, label: 'خصم 10%+' },
          ].map((item) => {
            const isSelected = minDiscount === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setMinDiscount(item.value)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6500] border ${
                  isSelected
                    ? 'bg-[#FF6500] border-[#FF6500] text-white shadow-[0_2px_10px_rgba(255,101,0,0.35)]'
                    : 'bg-[#101A2B] border-white/5 text-[#8FA0B8] hover:text-white hover:border-white/15'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Filters Grid */}
        <div className="offers-select-grid">
          <FilterDropdown
            label="المنطقة"
            icon={<MapPin size={16} />}
            value={area}
            onChange={setArea}
            options={[{ value: '', label: 'كل المناطق' }, ...AREAS.filter((item) => item !== 'الكل').map((item) => ({ value: item, label: item }))]}
          />
          <button
            type="button"
            onClick={() => setAreaModalOpen(true)}
            aria-label="تصفح خريطة أحياء الزقازيق"
            className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[#0B1526] border border-[#25344A] hover:border-[#FF6500]/50 transition-all text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6500] min-h-[48px]"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-[#FF8A32]"><MapPin size={16} /></span>
              <div className="flex flex-col">
                <small className="text-[10px] text-[#8FA0B8] font-bold">تصفح أحياء الزقازيق</small>
                <strong className="text-xs text-white font-bold">{area || 'كل المناطق (الافتراضي)'}</strong>
              </div>
            </div>
            <span className="text-xs text-[#FF8A32] font-black">تغيير</span>
          </button>
          <FilterDropdown
            label="الترتيب"
            icon={<ArrowUpDown size={16} />}
            value={sort}
            onChange={(value) => setSort(value as SortOption)}
            options={[
              { value: 'newest', label: 'الأحدث أولاً' },
              { value: 'expiring', label: 'ينتهي قريباً' },
              { value: 'discount', label: 'أعلى خصم' },
            ]}
          />
        </div>
      </div>

      {/* ─── Results Bar ─────────────────────────────────── */}
      {!loading && (
        <div className="offers-results-bar">
          <p><span className="offers-result-count">{filtered.length}</span><span>عرض متاح لك الآن</span>
          </p>
          {(search || activeCat || area || minDiscount > 0) && (
            <button
              onClick={() => { setSearch(''); setActiveCat(''); setArea(''); setMinDiscount(0); }}
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
        <div className="flex flex-col items-center py-16 gap-4 text-center bg-[#101A2B]/60 rounded-3xl border border-[#25344A]/80 p-8 my-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6500]/20 to-[#FF8A32]/10 border border-[#FF6500]/30 text-[#FF7A1A] shadow-[0_4px_20px_rgba(255,101,0,0.2)]">
            <Search size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">لا توجد عروض تطابق بحثك</h3>
            <p className="text-sm text-[#8FA0B8] max-w-sm leading-relaxed">
              جرّب تغيير كلمة البحث أو استعراض كل الأقسام والمناطق
            </p>
          </div>
          {(search || activeCat || area || minDiscount > 0) && (
            <button
              onClick={() => { setSearch(''); setActiveCat(''); setArea(''); setMinDiscount(0); }}
              className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6500] to-[#FF8A32] text-white text-sm font-bold shadow-[0_4px_16px_rgba(255,101,0,0.35)] hover:shadow-[0_6px_22px_rgba(255,101,0,0.5)] active:scale-95 transition-all"
            >
              <RotateCcw size={16} />
              إعادة تعيين جميع الفلاتر
            </button>
          )}
        </div>
      ) : (
        /* Render Grouped by Category */
        <div className="space-y-10">
          {Object.entries(grouped).map(([categoryName, categoryOffers]) => (
            <div key={categoryName} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Category Header */}
              <div className="offers-group-header">
                <div className="offers-group-icon">
                  <CategoryIcon name={categoryName} size={15} />
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

      <AreaPickerModal
        isOpen={areaModalOpen}
        onClose={() => setAreaModalOpen(false)}
        selectedArea={area}
        onSelectArea={setArea}
      />
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


