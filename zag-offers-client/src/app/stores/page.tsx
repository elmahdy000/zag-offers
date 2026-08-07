"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ArrowLeft, Search, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { resolveImageUrl } from '@/lib/utils';
import { ErrorDisplay } from '@/components/error-display';

import { API_URL } from '@/lib/constants';

import { Store } from '@/lib/types';
import { extractItems, filterStores } from '@/lib/catalog-utils';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function StoresListPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const fetchStores = useCallback(async () => {
    const cachedRaw = localStorage.getItem('cache_stores_list');
    
    if (cachedRaw && stores.length === 0) {
      const parsed = JSON.parse(cachedRaw);
      const cacheTs = parseInt(localStorage.getItem('cache_stores_list_ts') || '0', 10);
      const age = Date.now() - cacheTs;
      if (age > 5 * 60 * 1000) {
        localStorage.removeItem('cache_stores_list');
        localStorage.removeItem('cache_stores_list_ts');
      } else {
        const data = Array.isArray(parsed) ? parsed : (parsed.data || []);
        setStores(data);
        setLoading(false);
      }
    }

    try {
      const res = await fetch(`${API_URL}/stores?limit=100`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const storesData = extractItems<Store>(data);
        const validStores = storesData.filter((s: Store) => s && s.id && s.name);
        setStores(validStores);
        localStorage.setItem('cache_stores_list', JSON.stringify(validStores));
        localStorage.setItem('cache_stores_list_ts', String(Date.now()));
      }
      setError(null);
    } catch (e) { 
      console.error('Failed to fetch stores (offline?):', e); 
      if (!cachedRaw) {
        setError('فشل تحميل المتاجر. يرجى التأكد من اتصالك بالإنترنت.');
      }
    } finally { 
      setLoading(false); 
    }
  }, [stores.length]);

  useEffect(() => {
    const timer = window.setTimeout(() => fetchStores(), 0);

    const handleOnline = () => fetchStores();
    window.addEventListener('online', handleOnline);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
    };
  }, [fetchStores]);

  const filteredStores = filterStores(stores, debouncedSearch);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-[32px] font-bold mb-3 text-[#F0F0F0]">شركاء النجاح</h1>
          <p className="text-[#AAB7C9] text-[15px] font-normal">اكتشف أفضل المحلات والخدمات في الزقازيق</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9A9A9A]" size={18} />
          <input 
            type="text"
            placeholder="ابحث باسم المحل أو المنطقة أو الصنف..."
            className="w-full bg-[#0F1A2B] border border-[#2A3A52] rounded-xl px-12 py-3.5 text-sm font-normal text-[#F0F0F0] focus:border-[#FF6B00] outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9A9A] hover:text-white transition-colors p-0.5 rounded-full hover:bg-white/10"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 sm:h-48 bg-white/5 rounded-2xl sm:rounded-[32px] animate-pulse" />)}
        </div>
      ) : error ? (
        <ErrorDisplay message={error} onRetry={fetchStores} />
      ) : filteredStores.length === 0 ? (
        <div className="text-center py-16 sm:py-24 bg-[#252525]/50 rounded-[2rem] border border-white/[0.05]">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-white/10">
            <Search size={32} />
          </div>
          <h3 className="text-lg sm:text-xl font-black mb-2 text-white">لا توجد نتائج</h3>
          <p className="text-[#9A9A9A] text-xs sm:text-sm font-bold mb-8 max-w-xs mx-auto">لم نجد متاجر تطابق &ldquo;{search}&rdquo;. جرّب كلمات بحث مختلفة.</p>
          <button
            onClick={() => setSearch('')}
            className="px-8 py-3.5 bg-[#FF6B00] text-white font-black rounded-xl shadow-lg hover:scale-[1.02] transition-all inline-flex items-center gap-2 text-sm"
          >
            مسح البحث
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => {
            const logoUrl = resolveImageUrl(store.logo);
            return (
              <Link key={store.id} href={`/stores/${store.id}`}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="global-card min-h-[300px] bg-[#0F1A2B] border border-[#2A3A52] p-6 rounded-[20px] flex flex-col items-center text-center hover:border-[#FF6B00]/50 hover:bg-[#162338] transition-all cursor-pointer group h-full"
                >
                  <div className="w-24 h-24 bg-[#162338] rounded-[22px] border border-[#2A3A52] flex items-center justify-center overflow-hidden mb-5">
                    {logoUrl ? 
                      <Image
                        src={logoUrl}
                        alt={store.name || 'Store Logo'}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        sizes="96px"
                        quality={80}
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMUVFMUUxIi8+PC9zdmc+"
                      /> : 
                      <span className="text-3xl font-bold text-[#8FA0B8]">{store.name.trim().charAt(0)}</span>
                    }
                  </div>
                  <h3 className="font-bold text-lg mb-2 group-hover:text-[#FF7A1A] transition-colors">{store.name}</h3>
                  <p className="text-sm font-semibold text-[#FF8A3D] bg-[#FF6B00]/10 px-4 py-1.5 rounded-full mb-4">
                    {store.category?.name || 'متجر'}
                  </p>
                  <div className="flex items-center gap-2 text-[#8FA0B8] text-sm font-normal mb-5">
                    <MapPin size={16} className="text-[#FF6B00]" /> {store.area}
                  </div>
                  <div className="mt-auto w-full border-t border-[#2A3A52]/70 pt-4 flex items-center justify-center gap-2 text-base font-bold text-[#FF7A1A]">
                    عرض المتجر <ArrowLeft size={15} />
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
