'use client';

import { Tag, Eye, Pencil, Store, Zap, Clock, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface OfferRow {
  id: string;
  title: string;
  discount: string;
  status: string;
  store: { name: string };
  _count: { coupons: number };
  createdAt: string;
}

const statusLabels: Record<string, { label: string; classes: string }> = {
  ACTIVE: { label: 'نشط', classes: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  APPROVED: { label: 'مقبول', classes: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  PENDING: { label: 'مراجعة', classes: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  REJECTED: { label: 'مرفوض', classes: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
  EXPIRED: { label: 'منتهي', classes: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
  PAUSED: { label: 'متوقف', classes: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
};

interface OfferCardProps {
  offer: OfferRow;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  index: number;
}

export function OfferCard({ offer, onView, onEdit, index }: OfferCardProps) {
  const status = statusLabels[offer.status] || { label: offer.status, classes: 'bg-slate-500/10 text-slate-500 border-slate-500/20' };
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => router.push(`/dashboard/offers/${offer.id}`)}
      className="group relative bg-white border border-slate-200 rounded-2xl p-4 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-indigo-200 cursor-pointer overflow-hidden"
    >
      {/* Status Badge - Floating */}
      <div className="absolute top-3 left-3 z-10">
         <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider ${status.classes}`}>
           {status.label}
         </span>
      </div>

      <div className="flex items-start gap-4">
        {/* Compact Icon */}
        <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-500">
          <Tag size={18} strokeWidth={2.5} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate leading-tight mb-1">
            {offer.title}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-black text-orange-600">{offer.discount}</span>
            <span className="text-[10px] font-bold text-slate-400 truncate flex items-center gap-1">
              <Store size={10} className="opacity-50" />
              {offer.store.name}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
             <Zap size={12} className="text-amber-500" />
             <span className="text-[11px] font-black text-slate-900">{offer._count.coupons}</span>
             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">كوبون</span>
          </div>
          <div className="w-px h-3 bg-slate-100" />
          <div className="flex items-center gap-1.5 text-slate-400">
             <Clock size={11} />
             <span className="text-[9px] font-bold">{new Date(offer.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(offer.id); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all"
          >
            <Pencil size={14} />
          </button>
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <ChevronLeft size={16} />
          </div>
        </div>
      </div>

      {/* Subtle Progress Bar (Design only) */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100 overflow-hidden">
         <motion.div 
           initial={{ width: 0 }}
           animate={{ width: `${Math.min(offer._count.coupons * 2, 100)}%` }}
           className="h-full bg-indigo-500/20"
         />
      </div>
    </motion.div>
  );
}
