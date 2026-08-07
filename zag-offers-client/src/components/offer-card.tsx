"use client";

import React, { useState, useEffect } from 'react';
import { 
  RiMapPin2Line, RiHeartFill, RiStore3Line,
  RiRestaurant2Fill, RiCupFill, RiShirtFill, 
  RiHeartPulseFill, RiMagicFill, RiHospitalFill, 
  RiShoppingCartFill, RiBookOpenFill, RiCarWashingFill, 
  RiHammerFill, RiSparklingFill, RiScissors2Fill,
  RiCake3Fill, RiGiftFill, RiGamepadFill, RiBearSmileFill,
  RiHomeHeartFill
} from 'react-icons/ri';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { API_URL } from '@/lib/constants';
import { resolveImageUrl, calculateDaysLeft, formatDiscount } from '@/lib/utils';

interface Offer {
  id: string;
  title: string;
  discount: string;
  endDate: string;
  images: string[];
  isFeatured?: boolean;
  originalPrice?: number;
  discountedPrice?: number;
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
    <div
      onClick={() => router.push(`/offers/${offer.id}`)}
      className="global-card group relative bg-[#101A2B] border border-[#25344A] rounded-[20px] overflow-hidden hover:border-[#FF8A32]/55 hover:shadow-[0_18px_42px_rgba(0,0,0,0.24)]
                 transition-all duration-200 flex flex-col h-full cursor-pointer"
    >
      {/* ─── Header ─────────────────────────────────── */}
      <div className="relative h-[240px] bg-[#18253A] overflow-hidden flex-shrink-0">

        {offerImage && (
          <Image
            src={offerImage}
            alt={offer.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            {...(priority ? { preload: true } : { loading: 'lazy' as const })}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}

        {!offerImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#708198]">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#354761] bg-[#1B2A42]">{catIcon}</span>
            <span className="text-xs font-medium">صورة العرض غير متاحة</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/10" />

        {offer.isFeatured && (
          <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-[#FFF3E8]
                          text-[#B84C00] text-[11px] font-semibold rounded-lg">
            مميز
          </div>
        )}

        <div className="absolute top-3 right-3 z-10 px-2.5 py-1
                        bg-[#FF8A32] text-[#07101F] text-xs font-bold rounded-lg">
          {discountDisplay}
        </div>

        <button
          onClick={toggleFav}
          className={`absolute bottom-3 left-3 z-10 p-2 rounded-xl backdrop-blur-md border transition-all
            ${isFav
              ? 'bg-red-500/20 border-red-500/50 text-red-400'
              : 'bg-black/30 border-white/10 text-white/40 hover:text-white hover:border-white/30'}`}
        >
          <RiHeartFill size={16} className={isFav ? 'text-red-500' : 'text-white/70'} />
        </button>

        <div className="absolute bottom-3 right-3 z-20
                        w-10 h-10 rounded-xl border-2 border-white/80
                        bg-[#0F1A2B] overflow-hidden shadow-lg
                        flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105">
          {logoUrl
            ? <Image
                src={logoUrl}
                alt={offer.store?.name || 'Store Logo'}
                width={40}
                height={40}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            : <div className="text-sm font-bold text-white">{offer.store.name.trim().charAt(0)}</div>
          }
        </div>
      </div>

      {/* ─── Body ────────────────────────────────────── */}
      <div className="flex flex-col flex-1 px-5 pt-5 pb-5 gap-3">

        {catName && (
          <span className="text-[13px] font-semibold text-[#FF8A3D] flex items-center gap-1.5">
            <span className="opacity-80">{catIcon}</span> {catName}
          </span>
        )}

        <h3 className="text-lg font-bold text-[#F0F0F0] leading-7 line-clamp-2
                       group-hover:text-[#FF8A3D] transition-colors min-h-[56px]">
          {offer.title}
        </h3>

        {offer.discountedPrice ? (
          <div className="flex items-baseline gap-2" dir="ltr">
            <span className="price text-xl font-bold text-[#FF7A1A]">
              {offer.discountedPrice} ج.م
            </span>
            {offer.originalPrice && (
              <span className="price text-xs text-[#8FA0B8] line-through font-normal">
                {offer.originalPrice} ج.م
              </span>
            )}
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <p className="text-sm text-[#B2BED0] font-medium flex items-center gap-1.5 truncate max-w-[75%]">
            <RiStore3Line size={14} className="text-[#71839B]" />
            {offer.store?.name}
          </p>
          {(offer._count?.coupons || 0) > 0 && (
            <span className="text-[11px] font-medium text-orange-300 bg-orange-500/10 px-2 py-1 rounded-lg flex items-center gap-1 flex-shrink-0">
              {offer._count?.coupons} طلب
            </span>
          )}
        </div>

        <div className="mt-auto pt-3 border-t border-[#2A3A52]/70 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <RiMapPin2Line size={14} className="text-[#FF6B00] flex-shrink-0" />
            <span className="text-xs font-normal text-[#8FA0B8] truncate group-hover:text-white transition-colors">
              {offer.store?.area || 'الزقازيق'}
            </span>
          </div>
          <span className={`text-xs font-medium flex-shrink-0 ${expiryColor}`}>{expiryText}</span>
        </div>

        <div
          className="mt-1 w-full py-3 text-center text-[15px] font-bold text-[#FF7A1A]
                     bg-[#FF6B00]/10 border border-[#FF6B00]/25 rounded-xl
                     group-hover:bg-[#FF6B00] group-hover:text-white group-hover:border-[#FF6B00]
                     group-hover:shadow-[0_3px_10px_rgba(255,107,0,0.25)]
                     transition-all duration-200"
        >
          عرض التفاصيل
        </div>
      </div>
    </div>
  );
}

/* ─── Skeleton ──────────────────────────────────── */
export const SkeletonCard = () => (
  <div className="bg-[#0F1A2B] border border-[#2A3A52] rounded-2xl overflow-hidden">
    <div className="h-[240px] skeleton-shimmer" />
    <div className="px-4 py-4 space-y-3">
      <div className="h-1.5 w-1/3 skeleton-shimmer rounded-full" />
      <div className="h-3 w-full skeleton-shimmer rounded-full" />
      <div className="h-2.5 w-3/4 skeleton-shimmer rounded-full" />
      <div className="h-2 w-1/2 skeleton-shimmer rounded-full" />
      <div className="h-9 w-full skeleton-shimmer rounded-xl mt-1" />
    </div>
  </div>
);

