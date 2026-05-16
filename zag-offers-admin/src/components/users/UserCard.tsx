import React from 'react';
import {
  User,
  Mail,
  Smartphone,
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
  createdAt?: string;
}

const roleStyles: Record<string, { icon: any; color: string; bg: string; border: string; label: string }> = {
  ADMIN: { icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', label: 'مدير نظام' },
  MERCHANT: { icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', label: 'تاجر' },
  CUSTOMER: { icon: Star, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', label: 'عميل' },
};

interface UserCardProps {
  user: UserItem;
  onEdit: (user: any) => void;
  onDelete: (user: any) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onEdit, onDelete }) => {
  const role = roleStyles[user.role] || roleStyles.CUSTOMER;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-xl hover:shadow-orange-50 hover:border-orange-100 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-100 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-inner">
          <User size={20} />
        </div>
        <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${role.bg} ${role.color} ${role.border}`}>
          {role.label}
        </span>
      </div>

      <div className="flex-1">
        <h3 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors truncate leading-tight">
          {user.name}
        </h3>
        <p className="mt-1.5 text-xs font-bold text-slate-500 font-outfit">{user.phone}</p>

        <div className="mt-5 space-y-2">
          {user.email && (
            <div className="flex items-center gap-2.5 text-xs font-medium text-slate-500">
              <Mail size={14} className="text-slate-300 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2.5 text-xs font-medium text-slate-500">
            <MapPin size={14} className="text-slate-300 shrink-0" />
            <span className="truncate">{user.area || 'غير محدد'}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
        <div className="flex gap-2">
          {user.role === 'MERCHANT' && (
            <button
              onClick={(e) => { 
                e.stopPropagation(); 
                window.location.href = `/dashboard/stores?ownerId=${user.id}&openCreate=true`;
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white transition-all shadow-sm border border-orange-100"
              title="إضافة متجر"
            >
              <PlusCircle size={16} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(user); }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-slate-100"
            title="تعديل"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(user); }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-100"
            title="حذف"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <Link
          href={`/dashboard/users/${user.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm border border-orange-100"
        >
          <ChevronRight size={18} className="rotate-180" />
        </Link>
      </div>
    </motion.div>
  );
};
