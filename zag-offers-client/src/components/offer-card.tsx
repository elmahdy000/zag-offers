"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  RiMapPin2Line, RiHeartFill, RiHeartLine, 
  RiRestaurant2Fill, RiCupFill, RiShirtFill, 
  RiHeartPulseFill, RiMagicFill, RiHospitalFill, 
  RiShoppingCartFill, RiBookOpenFill, RiCarWashingFill, 
  RiHammerFill, RiSparklingFill, RiScissors2Fill,
  RiCake3Fill, RiGiftFill, RiGamepadFill, RiBearSmileFill,
  RiHomeHeartFill
} from 'react-icons/ri';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { BASE_URL, API_URL } from '@/lib/constants';
import { resolveImageUrl, calculateDaysLeft } from '@/lib/utils';

interface Offer {
  id: string;
  title: string;
  discount: string;
  endDate: string;
  images: string[];
  featured?: boolean;
  store: {
    id: string;
    name: string;
    logo?: string;
    area?: string;
    category?: {
      name: string;
    };
  };
  _count?: {
    coupons?: number;
  };
}

interface OfferCardProps {
  offer: Offer;
  priority?: boolean;
}

const CAT_ICONS: Record<string, React.ReactNode> = {
  'مطاعم':         <RiRestaurant2Fill size={14} />,
  'دلع كرشك':      <RiRestaurant2Fill size={14} />,
  'كافيهات':       <RiCupFill size={14} />,
  'روقان':         <RiCupFill size={14} />,
  'ملابس':         <RiShirtFill size={14} />,
  'شياكة':         <RiShirtFill size={14} />,
  'جيم':           <RiHeartPulseFill size={14} />,
  'فورمة':          <RiHeartPulseFill size={14} />,
  'تجميل':         <RiMagicFill size={14} />,
  'دلع بنات':       <RiMagicFill size={14} />,
  'عيادات':        <RiHospitalFill size={14} />,
  'سوبرماركت':    <RiShoppingCartFill size={14} />,
  'دورات':         <RiBookOpenFill size={14} />,
  'طور نفسك':      <RiBookOpenFill size={14} />,
  'خدمات سيارات': <RiCarWashingFill size={14} />,
  'دلع عربيتك':    <RiCarWashingFill size={14} />,
  'خدمات محلية':  <RiHammerFill size={14} />,
  'حلاقين':       <RiScissors2Fill size={14} />,
  'نعيماً':        <RiScissors2Fill size={14} />,
  'حلويات':       <RiCake3Fill size={14} />,
  'حلى بوقك':      <RiCake3Fill size={14} />,
  'مناسبات':       <RiGiftFill size={14} />,
  'عروستي':       <RiGiftFill size={14} />,
  'ألعاب':         <RiGamepadFill size={14} />,
  'اون فاير':      <RiGamepadFill size={14} />,
  'أطفال':         <RiBearSmileFill size={14} />,
  'عيالنا':        <RiBearSmileFill size={14} />,
  'أدوات منزلية':  <RiHomeHeartFill size={14} />,
  'ست البيت':      <RiHomeHeartFill size={14} />,
  'default':       <RiSparklingFill size={14} />,
};

const CAT_GRADIENTS: Record<string, string> = {
  'مطاعم':         'from-[#2a1000] to-[#1a0800]',
  'دلع كرشك':      'from-[#2a1000] to-[#1a0800]',
  'كافيهات':       'from-[#1a0d00] to-[#0d0600]',
  'روقان':         'from-[#1a0d00] to-[#0d0600]',
  'جيم':           'from-[#001a0a] to-[#000d05]',
  'فورمة':          'from-[#001a0a] to-[#000d05]',
  'ملابس':         'from-[#1a001a] to-[#0d000d]',
  'شياكة':         'from-[#1a001a] to-[#0d000d]',
  'تجميل':         'from-[#180018] to-[#0e000e]',
  'دلع بنات':       'from-[#180018] to-[#0e000e]',
  'دورات':         'from-[#001a1a] to-[#000d0d]',
  'طور نفسك':      'from-[#001a1a] to-[#000d0d]',
  'default':       'from-[#1a1a2e] to-[#16213e]',
};

export function OfferCard({ offer, priority = false }: OfferCardProps) {
  const router = useRouter();
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    if (!offer?.id) return;

    // Read favorite status from localStorage only (avoids N+1 API calls per card)
    try {
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      setTimeout(() => {
        setIsFav(favs.some((f: { id: string }) => f.id === offer.id));
      }, 0);
    } catch { /* silent */ }
  }, [offer?.id]);

  // ─── Guard: render nothing for invalid data ───────────────────────────────
  if (!offer || !offer.id) {
    console.error('Invalid offer data:', offer);
    return null;
  }

  if (!offer.store || !offer.store.id) {
    console.error('Invalid store data:', offer.store);
    return null;
  }

  // ─── Derived values ───────────────────────────────────────────────────────
  const daysLeft = calculateDaysLeft(offer.endDate);

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

  const discountDisplay = offer.discount ? offer.discount.trim() : '0%';

  const toggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('token');

    if (token) {
      // Use API if logged in — optimistic update
      setIsFav(prev => !prev);
      try {
        const res = await fetch(`${API_URL}/favorites/toggle/${offer.id}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setIsFav(data.favorited);
          // Sync localStorage
          try {
            const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
            const updated = data.favorited
              ? [...favs.filter((f: { id: string }) => f.id !== offer.id), offer]
              : favs.filter((f: { id: string }) => f.id !== offer.id);
            localStorage.setItem('favorites', JSON.stringify(updated));
          } catch { /* silent */ }
        } else {
          setIsFav(prev => !prev); // revert on failure
        }
      } catch {
        setIsFav(prev => !prev); // revert on error
      }
    } else {
      // Fallback to localStorage
      try {
        const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
        const updated = isFav
          ? favs.filter((f: { id: string }) => f.id !== offer.id)
          : [...favs, offer];
        localStorage.setItem('favorites', JSON.stringify(updated));
        setIsFav(!isFav);
      } catch { /* silent */ }
    }
  };

  const offerImage = offer.images && offer.images.length > 0
    ? resolveImageUrl(offer.images[0])
    : null;


  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={() => router.push(`/offers/${offer.id}`)}
      className="group relative bg-[#252525] border border-white/[0.06] rounded-xl overflow-hidden
                 hover:border-[#FF6B00]/30 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]
                 transition-all duration-200 flex flex-col h-full cursor-pointer"
    >
      {/* ─── Header ─────────────────────────────────── */}
      <div className={`relative h-40 bg-gradient-to-br ${catGrad} overflow-hidden flex-shrink-0`}>
        
        {/* Background Image if exists */}
        {offerImage && (
          <Image 
            src={offerImage} 
            alt={offer.title} 
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-70" 
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            quality={75}
            priority={priority}
          />
        )}

        {/* Overlay gradient to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#252525]/80 via-transparent to-black/10" />

        {/* Featured */}
        {offer.featured && (
          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-400
                          text-[#1a1a1a] text-[9px] font-black rounded-lg shadow-lg">
            ⭐ مميز
          </div>
        )}

        {/* Discount */}
        <div className="absolute top-2 right-2 z-10 px-2 py-0.5
                        bg-gradient-to-br from-[#FF6B00] to-[#D95A00]
                        text-white text-[11px] font-black rounded-lg
                        shadow-[0_4px_12px_rgba(255,107,0,0.4)]">
          {discountDisplay}
        </div>

        {/* Fav */}
        <button
          onClick={toggleFav}
          className={`absolute bottom-2 left-2 z-10 p-1.5 rounded-lg backdrop-blur-sm border transition-all
            ${isFav
              ? 'bg-red-500/20 border-red-500/50 text-red-400'
              : 'bg-black/30 border-white/10 text-white/40 hover:text-white hover:border-white/30'}`}
        >
          <RiHeartFill size={14} className={isFav ? 'text-red-500' : 'text-white/40'} />
        </button>

        {/* Store Logo */}
        <div className="absolute -bottom-4 right-3 z-20
                        w-11 h-11 rounded-xl border-2 border-[#252525]
                        bg-[#1E1E1E] overflow-hidden shadow-xl
                        flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105">
          {logoUrl
            ? <Image
                src={logoUrl}
                alt={offer.store?.name || 'Store Logo'}
                width={44}
                height={44}
                className="w-full h-full object-cover"
                loading="lazy"
                sizes="44px"
                quality={80}
              />
            : <div className="text-white/20 scale-75">{catIcon}</div>
          }
        </div>
      </div>

      {/* ─── Body ────────────────────────────────────── */}
      <div className="flex flex-col flex-1 px-3 pt-5 pb-3 gap-1">

        {/* Category */}
        {catName && (
          <span className="text-[10px] font-black text-[#FF6B00] uppercase tracking-wider flex items-center gap-1">
            <span className="scale-75">{catIcon}</span> {catName}
          </span>
        )}

        {/* Title */}
        <h3 className="text-[13px] font-bold text-[#F0F0F0] leading-snug line-clamp-2
                       group-hover:text-[#FF6B00] transition-colors min-h-[36px]">
          {offer.title}
        </h3>

        {/* Store & Social Proof */}
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-[#9A9A9A] font-semibold flex items-center gap-1">
            <span className="text-[9px]">🏪</span>
            {offer.store?.name}
          </p>
          {(offer._count?.coupons || 0) > 0 && (
            <span className="text-[9px] font-black text-orange-400 bg-orange-500/10 px-1 py-0.5 rounded flex items-center gap-1">
              {offer._count?.coupons} طلب
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="mt-auto pt-2.5 border-t border-white/[0.05] flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded-lg border border-white/5 transition-colors group-hover:border-[#FF6B00]/20">
            <RiMapPin2Line size={12} className="text-[#FF6B00] flex-shrink-0" />
            <span className="text-[10px] font-black text-[#9A9A9A] truncate max-w-[80px] group-hover:text-white transition-colors">
              {offer.store?.area || 'الزقازيق'}
            </span>
          </div>
          <span className={`text-[10px] font-black ${expiryColor}`}>{expiryText}</span>
        </div>

        {/* CTA */}
        <div
          className="mt-1 w-full py-1.5 text-center text-[11px] font-black text-[#FF6B00]
                     bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-lg
                     group-hover:bg-[#FF6B00] group-hover:text-white group-hover:border-[#FF6B00]
                     group-hover:shadow-[0_4px_12px_rgba(255,107,0,0.3)]
                     transition-all duration-200"
        >
          🏷️ احصل على العرض
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Skeleton ──────────────────────────────────── */
export const SkeletonCard = () => (
  <div className="bg-[#252525] border border-white/[0.07] rounded-xl overflow-hidden">
    <div className="h-32 skeleton-shimmer" />
    <div className="px-3 pt-6 pb-3 space-y-2.5">
      <div className="h-2 w-1/3 skeleton-shimmer rounded-full" />
      <div className="h-3.5 w-full skeleton-shimmer rounded-full" />
      <div className="h-3.5 w-3/4 skeleton-shimmer rounded-full" />
      <div className="h-2.5 w-1/2 skeleton-shimmer rounded-full" />
      <div className="h-8 w-full skeleton-shimmer rounded-lg mt-1.5" />
    </div>
  </div>
);
