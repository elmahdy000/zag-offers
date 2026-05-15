'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Eye,
  Loader2,
  Search,
  Store,
  Tag,
  X,
  XCircle,
  Calendar,
  User as UserIcon,
  Phone,
  Mail,
  Package,
  MapPin,
  Clock,
  ExternalLink,
  ClipboardCheck,
  History,
  CheckCircle2,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, resolveImageUrl } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Components
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/components/shared/Toast';

interface PendingStore {
  id: string;
  name: string;
  area?: string;
  address?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  owner: { id?: string; name: string; phone: string; email: string };
  category: { id?: string; name: string };
  _count: { offers: number };
}

interface PendingOffer {
  id: string;
  title: string;
  discount: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  endDate?: string;
  _count: { coupons: number };
  store: {
    id?: string;
    name: string;
    category?: { id?: string; name: string };
    owner?: { id?: string; name: string; phone: string; email?: string };
  };
}

interface StoreDetails extends PendingStore {
  logo?: string | null;
  status: string;
  _count: { offers: number; reviews: number };
}

interface OfferDetails extends PendingOffer {
  images: string[];
  status: string;
  _count: { coupons: number; favorites: number; reviews: number };
}

type TabType = 'stores' | 'offers' | 'history';

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('ar-EG') : 'غير محدد';

function DetailCard({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 shadow-sm transition-all hover:bg-white hover:shadow-md">
      <div className="flex items-center gap-2 mb-1.5">
        {Icon && <Icon size={14} className="text-slate-300" />}
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-sm font-bold text-slate-900 truncate">{value}</p>
    </div>
  );
}

export default function ApprovalsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('stores');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [rejectModal, setRejectModal] = useState<{ id: string; type: 'store' | 'offer'; label: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [storeLoadingId, setStoreLoadingId] = useState<string | null>(null);
  const [offerLoadingId, setOfferLoadingId] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim().toLowerCase());
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: stores = [], isLoading: storesLoading } = useQuery({
    queryKey: ['pending-stores'],
    queryFn: async () => {
      const response = await adminApi().get<PendingStore[]>('/admin/stores/pending');
      return response.data;
    },
    staleTime: 45000,
    refetchOnWindowFocus: false,
  });

  const { data: offers = [], isLoading: offersLoading } = useQuery({
    queryKey: ['pending-offers'],
    queryFn: async () => {
      const response = await adminApi().get<PendingOffer[]>('/admin/offers/pending');
      return response.data;
    },
    staleTime: 45000,
    refetchOnWindowFocus: false,
  });

  const { data: approvedStores = [] } = useQuery({
    queryKey: ['approved-stores'],
    queryFn: async () => {
      const response = await adminApi().get<{ items: PendingStore[] }>('/admin/stores?status=APPROVED&limit=50');
      return response.data.items;
    },
    enabled: activeTab === 'history',
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const { data: approvedOffers = [] } = useQuery({
    queryKey: ['approved-offers'],
    queryFn: async () => {
      const response = await adminApi().get<{ items: PendingOffer[] }>('/admin/offers?status=ACTIVE&limit=50');
      return response.data.items;
    },
    enabled: activeTab === 'history',
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const historyItems = useMemo(() => {
    const combined = [
      ...approvedStores.map(s => ({ ...s, type: 'store' as const })),
      ...approvedOffers.map(o => ({ ...o, type: 'offer' as const, name: o.title }))
    ];
    return combined.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [approvedStores, approvedOffers]);

  const { data: storeDetails, isLoading: storeDetailsLoading } = useQuery({
    queryKey: ['pending-store-details', selectedStoreId],
    queryFn: async () => {
      const response = await adminApi().get<StoreDetails>(`/admin/stores/${selectedStoreId}`);
      return response.data;
    },
    enabled: !!selectedStoreId,
  });

  const { data: offerDetails, isLoading: offerDetailsLoading } = useQuery({
    queryKey: ['pending-offer-details', selectedOfferId],
    queryFn: async () => {
      const response = await adminApi().get<OfferDetails>(`/admin/offers/${selectedOfferId}`);
      return response.data;
    },
    enabled: !!selectedOfferId,
  });

  const filteredStores = useMemo(() => {
    if (!debouncedSearch) return stores;
    return stores.filter((s) => s.name.toLowerCase().includes(debouncedSearch));
  }, [stores, debouncedSearch]);

  const filteredOffers = useMemo(() => {
    if (!debouncedSearch) return offers;
    return offers.filter((o) => o.title.toLowerCase().includes(debouncedSearch));
  }, [offers, debouncedSearch]);

  const filteredHistory = useMemo(() => {
    if (!debouncedSearch) return historyItems;
    return historyItems.filter((i) => i.name.toLowerCase().includes(debouncedSearch));
  }, [historyItems, debouncedSearch]);

  const storeMutation = useMutation({
    mutationFn: async ({ id, action, reason }: { id: string; action: 'approve' | 'reject'; reason?: string }) =>
      adminApi().patch(`/admin/stores/${id}/${action}`, { reason }),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['pending-stores'] });
      queryClient.invalidateQueries({ queryKey: ['approved-stores'] });
      queryClient.invalidateQueries({ queryKey: ['pending-count'] });
      showToast(v.action === 'approve' ? 'تم تفعيل المتجر بنجاح' : 'تم رفض المتجر');
      setRejectModal(null);
      setRejectReason('');
      setSelectedStoreId(null);
    },
    onSettled: () => setStoreLoadingId(null),
  });

  const offerMutation = useMutation({
    mutationFn: async ({ id, action, reason }: { id: string; action: 'approve' | 'reject'; reason?: string }) =>
      adminApi().patch(`/admin/offers/${id}/${action}`, { reason }),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['pending-offers'] });
      queryClient.invalidateQueries({ queryKey: ['approved-offers'] });
      queryClient.invalidateQueries({ queryKey: ['pending-count'] });
      showToast(v.action === 'approve' ? 'تم تفعيل العرض بنجاح' : 'تم رفض العرض');
      setRejectModal(null);
      setRejectReason('');
      setSelectedOfferId(null);
    },
    onSettled: () => setOfferLoadingId(null),
  });

  return (
    <div className="p-6 lg:p-10 space-y-8">

      <PageHeader
        title="مركز الموافقات"
        description="مراجعة واعتماد طلبات المتاجر والعروض الجديدة لضمان جودة المنصة"
        icon={ClipboardCheck}
      />

      {/* Tabs and Summary */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-3 flex p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-inner">
          <button onClick={() => setActiveTab('stores')} className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${activeTab === 'stores' ? 'bg-white text-orange-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900'}`}>طلبات المتاجر ({stores.length})</button>
          <button onClick={() => setActiveTab('offers')} className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${activeTab === 'offers' ? 'bg-white text-orange-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900'}`}>طلبات العروض ({offers.length})</button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}>
            <History size={16} /> المعتمدة حديثاً
          </button>
        </div>
      </div>


      {/* Table Section */}
      <div className="overflow-hidden border border-slate-200 bg-white shadow-sm rounded-2xl transition-all hover:shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="px-6 py-6">{activeTab === 'offers' ? 'عنوان العرض' : 'اسم المتجر'}</th>
                <th className="px-6 py-6">{activeTab === 'offers' ? 'المتجر' : 'صاحب المتجر'}</th>
                <th className="px-6 py-6">التصنيف</th>
                <th className="px-6 py-6">{activeTab === 'history' ? 'تاريخ الموافقة' : 'تاريخ الإرسال'}</th>
                <th className="px-6 py-6 text-center">{activeTab === 'history' ? 'الحالة' : 'العمليات'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeTab === 'stores' && (
                filteredStores.length === 0 ? (
                  <tr><td colSpan={5} className="py-24 text-center text-slate-400 font-bold">لا توجد طلبات متاجر بانتظار المراجعة</td></tr>
                ) : filteredStores.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100 shadow-sm group-hover:bg-white transition-colors"><Store size={20} /></div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-tight">{item.name}</p>
                          <p className="text-[11px] font-medium text-slate-500 mt-1">{item.area || 'منطقة غير محددة'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold text-slate-700">{item.owner.name}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">{item.owner.phone}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-tight">{item.category.name}</span>
                    </td>
                    <td className="px-6 py-5 text-[11px] font-bold text-slate-400">{formatDate(item.createdAt)}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => { setStoreLoadingId(item.id); storeMutation.mutate({ id: item.id, action: 'approve' }); }} className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center shadow-sm" title="اعتماد المتجر">
                          {storeLoadingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={18} />}
                        </button>
                        <button onClick={() => setRejectModal({ id: item.id, type: 'store', label: item.name })} className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center shadow-sm" title="رفض الطلب">
                          <X size={18} />
                        </button>
                        <button onClick={() => setSelectedStoreId(item.id)} className="h-9 w-9 rounded-xl bg-slate-900 text-white hover:bg-orange-600 transition-all flex items-center justify-center shadow-md shadow-slate-100" title="تفاصيل الطلب">
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {activeTab === 'offers' && (
                filteredOffers.length === 0 ? (
                  <tr><td colSpan={5} className="py-24 text-center text-slate-400 font-bold">لا توجد طلبات عروض بانتظار المراجعة</td></tr>
                ) : filteredOffers.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm group-hover:bg-white transition-colors"><Tag size={20} /></div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-tight">{item.title}</p>
                          <p className="text-[11px] font-bold text-orange-600 mt-1">{item.discount}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-slate-700">{item.store.name}</td>
                    <td className="px-6 py-5">
                      <span className="inline-flex rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-tight">{item.store.category?.name || 'عام'}</span>
                    </td>
                    <td className="px-6 py-5 text-[11px] font-bold text-slate-400">{formatDate(item.createdAt)}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => { setOfferLoadingId(item.id); offerMutation.mutate({ id: item.id, action: 'approve' }); }} className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center shadow-sm" title="اعتماد العرض">
                          {offerLoadingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={18} />}
                        </button>
                        <button onClick={() => setRejectModal({ id: item.id, type: 'offer', label: item.title })} className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center shadow-sm" title="رفض الطلب">
                          <X size={18} />
                        </button>
                        <button onClick={() => setSelectedOfferId(item.id)} className="h-9 w-9 rounded-xl bg-slate-900 text-white hover:bg-orange-600 transition-all flex items-center justify-center shadow-md shadow-slate-100" title="تفاصيل الطلب">
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {activeTab === 'history' && (
                filteredHistory.length === 0 ? (
                  <tr><td colSpan={5} className="py-24 text-center text-slate-400 font-bold">لا توجد عمليات موافقة حديثة</td></tr>
                ) : filteredHistory.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-slate-50/50 transition-all group cursor-pointer"
                    onClick={() => router.push(item.type === 'store' ? `/dashboard/merchants/${item.id}` : `/dashboard/offers/${item.id}`)}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center border shadow-sm group-hover:bg-white transition-colors ${item.type === 'store' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                          {item.type === 'store' ? <Store size={20} /> : <Tag size={20} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-tight">{item.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{item.type === 'store' ? 'متجر' : 'عرض ترويجي'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-slate-700">
                      {item.type === 'store' ? (item as any).owner?.name : (item as any).store?.name}
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                        {item.type === 'store' ? (item as any).category?.name : ((item as any).store?.category?.name || 'عام')}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-[11px] font-bold text-emerald-600">{formatDate(item.updatedAt)}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center">
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                          <CheckCircle2 size={12} /> معتمد
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modals */}
      <AnimatePresence>
        {selectedStoreId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/20 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-900">مراجعة بيانات المتجر</h2>
                <button onClick={() => setSelectedStoreId(null)} className="rounded-xl bg-slate-50 p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={20} /></button>
              </div>

              {storeDetailsLoading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-orange-600" size={32} /></div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="h-24 w-24 overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                      {storeDetails?.logo ? <img src={resolveImageUrl(storeDetails.logo)} alt="logo" className="h-full w-full object-cover" /> : <Store size={40} className="text-slate-200" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-slate-900 leading-tight">{storeDetails?.name}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1 rounded-lg flex items-center gap-1.5"><Package size={14} /> {storeDetails?.category.name}</span>
                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5"><Clock size={14} /> أُرسل في {formatDate(storeDetails?.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <DetailCard label="اسم صاحب المتجر" value={storeDetails?.owner.name || 'غير متوفر'} icon={UserIcon} />
                    <DetailCard label="رقم الهاتف" value={storeDetails?.owner.phone || 'غير متوفر'} icon={Phone} />
                    <DetailCard label="البريد الإلكتروني" value={storeDetails?.owner.email || 'غير متوفر'} icon={Mail} />
                    <DetailCard label="المنطقة والحي" value={storeDetails?.area || 'غير محدد'} icon={MapPin} />
                    <div className="sm:col-span-2">
                      <DetailCard label="عنوان المتجر التفصيلي" value={storeDetails?.address || 'غير متوفر'} icon={ExternalLink} />
                    </div>
                  </div>

                  {storeDetails?.status === 'PENDING' && (
                    <div className="flex gap-4 pt-6 border-t border-slate-100">
                      <button onClick={() => storeMutation.mutate({ id: storeDetails!.id, action: 'approve' })} className="flex-1 h-12 rounded-xl bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 shadow-lg shadow-emerald-900/10 transition-all flex items-center justify-center gap-2">
                        <Check size={20} /> اعتماد المتجر وتفعيله
                      </button>
                      <button onClick={() => { setRejectModal({ id: storeDetails!.id, type: 'store', label: storeDetails!.name }); setSelectedStoreId(null); }} className="flex-1 h-12 rounded-xl bg-rose-600 text-sm font-bold text-white hover:bg-rose-700 shadow-lg shadow-rose-900/10 transition-all flex items-center justify-center gap-2">
                        <X size={20} /> رفض طلب التفعيل
                      </button>
                    </div>
                  )}

                  <div className="text-center pt-4">
                    <Link href={`/dashboard/merchants/${storeDetails?.id}`} onClick={() => setSelectedStoreId(null)} className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center justify-center gap-2">
                      عرض الصفحة الكاملة للمتجر <ExternalLink size={14} />
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {selectedOfferId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/20 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-900 leading-tight">مراجعة بيانات العرض</h2>
                <button onClick={() => setSelectedOfferId(null)} className="rounded-xl bg-slate-50 p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={20} /></button>
              </div>

              {offerDetailsLoading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-orange-600" size={32} /></div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-slate-900 leading-tight">{offerDetails?.title}</h3>
                        <p className="text-lg font-bold text-orange-600 mt-2">{offerDetails?.discount}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-lg flex items-center gap-1.5"><Store size={14} /> {offerDetails?.store.name}</span>
                          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5"><Clock size={14} /> أُرسل في {formatDate(offerDetails?.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">صور العرض ({offerDetails?.images?.length || 0})</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {offerDetails?.images?.map((img, idx) => (
                          <motion.div 
                            key={idx}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => setFullscreenImage(resolveImageUrl(img))}
                            className="aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 cursor-zoom-in relative group"
                          >
                            <img src={resolveImageUrl(img)} alt={`offer-${idx}`} className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
                              <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                            </div>
                            {idx === 0 && <span className="absolute top-2 right-2 bg-orange-600 text-white text-[8px] font-black px-2 py-0.5 rounded-lg shadow-lg">الرئيسية</span>}
                          </motion.div>
                        ))}
                        {(!offerDetails?.images || offerDetails.images.length === 0) && (
                          <div className="col-span-full h-32 rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300">
                            <Tag size={32} strokeWidth={1} />
                            <p className="text-[10px] font-bold mt-2">لا توجد صور متوفرة</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <DetailCard label="تاريخ بداية العرض" value={formatDate(offerDetails?.startDate)} icon={Calendar} />
                    <DetailCard label="تاريخ نهاية العرض" value={formatDate(offerDetails?.endDate)} icon={Calendar} />
                    <div className="sm:col-span-2">
                      <DetailCard label="وصف العرض" value={offerDetails?.description || 'لا يوجد وصف تفصيلي.'} icon={ExternalLink} />
                    </div>
                  </div>

                  {offerDetails?.status === 'PENDING' && (
                    <div className="flex gap-4 pt-6 border-t border-slate-100">
                      <button onClick={() => offerMutation.mutate({ id: offerDetails!.id, action: 'approve' })} className="flex-1 h-12 rounded-xl bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 shadow-lg shadow-emerald-900/10 transition-all flex items-center justify-center gap-2">
                        <Check size={20} /> اعتماد العرض وتفعيله
                      </button>
                      <button onClick={() => { setRejectModal({ id: offerDetails!.id, type: 'offer', label: offerDetails!.title }); setSelectedOfferId(null); }} className="flex-1 h-12 rounded-xl bg-rose-600 text-sm font-bold text-white hover:bg-rose-700 shadow-lg shadow-rose-900/10 transition-all flex items-center justify-center gap-2">
                        <X size={20} /> رفض طلب العرض
                      </button>
                    </div>
                  )}

                  <div className="text-center pt-4">
                    <Link href={`/dashboard/offers/${offerDetails?.id}`} onClick={() => setSelectedOfferId(null)} className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center justify-center gap-2">
                      عرض الصفحة الكاملة للعرض <ExternalLink size={14} />
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-rose-50 text-rose-600 mb-6"><XCircle size={32} /></div>
              <h3 className="text-xl font-bold text-slate-900">تأكيد رفض الطلب</h3>
              <p className="mt-3 text-sm font-medium text-slate-500 leading-relaxed">يرجى توضيح سبب الرفض لـ "{rejectModal.label}" لمساعدتهم على تعديل الطلب.</p>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="مثلاً: الصور غير واضحة، أو البيانات غير مكتملة..."
                className="mt-6 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium focus:border-rose-500 focus:bg-white focus:outline-none transition-all min-h-[120px] shadow-inner"
              />

              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => {
                    const fn = rejectModal.type === 'store' ? storeMutation : offerMutation;
                    fn.mutate({ id: rejectModal.id, action: 'reject', reason: rejectReason });
                  }}
                  disabled={!rejectReason.trim()}
                  className="flex-1 h-12 rounded-xl bg-rose-600 text-sm font-bold text-white hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/10 disabled:opacity-50"
                >
                  إرسال الرفض
                </button>
                <button onClick={() => setRejectModal(null)} className="flex-1 h-12 rounded-xl bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all">إلغاء</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {fullscreenImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 lg:p-12" onClick={() => setFullscreenImage(null)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="relative max-w-5xl w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={fullscreenImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt="Fullscreen" />
            <button 
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 lg:-right-12 lg:-top-12 h-12 w-12 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center"
            >
              <X size={28} />
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
