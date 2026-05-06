'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Tag, 
  Store, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  ShieldOff, 
  Trash2, 
  Loader2, 
  ChevronRight, 
  Zap, 
  Info,
  ExternalLink,
  ChevronLeft,
  Star,
  Users,
  Eye,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi, resolveImageUrl } from '@/lib/api';
import { useState } from 'react';
import Link from 'next/link';

// Shared Components
import { PageHeader } from '@/components/shared/PageHeader';

interface OfferDetails {
  id: string;
  title: string;
  description: string;
  discount: string;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'REJECTED';
  images?: string[];
  createdAt: string;
  startDate: string;
  endDate: string;
  store: { id: string; name: string; logo?: string | null; category: { name: string } };
  _count: { redemptions: number };
}

export default function OfferDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);

  const showToast = (text: string, tone: 'success' | 'error' = 'success') => {
    setToast({ text, tone });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: offer, isLoading, isError } = useQuery({
    queryKey: ['offer-details', id],
    queryFn: async () => {
      const response = await adminApi().get<OfferDetails>(`/admin/offers/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const changeStatusMutation = useMutation({
    mutationFn: async (action: 'approve' | 'suspend') => {
      // Assuming existing endpoints or generic update
      return adminApi().patch(`/admin/offers/${id}`, { 
        status: action === 'approve' ? 'ACTIVE' : 'EXPIRED' 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-details', id] });
      showToast('تم تحديث حالة العرض بنجاح');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi().delete(`/admin/offers/${id}`),
    onSuccess: () => {
      router.push('/dashboard/offers');
      showToast('تم حذف العرض نهائياً');
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
        <p className="mt-4 text-sm font-bold text-slate-400">جاري تحميل بيانات العرض...</p>
      </div>
    );
  }

  if (isError || !offer) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-center p-6">
        <div className="h-16 w-16 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mb-4">
           <Tag size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">العرض غير موجود</h2>
        <button onClick={() => router.back()} className="mt-6 h-11 px-6 rounded-xl bg-slate-900 text-white font-bold text-xs">العودة للعروض</button>
      </div>
    );
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`fixed bottom-6 left-1/2 z-[150] -translate-x-1/2 rounded-xl px-6 py-3 text-xs font-bold text-white shadow-xl ${toast.tone === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Header */}
      <div className="flex items-center gap-4 text-sm font-bold text-slate-400">
         <Link href="/dashboard/offers" className="hover:text-orange-600 transition-colors">إدارة العروض</Link>
         <ChevronRight size={14} className="rotate-180" />
         <span className="text-slate-900">تفاصيل العرض الترويجي</span>
      </div>

      <PageHeader 
        title={offer.title} 
        description={`مراجعة تفاصيل العرض الترويجي، شروط الاستخدام، وإدارة حالة العرض`} 
        icon={Tag}
      />

      <div className="grid gap-8 lg:grid-cols-3">
         
         {/* Main Details Area */}
         <div className="lg:col-span-2 space-y-8">
            
            {/* Offer Main Info */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
               <div className="flex flex-col md:flex-row gap-8">
                  {offer.images && offer.images.length > 0 ? (
                    <div className="w-full md:w-64 h-48 rounded-2xl overflow-hidden border border-slate-100 shrink-0">
                       <img src={resolveImageUrl(offer.images[0])} alt="offer" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-full md:w-64 h-48 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-200 shrink-0">
                       <Tag size={48} />
                    </div>
                  )}
                  
                  <div className="flex-1 space-y-4">
                     <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-lg bg-orange-50 text-orange-600 text-xs font-black uppercase">خصم {offer.discount}</span>
                        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                           offer.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                           offer.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                           'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                           {offer.status === 'ACTIVE' ? 'نشط الآن' : offer.status === 'PENDING' ? 'قيد المراجعة' : 'منتهي / مرفوض'}
                        </div>
                     </div>
                     <h2 className="text-2xl font-bold text-slate-900">{offer.title}</h2>
                     <p className="text-sm font-medium text-slate-500 leading-relaxed">
                        {offer.description || 'لا يوجد وصف تفصيلي لهذا العرض حالياً.'}
                     </p>
                     
                     <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                        <div className="flex items-center gap-3">
                           <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                              <Calendar size={16} />
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">يبدأ من</p>
                              <p className="text-xs font-bold text-slate-900">{formatDate(offer.startDate)}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                              <Clock size={16} />
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">ينتهي في</p>
                              <p className="text-xs font-bold text-slate-900">{formatDate(offer.endDate)}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Performance Analytics (Placeholders for now) */}
            <div className="grid gap-6 sm:grid-cols-3">
               <OfferStat label="إجمالي الاستخدام" value={offer._count.redemptions} icon={Users} color="text-indigo-600" bg="bg-indigo-50" />
               <OfferStat label="عدد المشاهدات" value="1.2k" icon={Eye} color="text-emerald-600" bg="bg-emerald-50" />
               <OfferStat label="معدل التحويل" value="12%" icon={TrendingUp} color="text-amber-600" bg="bg-amber-50" />
            </div>

            {/* Terms & Conditions */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
               <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-6">
                  <Info size={18} className="text-slate-400" /> شروط وأحكام العرض
               </h3>
               <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-sm font-medium text-slate-500">
                     <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                     <span>العرض ساري لفترة محدودة وحتى نفاذ الكمية.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm font-medium text-slate-500">
                     <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                     <span>لا يمكن دمج هذا العرض مع عروض أخرى في نفس المتجر.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm font-medium text-slate-500">
                     <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                     <span>يجب إظهار تطبيق ZAG للمتجر للاستفادة من الخصم.</span>
                  </li>
               </ul>
            </div>
         </div>

         {/* Sidebar Area */}
         <div className="space-y-8">
            
            {/* Store Preview Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">المتجر المقدم للعرض</h3>
               <div className="flex items-center gap-4 mb-6">
                  <div className="h-14 w-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                     {offer.store.logo ? <img src={resolveImageUrl(offer.store.logo)} alt="store" className="h-full w-full object-cover" /> : <Store size={24} className="text-slate-200" />}
                  </div>
                  <div className="min-w-0">
                     <p className="text-sm font-bold text-slate-900 truncate leading-none mb-1">{offer.store.name}</p>
                     <p className="text-[10px] font-medium text-slate-400">{offer.store.category.name}</p>
                  </div>
               </div>
               <Link 
                  href={`/dashboard/merchants/${offer.store.id}`}
                  className="w-full h-11 rounded-xl bg-slate-50 text-slate-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white transition-all border border-slate-100"
               >
                  زيارة صفحة المتجر <ArrowRight size={14} className="rotate-180" />
               </Link>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
               {offer.status !== 'ACTIVE' ? (
                 <button 
                   onClick={() => changeStatusMutation.mutate('approve')}
                   disabled={changeStatusMutation.isPending}
                   className="w-full h-12 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10"
                 >
                   {changeStatusMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                   اعتماد ونشر العرض
                 </button>
               ) : (
                 <button 
                   onClick={() => changeStatusMutation.mutate('suspend')}
                   disabled={changeStatusMutation.isPending}
                   className="w-full h-12 rounded-xl bg-amber-50 text-amber-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-amber-600 hover:text-white transition-all border border-amber-100"
                 >
                   {changeStatusMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <ShieldOff size={18} />}
                   إيقاف العرض مؤقتاً
                 </button>
               )}
               
               <button 
                 onClick={() => { if(confirm('حذف العرض نهائياً؟')) deleteMutation.mutate(); }}
                 disabled={deleteMutation.isPending}
                 className="w-full h-12 rounded-xl bg-rose-50 text-rose-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
               >
                 <Trash2 size={18} /> حذف العرض نهائياً
               </button>
            </div>

            {/* Helper Alert */}
            <div className="rounded-2xl bg-orange-50/50 border border-orange-100 p-6 flex gap-4">
               <AlertCircle className="text-orange-600 shrink-0" size={20} />
               <p className="text-xs font-medium text-orange-800 leading-relaxed">
                  تأكد من مراجعة تواريخ العرض وصور المنتجات قبل عملية الاعتماد لضمان جودة المحتوى المعروض للمستخدمين.
               </p>
            </div>

         </div>
      </div>
    </div>
  );
}

function OfferStat({ label, value, icon: Icon, color, bg }: { label: string; value: string | number; icon: any; color: string; bg: string }) {
   return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
         <div className={`h-10 w-10 rounded-xl ${bg} ${color} flex items-center justify-center mx-auto mb-4`}>
            <Icon size={18} />
         </div>
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
         <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
   );
}
