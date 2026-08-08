'use client';

import { useState, useEffect, useRef, type ComponentType } from 'react';
import {
  History,
  Calendar,
  Activity,
  ShieldCheck,
  XCircle,
  Megaphone,
  Filter,
  Eye,
  Edit3,
  Trash2,
  PlusCircle,
  Copy,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '@/lib/api';
import { useSocketContext } from '@/components/SocketProvider';

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

const actionConfig: Record<string, { label: string; color: string; icon: ComponentType<{ size?: number; className?: string }> }> = {
  GENERATE_COUPON: { label: 'إنشاء كوبون', color: 'text-blue-600 bg-blue-50 border-blue-100', icon: PlusCircle },
  CREATE_OFFER: { label: 'إنشاء عرض', color: 'text-blue-600 bg-blue-50 border-blue-100', icon: PlusCircle },
  APPROVE_STORE: { label: 'اعتماد متجر', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: ShieldCheck },
  REJECT_STORE: { label: 'رفض متجر', color: 'text-rose-600 bg-rose-50 border-rose-100', icon: XCircle },
  APPROVE_OFFER: { label: 'اعتماد عرض', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: ShieldCheck },
  REJECT_OFFER: { label: 'رفض عرض', color: 'text-rose-600 bg-rose-50 border-rose-100', icon: XCircle },
  UPDATE_OFFER: { label: 'تعديل عرض', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: Edit3 },
  DELETE_OFFER: { label: 'حذف عرض', color: 'text-rose-600 bg-rose-50 border-rose-100', icon: Trash2 },
  CREATE_CATEGORY: { label: 'إضافة قسم', color: 'text-blue-600 bg-blue-50 border-blue-100', icon: PlusCircle },
  UPDATE_CATEGORY: { label: 'تعديل قسم', color: 'text-blue-600 bg-blue-50 border-blue-100', icon: Edit3 },
  DELETE_CATEGORY: { label: 'حذف قسم', color: 'text-rose-600 bg-rose-50 border-rose-100', icon: Trash2 },
  SEND_BROADCAST: { label: 'إرسال تنبيه جماعي', color: 'text-indigo-600 bg-indigo-50 border-indigo-100', icon: Megaphone },
  CHANGE_ROLE: { label: 'تغيير صلاحيات', color: 'text-purple-600 bg-purple-50 border-purple-100', icon: ShieldCheck },
  LOGIN: { label: 'تسجيل دخول', color: 'text-blue-600 bg-blue-50 border-blue-100', icon: Activity },
  LOGOUT: { label: 'تسجيل خروج', color: 'text-slate-600 bg-slate-50 border-slate-100', icon: Activity },
};

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ar-EG', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' });
const shortId = (value: string | null) => value ? `${value.slice(0, 8)}…${value.slice(-7)}` : '—';

function LogDetailsModal({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  const config = actionConfig[log.action] || { label: log.action, color: 'text-slate-600 bg-slate-50', icon: Activity };
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const focusable = Array.from(modalRef.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? []);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  const copyValue = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1200);
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="admin-modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-[2px] sm:p-6"
    >
      <motion.div 
        ref={modalRef}
        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        role="dialog" aria-modal="true" aria-labelledby="audit-modal-title" aria-describedby="audit-modal-description"
        className="flex max-h-[calc(100vh-48px)] w-full max-w-[680px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl border ${config.color}`}>
              <config.icon size={24} />
            </div>
            <div>
              <h3 id="audit-modal-title" className="text-lg font-bold text-slate-900">{config.label}</h3>
              <p id="audit-modal-description" className="mt-1 text-xs font-medium text-slate-500">تفاصيل العملية الإدارية المسجلة</p>
            </div>
          </div>
          <button ref={closeButtonRef} aria-label="إغلاق" onClick={onClose} className="admin-focus flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">المدير المسئول</p>
              <p className="text-sm font-bold text-slate-800">{log.admin.name}</p>
              <p dir="ltr" className="technical-value mt-1 text-[11px] font-semibold text-slate-500">{log.admin.phone}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">التوقيت</p>
              <p className="text-sm font-bold text-slate-800">{formatDate(log.createdAt)}</p><p className="mt-1 text-xs text-slate-500">{formatTime(log.createdAt)}</p>
            </div>
          </div>

          <div>
            <p className="mb-3 px-1 text-xs font-semibold text-slate-500">الجهة المتأثرة</p>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                  {log.targetName?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{log.targetName || '—'}</p>
                  <p dir="ltr" title={log.targetId || undefined} className="technical-value text-xs text-slate-500">{shortId(log.targetId)}</p>
                </div>
              </div>
              {log.targetId && <button aria-label="نسخ معرف الهدف" onClick={() => void copyValue(log.targetId!, 'target')} className="admin-focus flex h-10 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600">{copied === 'target' ? <Check size={14} /> : <Copy size={14} />}{copied === 'target' ? 'تم النسخ' : 'نسخ'}</button>}
            </div>
          </div>

          {log.details && (
            <div>
              <p className="mb-3 px-1 text-xs font-semibold text-slate-500">تفاصيل الحدث</p>
              <div dir="auto" className="break-words rounded-xl border border-orange-100 bg-orange-50/50 p-4 text-sm font-medium leading-7 text-slate-700">
                {log.details}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-xs font-semibold text-slate-500">تفاصيل تقنية</p>
            <dl className="space-y-3 text-xs"><div><dt className="text-slate-500">اسم الحدث الخام</dt><dd dir="ltr" className="technical-value mt-1 text-slate-800">{log.action}</dd></div><div><dt className="text-slate-500">معرف السجل</dt><dd className="mt-1 flex items-center gap-2"><span dir="ltr" title={log.id} className="technical-value text-slate-800">{shortId(log.id)}</span><button aria-label="نسخ معرف السجل" onClick={() => void copyValue(log.id, 'log')} className="admin-focus flex h-8 items-center gap-1 rounded-md border border-slate-200 px-2">{copied === 'log' ? <Check size={13} /> : <Copy size={13} />}{copied === 'log' && 'تم النسخ'}</button></dd></div></dl>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AuditLogsPage() {
  const queryClient = useQueryClient();
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    };
    socket.on('admin_notification', handler);
    return () => { socket.off('admin_notification', handler); };
  }, [socket, queryClient]);

  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['audit-logs', page, actionFilter],
    queryFn: async () => {
      const response = await adminApi().get('/admin/audit-logs', {
        params: {
          page,
          limit: 15,
          action: actionFilter || undefined,
        },
      });
      if (!Array.isArray(response.data?.items)) throw new Error('Invalid response');
      return response.data as { items: AuditLog[]; meta: { total: number; lastPage: number } };
    },
    retry: 1,
  });

  const logs = data?.items ?? [];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="سجل العمليات الإدارية"
        description="مراقبة كافة التحركات والقرارات التي تم اتخاذها من قبل مديري النظام"
        icon={History}
      />

      <AnimatePresence>
        {selectedLog && <LogDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
      </AnimatePresence>

      {/* Filters Area */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl text-slate-500">
           <Filter size={16} />
           <span className="text-xs font-semibold">تصفية حسب نوع العملية</span>
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

      <div className="admin-table-shell">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-4 text-xs font-semibold text-slate-500">العملية</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500">المدير المسؤول</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500">الهدف</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500">التوقيت</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center text-slate-400">
                      <AlertTriangle size={48} className="mb-4 opacity-40 text-rose-500" />
                      <p className="text-lg font-bold text-slate-500">فشل تحميل البيانات</p>
                      <button onClick={() => refetch()} className="mt-6 h-10 px-5 rounded-xl bg-orange-600 text-white text-sm font-bold hover:bg-orange-700 transition-all flex items-center gap-2 shadow-lg">
                        <RefreshCw size={16} /> إعادة المحاولة
                      </button>
                    </div>
                  </td>
                </tr>
              ) : isLoading ? (
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
                       <p className="text-lg font-bold tracking-tight text-slate-400">لا توجد سجلات حالياً</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => {
                  const config = actionConfig[log.action] || { label: log.action, color: 'text-slate-600 bg-slate-50', icon: Activity };
                  return (
                    <motion.tr 
                      key={log.id}
                      tabIndex={0}
                      role="button"
                      aria-label={`عرض تفاصيل ${config.label}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedLog(log);
                        }
                      }}
                    >
                      <td className="px-6 py-5">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${config.color} text-[11px] font-bold whitespace-nowrap`}>
                           <config.icon size={14} />
                           {config.label}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                           <div className="h-9 w-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xs border border-orange-100">
                              {log.admin.name.charAt(0)}
                           </div>
                           <div>
                              <p className="text-sm font-bold text-slate-900 leading-none mb-1">{log.admin.name}</p>
                              <p className="text-xs font-bold text-slate-400">{log.admin.phone}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {log.targetName ? (
                          <div className="flex items-center gap-2 text-slate-600">
                             <span className="text-sm font-bold truncate max-w-[150px]">{log.targetName}</span>
                             <span className="text-[9px] font-bold bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 text-slate-400">#{log.targetId?.slice(0, 5)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-bold">—</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-slate-500">
                           <Calendar size={14} className="text-slate-300" />
                           <span className="text-xs font-bold whitespace-nowrap">{formatDate(log.createdAt)} · {formatTime(log.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-left">
                        <button 
                          aria-label="عرض تفاصيل العملية"
                          className="admin-focus flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-orange-200 hover:text-orange-600"
                        >
                           <Eye size={16} />
                        </button>
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
             <p className="text-xs font-semibold text-slate-500">إجمالي السجلات: {data?.meta.total ?? 0}</p>
             <div className="flex gap-2">
                {Array.from({ length: data?.meta?.lastPage ?? 0 }).map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setPage(i + 1)} 
                    className={`h-9 w-9 rounded-xl text-xs font-bold transition-all ${page === i + 1 ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-400'}`}
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

