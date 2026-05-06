"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Heart, Utensils, Coffee, Shirt, Dumbbell, Sparkles, Hospital, ShoppingCart, BookOpen, Car, Tool } from 'lucide-react';
import Link from 'next/link';
import { BASE_URL } from '@/lib/constants';
import { resolveImageUrl } from '@/lib/utils';

interface OfferCardProps {
  offer: any;
}

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
  'خدمات محلية':  <Tool size={14} />,
  'default':       <Sparkles size={14} />,
};

const CAT_GRADIENTS: Record<string, string> = {
  'مطاعم':         'from-[#2a1000] to-[#1a0800]',
  'كافيهات':       'from-[#1a0d00] to-[#0d0600]',
  'جيم':           'from-[#001a0a] to-[#000d05]',
  'ملابس':         'from-[#1a001a] to-[#0d000d]',
  'تجميل':         'from-[#180018] to-[#0e000e]',
  'دورات':         'from-[#001a1a] to-[#000d0d]',
  'default':       'from-[#1a1a2e] to-[#16213e]',
};

export function OfferCard({ offer }: OfferCardProps) {
  const [isFav, setIsFav] = useState(false);

  const daysLeft = Math.ceil(
    (new Date(offer.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const logoUrl = resolveImageUrl(offer.store?.logo);

  const catName = offer.store?.category?.name || '';
  const catIcon = CAT_ICONS[catName] || CAT_ICONS.default;
  const catGrad = CAT_GRADIENTS[catName] || CAT_GRADIENTS.default;

  const expiryColor =
    daysLeft <= 0 ? 'text-red-400' : daysLeft <= 3 ? 'text-orange-400' : 'text-[#9A9A9A]';
  const expiryText =
    daysLeft <= 0  ? '⚠️ انتهى'
    : daysLeft === 1 ? '⚡ آخر يوم!'
    : daysLeft <= 3  ? `⏰ ${daysLeft} أيام`
    : `📅 ${daysLeft} يوم`;

  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      setIsFav(favs.some((f: any) => f.id === offer.id));
    } catch {}
  }, [offer.id]);

  const toggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      const updated = isFav
        ? favs.filter((f: any) => f.id !== offer.id)
        : [...favs, offer];
      localStorage.setItem('favorites', JSON.stringify(updated));
      setIsFav(!isFav);
    } catch {}
  };

  const offerImage = offer.images && offer.images.length > 0
    ? resolveImageUrl(offer.images[0])
    : null;

  return (
    <motion.div
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="group relative bg-[#252525] border border-white/[0.07] rounded-2xl overflow-hidden
                 hover:border-[#FF6B00]/40 hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)]
                 transition-all duration-200 flex flex-col h-full"
    >
      {/* ─── Header ─────────────────────────────────── */}
      <div className={`relative h-40 bg-gradient-to-br ${catGrad} overflow-hidden flex-shrink-0`}>
        
        {/* Background Image if exists */}
        {offerImage && (
          <img 
            src={offerImage} 
            alt={offer.title} 
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-60" 
          />
        )}

        {/* Overlay gradient to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#252525] via-transparent to-black/20" />

        {/* dot pattern */}
        {!offerImage && (
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
        )}

        {/* Featured */}
        {offer.featured && (
          <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-gradient-to-r from-yellow-400 to-orange-400
                          text-[#1a1a1a] text-[11px] font-black rounded-full shadow-lg">
            ⭐ مميز
          </div>
        )}

        {/* Discount */}
        <div className="absolute top-3 right-3 z-10 px-3 py-1.5
                        bg-gradient-to-br from-[#FF6B00] to-[#D95A00]
                        text-white text-base font-black rounded-xl
                        shadow-[0_4px_16px_rgba(255,107,0,0.5)]">
          {offer.discount}
        </div>

        {/* Fav */}
        <button
          onClick={toggleFav}
          className={`absolute bottom-3 left-3 z-10 p-2 rounded-xl backdrop-blur-sm border transition-all
            ${isFav
              ? 'bg-red-500/20 border-red-500/50 text-red-400'
              : 'bg-black/30 border-white/10 text-white/40 hover:text-white hover:border-white/30'}`}
        >
          <Heart size={14} fill={isFav ? 'currentColor' : 'none'} />
        </button>

        {/* Store Logo */}
        <div className="absolute -bottom-5 right-4 z-20
                        w-12 h-12 rounded-xl border-2 border-[#252525]
                        bg-[#1E1E1E] overflow-hidden shadow-xl
                        flex items-center justify-center flex-shrink-0">
          {logoUrl
            ? <img src={logoUrl} alt={offer.store?.name} className="w-full h-full object-cover" />
            : <div className="text-white/20">{catIcon}</div>
          }
        </div>
      </div>

      {/* ─── Body ────────────────────────────────────── */}
      <div className="flex flex-col flex-1 px-4 pt-8 pb-4 gap-2">

        {/* Category */}
        {catName && (
          <span className="text-[11px] font-black text-[#FF6B00] uppercase tracking-wider flex items-center gap-1.5">
            {catIcon} {catName}
          </span>
        )}

        {/* Title */}
        <h3 className="text-sm font-bold text-[#F0F0F0] leading-snug line-clamp-2
                       group-hover:text-[#FF6B00] transition-colors min-h-[40px]">
          {offer.title}
        </h3>

        {/* Store & Social Proof */}
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-[#9A9A9A] font-semibold flex items-center gap-1.5">
            <span className="text-[10px]">🏪</span>
            {offer.store?.name}
          </p>
          {(offer._count?.coupons || 0) > 0 && (
            <span className="text-[10px] font-black text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-1">
              <span>🔥</span>
              {offer._count.coupons} طلب
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="mt-auto pt-3 border-t border-white/[0.07] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[#9A9A9A]">
            <MapPin size={12} className="text-[#FF6B00] flex-shrink-0" />
            <span className="text-[11px] font-bold truncate max-w-[90px]">
              {offer.store?.area || '—'}
            </span>
          </div>
          <span className={`text-[11px] font-bold ${expiryColor}`}>{expiryText}</span>
        </div>

        {/* CTA */}
        <Link
          href={`/offers/${offer.id}`}
          className="mt-2 w-full py-2.5 text-center text-[13px] font-bold text-[#FF6B00]
                     bg-[#FF6B00]/10 border border-[#FF6B00]/25 rounded-xl
                     hover:bg-[#FF6B00] hover:text-white hover:border-[#FF6B00]
                     hover:shadow-[0_4px_14px_rgba(255,107,0,0.4)]
                     transition-all duration-200 block"
        >
          🎟️ احصل على الكوبون
        </Link>
      </div>
    </motion.div>
  );
}

/* ─── Skeleton ──────────────────────────────────── */
export const SkeletonCard = () => (
  <div className="bg-[#252525] border border-white/[0.07] rounded-2xl overflow-hidden">
    <div className="h-40 skeleton-shimmer" />
    <div className="px-4 pt-8 pb-4 space-y-3">
      <div className="h-2.5 w-1/3 skeleton-shimmer rounded-full" />
      <div className="h-4 w-full skeleton-shimmer rounded-full" />
      <div className="h-4 w-3/4 skeleton-shimmer rounded-full" />
      <div className="h-3 w-1/2 skeleton-shimmer rounded-full" />
      <div className="h-10 w-full skeleton-shimmer rounded-xl mt-2" />
    </div>
  </div>
);
