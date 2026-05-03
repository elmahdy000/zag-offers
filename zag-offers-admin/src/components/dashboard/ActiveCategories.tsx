'use client';

import { motion } from 'framer-motion';
import { Star, ChevronLeft } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  totalOffers: number;
}

interface ActiveCategoriesProps {
  categories: Category[];
}

export function ActiveCategories({ categories }: ActiveCategoriesProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
          <Star size={16} fill="currentColor" />
        </div>
        <h2 className="text-lg font-black text-slate-900">الأكثر نشاطاً</h2>
      </div>

      <div className="space-y-2">
        {categories.slice(0, 5).map((category, i) => (
          <div
            key={category.id}
            className="group flex items-center justify-between rounded-xl bg-slate-50 p-3.5 transition-all hover:bg-white hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-300">0{i + 1}</span>
              <span className="text-sm font-black text-slate-700">{category.name}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-left">
                <p className="text-sm font-black text-orange-600">
                  {new Intl.NumberFormat('ar-EG').format(category.totalOffers)}
                </p>
              </div>
              <ChevronLeft size={12} className="text-slate-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
