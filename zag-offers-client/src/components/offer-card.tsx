"use client";

import React, { useState, useEffect } from 'react';
import {
  RiMapPin2Line, RiHeartFill, RiStore3Line,
  RiArrowLeftLine, RiTimeLine, RiCheckboxCircleFill, RiStarFill
} from 'react-icons/ri';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { API_URL } from '@/lib/constants';
import { resolveImageUrl, calculateDaysLeft } from '@/lib/utils';
import { resolveOfferPricing, formatPrice } from '@/lib/offer-pricing';
import { CategoryIcon } from '@/components/category-icon';

interface Offer {
  id: string;
  title: string;
  discount: string;
  endDate: string;
  images: string[];
  isFeatured?: boolean;
  originalPrice?: number | null;
  /** Backend/Prisma field — the final price after the discount. */
  newPrice?: number | null;
  store: {
    id: string;
    name: string;
    logo?: string | null;
    area?: string | null;
    rating?: number | null;
    ratingAvg?: number | null;
    status?: string | null;
    isVerified?: boolean;
    category?: {
      id?: string;
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

const CAT_ICONS_SIZE = 14;

export function OfferCard({ offer, priority = false }: OfferCardProps) {
  const router = useRouter();
  const [isFav, setIsFav] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

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

  // Single pricing authority — mirrors the Flutter app's OfferPricingResult.
  const pricing = resolveOfferPricing(offer);

  const logoUrl = !logoFailed ? resolveImageUrl(offer.store?.logo) : null;
  const catName = offer.store?.category?.name || '';

  const expiryColor =
    daysLeft <= 0 ? 'text-red-400' : daysLeft <= 3 ? 'text-orange-400' : 'text-[#9A9A9A]';
  const expiryText =
    daysLeft <= 0  ? 'منتهي'
    : daysLeft === 1 ? 'آخر يوم!'
    : daysLeft <= 3  ? `${daysLeft} أيام`
    : `${daysLeft} يوم`;

  const discountDisplay = pricing.topDiscountBadge || 'خصم عام';

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

  const offerImage = !imageFailed && offer.images && offer.images.length > 0
    ? resolveImageUrl(offer.images[0])
    : null;


  const storeInitial = offer.store.name.trim().charAt(0) || 'م';

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/offers/${offer.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(`/offers/${offer.id}`);
        }
      }}
      className="offer-card global-card group relative bg-white dark:bg-[#101A2B] border border-gray-200/90 dark:border-[#25344A] rounded-[22px] overflow-hidden hover:-translate-y-1.5 hover:border-[#FF6500]/60 hover:shadow-[0_20px_45px_rgba(255,101,0,0.14)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6500] focus-visible:border-transparent transition-all duration-300 flex flex-col h-full cursor-pointer select-none"
    >
      {/* ─── Media Header ─────────────────────────────────── */}
      <div className="offer-card-media relative h-[210px] bg-gray-100 dark:bg-[#18253A] overflow-hidden flex-shrink-0">

        {offerImage ? (
          <Image
            src={offerImage}
            alt={offer.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            {...(priority ? { preload: true } : { loading: 'lazy' as const })}
            onError={() => setImageFailed(true)}
          />
        ) : (
          /* Branded Designer Graphic Voucher (No depressing broken image text) */
          <div className="offer-image-fallback absolute inset-0 flex flex-col items-center justify-center p-5 text-center bg-gradient-to-br from-[#FFF4EA] via-[#FFEADB] to-[#FFD5BA] dark:from-[#0E1A2C] dark:via-[#16253D] dark:to-[#0B1526] overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-white/95 dark:bg-[#1B2940] border border-[#FF6500]/25 shadow-md flex items-center justify-center text-[#FF6500] text-2xl mb-2 group-hover:scale-110 transition-transform">
              <CategoryIcon name={catName} size={24} />
            </div>
            <span className="text-xs font-black text-[#C74E00] dark:text-[#FF8A3D] block">
              {catName || 'عرض خاص'}
            </span>
            <span className="text-sm font-bold text-gray-800 dark:text-gray-100 line-clamp-1 mt-0.5">
              {offer.store?.name}
            </span>
          </div>
        )}

        {/* Subtle top image gradient for badge legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/25 pointer-events-none" />

        {/* Favorite Button (Clean Glass Circle at Top Left - 44px Touch Target) */}
        <button
          type="button"
          onClick={toggleFav}
          aria-label={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          className={`absolute top-3 left-3 z-20 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full backdrop-blur-md border flex items-center justify-center transition-all duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6500]
            ${isFav
              ? 'bg-white text-red-500 border-red-200 shadow-md shadow-red-500/20 scale-105'
              : 'bg-white/90 dark:bg-[#071426]/75 border-black/5 dark:border-white/15 text-gray-600 dark:text-white/80 hover:text-red-500 hover:scale-110 active:scale-95'}`}
        >
          <RiHeartFill size={18} className={isFav ? 'text-red-500' : 'currentColor'} />
        </button>

        {/* Badges Container (Top Right - Dynamic Flex Wrap) */}
        <div className="absolute top-3 right-3 z-10 flex flex-wrap items-center gap-1.5 max-w-[calc(100%-60px)]">
          <div className="px-3 py-1 bg-gradient-to-r from-[#FF4500] to-[#FF6500] text-white text-xs font-black rounded-full shadow-[0_4px_12px_rgba(255,69,0,0.38)] tracking-tight whitespace-nowrap">
            {discountDisplay}
          </div>
          {offer.isFeatured && (
            <div className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black rounded-full shadow-sm flex items-center gap-1 backdrop-blur-sm whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              مميز
            </div>
          )}
        </div>

        {/* Store Logo (Bottom Right) with colorful fallback avatar */}
        <div className="offer-store-logo absolute bottom-3 right-3 z-20 w-11 h-11 rounded-2xl border-2 border-white dark:border-[#101A2B] bg-white dark:bg-[#101A2B] overflow-hidden shadow-md flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={offer.store?.name || 'Store Logo'}
              width={44}
              height={44}
              className="w-full h-full object-cover"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#FF6500] to-[#E05500] text-white font-black text-sm flex items-center justify-center shadow-inner">
              {storeInitial}
            </div>
          )}
        </div>
      </div>

      {/* ─── Card Body ────────────────────────────────────── */}
      <div className="offer-card-body flex flex-col flex-1 p-4 sm:p-5 gap-2.5">
        {/* Category & Coupon Count */}
        <div className="flex items-center justify-between gap-2">
          {catName && (
            <span className="text-xs font-bold text-[#FF6500] dark:text-[#FF8A3D] flex items-center gap-1.5 bg-[#FF6500]/10 dark:bg-[#FF6500]/15 px-2.5 py-0.5 rounded-lg">
              <span className="opacity-90 inline-flex"><CategoryIcon name={catName} size={CAT_ICONS_SIZE} /></span>
              <span>{catName}</span>
            </span>
          )}
          {(offer._count?.coupons || 0) > 0 && (
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/25 px-2 py-0.5 rounded-lg flex items-center gap-1">
              {offer._count?.coupons} طلب
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-[#102039] dark:text-[#F0F0F0] leading-snug line-clamp-2 group-hover:text-[#FF6500] transition-colors">
          {offer.title}
        </h3>

        {/* Pricing — driven by the shared pricing authority */}
        {pricing.finalPrice !== null ? (
          <div className="flex items-baseline justify-between pt-0.5">
            <div className="flex items-baseline gap-2" dir="ltr">
              <span className="text-lg font-black text-[#FF6500] dark:text-[#FF7A1A]">
                {formatPrice(pricing.finalPrice)} <small className="text-xs font-bold">ج.م</small>
              </span>
              {pricing.originalPrice !== null && (
                <span className="text-xs text-gray-400 dark:text-[#8FA0B8] line-through font-medium">
                  {formatPrice(pricing.originalPrice)} ج.م
                </span>
              )}
            </div>
            {pricing.hasSavings && pricing.savingsAmount > 0 && (
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                وفرت {formatPrice(pricing.savingsAmount)} ج.م
              </span>
            )}
          </div>
        ) : pricing.topDiscountBadge ? (
          <div className="pt-0.5">
            <span className="inline-flex items-center rounded-lg bg-[#FF6500]/10 px-2 py-0.5 text-[11px] font-black text-[#FF6500] dark:bg-[#FF6500]/15 dark:text-[#FF8A3D]">
              {pricing.topDiscountBadge} على الفاتورة
            </span>
          </div>
        ) : null}

        {/* Store Name, Verified Badge, Rating & Area */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-[#8FA0B8] pt-1">
          <div className="flex items-center gap-1.5 font-bold truncate max-w-[62%] text-gray-700 dark:text-[#CBD5E1]">
            <RiStore3Line size={15} className="text-[#FF6500] flex-shrink-0" />
            <span className="truncate">{offer.store?.name}</span>
            {(offer.store?.isVerified || offer.store?.status === 'APPROVED') && (
              <span title="متجر معتمد ومسجل" aria-label="متجر معتمد ومسجل" className="inline-flex text-[#0284C7] flex-shrink-0">
                <RiCheckboxCircleFill size={14} />
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {((offer.store?.rating || 0) > 0 || (offer.store?.ratingAvg || 0) > 0) && (
              <span className="flex items-center gap-0.5 text-[11px] font-black text-amber-500 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                <RiStarFill size={11} className="text-[#F59E0B]" />
                <span>{((offer.store?.rating || offer.store?.ratingAvg) || 0).toFixed(1)}</span>
              </span>
            )}
            <div className="flex items-center gap-1 text-[11px]">
              <RiMapPin2Line size={13} className="text-[#FF6500]" />
              <span>{offer.store?.area || 'الزقازيق'}</span>
            </div>
          </div>
        </div>

        {/* Expiry Row */}
        <div className="mt-auto pt-2.5 border-t border-gray-100 dark:border-[#25344A] flex items-center justify-between text-xs">
          <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <RiTimeLine size={13} /> مدة العرض:
          </span>
          <span className={`text-xs ${expiryColor}`}>{expiryText}</span>
        </div>

        {/* CTA Button */}
        <div className="offer-card-btn mt-1">
          <span>عرض التفاصيل</span>
          <RiArrowLeftLine size={16} className="transition-transform duration-200 group-hover:-translate-x-1" />
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

