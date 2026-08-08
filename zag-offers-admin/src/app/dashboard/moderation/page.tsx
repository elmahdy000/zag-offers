'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Flag, Loader2, MessageSquareWarning, RefreshCw, Star } from 'lucide-react';
import { adminApi, getApiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/components/shared/Toast';

type Review = {
  id: string; rating: number; comment?: string; status: 'PUBLISHED' | 'HIDDEN'; createdAt: string;
  customer: { name: string }; store: { name: string };
};
type Report = {
  id: string; reason: string; details?: string; status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  entityType: string; entityId: string; createdAt: string; reporter?: { name: string };
};

export default function ModerationPage() {
  const [tab, setTab] = useState<'reviews' | 'reports'>('reviews');
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const reviews = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => (await adminApi().get<{ items: Review[] }>('/admin/reviews')).data.items,
  });
  const reports = useQuery({
    queryKey: ['admin-content-reports'],
    queryFn: async () => (await adminApi().get<{ items: Report[] }>('/admin/content-reports')).data.items,
  });
  const moderate = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Review['status'] }) =>
      adminApi().patch(`/admin/reviews/${id}/moderate`, { status }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }); showToast('تم تحديث حالة التقييم'); },
    onError: (error) => showToast(getApiErrorMessage(error, 'تعذر تحديث التقييم'), 'error'),
  });
  const resolve = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'RESOLVED' | 'DISMISSED' }) =>
      adminApi().patch(`/admin/content-reports/${id}/resolve`, { status }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['admin-content-reports'] }); showToast('تم إغلاق البلاغ'); },
    onError: (error) => showToast(getApiErrorMessage(error, 'تعذر تحديث البلاغ'), 'error'),
  });
  const active = tab === 'reviews' ? reviews : reports;

  return <div className="space-y-6 p-5 sm:p-6 lg:p-10">
    <PageHeader title="المحتوى والبلاغات" description="مراجعة تقييمات العملاء ومعالجة البلاغات بوضوح وشفافية" icon={MessageSquareWarning} />
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
      <button onClick={() => setTab('reviews')} className={`rounded-lg px-4 py-2 text-xs font-bold ${tab === 'reviews' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>التقييمات</button>
      <button onClick={() => setTab('reports')} className={`rounded-lg px-4 py-2 text-xs font-bold ${tab === 'reports' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>البلاغات</button>
    </div>
    {active.isLoading ? <div className="grid min-h-48 place-items-center"><Loader2 className="animate-spin text-orange-600" /></div> : active.isError ?
      <button onClick={() => active.refetch()} className="mx-auto flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white"><RefreshCw size={16}/>إعادة المحاولة</button> :
      tab === 'reviews' ? <div className="grid gap-3 lg:grid-cols-2">{(reviews.data ?? []).map(review =>
        <article key={review.id} className="admin-panel p-5">
          <div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-black text-slate-900">{review.store.name}</h2><p className="mt-1 text-xs text-slate-500">بواسطة {review.customer.name}</p></div><span className="flex items-center gap-1 text-xs font-black text-amber-600"><Star size={14} fill="currentColor"/>{review.rating}/5</span></div>
          <p className="my-4 min-h-10 text-sm leading-7 text-slate-600">{review.comment || 'بدون تعليق نصي'}</p>
          <button disabled={moderate.isPending} onClick={() => moderate.mutate({ id: review.id, status: review.status === 'HIDDEN' ? 'PUBLISHED' : 'HIDDEN' })} className={`flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-bold ${review.status === 'HIDDEN' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{review.status === 'HIDDEN' ? <Eye size={15}/> : <EyeOff size={15}/>} {review.status === 'HIDDEN' ? 'إعادة النشر' : 'إخفاء التقييم'}</button>
        </article>)}{reviews.data?.length === 0 && <p className="text-sm text-slate-500">لا توجد تقييمات.</p>}</div> :
      <div className="space-y-3">{(reports.data ?? []).map(report =>
        <article key={report.id} className="admin-panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600"><Flag size={19}/></span>
          <div className="min-w-0 flex-1"><h2 className="text-sm font-black text-slate-900">{report.reason}</h2><p className="mt-1 text-xs text-slate-500">{report.entityType} · {report.reporter?.name || 'مستخدم غير متاح'}</p><p className="mt-2 text-xs text-slate-600">{report.details}</p></div>
          {report.status === 'OPEN' ? <div className="flex gap-2"><button onClick={() => resolve.mutate({ id: report.id, status: 'RESOLVED' })} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">تم الحل</button><button onClick={() => resolve.mutate({ id: report.id, status: 'DISMISSED' })} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">رفض البلاغ</button></div> : <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500">{report.status === 'RESOLVED' ? 'تم الحل' : 'مرفوض'}</span>}
        </article>)}{reports.data?.length === 0 && <p className="text-sm text-slate-500">لا توجد بلاغات.</p>}</div>}
  </div>;
}
