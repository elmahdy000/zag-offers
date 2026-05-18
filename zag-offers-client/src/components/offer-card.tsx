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
import { resolveImageUrl, calculateDaysLeft, formatDiscount } from '@/lib/utils';

interface Offer {
  id: string;
  title: string;
  discount: string;
  endDate: string;
  images: string[];
  featured?: boolean;
  originalPrice?: number;
  newPrice?: number;
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

    try {
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      setTimeout(() => {
        setIsFav(favs.some((f: { id: string }) => f.id === offer.id));
      }, 0);
    } catch { /* silent */ }
  }, [offer?.id]);

  if (!offer || !offer.id) {
    console.error('Invalid offer data:', offer);
    return null;
  }

  if (!offer.store || !offer.store.id) {
    console.error('Invalid store data:', offer.store);
    return null;
  }

  const daysLeft = calculateDaysLeft(offer.endDate);

  const logoUrl = resolveImageUrl(offer.store?.logo);
  const catName = offer.store?.category?.name || '';
  const catIcon = CAT_ICONS[catName] || CAT_ICONS.default;
  const catGrad = CAT_GRADIENTS[catName] || CAT_GRADIENTS.default;

  const expiryColor =
    daysLeft <= 0 ? 'text-red-400' : daysLeft <= 3 ? 'text-orange-400' : 'text-[#9A9A9A]';
  const expiryText =
    daysLeft <= 0  ? 'منتهي'
    : daysLeft === 1 ? 'آخر يوم!'
    : daysLeft <= 3  ? `${daysLeft} أيام`
    : `${daysLeft} يوم`;

  const discountDisplay = formatDiscount(offer.discount?.trim() || '') || '0%';

  const toggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('token');

    if (token) {
      setIsFav(prev => !prev);
      try {
        const res = await fetch(`${API_URL}/favorites/toggle/${offer.id}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setIsFav(data.favorited);
          try {
            const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
            const updated = data.favorited
              ? [...favs.filter((f: { id: string }) => f.id !== offer.id), offer]
              : favs.filter((f: { id: string }) => f.id !== offer.id);
            localStorage.setItem('favorites', JSON.stringify(updated));
          } catch { /* silent */ }
        } else {
          setIsFav(prev => !prev);
        }
      } catch {
        setIsFav(prev => !prev);
      }
    } else {
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
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      onClick={() => router.push(`/offers/${offer.id}`)}
      className="group relative bg-[#252525] border border-white/[0.06] rounded-lg overflow-hidden hover:border-[#FF6B00]/30 hover:shadow-[0_8px_20px_rgba(0,0,0,0.35)]
                 transition-all duration-200 flex flex-col h-full cursor-pointer"
    >
      {/* ─── Header ─────────────────────────────────── */}
      <div className={`relative h-[116px] bg-gradient-to-br ${catGrad} overflow-hidden flex-shrink-0`}>

        {offerImage && (
          <Image
            src={offerImage}
            alt={offer.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            quality={75}
            priority={priority}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#252525] via-transparent to-black/5" />

        {offer.featured && (
          <div className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-400
                          text-[#1a1a1a] text-[7px] font-semibold rounded-md shadow-lg">
            ⭐ مميز
          </div>
        )}

        <div className="absolute top-1.5 right-1.5 z-10 px-1.5 py-0.5
                        bg-gradient-to-br from-[#FF6B00] to-[#D95A00]
                        text-white text-[9px] font-black rounded-[4px]
                        shadow-[0_3px_10px_rgba(255,107,0,0.35)]">
          {discountDisplay}
        </div>

        <button
          onClick={toggleFav}
          className={`absolute bottom-1.5 left-1.5 z-10 p-1 rounded-md backdrop-blur-md border transition-all
            ${isFav
              ? 'bg-red-500/20 border-red-500/50 text-red-400'
              : 'bg-black/30 border-white/10 text-white/40 hover:text-white hover:border-white/30'}`}
        >
          <RiHeartFill size={11} className={isFav ? 'text-red-500' : 'text-white/40'} />
        </button>

        <div className="absolute -bottom-3 right-2.5 z-20
                        w-8 h-8 rounded-md border-2 border-[#252525]
                        bg-[#1E1E1E] overflow-hidden shadow-lg
                        flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105">
          {logoUrl
            ? <Image
                src={logoUrl}
                alt={offer.store?.name || 'Store Logo'}
                width={32}
                height={32}
                className="w-full h-full object-cover"
                loading="lazy"
                sizes="32px"
                quality={80}
              />
            : <div className="text-white/20 scale-75">{catIcon}</div>
          }
        </div>
      </div>

      {/* ─── Body ────────────────────────────────────── */}
      <div className="flex flex-col flex-1 px-2.5 pt-3 pb-2 gap-0.5">

        {catName && (
          <span className="text-[7px] font-semibold text-[#FF6B00] uppercase tracking-widest flex items-center gap-1">
            <span className="scale-75 opacity-70">{catIcon}</span> {catName}
          </span>
        )}

        <h3 className="text-[10.5px] font-semibold text-[#F0F0F0] leading-snug line-clamp-2
                       group-hover:text-[#FF6B00] transition-colors min-h-[28px]">
          {offer.title}
        </h3>

        {offer.newPrice ? (
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-[13px] font-bold text-[#FF6B00]">
              {offer.newPrice} ج.م
            </span>
            {offer.originalPrice && (
              <span className="text-[8px] text-[#9A9A9A] line-through font-semibold">
                {offer.originalPrice} ج.م
              </span>
            )}
          </div>
        ) : null}

        <div className="flex items-center justify-between mt-0.5">
          <p className="text-[8px] text-[#9A9A9A] font-semibold flex items-center gap-1 truncate max-w-[70%]">
            <span className="opacity-50">🏪</span>
            {offer.store?.name}
          </p>
          {(offer._count?.coupons || 0) > 0 && (
            <span className="text-[7px] font-semibold text-orange-400 bg-orange-500/5 px-1 py-0.5 rounded flex items-center gap-1 flex-shrink-0">
              {offer._count?.coupons} طلب
            </span>
          )}
        </div>

        <div className="mt-auto pt-1.5 border-t border-white/[0.04] flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/[0.03] rounded-md border border-white/5 transition-colors group-hover:border-[#FF6B00]/20">
            <RiMapPin2Line size={9} className="text-[#FF6B00] flex-shrink-0" />
            <span className="text-[7px] font-semibold text-[#8A8A8A] truncate max-w-[65px] group-hover:text-white transition-colors">
              {offer.store?.area || 'الزقازيق'}
            </span>
          </div>
          <span className={`text-[7px] font-semibold ${expiryColor}`}>{expiryText}</span>
        </div>

        <div
          className="mt-1 w-full py-1 text-center text-[9px] font-semibold text-[#FF6B00]
                     bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-md
                     group-hover:bg-[#FF6B00] group-hover:text-white group-hover:border-[#FF6B00]
                     group-hover:shadow-[0_3px_10px_rgba(255,107,0,0.25)]
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
  <div className="bg-[#252525] border border-white/[0.07] rounded-lg overflow-hidden">
    <div className="h-[116px] skeleton-shimmer" />
    <div className="px-2.5 pt-3 pb-2 space-y-2">
      <div className="h-1.5 w-1/3 skeleton-shimmer rounded-full" />
      <div className="h-3 w-full skeleton-shimmer rounded-full" />
      <div className="h-2.5 w-3/4 skeleton-shimmer rounded-full" />
      <div className="h-2 w-1/2 skeleton-shimmer rounded-full" />
      <div className="h-6 w-full skeleton-shimmer rounded-md mt-1" />
    </div>
  </div>
);

