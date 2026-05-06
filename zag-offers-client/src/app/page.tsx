"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Tag, Sparkles, Flame, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// --- Constants & Types ---
const API = 'https://api.zagoffers.online/api';
const UPLOADS = 'https://api.zagoffers.online';

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
    category?: { name: string };
  };
}

const CAT_ICONS: Record<string, string> = {
  'مطاعم': '🍔', 'كافيهات': '☕', 'ملابس': '👗', 'جيم': '💪',
  'تجميل': '💅', 'عيادات': '🏥', 'سوبرماركت': '🛒', 'default': '🏷️'
};

// --- Components ---

const SkeletonCard = () => (
  <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden animate-pulse">
    <div className="h-28 bg-white/5" />
    <div className="p-4 space-y-3">
      <div className="h-3 w-1/3 bg-white/5 rounded" />
      <div className="h-4 w-full bg-white/5 rounded" />
      <div className="h-3 w-2/3 bg-white/5 rounded" />
    </div>
  </div>
);

const OfferCard = ({ offer }: { offer: Offer }) => {
  const daysLeft = Math.ceil((new Date(offer.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const logoUrl = offer.store?.logo ? (offer.store.logo.startsWith('http') ? offer.store.logo : `${UPLOADS}/${offer.store.logo}`) : null;

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="group relative bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden hover:border-[#FF6B00]/40 transition-all shadow-xl"
    >
      <div className="h-24 bg-gradient-to-br from-zinc-800 to-zinc-900 relative">
        <div className="absolute top-3 right-3 px-3 py-1 bg-[#FF6B00] text-white text-sm font-black rounded-lg shadow-lg">
          {offer.discount}
        </div>
        {offer.featured && (
          <div className="absolute top-3 left-3 bg-yellow-500/10 text-yellow-500 p-1.5 rounded-lg border border-yellow-500/20 backdrop-blur-md">
            <Sparkles size={14} />
          </div>
        )}
      </div>

      <div className="p-4 pt-10 relative">
        <div className="absolute -top-8 right-4 w-14 h-14 bg-[#141414] rounded-xl border-2 border-[#1A1A1A] flex items-center justify-center overflow-hidden shadow-xl">
          {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-cover" /> : <Tag className="text-white/20" />}
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-black text-[#FF6B00] uppercase tracking-wider">
            {CAT_ICONS[offer.store?.category?.name || ''] || CAT_ICONS.default} {offer.store?.category?.name}
          </span>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <span className={`text-[10px] font-bold ${daysLeft <= 3 ? 'text-red-400' : 'text-white/40'}`}>
            {daysLeft <= 0 ? 'انتهى' : `باقي ${daysLeft} يوم`}
          </span>
        </div>

        <h3 className="text-sm font-bold text-white mb-3 line-clamp-2 leading-snug group-hover:text-[#FF6B00] transition-colors h-10">
          {offer.title}
        </h3>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-white/50">
            <MapPin size={12} className="text-[#FF6B00]" />
            <span className="text-[11px] font-bold">{offer.store?.area}</span>
          </div>
          <Link href={`/offers/${offer.id}`} className="text-[11px] font-bold text-[#FF6B00] flex items-center gap-1 hover:gap-2 transition-all">
            تفاصيل <ArrowLeft size={12} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default function HomePage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [offRes, catRes] = await Promise.all([
        fetch(`${API}/offers?limit=20`),
        fetch(`${API}/stores/categories`)
      ]);
      if (offRes.ok) setOffers((await offRes.json()).items || []);
      if (catRes.ok) setCategories(await catRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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
            <div className="flex items-center gap-2 px-4 py-2 sm:py-0 w-full sm:w-auto">
              <MapPin className="text-[#FF6B00]" size={18} />
              <select className="bg-transparent text-white text-sm font-bold border-none outline-none cursor-pointer">
                <option value="">كل المناطق</option>
                <option value="الجامعة">الجامعة</option>
                <option value="القومية">القومية</option>
                <option value="وسط البلد">وسط البلد</option>
              </select>
            </div>
            <button className="w-full sm:w-auto px-10 py-4 bg-[#FF6B00] text-white font-black rounded-xl sm:rounded-full shadow-lg shadow-orange-900/40 hover:scale-[1.02] transition-all">
              بحث
            </button>
          </motion.div>

          {/* Quick Stats */}
          <div className="flex justify-center gap-8 pt-4">
            <div className="flex flex-col"><span className="text-2xl font-black text-white">500+</span><span className="text-xs font-bold text-white/30 uppercase tracking-widest">عرض نشط</span></div>
            <div className="w-[1px] h-10 bg-white/5" />
            <div className="flex flex-col"><span className="text-2xl font-black text-white">120+</span><span className="text-xs font-bold text-white/30 uppercase tracking-widest">متجر شريك</span></div>
            <div className="w-[1px] h-10 bg-white/5" />
            <div className="flex flex-col"><span className="text-2xl font-black text-white">10K+</span><span className="text-xs font-bold text-white/30 uppercase tracking-widest">كوبون مستخدم</span></div>
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      <section className="px-4 mb-16 overflow-hidden">
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
            {offers.map(offer => <OfferCard key={offer.id} offer={offer} />)}
          </div>
        )}
      </section>

      {/* Why Us Section */}
      <section className="mt-32 max-w-7xl mx-auto px-4 py-20 bg-gradient-to-r from-[#141414] to-black rounded-[40px] border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6B00]/5 blur-[100px] -z-10" />
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black mb-4">لماذا زقازيق أوفرز؟</h2>
          <p className="text-white/40 max-w-md mx-auto font-bold text-sm">نحن نغير طريقة تسوقك واكتشافك لمدينتك.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-[#FF6B00]/10 rounded-2xl flex items-center justify-center mx-auto text-[#FF6B00] shadow-inner"><Flame size={32} /></div>
            <h4 className="font-bold text-lg">عروض حقيقية</h4>
            <p className="text-white/30 text-sm font-medium">كل عرض يتم مراجعته بدقة لضمان حصولك على الخصم الحقيقي المذكور.</p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto text-blue-500 shadow-inner"><Clock size={32} /></div>
            <h4 className="font-bold text-lg">سهولة الاستخدام</h4>
            <p className="text-white/30 text-sm font-medium">بضغطة واحدة تحصل على الكوبون وتستخدمه فوراً في المحل.</p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto text-green-500 shadow-inner"><Sparkles size={32} /></div>
            <h4 className="font-bold text-lg">تنوع الأقسام</h4>
            <p className="text-white/30 text-sm font-medium">من الأكل والشرب إلى خدمات الجيم والصيانة، كل ما تحتاجه في مكان واحد.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
