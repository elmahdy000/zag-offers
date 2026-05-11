'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight, Edit3, Trash2, Tag, Users, Clock, Calendar,
  CheckCircle2, XCircle, AlertCircle, PauseCircle, TrendingUp,
  Image as ImageIcon, ChevronLeft, ChevronRight as ChevronR, X, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { vendorApi, resolveImageUrl } from '@/lib/api';

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: string;
  terms?: string;
  status: string;
  images: string[];
  startDate: string;
  endDate: string;
  usageLimit?: number;
  views: number;
  createdAt: string;
  _count: { coupons: number; favorites: number };
  store?: { name: string; category?: { name: string } };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:  { label: 'قيد المراجعة',    color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',   icon: <AlertCircle size={14} /> },
  ACTIVE:   { label: 'نشط ومتاح',        color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: <CheckCircle2 size={14} /> },
  PAUSED:   { label: 'متوقف مؤقتاً',     color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',         icon: <PauseCircle size={14} /> },
  REJECTED: { label: 'مرفوض',            color: 'bg-red-500/15 text-red-400 border-red-500/30',            icon: <XCircle size={14} /> },
  EXPIRED:  { label: 'منتهي الصلاحية',   color: 'bg-white/5 text-text-dim border-white/10',              icon: <Clock size={14} /> },
};

export default function OfferDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    vendorApi().get(`/offers/${id}`).then(r => {
      setOffer(r.data);
    }).catch(() => router.push('/dashboard/offers'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('هل تريد حذف هذا العرض نهائياً؟')) return;
    setDeleting(true);
    try {
      await vendorApi().delete(`/offers/${id}`);
      router.push('/dashboard/offers');
    } catch {
      alert('فشل الحذف، حاول مرة أخرى');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-bg">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  if (!offer) return null;

  const cfg = STATUS_CONFIG[offer.status] || STATUS_CONFIG.EXPIRED;
  const daysLeft = Math.ceil((new Date(offer.endDate).getTime() - Date.now()) / 86_400_000);
  const isExpired = daysLeft <= 0;

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-bg pb-28" dir="rtl">
      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightbox && offer.images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}
          >
            <motion.img
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              src={resolveImageUrl(offer.images[activeImg])}
              className="max-w-full max-h-full object-contain rounded-2xl"
              onClick={e => e.stopPropagation()}
              alt=""
            />
            <button onClick={() => setLightbox(false)}
              className="absolute top-4 left-4 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
              <X size={20} />
            </button>
            {offer.images.length > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); setActiveImg(p => (p - 1 + offer.images.length) % offer.images.length); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                  <ChevronR size={20} />
                </button>
                <button onClick={e => { e.stopPropagation(); setActiveImg(p => (p + 1) % offer.images.length); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                  <ChevronLeft size={20} />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero Image ── */}
      <div className="relative h-64 sm:h-80 bg-white/5 overflow-hidden">
        {offer.images.length > 0 ? (
          <>
            <img
              src={resolveImageUrl(offer.images[activeImg])}
              className="w-full h-full object-cover cursor-pointer"
              alt={offer.title}
              onClick={() => setLightbox(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg" />
            {/* Image counter & dots */}
            {offer.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {offer.images.map((_, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`h-1.5 rounded-full transition-all ${i === activeImg ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={48} className="text-white/10" />
          </div>
        )}

        {/* Back button */}
        <button onClick={() => router.back()}
          className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/10">
          <ChevronRight size={20} />
        </button>

        {/* Status badge */}
        <div className={`absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-black backdrop-blur-md ${cfg.color}`}>
          {cfg.icon} {cfg.label}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 sm:px-6 -mt-4 relative z-10 space-y-5">

        {/* Title & Actions */}
        <div className="glass rounded-[2rem] p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="text-xl font-black text-text leading-tight flex-1">{offer.title}</h1>
            <span className="text-2xl font-black text-primary shrink-0">{offer.discount}</span>
          </div>
          {offer.store && (
            <p className="text-[11px] text-text-dim font-bold">
              {offer.store.name} {offer.store.category ? `· ${offer.store.category.name}` : ''}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-5">
            <Link href={`/dashboard/offers/${offer.id}/edit`}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-black text-[13px] shadow-lg shadow-primary/20 active:scale-95 transition-all">
              <Edit3 size={16} /> تعديل العرض
            </Link>
            <button onClick={handleDelete} disabled={deleting}
              className="w-12 flex items-center justify-center bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-all active:scale-95 disabled:opacity-50">
              {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Users,      color: 'text-primary',    bg: 'bg-primary/10',    value: offer._count?.coupons || 0,   label: 'كوبون' },
            { icon: TrendingUp, color: 'text-blue-400',   bg: 'bg-blue-400/10',   value: offer.views || 0,             label: 'مشاهدة' },
            { icon: Tag,        color: 'text-purple-400', bg: 'bg-purple-400/10', value: offer._count?.favorites || 0, label: 'مفضلة' },
          ].map(s => (
            <div key={s.label} className="glass rounded-[1.5rem] p-4 text-center">
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <s.icon size={16} className={s.color} />
              </div>
              <p className="text-xl font-black text-text">{s.value.toLocaleString('ar-EG')}</p>
              <p className="text-[9px] font-bold text-text-dimmer uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Details */}
        <div className="glass rounded-[2rem] p-5 space-y-4">
          <h2 className="text-[12px] font-black text-text-dim uppercase tracking-wider">تفاصيل العرض</h2>
          
          {offer.description && (
            <div>
              <p className="text-[10px] text-text-dimmer font-bold uppercase tracking-wider mb-1.5">الوصف</p>
              <p className="text-[13px] text-text font-medium leading-relaxed">{offer.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
            <div>
              <p className="text-[10px] text-text-dimmer font-bold mb-1">تاريخ البداية</p>
              <div className="flex items-center gap-1.5 text-[12px] font-bold text-text">
                <Calendar size={12} className="text-primary" /> {fmtDate(offer.startDate)}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-text-dimmer font-bold mb-1">تاريخ الانتهاء</p>
              <div className={`flex items-center gap-1.5 text-[12px] font-bold ${isExpired ? 'text-red-400' : daysLeft <= 3 ? 'text-yellow-400' : 'text-text'}`}>
                <Clock size={12} /> {fmtDate(offer.endDate)}
              </div>
              {!isExpired && <p className={`text-[10px] mt-0.5 font-black ${daysLeft <= 3 ? 'text-yellow-400' : 'text-text-dimmer'}`}>
                {daysLeft} يوم متبقي
              </p>}
            </div>
          </div>

          {offer.usageLimit && (
            <div className="pt-2 border-t border-white/5">
              <p className="text-[10px] text-text-dimmer font-bold mb-1">حد الاستخدام</p>
              <p className="text-[13px] font-bold text-text">{offer.usageLimit.toLocaleString('ar-EG')} كوبون كحد أقصى</p>
            </div>
          )}
        </div>

        {/* Terms */}
        {offer.terms && (
          <div className="glass rounded-[2rem] p-5">
            <h2 className="text-[12px] font-black text-text-dim uppercase tracking-wider mb-3">الشروط والأحكام</h2>
            <p className="text-[12px] text-text-dim font-medium leading-relaxed">{offer.terms}</p>
          </div>
        )}

        {/* Thumbnail Gallery */}
        {offer.images.length > 1 && (
          <div className="glass rounded-[2rem] p-5">
            <h2 className="text-[12px] font-black text-text-dim uppercase tracking-wider mb-3">صور العرض</h2>
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
              {offer.images.map((img, i) => (
                <button key={i} onClick={() => { setActiveImg(i); setLightbox(true); }}
                  className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${i === activeImg ? 'border-primary' : 'border-transparent opacity-60'}`}>
                  <img src={resolveImageUrl(img)} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
