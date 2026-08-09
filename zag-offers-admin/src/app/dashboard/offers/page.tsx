'use client';

import { useEffect, useState, useRef } from 'react';
import {
  AlertTriangle,
  Loader2,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  X,
  Zap,
  ExternalLink,
  TrendingUp,
  Users,
  Plus,
  Upload,
  Calendar as CalendarIcon,
  Star,
  Eye,
  Pencil,
  Store,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi, resolveImageUrl } from '@/lib/api';
import { parseNumericInput } from '@/lib/numeric-input';

// Components
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/components/shared/Toast';
import { useSocketContext } from '@/components/SocketProvider';
import Pagination from '@/components/shared/Pagination';

interface OfferRow {
  id: string;
  title: string;
  description?: string;
  discount: string;
  discountType?: string;
  status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'REJECTED' | 'EXPIRED' | 'PAUSED';
  createdAt: string;
  startDate?: string;
  endDate?: string;
  store: { id: string; name: string };
  originalPrice?: number;
  newPrice?: number;
  _count: { coupons: number };
  views?: number;
  images?: string[];
}

interface OfferDetails extends OfferRow {
  images: string[];
  discountType?: string;
  _count: { coupons: number; favorites: number; reviews: number };
  coupons?: {
    id: string;
    code: string;
    status: string;
    createdAt: string;
    customer: { id: string; name: string; phone: string };
  }[];
  reviews?: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    customer: { id: string; name: string; phone: string; avatar?: string };
  }[];
}

type OfferPayload = Record<string, FormDataEntryValue | number | null | string[]>;
type UpdateOfferPayload = { id: string; data: OfferPayload };

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    if (typeof response?.data?.message === 'string') return response.data.message;
  }
  return fallback;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

const statusLabels: Record<string, string> = {
  PENDING: 'معلق للمراجعة',
  ACTIVE: 'مقبول / نشط',
  REJECTED: 'مرفوض',
  EXPIRED: 'منتهي الصلاحية',
  PAUSED: 'متوقف مؤقتاً',
};

const statusClasses: Record<string, string> = {
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
  EXPIRED: 'border-slate-200 bg-slate-100 text-slate-600',
  PAUSED: 'border-slate-200 bg-slate-100 text-slate-600',
};

function formatOfferDate(value?: string) {
  return value ? new Date(value).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

export default function OffersManagementPage() {
  const queryClient = useQueryClient();
  const { socket } = useSocketContext();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ id: string; title: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tempImages, setTempImages] = useState<string[]>([]);

  const createFormRef = useRef<HTMLFormElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);

  const handlePriceCalc = (formType: 'create' | 'edit', field: 'original' | 'new' | 'discount') => {
    const form = formType === 'create' ? createFormRef.current : editFormRef.current;
    if (!form) return;

    const originalInput = form.elements.namedItem('originalPrice') as HTMLInputElement;
    const newInput = form.elements.namedItem('newPrice') as HTMLInputElement;
    const discountInput = form.elements.namedItem('discount') as HTMLInputElement;

    if (!originalInput || !newInput || !discountInput) return;

    const origVal = parseNumericInput(originalInput.value, Number.NaN);
    const newVal = parseNumericInput(newInput.value, Number.NaN);
    const discValStr = discountInput.value.trim();

    if (field === 'discount') {
      if (origVal && origVal > 0) {
        const pctMatch = discValStr.match(/^(\d+)(%?)$/);
        if (pctMatch) {
          const pct = parseFloat(pctMatch[1]);
          if (pct >= 0 && pct <= 100) {
            const calculatedNew = Math.round(origVal * (1 - pct / 100) * 100) / 100;
            newInput.value = calculatedNew.toString();
          }
        }
      }
    } else if (origVal && newVal && origVal > 0 && newVal < origVal) {
      const pct = Math.round(((origVal - newVal) / origVal) * 100);
      if (pct >= 0 && pct <= 100) {
        discountInput.value = `${pct}%`;
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
    };
    socket.on('admin_notification', handler);
    return () => { socket.off('admin_notification', handler); };
  }, [socket, queryClient]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['all-offers', debouncedSearch, statusFilter, page],
    queryFn: async () => {
      const response = await adminApi().get('/admin/offers', {
        params: {
          search: debouncedSearch || undefined,
          status: statusFilter || undefined,
          page,
          limit: 20,
        },
      });
      const result = response.data as { items: OfferRow[]; meta: { total: number; lastPage: number } };
      if (!result || !Array.isArray(result.items)) throw new Error('Invalid response format');
      return result;
    },
    retry: 1,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const { data: offerDetails, isLoading: detailsLoading, isError: isDetailsError, error: detailsError, refetch: refetchDetails } = useQuery<OfferDetails>({
    queryKey: ['offer-details', selectedOfferId],
    queryFn: async () => {
      const response = await adminApi().get<OfferDetails>(`/admin/offers/${selectedOfferId}`);
      if (!response.data) throw new Error('Invalid response');
      return response.data;
    },
    enabled: !!selectedOfferId,
    retry: 1,
  });

  useEffect(() => {
    if (offerDetails && isEditing) {
      const timer = window.setTimeout(() => setTempImages(offerDetails.images || []), 0);
      return () => window.clearTimeout(timer);
    }
  }, [offerDetails, isEditing]);

  const { data: storesData } = useQuery({
    queryKey: ['all-stores-list'],
    queryFn: async () => {
      const response = await adminApi().get('/admin/stores', { params: { limit: 100 } });
      const items = response.data.items as { id: string; name: string }[];
      if (!Array.isArray(items)) throw new Error('Invalid response format');
      return items;
    },
    enabled: isCreating || isEditing,
    retry: 1,
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  const createOfferMutation = useMutation({
    mutationFn: async (payload: OfferPayload) => adminApi().post('/admin/offers', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-offers'] });
      setIsCreating(false);
      setTempImages([]);
      showToast('تم إنشاء العرض بنجاح');
    },
    onError: (err: unknown) => {
      showToast(getApiErrorMessage(err, 'فشل إنشاء العرض'), 'error');
    }
  });

  const uploadImages = async (files: FileList) => {
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          showToast('حجم الصورة يجب أن لا يتجاوز 5 ميجابايت', 'error');
          continue;
        }
        const formData = new FormData();
        formData.append('file', file);
        const res = await adminApi().post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedUrls.push(res.data.url);
      }
      setTempImages(prev => [...prev, ...uploadedUrls]);
    } catch {
      showToast('فشل رفع الصور', 'error');
    } finally {
      setUploading(false);
    }
  };

  const updateOfferMutation = useMutation({
    mutationFn: async (payload: UpdateOfferPayload) => adminApi().patch(`/admin/offers/${payload.id}`, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-offers'] });
      queryClient.invalidateQueries({ queryKey: ['offer-details', selectedOfferId] });
      setIsEditing(false);
      showToast('تم تحديث بيانات العرض بنجاح');
    },
    onError: (err: unknown) => {
      showToast(getApiErrorMessage(err, 'فشل تحديث العرض'), 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi().delete(`/admin/offers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-offers'] });
      setDeleteModal(null);
      setSelectedOfferId(null);
      showToast('تم حذف العرض بنجاح');
    },
    onError: (err: unknown) => {
      showToast(getApiErrorMessage(err, 'فشل حذف العرض'), 'error');
    },
    onSettled: () => setBusyId(null),
  });

  const offers = data?.items ?? [];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <PageHeader 
          title="إدارة العروض" 
          description="متابعة وتنظيم كافة العروض الترويجية والخصومات المتاحة حالياً في المنصة" 
          icon={Tag}
          actions={<button onClick={() => { setIsCreating(true); setTempImages([]); }} className="admin-focus flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-bold text-white transition-colors hover:bg-orange-700"><Plus size={18} /> إضافة عرض جديد</button>}
        />

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center">
        <div className="relative w-full flex-1 group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-600 transition-colors" size={18} />
          <input
            type="text"
            placeholder="بحث في العروض، المتاجر، أو الخصومات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-11 pl-4 text-sm font-medium outline-none transition focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5"
          />
        </div>
        
        <div className="flex w-full gap-3 lg:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-11 flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-orange-600 lg:w-48"
          >
            <option value="">كل الحالات</option>
            {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {(search || statusFilter) && <button onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); }} className="admin-focus h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">مسح الفلاتر</button>}
        </div>
        <span className="text-xs font-semibold text-slate-500">{data ? `${data.meta.total} نتيجة` : '—'}</span>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="admin-table-shell p-4">
          {Array.from({ length: 7 }).map((_, i) => <div key={i} className="mb-3 h-14 animate-pulse rounded-xl bg-slate-100 last:mb-0" />)}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-red-200 text-slate-400">
          <AlertTriangle size={48} className="mb-4 text-red-400" />
          <h3 className="text-lg font-bold text-red-600">حدث خطأ أثناء تحميل البيانات</h3>
          <p className="text-sm font-medium mt-1 text-slate-500">{getErrorMessage(error, 'يرجى المحاولة مرة أخرى')}</p>
          <button onClick={() => refetch()} className="mt-6 px-8 py-3 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition-all flex items-center gap-2 shadow-lg shadow-orange-900/10">
            <RefreshCw size={16} /> إعادة المحاولة
          </button>
        </div>
      ) : offers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
          <Tag size={48} className="mb-4 opacity-10" />
          <p className="text-base font-bold text-slate-700">{search || statusFilter ? 'لا توجد عروض مطابقة' : 'لا توجد عروض حتى الآن'}</p>
          <p className="mt-1 text-sm">{search || statusFilter ? 'جرّب تعديل البحث أو الفلاتر' : 'ابدأ بإضافة أول عرض إلى المنصة'}</p>
          <button
            onClick={() => setIsCreating(true)}
            className="mt-6 px-8 py-3 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition-all flex items-center gap-2 shadow-lg shadow-orange-900/10"
          >
            <Plus size={16} /> إضافة أول عرض
          </button>
        </div>
      ) : (
        <>
          <div className="admin-table-shell hidden lg:block">
            <div className="overflow-x-auto">
              <table className="admin-data-table min-w-[980px]">
                <thead><tr><th>العرض</th><th>المتجر</th><th>الحالة</th><th>الخصم</th><th>الكوبونات</th><th>المشاهدات</th><th>المدة</th><th className="text-left">الإجراءات</th></tr></thead>
                <tbody>{offers.map((offer) => (
                  <tr key={offer.id}>
                    <td><div className="flex min-w-[210px] items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">{offer.images?.[0] ? <img src={resolveImageUrl(offer.images[0])} alt="" className="h-full w-full object-cover" /> : <Tag size={19} className="text-slate-400" />}</div><div className="min-w-0"><p className="line-clamp-2 font-bold leading-6 text-slate-900">{offer.title}</p><p className="text-xs text-slate-500">أُضيف {formatOfferDate(offer.createdAt)}</p></div></div></td>
                    <td><span className="inline-flex max-w-[170px] items-center gap-1.5"><Store size={14} className="shrink-0 text-slate-400" /><span className="truncate font-semibold text-slate-700">{offer.store?.name || '—'}</span></span></td>
                    <td><span className={`inline-flex whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs font-semibold ${statusClasses[offer.status] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>{statusLabels[offer.status] || offer.status}</span></td>
                    <td><span className="font-bold text-orange-600">{offer.discount || '—'}</span></td>
                    <td>{offer._count?.coupons ?? '—'}</td><td>{offer.views ?? '—'}</td>
                    <td><div className="min-w-[150px] text-xs leading-6 text-slate-600"><div>{formatOfferDate(offer.startDate)}</div><div>{formatOfferDate(offer.endDate)}</div></div></td>
                    <td><div className="flex justify-end gap-2"><button aria-label="عرض التفاصيل" onClick={() => { setSelectedOfferId(offer.id); setIsEditing(false); }} className="admin-focus flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-orange-200 hover:text-orange-600"><Eye size={16} /></button><button aria-label="تعديل العرض" onClick={() => { setSelectedOfferId(offer.id); setIsEditing(true); }} className="admin-focus flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-orange-200 hover:text-orange-600"><Pencil size={16} /></button></div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
          <div className="grid gap-3 lg:hidden">{offers.map((offer) => (
            <article key={offer.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start gap-3"><div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">{offer.images?.[0] ? <img src={resolveImageUrl(offer.images[0])} alt="" className="h-full w-full object-cover" /> : <Tag size={20} className="text-slate-400" />}</div><div className="min-w-0 flex-1"><h2 className="line-clamp-2 text-sm font-bold leading-6 text-slate-900">{offer.title}</h2><p className="truncate text-xs text-slate-500">{offer.store?.name || '—'}</p></div><span className={`shrink-0 rounded-lg border px-2 py-1 text-[11px] font-semibold ${statusClasses[offer.status] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>{statusLabels[offer.status] || offer.status}</span></div>
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs"><span>الخصم: <b className="text-orange-600">{offer.discount || '—'}</b></span><span>الكوبونات: <b>{offer._count?.coupons ?? '—'}</b></span><span>المشاهدات: <b>{offer.views ?? '—'}</b></span><span className="flex items-center gap-1"><Clock size={13} /> {formatOfferDate(offer.endDate)}</span></div>
              <div className="mt-3 flex gap-2"><button onClick={() => { setSelectedOfferId(offer.id); setIsEditing(false); }} className="admin-focus h-11 flex-1 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700">عرض التفاصيل</button><button onClick={() => { setSelectedOfferId(offer.id); setIsEditing(true); }} className="admin-focus h-11 flex-1 rounded-xl bg-orange-600 text-sm font-semibold text-white">تعديل</button></div>
            </article>
          ))}</div>
        </>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={page}
        lastPage={data?.meta?.lastPage ?? 0}
        onPageChange={setPage}
      />

      {/* Overlays */}
      <AnimatePresence>
        {selectedOfferId && (
          <div className="admin-modal-overlay fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/20 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-900">{isEditing ? 'تعديل بيانات العرض' : 'تفاصيل العرض'}</h2>
                <button onClick={() => { setSelectedOfferId(null); setIsEditing(false); }} className="rounded-xl bg-slate-50 p-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {detailsLoading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-orange-600" size={32} /></div>
              ) : isDetailsError ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <AlertTriangle size={48} className="mb-4 text-red-400" />
                  <h3 className="text-lg font-bold text-red-600">حدث خطأ أثناء تحميل التفاصيل</h3>
                  <p className="text-sm font-medium mt-1 text-slate-500">{getErrorMessage(detailsError, 'يرجى المحاولة مرة أخرى')}</p>
                  <button onClick={() => refetchDetails()} className="mt-4 px-6 py-2.5 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 transition-all flex items-center gap-2">
                    <RefreshCw size={16} /> إعادة المحاولة
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center gap-5 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="h-20 w-20 overflow-hidden rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                      {offerDetails?.images?.[0] ? <img src={resolveImageUrl(offerDetails.images[0])} alt="offer" className="h-full w-full object-cover" /> : <Tag size={36} className="text-slate-200" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 leading-tight">{offerDetails?.title}</h3>
                      <p className="text-lg font-bold text-orange-600 mt-1.5">{offerDetails?.discount}</p>
                    </div>
                  </div>

                  {isEditing ? (
                    <form ref={editFormRef} id="edit-offer-form" onSubmit={(e) => { 
                      e.preventDefault(); 
                      const fd = new FormData(e.currentTarget); 
                      const formData = Object.fromEntries(fd.entries());
                      if (new Date(formData.endDate as string) <= new Date(formData.startDate as string)) {
                        showToast('تاريخ انتهاء العرض يجب أن يكون بعد تاريخ البداية', 'error');
                        return;
                      }
                      const data = {
                        ...formData,
                        originalPrice: formData.originalPrice ? parseNumericInput(formData.originalPrice) : null,
                        newPrice: formData.newPrice ? parseNumericInput(formData.newPrice) : null,
                        images: tempImages
                      };
                      updateOfferMutation.mutate({ id: offerDetails!.id, data }); 
                    }} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">العنوان</label>
                          <input name="title" defaultValue={offerDetails?.title} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold focus:border-orange-500 focus:outline-none transition-all shadow-sm" required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">الخصم</label>
                          <input name="discount" defaultValue={offerDetails?.discount} onChange={() => handlePriceCalc('edit', 'discount')} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold focus:border-orange-500 focus:outline-none transition-all shadow-sm" required />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">السعر قبل</label>
                          <input type="text" inputMode="decimal" name="originalPrice" defaultValue={offerDetails?.originalPrice} onChange={() => handlePriceCalc('edit', 'original')} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold focus:border-orange-500 focus:outline-none transition-all shadow-sm" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">السعر بعد</label>
                          <input type="text" inputMode="decimal" name="newPrice" defaultValue={offerDetails?.newPrice} onChange={() => handlePriceCalc('edit', 'new')} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold focus:border-orange-500 focus:outline-none transition-all shadow-sm" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">الوصف</label>
                        <textarea name="description" defaultValue={offerDetails?.description || ''} rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-bold focus:border-orange-500 focus:outline-none transition-all shadow-sm resize-none" />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">تاريخ البداية</label>
                          <input type="date" name="startDate" defaultValue={offerDetails?.startDate ? offerDetails.startDate.slice(0, 10) : ''} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold focus:border-orange-500 focus:outline-none transition-all shadow-sm" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">تاريخ الانتهاء</label>
                          <input type="date" name="endDate" defaultValue={offerDetails?.endDate ? offerDetails.endDate.slice(0, 10) : ''} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold focus:border-orange-500 focus:outline-none transition-all shadow-sm" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">الحالة</label>
                        <select name="status" defaultValue={offerDetails?.status} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold focus:border-orange-500 focus:outline-none transition-all shadow-sm">
                          {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">نوع الخصم</label>
                        <select name="discountType" defaultValue={offerDetails?.discountType || 'PERCENTAGE'} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold focus:border-orange-500 focus:outline-none transition-all shadow-sm">
                          <option value="PERCENTAGE">نسبة مئوية (%)</option>
                          <option value="FIXED_AMOUNT">قيمة ثابتة (ج.م)</option>
                          <option value="BOGO">اشترِ واحصل على واحد</option>
                          <option value="FREE_SHIPPING">توصيل مجاني</option>
                          <option value="OTHER">أخرى</option>
                        </select>
                      </div>

                      <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">صور العرض</label>
                        <div className="grid grid-cols-4 gap-4">
                          {tempImages.map((img, i) => (
                            <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                              <img src={resolveImageUrl(img)} alt="" className="h-full w-full object-cover" />
                              <button type="button" onClick={() => setTempImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 h-6 w-6 rounded-lg bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"><X size={14} /></button>
                            </div>
                          ))}
                          {tempImages.length < 5 && (
                            <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-all text-slate-400 hover:text-orange-600 hover:border-orange-300">
                              {uploading ? <Loader2 className="animate-spin" size={24} /> : (
                                <>
                                  <Upload size={24} />
                                  <span className="text-xs font-bold">رفع صورة</span>
                                  <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => e.target.files && uploadImages(e.target.files)} />
                                </>
                              )}
                            </label>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-4 pt-2">
                        <button type="submit" disabled={updateOfferMutation.isPending} className="flex-1 h-12 rounded-xl bg-slate-900 text-sm font-bold text-white hover:bg-orange-600 transition-all shadow-lg">{updateOfferMutation.isPending ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'حفظ التعديلات'}</button>
                        <button type="button" onClick={() => setIsEditing(false)} className="flex-1 h-12 rounded-xl bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all">إلغاء</button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-8">
                      <div className="grid grid-cols-3 gap-4">
                         <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 text-center"><Users size={18} className="mx-auto mb-2 text-orange-600" /><p className="text-xl font-bold text-orange-600">{offerDetails?._count.coupons || 0}</p></div>
                         <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-center"><TrendingUp size={18} className="mx-auto mb-2 text-blue-600" /><p className="text-xl font-bold text-blue-600">{offerDetails?._count.favorites || 0}</p></div>
                         <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-center"><Zap size={18} className="mx-auto mb-2 text-emerald-600" /><p className="text-xl font-bold text-emerald-600">{offerDetails?._count.reviews || 0}</p></div>
                      </div>

                      {offerDetails?.images && offerDetails.images.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">معرض الصور</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {offerDetails.images.map((img, i) => (
                              <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                                <img src={resolveImageUrl(img)} alt="" className="h-full w-full object-cover hover:scale-110 transition-transform duration-500" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Coupons and Reviews */}
                      <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                        {/* Coupons */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Zap size={18} className="text-emerald-500" /> أحدث الكوبونات
                          </h4>
                          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                            {offerDetails?.coupons && offerDetails.coupons.length > 0 ? offerDetails.coupons.map(coupon => (
                              <div key={coupon.id} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-bold text-slate-900">{coupon.customer.name}</p>
                                  <p className="text-[10px] text-slate-400 mt-1">{coupon.customer.phone}</p>
                                </div>
                                <div className="text-left">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${
                                    coupon.status === 'USED' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'
                                  }`}>
                                    {coupon.code}
                                  </span>
                                  <p className="text-[9px] text-slate-400 mt-1">{new Date(coupon.createdAt).toLocaleDateString('ar-EG')}</p>
                                </div>
                              </div>
                            )) : (
                              <p className="text-xs text-slate-400 text-center py-4">لم يتم إصدار كوبونات بعد</p>
                            )}
                          </div>
                        </div>

                        {/* Reviews */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <ExternalLink size={18} className="text-blue-500" /> أحدث التقييمات
                          </h4>
                          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                            {offerDetails?.reviews && offerDetails.reviews.length > 0 ? offerDetails.reviews.map(review => (
                              <div key={review.id} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                <div className="flex items-center justify-between mb-1.5">
                                  <p className="text-xs font-bold text-slate-900">{review.customer.name}</p>
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star key={star} size={10} className={star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-100 text-slate-200'} />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg leading-relaxed">{review.comment || 'لا يوجد تعليق'}</p>
                              </div>
                            )) : (
                              <p className="text-xs text-slate-400 text-center py-4">لا توجد تقييمات بعد</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 pt-6 border-t border-slate-100">
                        <button onClick={() => setIsEditing(true)} className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all border border-slate-200">تعديل البيانات</button>
                        <button onClick={() => setDeleteModal({ id: offerDetails!.id, title: offerDetails!.title })} className="h-12 w-12 flex items-center justify-center rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/10"><Trash2 size={20} /></button>
                      </div>
                      <div className="text-center">
                         <Link href={`/dashboard/offers/${offerDetails?.id}`} onClick={() => setSelectedOfferId(null)} className="text-xs font-bold text-orange-600 hover:underline flex items-center justify-center gap-2">عرض الصفحة الكاملة للعرض <ExternalLink size={14} /></Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCreating && (
          <div className="admin-modal-overlay fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/20 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">إضافة عرض جديد</h2>
                  <p className="text-xs font-medium text-slate-400 mt-1">قم بإدخال بيانات العرض واختيار المتجر التابع له</p>
                </div>
                <button onClick={() => setIsCreating(false)} className="rounded-xl bg-slate-50 p-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form ref={createFormRef} id="create-offer-form" onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const formData = Object.fromEntries(fd.entries());
                const discountVal = (formData.discount as string || '').trim();
                if (!discountVal) {
                  showToast('يرجى إدخال قيمة الخصم', 'error');
                  return;
                }
                const storeIdVal = formData.storeId as string;
                if (!storeIdVal) {
                  showToast('يرجى اختيار المتجر', 'error');
                  return;
                }
                if (new Date(formData.endDate as string) <= new Date(formData.startDate as string)) {
                  showToast('تاريخ انتهاء العرض يجب أن يكون بعد تاريخ البداية', 'error');
                  return;
                }
                const payloadWithoutStatus = { ...formData };
                delete payloadWithoutStatus.status;
                const data = {
                  ...payloadWithoutStatus,
                  discount: discountVal,
                  originalPrice: formData.originalPrice ? parseNumericInput(formData.originalPrice) : null,
                  newPrice: formData.newPrice ? parseNumericInput(formData.newPrice) : null,
                  images: tempImages,
                };
                createOfferMutation.mutate(data);
              }} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">اسم العرض</label>
                    <input name="title" placeholder="مثلاً: خصم 50% على كل الملابس" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold focus:border-orange-500 focus:outline-none transition-all shadow-sm" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">قيمة الخصم</label>
                    <input name="discount" onChange={() => handlePriceCalc('create', 'discount')} placeholder="مثلاً: 50% أو خصم 100 ج" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold focus:border-orange-500 focus:outline-none transition-all shadow-sm" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">السعر قبل</label>
                    <input type="text" inputMode="decimal" name="originalPrice" onChange={() => handlePriceCalc('create', 'original')} placeholder="السعر الأصلي" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold focus:border-orange-500 focus:outline-none transition-all shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">السعر بعد</label>
                    <input type="text" inputMode="decimal" name="newPrice" onChange={() => handlePriceCalc('create', 'new')} placeholder="السعر بعد الخصم" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold focus:border-orange-500 focus:outline-none transition-all shadow-sm" />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">اختر المتجر</label>
                    <select name="storeId" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold focus:border-orange-500 focus:outline-none transition-all shadow-sm" required>
                      <option value="">اختر متجر من القائمة...</option>
                      {storesData?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">وصف العرض</label>
                    <textarea name="description" rows={3} placeholder="تفاصيل العرض والشروط إن وجدت..." className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm font-bold focus:border-orange-500 focus:outline-none transition-all shadow-sm" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">تاريخ البدء</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="date" name="startDate" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 pl-10 text-sm font-bold focus:border-orange-500 focus:outline-none transition-all shadow-sm" required />
                    </div>
                  </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">تاريخ الانتهاء</label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="date" name="endDate" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 pl-10 text-sm font-bold focus:border-orange-500 focus:outline-none transition-all shadow-sm" required />
                      </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">الحالة</label>
                     <select name="status" defaultValue="ACTIVE" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold focus:border-orange-500 focus:outline-none transition-all shadow-sm">
                       {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">نوع الخصم</label>
                     <select name="discountType" defaultValue="PERCENTAGE" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold focus:border-orange-500 focus:outline-none transition-all shadow-sm">
                       <option value="PERCENTAGE">نسبة مئوية (%)</option>
                       <option value="FIXED_AMOUNT">قيمة ثابتة (ج.م)</option>
                       <option value="BOGO">اشترِ واحصل على واحد</option>
                       <option value="FREE_SHIPPING">توصيل مجاني</option>
                       <option value="OTHER">أخرى</option>
                     </select>
                   </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">صور العرض</label>
                  <div className="grid grid-cols-4 gap-4">
                    {tempImages.map((img, i) => (
                      <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                        <img src={resolveImageUrl(img)} alt="" className="h-full w-full object-cover" />
                        <button type="button" onClick={() => setTempImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 h-6 w-6 rounded-lg bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"><X size={14} /></button>
                      </div>
                    ))}
                    {tempImages.length < 4 && (
                      <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-all text-slate-400 hover:text-orange-600 hover:border-orange-300">
                        {uploading ? <Loader2 className="animate-spin" size={24} /> : (
                          <>
                            <Upload size={24} />
                            <span className="text-xs font-bold">رفع صورة</span>
                            <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => e.target.files && uploadImages(e.target.files)} />
                          </>
                        )}
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-slate-100">
                  <button type="submit" disabled={createOfferMutation.isPending || uploading} className="flex-1 h-12 rounded-xl bg-slate-900 text-sm font-bold text-white hover:bg-orange-600 transition-all shadow-lg disabled:opacity-50">
                    {createOfferMutation.isPending ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'تأكيد ونشر العرض'}
                  </button>
                  <button type="button" onClick={() => setIsCreating(false)} className="flex-1 h-12 rounded-xl bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteModal && (
          <div className="admin-modal-overlay fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-rose-50 text-rose-600 mb-6"><AlertTriangle size={32} /></div>
              <h3 className="text-xl font-bold text-slate-900">حذف العرض؟</h3>
              <div className="mt-8 flex gap-4">
                <button onClick={() => { setBusyId(deleteModal.id); deleteMutation.mutate(deleteModal.id); }} disabled={!!busyId} className="flex-1 h-12 rounded-xl bg-rose-600 text-sm font-bold text-white hover:bg-rose-700 shadow-lg">{busyId === deleteModal.id ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'نعم، احذف'}</button>
                <button onClick={() => setDeleteModal(null)} className="flex-1 h-12 rounded-xl bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all">إلغاء</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
