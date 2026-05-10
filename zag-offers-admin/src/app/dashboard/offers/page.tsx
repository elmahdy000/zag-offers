'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Loader2,
  Pencil,
  Search,
  Tag,
  Trash2,
  X,
  Calendar,
  Zap,
  Store,
  Clock,
  ExternalLink,
  TrendingUp,
  Users,
  Plus,
  Image as ImageIcon,
  Upload,
  Calendar as CalendarIcon
} from 'lucide-react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi, resolveImageUrl } from '@/lib/api';

// Components
import { PageHeader } from '@/components/shared/PageHeader';
import { OfferCard } from '@/components/offers/OfferCard';
import { useToast } from '@/components/shared/Toast';
import Pagination from '@/components/shared/Pagination';

interface OfferRow {
  id: string;
  title: string;
  description?: string;
  discount: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'PAUSED';
  createdAt: string;
  startDate?: string;
  endDate?: string;
  store: { id: string; name: string };
  _count: { coupons: number };
}

interface OfferDetails extends OfferRow {
  images: string[];
  _count: { coupons: number; favorites: number; reviews: number };
}

const statusLabels: Record<string, string> = {
  PENDING: 'معلق للمراجعة',
  APPROVED: 'مقبول / نشط',
  REJECTED: 'مرفوض',
  EXPIRED: 'منتهي الصلاحية',
  PAUSED: 'متوقف مؤقتاً',
};

export default function OffersManagementPage() {
  const queryClient = useQueryClient();
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
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
      return response.data as { items: OfferRow[]; meta: { total: number; lastPage: number } };
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const { data: offerDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['offer-details', selectedOfferId],
    queryFn: async () => {
      const response = await adminApi().get<OfferDetails>(`/admin/offers/${selectedOfferId}`);
      return response.data;
    },
    enabled: !!selectedOfferId,
  });

  const { data: storesData } = useQuery({
    queryKey: ['all-stores-list'],
    queryFn: async () => {
      const response = await adminApi().get('/admin/stores', { params: { limit: 100 } });
      return response.data.items as { id: string; name: string }[];
    },
    enabled: isCreating || isEditing,
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  const createOfferMutation = useMutation({
    mutationFn: async (payload: any) => adminApi().post('/admin/offers', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-offers'] });
      setIsCreating(false);
      setTempImages([]);
      showToast('تم إنشاء العرض بنجاح بنجاح');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'فشل إنشاء العرض', 'error');
    }
  });

  const uploadImages = async (files: FileList) => {
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        const res = await adminApi().post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedUrls.push(res.data.url);
      }
      setTempImages(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      showToast('فشل رفع الصور', 'error');
    } finally {
      setUploading(false);
    }
  };

  const updateOfferMutation = useMutation({
    mutationFn: async (payload: any) => adminApi().patch(`/admin/offers/${payload.id}`, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-offers'] });
      queryClient.invalidateQueries({ queryKey: ['offer-details', selectedOfferId] });
      setIsEditing(false);
      showToast('تم تحديث بيانات العرض بنجاح');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'فشل تحديث العرض', 'error');
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
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'فشل حذف العرض', 'error');
    },
    onSettled: () => setBusyId(null),
  });

  const offers = data?.items ?? [];

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <PageHeader 
          title="إدارة العروض" 
          description="متابعة وتنظيم كافة العروض الترويجية والخصومات المتاحة حالياً في المنصة" 
          icon={Tag}
        />
        <button 
          onClick={() => { setIsCreating(true); setTempImages([]); }}
          className="h-12 px-6 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/10 shrink-0"
        >
          <Plus size={20} /> إضافة عرض جديد
        </button>
      </div>

      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative lg:col-span-3">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن عرض بالاسم أو المتجر..."
            className="h-[48px] w-full rounded-xl border border-slate-200 bg-white pr-11 pl-4 text-xs font-black shadow-sm focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-[48px] rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium focus:outline-none shadow-sm"
        >
          <option value="">كل الحالات</option>
          {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-40 animate-pulse bg-white rounded-2xl border border-slate-100" />)}
        </div>
      ) : offers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
          <Tag size={48} className="mb-4 opacity-10" />
          <p className="text-sm font-black">لا توجد عروض حالياً</p>
          <button
            onClick={() => setIsCreating(true)}
            className="mt-6 px-8 py-3 rounded-xl bg-indigo-600 text-white font-black text-xs hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/10"
          >
            <Plus size={16} /> إضافة أول عرض
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {offers.map((offer, idx) => (
            <OfferCard 
              key={offer.id} 
              offer={offer} 
              index={idx}
              onView={(id) => setSelectedOfferId(id)}
              onEdit={(id) => { setSelectedOfferId(id); setIsEditing(true); }}
            />
          ))}
        </div>
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
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/20 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-900">{isEditing ? 'تعديل بيانات العرض' : 'تفاصيل العرض'}</h2>
                <button onClick={() => { setSelectedOfferId(null); setIsEditing(false); }} className="rounded-xl bg-slate-50 p-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {detailsLoading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-orange-600" size={32} /></div>
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
                    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); updateOfferMutation.mutate({ id: offerDetails!.id, data: Object.fromEntries(fd.entries()) }); }} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">العنوان</label>
                          <input name="title" defaultValue={offerDetails?.title} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold focus:border-orange-500 focus:outline-none transition-all shadow-sm" required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">الخصم</label>
                          <input name="discount" defaultValue={offerDetails?.discount} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold focus:border-orange-500 focus:outline-none transition-all shadow-sm" required />
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
                      <div className="flex gap-4 pt-2">
                        <button type="submit" disabled={updateOfferMutation.isPending} className="flex-1 h-12 rounded-xl bg-slate-900 text-sm font-bold text-white hover:bg-orange-600 transition-all shadow-lg">{updateOfferMutation.isPending ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'حفظ التعديلات'}</button>
                        <button type="button" onClick={() => setIsEditing(false)} className="flex-1 h-12 rounded-xl bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all">إلغاء</button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-8">
                      <div className="grid grid-cols-3 gap-4">
                         <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 text-center"><Users size={18} className="mx-auto mb-2 text-orange-600" /><p className="text-xl font-bold text-orange-600">{offerDetails?._count.coupons || 0}</p></div>
                         <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-center"><TrendingUp size={18} className="mx-auto mb-2 text-blue-600" /><p className="text-xl font-bold text-blue-600">1.2k</p></div>
                         <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-center"><Zap size={18} className="mx-auto mb-2 text-emerald-600" /><p className="text-xl font-bold text-emerald-600">12%</p></div>
                      </div>
                      <div className="flex gap-4 pt-6 border-t border-slate-100">
                        <button onClick={() => setIsEditing(true)} className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all border border-slate-200">تعديل البيانات</button>
                        <button onClick={() => setDeleteModal({ id: offerDetails!.id, title: offerDetails!.title })} className="h-12 w-12 flex items-center justify-center rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/10"><Trash2 size={20} /></button>
                      </div>
                      <div className="text-center">
                         <Link href={`/dashboard/offers/${offerDetails?.id}`} onClick={() => setSelectedOfferId(null)} className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center justify-center gap-2">عرض الصفحة الكاملة للعرض <ExternalLink size={14} /></Link>
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
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/20 backdrop-blur-sm p-4">
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

              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const data = Object.fromEntries(fd.entries());
                createOfferMutation.mutate({
                  ...data,
                  images: tempImages,
                  status: 'APPROVED' // Admin-created offers are auto-approved
                });
              }} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">اسم العرض</label>
                    <input name="title" placeholder="مثلاً: خصم 50% على كل الملابس" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold focus:border-orange-500 focus:outline-none transition-all shadow-sm" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">قيمة الخصم</label>
                    <input name="discount" placeholder="مثلاً: 50% أو خصم 100 ج" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold focus:border-orange-500 focus:outline-none transition-all shadow-sm" required />
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
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">صور العرض</label>
                  <div className="grid grid-cols-4 gap-4">
                    {tempImages.map((img, i) => (
                      <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                        <img src={resolveImageUrl(img)} className="h-full w-full object-cover" />
                        <button type="button" onClick={() => setTempImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 h-6 w-6 rounded-lg bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"><X size={14} /></button>
                      </div>
                    ))}
                    {tempImages.length < 4 && (
                      <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-all text-slate-400 hover:text-orange-600 hover:border-orange-300">
                        {uploading ? <Loader2 className="animate-spin" size={24} /> : (
                          <>
                            <Upload size={24} />
                            <span className="text-[10px] font-bold">رفع صورة</span>
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
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
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
