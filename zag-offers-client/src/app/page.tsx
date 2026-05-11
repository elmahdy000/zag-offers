"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Flame, Sparkles, Store as StoreIcon, ArrowUpDown, MapPin } from 'lucide-react';
import Link from 'next/link';
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

import { Offer, Category, Store, SortOption } from '@/lib/types';
import { API_URL, CAT_ASSETS, DISPLAY_NAMES } from '@/lib/constants';

const getCatName = (name: string) => DISPLAY_NAMES[name] || name;



const CACHE_KEY = 'zag_offers_home_cache_v2';
const CACHE_DURATION = 5 * 60 * 1000;

function HomePageContent() {
  const searchParams = useSearchParams();
  const catIdParam = searchParams.get('category');

  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [recommended, setRecommended] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<string>(catIdParam || '');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const debouncedSearch = useDebounce(search, 400);

  const { trackEvent } = useAnalytics();

  const fetchData = useCallback(async (force = false) => {
    try {
      setLoading(true);
      const [oRes, cRes, sRes, rRes] = await Promise.all([
        fetch(`${API_URL}/offers?limit=100`),
        fetch(`${API_URL}/stores/categories`),
        fetch(`${API_URL}/stores?limit=12`),
        fetch(`${API_URL}/recommendations`)
      ]);

      const [oData, cData, sData, rData] = await Promise.all([
        oRes.json(), cRes.json(), sRes.json(), rRes.json()
      ]);

      // Filter out clinics and duplicates by display name
      const seenNames = new Set<string>();
      const uniqueCats = cData
        .filter((c: Category) => !['عيادات', 'سوبرماركت', 'خدمات محلية'].includes(c.name))
        .filter((c: Category) => {
          const dispName = getCatName(c.name);
          if (seenNames.has(dispName)) return false;
          seenNames.add(dispName);
          return true;
        });

      setOffers(oData);
      setCategories(uniqueCats);
      setStores(sData);
      setRecommended(rData);
    } catch (e) {
      console.error(e);
      setError('فشل تحميل البيانات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(o =>
        o.title.toLowerCase().includes(q) ||
        o.store.name.toLowerCase().includes(q)
      );
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center">
        <div>
          <h2 className="text-xl font-black text-white mb-4">{error}</h2>
          <button onClick={() => fetchData(true)} className="px-6 py-2 bg-[#FF6B00] text-white rounded-lg">إعادة المحاولة</button>
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
      <section className="pt-12 sm:pt-20 pb-16 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-full"
          >
            <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
            <span className="text-[11px] sm:text-xs font-black text-[#FF6B00] uppercase tracking-wider">عروض الزقازيق الحصرية</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black leading-tight tracking-tight"
          >
            <span className="text-[#F0F0F0]">أفضل</span> <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#FF6B00] via-[#FF8C35] to-[#FFA15A]">العروض والخصومات في</span> <span className="text-white">زاج</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[#9A9A9A] text-sm sm:text-lg font-bold max-w-2xl mx-auto leading-relaxed"
          >
            بوابتك لأفضل كوبونات الخصم والعروض المباشرة من أقوى محلات ومطاعم مدينتك.
          </motion.p>

          {/* Search Box - Premium Style */}
          {/* Search Box - Premium Style */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto relative group"
          >
            {/* Pulsing Aura */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-[#FF6B00] via-[#FF8C35] to-[#FFA15A] rounded-[2.5rem] blur-xl opacity-0 group-focus-within:opacity-30 transition-all duration-700 animate-pulse" />
            
            <div className="relative flex items-center bg-[#1E1E1E]/90 backdrop-blur-3xl border border-white/5 p-2 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 group-focus-within:border-[#FF6B00]/40">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mx-2">
                <Search className="text-[#FF6B00]" size={20} />
              </div>
              <input 
                type="text" 
                placeholder="ابحث عن عرض، محل، أو صنف..."
                className="flex-1 bg-transparent py-4 text-sm sm:text-lg font-black text-white outline-none placeholder:text-[#9A9A9A]/30 pr-2"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-2xl mr-2 text-[10px] font-black text-[#5A5A5A] uppercase tracking-[0.2em]">
                <span>CTRL</span>
                <span>K</span>
              </div>
              <button className="px-10 py-4 bg-gradient-to-r from-[#FF6B00] to-[#D95A00] text-white font-black text-sm rounded-[2rem] hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(255,107,0,0.3)]">
                بحث
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Categories Bento/Ribbon ──────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 mb-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#FF6B00] rounded-full" />
            <h2 className="text-xl sm:text-2xl font-black text-white">الأقسام</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-xs font-black text-[#9A9A9A] hover:text-white transition-all">
              <ArrowUpDown size={14} className="text-[#FF6B00]" />
              <span>ترتيب حسب: الأحدث</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button 
            onClick={() => setActiveCat('')}
            className={`flex-shrink-0 group relative w-28 sm:w-32 aspect-[4/5] rounded-[2.5rem] overflow-hidden border transition-all duration-500
              ${!activeCat 
                ? 'border-[#FF6B00]/40 bg-[#FF6B00]/10 shadow-[0_10px_30px_rgba(255,107,0,0.15)]' 
                : 'border-white/5 bg-[#252525] opacity-50 hover:opacity-100 hover:border-white/20'}`}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <span className={`text-sm sm:text-base font-black tracking-widest transition-all duration-300 ${!activeCat ? 'text-[#FF6B00] scale-110' : 'text-white/40 group-hover:text-white'}`}>الكل</span>
              {!activeCat && <div className="absolute bottom-6 w-1 h-1 bg-[#FF6B00] rounded-full" />}
            </div>
          </button>

          {categories.map((c, idx) => (
            <motion.button 
              key={c.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
              onClick={() => setActiveCat(c.id)}
              className={`flex-shrink-0 group relative w-28 sm:w-32 aspect-[4/5] rounded-[2.5rem] overflow-hidden border transition-all duration-500
                ${activeCat === c.id 
                  ? 'border-[#FF6B00]/40 bg-[#FF6B00]/10 shadow-[0_10px_30px_rgba(255,107,0,0.2)] scale-105' 
                  : 'border-white/5 bg-[#252525] opacity-50 hover:opacity-100 hover:border-white/20'}`}
            >
              <div className="absolute inset-0 bg-[#151515]">
                <img 
                  src={CAT_ASSETS[c.name] || CAT_ASSETS.default} 
                  alt={c.name} 
                  className={`w-full h-full object-cover transition-all duration-700 ${activeCat === c.id ? 'scale-110 blur-[1px]' : 'group-hover:scale-110'}`} 
                />
              </div>
              <div className={`absolute inset-0 bg-gradient-to-t transition-all duration-500 ${activeCat === c.id ? 'from-[#FF6B00]/60 via-[#FF6B00]/10 to-transparent' : 'from-black/90 via-black/30 to-transparent'}`} />
              
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-5 z-20">
                <span className={`text-[10px] sm:text-xs font-black tracking-widest transition-all duration-300 ${activeCat === c.id ? 'text-white scale-110' : 'text-white/70 group-hover:text-white'}`}>
                  {getCatName(c.name)}
                </span>
                {activeCat === c.id && <div className="absolute bottom-2.5 w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white]" />}
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ─── Smart Recommendations ───────────────────────── */}
      <AnimatePresence>
        {!activeCat && !search && recommended.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-7xl mx-auto px-4 mb-20"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FF6B00]/10 rounded-xl flex items-center justify-center text-[#FF6B00]">
                  <Sparkles size={20} />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">عروض مختارة لك</h2>
              </div>
            </div>
            <div className="flex gap-6 overflow-x-auto no-scrollbar pb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
              {recommended.map((offer) => (
                <div key={offer.id} className="min-w-[280px] sm:min-w-[340px]">
                  <OfferCard offer={offer} />
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ─── Featured Stores Bento ───────────────────────── */}
      {!activeCat && !search && stores.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl sm:text-2xl font-black text-white">براندات بنحبها</h2>
            <Link href="/stores" className="text-xs font-black text-[#FF6B00] bg-[#FF6B00]/10 px-4 py-2 rounded-full hover:bg-[#FF6B00] hover:text-white transition-all">كل المتاجر</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {stores.slice(0, 12).map(store => (
              <Link key={store.id} href={`/stores/${store.id}`} className="group">
                <div className="bg-[#252525] border border-white/5 rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center space-y-3 hover:border-[#FF6B00]/50 hover:bg-[#FF6B00]/5 transition-all duration-300">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center p-2 group-hover:scale-110 transition-transform duration-300">
                    {store.logo ? (
                      <img src={resolveImageUrl(store.logo)} alt={store.name} className="w-full h-full object-contain" />
                    ) : (
                      <StoreIcon className="text-white/20" size={24} />
                    )}
                  </div>
                  <span className="text-[10px] sm:text-xs font-black text-white/60 group-hover:text-white transition-colors text-center">{store.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── Main Content Grid ───────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF6B00]/10 rounded-xl flex items-center justify-center text-[#FF6B00]">
              <Flame size={20} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {activeCat ? `عروض ${getCatName(categories.find(c => c.id === activeCat)?.name || '')}` : 'أحدث العروض'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-[#252525] border border-white/5 text-[#F0F0F0] text-xs font-black px-4 py-2 rounded-xl outline-none cursor-pointer"
            >
              <option value="newest">📅 الأحدث</option>
              <option value="expiring">⏰ ينتهي قريباً</option>
              <option value="discount">💰 الأعلى خصم</option>
            </select>
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
                  <OfferCard offer={offer} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {!loading && filteredOffers.length > 48 && (
          <div className="mt-20 text-center">
            <button className="px-12 py-5 bg-[#252525] border border-white/10 rounded-2xl font-black text-white hover:border-[#FF6B00] transition-all shadow-xl">
              عرض المزيد من العروض المميزة
            </button>
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
