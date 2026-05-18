'use client';
import { useState, useEffect } from 'react';
import { Download, Clock, Tag, Search, Filter, Calendar, ChevronLeft, User, AlertCircle, RefreshCw } from 'lucide-react';
import { vendorApi } from '@/lib/api';
import { useVendorCoupons } from '@/hooks/use-vendor-api';
import { DashboardSkeleton } from '@/components/Skeleton';
import { motion } from 'framer-motion';

import { secureStorage } from '@/lib/crypto';

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
  const [cachedLogs, setCachedLogs] = useState<CouponLog[]>([]);

  // React Query hook
  const { data: logs, isLoading, refetch } = useVendorCoupons();
  const [fetchError, setFetchError] = useState(false);

  // تحسين: منطق الكاش للأوفلاين باستخدام التخزين الآمن
  useEffect(() => {
    const cached = secureStorage.get<CouponLog[]>('cache_vendor_coupons');
    if (cached) setCachedLogs(cached);
  }, []);

  // تحديث الكاش عند النجاح
  useEffect(() => {
    if (logs) {
      secureStorage.set('cache_vendor_coupons', logs);
      setCachedLogs(logs);
      setFetchError(false);
    }
  }, [logs]);

  // تحديث تلقائي عند عودة النت
  useEffect(() => {
    const handleOnline = () => refetch();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [refetch]);

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

  const [visibleCount, setVisibleCount] = useState(20);
  const displayLogs = logs || cachedLogs;

  const exportToCSV = () => {
    if (!displayLogs?.length) return;
    
    const headers = ['الكود', 'العميل', 'العرض', 'الحالة', 'تاريخ التفعيل'];
    const rows = displayLogs.map((log: CouponLog) => [
      log.code,
      log.customer?.name || 'عميل مجهول',
      log.offer?.title,
      getStatusLabel(log.status),
      new Date(log.redeemedAt || log.createdAt).toLocaleString('ar-EG')
    ]);

    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `zag-offers-coupons-${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading && displayLogs.length === 0) return <DashboardSkeleton />;

  const filteredLogs = displayLogs ? displayLogs.filter((log: CouponLog) => 
    log.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.offer?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const visibleLogs = filteredLogs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredLogs.length;

  return (
    <div className="p-4 sm:p-10 dir-rtl animate-in max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-text tracking-tighter">سجل الكوبونات</h1>
          <p className="text-text-dim text-sm font-bold mt-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            {displayLogs?.length || 0} عملية حتى الآن
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={() => refetch()} className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-text-dim hover:text-primary transition-all border border-glass-border" title="تحديث">
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button onClick={exportToCSV} className="flex-1 sm:flex-none bg-primary text-white h-12 px-6 rounded-2xl font-black text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
            <Download size={16} /> تصدير CSV
          </button>
        </div>
      </div>

      {fetchError && !displayLogs?.length && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 glass rounded-[2.5rem] border border-red-500/20 flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-4">
            <AlertCircle size={28} />
          </div>
          <h3 className="text-sm font-black text-text mb-2">فشل تحميل الكوبونات</h3>
          <p className="text-[11px] text-text-dim mb-6 max-w-xs">تأكد من اتصالك بالإنترنت أو حاول مرة أخرى</p>
          <button onClick={() => refetch()} className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-xs shadow-lg shadow-primary/20 flex items-center gap-2">
            <RefreshCw size={14} /> إعادة المحاولة
          </button>
        </motion.div>
      )}

      <div className="glass rounded-[2.5rem] overflow-hidden border border-glass-border inner-shadow bg-glass">
        {/* Search & Filter Bar */}
        <div className="p-5 border-b border-glass-border flex flex-col md:flex-row gap-4 items-center bg-glass">
           <div className="flex-1 relative w-full">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dimmer" size={16} />
              <input 
                type="text" 
                placeholder="ابحث برقم الكوبون، اسم العميل، أو عنوان العرض..." 
                className="w-full bg-bg border border-glass-border rounded-xl py-3 pr-11 pl-4 text-xs font-bold text-text focus:border-primary outline-none transition-all placeholder:text-text-dimmer/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <div className="flex gap-3 w-full md:w-auto">
             <button onClick={exportToCSV} className="flex-1 md:flex-none glass px-5 py-3.5 rounded-xl flex items-center justify-center gap-2 text-text font-black text-[11px] uppercase tracking-wider hover:bg-glass-heavy transition-all">
               <Download size={16} className="text-primary" /> تصدير CSV
             </button>
           </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {filteredLogs.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-16 h-16 bg-glass-heavy rounded-[2rem] flex items-center justify-center mx-auto mb-5 border border-glass-border">
                <Tag size={28} className="text-text-tertiary" />
              </div>
              <h3 className="text-base font-black text-text">لا توجد سجلات مطابقة</h3>
              <p className="text-text-dim mt-2 font-bold text-[11px]">حاول استخدام كلمات بحث أخرى أو قم بتغيير الفلاتر</p>
            </div>
          ) : (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="text-text-dim text-[9px] font-black uppercase tracking-[0.2em] bg-glass">
                  <th className="px-6 py-4 border-b border-glass-border">العميل</th>
                  <th className="px-6 py-4 border-b border-glass-border">العرض المرتبط</th>
                  <th className="px-6 py-4 border-b border-glass-border">رقم الكوبون</th>
                  <th className="px-6 py-4 border-b border-glass-border">حالة التفعيل</th>
                  <th className="px-6 py-4 border-b border-glass-border">التوقيت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {visibleLogs.map((log: CouponLog, i: number) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    key={log.id} 
                    className="hover:bg-glass transition-colors group"
                  >
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-glass-heavy rounded-xl flex items-center justify-center font-black text-text-dimmer border border-glass-border text-[14px] uppercase shadow-sm">
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
        
        {/* Load More Section */}
        {hasMore && (
          <div className="p-8 border-t border-glass-border flex justify-center bg-glass">
            <button 
              onClick={() => setVisibleCount(prev => prev + 20)}
              className="px-10 py-3.5 bg-glass-heavy border border-glass-border rounded-2xl text-text-dim font-black text-[11px] uppercase tracking-widest hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all active:scale-95"
            >
              تحميل المزيد من السجلات
            </button>
          </div>
        )}
        
        {/* Footer info */}
        <div className="p-4 bg-glass border-t border-glass-border flex justify-center">
           <p className="text-[9px] font-black text-text-dimmer uppercase tracking-[0.3em]">Zag Offers Logging System v2.0</p>
        </div>
      </div>
    </div>
  );
}
