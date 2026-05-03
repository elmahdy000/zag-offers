'use client';

import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  helper?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
  };
  index: number;
}

export function StatCard({ title, value, helper, icon: Icon, trend, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
            <Icon size={20} strokeWidth={2.5} />
          </div>
          
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
            <h3 className="mt-0.5 text-2xl font-black text-slate-900">
              {value}
            </h3>
          </div>
        </div>

        {trend && (
          <div className={`flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-[10px] font-black ${trend.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {trend.isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            <span>{trend.value}%</span>
          </div>
        )}
      </div>

      {helper && (
        <div className="mt-4 border-t border-slate-50 pt-3 text-[10px] font-bold text-slate-400">
          {helper}
        </div>
      )}
    </motion.div>
  );
}
