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
    offer: { title: string };
  }[];
  _count: {
    stores: number;
    coupons: number;
    reviews: number;
    favorites: number;
  };
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
                         <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
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
                          <Star size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 mb-1">{coupon.offer.title}</p>
                          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">الكود: {coupon.code}</p>
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
                   onClick={() => { if(confirm('هل أنت متأكد من حذف هذا المستخدم نهائياً؟')) deleteMutation.mutate(); }}
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
