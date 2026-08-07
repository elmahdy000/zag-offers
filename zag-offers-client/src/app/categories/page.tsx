"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ErrorDisplay } from '@/components/error-display';
import { API_URL, DISPLAY_NAMES } from '@/lib/constants';
import { normalizeCategories } from '@/lib/category-utils';
import { Category } from '@/lib/types';
import { useNotifications } from '@/components/notification-provider';
import { CategoryImageCard } from '@/components/category-image-card';

const getCatName = (name: string) => DISPLAY_NAMES[name] || name;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket, isConnected } = useNotifications();

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
          if (age <= 60_000) return;
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
  useEffect(() => {
    fetchCatsRef.current = fetchCats;
  }, [fetchCats]);

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
    <div className="min-h-[72vh] bg-[#07101F] pb-20" dir="rtl">
      <header className="border-b border-[#25344A] bg-[#101A2B] py-7 sm:py-9">
        <div className="site-container">
          <div className="mb-3 flex items-center gap-2 text-xs text-[#8F9DB1]">
            <Link href="/" className="hover:text-white">الرئيسية</Link><span>‹</span><span className="text-[#FF8A32]">الأقسام</span>
          </div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">الأقسام</h1>
          <p className="mt-2 text-sm text-[#A8B4C5]">تصفح العروض حسب القسم</p>
        </div>
      </header>

      <div className="site-container pt-7 sm:pt-9">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[1,2,3,4,5,6,7,8,9,10].map(i => <div key={i} className="h-40 animate-pulse rounded-2xl border border-[#25344A] bg-[#101A2B]" />)}
          </div>
        ) : error ? (
          <ErrorDisplay message={error} onRetry={() => fetchCatsRef.current(true)} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {categories.map((cat, i) => (
              <Link key={cat.id} href={`/offers?category=${cat.id}`} className="group block">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.035, 0.25) }}
                  className="transition-transform duration-300 hover:-translate-y-1"
                >
                  <CategoryImageCard name={getCatName(cat.name)} image={cat.image} />
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


