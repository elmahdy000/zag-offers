'use client';

import { Store, Eye, Pencil, PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface MerchantRow {
  id: string;
  name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  category: { id: string; name: string };
  area?: string;
  owner: { name: string };
  _count?: { offers: number; reviews: number };
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

export function MerchantCard({ merchant, onEdit, index }: MerchantCardProps) {
  const status = statusLabels[merchant.status] || statusLabels.PENDING;
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => router.push(`/dashboard/merchants/${merchant.id}`)}
      className="group relative flex min-h-[170px] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-orange-200 hover:shadow-md cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 group-hover:text-orange-600">
          <Store size={17} />
        </div>
        <span className={`rounded-md border px-1.5 py-1 text-[9px] font-black ${status.classes}`}>
          {status.label}
        </span>
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-black text-slate-900 group-hover:text-orange-600 transition-colors truncate">
          {merchant.name}
        </h3>
        <p className="mt-1 text-xs font-medium text-slate-400">{merchant.category?.name || 'تصنيف غير محدد'}</p>

        <div className="mt-2 flex items-center gap-2 text-slate-500">
          <span className="text-[10px] font-semibold truncate">
            {merchant.area || 'كل الشرقية'}
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1.5 border-y border-slate-100 py-2.5 text-center">
        <div><b className="block text-xs font-black text-slate-900">{merchant._count?.offers ?? 0}</b><span className="text-[8px] font-bold text-slate-400">عرض</span></div>
        <div className="border-x border-slate-100"><b className="block text-xs font-black text-slate-900">{merchant._count?.reviews ?? 0}</b><span className="text-[8px] font-bold text-slate-400">تقييم</span></div>
        <div><b className="block truncate text-[9px] font-black text-slate-700">{merchant.owner?.name || 'غير معروف'}</b><span className="text-[8px] font-bold text-slate-400">المالك</span></div>
      </div>

      <div className="mt-auto flex justify-end pt-3">
        <div className="flex gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(merchant.id); }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:text-orange-600"
            title="تعديل سريع"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              router.push(`/dashboard/stores?ownerId=${merchant.id}&openCreate=true`); 
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-orange-100 bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white"
            title="إضافة متجر لهذا التاجر"
          >
            <PlusCircle size={16} />
          </button>
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 group-hover:text-orange-600"
          >
            <Eye size={16} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
