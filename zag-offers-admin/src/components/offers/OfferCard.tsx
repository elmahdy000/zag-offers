'use client';

import { Tag, Eye, Pencil, Store, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface OfferRow {
  id: string;
  title: string;
  discount: string;
  status: string;
  store: { name: string };
  _count: { coupons: number };
}

const statusLabels: Record<string, { label: string; classes: string }> = {
  ACTIVE: { label: 'نشط الآن', classes: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  APPROVED: { label: 'مقبول', classes: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  PENDING: { label: 'قيد المراجعة', classes: 'bg-amber-50 text-amber-600 border-amber-100' },
  REJECTED: { label: 'مرفوض', classes: 'bg-rose-50 text-rose-600 border-rose-100' },
  EXPIRED: { label: 'منتهي الصلاحية', classes: 'bg-slate-50 text-slate-500 border-slate-100' },
  PAUSED: { label: 'متوقف مؤقتاً', classes: 'bg-slate-50 text-slate-500 border-slate-100' },
};

interface OfferCardProps {
  offer: OfferRow;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  index: number;
}

export function OfferCard({ offer, onView, onEdit, index }: OfferCardProps) {
  const status = statusLabels[offer.status] || { label: offer.status, classes: 'bg-slate-50 text-slate-500 border-slate-100' };
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => router.push(`/dashboard/offers/${offer.id}`)}
      className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-xl hover:shadow-orange-50 hover:border-orange-100 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600 shadow-inner border border-orange-100 group-hover:bg-orange-600 group-hover:text-white transition-all">
          <Tag size={20} />
        </div>
        <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${status.classes}`}>
          {status.label}
        </span>
      </div>

      <div className="flex-1">
        <h3 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors truncate leading-tight">
          {offer.title}
        </h3>
        <p className="mt-1.5 text-base font-bold text-orange-600">{offer.discount}</p>
        
        <div className="mt-5 flex items-center gap-2.5 text-xs font-medium text-slate-500">
          <Store size={14} className="text-slate-300 shrink-0" />
          <span className="truncate">{offer.store.name}</span>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-tight">
          <Zap size={12} className="text-amber-400" />
          <span>{offer._count.coupons} كوبون</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(offer.id); }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
            title="تعديل سريع"
          >
            <Pencil size={16} />
          </button>
          <div 
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm"
          >
            <Eye size={16} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
