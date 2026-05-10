"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, Share2, Heart, ArrowRight, ShieldCheck, Ticket, Store, ChevronRight, Copy, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { API_URL, BASE_URL } from '@/lib/constants';
import { resolveImageUrl } from '@/lib/utils';

/* ─── Toast ─────────────────────────────────────────── */
type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; msg: string; type: ToastType; }

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  const icons = { success: <CheckCircle2 size={18} />, error: <XCircle size={18} />, info: <AlertCircle size={18} /> };
  const colors = {
    success: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
    error:   'bg-red-500/20 border-red-500/40 text-red-300',
    info:    'bg-[#FF6B00]/20 border-[#FF6B00]/40 text-[#FF6B00]',
  };
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] flex flex-col gap-3 w-full max-w-sm px-4">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl font-bold text-sm shadow-2xl ${colors[t.type]}`}
          >
            {icons[t.type]}
            <span>{t.msg}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────── */
export default function OfferDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCouponLoading, setIsCouponLoading] = useState(false); // separate state for coupon action
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState('ZAG-XXXXXX');
  const [isFav, setIsFav] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeImg, setActiveImg] = useState(0);

  const showToast = (msg: string, type: ToastType = 'info') => {
    const t = { id: Date.now(), msg, type };
    setToasts(prev => [...prev, t]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3500);
  };

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        const res = await fetch(`${API_URL}/offers/${id}`);
        if (res.ok) {
          const data = await res.json();
          setOffer(data);
          
          // Check favorite status from API if logged in
          const token = localStorage.getItem('token');
          if (token) {
            try {
              const favRes = await fetch(`${API_URL}/favorites`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (favRes.ok) {
                const favData = await favRes.json();
                setIsFav(favData.some((fav: any) => fav.offerId === data.id));
              }
            } catch { /* silent */ }
          } else {
            // Fallback to localStorage if not logged in
            const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
            setIsFav(favs.some((f: any) => f.id === data.id));
          }
        } else router.replace('/');
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchOffer();
  }, [id, router]);

  const toggleFav = async () => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Use API if logged in
      try {
        const res = await fetch(`${API_URL}/favorites/toggle/${id}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setIsFav(data.favorited);
          showToast(data.favorited ? 'تم إضافة العرض للمفضلة ❤️' : 'تم إزالة العرض من المفضلة', data.favorited ? 'success' : 'info');
        }
      } catch {
        showToast('حدث خطأ أثناء تحديث المفضلة', 'error');
      }
    } else {
      // Fallback to localStorage if not logged in
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      const updated = isFav ? favs.filter((f: any) => f.id !== offer.id) : [...favs, offer];
      localStorage.setItem('favorites', JSON.stringify(updated));
      setIsFav(!isFav);
      showToast(isFav ? 'تم إزالة العرض من المفضلة' : 'تم إضافة العرض للمفضلة ❤️', isFav ? 'info' : 'success');
    }
  };

  const handleGetCoupon = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('يرجى تسجيل الدخول أولاً للحصول على الكوبون', 'info');
      setTimeout(() => router.push('/login'), 1500);
      return;
    }
    
    // تحقق من صحة العرض
    if (!offer || !offer.id) {
      showToast('العرض غير صالح', 'error');
      return;
    }
    
    // تحقق من حالة العرض
    if (offer.status !== 'ACTIVE' && offer.status !== 'PENDING') {
      showToast('هذا العرض غير متاح حالياً', 'error');
      return;
    }
    
    // تحقق من تاريخ الانتهاء
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

        // Warn if code format is unexpected but don't block the user
        if (!data.code) {
          showToast('كود الكوبون غير صالح', 'error');
          return;
        }

        setCouponCode(data.code);
        setShowCoupon(true);
        showToast('تم إنشاء الكوبون بنجاح! 🎉', 'success');
      } else {
        const err = await res.json();
        const status = res.status;

        if (status === 401) {
          showToast('انتهت جلستك، برجاء تسجيل الدخول مرة أخرى', 'error');
          setTimeout(() => router.push('/login'), 1500);
        } else if (status === 400) {
          showToast(err.message || 'لا يمكن الحصول على هذا الكوبون', 'error');
        } else if (status === 429) {
          showToast('لقد تجاوزت الحد المسموح من طلبات الكوبونات', 'error');
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
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#FF6B00] font-black">جاري تحميل العرض...</div>;
  if (!offer) return null;

  const daysLeft = Math.ceil((new Date(offer.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const logoUrl = resolveImageUrl(offer.store?.logo);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10" dir="rtl">
      <ToastContainer toasts={toasts} />

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-bold text-white/30 mb-8 overflow-hidden whitespace-nowrap">
        <Link href="/" className="hover:text-white transition-colors">الرئيسية</Link>
        <ChevronRight size={14} />
        <Link href="/offers" className="hover:text-white transition-colors">العروض</Link>
        <ChevronRight size={14} />
        <span className="text-white/60 truncate">{offer.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1A1A1A] border border-white/5 rounded-[32px] overflow-hidden">
            <div className="relative aspect-video sm:aspect-square lg:aspect-video bg-zinc-900 overflow-hidden group">
               <AnimatePresence mode="wait">
                 <motion.img
                   key={activeImg}
                   src={resolveImageUrl(offer.images?.[activeImg]) || '/placeholder-offer.jpg'}
                   initial={{ opacity: 0, scale: 1.1 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   transition={{ duration: 0.5 }}
                   className="w-full h-full object-cover"
                   alt=""
                 />
               </AnimatePresence>
               
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

               {offer.images && offer.images.length > 1 && (
                 <>
                   <button 
                     onClick={() => setActiveImg(prev => (prev + 1) % offer.images.length)}
                     className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     <ChevronRight size={20} />
                   </button>
                   <button 
                     onClick={() => setActiveImg(prev => (prev - 1 + offer.images.length) % offer.images.length)}
                     className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     <ArrowRight size={20} />
                   </button>
                   
                   <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
                     {offer.images.map((_: any, i: number) => (
                       <button 
                         key={i} 
                         onClick={() => setActiveImg(i)}
                         className={`h-1.5 rounded-full transition-all ${i === activeImg ? 'w-6 bg-[#FF6B00]' : 'w-1.5 bg-white/30'}`} 
                       />
                     ))}
                   </div>
                 </>
               )}

               <div className="absolute top-6 right-6 flex flex-col items-end gap-3 pointer-events-none">
                  <div className="bg-[#FF6B00] text-white px-5 py-2 rounded-2xl font-black text-2xl shadow-2xl">
                    {offer.discount}
                  </div>
                  {offer.originalPrice && (
                    <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-black text-white/60 line-through">
                      EGP {offer.originalPrice}
                    </div>
                  )}
               </div>

               <div className="absolute bottom-6 right-8 left-8 pointer-events-none">
                  <h1 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-lg">{offer.title}</h1>
               </div>
            </div>
            
            <div className="p-8">
               <div className="flex flex-wrap gap-4 mb-8">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                    <Clock size={16} className="text-[#FF6B00]" />
                    <span className="text-xs font-bold">{daysLeft <= 0 ? 'منتهي' : `باقي ${daysLeft} يوم`}</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                    <MapPin size={16} className="text-[#FF6B00]" />
                    <span className="text-xs font-bold">{offer.store?.area}</span>
                  </div>
                  <button
                    onClick={() => { navigator.share?.({ title: offer.title, url: window.location.href }); }}
                    className="mr-auto p-2 text-white/40 hover:text-white transition-colors"
                  >
                    <Share2 size={20} />
                  </button>
                  <button 
                    onClick={toggleFav}
                    className={`p-2 transition-all ${isFav ? 'text-red-500' : 'text-white/40 hover:text-red-500'}`}
                  >
                    <Heart size={20} fill={isFav ? "currentColor" : "none"} />
                  </button>
               </div>

               <div className="space-y-4">
                  <h3 className="text-lg font-black flex items-center gap-2">
                    <ShieldCheck className="text-[#FF6B00]" size={22} />
                    وصف العرض والشروط
                  </h3>
                  <p className="text-white/50 font-bold leading-relaxed whitespace-pre-wrap">
                    {offer.description || "لا يوجد وصف إضافي لهذا العرض حالياً. يرجى التواصل مع المحل للتأكد من تفاصيل العرض وشروطه قبل الاستخدام."}
                  </p>
               </div>
            </div>
          </div>
        </div>

        {/* Sidebar / CTA */}
        <div className="space-y-6">
          {/* Store Card */}
          <div className="glass p-6 rounded-[24px]">
            <div className="flex items-center gap-4 mb-6">
               <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden">
                  {logoUrl ? 
                    <Image
                      src={logoUrl}
                      alt={offer.store?.name || 'Store Logo'}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      sizes="56px"
                      quality={80}
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiBmaWxsPSIjMUVFMUUxIi8+PC9zdmc+"
                    /> : 
                    <Store className="text-white/20" />
                  }
               </div>
               <div>
                  <h4 className="font-black text-white">{offer.store?.name}</h4>
                  <p className="text-[10px] font-black text-[#FF6B00] uppercase tracking-wider">{offer.store?.category?.name || 'تصنيف عام'}</p>
               </div>
            </div>
            <Link href={`/stores/${offer.store?.id}`} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all">
              عرض المتجر <ArrowRight size={14} />
            </Link>
          </div>

          {/* Coupon Action */}
          <div className="bg-[#FF6B00] p-6 rounded-[24px] shadow-xl shadow-orange-900/30">
            <h4 className="text-white font-black text-center mb-4">احصل على الخصم الآن</h4>
            <AnimatePresence mode="wait">
              {!showCoupon ? (
                <motion.button 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={handleGetCoupon}
                  disabled={isCouponLoading}
                  className="w-full py-4 bg-white text-[#FF6B00] font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isCouponLoading ? (
                    <span className="animate-spin text-xl">⏳</span>
                  ) : (
                    <><Ticket size={20} /> عرض الكوبون</>
                  )}
                </motion.button>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <button
                    onClick={handleCopy}
                    className="w-full bg-black/20 border-2 border-dashed border-white/40 rounded-2xl p-4 text-center hover:bg-black/30 transition-all group"
                  >
                    <span className="text-xs font-black text-white/60 mb-2 block tracking-widest uppercase">كود الخصم — اضغط للنسخ</span>
                    <span className="text-2xl font-black text-white tracking-[4px]">{couponCode}</span>
                    <div className="flex items-center justify-center gap-2 mt-2 text-white/60 text-xs font-bold">
                      {copied ? <><CheckCircle2 size={14} className="text-emerald-400" /> تم النسخ!</> : <><Copy size={14} /> نسخ الكود</>}
                    </div>
                  </button>
                  <p className="text-[10px] text-center text-white/80 font-bold leading-relaxed">
                    أظهر هذا الكود للكاشير عند الدفع للحصول على الخصم فوراً.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
