'use client';

import { Store, Eye, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface MerchantRow {
  id: string;
  name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  category: { id: string; name: string };
  area?: string;
  owner: { name: string };
}

const statusLabels: Record<string, { label: string; classes: string }> = {
  APPROVED: { label: 'نشط', classes: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  PENDING: { label: 'معلق', classes: 'bg-amber-50 text-amber-600 border-amber-100' },
  REJECTED: { label: 'مرفوض', classes: 'bg-rose-50 text-rose-600 border-rose-100' },
  SUSPENDED: { label: 'موقوف', classes: 'bg-slate-50 text-slate-500 border-slate-100' },
};

interface MerchantCardProps {
  merchant: MerchantRow;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  index: number;
}

export function MerchantCard({ merchant, onView, onEdit, index }: MerchantCardProps) {
  const status = statusLabels[merchant.status] || statusLabels.PENDING;
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => router.push(`/dashboard/merchants/${merchant.id}`)}
      className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-xl hover:shadow-indigo-50 hover:border-indigo-100 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shadow-inner">
          <Store size={20} />
        </div>
        <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${status.classes}`}>
          {status.label}
        </span>
      </div>

      <div className="flex-1">
        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
          {merchant.name}
        </h3>
        <p className="mt-1 text-xs font-medium text-slate-400">{merchant.category?.name || 'تصنيف غير محدد'}</p>
        
        <div className="mt-4 flex items-center gap-2 text-slate-500">
          <span className="text-xs font-medium truncate">
            {merchant.area || 'كل الشرقية'}
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-50 pt-4">
        <p className="text-[11px] font-semibold text-slate-400 truncate max-w-[120px]">
          {merchant.owner.name}
        </p>
        <div className="flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(merchant.id); }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-orange-600 hover:bg-orange-600 hover:text-white transition-all shadow-sm"
            title="تعديل سريع"
          >
            <Pencil size={16} />
          </button>
          <div 
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"
          >
            <Eye size={16} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
