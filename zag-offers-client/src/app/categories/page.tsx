"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const API = 'https://api.zagoffers.online/api';

const CAT_ICONS: Record<string, string> = {
  'مطاعم': '🍔', 'كافيهات': '☕', 'ملابس': '👗', 'جيم': '💪',
  'تجميل': '💅', 'عيادات': '🏥', 'سوبرماركت': '🛒', 'default': '🏷️'
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch(`${API}/stores/categories`);
        if (res.ok) setCategories(await res.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchCats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10" dir="rtl">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-black mb-4">أقسام العروض</h1>
        <p className="text-white/40 font-bold">تصفح العروض حسب الفئة التي تفضلها</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-40 bg-white/5 rounded-[32px] animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/?categoryId=${cat.id}`}>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="glass p-8 rounded-[32px] text-center space-y-4 hover:border-[#FF6B00]/50 transition-all cursor-pointer group"
              >
                <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
                  {CAT_ICONS[cat.name] || '🏷️'}
                </div>
                <h3 className="font-black text-lg">{cat.name}</h3>
                <div className="inline-flex items-center gap-1 text-[10px] font-black text-[#FF6B00] bg-[#FF6B00]/10 px-3 py-1 rounded-full">
                  استكشف <ArrowLeft size={10} />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
