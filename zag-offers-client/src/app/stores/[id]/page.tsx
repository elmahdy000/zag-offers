"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, Phone, MessageSquare, ExternalLink, Tag, Store } from 'lucide-react';
import Link from 'next/link';
import { API_URL, BASE_URL } from '@/lib/constants';
import { OfferCard } from '@/components/offer-card';

export default function StoreDetailsPage() {
  const { id } = useParams();
  const [store, setStore] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sRes, oRes] = await Promise.all([
          fetch(`${API_URL}/stores/${id}`),
          fetch(`${API_URL}/offers/store/${id}`)
        ]);
        if (sRes.ok) setStore(await sRes.json());
        if (oRes.ok) setOffers(await oRes.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#FF6B00] font-black">جاري تحميل بيانات المتجر...</div>;
  if (!store) return <div className="text-center py-20 font-black">المتجر غير موجود</div>;

  const logoUrl = store.logo ? (store.logo.startsWith('http') ? store.logo : `${BASE_URL}/${store.logo}`) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10" dir="rtl">
      {/* Header Profile */}
      <div className="glass rounded-[40px] p-8 sm:p-12 mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6B00]/10 blur-[100px] -z-10" />
        
        <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-right">
          <div className="w-32 h-32 bg-[#141414] rounded-[32px] border-4 border-white/5 flex items-center justify-center overflow-hidden shadow-2xl">
            {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-cover" /> : <Store size={48} className="text-white/10" />}
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF6B00]/10 text-[#FF6B00] rounded-lg text-xs font-black">
              <Tag size={12} /> {store.category?.name || 'متجر معتمد'}
            </div>
            <h1 className="text-4xl font-black">{store.name}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-white/50 text-sm font-bold">
              <div className="flex items-center gap-1.5"><MapPin size={16} className="text-[#FF6B00]" /> {store.area}</div>
              <div className="flex items-center gap-1.5"><Phone size={16} className="text-[#FF6B00]" /> {store.phone}</div>
            </div>
          </div>

          <div className="flex gap-3">
            <a href={`tel:${store.phone}`} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-[#FF6B00] hover:text-white transition-all"><Phone size={24} /></a>
            <a href={`https://wa.me/${store.whatsapp}`} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-green-500 hover:text-white transition-all"><MessageSquare size={24} /></a>
          </div>
        </div>
      </div>

      {/* Offers from this store */}
      <div className="space-y-8">
        <h2 className="text-2xl font-black flex items-center gap-3">
          <Tag className="text-[#FF6B00]" /> عروض المتجر الحالية
        </h2>

        {offers.length === 0 ? (
          <div className="text-center py-20 text-white/30 font-bold border-2 border-dashed border-white/5 rounded-3xl"> لا توجد عروض نشطة حالياً لهذا المتجر</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer: any) => (
              <Link key={offer.id} href={`/offers/${offer.id}`}>
                <div className="glass p-6 rounded-3xl hover:border-[#FF6B00]/50 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-[#FF6B00] text-white font-black rounded-lg text-lg shadow-lg shadow-orange-900/20">{offer.discount}</span>
                    <span className="text-[10px] font-black text-white/30 uppercase">خصم حصري</span>
                  </div>
                  <h3 className="font-black text-white group-hover:text-[#FF6B00] transition-colors leading-relaxed">{offer.title}</h3>
                  <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-xs font-bold text-white/40">
                    <span>📅 ينتهي {new Date(offer.endDate).toLocaleDateString('ar-EG')}</span>
                    <span className="text-[#FF6B00]">عرض التفاصيل ←</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
