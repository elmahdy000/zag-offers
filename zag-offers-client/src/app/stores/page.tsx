"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, MapPin, Tag, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';

import { API_URL, BASE_URL } from '@/lib/constants';

export default function StoresListPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await fetch(`${API_URL}/stores?limit=100`);
        if (res.ok) setStores((await res.json()).items || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchStores();
  }, []);

  const filteredStores = stores.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.area.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 py-10" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div>
          <h1 className="text-4xl font-black mb-4">شركاء النجاح</h1>
          <p className="text-white/40 font-bold">اكتشف أفضل المحلات والخدمات في الزقازيق</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
          <input 
            type="text"
            placeholder="ابحث عن محل معين..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-sm font-bold focus:border-[#FF6B00] outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-white/5 rounded-[32px] animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStores.map((store) => {
            const logoUrl = store.logo ? (store.logo.startsWith('http') ? store.logo : `${BASE_URL}/${store.logo}`) : null;
            return (
              <Link key={store.id} href={`/stores/${store.id}`}>
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="glass p-6 rounded-[32px] flex flex-col items-center text-center hover:border-[#FF6B00]/50 transition-all cursor-pointer group"
                >
                  <div className="w-20 h-20 bg-black/40 rounded-[24px] border-2 border-white/5 flex items-center justify-center overflow-hidden mb-4 shadow-xl">
                    {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-cover" /> : <Store size={32} className="text-white/10" />}
                  </div>
                  <h3 className="font-black text-lg mb-1 group-hover:text-[#FF6B00] transition-colors">{store.name}</h3>
                  <p className="text-[10px] font-black text-[#FF6B00] bg-[#FF6B00]/10 px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
                    {store.category?.name || 'متجر'}
                  </p>
                  <div className="flex items-center gap-1.5 text-white/40 text-xs font-bold">
                    <MapPin size={14} className="text-[#FF6B00]" /> {store.area}
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
