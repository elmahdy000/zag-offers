"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { OfferCard } from '@/components/offer-card';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('favorites');
    if (saved) setFavorites(JSON.parse(saved));
    setLoading(false);
  }, []);

  const removeFavorite = (id: string) => {
    const updated = favorites.filter(f => f.id !== id);
    setFavorites(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10" dir="rtl">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black mb-2">المفضلة</h1>
          <p className="text-white/40 text-sm font-bold">العروض التي قمت بحفظها للرجوع إليها لاحقاً</p>
        </div>
        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-red-500 border border-white/10">
          <Heart size={24} fill="currentColor" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-white/5 rounded-[32px] animate-pulse" />)}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-24 glass rounded-[40px] border-dashed border-2 border-white/5">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-white/10">
            <Heart size={40} />
          </div>
          <h3 className="text-xl font-black mb-2">قائمة المفضلة فارغة</h3>
          <p className="text-white/30 text-sm font-bold mb-8 max-w-xs mx-auto">لم تقم بإضافة أي عروض للمفضلة بعد. ابدأ باستكشاف العروض المميزة في مدينتك.</p>
          <Link href="/" className="px-10 py-4 bg-[#FF6B00] text-white font-black rounded-2xl shadow-xl shadow-orange-900/20 hover:scale-[1.02] transition-all inline-flex items-center gap-2">
            استكشف العروض <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
