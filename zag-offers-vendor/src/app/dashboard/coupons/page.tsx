'use client';
import { useState, useEffect } from 'react';
import { Download, UserCheck, Clock, Tag, Search, Filter, Calendar } from 'lucide-react';
import { vendorApi } from '@/lib/api';
import { DashboardSkeleton } from '@/components/Skeleton';
import { motion } from 'framer-motion';

interface CouponLog {
  id: string;
  code: string;
  status: string;
  createdAt: string;
  redeemedAt: string | null;
  offer: {
    title: string;
  };
  customer: {
    name: string;
  };
}

export default function CouponsLogPage() {
  const [logs, setLogs] = useState<CouponLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorApi()
      .get<CouponLog[]>('/coupons/merchant')
      .then((res) => setLogs(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getStatusLabel = (status: string) => {
    if (status === 'REDEEMED' || status === 'USED') return 'تم التفعيل';
    if (status === 'EXPIRED') return 'منتهي';
    return 'مستخرج';
  };

  const getStatusColor = (status: string) => {
    if (status === 'REDEEMED' || status === 'USED') return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (status === 'EXPIRED') return 'bg-red-500/10 text-red-500 border-red-500/20';
    return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="p-8 dir-rtl animate-in max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">سجل الكوبونات</h1>
          <p className="text-text-dim mt-2 font-bold flex items-center gap-2">
            <Clock size={16} className="text-primary" />
            متابعة تاريخ عمليات المسح والطلبات
          </p>
        </div>
        <div className="flex gap-3">
          <button className="glass px-6 py-4 rounded-2xl flex items-center gap-2 text-white font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all">
             <Filter size={16} /> تصفية
          </button>
          <button className="bg-white text-bg px-6 py-4 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl shadow-black/20">
             <Download size={16} /> تصدير التقرير
          </button>
        </div>
      </div>

      <div className="glass rounded-[2.5rem] overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-4">
           <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
              <input type="text" placeholder="البحث برقم الكوبون أو اسم العميل..." className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pr-12 pl-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all" />
           </div>
        </div>

        <div className="overflow-x-auto">
          {logs.length === 0 ? (
            <div className="p-24 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Tag size={32} className="text-white/10" />
              </div>
              <h3 className="text-xl font-black text-white">لا يوجد سجلات حتى الآن</h3>
              <p className="text-text-dim mt-2 font-medium">ستظهر هنا كافة عمليات طلب وتفعيل الكوبونات</p>
            </div>
          ) : (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="text-text-dim text-[10px] font-black uppercase tracking-widest bg-white/[0.01]">
                  <th className="p-6 border-b border-white/5">العميل</th>
                  <th className="p-6 border-b border-white/5">العرض</th>
                  <th className="p-6 border-b border-white/5">الكود</th>
                  <th className="p-6 border-b border-white/5">الحالة</th>
                  <th className="p-6 border-b border-white/5">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log, i) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    key={log.id} 
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="p-6">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center font-black text-white/20 border border-white/5">
                             {log.customer?.name?.[0] || 'U'}
                          </div>
                          <span className="font-bold text-white text-sm">{log.customer?.name || 'عميل مميز'}</span>
                       </div>
                    </td>
                    <td className="p-6 text-text-dim text-sm font-medium">{log.offer?.title}</td>
                    <td className="p-6">
                      <span className="font-mono font-black text-primary text-sm tracking-tighter group-hover:tracking-widest transition-all">{log.code}</span>
                    </td>
                    <td className="p-6">
                      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(log.status)}`}>
                        {getStatusLabel(log.status)}
                      </div>
                    </td>
                    <td className="p-6 text-text-dim text-xs font-bold">
                       <div className="flex flex-col gap-1">
                          <span>{new Date(log.redeemedAt || log.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span className="opacity-40">{new Date(log.redeemedAt || log.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                       </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
