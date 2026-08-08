'use client';

import { type ComponentType, useMemo, useState } from 'react';
import {
  AnimatePresence,
  motion,
} from 'framer-motion';
import {
  Grid2X2,
  BarChart3,
  ListFilter,
  LogOut,
  Megaphone,
  MessageSquare,
  Image as ImageIcon,
  Menu,
  Settings,
  ShieldCheck,
  Sparkles,
  TicketPercent,
  Users2,
  X,
  MapPinned,
  MessageSquareWarning,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import AdminThemeToggle from '@/components/AdminThemeToggle';
import { ADMIN_PERMISSIONS as P, canAccess, readAdminUser, type AdminPermission } from '@/lib/admin-auth';

const menuItems = [
  { name: 'نظرة عامة', icon: Grid2X2, href: '/dashboard', permission: P.DASHBOARD_VIEW },
  { name: 'مركز الموافقات', icon: ShieldCheck, href: '/dashboard/approvals', permission: P.APPROVALS_MANAGE },
  { name: 'إدارة التجار', icon: Users2, href: '/dashboard/merchants', permission: P.STORES_VIEW },
  { name: 'إدارة العروض', icon: Sparkles, href: '/dashboard/offers', permission: P.OFFERS_VIEW },
  { name: 'إدارة التصنيفات', icon: ListFilter, href: '/dashboard/categories', permission: P.CATEGORIES_MANAGE },
  { name: 'إدارة البانرات', icon: ImageIcon, href: '/dashboard/banners', permission: P.BANNERS_MANAGE },
  { name: 'قائمة الكوبونات', icon: TicketPercent, href: '/dashboard/coupons', permission: P.COUPONS_VIEW },
  { name: 'إدارة المستخدمين', icon: Users2, href: '/dashboard/users', permission: P.USERS_VIEW },
  { name: 'إرسال تنبيهات عامة', icon: Megaphone, href: '/dashboard/broadcast', permission: P.BROADCAST_SEND },
  { name: 'مركز المحادثات', icon: MessageSquare, href: '/dashboard/chat', permission: P.CHAT_MANAGE },
  { name: 'التقارير والإحصائيات', icon: BarChart3, href: '/dashboard/reports', permission: P.REPORTS_VIEW },
  { name: 'سجل العمليات', icon: ListFilter, href: '/dashboard/audit-logs', permission: P.AUDIT_VIEW },
  { name: 'المحتوى والبلاغات', icon: MessageSquareWarning, href: '/dashboard/moderation', permission: P.REVIEWS_MANAGE },
  { name: 'المدن والمناطق', icon: MapPinned, href: '/dashboard/locations', permission: P.LOCATIONS_MANAGE },
  { name: 'الباقات والاشتراكات', icon: CreditCard, href: '/dashboard/subscriptions', permission: P.SUBSCRIPTIONS_MANAGE },
  { name: 'إعدادات المنصة', icon: Settings, href: '/dashboard/settings', permission: P.SETTINGS_MANAGE },
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
  allowedItems: ReadonlyArray<(typeof menuItems)[number]>;
};

function SidebarContent({
  isActive,
  onNavigate,
  pendingCount,
  onLogout,
  allowedItems,
}: SidebarContentProps) {
  return (
    <div className="admin-sidebar-panel flex h-full flex-col">
      <div className="admin-sidebar-brand flex items-center gap-3 px-5 py-5">
        <div className="admin-brand-mark relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl">
          <Image src="/brand/zag-mark.png" alt="" fill priority className="object-contain" sizes="48px" />
        </div>
        <div className="flex flex-col">
          <span className="admin-brand-title text-lg font-bold leading-normal">
            Zag <span>Offers</span>
          </span>
          <span className="admin-brand-subtitle mt-1 text-[10px] font-semibold">
            إدارة المنصة المركزية
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 overflow-y-auto custom-scrollbar py-5">
        <p className="admin-nav-kicker px-3 pb-2 text-[11px] font-semibold">إدارة المنصة</p>
        {allowedItems.map((item) => {
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
              className={`admin-nav-link group ${active ? 'is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="admin-nav-icon"><Icon size={18} /></span>
              <span className="flex-1">{item.name}</span>
              {item.href === '/dashboard/approvals' && pendingCount > 0 && (
                <span
                  className={`flex h-5 min-w-[20px] items-center justify-center rounded-lg px-1.5 text-xs font-bold shadow-sm ${
                    active ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'
                  }`}
                >
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer mt-auto p-4 space-y-2">
        <div className="admin-account-card p-3 rounded-2xl flex items-center gap-3">
          <div className="admin-account-icon h-9 w-9 rounded-xl flex items-center justify-center">
            <Settings size={18} />
          </div>
          <div>
            <p className="admin-account-title text-[11px] font-bold">المدير العام</p>
            <p className="admin-account-copy text-[9px] font-bold">
              الإعدادات العامة
            </p>
          </div>
        </div>
        <AdminThemeToggle />
        <button
          onClick={onLogout}
          className="admin-logout"
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
  const adminUser = useMemo(() => readAdminUser(), []);
  const allowedItems = useMemo(
    () => menuItems.filter((item) => canAccess(adminUser, item.permission as AdminPermission)),
    [adminUser],
  );

  const { data: pendingCount = 0 } = useQuery<number>({
    queryKey: ['pending-count'],
    queryFn: fetchPendingCount,
    staleTime: 30000,
    enabled: canAccess(adminUser, P.APPROVALS_MANAGE),
  });

  const handleLogout = async () => {
    try { await adminApi().post('/auth/logout'); } catch { /* Keep local logout available offline. */ }
    sessionStorage.removeItem('admin_user');
    localStorage.removeItem('admin_user');
    router.replace('/login');
  };

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  const sidebarProps = {
    isActive,
    onNavigate: () => setIsOpen(false),
    pendingCount,
    onLogout: handleLogout,
    allowedItems,
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="admin-menu-button fixed top-4 right-4 z-40 flex items-center justify-center lg:hidden"
        aria-label="فتح القائمة"
      >
        <Menu size={24} />
      </button>

      <aside className="hidden h-screen w-[272px] lg:fixed lg:right-0 lg:top-0 lg:flex">
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
              className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 z-50 h-screen w-[292px] p-3 lg:hidden"
            >
              <SidebarContent {...sidebarProps} />
              <button
                onClick={() => setIsOpen(false)}
                className="admin-menu-button absolute left-[-52px] top-4 flex items-center justify-center"
                aria-label="إغلاق القائمة"
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
