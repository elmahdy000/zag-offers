'use client';

import { useState } from 'react';
import {
  History,
  Loader2,
  Search,
  User,
  Calendar,
  Activity,
  ArrowRight,
  ShieldCheck,
  XCircle,
  Megaphone,
  Filter,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { adminApi } from '@/lib/api';

// Components
import { PageHeader } from '@/components/shared/PageHeader';

interface AuditLog {
  id: string;
  action: string;
  details: string | null;
  targetId: string | null;
  targetName: string | null;
  createdAt: string;
  admin: {
    id: string;
    name: string;
    phone: string;
  };
}

const actionConfig: Record<string, { label: string; color: string; icon: any }> = {
  APPROVE_STORE: { label: 'اعتماد متجر', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: ShieldCheck },
  REJECT_STORE: { label: 'رفض متجر', color: 'text-rose-600 bg-rose-50 border-rose-100', icon: XCircle },
  APPROVE_OFFER: { label: 'اعتماد عرض', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: ShieldCheck },
  REJECT_OFFER: { label: 'رفض عرض', color: 'text-rose-600 bg-rose-50 border-rose-100', icon: XCircle },
  SEND_BROADCAST: { label: 'إرسال تنبيه جماعي', color: 'text-blue-600 bg-blue-50 border-blue-100', icon: Megaphone },
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('ar-EG', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, actionFilter],
    queryFn: async () => {
      const response = await adminApi().get('/admin/audit-logs', {
        params: {
          page,
          limit: 15,
          action: actionFilter || undefined,
        },
      });
      return response.data as { items: AuditLog[]; meta: { total: number; lastPage: number } };
    },
  });

  const logs = data?.items ?? [];

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <PageHeader
        title="سجل العمليات الإدارية"
        description="مراقبة كافة التحركات والقرارات التي تم اتخاذها من قبل مديري النظام"
        icon={History}
      />

      {/* Filters Area */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl text-slate-500">
           <Filter size={16} />
           <span className="text-xs font-black uppercase tracking-widest">تصفية حسب الأكشن</span>
        </div>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold focus:outline-none focus:border-orange-500 transition-all min-w-[200px]"
        >
          <option value="">جميع العمليات</option>
          {Object.entries(actionConfig).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">العملية</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">المدير المسئول</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">الهدف</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">التوقيت</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8"><div className="h-4 bg-slate-100 rounded-full w-full" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center text-slate-300">
                       <Activity size={48} className="mb-4 opacity-20" />
                       <p className="text-lg font-black tracking-tight text-slate-400">لا توجد سجلات حالياً</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => {
                  const config = actionConfig[log.action] || { label: log.action, color: 'text-slate-600 bg-slate-50', icon: Activity };
                  return (
                    <motion.tr 
                      key={log.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${config.color} text-[11px] font-black`}>
                           <config.icon size={14} />
                           {config.label}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                           <div className="h-9 w-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-black text-xs border border-orange-100">
                              {log.admin.name.charAt(0)}
                           </div>
                           <div>
                              <p className="text-sm font-black text-slate-900 leading-none mb-1">{log.admin.name}</p>
                              <p className="text-[10px] font-bold text-slate-400">{log.admin.phone}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {log.targetName ? (
                          <div className="flex items-center gap-2 text-slate-600">
                             <span className="text-sm font-bold truncate max-w-[150px]">{log.targetName}</span>
                             <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">#{log.targetId?.slice(0, 5)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs font-bold">---</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-slate-500">
                           <Calendar size={14} className="text-slate-300" />
                           <span className="text-xs font-bold whitespace-nowrap">{formatDate(log.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-bold text-slate-500 line-clamp-1 italic max-w-[200px]" title={log.details || ''}>
                          {log.details || 'بدون تفاصيل إضافية'}
                        </p>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(data?.meta?.lastPage ?? 0) > 1 && (
          <div className="flex items-center justify-between px-8 py-6 bg-slate-50/50 border-t border-slate-100">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">عرض سجلات العمليات</p>
             <div className="flex gap-2">
                {Array.from({ length: data?.meta?.lastPage ?? 0 }).map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setPage(i + 1)} 
                    className={`h-9 w-9 rounded-xl text-xs font-black transition-all ${page === i + 1 ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-400'}`}
                  >
                    {i + 1}
                  </button>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
