'use client';

import { useEffect, useState, Suspense, type ComponentType } from 'react';
import {
  Loader2,
  Search,
  Store as StoreIcon,
  Plus,
  X,
  Trash2,
  Filter,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  Calendar,
  MessageCircle,
  Image as ImageIcon,
  Upload,
  RefreshCw,
  AlertTriangle,
  Star,
  Ticket,
  Building2
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { adminApi, resolveImageUrl } from '@/lib/api';
import type { AxiosError } from 'axios';
import { ZAGAZIG_AREAS, DISPLAY_NAMES } from '@/lib/constants';

// Components
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/components/shared/Toast';
import { useSocketContext } from '@/components/SocketProvider';

interface StoreItem {
  id: string;
  name: string;
  category: string | { id: string; name: string };
  area: string;
  phone?: string;
  email?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  ownerId: string;
  ownerName?: string;
  createdAt: string;
  logo?: string | null;
  whatsapp?: string;
  address?: string;
  coverImage?: string;
  images?: string[];
}

type StoreFormData = {
  name: string; categoryId: string; area: string; address: string; phone: string;
  whatsapp: string; email: string; ownerId: string; logo: string; coverImage: string; images: string[];
};

interface StoreDetails extends StoreItem {
  branches?: { id: string; name: string; address: string; phone?: string; isActive: boolean; city?: { name: string }; area?: { name: string } }[];
  owner: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  offers: {
    id: string;
    title: string;
    status: string;
    _count: { coupons: number; favorites: number };
  }[];
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    customer: { id: string; name: string; phone: string };
  }[];
  _count: { offers: number; coupons: number; reviews: number };
}

function DetailItem({ label, value, icon: Icon, colorClass = "text-slate-900" }: { 
  label: string; 
  value: string; 
  icon?: ComponentType<{ size?: number; className?: string }>,
  colorClass?: string 
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3">
      <div className="mb-1 flex items-center gap-1.5">
        {Icon && <Icon size={14} className="shrink-0 text-slate-400" />}
        <p className="truncate text-[11px] font-bold text-slate-500">{label}</p>
      </div>
      <p className={`truncate text-[13px] font-bold leading-6 ${colorClass}`} title={value}>{value}</p>
    </div>
  );
}

function StoresContent() {
  const queryClient = useQueryClient();
  const { socket } = useSocketContext();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const requestedOwnerId = searchParams.get('openCreate') === 'true' ? searchParams.get('ownerId') || '' : '';
  const [isUpsertOpen, setIsUpsertOpen] = useState(Boolean(requestedOwnerId));
  const [editingStore, setEditingStore] = useState<StoreItem | null>(null);
  const [formData, setFormData] = useState<StoreFormData>({
    name: '',
    categoryId: '',
    area: '',
    address: '',
    phone: '',
    whatsapp: '',
    email: '',
    ownerId: requestedOwnerId,
    logo: '',
    coverImage: '',
    images: [] as string[],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

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
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
    };
    socket.on('admin_notification', handler);
    return () => { socket.off('admin_notification', handler); };
  }, [socket, queryClient]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-stores', debouncedSearch, statusFilter, categoryFilter, page],
    queryFn: async () => {
      const response = await adminApi().get('/admin/stores', {
        params: {
          search: debouncedSearch || undefined,
          status: statusFilter || undefined,
          categoryId: categoryFilter || undefined,
          page,
          limit: 20,
        },
      });
      if (!response.data || !Array.isArray(response.data.items)) {
        throw new Error('Invalid response format for stores');
      }
      return response.data as { 
        items: StoreItem[]; 
        meta: { total: number; lastPage: number } 
      };
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const { data: categories, isError: isCategoriesError, error: categoriesError, refetch: refetchCategories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const response = await adminApi().get('/admin/categories');
      const result = response.data as { id: string; name: string }[];
      if (!Array.isArray(result)) {
        throw new Error('Invalid response format for categories');
      }
      return result;
    },
    staleTime: 300000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const { data: merchants, isLoading: isLoadingMerchants, isError: isMerchantsError, error: merchantsError, refetch: refetchMerchants } = useQuery({
    queryKey: ['admin-merchants'],
    queryFn: async () => {
      // نطلب كل المستخدمين ليتمكن الأدمن من اختيار أي حساب
      const response = await adminApi().get('/admin/users', { params: { limit: 200 } });
      const result = response.data.items as { id: string; name: string; phone: string, role: string }[];
      if (!Array.isArray(result)) {
        throw new Error('Invalid response format for merchants');
      }
      return result;
    },
    staleTime: 300000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const { data: storeDetails, isLoading: detailsLoading, isError: isDetailsError, error: detailsError, refetch: refetchDetails } = useQuery({
    queryKey: ['admin-store-details', selectedStoreId],
    queryFn: async () => {
      const response = await adminApi().get<StoreDetails>(`/admin/stores/${selectedStoreId}`);
      return response.data;
    },
    enabled: !!selectedStoreId,
    retry: 1,
  });

  useEffect(() => {
    if (!selectedStoreId) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedStoreId(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [selectedStoreId]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi().delete(`/admin/stores/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
      showToast('تم حذف المتجر بنجاح');
      setDeleteModal(null);
    },
    onSettled: () => setMutatingId(null),
  });

  const upsertMutation = useMutation({
    mutationFn: (data: StoreFormData) => {
      return editingStore
        ? adminApi().patch(`/admin/stores/${editingStore.id}`, data)
        : adminApi().post('/admin/stores', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
      showToast(editingStore ? 'تم تحديث بيانات المتجر بنجاح' : 'تم إضافة المتجر بنجاح');
      setIsUpsertOpen(false);
      setEditingStore(null);
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showToast(err.response?.data?.message || 'حدث خطأ ما', 'error');
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi().patch(`/admin/stores/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
      showToast('تمت الموافقة على المتجر');
    },
    onSettled: () => setMutatingId(null),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminApi().patch(`/admin/stores/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
      showToast('تم رفض المتجر');
    },
    onSettled: () => setMutatingId(null),
  });

  const openUpsert = (store?: StoreItem) => {
    if (store) {
      setEditingStore(store);
      setFormData({
        name: store.name,
        categoryId: typeof store.category === 'string' ? store.category : store.category.id,
        area: store.area,
        address: store.address || '',
        phone: store.phone || '',
        whatsapp: store.whatsapp || '',
        email: store.email || '',
        ownerId: store.ownerId,
        logo: store.logo || '',
        coverImage: store.coverImage || '',
        images: store.images || [],
      });
    } else {
      setEditingStore(null);
      setFormData({ name: '', categoryId: '', area: '', address: '', phone: '', whatsapp: '', email: '', ownerId: '', logo: '', coverImage: '', images: [] });
    }
    setFormErrors({});
    setIsUpsertOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'coverImage') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'logo') setIsUploadingLogo(true);
    else setIsUploadingCover(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await adminApi().post('/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFormData(prev => ({ ...prev, [type]: response.data.url }));
      showToast('تم رفع الصورة بنجاح');
    } catch (error) {
      console.error('Upload error:', error);
      showToast('فشل رفع الصورة، يرجى المحاولة مرة أخرى', 'error');
    } finally {
      if (type === 'logo') setIsUploadingLogo(false);
      else setIsUploadingCover(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingGallery(true);
    try {
      const uploadPromises = files.map(async file => {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        const response = await adminApi().post('/upload', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.url;
      });

      const newUrls = await Promise.all(uploadPromises);
      setFormData(prev => ({ ...prev, images: [...prev.images, ...newUrls] }));
      showToast(`تم رفع ${newUrls.length} صور بنجاح`);
    } catch (error) {
      console.error('Gallery upload error:', error);
      showToast('فشل رفع بعض الصور', 'error');
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'اسم المتجر مطلوب';
    }

    if (!formData.categoryId.trim()) {
      errors.categoryId = 'الفئة مطلوبة';
    }

    if (!formData.area.trim()) {
      errors.area = 'المنطقة مطلوبة';
    }

    if (!formData.ownerId.trim()) {
      errors.ownerId = 'مالك المتجر مطلوب';
    }

    if (formData.phone && !/^[0-9]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'رقم الهاتف غير صالح';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'البريد الإلكتروني غير صالح';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const stores = data?.items ?? [];

  return (
    <div className="p-6 lg:p-10 space-y-8">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <PageHeader 
          title="إدارة المتاجر" 
          description="عرض وتعديل بيانات المتاجر وموافقة الطلبات المعلقة" 
          icon={StoreIcon}
        />
        <button 
          onClick={() => openUpsert()}
          className="h-[48px] px-6 rounded-xl bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-900/10 hover:bg-orange-700 transition-all flex items-center gap-2 shrink-0"
        >
          <Plus size={18} /> إضافة متجر جديد
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full lg:max-w-md group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-600 transition-colors" size={18} />
          <input
            type="text"
            placeholder="بحث عن متجر بالاسم أو المالك..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 w-full pr-12 pl-4 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:outline-none focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5 transition-all shadow-sm"
          />
        </div>

        <div className="flex gap-4 w-full lg:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-12 flex-1 lg:w-44 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold focus:outline-none focus:border-orange-600 shadow-sm cursor-pointer"
          >
            <option value="">كل الحالات</option>
            <option value="PENDING">بانتظار الموافقة</option>
            <option value="APPROVED">معتمد</option>
            <option value="REJECTED">مرفوض</option>
          </select>

          <select 
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="h-12 flex-1 lg:w-44 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold focus:outline-none focus:border-orange-600 shadow-sm cursor-pointer"
          >
            <option value="">كل الفئات</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
      </div>
    </div>

      {isCategoriesError && (
        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-rose-50 text-rose-600 mb-6 border border-rose-100">
            <AlertTriangle size={36} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">فشل تحميل البيانات</h3>
          <p className="mt-2 text-sm font-medium text-slate-500">حدث خطأ أثناء تحميل البيانات</p>
          <button onClick={() => refetchCategories()} className="mt-6 flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white">
            <RefreshCw size={16} />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse bg-white rounded-2xl border border-slate-100 shadow-sm" />
          ))}
        </div>
      ) : isError ? (
        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-rose-50 text-rose-600 mb-6 border border-rose-100">
            <AlertTriangle size={36} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">فشل تحميل البيانات</h3>
          <p className="mt-2 text-sm font-medium text-slate-500">حدث خطأ أثناء تحميل البيانات</p>
          <button onClick={() => refetch()} className="mt-6 flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white">
            <RefreshCw size={16} />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      ) : stores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
          <StoreIcon size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-bold">لا توجد متاجر مطابقة</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {stores.map((store) => (
            <div 
              key={store.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => setSelectedStoreId(store.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-xl border border-orange-100">
                  {store.name?.[0] || 'S'}
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${
                  store.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' :
                  store.status === 'PENDING' ? 'bg-amber-100 text-amber-600' :
                  'bg-rose-100 text-rose-600'
                }`}>
                  {store.status === 'APPROVED' ? 'معتمد' : 
                   store.status === 'PENDING' ? 'بانتظار' : 'مرفوض'}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-1 truncate">{store.name}</h3>
              <p className="text-xs font-medium text-slate-500 mb-3">
                {typeof store.category === 'string' 
                  ? (DISPLAY_NAMES[store.category] || store.category)
                  : (DISPLAY_NAMES[store.category.name] || store.category.name)
                }
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <MapPin size={12} />
                  <span className="truncate">{store.area}</span>
                </div>
                {store.ownerName && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="truncate">المالك: {store.ownerName}</span>
                  </div>
                )}
              </div>

              {store.status === 'PENDING' && (
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMutatingId(store.id); approveMutation.mutate(store.id); }}
                    disabled={!!mutatingId}
                    className="flex-1 h-9 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
                  >
                    {mutatingId === store.id ? <Loader2 className="animate-spin mx-auto" size={14} /> : 'موافقة'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setMutatingId(store.id); rejectMutation.mutate(store.id); }}
                    disabled={!!mutatingId}
                    className="flex-1 h-9 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50"
                  >
                    {mutatingId === store.id ? <Loader2 className="animate-spin mx-auto" size={14} /> : 'رفض'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {(data?.meta?.lastPage ?? 0) > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: data?.meta?.lastPage ?? 0 }).map((_, i) => (
            <button 
              key={i} 
              onClick={() => setPage(i + 1)} 
              className={`h-10 w-10 rounded-xl text-sm font-bold transition-all ${
                page === i + 1 
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Store Details Modal */}
      <AnimatePresence>
        {selectedStoreId && detailsLoading && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[2px] sm:p-5">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="جاري تحميل تفاصيل المتجر"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              className="w-full max-w-[600px] rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.22)]"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 animate-pulse rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/5 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-1/4 animate-pulse rounded bg-slate-100" />
                </div>
                <Loader2 className="animate-spin text-orange-600" size={22} />
              </div>
              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-[70px] animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            </motion.div>
          </div>
        )}
        {selectedStoreId && storeDetails && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[2px] sm:p-5"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSelectedStoreId(null);
            }}
          >
            <motion.div 
              role="dialog"
              aria-modal="true"
              aria-labelledby="store-details-title"
              initial={{ y: 12, scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ y: 8, scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex max-h-[min(86vh,760px)] w-full max-w-[600px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]"
            >
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-orange-100 bg-orange-50 text-lg font-bold text-orange-600">
                    {storeDetails.logo ? (
                      <img src={resolveImageUrl(storeDetails.logo)} alt="" className="h-full w-full object-cover" />
                    ) : (storeDetails.name?.[0] || 'م')}
                  </div>
                  <div className="min-w-0">
                    <h3 id="store-details-title" className="truncate text-lg font-bold leading-7 text-slate-900">{storeDetails.name}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        storeDetails.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' :
                        storeDetails.status === 'PENDING' ? 'bg-amber-100 text-amber-600' :
                        'bg-rose-100 text-rose-600'
                      }`}>
                        {storeDetails.status === 'APPROVED' ? 'معتمد' : 
                         storeDetails.status === 'PENDING' ? 'بانتظار' : 'مرفوض'}
                      </span>
                      <span className="text-[11px] text-slate-400">{new Date(storeDetails.createdAt).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                </div>
                <button aria-label="إغلاق" onClick={() => setSelectedStoreId(null)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto px-4 py-4 sm:px-5">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <DetailItem 
                  label="الفئة" 
                  value={typeof storeDetails.category === 'string' 
                    ? (DISPLAY_NAMES[storeDetails.category] || storeDetails.category)
                    : (DISPLAY_NAMES[storeDetails.category.name] || storeDetails.category.name)
                  } 
                />
                <DetailItem label="المنطقة" value={storeDetails.area} icon={MapPin} />
                <DetailItem label="رقم الهاتف" value={storeDetails.phone || 'غير متوفر'} icon={Phone} colorClass={storeDetails.phone ? 'text-slate-900' : 'text-slate-400'} />
                <DetailItem label="واتساب" value={storeDetails.whatsapp || 'غير متوفر'} icon={MessageCircle} colorClass={storeDetails.whatsapp ? 'text-slate-900' : 'text-slate-400'} />
                <DetailItem label="البريد الإلكتروني" value={storeDetails.email || 'غير متوفر'} icon={Mail} colorClass={storeDetails.email ? 'text-slate-900' : 'text-slate-400'} />
                <DetailItem label="اسم المالك" value={storeDetails.owner?.name || 'غير متوفر'} />
                {storeDetails.owner?.phone !== storeDetails.phone && (
                  <DetailItem label="هاتف المالك" value={storeDetails.owner?.phone || 'غير متوفر'} icon={Phone} />
                )}
              </div>

              <div className="mt-4 grid grid-cols-3 rounded-xl border border-slate-200 bg-slate-50/70 px-2 py-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">{storeDetails._count?.offers || 0}</div>
                  <div className="text-[11px] font-bold text-slate-500">عروض</div>
                </div>
                <div className="text-center border-x border-slate-200">
                  <div className="text-lg font-bold text-emerald-600">{storeDetails._count?.coupons || 0}</div>
                  <div className="text-[11px] font-bold text-slate-500">كوبونات</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{storeDetails._count?.reviews || 0}</div>
                  <div className="text-[11px] font-bold text-slate-500">تقييم</div>
                </div>
              </div>

              {/* Offers Section */}
              {storeDetails.branches && storeDetails.branches.length > 0 && (
                <div className="mt-5">
                  <h4 className="mb-2.5 flex items-center gap-2 text-sm font-bold text-slate-900"><Building2 size={17} className="text-orange-600" /> فروع المتجر</h4>
                  <div className="space-y-2">
                    {storeDetails.branches.map(branch => <div key={branch.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="min-w-0 flex-1"><p className="truncate text-xs font-black text-slate-800">{branch.name}</p><p className="mt-1 truncate text-[11px] text-slate-500">{branch.address} {branch.area?.name ? `· ${branch.area.name}` : ''}</p></div>
                      <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${branch.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>{branch.isActive ? 'نشط' : 'موقوف'}</span>
                    </div>)}
                  </div>
                </div>
              )}

              {/* Offers Section */}
              {storeDetails.offers && storeDetails.offers.length > 0 && (
                <div className="mt-5">
                  <h4 className="mb-2.5 text-sm font-bold text-slate-900">عروض المتجر</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {storeDetails.offers.map((offer) => (
                      <div key={offer.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-sm font-bold text-slate-700 truncate ml-2">{offer.title}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            offer.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' : 'bg-yellow-100 text-yellow-600'
                          }`}>
                            {offer.status === 'ACTIVE' ? 'نشط' : 'منتهي'}
                          </span>
                          <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1">
                            <Ticket size={10} /> {offer._count?.coupons || 0}
                          </span>
                          <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1">
                            <Star size={10} className="text-rose-400" /> {offer._count?.favorites || 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              {storeDetails.reviews && storeDetails.reviews.length > 0 && (
                <div className="mt-5">
                  <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Star size={18} className="text-yellow-500" /> آخر التقييمات
                  </h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {storeDetails.reviews.map((review) => (
                      <div key={review.id} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-slate-900">{review.customer?.name || 'مستخدم مجهول'}</p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} size={12} className={star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-100 text-slate-200'} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg leading-relaxed">{review.comment || 'لا يوجد تعليق'}</p>
                        <p className="text-[10px] text-slate-400 mt-2 text-left">{new Date(review.createdAt).toLocaleDateString('ar-EG')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              </div>

              <div className="flex shrink-0 flex-wrap gap-2 border-t border-slate-100 bg-white px-4 py-3 sm:px-5">
                <button 
                  onClick={() => { openUpsert(storeDetails); setSelectedStoreId(null); }}
                  className="h-10 min-w-[140px] flex-1 rounded-lg bg-orange-600 px-4 text-[13px] font-bold text-white transition-colors hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                >
                  تعديل البيانات
                </button>
                {storeDetails.status === 'PENDING' && (
                  <>
                    <button 
                      onClick={() => { setMutatingId(storeDetails.id); approveMutation.mutate(storeDetails.id); setSelectedStoreId(null); }}
                      disabled={!!mutatingId}
                      className="h-10 flex-1 rounded-lg border border-emerald-100 bg-emerald-50 px-4 text-[13px] font-bold text-emerald-600 transition-colors hover:bg-emerald-600 hover:text-white disabled:opacity-50"
                    >
                      {mutatingId === storeDetails.id ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'موافقة'}
                    </button>
                    <button 
                      onClick={() => { setMutatingId(storeDetails.id); rejectMutation.mutate(storeDetails.id); setSelectedStoreId(null); }}
                      disabled={!!mutatingId}
                      className="h-10 flex-1 rounded-lg border border-rose-100 bg-rose-50 px-4 text-[13px] font-bold text-rose-600 transition-colors hover:bg-rose-600 hover:text-white disabled:opacity-50"
                    >
                      {mutatingId === storeDetails.id ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'رفض'}
                    </button>
                  </>
                )}
                <button 
                  onClick={() => { setDeleteModal({ id: storeDetails.id, name: storeDetails.name }); setSelectedStoreId(null); }}
                  aria-label="حذف المتجر"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isDetailsError && selectedStoreId && (
        <AnimatePresence>
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white p-8 shadow-2xl border border-slate-100"
            >
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-rose-50 text-rose-600 mb-6 border border-rose-100">
                  <AlertTriangle size={36} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">فشل تحميل البيانات</h3>
                <p className="mt-2 text-sm font-medium text-slate-500">حدث خطأ أثناء تحميل البيانات</p>
                <button onClick={() => refetchDetails()} className="mt-6 flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white">
                  <RefreshCw size={16} />
                  <span>إعادة المحاولة</span>
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-[2rem] bg-white p-10 shadow-2xl text-center relative overflow-hidden border border-slate-100"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-rose-50 text-rose-600 mb-6 border border-rose-100">
                 <Trash2 size={36} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">تأكيد الحذف النهائي</h3>
              <p className="mt-4 text-sm font-medium text-slate-500 leading-relaxed px-2">
                أنت على وشك حذف متجر «{deleteModal.name}» بشكل نهائي. سيتم حذف جميع العروض والكوبونات المرتبطة به.
              </p>
              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => { setMutatingId(deleteModal.id); deleteMutation.mutate(deleteModal.id); }} 
                  disabled={!!mutatingId} 
                  className="flex-[2] h-12 rounded-xl bg-rose-600 text-sm font-bold text-white shadow-lg shadow-rose-900/10 transition-all hover:bg-rose-700 disabled:opacity-50"
                >
                  {mutatingId === deleteModal.id ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'تأكيد الحذف'}
                </button>
                <button onClick={() => setDeleteModal(null)} className="flex-1 h-12 rounded-xl bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all">
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create/Edit Store Modal */}
      <AnimatePresence>
        {isUpsertOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-cairo">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl rounded-[2.5rem] bg-white p-10 shadow-2xl relative border border-slate-100 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {editingStore ? 'تعديل بيانات المتجر' : 'إضافة متجر جديد'}
                  </h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Zag Offers Administration
                  </p>
                </div>
                <button 
                  onClick={() => setIsUpsertOpen(false)} 
                  className="rounded-xl bg-slate-50 p-3 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!formData.ownerId.trim()) {
                    showToast('يرجى اختيار مالك المتجر', 'error');
                    return;
                  }
                  if (validateForm()) upsertMutation.mutate(formData);
                }} 
                className="space-y-6"
              >
                {/* Image Uploads */}
                <div className="grid gap-6 sm:grid-cols-2 mb-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">
                      شعار المتجر (Logo)
                    </label>
                    <div 
                      className="relative group h-32 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all overflow-hidden"
                    >
                      {isUploadingLogo ? (
                        <Loader2 className="animate-spin text-orange-600" size={24} />
                      ) : formData.logo ? (
                        <>
                          <img src={resolveImageUrl(formData.logo)} alt="Logo" className="absolute inset-0 w-full h-full object-contain p-2" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <span className="text-white text-xs font-bold uppercase tracking-widest">تغيير الشعار</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <ImageIcon size={24} className="text-slate-300 group-hover:text-orange-400" />
                          <span className="text-xs font-bold text-slate-400 group-hover:text-orange-600">رفع لوجو</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleImageUpload(e, 'logo')} 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        disabled={isUploadingLogo}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">
                      صورة الغلاف (Cover Image)
                    </label>
                    <div 
                      className="relative group h-32 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all overflow-hidden"
                    >
                      {isUploadingCover ? (
                        <Loader2 className="animate-spin text-blue-600" size={24} />
                      ) : formData.coverImage ? (
                        <>
                          <img src={resolveImageUrl(formData.coverImage)} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <span className="text-white text-xs font-bold uppercase tracking-widest">تغيير الغلاف</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <ImageIcon size={24} className="text-slate-300 group-hover:text-blue-400" />
                          <span className="text-xs font-bold text-slate-400 group-hover:text-blue-600">رفع غلاف</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleImageUpload(e, 'coverImage')} 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        disabled={isUploadingCover}
                      />
                    </div>
                  </div>
                </div>

                {/* Gallery Upload */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">
                    معرض صور المتجر (Gallery)
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {formData.images.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-xl border border-slate-200 overflow-hidden group">
                        <img src={resolveImageUrl(url)} alt="صورة المتجر" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => removeGalleryImage(index)}
                          className="absolute top-1 right-1 h-6 w-6 rounded-lg bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <label className="relative aspect-square rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all">
                      {isUploadingGallery ? (
                        <Loader2 className="animate-spin text-orange-600" size={18} />
                      ) : (
                        <>
                          <Plus size={20} className="text-slate-300" />
                          <span className="text-[8px] font-bold text-slate-400 mt-1">إضافة</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        onChange={handleGalleryUpload} 
                        className="hidden" 
                        disabled={isUploadingGallery}
                      />
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">
                    اسم المتجر
                  </label>
                  <input 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className={`h-12 w-full rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-900 border ${
                      formErrors.name ? 'border-rose-500' : 'border-slate-100'
                    } focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all`} 
                  />
                  {formErrors.name && <p className="text-xs text-rose-600">{formErrors.name}</p>}
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">
                      الفئة
                    </label>
                    <select 
                      required
                      value={formData.categoryId} 
                      onChange={e => setFormData({...formData, categoryId: e.target.value})} 
                      className={`h-12 w-full rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-900 border ${
                        formErrors.categoryId ? 'border-rose-500' : 'border-slate-100'
                      } focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all cursor-pointer`}
                    >
                      <option value="">اختر الفئة</option>
                        {categories?.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {DISPLAY_NAMES[cat.name] || cat.name}
                          </option>
                        ))}
                    </select>
                    {formErrors.categoryId && <p className="text-xs text-rose-600">{formErrors.categoryId}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">
                      المنطقة
                    </label>
                    <select 
                      required
                      value={formData.area} 
                      onChange={e => setFormData({...formData, area: e.target.value})} 
                      className={`h-12 w-full rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-900 border ${
                        formErrors.area ? 'border-rose-500' : 'border-slate-100'
                      } focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all cursor-pointer`}
                    >
                      <option value="">اختر المنطقة</option>
                      {ZAGAZIG_AREAS.map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                    {formErrors.area && <p className="text-xs text-rose-600">{formErrors.area}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">
                    العنوان التفصيلي
                  </label>
                  <input 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                    placeholder="مثلاً: شارع القومية - بجوار بنك مصر"
                    className={`h-12 w-full rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-900 border border-slate-100 focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all`} 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">
                    مالك المتجر (التاجر)
                  </label>
                  <select 
                    required
                    value={formData.ownerId} 
                    onChange={e => setFormData({...formData, ownerId: e.target.value})} 
                    className={`h-12 w-full rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-900 border ${
                      formErrors.ownerId ? 'border-rose-500' : 'border-slate-100'
                    } focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all cursor-pointer`}
                  >
                    <option value="">
                      {isLoadingMerchants ? 'جاري تحميل التجار...' : 'اختر التاجر'}
                    </option>
                    {merchants?.map((merchant) => (
                      <option key={merchant.id} value={merchant.id}>
                        {merchant.name} - {merchant.phone} ({merchant.role === 'ADMIN' ? 'مدير' : merchant.role === 'MERCHANT' ? 'تاجر' : 'عميل'})
                      </option>
                    ))}
                  </select>
                  {formErrors.ownerId && <p className="text-xs text-rose-600">{formErrors.ownerId}</p>}
                  {isMerchantsError && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-rose-50 text-rose-600 mb-6 border border-rose-100">
                        <AlertTriangle size={36} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">فشل تحميل البيانات</h3>
                      <p className="mt-2 text-sm font-medium text-slate-500">حدث خطأ أثناء تحميل البيانات</p>
                      <button onClick={() => refetchMerchants()} className="mt-6 flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white">
                        <RefreshCw size={16} />
                        <span>إعادة المحاولة</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">
                      رقم الهاتف (اختياري)
                    </label>
                    <input 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      className={`h-12 w-full rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-900 border ${
                        formErrors.phone ? 'border-rose-500' : 'border-slate-100'
                      } focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all`} 
                    />
                    {formErrors.phone && <p className="text-xs text-rose-600">{formErrors.phone}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">
                      رقم الواتساب
                    </label>
                    <input 
                      value={formData.whatsapp} 
                      onChange={e => setFormData({...formData, whatsapp: e.target.value})} 
                      placeholder="2010XXXXXXXX"
                      className={`h-12 w-full rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-900 border border-slate-100 focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all`} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">
                    البريد الإلكتروني (اختياري)
                  </label>
                  <input 
                    type="email"
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    className={`h-12 w-full rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-900 border ${
                      formErrors.email ? 'border-rose-500' : 'border-slate-100'
                    } focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all`} 
                  />
                  {formErrors.email && <p className="text-xs text-rose-600">{formErrors.email}</p>}
                </div>

                <button 
                  type="submit" 
                  disabled={upsertMutation.isPending}
                  className="w-full h-14 rounded-2xl bg-orange-600 text-white font-bold text-sm shadow-xl shadow-orange-900/10 hover:bg-orange-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
                >
                  {upsertMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : (editingStore ? 'تحديث البيانات' : 'إنشاء المتجر')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function StoresPage() {
  return (
    <Suspense fallback={
      <div className="p-10 flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <Loader2 size={40} className="animate-spin text-orange-600 mb-4" />
        <p className="text-sm font-bold">جاري تحميل البيانات...</p>
      </div>
    }>
      <StoresContent />
    </Suspense>
  );
}
