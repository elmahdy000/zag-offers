import React from 'react';
import {
  User,
  Mail,
  MapPin,
  ChevronRight,
  Pencil,
  Trash2,
  Shield,
  Briefcase,
  Star,
  PlusCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface UserItem {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: 'CUSTOMER' | 'MERCHANT' | 'ADMIN';
  area?: string | null;
  createdAt: string;
  points?: number;
  tier?: string;
  _count?: { stores: number; coupons: number; favorites: number };
}

const roleStyles: Record<string, { icon: React.ComponentType<{ size?: number }>; color: string; bg: string; border: string; label: string }> = {
  ADMIN: { icon: Shield, color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200', label: 'مدير' },
  MERCHANT: { icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', label: 'تاجر' },
  CUSTOMER: { icon: Star, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', label: 'عميل' },
};

interface UserCardProps {
  user: UserItem;
  onEdit: (user: UserItem) => void;
  onDelete: (user: UserItem) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onEdit, onDelete }) => {
  const role = roleStyles[user.role] || roleStyles.CUSTOMER;
  const RoleIcon = role.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="group relative flex min-h-[190px] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-orange-200 hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-orange-100 bg-orange-50 text-orange-600">
            <User size={17} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-black text-slate-900">{user.name}</h3>
            <p className="mt-0.5 truncate text-[10px] font-bold text-slate-400" dir="ltr">{user.phone}</p>
          </div>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-1 text-[9px] font-black ${role.bg} ${role.color} ${role.border}`}>
          <RoleIcon size={11} /> {role.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5 border-y border-slate-100 py-3">
        <div className="text-center"><b className="block text-sm font-black text-slate-900">{user._count?.stores ?? 0}</b><span className="text-[8px] font-bold text-slate-400">متجر</span></div>
        <div className="border-x border-slate-100 text-center"><b className="block text-sm font-black text-slate-900">{user._count?.coupons ?? 0}</b><span className="text-[8px] font-bold text-slate-400">كوبون</span></div>
        <div className="text-center"><b className="block text-sm font-black text-slate-900">{user._count?.favorites ?? 0}</b><span className="text-[8px] font-bold text-slate-400">مفضلة</span></div>
      </div>

      <div className="mt-3 flex min-w-0 items-center justify-between gap-2 text-[10px] font-semibold text-slate-500">
        <span className="flex min-w-0 items-center gap-1.5"><MapPin size={12} className="shrink-0 text-slate-400" /><span className="truncate">{user.area || 'غير محدد'}</span></span>
        {user.role === 'CUSTOMER' && (
          <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-black text-slate-600">
            {user.points ?? 0} نقطة
          </span>
        )}
      </div>

      {user.email && (
        <div className="mt-2 flex min-w-0 items-center gap-1.5 text-[10px] font-semibold text-slate-400">
          <Mail size={12} className="shrink-0" /><span className="truncate">{user.email}</span>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-3">
        <div className="flex gap-1.5">
          {user.role === 'MERCHANT' && (
            <button
              onClick={(e) => { 
                e.stopPropagation(); 
                window.location.href = `/dashboard/stores?ownerId=${user.id}&openCreate=true`;
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-orange-100 bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white"
              title="إضافة متجر"
            >
              <PlusCircle size={16} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(user); }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-900 hover:text-white"
            title="تعديل"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(user); }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white"
            title="حذف"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <Link
          href={`/dashboard/users/${user.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[9px] font-black text-slate-600 hover:border-orange-200 hover:text-orange-600"
        >
          التفاصيل <ChevronRight size={14} className="rotate-180" />
        </Link>
      </div>
    </motion.div>
  );
};
