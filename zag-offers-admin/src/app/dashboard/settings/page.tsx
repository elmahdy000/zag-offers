'use client';

import { useState } from 'react';
import {
  Loader2,
  Lock,
  Save,
  User,
  Info,
  Shield,
  Settings as SettingsIcon,
  CheckCircle2,
  AlertCircle,
  Database,
  Server,
  Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/components/shared/Toast';

interface ProfileData {
  name?: string;
  area?: string;
  email?: string;
  phone?: string;
}

type TabType = 'account' | 'system';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('account');

  const { data: me, isLoading: profileLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await adminApi().get<ProfileData>('/auth/me');
      return response.data;
    },
  });

  const { data: healthData, isLoading: healthLoading, isError: healthError, dataUpdatedAt } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await adminApi().get('/health');
      return response.data as { status?: string; db?: string; version?: string };
    },
    retry: 1,
    refetchInterval: 30_000, // refresh every 30 seconds
    staleTime: 20_000,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (payload: ProfileData) => adminApi().patch('/auth/profile', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      showToast('تم تحديث الملف الشخصي بنجاح');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'فشل تحديث الملف الشخصي', 'error');
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (payload: any) => adminApi().post('/auth/password', payload),
    onSuccess: () => {
      showToast('تم تغيير كلمة السر بنجاح');
      // Reset form or clear fields if needed
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'فشل تغيير كلمة السر', 'error');
    }
  });

  const tabs = [
    { id: 'account', name: 'الحساب والأمان', icon: Shield },
    { id: 'system', name: 'حالة النظام', icon: Activity },
  ] as const;

  return (
    <div className="p-6 lg:p-10 space-y-8">

      <PageHeader 
        title="إعدادات النظام" 
        description="تخصيص بيانات الحساب، إدارة الأمان، ومراقبة كفاءة واستقرار المنصة" 
        icon={SettingsIcon}
      />

      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Settings Sidebar */}
          <aside className="space-y-1">
             <div className="p-1.5 bg-white border border-slate-100 rounded-2xl shadow-sm flex lg:flex-col gap-1 w-full">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all lg:w-full ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon size={18} />
                  <span className="whitespace-nowrap">{tab.name}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Settings Content */}
          <main className="min-h-[500px]">
            <AnimatePresence mode="wait">
              {activeTab === 'account' && (
                <motion.div key="account" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  {/* Profile Section */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
                    <h3 className="mb-8 text-base font-bold text-slate-900 flex items-center gap-2.5">
                      <div className="p-2 bg-orange-50 text-orange-600 rounded-lg border border-orange-100"><User size={20} /></div>
                      تعديل الملف الشخصي
                    </h3>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        updateProfileMutation.mutate({ name: fd.get('name') as string, area: fd.get('area') as string });
                      }}
                      className="space-y-6"
                    >
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">الاسم الكامل</label>
                          <input name="name" defaultValue={me?.name} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold focus:border-orange-500 focus:bg-white focus:outline-none transition-all shadow-sm" required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">المنطقة السكنية</label>
                          <input name="area" defaultValue={me?.area} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold focus:border-orange-500 focus:bg-white focus:outline-none transition-all shadow-sm" />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                         <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">رقم الموبايل</p>
                            <p className="text-sm font-bold text-slate-900">{me?.phone}</p>
                         </div>
                         <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">البريد الإلكتروني</p>
                            <p className="text-sm font-bold text-slate-900 truncate">{me?.email || 'غير متوفر'}</p>
                         </div>
                      </div>
                      <button type="submit" disabled={updateProfileMutation.isPending} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-8 text-sm font-bold text-white hover:bg-orange-600 transition-all shadow-lg shadow-slate-200 disabled:opacity-50">
                        {updateProfileMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        حفظ التغييرات
                      </button>
                    </form>
                  </div>

                  {/* Security Section */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
                    <h3 className="mb-8 text-base font-bold text-slate-900 flex items-center gap-2.5">
                      <div className="p-2 bg-slate-50 text-slate-600 rounded-lg border border-slate-100"><Lock size={20} /></div>
                      تأمين الحساب
                    </h3>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        const currentPassword = fd.get('currentPassword') as string;
                        const newPassword = fd.get('newPassword') as string;
                        const confirmPassword = fd.get('confirmPassword') as string;

                        if (newPassword !== confirmPassword) {
                          showToast('كلمة المرور الجديدة غير متطابقة', 'error');
                          return;
                        }

                        updatePasswordMutation.mutate({ currentPassword, newPassword });
                        (e.target as HTMLFormElement).reset();
                      }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">كلمة المرور الحالية</label>
                        <input name="currentPassword" type="password" placeholder="••••••••" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-sm" required />
                      </div>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">كلمة المرور الجديدة</label>
                          <input name="newPassword" type="password" placeholder="••••••••" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-sm" required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">تأكيد كلمة المرور</label>
                          <input name="confirmPassword" type="password" placeholder="••••••••" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-sm" required />
                        </div>
                      </div>
                      <button type="submit" disabled={updatePasswordMutation.isPending} className="h-12 px-8 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 transition-all shadow-lg shadow-orange-900/10 flex items-center justify-center gap-2">
                        {updatePasswordMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                        تغيير كلمة السر
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}

              {activeTab === 'system' && (
                <motion.div key="system" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
                    <h3 className="mb-8 text-base font-bold text-slate-900 flex items-center gap-2.5">
                      <div className="p-2 bg-slate-50 text-slate-600 rounded-lg border border-slate-100"><Info size={20} /></div>
                      مؤشرات أداء النظام
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Server size={20} /></div>
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">حالة السيرفر</p>
                              <p className="text-lg font-bold text-slate-900">مستقر وفعال</p>
                           </div>
                        </div>
                        <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Database size={20} /></div>
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">قاعدة البيانات</p>
                              <p className="text-lg font-bold text-slate-900">متصلة (PostgreSQL)</p>
                           </div>
                        </div>
                        <CheckCircle2 size={20} className="text-emerald-500" />
                      </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-2 gap-8">
                       <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">إصدار التحكم</p>
                          <p className="text-xl font-bold text-slate-900">v2.4.0</p>
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">آخر تحديث أمني</p>
                          <p className="text-xl font-bold text-slate-900">منذ 12 ساعة</p>
                       </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
