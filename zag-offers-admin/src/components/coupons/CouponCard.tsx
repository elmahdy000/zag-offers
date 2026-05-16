'use client';

import { Ticket, Eye, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface CouponItem {
  id: string;
  code: string;
  status: 'GENERATED' | 'USED' | 'EXPIRED';
  offer?: { title: string; store?: { name: string } };
  customer?: { name?: string };
}

const statusLabels: Record<string, { label: string; classes: string }> = {
  USED: { label: 'تم الاستخدام', classes: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  GENERATED: { label: 'صالح للاستخدام', classes: 'bg-orange-50 text-orange-600 border-orange-100' },
  EXPIRED: { label: 'منتهي الصلاحية', classes: 'bg-slate-50 text-slate-400 border-slate-100' },
};

interface CouponCardProps {
  coupon: CouponItem;
  onView: (id: string) => void;
  index: number;
}

export function CouponCard({ coupon, onView, index }: CouponCardProps) {
  const status = statusLabels[coupon.status] || { label: coupon.status, classes: 'bg-slate-50 text-slate-500 border-slate-100' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-orange-100"
    >
      <div className="flex items-start justify-between mb-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600 shadow-sm border border-orange-100 group-hover:bg-orange-600 group-hover:text-white transition-all">
          <Ticket size={20} />
        </div>
        <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${status.classes}`}>
          {status.label}
        </span>
      </div>

      <div className="flex-1">
        <h3 className="text-2xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors uppercase tracking-[0.1em] leading-none font-mono">
          {coupon.code}
        </h3>
        <p className="mt-2.5 text-[11px] font-bold text-slate-500 truncate leading-relaxed">
          {coupon.offer?.title || 'تفاصيل العرض غير متوفرة'}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-tight truncate max-w-[150px]">
          <User size={12} className="text-slate-300" />
          <span>{coupon.customer?.name || 'عميل مجهول'}</span>
        </div>
        <button 
          onClick={() => onView(coupon.id)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-orange-600 transition-all shadow-md shadow-slate-100"
          title="عرض التفاصيل الكاملة"
        >
          <Eye size={16} />
        </button>
      </div>
    </motion.div>
  );
}
