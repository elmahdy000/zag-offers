"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiTimeLine, RiMapPin2Fill, RiShareLine, RiHeartFill, RiPhoneFill,
  RiShieldCheckFill, RiTicket2Fill, RiStore3Fill,
  RiArrowLeftSLine, RiArrowRightSLine, RiFileCopyLine, RiCheckboxCircleFill, 
  RiCloseCircleFill, RiErrorWarningFill, RiWhatsappFill, RiBuilding2Fill,
  RiHome5Line, RiShoppingBag3Line, RiPriceTag3Fill, RiZoomInLine, RiCloseLine,
  RiSparklingFill, RiQrCodeLine, RiFireFill, RiFlashlightFill, RiStarFill
} from 'react-icons/ri';
import { ReviewSection } from '@/components/ReviewSection';
import { ErrorDisplay } from '@/components/error-display';
import { OfferCard } from '@/components/offer-card';
import Link from 'next/link';
import Image from 'next/image';
import { API_URL } from '@/lib/constants';
import { resolveImageUrl } from '@/lib/utils';
import { resolveOfferPricing, formatPrice } from '@/lib/offer-pricing';
import { QRCodeSVG } from 'qrcode.react';
import { Lightbulb, Loader2 } from 'lucide-react';

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: string;
  endDate: string;
  images: string[];
  originalPrice?: number | null;
  /** Backend/Prisma field — the final price after the discount. */
  newPrice?: number | null;
  status: 'ACTIVE' | 'PENDING' | 'EXPIRED' | string;
  store: {
    id: string;
    name: string;
    logo?: string | null;
    area: string;
    address?: string;
    phone?: string;
    whatsapp?: string;
    locationUrl?: string;
    rating?: number | null;
    ratingAvg?: number | null;
    status?: string | null;
    isVerified?: boolean;
    category?: {
      id?: string;
      name: string;
    };
  };
}

interface Favorite {
  offerId: string;
}

/* ─── Toast System ─────────────────────────────────── */
type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; msg: string; type: ToastType; }

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  const icons = { 
    success: <RiCheckboxCircleFill size={20} className="shrink-0 text-emerald-500 dark:text-emerald-400" />, 
    error: <RiCloseCircleFill size={20} className="shrink-0 text-rose-500 dark:text-rose-400" />, 
    info: <RiErrorWarningFill size={20} className="shrink-0 text-[#FF6500]" /> 
  };
  const colors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/80 dark:border-emerald-500/30 dark:text-emerald-200 shadow-emerald-500/10',
    error:   'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/80 dark:border-rose-500/30 dark:text-rose-200 shadow-rose-500/10',
    info:    'bg-orange-50 border-orange-200 text-orange-950 dark:bg-orange-950/80 dark:border-orange-500/30 dark:text-orange-200 shadow-orange-500/10',
  };
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[999] flex flex-col gap-2.5 w-full max-w-sm px-4 pointer-events-none" dir="rtl">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl font-bold text-sm shadow-xl ${colors[t.type]}`}
          >
            {icons[t.type]}
            <span className="flex-1">{t.msg}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ─── Offer Details Page ─────────────────────────────── */
export default function OfferDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);
  const [showLocations, setShowLocations] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('ZAG-XXXXXX');
  const [isFav, setIsFav] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [isVerifiedForReview, setIsVerifiedForReview] = useState(false);
  
  // Related Offers state
  const [relatedOffers, setRelatedOffers] = useState<Offer[]>([]);
  const [showStickyBar, setShowStickyBar] = useState(false);
  // Hydration-safe clock — never call Date.now() during render.
  const [nowMs, setNowMs] = useState(0);

  const couponCardRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string, type: ToastType = 'info') => {
    const t = { id: Date.now(), msg, type };
    setToasts(prev => [...prev, t]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3500);
  }, []);

  // Fetch offer details
  useEffect(() => {
    const fetchOffer = async () => {
      const cacheKey = `cache_offer_detail_${id}`;
      const cached = localStorage.getItem(cacheKey);
      const cacheTsKey = `${cacheKey}_ts`;
      const cacheTs = parseInt(localStorage.getItem(cacheTsKey) || '0', 10);
      if (cached) {
        const age = Date.now() - cacheTs;
        if (age > 5 * 60 * 1000) {
          localStorage.removeItem(cacheKey);
          localStorage.removeItem(cacheTsKey);
        } else {
          setOffer(JSON.parse(cached));
          setLoading(false);
        }
      }

      try {
        const res = await fetch(`${API_URL}/offers/${id}`);
        if (res.ok) {
          const data = await res.json();
          setOffer(data);
          localStorage.setItem(cacheKey, JSON.stringify(data));
          localStorage.setItem(cacheTsKey, String(Date.now()));
          
          const token = localStorage.getItem('token');
          if (token) {
            try {
              const favRes = await fetch(`${API_URL}/favorites`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (favRes.ok) {
                const favData = await favRes.json();
                setIsFav(favData.some((fav: Favorite) => fav.offerId === data.id));
              }
            } catch { /* silent */ }
          } else {
            const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
            setIsFav(favs.some((f: { id: string }) => f.id === data.id));
          }
        } else {
          setError('فشل في تحميل بيانات العرض');
        }
      } catch { 
        setError('خطأ في الاتصال بالسيرفر');
      } finally { 
        setLoading(false); 
      }
    };
    fetchOffer();
    
    const fetchReviews = async () => {
      try {
        const res = await fetch(`${API_URL}/reviews/offer/${id}`);
        if (res.ok) setReviews(await res.json());
      } catch { /* silent */ }
    };

    const checkVerification = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/coupons/check-verification/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setIsVerifiedForReview(data.isVerified);
        }
      } catch { /* silent */ }
    };

    fetchReviews();
    checkVerification();

    const handleOnline = () => fetchOffer();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [id]);

  // Fetch related offers (from same store or trending)
  useEffect(() => {
    if (!offer?.id) return;
    const fetchRelated = async () => {
      try {
        let list: Offer[] = [];
        if (offer.store?.id) {
          const storeRes = await fetch(`${API_URL}/offers/store/${offer.store.id}`);
          if (storeRes.ok) {
            const storeData: Offer[] | { items?: Offer[] } = await storeRes.json();
            const storeOffers = (Array.isArray(storeData) ? storeData : storeData.items || []).filter(
              (candidate) => candidate.id !== offer.id,
            );
            list = [...storeOffers];
          }
        }
        
        // If store has fewer than 3 offers, fill with trending offers
        if (list.length < 3) {
          const trendRes = await fetch(`${API_URL}/recommendations/trending`);
          if (trendRes.ok) {
            const trendData: Offer[] | { items?: Offer[] } = await trendRes.json();
            const trendOffers = (Array.isArray(trendData) ? trendData : trendData.items || []).filter(
              (candidate) => candidate.id !== offer.id,
            );
            const existingIds = new Set(list.map((candidate) => candidate.id));
            for (const item of trendOffers) {
              if (!existingIds.has(item.id)) {
                list.push(item);
                existingIds.add(item.id);
              }
            }
          }
        }
        setRelatedOffers(list.slice(0, 3));
      } catch {
        /* silent */
      }
    };
    fetchRelated();
  }, [offer?.id, offer?.store?.id]);

  // Track scroll position to show sticky mobile bar
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 300;
      setShowStickyBar(scrolled);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Countdown clock — state-backed so render stays pure.
  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    tick();
    const interval = window.setInterval(tick, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  // Handle escape key to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowLocations(false);
        setLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleFav = async () => {
    if (!navigator.onLine) {
      showToast('هذا الإجراء يحتاج اتصال بالإنترنت', 'error');
      return;
    }
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        const res = await fetch(`${API_URL}/favorites/toggle/${id}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setIsFav(data.favorited);
          showToast(data.favorited ? 'تمت إضافة العرض إلى المفضلة ❤️' : 'تمت إزالة العرض من المفضلة', data.favorited ? 'success' : 'info');
        }
      } catch {
        showToast('حدث خطأ أثناء تحديث المفضلة', 'error');
      }
    } else {
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      const updated = isFav ? favs.filter((f: { id: string }) => f.id !== offer?.id) : [...favs, offer];
      localStorage.setItem('favorites', JSON.stringify(updated));
      setIsFav(!isFav);
      showToast(isFav ? 'تمت إزالة العرض من المفضلة' : 'تمت إضافة العرض إلى المفضلة ❤️', isFav ? 'info' : 'success');
    }
  };

  const handleShare = async () => {
    const title = offer?.title || 'عرض خاص في الزقازيق';
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = {
      title,
      text: `شاهد هذا العرض الحصري من ${offer?.store?.name || 'تطبيق عروض الزقازيق'}: ${title}`,
      url
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share dismissed
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        showToast('تم نسخ رابط العرض إلى الحافظة بنجاح! 📋', 'success');
      } catch {
        showToast('تعذر نسخ رابط العرض', 'error');
      }
    }
  };

  const handleGetCoupon = async () => {
    if (!navigator.onLine) {
      showToast('هذا الإجراء يحتاج اتصال بالإنترنت', 'error');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('يرجى تسجيل الدخول أولاً للحصول على الكوبون', 'info');
      setTimeout(() => router.push('/login'), 1500);
      return;
    }
    
    if (!offer || !offer.id) {
      showToast('العرض غير صالح', 'error');
      return;
    }
    
    if (offer.status !== 'ACTIVE' && offer.status !== 'PENDING') {
      showToast('هذا العرض غير متاح حالياً', 'error');
      return;
    }
    
    const endDate = new Date(offer.endDate);
    if (isNaN(endDate.getTime()) || endDate <= new Date()) {
      showToast('هذا العرض منتهي الصلاحية', 'error');
      return;
    }
    
    try {
      setIsCouponLoading(true);
      const res = await fetch(`${API_URL}/coupons/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ offerId: id })
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.code) {
          showToast('كود الكوبون غير صالح', 'error');
          return;
        }

        setCouponCode(data.code);
        setShowCoupon(true);
        showToast('تم إنشاء الكوبون بنجاح! 🎉', 'success');

        // Smooth scroll to coupon card on mobile
        setTimeout(() => {
          couponCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      } else {
        const err = await res.json();
        const status = res.status;

        if (status === 401) {
          showToast('انتهت جلستك، برجاء تسجيل الدخول مرة أخرى', 'error');
          setTimeout(() => router.push('/login'), 1500);
        } else if (status === 400) {
          showToast(err.message || 'لا يمكن الحصول على هذا الكوبون', 'error');
        } else if (status === 429) {
          showToast('لقد تجاوزت الحد المسموح من طلبات الكوبونات اليوم', 'error');
        } else {
          showToast(err.message || 'فشل في الحصول على الكوبون', 'error');
        }
      }
    } catch {
      showToast('حدث خطأ أثناء الاتصال بالسيرفر', 'error');
    } finally {
      setIsCouponLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    showToast('تم نسخ كود الخصم! 📋', 'success');
    setTimeout(() => setCopied(false), 2200);
  };

  /* Loading State */
  if (loading) return (
    <div className="offer-detail-page" dir="rtl">
      <div className="site-container offer-detail-container">
        {/* Skeleton Breadcrumbs */}
        <div className="h-5 w-56 bg-slate-200 dark:bg-white/5 rounded-lg animate-pulse mb-6" />
        
        <div className="offer-detail-grid">
          <div className="offer-detail-main space-y-6">
            <div className="aspect-[16/9] w-full bg-slate-200 dark:bg-white/5 rounded-[26px] animate-pulse" />
            <div className="p-7 bg-white dark:bg-[#101a2b] border border-slate-200 dark:border-[#293a52] rounded-[26px] space-y-5">
              <div className="h-6 w-32 bg-slate-200 dark:bg-white/5 rounded-full animate-pulse" />
              <div className="h-8 w-3/4 bg-slate-200 dark:bg-white/5 rounded-xl animate-pulse" />
              <div className="h-16 w-full bg-slate-200 dark:bg-white/5 rounded-2xl animate-pulse" />
              <div className="space-y-2 pt-4">
                <div className="h-4 w-full bg-slate-200 dark:bg-white/5 rounded-lg animate-pulse" />
                <div className="h-4 w-5/6 bg-slate-200 dark:bg-white/5 rounded-lg animate-pulse" />
                <div className="h-4 w-2/3 bg-slate-200 dark:bg-white/5 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
          <div className="offer-detail-sidebar space-y-5">
            <div className="h-64 bg-white dark:bg-[#101a2b] border border-slate-200 dark:border-[#293a52] rounded-[24px] animate-pulse" />
            <div className="h-72 bg-white dark:bg-[#101a2b] border border-slate-200 dark:border-[#293a52] rounded-[24px] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );

  /* Error State */
  if (error) return (
    <div className="offer-detail-page flex items-center justify-center" dir="rtl">
      <div className="site-container max-w-lg py-16">
        <ErrorDisplay message={error} onRetry={() => window.location.reload()} />
      </div>
    </div>
  );

  if (!offer) return null;

  /* Helper Calculations
   * The clock is kept in state so render stays pure (react-hooks/purity).
   * It ticks once a minute, which is plenty for day-granularity countdowns. */
  const endDate = offer.endDate ? new Date(offer.endDate) : null;
  const endMs = endDate && !isNaN(endDate.getTime()) ? endDate.getTime() : null;
  const hasClock = nowMs > 0;
  const hasInvalidEndDate = endDate !== null && endMs === null;
  const isExpired = hasInvalidEndDate || (endMs !== null && hasClock && endMs <= nowMs);
  const daysLeft = endMs !== null && hasClock ? Math.max(0, Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24))) : null;

  // Single pricing authority — mirrors the Flutter app's OfferPricingResult.
  const pricing = resolveOfferPricing(offer);
  const savings = pricing.hasSavings ? pricing.savingsAmount : null;
  const discountPercent = pricing.savingsPercentage > 0 ? pricing.savingsPercentage : null;

  const logoUrl = resolveImageUrl(offer.store?.logo);
  const images = (offer.images && offer.images.length > 0) ? offer.images : [];
  const currentImageUrl = images.length > 0 ? resolveImageUrl(images[activeImg]) : null;

  const getCleanPhone = (val?: string) => {
    if (!val) return '';
    return val.replace(/\D/g, '');
  };

  const getWhatsAppInternational = (val?: string) => {
    let p = getCleanPhone(val);
    if (!p) return '';
    if (p.startsWith('01')) p = '20' + p.substring(1);
    if (!p.startsWith('20')) p = '20' + p;
    return p;
  };

  const storePhone = getCleanPhone(offer.store?.phone);
  const storeWhatsAppNumber = getWhatsAppInternational(offer.store?.whatsapp || offer.store?.phone);

  const couponWhatsAppUrl = `https://wa.me/${storeWhatsAppNumber || '201066711545'}?text=${encodeURIComponent(
    `السلام عليكم ورحمة الله،\nأريد تفعيل كود الخصم الخاص بعرض:\n*${offer.title}*\n🎟️ كود الكوبون: *${couponCode}*\n\nشكراً لكم!`
  )}`;

  const storeInquiryWhatsAppUrl = storeWhatsAppNumber ? `https://wa.me/${storeWhatsAppNumber}?text=${encodeURIComponent(
    `السلام عليكم، بخصوص عرض "${offer.title}" على تطبيق عروض الزقازيق:\nأود الاستفسار عن تفاصيل العرض.`
  )}` : null;

  return (
    <div className="offer-detail-page" dir="rtl">
      <ToastContainer toasts={toasts} />

      <div className="site-container offer-detail-container">

        {/* ─── Breadcrumbs ─────────────────────────────────── */}
        <nav aria-label="مسار التصفح" className="offer-breadcrumbs">
          <Link href="/" className="hover:text-[#FF6500] transition-colors">
            <RiHome5Line size={15} />
            <span>الرئيسية</span>
          </Link>
          <RiArrowLeftSLine size={14} className="text-slate-400 dark:text-slate-600 shrink-0" />
          <Link href="/offers" className="hover:text-[#FF6500] transition-colors">
            <RiShoppingBag3Line size={15} />
            <span>العروض</span>
          </Link>
          {offer.store?.category?.name && (
            <>
              <RiArrowLeftSLine size={14} className="text-slate-400 dark:text-slate-600 shrink-0" />
              {offer.store.category.id ? (
                // The `category` query param carries a category **id** — never a name.
                <Link href={`/offers?category=${encodeURIComponent(offer.store.category.id)}`} className="hover:text-[#FF6500] transition-colors">
                  <span>{offer.store.category.name}</span>
                </Link>
              ) : (
                <span>{offer.store.category.name}</span>
              )}
            </>
          )}
          <RiArrowLeftSLine size={14} className="text-slate-400 dark:text-slate-600 shrink-0" />
          <span className="truncate max-w-[280px] sm:max-w-md">{offer.title}</span>
        </nav>

        {/* ─── Main Grid Layout ────────────────────────────── */}
        <div className="offer-detail-grid">
          
          {/* Main Column */}
          <main className="offer-detail-main">
            <div className="offer-detail-card">
              
              {/* ─── Offer Media / Hero Visual ──────────────── */}
              <div className="offer-media group">
                {currentImageUrl && !imageError ? (
                  <>
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={activeImg}
                        src={currentImageUrl}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.4 }}
                        className="w-full h-full object-cover select-none cursor-pointer"
                        alt={offer.title}
                        onClick={() => setLightboxOpen(true)}
                        onError={() => setImageError(true)}
                      />
                    </AnimatePresence>

                    {/* Gradient Vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

                    {/* Image Counter & Zoom Indicator */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
                      {images.length > 1 && (
                        <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-black border border-white/10 shadow-lg">
                          {activeImg + 1} / {images.length}
                        </div>
                      )}
                      <button
                        onClick={() => setLightboxOpen(true)}
                        aria-label="تكبير الصورة"
                        className="p-2 rounded-xl bg-black/60 backdrop-blur-md text-white hover:text-[#FF6500] border border-white/10 transition-colors shadow-lg"
                      >
                        <RiZoomInLine size={18} />
                      </button>
                    </div>

                    {/* Carousel Navigation Arrows */}
                    {images.length > 1 && (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveImg(prev => (prev + 1) % images.length); }}
                          aria-label="الصورة التالية"
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-[#FF6500] backdrop-blur-md flex items-center justify-center text-white border border-white/15 opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-all shadow-xl hover:scale-105 active:scale-95"
                        >
                          <RiArrowLeftSLine size={24} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveImg(prev => (prev - 1 + images.length) % images.length); }}
                          aria-label="الصورة السابقة"
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-[#FF6500] backdrop-blur-md flex items-center justify-center text-white border border-white/15 opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-all shadow-xl hover:scale-105 active:scale-95"
                        >
                          <RiArrowRightSLine size={24} />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  /* Designer Branded Voucher Graphic Fallback */
                  <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-[#0c182b] via-[#15253d] to-[#1c3252] flex flex-col items-center justify-center p-8 text-center select-none">
                    <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[#FF6500]/15 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center max-w-md">
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#FF6500] to-[#FF8C33] p-1 shadow-2xl shadow-[#FF6500]/30 mb-4 flex items-center justify-center">
                        <div className="w-full h-full rounded-[22px] bg-[#0c182b]/80 backdrop-blur-md flex items-center justify-center text-white">
                          <RiTicket2Fill size={40} className="text-[#FF7A1A]" />
                        </div>
                      </div>

                      <span className="text-[11px] font-black uppercase tracking-widest text-[#FF7A1A] mb-2">
                        قسيمة خصم الزقازيق الحصرية
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mb-2">
                        {offer.title}
                      </h2>
                      <p className="text-xs font-bold text-slate-300">
                        {offer.store?.name} • {offer.store?.area}
                      </p>
                    </div>
                  </div>
                )}

                {/* Floating Discount Badge */}
                <div className="absolute top-5 right-5 flex flex-col items-end gap-2.5 pointer-events-none z-10">
                  <div className="bg-gradient-to-r from-[#FF4500] to-[#FF6500] text-white px-5 py-2.5 rounded-2xl font-black text-2xl sm:text-3xl shadow-2xl shadow-orange-600/40 border border-white/20 tracking-tight flex items-center gap-2">
                    <RiSparklingFill size={20} className="animate-pulse" />
                    <span>{pricing.topDiscountBadge || offer.discount}</span>
                  </div>
                  {pricing.originalPrice !== null && pricing.finalPrice !== null && (
                    <div className="bg-black/60 backdrop-blur-md px-3.5 py-1 rounded-xl text-xs font-black text-white/80 line-through border border-white/10 shadow-lg">
                      {formatPrice(pricing.originalPrice)} ج.م
                    </div>
                  )}
                </div>

                {/* Status Chip */}
                {isExpired ? (
                  <div className="absolute top-5 left-5 px-3 py-1.5 rounded-xl bg-rose-600 text-white font-black text-xs shadow-xl flex items-center gap-1.5 z-10">
                    <RiCloseCircleFill size={15} /> منتهي الصلاحية
                  </div>
                ) : daysLeft !== null && daysLeft <= 3 && daysLeft > 0 ? (
                  <div className="absolute top-5 left-5 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-xl animate-pulse flex items-center gap-1.5 z-10">
                    <RiTimeLine size={15} /> ينتهي قريباً!
                  </div>
                ) : null}
              </div>
              
              {/* ─── Gallery Thumbnails ────────────────────── */}
              {images.length > 1 && (
                <div className="px-7 pt-4 pb-2 flex gap-3 overflow-x-auto scrollbar-hide border-b border-slate-100 dark:border-white/5">
                  {images.map((img: string, i: number) => {
                    const thumbUrl = resolveImageUrl(img);
                    const isActive = i === activeImg;
                    return (
                      <button 
                        key={i}
                        onClick={() => { setActiveImg(i); setImageError(false); }}
                        className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                          isActive 
                            ? 'border-[#FF6500] ring-2 ring-[#FF6500]/30 scale-95 shadow-lg' 
                            : 'border-slate-200 dark:border-white/10 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <Image 
                          src={thumbUrl ?? '/placeholder-offer.jpg'} 
                          alt=""
                          fill
                          className="object-cover" 
                          sizes="80px"
                          quality={60}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
              
              {/* ─── Offer Details Body ────────────────────── */}
              <div className="offer-detail-body">
                
                {/* Title & Actions Row */}
                <div className="offer-title-row">
                  <div>
                    <span className="offer-category-label">
                      <RiPriceTag3Fill size={13} />
                      {offer.store?.category?.name || 'عرض مميز'}
                    </span>
                    <h1>{offer.title}</h1>
                  </div>
                  <div className="offer-actions flex items-center gap-2">
                    <button 
                      type="button"
                      aria-label="مشاركة العرض" 
                      onClick={handleShare}
                      title="مشاركة العرض"
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl p-2.5 text-slate-500 dark:text-slate-300 hover:text-[#FF6500] hover:bg-[#FF6500]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6500] transition-all"
                    >
                      <RiShareLine size={20} />
                    </button>
                    <button 
                      type="button"
                      aria-label={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"} 
                      onClick={toggleFav} 
                      className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl p-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6500] transition-all ${isFav ? 'is-favorite text-red-500 bg-red-500/10' : 'text-slate-500 dark:text-slate-300 hover:text-red-500 hover:bg-red-500/10'}`}
                      title={isFav ? "في المفضلة" : "إضافة للمفضلة"}
                    >
                      <RiHeartFill size={20} />
                    </button>
                  </div>
                </div>

                {/* Price Panel — single pricing authority, strikethrough only when a real lower price exists */}
                {(pricing.finalPrice !== null || pricing.topDiscountBadge) && (
                  <div className="offer-price-panel" dir="ltr">
                    {pricing.finalPrice !== null && (
                      <strong>
                        {formatPrice(pricing.finalPrice)}
                        <small>ج.م</small>
                      </strong>
                    )}
                    {pricing.originalPrice !== null && (
                      <span>{formatPrice(pricing.originalPrice)} ج.م</span>
                    )}
                    {savings !== null && savings > 0 && (
                      <b>
                        <RiShieldCheckFill size={14} />
                        وفّرت {formatPrice(savings)} ج.م {discountPercent ? `(${discountPercent}%)` : ''}
                      </b>
                    )}
                  </div>
                )}

                {/* ─── Social Proof & Urgency Trust Banner ─── */}
                <div className="offer-social-proof">
                  <div className="offer-social-proof-item">
                    <RiFireFill size={16} className="text-[#FF6500] animate-bounce" />
                    <span>طلب هذا الكوبون أكثر من 30 شخصاً في الزقازيق</span>
                  </div>
                  <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                  <div className="offer-social-proof-item emerald">
                    <RiFlashlightFill size={15} />
                    <span>تفعيل فوري عند الكاشير بدون أي دفع مسبق</span>
                  </div>
                </div>

                {/* ─── In-page Quick Navigation Tabs ───────── */}
                <div className="offer-nav-tabs">
                  <button onClick={() => scrollToSection('details')} className="offer-nav-tab">
                    <span>📌 تفاصيل العرض</span>
                  </button>
                  <button onClick={() => scrollToSection('how-to-use')} className="offer-nav-tab">
                    <span>💡 كيف يعمل؟</span>
                  </button>
                  <button onClick={() => scrollToSection('store-info')} className="offer-nav-tab">
                    <span>🏢 عن المتجر</span>
                  </button>
                  <button onClick={() => scrollToSection('reviews-section')} className="offer-nav-tab">
                    <span>⭐ آراء العملاء ({reviews.length})</span>
                  </button>
                </div>

                {/* Metadata Badges */}
                <div className="flex flex-wrap items-center gap-3 mb-8">
                  {/* Validity Chip */}
                  <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold ${
                    isExpired 
                      ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800/40 dark:text-rose-300'
                      : daysLeft !== null && daysLeft <= 3 
                        ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800/40 dark:text-amber-300'
                        : 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-white/5 dark:border-white/10 dark:text-slate-200'
                  }`}>
                    <RiTimeLine size={17} className={isExpired ? 'text-rose-500' : daysLeft !== null && daysLeft <= 3 ? 'text-amber-500' : 'text-[#FF6500]'} />
                    <span>
                      {isExpired
                        ? 'العرض منتهي الصلاحية'
                        : daysLeft === null
                          ? 'ساري ومتاح الآن'
                          : daysLeft === 1
                            ? 'ينتهي اليوم!'
                            : daysLeft <= 3
                              ? `ينتهي قريباً (باقي ${daysLeft} أيام)`
                              : `ساري لمدة ${daysLeft} يوم`}
                    </span>
                  </div>

                  {/* Location Area Chip */}
                  {offer.store?.area && (
                    <button 
                      onClick={() => setShowLocations(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 hover:border-[#FF6500]/50 hover:bg-orange-50/50 dark:bg-white/5 dark:border-white/10 dark:text-slate-200 dark:hover:border-[#FF6500]/50 dark:hover:bg-[#FF6500]/10 transition-all text-xs font-bold"
                      title="عرض موقع المحل"
                    >
                      <RiMapPin2Fill size={17} className="text-[#FF6500]" />
                      <span>{offer.store.area}</span>
                      <RiArrowLeftSLine size={13} className="text-slate-400" />
                    </button>
                  )}

                  {/* Verification Guarantee */}
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800/40 dark:text-emerald-300 text-xs font-bold">
                    <RiShieldCheckFill size={17} className="text-emerald-500" />
                    <span>كوبون فوري بدون دفع مسبق</span>
                  </div>
                </div>

                {/* Offer Description */}
                <div id="details" className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5 scroll-mt-24">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                    <RiShieldCheckFill className="text-[#FF6500]" size={24} />
                    وصف العرض وتفاصيله
                  </h3>
                  <div className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-wrap text-sm sm:text-base bg-slate-50/50 dark:bg-white/[0.02] p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                    {offer.description || "لا يوجد وصف إضافي لهذا العرض حالياً. يرجى مراجعة المحل أو التواصل المباشر للتأكد من تفاصيل الخصم وشروطه قبل الاستخدام."}
                  </div>
                </div>

                {/* How to use 3-step guide */}
                <div id="how-to-use" className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-orange-500/5 via-transparent to-transparent border border-orange-500/15 scroll-mt-24">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Lightbulb size={18} className="text-[#FF6500]" />
                    كيف تستفيد من هذا العرض؟
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-[#0c1728] border border-slate-200 dark:border-[#24354c]">
                      <span className="w-6 h-6 rounded-full bg-[#FF6500] text-white flex items-center justify-center shrink-0 font-black text-[11px]">1</span>
                      <span className="text-slate-700 dark:text-slate-300">اضغط على زر &quot;عرض الكوبون&quot; واحصل على الكود مجاناً.</span>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-[#0c1728] border border-slate-200 dark:border-[#24354c]">
                      <span className="w-6 h-6 rounded-full bg-[#FF6500] text-white flex items-center justify-center shrink-0 font-black text-[11px]">2</span>
                      <span className="text-slate-700 dark:text-slate-300">توجّه إلى فرع المحل أو تواصل معهم عبر واتساب.</span>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-[#0c1728] border border-slate-200 dark:border-[#24354c]">
                      <span className="w-6 h-6 rounded-full bg-[#FF6500] text-white flex items-center justify-center shrink-0 font-black text-[11px]">3</span>
                      <span className="text-slate-700 dark:text-slate-300">أظهر كود الخصم أو الـ QR لموظف الكاشير عند الدفع.</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </main>

          {/* ─── Sidebar Column (Store & Coupon) ───────────── */}
          <aside className="offer-detail-sidebar">
            
            {/* Store Information Card */}
            <div id="store-info" className="offer-store-card scroll-mt-24">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden bg-slate-100 dark:bg-[#0c1728] shrink-0 shadow-sm">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt={offer.store?.name || 'Store Logo'}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      sizes="64px"
                      quality={85}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-[#FF6500] to-[#FF8533] flex items-center justify-center text-white font-black text-2xl">
                      {offer.store?.name?.charAt(0) || <RiStore3Fill size={28} />}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="store-card-name truncate">{offer.store?.name}</h4>
                    {(offer.store?.isVerified || offer.store?.status === 'APPROVED') && (
                      <span title="متجر معتمد ومسجل" aria-label="متجر معتمد ومسجل" className="inline-flex text-[#0284C7] shrink-0">
                        <RiCheckboxCircleFill size={16} />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[11px] font-black text-[#FF6500] uppercase tracking-wider">
                      {offer.store?.category?.name || 'تصنيف عام'}
                    </p>
                    {((offer.store?.rating || 0) > 0 || (offer.store?.ratingAvg || 0) > 0) && (
                      <span className="flex items-center gap-0.5 text-[11px] font-black text-amber-500 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                        <RiStarFill size={11} className="text-[#F59E0B]" />
                        <span>{((offer.store?.rating || offer.store?.ratingAvg) || 0).toFixed(1)}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="store-detail-list">
                {/* Address Row */}
                <div>
                  <RiMapPin2Fill size={18} className="shrink-0" />
                  <span>
                    <small>العنوان والفرع</small>
                    {offer.store?.address || offer.store?.area || 'الزقازيق'}
                  </span>
                </div>

                {/* Direct Phone Call */}
                {storePhone && (
                  <a href={`tel:${storePhone}`} title="اتصال مباشر بالمتجر">
                    <RiPhoneFill size={18} className="shrink-0" />
                    <span>
                      <small>رقم الهاتف</small>
                      <span dir="ltr" className="font-mono text-xs">{offer.store.phone}</span>
                    </span>
                  </a>
                )}

                {/* Direct WhatsApp Inquiry */}
                {storeInquiryWhatsAppUrl && (
                  <a 
                    href={storeInquiryWhatsAppUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-emerald-500"
                    title="تواصل مباشرة عبر واتساب"
                  >
                    <RiWhatsappFill size={18} className="shrink-0 text-emerald-500" />
                    <span>
                      <small>محادثة واتساب</small>
                      تواصل مع المحل مباشرة
                    </span>
                  </a>
                )}
              </div>

              <Link 
                href={`/stores/${offer.store?.id}`} 
                className="store-visit-btn"
              >
                زيارة صفحة المتجر وتصفح باقي عروضه <RiArrowLeftSLine size={16} />
              </Link>
            </div>

            {/* ─── Coupon Voucher Action Card ────────────────── */}
            <div ref={couponCardRef} className="offer-coupon-card">
              <div className="coupon-card-heading">
                <RiTicket2Fill size={26} className="text-[#FF6500] shrink-0" />
                <div>
                  <span>كوبون الخصم الفوري</span>
                  <h4>فعّل خصمك الآن</h4>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {!showCoupon ? (
                  <motion.div
                    key="unrevealed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed text-center">
                      احصل على كود الخصم الحصري مجاناً وأظهره للكاشير عند المحاسبة للاستفادة من العرض فوراً.
                    </p>

                    <button 
                      onClick={handleGetCoupon}
                      disabled={isCouponLoading || isExpired}
                      className="coupon-reveal-button"
                    >
                      {isCouponLoading ? (
                        <>
                          <Loader2 className="animate-spin" size={20} aria-hidden="true" />
                          <span>جاري توليد الكوبون...</span>
                        </>
                      ) : isExpired ? (
                        <span>العرض منتهي</span>
                      ) : (
                        <>
                          <RiTicket2Fill size={22} />
                          <span>احصل على الكوبون مجاناً</span>
                        </>
                      )}
                    </button>
                    
                    <div className="text-center">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        ⚡ خصم مضمون • بدون دفع مسبق
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="revealed"
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Success Banner */}
                    <div className="coupon-success-message flex items-center justify-center gap-2">
                      <RiCheckboxCircleFill size={20} className="shrink-0 text-emerald-500" />
                      <span>مبروك! تم تفعيل كود الخصم بنجاح</span>
                    </div>

                    {/* Designer Voucher Ticket */}
                    <div className="redeem-ticket">
                      <button
                        onClick={handleCopy}
                        className="redeem-ticket-code group hover:bg-slate-50 transition-colors"
                        title="انقر لنسخ الكود"
                      >
                        <span className="text-[10px] font-black tracking-widest uppercase block mb-1">
                          كود الخصم — اضغط للنسخ
                        </span>
                        <span>{couponCode}</span>
                        <div className="flex items-center justify-center gap-1.5 mt-3 text-xs font-bold">
                          {copied ? (
                            <span className="text-emerald-600 dark:text-emerald-500 flex items-center gap-1 font-black">
                              <RiCheckboxCircleFill size={15} /> تم النسخ بنجاح!
                            </span>
                          ) : (
                            <span className="text-slate-600 flex items-center gap-1 group-hover:text-[#FF6500] transition-colors">
                              <RiFileCopyLine size={15} /> نسخ كود الخصم
                            </span>
                          )}
                        </div>
                      </button>

                      <div className="redeem-ticket-qr" title="امسح الكود عند الكاشير">
                        <QRCodeSVG 
                          value={couponCode} 
                          size={100}
                          level="H"
                          includeMargin={false}
                          fgColor="#071426"
                        />
                      </div>
                    </div>

                    {/* Cashier Guide & Wallet Link */}
                    <div className="coupon-wallet-note space-y-3">
                      <p className="flex items-start gap-2 text-[11px] font-bold leading-relaxed text-slate-600 dark:text-slate-300 text-right">
                        <Lightbulb size={16} className="mt-0.5 shrink-0 text-[#FF6500]" aria-hidden="true" />
                        <span>أظهر كود الخصم أو الـ QR لموظف الكاشير عند الدفع. الكوبون محفوظ أيضاً في حسابك.</span>
                      </p>
                      <Link 
                        href="/coupons" 
                        className="w-full inline-flex items-center justify-center gap-2 text-xs font-black py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white transition-all border border-slate-200 dark:border-white/10"
                      >
                        <RiQrCodeLine size={15} /> الذهاب إلى صفحة كوبوناتي
                      </Link>
                    </div>

                    {/* WhatsApp Fast Share to Store */}
                    <a 
                      href={couponWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <RiWhatsappFill size={20} /> إرسال الكود للمحل عبر واتساب
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </aside>
        </div>

        {/* ─── Review Section Integration ──────────────────── */}
        <div id="reviews-section" className="scroll-mt-24">
          <ReviewSection 
            offerId={offer.id} 
            reviews={reviews} 
            isVerifiedUser={isVerifiedForReview}
            onReviewAdded={() => {
              fetch(`${API_URL}/reviews/offer/${id}`)
                .then(res => res.json())
                .then(data => setReviews(data))
                .catch(() => {});
            }}
          />
        </div>

        {/* ─── Related Offers Section (Competitor Killer!) ─── */}
        {relatedOffers.length > 0 && (
          <section className="related-offers-section">
            <div className="related-offers-header">
              <h3>
                <RiFireFill className="text-[#FF6500]" size={22} />
                <span>عروض أخرى قد تهمك في الزقازيق</span>
              </h3>
              <Link 
                href="/offers" 
                className="text-xs font-black text-[#FF6500] hover:underline flex items-center gap-1"
              >
                تصفح كل العروض <RiArrowLeftSLine size={14} />
              </Link>
            </div>
            <div className="related-offers-grid">
              {relatedOffers.map((relOffer) => (
                <OfferCard key={relOffer.id} offer={relOffer} />
              ))}
            </div>
          </section>
        )}

      </div>

      {/* ─── Sticky Bottom Mobile Bar (World-Class UX) ───── */}
      <AnimatePresence>
        {showStickyBar && (
          <div className="offer-sticky-mobile-bar md:hidden">
            <div className="min-w-0 pr-1">
              <div className="flex items-baseline gap-2">
                <strong className="text-lg font-black text-[#FF6500]">
                  {pricing.finalPrice !== null
                    ? `${formatPrice(pricing.finalPrice)} ج.م`
                    : pricing.topDiscountBadge || offer.discount}
                </strong>
                {pricing.originalPrice !== null && (
                  <span className="text-[11px] text-slate-400 line-through">
                    {formatPrice(pricing.originalPrice)} ج.م
                  </span>
                )}
              </div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                {showCoupon ? `كود الخصم: ${couponCode}` : 'خصم فوري بدون دفع'}
              </p>
            </div>

            <div className="shrink-0">
              {!showCoupon ? (
                <button
                  onClick={handleGetCoupon}
                  disabled={isCouponLoading || isExpired}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6500] to-[#FF8533] text-white font-black text-xs shadow-md shadow-orange-500/30 flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  {isCouponLoading ? (
                    <Loader2 className="animate-spin" size={15} />
                  ) : (
                    <RiTicket2Fill size={16} />
                  )}
                  <span>{isExpired ? 'العرض منتهي' : 'احصل على الكوبون'}</span>
                </button>
              ) : (
                <button
                  onClick={handleCopy}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-md shadow-emerald-500/30 flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <RiFileCopyLine size={15} />
                  <span>{copied ? 'تم النسخ!' : 'نسخ الكود'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Locations Modal ───────────────────────────────── */}
      <AnimatePresence>
        {showLocations && (
          <div className="app-modal-overlay z-[100] px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
              onClick={() => setShowLocations(false)}
            />
            <motion.div 
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-[#101a2b] p-7 sm:p-8 w-full max-w-md border border-slate-200 dark:border-[#293a52] rounded-[32px] overflow-hidden shadow-2xl z-10"
              dir="rtl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="locations-modal-title"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center text-[#FF6500] mb-5 border border-orange-500/20">
                  <RiMapPin2Fill size={32} />
                </div>
                
                <h3 id="locations-modal-title" className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                  موقع ومقر المتجر
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-6">
                  {offer.store?.name} — فرع الزقازيق
                </p>

                <div className="w-full bg-slate-50 dark:bg-[#0c1728] p-5 rounded-2xl border border-slate-200 dark:border-[#24354c] mb-6 text-right">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-8 h-8 bg-[#FF6500]/15 rounded-lg flex items-center justify-center text-[#FF6500] shrink-0">
                      <RiBuilding2Fill size={18} />
                    </div>
                    <span className="text-slate-900 dark:text-white font-black text-sm">{offer.store?.area}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 font-bold text-xs leading-relaxed mr-11">
                    {offer.store?.address || "العنوان بالتفصيل متاح عند التواصل مع المتجر."}
                  </p>
                </div>

                <div className="flex flex-col gap-3 w-full">
                  {offer.store?.locationUrl && (
                    <a 
                      href={offer.store.locationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 bg-[#FF6500] hover:bg-[#E55A00] text-white font-black rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2.5 text-sm"
                    >
                      <RiMapPin2Fill size={18} />
                      فتح في خرائط جوجل (Google Maps)
                    </a>
                  )}
                  {storePhone && (
                    <a 
                      href={`tel:${storePhone}`}
                      className="w-full py-3.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm border border-slate-200 dark:border-white/10"
                    >
                      <RiPhoneFill size={16} />
                      اتصال بالمتجر: <span dir="ltr">{offer.store.phone}</span>
                    </a>
                  )}
                  <button 
                    onClick={() => setShowLocations(false)}
                    className="w-full py-3 text-slate-500 dark:text-slate-400 font-bold rounded-xl hover:text-slate-800 dark:hover:text-white transition-all text-xs"
                  >
                    إغلاق النافذة
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Lightbox Fullscreen Modal ────────────────────── */}
      <AnimatePresence>
        {lightboxOpen && currentImageUrl && (
          <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-20"
              aria-label="إغلاق التكبير"
            >
              <RiCloseLine size={28} />
            </button>

            {images.length > 1 && (
              <>
                <button 
                  onClick={() => setActiveImg(prev => (prev + 1) % images.length)}
                  className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-[#FF6500] text-white flex items-center justify-center transition-colors z-20"
                  aria-label="الصورة التالية"
                >
                  <RiArrowLeftSLine size={28} />
                </button>
                <button 
                  onClick={() => setActiveImg(prev => (prev - 1 + images.length) % images.length)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-[#FF6500] text-white flex items-center justify-center transition-colors z-20"
                  aria-label="الصورة السابقة"
                >
                  <RiArrowRightSLine size={28} />
                </button>
              </>
            )}

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center select-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={currentImageUrl} 
                alt={offer.title} 
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
