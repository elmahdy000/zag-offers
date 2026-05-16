'use client';

import { motion } from 'framer-motion';
import { Store, Tag, Check, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PendingItem {
  id: string;
  type: 'store' | 'offer';
  name: string;
  storeName?: string;
}

interface PendingActionsProps {
  items: PendingItem[];
  onAction: (id: string, type: 'store' | 'offer', action: 'approve' | 'reject') => void;
}

export function PendingActions({ items, onAction }: PendingActionsProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">مركز الموافقات</h2>
          <p className="text-xs font-bold text-slate-400">لديك {items.length} طلبات جديدة</p>
        </div>
        <Link 
          href="/dashboard/approvals" 
          className="group flex items-center gap-1.5 rounded-xl bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-900 hover:text-white transition-all"
        >
          عرض الكل
          <ArrowRight size={12} />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-100 bg-slate-50/30 py-10 text-center">
          <Check className="text-emerald-500 mb-2" size={24} />
          <p className="text-sm font-bold text-slate-900">لا توجد طلبات معلقة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.slice(0, 4).map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="group flex items-center justify-between gap-3 rounded-xl border border-slate-50 bg-slate-50/30 p-3.5 transition-all hover:bg-white hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.type === 'store' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                  {item.type === 'store' ? <Store size={18} /> : <Tag size={18} />}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase text-slate-400">{item.type === 'store' ? 'متجر' : 'عرض'}</p>
                  <h4 className="text-sm font-bold text-slate-900 truncate">{item.name}</h4>
                </div>
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={() => onAction(item.id, item.type, 'reject')}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 bg-white text-rose-500 hover:bg-rose-50"
                >
                  <X size={14} />
                </button>
                <button
                  onClick={() => onAction(item.id, item.type, 'approve')}
                  className="h-8 rounded-lg bg-orange-600 px-4 text-xs font-bold text-white hover:bg-orange-700"
                >
                  اعتماد
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
