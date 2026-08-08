'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  Search,
  UserCheck,
  X,
  Trash2,
  Users as UsersIcon,
  Filter,
  Shield,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '@/lib/api';

// Components
import { UserCard } from '@/components/users/UserCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/components/shared/Toast';
import { useSocketContext } from '@/components/SocketProvider';
import { readAdminUser } from '@/lib/admin-auth';

interface UserItem {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: 'CUSTOMER' | 'MERCHANT' | 'ADMIN' | 'STAFF';
  adminPermissions?: string[];
  area?: string | null;
  createdAt: string;
  points?: number;
  tier?: string;
  _count?: { stores: number; coupons: number; favorites: number };
}

type UserRole = UserItem['role'];
type UserPayload = { name: string; phone: string; email: string; area: string; role: UserRole; password?: string; adminPermissions?: string[] };

const permissionLabels: Record<string, string> = {
  'dashboard.view': 'عرض لوحة المتابعة', 'approvals.manage': 'إدارة الموافقات',
  'stores.view': 'عرض المتاجر', 'stores.manage': 'إدارة المتاجر',
  'offers.view': 'عرض العروض', 'offers.manage': 'إدارة العروض',
  'users.view': 'عرض المستخدمين', 'users.manage': 'إدارة المستخدمين',
  'categories.manage': 'إدارة التصنيفات', 'banners.manage': 'إدارة البانرات',
  'coupons.view': 'عرض الكوبونات', 'coupons.manage': 'إدارة الكوبونات',
  'broadcast.send': 'إرسال التنبيهات', 'reports.view': 'عرض التقارير',
  'audit.view': 'عرض سجل العمليات', 'settings.manage': 'إدارة الإعدادات',
  'chat.manage': 'إدارة المحادثات', 'reviews.manage': 'إدارة المحتوى والبلاغات',
  'locations.manage': 'إدارة المدن والمناطق',
  'subscriptions.manage': 'إدارة الباقات والاشتراكات',
};

function apiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    if (typeof response?.data?.message === 'string') return response.data.message;
  }
  return fallback;
}

export default function UsersPage() {
  const currentAdmin = useMemo(() => readAdminUser(), []);
  const queryClient = useQueryClient();
  const { socket } = useSocketContext();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [isUpsertOpen, setIsUpsertOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    area: '',
    role: 'CUSTOMER' as UserRole,
    password: '',
    adminPermissions: [] as string[],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [adminRoleConfirm, setAdminRoleConfirm] = useState(false);

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
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    };
    socket.on('admin_notification', handler);
    return () => { socket.off('admin_notification', handler); };
  }, [socket, queryClient]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-users', debouncedSearch, roleFilter, page],
    queryFn: async () => {
      const response = await adminApi().get('/admin/users', {
        params: {
          search: debouncedSearch || undefined,
          role: roleFilter || undefined,
          page,
          limit: 20,
        },
      });
      if (!Array.isArray(response.data?.items)) throw new Error('Invalid response');
      return response.data as { items: UserItem[]; meta: { total: number; lastPage: number; summary?: { customer: number; merchant: number; admin: number } } };
    },
    retry: 1,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi().delete(`/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showToast('تم حذف المستخدم بنجاح');
      setDeleteModal(null);
    },
    onSettled: () => setMutatingId(null),
  });

  const upsertMutation = useMutation({
    mutationFn: (data: UserPayload) => {
      // تنظيف البيانات: حذف الباسورد إذا كان فارغاً في وضع التعديل
      const payload = { ...data };
      if (editingUser && !payload.password) {
        delete payload.password;
      }

      return editingUser
        ? adminApi().patch(`/admin/users/${editingUser.id}`, payload)
        : adminApi().post('/admin/users', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showToast(editingUser ? 'تم تحديث البيانات بنجاح' : 'تم إضافة المستخدم بنجاح');
      setIsUpsertOpen(false);
      setEditingUser(null);
    },
    onError: (error: unknown) => {
      showToast(apiErrorMessage(error, 'حدث خطأ ما'), 'error');
    }
  });

  const permissionsQuery = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: async () => (await adminApi().get<{ items: string[] }>('/admin/permissions')).data.items,
    enabled: currentAdmin?.role === 'ADMIN',
    staleTime: Infinity,
  });

  const openUpsert = (user?: UserItem) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        phone: user.phone,
        email: user.email || '',
        area: user.area || '',
        role: user.role,
        password: '',
        adminPermissions: user.adminPermissions ?? [],
      });
    } else {
      setEditingUser(null);
      setFormData({ name: '', phone: '', email: '', area: '', role: 'CUSTOMER', password: '', adminPermissions: [] });
    }
    setFormErrors({});
    setIsUpsertOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'الاسم مطلوب';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'الاسم يجب أن يكون 3 أحرف على الأقل';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'رقم الهاتف مطلوب';
    } else if (!/^[0-9]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'رقم الهاتف يجب أن يكون 10 أرقام على الأقل';
    }

    if (formData.email && formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'البريد الإلكتروني غير صالح';
    }

    if (!editingUser && !formData.password.trim()) {
      errors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const users = data?.items ?? [];

  return (
    <div className="space-y-5 p-6 lg:p-10">

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader 
          title="إدارة المستخدمين" 
          description="عرض وتعديل بيانات العملاء والتجار وصلاحياتهم في المنصة" 
          icon={UsersIcon}
        />
        <button 
          onClick={() => openUpsert()}
          className="h-10 px-4 rounded-lg bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition-all flex items-center gap-2 shrink-0"
        >
          <UserCheck size={18} /> إضافة مستخدم جديد
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'الإجمالي', value: data?.meta.total ?? 0 },
          { label: 'العملاء', value: data?.meta.summary?.customer ?? 0 },
          { label: 'التجار', value: data?.meta.summary?.merchant ?? 0 },
          { label: 'المديرون', value: data?.meta.summary?.admin ?? 0 },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5">
            <span className="text-[10px] font-bold text-slate-500">{item.label}</span>
            <b className="text-base font-black text-slate-900">{item.value}</b>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full lg:max-w-md group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-600 transition-colors" size={18} />
          <input
            type="text"
            placeholder="بحث عن مستخدم بالاسم، الهاتف، أو الإيميل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 w-full pr-12 pl-4 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:outline-none focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5 transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full lg:w-auto">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-slate-400 shrink-0">
             <Filter size={14} />
             <span className="text-xs font-bold uppercase tracking-widest">تصفية:</span>
          </div>
          <select 
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="h-10 flex-1 lg:w-40 px-2 bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="">كل الصلاحيات</option>
            <option value="CUSTOMER">العملاء</option>
            <option value="MERCHANT">التجار</option>
            <option value="ADMIN">المدراء</option>
            <option value="STAFF">فريق الإدارة</option>
          </select>
        </div>
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
          <AlertTriangle size={48} className="mb-4 opacity-20 text-rose-500" />
          <p className="text-lg font-bold text-slate-500 mt-4">فشل تحميل البيانات</p>
          <button onClick={() => refetch()} className="mt-6 h-12 px-6 rounded-xl bg-orange-600 text-white text-sm font-bold hover:bg-orange-700 transition-all flex items-center gap-2 shadow-lg">
            <RefreshCw size={18} /> إعادة المحاولة
          </button>
        </div>
      ) : isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse bg-white rounded-xl border border-slate-100 shadow-sm" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
          <UsersIcon size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-bold">لا يوجد مستخدمون مطابقون</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {users.map((user) => (
            <UserCard 
              key={user.id} 
              user={user} 
              onEdit={(u) => openUpsert(u)}
              onDelete={(u) => setDeleteModal({ id: u.id, name: u.name })}
            />
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

      {/* Delete Confirmation Modal (Professional) */}
      <AnimatePresence>
        {deleteModal && (
          <div className="admin-modal-overlay fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-[2rem] bg-white p-10 shadow-2xl text-center relative overflow-hidden border border-slate-100">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-rose-50 text-rose-600 mb-6 border border-rose-100">
                 <Trash2 size={36} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">تأكيد الحذف النهائي</h3>
              <p className="mt-4 text-sm font-medium text-slate-500 leading-relaxed px-2">أنت على وشك حذف حساب &quot;{deleteModal.name}&quot; بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.</p>
              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => { setMutatingId(deleteModal.id); deleteMutation.mutate(deleteModal.id); }} 
                  disabled={!!mutatingId} 
                  className="flex-[2] h-12 rounded-xl bg-rose-600 text-sm font-bold text-white shadow-lg shadow-rose-900/10 transition-all hover:bg-rose-700 disabled:opacity-50"
                >
                  {mutatingId === deleteModal.id ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'تأكيد الحذف'}
                </button>
                <button onClick={() => setDeleteModal(null)} className="flex-1 h-12 rounded-xl bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all">إلغاء</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADMIN Role Confirmation Modal */}
      <AnimatePresence>
        {adminRoleConfirm && (
          <div className="admin-modal-overlay fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-amber-50 text-amber-600 mb-6 border border-amber-100">
                <Shield size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">تعيين صلاحية مدير؟</h3>
              <p className="mt-3 text-sm font-medium text-slate-500 leading-relaxed">أنت على وشك منح صلاحيات مدير النظام الكاملة لـ &quot;{formData.name}&quot;. هذا الإجراء يمنح وصولاً كاملاً للوحة التحكم.</p>
              <div className="mt-8 flex gap-4">
                <button onClick={() => { setAdminRoleConfirm(false); upsertMutation.mutate(formData); }} disabled={upsertMutation.isPending} className="flex-1 h-12 rounded-xl bg-amber-600 text-sm font-bold text-white hover:bg-amber-700 transition-all shadow-lg disabled:opacity-50">
                  {upsertMutation.isPending ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'نعم، تأكيد'}
                </button>
                <button onClick={() => setAdminRoleConfirm(false)} className="flex-1 h-12 rounded-xl bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all">إلغاء</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create/Edit User Modal */}
      <AnimatePresence>
        {isUpsertOpen && (
          <div className="admin-modal-overlay fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-cairo">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-lg rounded-[2.5rem] bg-white p-10 shadow-2xl relative border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{editingUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Zag Offers Administration</p>
                </div>
                <button onClick={() => setIsUpsertOpen(false)} className="rounded-xl bg-slate-50 p-3 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-100"><X size={20} /></button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (!validateForm()) return;
                if (formData.role === 'ADMIN' && (!editingUser || editingUser.role !== 'ADMIN')) {
                  setAdminRoleConfirm(true);
                  return;
                }
                upsertMutation.mutate(formData);
              }} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">الاسم الكامل</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`h-12 w-full rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-900 border ${formErrors.name ? 'border-rose-500' : 'border-slate-100'} focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all`} />
                    {formErrors.name && <p className="text-xs text-rose-600">{formErrors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">رقم الهاتف</label>
                    <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={`h-12 w-full rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-900 border ${formErrors.phone ? 'border-rose-500' : 'border-slate-100'} focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all font-outfit`} />
                    {formErrors.phone && <p className="text-xs text-rose-600">{formErrors.phone}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">البريد الإلكتروني (اختياري)</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={`h-12 w-full rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-900 border ${formErrors.email ? 'border-rose-500' : 'border-slate-100'} focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all font-outfit`} />
                  {formErrors.email && <p className="text-xs text-rose-600">{formErrors.email}</p>}
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">المنطقة</label>
                    <input value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="h-12 w-full rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-900 border border-slate-100 focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">الصلاحية</label>
                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})} className="h-12 w-full rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-900 border border-slate-100 focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all cursor-pointer">
                      <option value="CUSTOMER">عميل</option>
                      <option value="MERCHANT">تاجر</option>
                      <option value="ADMIN">مدير نظام</option>
                      {currentAdmin?.role === 'ADMIN' && <option value="STAFF">موظف بصلاحيات محددة</option>}
                    </select>
                  </div>
                </div>

                {formData.role === 'STAFF' && currentAdmin?.role === 'ADMIN' && (
                  <fieldset className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <legend className="px-2 text-xs font-black text-slate-700">صلاحيات موظف الإدارة</legend>
                    <div className="mt-2 grid max-h-52 gap-2 overflow-y-auto sm:grid-cols-2">
                      {(permissionsQuery.data ?? []).map(permission => (
                        <label key={permission} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600">
                          <input type="checkbox" checked={formData.adminPermissions.includes(permission)} onChange={e => setFormData(current => ({ ...current, adminPermissions: e.target.checked ? [...current.adminPermissions, permission] : current.adminPermissions.filter(item => item !== permission) }))} className="h-4 w-4 accent-orange-600" />
                          {permissionLabels[permission] ?? permission}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">
                    {editingUser ? 'كلمة المرور الجديدة (اختياري)' : 'كلمة المرور'}
                  </label>
                  <input 
                    type="password" 
                    required={!editingUser}
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    placeholder={editingUser ? "اتركها فارغة لعدم التغيير" : "أدخل كلمة المرور"}
                    className={`h-12 w-full rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-900 border ${formErrors.password ? 'border-rose-500' : 'border-slate-100'} focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all`} 
                  />
                  {formErrors.password && <p className="text-xs text-rose-600">{formErrors.password}</p>}
                </div>

                <button 
                  type="submit" 
                  disabled={upsertMutation.isPending}
                  className="w-full h-14 rounded-2xl bg-orange-600 text-white font-bold text-sm shadow-xl shadow-orange-900/10 hover:bg-orange-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
                >
                  {upsertMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : (editingUser ? 'تحديث البيانات' : 'إنشاء المستخدم')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
