'use client';
import { useState, useEffect } from 'react';
import { Tag, Edit3, Trash2, Plus, Eye, Clock, Calendar, MoreVertical, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { vendorApi, resolveImageUrl } from '@/lib/api';
import { DashboardSkeleton } from '@/components/Skeleton';
import { motion } from 'framer-motion';

interface Offer {
  id: string;
  title: string;
  status: string;
  views: number;
  createdAt: string;
  images: string[];
  _count: {
    coupons: number;
  };
}

export default function OffersListPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorApi()
      .get<Offer[]>('/offers/my')
      .then((res) => setOffers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      'ACTIVE': 'نشط الآن',
      'PENDING': 'قيد المراجعة',
      'REJECTED': 'مرفوض',
      'EXPIRED': 'منتهي',
      'PAUSED': 'متوقف'
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    if (status === 'ACTIVE') return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (status === 'REJECTED') return 'bg-red-500/10 text-red-500 border-red-500/20';
    if (status === 'PENDING') return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    return 'bg-white/5 text-text-dim border-white/5';
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="p-8 dir-rtl animate-in max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">إدارة العروض</h1>
          <p className="text-text-dim mt-2 font-bold flex items-center gap-2">
            <Tag size={16} className="text-primary" />
            لديك <span className="text-white">{offers.length}</span> عرضاً مضافاً
          </p>
        </div>
        <Link href="/dashboard/offers/new" className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 w-full md:w-auto justify-center">
          <Plus size={20} />
          إضافة عرض جديد
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {offers.length === 0 ? (
          <div className="col-span-full py-24 glass rounded-[3rem] flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
               <Tag size={40} className="text-white/10" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">لا توجد عروض حالياً</h3>
            <p className="text-text-dim max-w-sm font-medium">ابدأ الآن بإضافة أول عرض لمتجرك واجذب العملاء!</p>
          </div>
        ) : (
          offers.map((offer, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={offer.id}
              className="glass rounded-[2.5rem] overflow-hidden group hover:border-primary/30 transition-all flex flex-col"
            >
              {/* Image Header */}
              <div className="relative h-48 bg-white/5 overflow-hidden">
                {offer.images && offer.images.length > 0 ? (
                  <img 
                    src={resolveImageUrl(offer.images[0])} 
                    alt={offer.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/5">
                    <Tag size={48} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-4 right-4">
                   <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md ${getStatusColor(offer.status)}`}>
                    {getStatusLabel(offer.status)}
                  </div>
                </div>
              </div>

              <div className="p-8 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors line-clamp-1 flex-1">{offer.title}</h3>
                  <button className="text-white/10 hover:text-white transition-colors mr-2">
                    <MoreVertical size={20} />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <p className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-1 flex items-center gap-2">
                        <TrendingUp size={10} className="text-primary" /> المشاهدات
                      </p>
                      <p className="text-xl font-black text-white">{offer.views || 0}</p>
                   </div>
                   <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <p className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-1 flex items-center gap-2">
                         <Users size={10} className="text-green-500" /> الطلبات
                      </p>
                      <p className="text-xl font-black text-white">{offer._count?.coupons || 0}</p>
                   </div>
                </div>

                <div className="flex items-center gap-3 text-text-dim text-xs font-bold bg-white/5 p-4 rounded-2xl">
                  <Calendar size={14} className="text-primary" />
                  <span>تاريخ البدء: {new Date(offer.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>

              <div className="p-4 bg-white/[0.02] border-t border-white/5 flex gap-3">
                 <button className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                    <Edit3 size={14} /> تعديل
                 </button>
                 <button className="w-14 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl flex items-center justify-center transition-all group/del">
                    <Trash2 size={18} className="group-hover/del:scale-110 transition-transform" />
                 </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
