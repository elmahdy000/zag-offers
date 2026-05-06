'use client';

import { useEffect, useState } from 'react';
import {
  Loader2,
  Search,
  User,
  UserCheck,
  X,
  Trash2,
  Users as UsersIcon,
  Filter,
  Mail,
  Smartphone,
  MapPin,
  Calendar,
  Shield,
  Briefcase,
  Star,
  Ticket,
  ChevronRight,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '@/lib/api';

// Components
import { UserCard } from '@/components/users/UserCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/components/shared/Toast';

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'CUSTOMER' | 'MERCHANT' | 'ADMIN';
  area?: string;
  createdAt: string;
}

interface UserDetails extends UserItem {
  avatar?: string | null;
  stores: {
    id: string;
    name: string;
    status: string;
    _count: { offers: number };
  }[];
  coupons: {
    id: string;
    createdAt: string;
    status: string;
    offer: { title: string };
  }[];
  _count: { stores: number; coupons: number; favorites: number; reviews: number };
}

function DetailItem({ label, value, icon: Icon, colorClass = "text-slate-900" }: { label: string; value: string; icon?: any, colorClass?: string }) {
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

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'stores' | 'coupons'>('info');
  const [isUpsertOpen, setIsUpsertOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    area: '',
    role: 'CUSTOMER' as any,
    password: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', debouncedSearch, roleFilter, page],
    queryFn: async () => {
      const response = await adminApi().get('/admin/users', {
        params: {
          search: debouncedSearch || undefined,
          role: roleFilter || undefined,
          page,
          limit: 12,
        },
      });
      return response.data as { items: UserItem[]; meta: { total: number; lastPage: number } };
    },
  });

  const { data: userDetails, isLoading: userDetailsLoading } = useQuery({
    queryKey: ['admin-user-details', selectedUserId],
    queryFn: async () => {
      const response = await adminApi().get<UserDetails>(`/admin/users/${selectedUserId}`);
      return response.data;
    },
    enabled: !!selectedUserId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi().delete(`/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showToast('تم حذف المستخدم بنجاح');
      setDeleteModal(null);
      setSelectedUserId(null);
    },
    onSettled: () => setMutatingId(null),
  });

  const upsertMutation = useMutation({
    mutationFn: (data: any) => {
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
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'حدث خطأ ما', 'error');
    }
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'CUSTOMER' | 'MERCHANT' }) =>
      adminApi().patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-details', selectedUserId] });
      showToast('تم تحديث صلاحية المستخدم');
    },
    onSettled: () => setMutatingId(null),
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
        password: ''
      });
    } else {
      setEditingUser(null);
      setFormData({ name: '', phone: '', email: '', area: '', role: 'CUSTOMER', password: '' });
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
    <div className="p-6 lg:p-10 space-y-8">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <PageHeader 
          title="إدارة المستخدمين" 
          description="عرض وتعديل بيانات العملاء والتجار وصلاحياتهم في المنصة" 
          icon={UsersIcon}
        />
        <button 
          onClick={() => openUpsert()}
          className="h-[48px] px-6 rounded-xl bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-900/10 hover:bg-orange-700 transition-all flex items-center gap-2 shrink-0"
        >
          <UserCheck size={18} /> إضافة مستخدم جديد
        </button>
      </div>

      {/* Filters Area */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative lg:col-span-3">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="ابحث بالاسم، الموبايل، أو البريد..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-[48px] w-full rounded-xl border border-slate-200 bg-white pr-11 pl-4 text-sm font-medium shadow-sm focus:border-orange-500 focus:outline-none transition-all"
          />
        </div>
        <select 
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="h-[48px] rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium focus:outline-none shadow-sm cursor-pointer"
        >
          <option value="">كل الصلاحيات</option>
          <option value="CUSTOMER">العملاء فقط</option>
          <option value="MERCHANT">التجار فقط</option>
          <option value="ADMIN">المدراء فقط</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse bg-white rounded-2xl border border-slate-100 shadow-sm" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
          <UsersIcon size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-bold">لا يوجد مستخدمون مطابقون</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

      {/* User Details Modal (Comprehensive) */}
      <AnimatePresence>
      </AnimatePresence>

      {/* Delete Confirmation Modal (Professional) */}
      <AnimatePresence>
        {deleteModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-[2rem] bg-white p-10 shadow-2xl text-center relative overflow-hidden border border-slate-100">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-rose-50 text-rose-600 mb-6 border border-rose-100">
                 <Trash2 size={36} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">تأكيد الحذف النهائي</h3>
              <p className="mt-4 text-sm font-medium text-slate-500 leading-relaxed px-2">أنت على وشك حذف حساب "{deleteModal.name}" بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.</p>
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

      {/* Create/Edit User Modal */}
      <AnimatePresence>
        {isUpsertOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-cairo">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-lg rounded-[2.5rem] bg-white p-10 shadow-2xl relative border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{editingUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Zag Offers Administration</p>
                </div>
                <button onClick={() => setIsUpsertOpen(false)} className="rounded-xl bg-slate-50 p-3 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-100"><X size={20} /></button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); if (validateForm()) upsertMutation.mutate(formData); }} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">الاسم الكامل</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`h-12 w-full rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-900 border ${formErrors.name ? 'border-rose-500' : 'border-slate-100'} focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all`} />
                    {formErrors.name && <p className="text-xs text-rose-600">{formErrors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">رقم الهاتف</label>
                    <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={`h-12 w-full rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-900 border ${formErrors.phone ? 'border-rose-500' : 'border-slate-100'} focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all font-outfit`} />
                    {formErrors.phone && <p className="text-xs text-rose-600">{formErrors.phone}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">البريد الإلكتروني (اختياري)</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={`h-12 w-full rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-900 border ${formErrors.email ? 'border-rose-500' : 'border-slate-100'} focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all font-outfit`} />
                  {formErrors.email && <p className="text-xs text-rose-600">{formErrors.email}</p>}
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">المنطقة</label>
                    <input value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="h-12 w-full rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-900 border border-slate-100 focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">الصلاحية</label>
                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className="h-12 w-full rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-900 border border-slate-100 focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all cursor-pointer">
                      <option value="CUSTOMER">عميل</option>
                      <option value="MERCHANT">تاجر</option>
                      <option value="ADMIN">مدير نظام</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">
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
