"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, Flame, Clock, MapPin, Tag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { OfferCard, SkeletonCard } from '@/components/offer-card';
import { API_URL } from '@/lib/constants';

export default function OffersListingPage() {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get('categoryId') || '';
  
  const [offers, setOffers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState(initialCat);
  const [area, setArea] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [offRes, catRes] = await Promise.all([
          fetch(`${API_URL}/offers?limit=100`),
          fetch(`${API_URL}/stores/categories`)
        ]);
        if (offRes.ok) setOffers((await offRes.json()).items || []);
        if (catRes.ok) setCategories(await catRes.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const filtered = offers.filter(o => {
    const matchSearch = o.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCat ? o.store?.categoryId === activeCat : true;
    const matchArea = area ? o.store?.area === area : true;
    return matchSearch && matchCat && matchArea;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10" dir="rtl">
      {/* Search & Filter Header */}
      <div className="glass rounded-[32px] p-6 mb-12 space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
            <input 
              type="text" 
              placeholder="ابحث عن عرض..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-sm font-bold focus:border-[#FF6B00] outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
             <div className="relative group">
                <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FF6B00]" size={18} />
                <select 
                  className="bg-white/5 border border-white/10 text-white text-sm font-bold rounded-2xl px-12 py-4 outline-none cursor-pointer focus:border-[#FF6B00] transition-all appearance-none"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                >
                  <option value="">كل المناطق</option>
                  <option value="الجامعة">الجامعة</option>
                  <option value="القومية">القومية</option>
                  <option value="وسط البلد">وسط البلد</option>
                </select>
             </div>
             <div className="relative group">
                <Tag className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FF6B00]" size={18} />
                <select 
                  className="bg-white/5 border border-white/10 text-white text-sm font-bold rounded-2xl px-12 py-4 outline-none cursor-pointer focus:border-[#FF6B00] transition-all appearance-none min-w-[150px]"
                  value={activeCat}
                  onChange={(e) => setActiveCat(e.target.value)}
                >
                  <option value="">كل الأقسام</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
             </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black flex items-center gap-2">
          <Flame className="text-[#FF6B00]" /> استكشف العروض المتاحة ({filtered.length})
        </h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {[1,2,3,4,5,6,7,8,9,10].map(i => <div key={i} className="h-64 bg-white/5 rounded-[24px] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-white/20 font-black">لا توجد عروض تطابق بحثك</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          <AnimatePresence>
            {filtered.map(offer => (
              <motion.div key={offer.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <OfferCard offer={offer} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
