'use client';

import { useEffect, useState } from 'react';
import {
  Eye,
  Loader2,
  Pencil,
  Search,
  ShieldCheck,
  ShieldOff,
  Store,
  Trash2,
  X,
  Filter,
  Plus,
  Star,
  TrendingUp,
  Phone,
  Mail,
  MapPin,
  User as UserIcon,
  Calendar,
  Info,
  ExternalLink,
  Tag,
} from 'lucide-react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi, resolveImageUrl } from '@/lib/api';

// Components
import { PageHeader } from '@/components/shared/PageHeader';
import { MerchantCard } from '@/components/merchants/MerchantCard';
import { useToast } from '@/components/shared/Toast';
import Pagination from '@/components/shared/Pagination';

interface MerchantRow {
  id: string;
  name: string;
  address: string;
  area?: string;
  phone: string;
  whatsapp?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  createdAt: string;
  category: { id: string; name: string };
  owner: { id: string; name: string; phone: string; email?: string };
  _count: { offers: number; reviews: number };
}

interface MerchantDetails extends MerchantRow {
  logo?: string | null;
  coverImage?: string | null;
  owner: MerchantRow['owner'] & {
    area?: string | null;
    avatar?: string | null;
    createdAt: string;
  };
}

interface Category {
  id: string;
  name: string;
}

export default function MerchantsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await adminApi().get<Category[]>('/admin/categories');
      return response.data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-merchants', debouncedSearch, status, categoryId, page],
    queryFn: async () => {
      const response = await adminApi().get('/admin/stores', {
        params: {
          search: debouncedSearch || undefined,
          status: status || undefined,
          categoryId: categoryId || undefined,
          page,
          limit: 12,
        },
      });
      return response.data as { items: MerchantRow[]; meta: { total: number; lastPage: number } };
    },
  });

  const { data: merchantDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['merchant-details', selectedMerchantId],
    queryFn: async () => {
      const response = await adminApi().get<MerchantDetails>(`/admin/stores/${selectedMerchantId}`);
      return response.data;
    },
    enabled: !!selectedMerchantId,
  });

  const updateMerchantMutation = useMutation({
    mutationFn: async (payload: any) => adminApi().patch(`/admin/stores/${payload.id}`, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-merchants'] });
      showToast('تم تحديث المتجر بنجاح');
      setIsEditing(false);
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'فشل تحديث المتجر', 'error');
    }
  });

  const changeStatusMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'suspend' }) => {
      return action === 'approve'
        ? adminApi().patch(`/admin/stores/${id}/approve`)
        : adminApi().patch(`/admin/stores/${id}/suspend`, { reason: 'إجراء إداري' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-merchants'] });
      showToast('تم تحديث الحالة.');
    },
    onSettled: () => setBusyId(null),
  });

  const deleteMerchantMutation = useMutation({
    mutationFn: (id: string) => adminApi().delete(`/admin/stores/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-merchants'] });
      setDeleteModal(null);
      setSelectedMerchantId(null);
      showToast('تم الحذف بنجاح.');
    },
    onSettled: () => setBusyId(null),
  });

  const merchants = data?.items ?? [];

  return (
    <div className="p-6 lg:p-10 space-y-8">

      <PageHeader 
        title="إدارة المتاجر" 
        description="متابعة وتنظيم كافة المتاجر المسجلة في المنصة، والتحكم في حالات النشاط والبيانات" 
        icon={Store}
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:border-orange-200">
           <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <Store size={20} />
           </div>
           <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">إجمالي المتاجر</p>
              <p className="text-xl font-bold text-slate-900 leading-none">{data?.meta.total ?? 0}</p>
           </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative lg:col-span-2">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن متجر..."
            className="h-[48px] w-full rounded-xl border border-slate-200 bg-white pr-11 pl-4 text-sm font-medium focus:border-orange-500 focus:outline-none transition-all shadow-sm"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="h-[48px] rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium focus:outline-none shadow-sm"
        >
          <option value="">كل الحالات</option>
          <option value="APPROVED">نشط</option>
          <option value="PENDING">معلق</option>
          <option value="SUSPENDED">موقوف</option>
        </select>
        <select
          value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
          className="h-[48px] rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium focus:outline-none shadow-sm"
        >
          <option value="">كل التصنيفات</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-56 animate-pulse bg-white rounded-2xl border border-slate-100 shadow-sm" />)}
        </div>
      ) : merchants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
          <Store size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-bold">لا توجد متاجر حالياً</p>
          <p className="text-sm font-medium mt-1">جرب تغيير معايير البحث أو الفلترة</p>
          <Link href="/dashboard/merchants/new" className="mt-4 px-6 py-2.5 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 transition-all flex items-center gap-2">
            <Plus size={16} /> إضافة متجر جديد
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {merchants.map((merchant, idx) => (
            <MerchantCard 
              key={merchant.id} 
              merchant={merchant} 
              index={idx}
              onView={(id) => setSelectedMerchantId(id)}
              onEdit={(id) => { setSelectedMerchantId(id); setIsEditing(true); }}
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

      {/* Details Modal */}
      <AnimatePresence>
        {selectedMerchantId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/20 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-900">
                  {isEditing ? 'تعديل بيانات المتجر' : 'بيانات المتجر التفصيلية'}
                </h2>
                <button onClick={() => { setSelectedMerchantId(null); setIsEditing(false); }} className="rounded-xl bg-slate-50 p-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {detailsLoading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-orange-600" size={32} /></div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center gap-5 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="h-20 w-20 overflow-hidden rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                      {merchantDetails?.logo ? <img src={resolveImageUrl(merchantDetails.logo)} alt="logo" className="h-full w-full object-cover" /> : <Store size={36} className="text-slate-200" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 leading-tight">{merchantDetails?.name}</h3>
                      <p className="text-sm font-medium text-slate-500 mt-1">{merchantDetails?.owner.name}</p>
                    </div>
                  </div>

                  {isEditing ? (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        updateMerchantMutation.mutate({
                          id: merchantDetails!.id,
                          data: Object.fromEntries(fd.entries())
                        });
                      }}
                      className="grid gap-6 sm:grid-cols-2"
                    >
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">اسم المتجر</label>
                        <input name="name" defaultValue={merchantDetails?.name} className="h-[48px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium focus:border-orange-500 focus:bg-white focus:outline-none transition-all" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">التصنيف</label>
                        <select name="categoryId" defaultValue={merchantDetails?.category.id} className="h-[48px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium focus:outline-none">
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">المنطقة</label>
                        <input name="area" defaultValue={merchantDetails?.area} className="h-[48px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium focus:outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">رقم الواتساب</label>
                        <input name="whatsapp" defaultValue={merchantDetails?.whatsapp} placeholder="01xxxxxxxxx" className="h-[48px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium focus:border-orange-500 focus:bg-white focus:outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">الحالة</label>
                        <select name="status" defaultValue={merchantDetails?.status} className="h-[48px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium focus:outline-none">
                          <option value="APPROVED">نشط</option>
                          <option value="PENDING">معلق</option>
                          <option value="SUSPENDED">موقوف</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2 flex gap-4 mt-4">
                        <button type="submit" disabled={updateMerchantMutation.isPending} className="flex-1 h-12 rounded-xl bg-orange-600 text-sm font-bold text-white hover:bg-orange-700 shadow-lg shadow-orange-900/10 transition-all">
                           {updateMerchantMutation.isPending ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'حفظ التعديلات'}
                        </button>
                        <button type="button" onClick={() => setIsEditing(false)} className="flex-1 h-12 rounded-xl bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all">إلغاء</button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-8 text-right" dir="rtl">
                      {/* Grid Stats */}
                      <div className="grid grid-cols-3 gap-4">
                         <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 text-center">
                            <Tag size={18} className="mx-auto mb-2 text-orange-600" />
                            <p className="text-[10px] font-bold text-orange-400 uppercase">العروض</p>
                            <p className="text-xl font-bold text-orange-600">{merchantDetails?._count.offers || 0}</p>
                         </div>
                         <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-center">
                            <Star size={18} className="mx-auto mb-2 text-blue-600" />
                            <p className="text-[10px] font-bold text-blue-400 uppercase">المراجعات</p>
                            <p className="text-xl font-bold text-blue-600">{merchantDetails?._count.reviews || 0}</p>
                         </div>
                         <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                            <TrendingUp size={18} className="mx-auto mb-2 text-emerald-600" />
                            <p className="text-[10px] font-bold text-emerald-400 uppercase">النشاط</p>
                            <p className="text-xl font-bold text-emerald-600">نشط</p>
                         </div>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-4">
                           <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">بيانات التواصل</h4>
                           <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100"><Phone size={14} /></div>
                              <div>
                                 <p className="text-[10px] font-bold text-slate-400">رقم الهاتف</p>
                                 <p className="text-xs font-bold text-slate-900">{merchantDetails?.phone || 'غير متوفر'}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100"><Mail size={14} /></div>
                              <div>
                                 <p className="text-[10px] font-bold text-slate-400">البريد الإلكتروني</p>
                                 <p className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{merchantDetails?.owner.email || 'غير متوفر'}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100"><MapPin size={14} /></div>
                              <div>
                                 <p className="text-[10px] font-bold text-slate-400">المنطقة</p>
                                 <p className="text-xs font-bold text-slate-900">{merchantDetails?.area || 'غير محدد'}</p>
                              </div>
                           </div>
                        </div>
                        <div className="space-y-4">
                           <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">بيانات الحساب</h4>
                           <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100"><UserIcon size={14} /></div>
                              <div>
                                 <p className="text-[10px] font-bold text-slate-400">المالك</p>
                                 <p className="text-xs font-bold text-slate-900">{merchantDetails?.owner.name || 'غير متوفر'}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100"><Calendar size={14} /></div>
                              <div>
                                 <p className="text-[10px] font-bold text-slate-400">تاريخ الانضمام</p>
                                 <p className="text-xs font-bold text-slate-900">{formatDate(merchantDetails?.createdAt || '')}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100"><Info size={14} /></div>
                              <div>
                                 <p className="text-[10px] font-bold text-slate-400">العنوان</p>
                                 <p className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{merchantDetails?.address || 'غير متوفر'}</p>
                              </div>
                           </div>
                        </div>
                      </div>

                      <div className="flex gap-4 pt-6 border-t border-slate-100">
                        <button 
                          onClick={() => {
                            setBusyId(merchantDetails!.id);
                            changeStatusMutation.mutate({ 
                              id: merchantDetails!.id, 
                              action: merchantDetails!.status === 'APPROVED' ? 'suspend' : 'approve' 
                            });
                          }}
                          disabled={!!busyId}
                          className={`flex-1 h-12 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                            merchantDetails?.status === 'APPROVED' ? 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-900/10'
                          }`}
                        >
                           {busyId === merchantDetails!.id ? <Loader2 className="animate-spin" size={16} /> : merchantDetails?.status === 'APPROVED' ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                           {merchantDetails?.status === 'APPROVED' ? 'إيقاف المتجر' : 'تفعيل المتجر'}
                        </button>
                        <button 
                          onClick={() => setIsEditing(true)}
                          className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all border border-slate-200"
                        >
                           <Pencil size={18} /> تعديل البيانات
                        </button>
                        <button 
                          onClick={() => setDeleteModal({ id: merchantDetails!.id, name: merchantDetails!.name })}
                          className="h-12 w-12 flex items-center justify-center rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/10"
                        >
                           <Trash2 size={20} />
                        </button>
                      </div>

                      <div className="text-center">
                         <Link 
                           href={`/dashboard/merchants/${merchantDetails?.id}`}
                           className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center justify-center gap-2"
                         >
                            عرض الصفحة الكاملة للمتجر <ExternalLink size={14} />
                         </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-rose-50 text-rose-600 mb-6"><Trash2 size={32} /></div>
              <h3 className="text-xl font-bold text-slate-900">حذف المتجر نهائياً؟</h3>
              <p className="mt-3 text-sm font-medium text-slate-500 leading-relaxed">هل أنت متأكد من حذف "{deleteModal.name}"؟ لا يمكن التراجع عن هذا الإجراء.</p>
              <div className="mt-8 flex gap-4">
                <button onClick={() => { setBusyId(deleteModal.id); deleteMerchantMutation.mutate(deleteModal.id); }} disabled={!!busyId} className="flex-1 h-12 rounded-xl bg-rose-600 text-sm font-bold text-white hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/10">
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
