'use client';

import { motion } from 'framer-motion';
import { Heart, MessageSquare, Ticket, Zap } from 'lucide-react';

interface EngagementProps {
  favorites: number;
  reviews: number;
  couponsGenerated: number;
}

export function EngagementMetric({ favorites, reviews, couponsGenerated }: EngagementProps) {
  const format = (v: number) => new Intl.NumberFormat('ar-EG').format(v);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
      <div className="relative z-10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
            <Zap size={16} className="fill-orange-500" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">نبض المنصة</h2>
            <p className="text-[9px] font-black uppercase text-slate-400">Interaction</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span className="text-[9px] font-black uppercase tracking-widest">المفضلة</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{format(favorites)}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span className="text-[9px] font-black uppercase tracking-widest">المراجعات</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{format(reviews)}</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm border border-slate-100">
                <Ticket size={18} className="text-orange-600" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 mb-0.5">إجمالي الكوبونات</p>
                <p className="text-lg font-black text-slate-900 leading-none">{format(couponsGenerated)}</p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-[9px] font-black text-emerald-600">نشاط مرتفع</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
