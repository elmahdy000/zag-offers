'use client';

import { type ComponentType, useState } from 'react';
import {
  AnimatePresence,
  motion,
} from 'framer-motion';
import {
  Grid2X2,
  LayoutGrid,
  ListFilter,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TicketPercent,
  Users2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';

const menuItems = [
  { name: 'نظرة عامة', icon: Grid2X2, href: '/dashboard' },
  { name: 'مركز الموافقات', icon: ShieldCheck, href: '/dashboard/approvals' },
  { name: 'المحادثات والدعم', icon: MessageSquare, href: '/dashboard/chat' },
  { name: 'إدارة المتاجر', icon: ShoppingBag, href: '/dashboard/merchants' },
  { name: 'إدارة العروض', icon: Sparkles, href: '/dashboard/offers' },
  { name: 'إدارة التصنيفات', icon: ListFilter, href: '/dashboard/categories' },
  { name: 'قائمة الكوبونات', icon: TicketPercent, href: '/dashboard/coupons' },
  { name: 'إدارة المستخدمين', icon: Users2, href: '/dashboard/users' },
  { name: 'إرسال تنبيهات عامة', icon: Megaphone, href: '/dashboard/broadcast' },
  { name: 'سجل العمليات', icon: ListFilter, href: '/dashboard/audit-logs' },
  { name: 'إعدادات المنصة', icon: Settings, href: '/dashboard/settings' },
] as const;

async function fetchPendingCount() {
  try {
    const [storesResult, offersResult] = await Promise.allSettled([
      adminApi().get<unknown[]>('/admin/stores/pending'),
      adminApi().get<unknown[]>('/admin/offers/pending'),
    ]);
    const storesCount =
      storesResult.status === 'fulfilled' ? storesResult.value.data.length : 0;
    const offersCount =
      offersResult.status === 'fulfilled' ? offersResult.value.data.length : 0;
    return storesCount + offersCount;
  } catch {
    return 0;
  }
}

type SidebarContentProps = {
  isActive: (href: string) => boolean;
  onNavigate: () => void;
  pendingCount: number;
  onLogout: () => void;
};

function SidebarContent({
  isActive,
  onNavigate,
  pendingCount,
  onLogout,
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col bg-white border-l border-slate-200">
      <div className="flex items-center gap-4 px-8 py-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-200 ring-4 ring-orange-50">
          <LayoutGrid size={24} />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold text-slate-900 tracking-tight leading-none">
            ZAG <span className="text-orange-600">OFFERS</span>
          </span>
          <span className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-[0.2em]">
            إدارة المنصة المركزية
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-5 overflow-y-auto custom-scrollbar pb-6">
        {menuItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon as ComponentType<{
            size?: number;
            className?: string;
          }>;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`group flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                active
                  ? 'bg-orange-600 text-white shadow-xl shadow-orange-100 ring-1 ring-orange-700/5'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon
                size={18}
                className={
                  active
                    ? 'text-white'
                    : 'text-slate-400 group-hover:text-orange-600 transition-colors'
                }
              />
              <span className="flex-1">{item.name}</span>
              {item.href === '/dashboard/approvals' && pendingCount > 0 && (
                <span
                  className={`flex h-5 min-w-[20px] items-center justify-center rounded-lg px-1.5 text-[10px] font-bold shadow-sm ${
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-orange-100 text-orange-600'
                  }`}
                >
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-100 p-6 space-y-3">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3 mb-2">
          <div className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
            <Settings size={18} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-900">حساب المسؤول</p>
            <p className="text-[9px] font-medium text-slate-400">
              الإعدادات العامة
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 transition-all hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100"
        >
          <LogOut size={18} />
          <span>تسجيل الخروج الآمن</span>
        </button>
      </div>
    </div>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const { data: pendingCount = 0 } = useQuery<number>({
    queryKey: ['pending-count'],
    queryFn: fetchPendingCount,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const handleLogout = () => {
    document.cookie =
      'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
    sessionStorage.removeItem('admin_user');
    router.replace('/login');
  };

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  const sidebarProps = {
    isActive,
    onNavigate: () => setIsOpen(false),
    pendingCount,
    onLogout: handleLogout,
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-xl border border-slate-100 lg:hidden"
      >
        <Menu size={24} />
      </button>

      <aside className="hidden h-screen w-[300px] lg:fixed lg:right-0 lg:top-0 lg:flex shadow-2xl shadow-slate-200/50">
        <SidebarContent {...sidebarProps} />
      </aside>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 z-50 h-screen w-[300px] lg:hidden"
            >
              <SidebarContent {...sidebarProps} />
              <button
                onClick={() => setIsOpen(false)}
                className="absolute left-[-56px] top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-100"
              >
                <X size={24} />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
