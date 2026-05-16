'use client';

import { useEffect, useState, Suspense } from 'react';
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
  Upload
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { adminApi, resolveImageUrl } from '@/lib/api';
import { ZAGAZIG_AREAS, DISPLAY_NAMES } from '@/lib/constants';

// Components
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/components/shared/Toast';

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
}

interface StoreDetails extends StoreItem {
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
    _count: { coupons: number };
  }[];
  _count: { offers: number; coupons: number };
}

function DetailItem({ label, value, icon: Icon, colorClass = "text-slate-900" }: { 
  label: string; 
  value: string; 
  icon?: any, 
  colorClass?: string 
}) {
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

function StoresContent() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [isUpsertOpen, setIsUpsertOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    area: '',
    address: '',
    phone: '',
    whatsapp: '',
    email: '',
    ownerId: '',
    logo: '',
    coverImage: '',
    images: [] as string[],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const ownerId = searchParams.get('ownerId');
    const openCreate = searchParams.get('openCreate');
    if (ownerId && openCreate === 'true') {
      setFormData(prev => ({ ...prev, ownerId }));
      setIsUpsertOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-stores', debouncedSearch, statusFilter, categoryFilter, page],
    queryFn: async () => {
      const response = await adminApi().get('/admin/stores', {
        params: {
          search: debouncedSearch || undefined,
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
          page,
          limit: 20,
        },
      });
      return response.data as { 
        items: StoreItem[]; 
        meta: { total: number; lastPage: number } 
      };
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const response = await adminApi().get('/admin/categories');
      return response.data as { id: string; name: string }[];
    },
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  const { data: merchants, isLoading: isLoadingMerchants } = useQuery({
    queryKey: ['admin-merchants'],
    queryFn: async () => {
      // نطلب كل المستخدمين ليتمكن الأدمن من اختيار أي حساب
      const response = await adminApi().get('/admin/users', { params: { limit: 200 } });
      return response.data.items as { id: string; name: string; phone: string, role: string }[];
    },
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  const { data: storeDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['admin-store-details', selectedStoreId],
    queryFn: async () => {
      const response = await adminApi().get<StoreDetails>(`/admin/stores/${selectedStoreId}`);
      return response.data;
    },
    enabled: !!selectedStoreId,
  });

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
    mutationFn: (data: any) => {
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
    onError: (err: any) => {
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
        address: (store as any).address || '',
        phone: store.phone || '',
        whatsapp: store.whatsapp || '',
        email: store.email || '',
        ownerId: store.ownerId,
        logo: store.logo || '',
        coverImage: (store as any).coverImage || '',
        images: (store as any).images || [],
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
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse bg-white rounded-2xl border border-slate-100 shadow-sm" />
          ))}
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
                <div className="h-14 w-14 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-black text-xl border border-orange-100">
                  {store.name?.[0] || 'S'}
                </div>
                <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider ${
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
        {selectedStoreId && storeDetails && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white p-8 shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 font-black text-xl border border-orange-100">
                    {storeDetails.name?.[0] || 'S'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{storeDetails.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                        storeDetails.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' :
                        storeDetails.status === 'PENDING' ? 'bg-amber-100 text-amber-600' :
                        'bg-rose-100 text-rose-600'
                      }`}>
                        {storeDetails.status === 'APPROVED' ? 'معتمد' : 
                         storeDetails.status === 'PENDING' ? 'بانتظار' : 'مرفوض'}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-400">{new Date(storeDetails.createdAt).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedStoreId(null)} className="rounded-xl bg-slate-50 p-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Info Grid */}
              <div className="grid gap-4 sm:grid-cols-2 mb-8">
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
                <DetailItem label="هاتف المالك" value={storeDetails.owner?.phone || 'غير متوفر'} icon={Phone} />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-center">
                  <div className="text-2xl font-black text-orange-600">{storeDetails._count?.offers || 0}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">عروض</div>
                </div>
                <div className="text-center border-x border-slate-200">
                  <div className="text-2xl font-black text-emerald-600">{storeDetails._count?.coupons || 0}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">كوبونات</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-blue-600">-</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">تقييم</div>
                </div>
              </div>

              {/* Offers Section */}
              {storeDetails.offers && storeDetails.offers.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-slate-900 mb-4">عروض المتجر</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {storeDetails.offers.map((offer) => (
                      <div key={offer.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-sm font-bold text-slate-700">{offer.title}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                            offer.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' : 'bg-yellow-100 text-yellow-600'
                          }`}>
                            {offer.status === 'ACTIVE' ? 'نشط' : 'منتهي'}
                          </span>
                          <span className="text-xs text-slate-400">{offer._count?.coupons || 0} كوبون</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t border-slate-100">
                <button 
                  onClick={() => { openUpsert(storeDetails); setSelectedStoreId(null); }}
                  className="flex-1 h-11 rounded-xl bg-orange-600 text-white text-sm font-bold hover:bg-orange-700 transition-all"
                >
                  تعديل البيانات
                </button>
                {storeDetails.status === 'PENDING' && (
                  <>
                    <button 
                      onClick={() => { setMutatingId(storeDetails.id); approveMutation.mutate(storeDetails.id); setSelectedStoreId(null); }}
                      disabled={!!mutatingId}
                      className="flex-1 h-11 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-bold hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 disabled:opacity-50"
                    >
                      {mutatingId === storeDetails.id ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'موافقة'}
                    </button>
                    <button 
                      onClick={() => { setMutatingId(storeDetails.id); rejectMutation.mutate(storeDetails.id); setSelectedStoreId(null); }}
                      disabled={!!mutatingId}
                      className="flex-1 h-11 rounded-xl bg-rose-50 text-rose-600 text-sm font-bold hover:bg-rose-600 hover:text-white transition-all border border-rose-100 disabled:opacity-50"
                    >
                      {mutatingId === storeDetails.id ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'رفض'}
                    </button>
                  </>
                )}
                <button 
                  onClick={() => { setDeleteModal({ id: storeDetails.id, name: storeDetails.name }); setSelectedStoreId(null); }}
                  className="h-11 px-4 rounded-xl bg-rose-50 text-rose-600 text-sm font-bold hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                أنت على وشك حذف متجر "{deleteModal.name}" بشكل نهائي. سيتم حذف جميع العروض والكوبونات المرتبطة به.
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
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
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
                onSubmit={(e) => { e.preventDefault(); if (validateForm()) upsertMutation.mutate(formData); }} 
                className="space-y-6"
              >
                {/* Image Uploads */}
                <div className="grid gap-6 sm:grid-cols-2 mb-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">
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
                            <span className="text-white text-[10px] font-black uppercase tracking-widest">تغيير الشعار</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <ImageIcon size={24} className="text-slate-300 group-hover:text-orange-400" />
                          <span className="text-[10px] font-bold text-slate-400 group-hover:text-orange-600">رفع لوجو</span>
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
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">
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
                            <span className="text-white text-[10px] font-black uppercase tracking-widest">تغيير الغلاف</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <ImageIcon size={24} className="text-slate-300 group-hover:text-blue-400" />
                          <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-600">رفع غلاف</span>
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">
                    معرض صور المتجر (Gallery)
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {formData.images.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-xl border border-slate-200 overflow-hidden group">
                        <img src={resolveImageUrl(url)} className="w-full h-full object-cover" />
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">
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
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">
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
                        {categories?.filter(c => c.name !== 'سوبرماركت' && c.name !== 'خدمات محلية').map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {DISPLAY_NAMES[cat.name] || cat.name}
                          </option>
                        ))}
                    </select>
                    {formErrors.categoryId && <p className="text-xs text-rose-600">{formErrors.categoryId}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">
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
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">
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
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">
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
