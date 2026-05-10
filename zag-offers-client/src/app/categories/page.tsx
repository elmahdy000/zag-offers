"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tag, ArrowLeft, Utensils, Coffee, Shirt, Dumbbell, Sparkles, Hospital, ShoppingCart, BookOpen, Car, Wrench } from 'lucide-react';
import Link from 'next/link';
import { API_URL } from '@/lib/constants';

const CAT_ICONS: Record<string, React.ReactNode> = {
  'مطاعم':         <Utensils size={40} />,
  'كافيهات':       <Coffee size={40} />,
  'ملابس':         <Shirt size={40} />,
  'جيم':           <Dumbbell size={40} />,
  'تجميل':         <Sparkles size={40} />,
  'عيادات':        <Hospital size={40} />,
  'سوبرماركت':    <ShoppingCart size={40} />,
  'دورات':         <BookOpen size={40} />,
  'خدمات سيارات': <Car size={40} />,
  'خدمات محلية':  <Wrench size={40} />,
  'default':       <Tag size={40} />,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch(`${API_URL}/stores/categories`);
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
                whileHover={{ y: -8 }}
                className="bg-[#252525] border border-white/[0.07] p-8 rounded-[32px] text-center space-y-5 hover:border-[#FF6B00]/50 transition-all cursor-pointer group"
              >
                <div className="text-[#FF6B00] group-hover:scale-110 transition-transform duration-300 flex justify-center">
                  {CAT_ICONS[cat.name] || CAT_ICONS.default}
                </div>
                <h3 className="font-black text-lg text-[#F0F0F0]">{cat.name}</h3>
                <div className="inline-flex items-center gap-2 text-[11px] font-black text-[#FF6B00] bg-[#FF6B00]/10 px-4 py-1.5 rounded-full group-hover:bg-[#FF6B00] group-hover:text-white transition-colors">
                  تصفح العروض <ArrowLeft size={12} />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
