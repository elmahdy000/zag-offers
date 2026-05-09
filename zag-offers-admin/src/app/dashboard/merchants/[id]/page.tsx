'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Store, 
  MapPin, 
  Phone, 
  Mail, 
  User as UserIcon, 
  ShieldCheck, 
  ShieldOff, 
  Trash2, 
  Calendar, 
  Tag, 
  TrendingUp, 
  Star,
  ExternalLink,
  Loader2,
  MessageCircle,
  Clock,
  ChevronRight,
  Zap,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi, resolveImageUrl } from '@/lib/api';
import { useState } from 'react';
import Link from 'next/link';

// Shared Components
import { PageHeader } from '@/components/shared/PageHeader';

interface Offer {
  id: string;
  title: string;
  discount: string;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED';
  createdAt: string;
  startDate: string;
  endDate: string;
}

interface MerchantDetails {
  id: string;
  name: string;
  logo?: string | null;
  coverImage?: string | null;
  address: string;
  area?: string;
  phone: string;
  whatsapp?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  createdAt: string;
  category: { id: string; name: string };
  owner: { 
    id: string; 
    name: string; 
    phone: string; 
    email?: string;
    avatar?: string | null;
    createdAt: string;
  };
  _count: { offers: number; reviews: number };
  offers?: Offer[];
}

export default function MerchantDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);

  const showToast = (text: string, tone: 'success' | 'error' = 'success') => {
    setToast({ text, tone });
    setTimeout(() => setToast(null), 4000);
  };

  const { data: store, isLoading, isError } = useQuery({
    queryKey: ['merchant-details', id],
    queryFn: async () => {
      const response = await adminApi().get<MerchantDetails>(`/admin/stores/${id}`);
      const offersResponse = await adminApi().get<any>('/admin/offers', { params: { storeId: id, limit: 100 } });
      return { ...response.data, offers: offersResponse.data.items || [] };
    },
    enabled: !!id,
  });

  const changeStatusMutation = useMutation({
    mutationFn: async (action: 'approve' | 'suspend') => {
      return action === 'approve'
        ? adminApi().patch(`/admin/stores/${id}/approve`)
        : adminApi().patch(`/admin/stores/${id}/suspend`, { reason: 'إجراء إداري' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-details', id] });
      showToast('تم تحديث حالة المتجر بنجاح');
    },
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const deleteMutation = useMutation({
    mutationFn: () => adminApi().delete(`/admin/stores/${id}`),
    onSuccess: () => {
      router.push('/dashboard/merchants');
      showToast('تم حذف المتجر نهائياً');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'فشل حذف المتجر', 'error');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => adminApi().patch(`/admin/stores/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store', id] });
      showToast('تم رفض المتجر');
      setRejectModal(false);
      setRejectReason('');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'فشل رفض المتجر', 'error');
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
        <p className="mt-4 text-sm font-bold text-slate-400">جاري تحميل بيانات المتجر...</p>
      </div>
    );
  }

  if (isError || !store) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-center p-6">
        <div className="h-16 w-16 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mb-4">
           <Store size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">المتجر غير موجود</h2>
        <button onClick={() => router.back()} className="mt-6 h-11 px-6 rounded-xl bg-slate-900 text-white font-bold text-xs">العودة للمتاجر</button>
      </div>
    );
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }} 
            animate={{ opacity: 1, y: 0, x: '-50%' }} 
            exit={{ opacity: 0, y: -20, x: '-50%' }} 
            className={`fixed top-10 left-1/2 z-[300] flex items-center gap-3 rounded-2xl px-8 py-4 text-sm font-bold text-white shadow-2xl backdrop-blur-md ${
              toast.tone === 'success' ? 'bg-emerald-600/95 shadow-emerald-900/20' : 'bg-rose-600/95 shadow-rose-900/20'
            }`}
          >
            {toast.tone === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Header */}
      <div className="flex items-center gap-4 text-sm font-bold text-slate-400">
         <Link href="/dashboard/merchants" className="hover:text-orange-600 transition-colors">إدارة المتاجر</Link>
         <ChevronRight size={14} className="rotate-180" />
         <span className="text-slate-900">تفاصيل المتجر</span>
      </div>

      <PageHeader 
        title={store.name} 
        description={`إدارة بيانات المتجر، مراجعة العروض المنشورة، والتحكم في حالة الحساب`} 
        icon={Store}
      />

      <div className="grid gap-8 lg:grid-cols-3">
         
         {/* Main Details Area */}
         <div className="lg:col-span-2 space-y-8">
            
            {/* Store Identity & Key Stats */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
               <div className="flex flex-col sm:flex-row gap-8 items-start">
                  <div className="h-32 w-32 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                     {store.logo ? <img src={resolveImageUrl(store.logo)} alt="logo" className="h-full w-full object-cover" /> : <Store size={48} className="text-slate-200" />}
                  </div>
                  <div className="flex-1 space-y-4">
                     <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-slate-900">{store.name}</h2>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                           store.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                           store.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                           'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                           {store.status === 'APPROVED' ? 'نشط' : store.status === 'PENDING' ? 'معلق' : 'موقوف'}
                        </span>
                     </div>
                     <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-lg">
                        متجر متخصص في {store.category.name} يخدم منطقة {store.area}. انضم للمنصة في {formatDate(store.createdAt)}.
                     </p>
                     
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-50">
                        <StatItem label="العروض" value={store._count.offers} color="text-orange-600" />
                        <StatItem label="المراجعات" value={store._count.reviews} color="text-blue-600" />
                        <StatItem label="التقييم" value="4.5" color="text-amber-500" />
                        <StatItem label="الحالة" value={store.status === 'APPROVED' ? 'مفعل' : 'مراجعة'} color="text-emerald-600" />
                     </div>
                  </div>
               </div>
            </div>

            {/* Store Offers List */}
            <div className="space-y-6">
               <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Zap size={20} className="text-orange-600" /> العروض المنشورة ({store.offers?.length || 0})
               </h3>
               
               <div className="grid gap-4">
                  {store.offers && store.offers.length > 0 ? store.offers.map((offer: Offer) => (
                    <div key={offer.id} className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-white hover:border-orange-200 transition-all group shadow-sm">
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                             <Tag size={20} />
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-900 leading-none mb-1.5">{offer.title}</p>
                             <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
                                <span>{offer.discount}</span>
                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                <span>ينتهي {formatDate(offer.endDate)}</span>
                             </div>
                          </div>
                       </div>
                       <Link href={`/dashboard/offers/${offer.id}`} className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white flex items-center justify-center transition-all">
                          <ExternalLink size={14} />
                       </Link>
                    </div>
                  )) : (
                    <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
                       <p className="text-sm font-bold">لا يوجد عروض نشطة لهذا المتجر</p>
                    </div>
                  )}
               </div>
            </div>
         </div>

         {/* Sidebar Area */}
         <div className="space-y-8">
            
            {/* Contact & Location Info */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">معلومات التواصل</h3>
               <div className="space-y-6">
                  <SidebarInfoItem icon={Phone} label="رقم الهاتف" value={store.phone} />
                  {store.whatsapp && <SidebarInfoItem icon={MessageCircle} label="واتساب" value={store.whatsapp} />}
                  <SidebarInfoItem icon={MapPin} label="المنطقة" value={store.area || 'غير محدد'} />
                  <SidebarInfoItem icon={Info} label="العنوان" value={store.address} />
               </div>
            </div>

            {/* Owner Info */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">بيانات المالك</h3>
               <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                     {store.owner.avatar ? <img src={resolveImageUrl(store.owner.avatar)} alt="owner" className="h-full w-full object-cover" /> : <UserIcon size={24} />}
                  </div>
                  <div>
                     <p className="text-sm font-bold text-slate-900 leading-none mb-1">{store.owner.name}</p>
                     <p className="text-[10px] font-medium text-slate-400">انضم {formatDate(store.owner.createdAt)}</p>
                  </div>
               </div>
               <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                     <Mail size={14} className="text-slate-300" />
                     <span className="truncate">{store.owner.email || 'لا يوجد بريد'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                     <Phone size={14} className="text-slate-300" />
                     <span>{store.owner.phone}</span>
                  </div>
               </div>
            </div>

            {/* Actions Block */}
            <div className="space-y-3">
               {store.status === 'APPROVED' ? (
                 <button 
                   onClick={() => changeStatusMutation.mutate('suspend')}
                   disabled={changeStatusMutation.isPending}
                   className="w-full h-12 rounded-xl bg-rose-50 text-rose-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                 >
                   {changeStatusMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <ShieldOff size={18} />}
                   إيقاف نشاط المتجر
                 </button>
               ) : (
                 <button 
                   onClick={() => changeStatusMutation.mutate('approve')}
                   disabled={changeStatusMutation.isPending}
                   className="w-full h-12 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10"
                 >
                   {changeStatusMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                   تفعيل المتجر الآن
                 </button>
               )}
               {store.status === 'APPROVED' ? (
                 <button
                   onClick={() => changeStatusMutation.mutate('suspend')}
                   disabled={changeStatusMutation.isPending}
                   className="w-full h-12 rounded-xl bg-rose-50 text-rose-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                 >
                   {changeStatusMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <ShieldOff size={18} />}
                   إيقاف نشاط المتجر
                 </button>
               ) : store.status === 'PENDING' ? (
                 <>
                   <button
                     onClick={() => changeStatusMutation.mutate('approve')}
                     disabled={changeStatusMutation.isPending}
                     className="w-full h-12 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10"
                   >
                     {changeStatusMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                     تفعيل المتجر الآن
                   </button>
                   <button
                     onClick={() => setRejectModal(true)}
                     disabled={rejectMutation.isPending}
                     className="w-full h-12 rounded-xl bg-rose-50 text-rose-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                   >
                     {rejectMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <ShieldOff size={18} />}
                     رفض طلب التفعيل
                   </button>
                 </>
               ) : (
                 <button
                   onClick={() => changeStatusMutation.mutate('approve')}
                   disabled={changeStatusMutation.isPending}
                   className="w-full h-12 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10"
                 >
                   {changeStatusMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                   تفعيل المتجر الآن
                 </button>
               )}
               <button
                 onClick={() => setDeleteModalOpen(true)}
                 disabled={deleteMutation.isPending}
                 className="w-full h-12 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-600 transition-all"
               >
                 <Trash2 size={18} /> حذف البيانات نهائياً
               </button>
            </div>

         </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-rose-50 text-rose-600 mb-6"><Trash2 size={32} /></div>
              <h3 className="text-xl font-bold text-slate-900">حذف المتجر نهائياً؟</h3>
              <p className="mt-3 text-sm font-medium text-slate-500 leading-relaxed">سيتم حذف المتجر "{store.name}" وجميع بياناته بشكل دائم.</p>
              <div className="mt-8 flex gap-4">
                <button onClick={() => { setDeleteModalOpen(false); deleteMutation.mutate(); }} disabled={deleteMutation.isPending} className="flex-1 h-12 rounded-xl bg-rose-600 text-sm font-bold text-white hover:bg-rose-700 transition-all shadow-lg">
                  {deleteMutation.isPending ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'نعم، احذف'}
                </button>
                <button onClick={() => setDeleteModalOpen(false)} className="flex-1 h-12 rounded-xl bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all">إلغاء</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-rose-50 text-rose-600 mb-6"><ShieldOff size={32} /></div>
              <h3 className="text-xl font-bold text-slate-900">رفض طلب التفعيل</h3>
              <p className="mt-3 text-sm font-medium text-slate-500 leading-relaxed">يرجى كتابة سبب الرفض لإعلام صاحب المتجر.</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="مثلاً: الصور غير واضحة، أو البيانات ناقصة..."
                className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium focus:border-rose-500 focus:bg-white focus:outline-none transition-all min-h-[100px] shadow-inner"
              />
              <div className="mt-6 flex gap-4">
                <button onClick={() => rejectMutation.mutate(rejectReason)} disabled={!rejectReason.trim() || rejectMutation.isPending} className="flex-1 h-12 rounded-xl bg-rose-600 text-sm font-bold text-white hover:bg-rose-700 transition-all disabled:opacity-50">
                  {rejectMutation.isPending ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'إرسال الرفض'}
                </button>
                <button onClick={() => setRejectModal(false)} className="flex-1 h-12 rounded-xl bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all">إلغاء</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatItem({ label, value, color }: { label: string; value: string | number; color: string }) {
   return (
      <div className="text-center sm:text-right">
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
         <p className={`text-lg font-black ${color} leading-none`}>{value}</p>
      </div>
   );
}

function SidebarInfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
   return (
      <div className="flex items-start gap-4">
         <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
            <Icon size={16} />
         </div>
         <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">{label}</p>
            <p className="text-sm font-bold text-slate-900 truncate leading-tight">{value}</p>
         </div>
      </div>
   );
}
