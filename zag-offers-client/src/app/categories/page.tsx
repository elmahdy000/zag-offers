"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { RiArrowRightLine } from 'react-icons/ri';
import Link from 'next/link';
import Image from 'next/image';
import { ErrorDisplay } from '@/components/error-display';
import { API_URL, CAT_ASSETS, DISPLAY_NAMES } from '@/lib/constants';
import { normalizeCategories } from '@/lib/category-utils';
import { Category } from '@/lib/types';
import { resolveImageUrl } from '@/lib/utils';
import { usePublicSocket } from '@/lib/socket';

const getCatName = (name: string) => DISPLAY_NAMES[name] || name;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket, isConnected } = usePublicSocket();

  const fetchCats = useCallback(async (force = false) => {
    const cachedRaw = localStorage.getItem('cache_categories_full_v2');
    if (cachedRaw && !force && categories.length === 0) {
      const parsed = JSON.parse(cachedRaw);
      if (Array.isArray(parsed)) {
        const cacheTs = parseInt(localStorage.getItem('cache_categories_full_v2_ts') || '0', 10);
        const age = Date.now() - cacheTs;
        if (age > 5 * 60 * 1000) {
          localStorage.removeItem('cache_categories_full_v2');
          localStorage.removeItem('cache_categories_full_v2_ts');
        } else {
          setCategories(parsed);
          setLoading(false);
        }
      } else {
        setCategories(parsed.data || []);
        setLoading(false);
      }
    }

    try {
      const t = Date.now();
      const res = await fetch(`${API_URL}/offers/categories?_t=${t}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const dataRaw = await res.json();
      const data = normalizeCategories(dataRaw);
      setCategories(data);
      localStorage.setItem('cache_categories_full_v2', JSON.stringify(data));
      localStorage.setItem('cache_categories_full_v2_ts', String(Date.now()));
      setError(null);
    } catch (e) {
      console.error('Offline or error:', e);
      if (!cachedRaw) {
        setError('فشل تحميل الأقسام. يرجى التأكد من اتصالك بالإنترنت.');
      }
    } finally {
      setLoading(false);
    }
  }, [categories.length]);

  // Stable ref for socket/polling/online handlers
  const fetchCatsRef = useRef(fetchCats);
  fetchCatsRef.current = fetchCats;

  useEffect(() => {
    fetchCatsRef.current();

    // Silent background sync when back online
    const handleOnline = () => fetchCatsRef.current();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleCategoriesUpdated = () => {
      localStorage.removeItem('cache_categories_full_v2');
      fetchCatsRef.current(true);
    };

    socket.on('categories_updated', handleCategoriesUpdated);
    return () => {
      socket.off('categories_updated', handleCategoriesUpdated);
    };
  }, [socket]);

  // Polling fallback when socket is not connected
  useEffect(() => {
    if (isConnected) return;
    if (!navigator.onLine) return;

    const interval = setInterval(() => {
      fetchCatsRef.current(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:py-20" dir="rtl">
      <div className="text-center mb-12 sm:mb-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-full mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
          <span className="text-[10px] sm:text-xs font-black text-[#FF6B00] uppercase tracking-wider">استكشف عالم زاج</span>
        </motion.div>
        <h1 className="text-4xl sm:text-6xl font-black mb-6 text-[#F0F0F0] leading-tight">أقسام العروض</h1>
        <p className="text-[#9A9A9A] text-sm sm:text-lg font-bold max-w-2xl mx-auto">تصفح العروض حسب الفئة التي تفضلها واستمتع بتجربة تسوق فريدة</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="aspect-[4/5] bg-white/5 rounded-[2.5rem] animate-pulse border border-white/5" />
          ))}
        </div>
      ) : error ? (
        <ErrorDisplay message={error} onRetry={() => fetchCatsRef.current(true)} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
          {categories.map((cat, i) => (
            <Link key={cat.id} href={`/offers?category=${cat.id}`}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-[#FF6B00]/50 transition-all duration-500 cursor-pointer shadow-2xl"
              >
                  <div className="absolute inset-0 bg-[#252525]">
                  <Image 
                    src={cat.image ? (resolveImageUrl(cat.image) ?? CAT_ASSETS.default) : (CAT_ASSETS[cat.name] || CAT_ASSETS.default)} 
                    alt={cat.name} 
                    fill
                    className="object-cover transition-all duration-700 group-hover:scale-110"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    quality={75}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
                
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 sm:pb-12 z-20 space-y-4">
                  <h3 className="font-black text-xl sm:text-2xl text-white group-hover:text-[#FF6B00] transition-colors duration-300">
                    {getCatName(cat.name)}
                  </h3>
                  <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-black text-white/60 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full group-hover:bg-[#FF6B00] group-hover:text-white transition-all duration-300">
                    تصفح العروض <RiArrowRightLine size={12} className="group-hover:-translate-x-1 transition-transform rotate-180" />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


