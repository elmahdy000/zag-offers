"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Tag, Sparkles, Flame, Clock, ArrowLeft, Heart } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { OfferCard, SkeletonCard } from '@/components/offer-card';

// --- Constants & Types ---
const API = 'https://api.zagoffers.online/api';

interface Offer {
  id: string;
  title: string;
  discount: string;
  endDate: string;
  featured: boolean;
  store: {
    id: string;
    name: string;
    logo: string;
    area: string;
    categoryId?: string;
    category?: { name: string };
  };
}

const CAT_ICONS: Record<string, string> = {
  'مطاعم': '🍔', 'كافيهات': '☕', 'ملابس': '👗', 'جيم': '💪',
  'تجميل': '💅', 'عيادات': '🏥', 'سوبرماركت': '🛒', 'default': '🏷️'
};

export default function HomePage() {
  const searchParams = useSearchParams();
  const catIdParam = searchParams.get('categoryId');

  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState(catIdParam || '');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [offRes, catRes] = await Promise.all([
        fetch(`${API}/offers?limit=50`),
        fetch(`${API}/stores/categories`)
      ]);
      if (offRes.ok) setOffers((await offRes.json()).items || []);
      if (catRes.ok) setCategories(await catRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (catIdParam) setActiveCat(catIdParam); }, [catIdParam]);

  const filteredOffers = useMemo(() => {
    return offers.filter(o => {
      const matchSearch = o.title.toLowerCase().includes(search.toLowerCase()) || o.store.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCat ? o.store.categoryId === activeCat : true;
      return matchSearch && matchCat;
    });
  }, [offers, search, activeCat]);

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="relative pt-10 pb-20 px-4 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-[#FF6B00]/10 to-transparent -z-10" />
        
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-full text-[#FF6B00] text-xs font-black uppercase tracking-widest">
              <Sparkles size={14} /> جديد في الزقازيق
            </div>
            <h1 className="text-4xl sm:text-6xl font-black leading-tight">
              اكتشف عالم <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] to-[#FF8C00]">الخصومات</span> في مدينتك
            </h1>
            <p className="text-white/50 text-base sm:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
              وفّر أكثر من 50% مع كوبونات حصرية من أفضل المطاعم، الكافيهات، المحلات والخدمات في مدينة الزقازيق.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row items-center gap-3 p-2 bg-[#1A1A1A] border border-white/10 rounded-2xl sm:rounded-full shadow-2xl"
          >
            <div className="flex-1 w-full flex items-center gap-3 px-4 py-2 sm:py-0 border-b sm:border-b-0 sm:border-l border-white/5">
              <Search className="text-white/20" size={20} />
              <input 
                type="text" 
                placeholder="ابحث عن عرض، محل، أو قسم..."
                className="w-full bg-transparent border-none outline-none text-white text-sm font-bold placeholder:text-white/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="w-full sm:w-auto px-10 py-4 bg-[#FF6B00] text-white font-black rounded-xl sm:rounded-full shadow-lg shadow-orange-900/40 hover:scale-[1.02] transition-all">
              بحث سريع
            </button>
          </motion.div>
        </div>
      </section>

      {/* Categories Bar */}
      <section className="px-4 mb-12">
        <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-x-auto no-scrollbar pb-4">
          <button 
            className={`px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${activeCat === '' ? 'bg-[#FF6B00] text-white shadow-lg' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
            onClick={() => setActiveCat('')}
          >
            🌟 الكل
          </button>
          {categories.map(c => (
            <button 
              key={c.id}
              className={`px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${activeCat === c.id ? 'bg-[#FF6B00] text-white shadow-lg' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
              onClick={() => setActiveCat(c.id)}
            >
              {CAT_ICONS[c.name] || '🏷️'} {c.name}
            </button>
          ))}
        </div>
      </section>

      {/* Offers Grid */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg text-[#FF6B00]"><Flame size={20} /></div>
            <h2 className="text-2xl font-black">أحدث العروض الحصرية</h2>
          </div>
          <Link href="/offers" className="text-sm font-bold text-[#FF6B00] hover:underline">عرض الكل</Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1,2,3,4,5,6,7,8,9,10].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            <AnimatePresence>
              {filteredOffers.map(offer => (
                <motion.div key={offer.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <OfferCard offer={offer} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}
