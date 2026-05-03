'use client';

import { useEffect, useState } from 'react';
import {
  Loader2,
  Search,
  Ticket,
  X,
  Trash2,
  Filter,
  Store,
  User,
  Calendar,
  Zap,
  Tag,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '@/lib/api';

// Components
import { PageHeader } from '@/components/shared/PageHeader';
import { CouponCard } from '@/components/coupons/CouponCard';
import { useToast } from '@/components/shared/Toast';

interface CouponRow {
  id: string;
  code: string;
  status: 'GENERATED' | 'USED' | 'EXPIRED';
  createdAt: string;
  customer: { id: string; name: string };
  offer: { id: string; title: string; store: { name: string } };
}

interface CouponDetails extends CouponRow {
  usedAt?: string;
  customer: { id: string; name: string; phone: string; email: string };
  offer: CouponRow['offer'] & { discount: string; description: string };
}

const statusLabels: Record<string, { label: string; color: string }> = {
  GENERATED: { label: 'انتظار الاستخدام', color: 'text-amber-600 bg-amber-50 border-amber-100' },
  USED: { label: 'تم الاستخدام', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  EXPIRED: { label: 'منتهي الصلاحية', color: 'text-slate-500 bg-slate-50 border-slate-100' },
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '---';
  return new Date(dateString).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

function DetailItem({ label, value, icon: Icon, colorClass = "text-slate-900" }: { label: string; value: string; icon?: any, colorClass?: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:bg-white hover:shadow-md">
      <div className="flex items-center gap-2 mb-1.5">
        {Icon && <Icon size={14} className="text-slate-300" />}
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      </div>
      <p className={`text-sm font-bold ${colorClass} truncate`}>{value}</p>
    </div>
  );
}

export default function CouponsManagementPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ id: string; code: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons', debouncedSearch, statusFilter, page],
    queryFn: async () => {
      const response = await adminApi().get('/admin/coupons', {
        params: {
          search: debouncedSearch || undefined,
          status: statusFilter || undefined,
          page,
          limit: 12,
        },
      });
      return response.data as { items: CouponRow[]; meta: { total: number; lastPage: number } };
    },
  });

  const { data: couponDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['coupon-details', selectedCouponId],
    queryFn: async () => {
      const response = await adminApi().get<CouponDetails>(`/admin/coupons/${selectedCouponId}`);
      return response.data;
    },
    enabled: !!selectedCouponId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi().delete(`/admin/coupons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setDeleteModal(null);
      setSelectedCouponId(null);
      showToast('تم حذف الكوبون بنجاح');
    },
    onSettled: () => setBusyId(null),
  });

  const coupons = data?.items ?? [];

  return (
    <div className="p-6 lg:p-10 space-y-8">

      <PageHeader 
        title="سجل الكوبونات" 
        description="تتبع وإدارة كافة الكوبونات التي تم إصدارها واستخدامها من قبل العملاء" 
        icon={Ticket}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative lg:col-span-3">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بكود الكوبون، اسم العميل، أو المتجر..."
            className="h-[48px] w-full rounded-xl border border-slate-200 bg-white pr-11 pl-4 text-sm font-medium shadow-sm focus:border-orange-500 focus:outline-none transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-[48px] rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium focus:outline-none shadow-sm"
        >
          <option value="">كل الحالات</option>
          {Object.entries(statusLabels).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-40 animate-pulse bg-white rounded-2xl border border-slate-100 shadow-sm" />)}
        </div>
      ) : coupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
          <Ticket size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-bold">لم يتم العثور على كوبونات</p>
          <p className="text-sm font-medium mt-1">جرب تغيير معايير البحث أو الفلترة</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {coupons.map((coupon, idx) => (
            <CouponCard 
              key={coupon.id} 
              coupon={coupon} 
              index={idx}
              onView={(id) => setSelectedCouponId(id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {(data?.meta?.lastPage ?? 0) > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: data?.meta?.lastPage ?? 0 }).map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className={`h-10 w-10 rounded-xl text-sm font-bold transition-all ${page === i + 1 ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'}`}>{i + 1}</button>
          ))}
        </div>
      )}

      {/* Details Modal (Premium) */}
      <AnimatePresence>
        {selectedCouponId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/20 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-900 leading-tight">تفاصيل الكوبون الصادر</h2>
                <button onClick={() => setSelectedCouponId(null)} className="rounded-xl bg-slate-50 p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={20} /></button>
              </div>

              {detailsLoading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-orange-600" size={32} /></div>
              ) : (
                <div className="space-y-8">
                  {/* Visual Coupon Identity */}
                  <div className="relative overflow-hidden p-6 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-200 group">
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl group-hover:bg-orange-500/20 transition-all" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                         <div className="px-3 py-1 rounded-lg bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-orange-400">كود الكوبون</div>
                         <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusLabels[couponDetails?.status || ''].color}`}>
                            {statusLabels[couponDetails?.status || ''].label}
                         </div>
                      </div>
                      <p className="text-4xl font-black tracking-widest text-white font-mono">{couponDetails?.code}</p>
                      <div className="flex items-center gap-4 mt-6 pt-6 border-t border-white/5">
                        <div className="flex items-center gap-2">
                           <Calendar size={14} className="text-white/30" />
                           <span className="text-[10px] font-medium opacity-60">أصدر في {formatDate(couponDetails?.createdAt)}</span>
                        </div>
                        {couponDetails?.usedAt && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-emerald-400" />
                            <span className="text-[10px] font-medium text-emerald-400">استخدم في {formatDate(couponDetails.usedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DetailItem label="المتجر" value={couponDetails?.offer.store.name || ''} icon={Store} />
                    <DetailItem label="اسم العميل" value={couponDetails?.customer.name || ''} icon={User} />
                    <DetailItem label="رقم الهاتف" value={couponDetails?.customer.phone || ''} icon={User} />
                    <DetailItem label="نوع الخصم" value={couponDetails?.offer.discount || ''} icon={Tag} colorClass="text-orange-600" />
                    <div className="sm:col-span-2">
                      <DetailItem label="العرض المرتبط" value={couponDetails?.offer.title || ''} icon={Zap} />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => setDeleteModal({ id: couponDetails!.id, code: couponDetails!.code })}
                      className="flex-1 h-12 rounded-xl bg-rose-50 text-rose-600 font-bold text-sm flex items-center justify-center gap-2 border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 size={18} /> حذف سجل الكوبون
                    </button>
                    <button onClick={() => setSelectedCouponId(null)} className="flex-1 h-12 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">إغلاق</button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-rose-50 text-rose-600 mb-6"><AlertTriangle size={32} /></div>
              <h3 className="text-xl font-bold text-slate-900">حذف الكوبون؟</h3>
              <p className="mt-3 text-sm font-medium text-slate-500 leading-relaxed">هل أنت متأكد من حذف الكوبون "{deleteModal.code}"؟ سيتم مسح السجل الخاص به نهائياً.</p>
              <div className="mt-8 flex gap-4">
                <button onClick={() => { setBusyId(deleteModal.id); deleteMutation.mutate(deleteModal.id); }} disabled={!!busyId} className="flex-1 h-12 rounded-xl bg-rose-600 text-sm font-bold text-white hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/10">
                  {busyId === deleteModal.id ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'نعم، احذف'}
                </button>
                <button onClick={() => setDeleteModal(null)} className="flex-1 h-12 rounded-xl bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all">إلغاء</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
