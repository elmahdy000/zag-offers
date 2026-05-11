"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { OfferCard } from '@/components/offer-card';
import { API_URL } from '@/lib/constants';

import { Offer } from '@/lib/types';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setTimeout(() => setIsLoggedIn(!!token), 0);
  }, []);

  const fetchFavorites = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    // Load from cache first for instant UI
    const cached = localStorage.getItem('cache_favorites_v2');
    if (cached && favorites.length === 0) {
      setFavorites(JSON.parse(cached));
      setLoading(false);
    }

    if (!token) {
      const saved = localStorage.getItem('favorites');
      const localFavs = saved ? JSON.parse(saved) : [];
      setFavorites(localFavs);
      localStorage.setItem('cache_favorites_v2', JSON.stringify(localFavs));
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const offers = data.map((fav: { offer: Offer }) => ({
          ...fav.offer,
          store: fav.offer.store
        }));
        setFavorites(offers);
        localStorage.setItem('cache_favorites_v2', JSON.stringify(offers));
      }
    } catch (e) {
      console.error('Failed to fetch favorites:', e);
    } finally {
      setLoading(false);
    }
  }, [favorites.length]);

  useEffect(() => {
    fetchFavorites();
    const handleOnline = () => fetchFavorites();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [fetchFavorites]);

  // Re-fetch when auth state changes
  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(!!localStorage.getItem('token'));
      fetchFavorites();
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, [fetchFavorites]);

  const removeFavorite = async (id: string) => {
    // تحقق من صحة الـ ID
    if (!id || typeof id !== 'string' || id.length === 0) {
      console.error('Invalid favorite ID:', id);
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      // Fallback to localStorage if not logged in
      const updated = favorites.filter(f => f.id !== id);
      setFavorites(updated);
      try {
        localStorage.setItem('favorites', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update favorites in localStorage:', e);
      }
      return;
    }

    try {
      const res = await fetch(`${API_URL}/favorites/toggle/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.status === 401) {
        // Token expired, clear it and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      
      if (!res.ok) {
        console.error('Failed to remove favorite:', res.status);
        return;
      }
      
      // Refresh favorites list
      await fetchFavorites();
    } catch (e) {
      console.error('Failed to remove favorite:', e);
      // Fallback to localStorage on error
      const updated = favorites.filter(f => f.id !== id);
      setFavorites(updated);
      try {
        localStorage.setItem('favorites', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update favorites in localStorage:', e);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" dir="rtl">
      <div className="flex items-center justify-between mb-8 sm:mb-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black mb-1 sm:mb-2 text-[#F0F0F0]">المفضلة</h1>
          <p className="text-[#9A9A9A] text-xs sm:text-sm font-bold">العروض التي قمت بحفظها للرجوع إليها لاحقاً</p>
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FF6B00]/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-[#FF6B00] border border-[#FF6B00]/20">
          <Heart size={20} fill="currentColor" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-16 sm:py-24 bg-[#252525]/50 rounded-[2rem] border border-white/[0.05] shadow-inner">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-white/10">
            <Heart size={32} />
          </div>
          <h3 className="text-lg sm:text-xl font-black mb-2 text-white">قائمة المفضلة فارغة</h3>
          <p className="text-[#9A9A9A] text-xs sm:text-sm font-bold mb-8 max-w-xs mx-auto">لم تقم بإضافة أي عروض للمفضلة بعد. ابدأ باستكشاف العروض المميزة.</p>
          <Link href="/" className="px-8 py-3.5 bg-[#FF6B00] text-white font-black rounded-xl shadow-lg hover:scale-[1.02] transition-all inline-flex items-center gap-2 text-sm">
            استكشف العروض <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          <AnimatePresence>
            {favorites.map((offer) => (
              <motion.div 
                key={offer.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="relative group"
              >
                <OfferCard offer={offer} />
                <button 
                  onClick={() => removeFavorite(offer.id)}
                  className="absolute top-2 left-2 z-30 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
