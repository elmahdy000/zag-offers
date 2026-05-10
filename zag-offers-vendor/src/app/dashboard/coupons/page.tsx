'use client';
import { useState } from 'react';
import { Download, Clock, Tag, Search, Filter, Calendar, ChevronLeft, User } from 'lucide-react';
import { vendorApi } from '@/lib/api';
import { useVendorCoupons } from '@/hooks/use-vendor-api';
import { DashboardSkeleton } from '@/components/Skeleton';
import { motion } from 'framer-motion';

interface CouponLog {
  id: string;
  code: string;
  status: string;
  createdAt: string;
  redeemedAt: string | null;
  offer: { title: string };
  customer: { name: string };
}

export default function CouponsLogPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // React Query hook
  const { data: logs, isLoading } = useVendorCoupons();

  const getStatusLabel = (status: string) => {
    if (status === 'REDEEMED' || status === 'USED') return 'تم التفعيل';
    if (status === 'EXPIRED') return 'منتهي';
    return 'مستخرج';
  };

  const getStatusColor = (status: string) => {
    if (status === 'REDEEMED' || status === 'USED') return 'bg-secondary/10 text-secondary border-secondary/20';
    if (status === 'EXPIRED') return 'bg-red-500/10 text-red-500 border-red-500/20';
    return 'bg-primary/10 text-primary border-primary/20';
  };

  if (isLoading) return <DashboardSkeleton />;

  const filteredLogs = logs ? logs.filter((log: any) => 
    log.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.offer?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <div className="p-4 sm:p-8 dir-rtl animate-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-black text-text tracking-tight">سجل الكوبونات</h1>
          <p className="text-text-dim mt-2 font-bold flex items-center gap-2 text-xs">
            <Clock size={14} className="text-primary" />
            إجمالي {logs ? logs.length : 0} عملية سجلت بالنظام
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none glass px-5 py-3.5 rounded-xl flex items-center justify-center gap-2 text-text font-black text-[11px] uppercase tracking-wider hover:bg-white/5 transition-all">
             <Download size={16} className="text-primary" /> تصدير CSV
          </button>
        </div>
      </div>

      <div className="glass rounded-[2.5rem] overflow-hidden border border-white/5 inner-shadow bg-white/[0.01]">
        {/* Search & Filter Bar */}
        <div className="p-5 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center bg-white/[0.01]">
           <div className="flex-1 relative w-full">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dimmer" size={16} />
              <input 
                type="text" 
                placeholder="ابحث برقم الكوبون، اسم العميل، أو عنوان العرض..." 
                className="w-full bg-bg border border-white/5 rounded-xl py-3 pr-11 pl-4 text-xs font-bold text-text focus:border-primary outline-none transition-all placeholder:text-text-dimmer/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <button className="p-3 bg-white/5 rounded-xl text-text-dim hover:text-text border border-white/5">
              <Filter size={18} />
           </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {filteredLogs.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-5 border border-white/5">
                <Tag size={28} className="text-white/10" />
              </div>
              <h3 className="text-base font-black text-text">لا توجد سجلات مطابقة</h3>
              <p className="text-text-dim mt-2 font-bold text-[11px]">حاول استخدام كلمات بحث أخرى أو قم بتغيير الفلاتر</p>
            </div>
          ) : (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="text-text-dim text-[9px] font-black uppercase tracking-[0.2em] bg-white/[0.02]">
                  <th className="px-6 py-4 border-b border-white/5">العميل</th>
                  <th className="px-6 py-4 border-b border-white/5">العرض المرتبط</th>
                  <th className="px-6 py-4 border-b border-white/5">رقم الكوبون</th>
                  <th className="px-6 py-4 border-b border-white/5">حالة التفعيل</th>
                  <th className="px-6 py-4 border-b border-white/5">التوقيت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filteredLogs.map((log: any, i: number) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    key={log.id} 
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center font-black text-text-dimmer border border-white/5 text-[14px] uppercase shadow-sm">
                             {log.customer?.name?.[0] || <User size={14} />}
                          </div>
                          <span className="font-black text-text text-[12px]">{log.customer?.name || 'عميل مجهول'}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[12px] font-bold text-text-dim line-clamp-1 group-hover:text-text transition-colors">
                        {log.offer?.title}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-black text-primary text-[12px] tracking-tight group-hover:tracking-widest transition-all duration-300">
                        {log.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border backdrop-blur-sm ${getStatusColor(log.status)}`}>
                        <div className="w-1 h-1 rounded-full bg-current" />
                        {getStatusLabel(log.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-black text-text-dim">
                            {new Date(log.redeemedAt || log.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                          </span>
                          <span className="text-[9px] font-bold text-text-dimmer uppercase tracking-tighter">
                            {new Date(log.redeemedAt || log.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                       </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Footer info */}
        <div className="p-4 bg-white/[0.01] border-t border-white/5 flex justify-center">
           <p className="text-[9px] font-black text-text-dimmer uppercase tracking-[0.3em]">Zag Offers Logging System v2.0</p>
        </div>
      </div>
    </div>
  );
}
