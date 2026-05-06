"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tag, MapPin, Heart, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { API_URL, BASE_URL } from '@/lib/constants';

interface OfferCardProps {
  offer: any;
}

const CAT_ICONS: Record<string, string> = {
  'مطاعم': '🍔', 'كافيهات': '☕', 'ملابس': '👗', 'جيم': '💪',
  'تجميل': '💅', 'عيادات': '🏥', 'سوبرماركت': '🛒', 'default': '🏷️'
};

export function OfferCard({ offer }: OfferCardProps) {
  const [isFav, setIsFav] = useState(false);
  const daysLeft = Math.ceil((new Date(offer.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const logoUrl = offer.store?.logo ? (offer.store.logo.startsWith('http') ? offer.store.logo : `${BASE_URL}/${offer.store.logo}`) : null;

  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFav(favs.some((f: any) => f.id === offer.id));
  }, [offer.id]);

  const toggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    let updated;
    if (isFav) {
      updated = favs.filter((f: any) => f.id !== offer.id);
    } else {
      updated = [...favs, offer];
    }
    localStorage.setItem('favorites', JSON.stringify(updated));
    setIsFav(!isFav);
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="group relative bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden hover:border-[#FF6B00]/40 transition-all shadow-xl h-full flex flex-col"
    >
      <div className="h-24 bg-gradient-to-br from-zinc-800 to-zinc-900 relative">
        <div className="absolute top-3 right-3 px-3 py-1 bg-[#FF6B00] text-white text-sm font-black rounded-lg shadow-lg z-10">
          {offer.discount}
        </div>
        <button 
          onClick={toggleFav}
          className={`absolute top-3 left-3 p-2 rounded-lg backdrop-blur-md border z-20 transition-all ${isFav ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-black/20 border-white/10 text-white/40 hover:text-white'}`}
        >
          <Heart size={14} fill={isFav ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="p-4 pt-10 relative flex-1 flex flex-col">
        <div className="absolute -top-8 right-4 w-14 h-14 bg-[#141414] rounded-xl border-2 border-[#1A1A1A] flex items-center justify-center overflow-hidden shadow-xl">
          {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-cover" /> : <Tag className="text-white/20" />}
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-black text-[#FF6B00] uppercase tracking-wider">
            {CAT_ICONS[offer.store?.category?.name || ''] || CAT_ICONS.default} {offer.store?.category?.name}
          </span>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <span className={`text-[10px] font-bold ${daysLeft <= 3 ? 'text-red-400' : 'text-white/40'}`}>
            {daysLeft <= 0 ? 'انتهى' : `باقي ${daysLeft} يوم`}
          </span>
        </div>

        <h3 className="text-sm font-bold text-white mb-3 line-clamp-2 leading-snug group-hover:text-[#FF6B00] transition-colors min-h-[40px]">
          {offer.title}
        </h3>

        <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-white/50">
            <MapPin size={12} className="text-[#FF6B00]" />
            <span className="text-[11px] font-bold truncate max-w-[80px]">{offer.store?.area}</span>
          </div>
          <Link href={`/offers/${offer.id}`} className="text-[11px] font-bold text-[#FF6B00] flex items-center gap-1 hover:gap-2 transition-all">
            تفاصيل <ArrowLeft size={12} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export const SkeletonCard = () => (
  <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden animate-pulse">
    <div className="h-28 bg-white/5" />
    <div className="p-4 space-y-3">
      <div className="h-3 w-1/3 bg-white/5 rounded" />
      <div className="h-4 w-full bg-white/5 rounded" />
      <div className="h-3 w-2/3 bg-white/5 rounded" />
    </div>
  </div>
);
