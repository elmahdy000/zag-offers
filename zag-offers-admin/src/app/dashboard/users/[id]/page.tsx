'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  User as UserIcon, 
  Mail, 
  Smartphone, 
  MapPin, 
  Calendar, 
  Shield, 
  Briefcase, 
  Star, 
  ChevronRight, 
  Loader2, 
  Trash2, 
  Ticket, 
  Store, 
  ExternalLink,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi, resolveImageUrl } from '@/lib/api';
import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/shared/Toast';

// Shared Components
import { PageHeader } from '@/components/shared/PageHeader';

interface UserDetails {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: 'CUSTOMER' | 'MERCHANT' | 'ADMIN';
  area: string | null;
  avatar: string | null;
  createdAt: string;
  points?: number;
  tier?: string;
  stores: {
    id: string;
    name: string;
    status: string;
    _count: { offers: number };
  }[];
  coupons: {
    id: string;
    code: string;
    status: string;
    createdAt: string;
    offer: { title: string; discount?: string; discountType?: string };
  }[];
  reviews: {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    store: { name: string };
  }[];
  favorites: {
    id: string;
    createdAt: string;
    offer: { title: string; discount?: string; discountType?: string; store?: { name: string } };
  }[];
  _count: {
    stores: number;
    coupons: number;
    reviews: number;
    favorites: number;
  };
  pointHistory: {
    id: string;
    amount: number;
    reason: string;
    createdAt: string;
  }[];
}

const roleLabels: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ADMIN: { label: 'مدير نظام', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
  MERCHANT: { label: 'تاجر', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  CUSTOMER: { label: 'عميل', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
};

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['admin-user-details', id],
    queryFn: async () => {
      const response = await adminApi().get<UserDetails>(`/admin/users/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => adminApi().delete(`/admin/users/${id}`),
    onSuccess: () => {
      router.push('/dashboard/users');
      showToast('تم حذف المستخدم نهائياً');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'فشل حذف المستخدم', 'error');
    }
  });

  const [pointsModalOpen, setPointsModalOpen] = useState(false);
  const [pointsForm, setPointsForm] = useState({ action: 'ADD', amount: 0, reason: '' });

  const pointsMutation = useMutation({
    mutationFn: () => adminApi().patch(`/admin/users/${id}/points`, pointsForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-details', id] });
      setPointsModalOpen(false);
      showToast('تم تعديل النقاط بنجاح');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'فشل تعديل النقاط', 'error');
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
        <p className="mt-4 text-sm font-bold text-slate-400">جاري تحميل بيانات المستخدم...</p>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-center p-6 bg-[#F8FAFC]">
        <div className="h-20 w-20 rounded-[2rem] bg-white border border-slate-200 flex items-center justify-center mb-6 shadow-sm">
           <UserIcon size={40} className="text-slate-300" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">المستخدم غير موجود</h2>
        <p className="text-slate-500 text-sm mb-8">ربما تم حذفه أو أن الرابط غير صحيح</p>
        <button 
          onClick={() => router.back()} 
          className="h-12 px-8 rounded-xl bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-900/10 hover:bg-orange-700 transition-all flex items-center gap-2"
        >
          <ArrowRight size={18} /> العودة للمستخدمين
        </button>
      </div>
    );
  }

  const roleInfo = roleLabels[user.role] || roleLabels.CUSTOMER;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] font-cairo dir-rtl">

      <div className="p-6 lg:p-10 space-y-8 pb-20">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-3 text-sm font-bold text-slate-400 mb-2">
           <Link href="/dashboard/users" className="hover:text-orange-600 transition-colors">المستخدمين</Link>
           <ChevronRight size={14} className="rotate-180 opacity-50" />
           <span className="text-slate-900">تفاصيل الحساب</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
           
           {/* Main Content Area */}
           <div className="lg:col-span-2 space-y-8">
              
              {/* User Profile Header Card */}
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
                 <div className="flex flex-col md:flex-row gap-10 items-start relative z-10">
                    <div className="h-32 w-32 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                       {user.avatar ? (
                          <img src={resolveImageUrl(user.avatar)} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                         <UserIcon size={56} className="text-slate-300" strokeWidth={1} />
                       )}
                    </div>
                    
                    <div className="flex-1 space-y-8">
                       <div className="space-y-3">
                          <div className="flex items-center flex-wrap gap-4">
                             <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{user.name}</h2>
                             <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${roleInfo.bg} ${roleInfo.color} ${roleInfo.border}`}>
                                {roleInfo.label}
                             </span>
                          </div>
                          <p className="text-slate-500 font-medium flex items-center gap-2 text-sm">
                             <Clock size={16} className="text-slate-400" />
                             عضو منذ {formatDate(user.createdAt)}
                           </p>
                           {user.role === 'CUSTOMER' && user.tier && (
                              <div className="flex items-center gap-3 pt-2">
                                 <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-black rounded-lg border border-yellow-200 uppercase tracking-widest">
                                    {user.tier}
                                 </span>
                                 <span className="text-sm font-bold text-slate-700">
                                    {user.points} نقطة
                                 </span>
                              </div>
                           )}
                       </div>
                       
                       <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-slate-100">
                          <StatBox label="المتاجر" value={user._count.stores} color="text-emerald-600" bg="bg-emerald-50" icon={Store} />
                          <StatBox label="الكوبونات" value={user._count.coupons} color="text-orange-600" bg="bg-orange-50" icon={Ticket} />
                          <StatBox label="المراجعات" value={user._count.reviews} color="text-blue-600" bg="bg-blue-50" icon={Star} />
                          <StatBox label="المفضلة" value={user._count.favorites} color="text-rose-600" bg="bg-rose-50" icon={Star} />
                       </div>
                    </div>
                 </div>
              </div>

              {/* Merchant Section (If Merchant) */}
              {user.role === 'MERCHANT' && (
                <section className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                      <Store size={20} />
                    </div>
                    المتاجر المسجلة ({user.stores.length})
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-6">
                    {user.stores.length > 0 ? user.stores.map((store) => (
                      <Link 
                        key={store.id}
                        href={`/dashboard/merchants/${store.id}`}
                        className="group/store p-6 rounded-[2rem] bg-white border border-slate-200 hover:border-orange-500/30 hover:shadow-xl transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover/store:bg-orange-50 group-hover/store:text-orange-600 transition-all">
                            <Briefcase size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 mb-1 group-hover/store:text-orange-600 transition-colors">{store.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{store._count.offers} عرض نشط</p>
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/store:text-white group-hover/store:bg-orange-600 transition-all border border-slate-100">
                          <ExternalLink size={18} />
                        </div>
                      </Link>
                    )) : (
                      <div className="sm:col-span-2 p-12 rounded-[2.5rem] bg-white border border-dashed border-slate-200 text-center text-slate-400 font-bold">
                        لا يوجد متاجر مسجلة حالياً
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Coupons Section */}
              <section className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3 px-2">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                    <Ticket size={20} />
                  </div>
                  الكوبونات المستخدمة ({user.coupons.length})
                </h3>
                <div className="space-y-4">
                  {user.coupons.length > 0 ? user.coupons.map((coupon) => (
                    <div key={coupon.id} className="p-6 rounded-[2rem] bg-white border border-slate-200 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                          <Ticket size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 mb-1">{coupon.offer.title}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase bg-slate-50 px-2 py-0.5 rounded border border-slate-100">الكود: {coupon.code}</span>
                            {coupon.offer.discount && (
                              <span className="text-[10px] font-bold text-emerald-600 tracking-widest uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                خصم {coupon.offer.discount}{coupon.offer.discountType === 'PERCENTAGE' ? '%' : ' ج.م'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${
                          coupon.status === 'USED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
                        } border`}>
                          {coupon.status === 'USED' ? 'مستخدم' : 'نشط'}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-2 font-bold">{formatDate(coupon.createdAt)}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="p-12 rounded-[2.5rem] bg-white border border-dashed border-slate-200 text-center text-slate-400 font-bold">
                      لم يتم استخدام أي كوبونات بعد
                    </div>
                  )}
                </div>
              </section>

              {/* Favorites Section */}
              <section className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3 px-2">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                    <Star size={20} />
                  </div>
                  المفضلة ({user.favorites?.length || 0})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {user.favorites && user.favorites.length > 0 ? user.favorites.map((fav) => (
                    <div key={fav.id} className="p-5 rounded-[2rem] bg-white border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="px-2 py-1 bg-slate-50 text-slate-500 text-[10px] font-black rounded-lg uppercase">
                            {fav.offer.store?.name}
                          </span>
                          {fav.offer.discount && (
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg">
                              {fav.offer.discount}{fav.offer.discountType === 'PERCENTAGE' ? '%' : ' ج.م'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-900 line-clamp-2 leading-relaxed">{fav.offer.title}</p>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-4 font-bold">أضيف في: {formatDate(fav.createdAt)}</p>
                    </div>
                  )) : (
                    <div className="sm:col-span-2 p-12 rounded-[2.5rem] bg-white border border-dashed border-slate-200 text-center text-slate-400 font-bold">
                      لا يوجد عروض في المفضلة
                    </div>
                  )}
                </div>
              </section>

              {/* Reviews Section */}
              <section className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3 px-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <Star size={20} />
                  </div>
                  المراجعات والتقييمات ({user.reviews?.length || 0})
                </h3>
                <div className="space-y-4">
                  {user.reviews && user.reviews.length > 0 ? user.reviews.map((review) => (
                    <div key={review.id} className="p-6 rounded-[2rem] bg-white border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs font-bold text-slate-500 mb-1">{review.store.name}</p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} size={14} className={star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-100 text-slate-200'} />
                            ))}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{formatDate(review.createdAt)}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        {review.comment || 'بدون تعليق'}
                      </p>
                    </div>
                  )) : (
                    <div className="p-12 rounded-[2.5rem] bg-white border border-dashed border-slate-200 text-center text-slate-400 font-bold">
                      لم يتم كتابة أي تقييمات
                    </div>
                  )}
                </div>
              </section>

              {/* Point History Section */}
              {user.role === 'CUSTOMER' && (
              <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center border border-yellow-100">
                      <Star size={20} />
                    </div>
                    سجل النقاط ({user.pointHistory?.length || 0})
                  </h3>
                  <button 
                    onClick={() => setPointsModalOpen(true)}
                    className="h-10 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-md"
                  >
                    تعديل النقاط
                  </button>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                  {user.pointHistory && user.pointHistory.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {user.pointHistory.map((log) => (
                        <div key={log.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${log.amount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                              {log.amount > 0 ? '+' : ''}{log.amount}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{log.reason.replace('MANUAL_ADJUSTMENT: ', '')}</p>
                              <p className="text-xs font-bold text-slate-400 mt-0.5">{formatDate(log.createdAt)}</p>
                            </div>
                          </div>
                          {log.reason.startsWith('MANUAL_ADJUSTMENT') && (
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-md uppercase tracking-widest">
                              تعديل يدوي
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-400 font-bold">
                      لا توجد حركات نقاط بعد
                    </div>
                  )}
                </div>
              </section>
              )}
           </div>

           {/* Sidebar Area */}
           <div className="space-y-8">
              
              {/* Contact Card */}
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">معلومات التواصل</h3>
                 <div className="space-y-6">
                    <ContactItem icon={Smartphone} label="رقم الموبايل" value={user.phone} />
                    <ContactItem icon={Mail} label="البريد الإلكتروني" value={user.email || 'غير متوفر'} />
                    <ContactItem icon={MapPin} label="المنطقة" value={user.area || 'غير محدد'} />
                    <ContactItem icon={Shield} label="نوع الحساب" value={roleInfo.label} />
                 </div>
              </div>

              {/* Danger Zone Actions */}
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 space-y-4 shadow-sm">
                 <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] px-1 mb-4">إجراءات خطيرة</h3>
                 <button 
                   onClick={() => setDeleteModalOpen(true)}
                   disabled={deleteMutation.isPending}
                   className="w-full h-14 rounded-2xl bg-rose-50 text-rose-600 font-bold text-sm flex items-center justify-center gap-3 hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                 >
                   {deleteMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                   حذف حساب المستخدم
                 </button>
              </div>

              {/* Help/Notice */}
              <div className="p-8 rounded-[2.5rem] bg-orange-50 border border-orange-100 text-center space-y-4 shadow-sm">
                 <div className="w-12 h-12 rounded-2xl bg-white text-orange-600 flex items-center justify-center mx-auto shadow-sm">
                   <Star size={24} />
                 </div>
                 <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                   يمكنك متابعة نشاط هذا المستخدم بالكامل لضمان أمان وجودة التعاملات في المنصة.
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-[2rem] bg-white p-10 shadow-2xl text-center border border-slate-100">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-rose-50 text-rose-600 mb-6 border border-rose-100">
                <Trash2 size={36} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">تأكيد الحذف النهائي</h3>
              <p className="mt-4 text-sm font-medium text-slate-500 leading-relaxed px-2">أنت على وشك حذف حساب "{user.name}" بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.</p>
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => { setDeleteModalOpen(false); deleteMutation.mutate(); }}
                  disabled={deleteMutation.isPending}
                  className="flex-[2] h-12 rounded-xl bg-rose-600 text-sm font-bold text-white hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/10 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleteMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                  نعم، احذف نهائياً
                </button>
                <button onClick={() => setDeleteModalOpen(false)} className="flex-1 h-12 rounded-xl bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all">إلغاء</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Adjust Points Modal */}
      <AnimatePresence>
        {pointsModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-cairo">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-2xl relative border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">تعديل نقاط المستخدم</h3>
                <div className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                  الرصيد: {user.points}
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setPointsForm({ ...pointsForm, action: 'ADD' })}
                    className={`h-10 rounded-xl text-sm font-bold border transition-all ${pointsForm.action === 'ADD' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500'}`}
                  >
                    إضافة (+)
                  </button>
                  <button 
                    onClick={() => setPointsForm({ ...pointsForm, action: 'REMOVE' })}
                    className={`h-10 rounded-xl text-sm font-bold border transition-all ${pointsForm.action === 'REMOVE' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-500'}`}
                  >
                    خصم (-)
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">مقدار النقاط</label>
                  <input 
                    type="number" 
                    min="1"
                    value={pointsForm.amount || ''} 
                    onChange={e => setPointsForm({ ...pointsForm, amount: parseInt(e.target.value) || 0 })}
                    className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200 px-4 text-slate-900 font-bold focus:bg-white focus:border-slate-400 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">السبب (يظهر في السجل)</label>
                  <input 
                    type="text" 
                    value={pointsForm.reason} 
                    onChange={e => setPointsForm({ ...pointsForm, reason: e.target.value })}
                    placeholder="مثال: تعويض عن مشكلة تقنية"
                    className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200 px-4 text-slate-900 font-bold focus:bg-white focus:border-slate-400 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => pointsMutation.mutate()}
                  disabled={pointsMutation.isPending || pointsForm.amount <= 0 || !pointsForm.reason.trim()}
                  className="flex-[2] h-12 rounded-xl bg-slate-900 text-sm font-bold text-white hover:bg-slate-800 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {pointsMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : 'تأكيد العملية'}
                </button>
                <button onClick={() => setPointsModalOpen(false)} className="flex-1 h-12 rounded-xl bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all">إلغاء</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatBox({ label, value, color, bg, icon: Icon }: { label: string; value: number; color: string; bg: string; icon: any }) {
  return (
    <div className="space-y-3">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center ${color} border border-current/10`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 leading-none mb-1">{value}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );
}

function ContactItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 group/item">
      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover/item:text-orange-600 group-hover/item:bg-orange-50 transition-all">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 leading-none">{label}</p>
        <p className="text-sm font-bold text-slate-700 truncate">{value}</p>
      </div>
    </div>
  );
}
