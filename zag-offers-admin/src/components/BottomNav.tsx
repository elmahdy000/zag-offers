'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Grid2X2,
  Image as ImageIcon,
  LayoutDashboard,
  ListFilter,
  Megaphone,
  MessageSquare,
  MoreHorizontal,
  Settings,
  ShieldCheck,
  Tags,
  TicketPercent,
  Users,
  X,
  MapPinned,
  MessageSquareWarning,
  CreditCard,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ADMIN_PERMISSIONS as P, canAccess, readAdminUser, type AdminPermission } from '@/lib/admin-auth';

const primaryItems = [
  { icon: LayoutDashboard, label: 'الرئيسية', path: '/dashboard', permission: P.DASHBOARD_VIEW },
  { icon: ShieldCheck, label: 'الموافقات', path: '/dashboard/approvals', permission: P.APPROVALS_MANAGE },
  { icon: Users, label: 'التجار', path: '/dashboard/merchants', permission: P.STORES_VIEW },
  { icon: Users, label: 'المستخدمون', path: '/dashboard/users', permission: P.USERS_VIEW },
] as const;

const moreItems = [
  { icon: Tags, label: 'العروض', path: '/dashboard/offers', permission: P.OFFERS_VIEW },
  { icon: ListFilter, label: 'التصنيفات', path: '/dashboard/categories', permission: P.CATEGORIES_MANAGE },
  { icon: ImageIcon, label: 'البانرات', path: '/dashboard/banners', permission: P.BANNERS_MANAGE },
  { icon: TicketPercent, label: 'الكوبونات', path: '/dashboard/coupons', permission: P.COUPONS_VIEW },
  { icon: MessageSquare, label: 'المحادثات', path: '/dashboard/chat', permission: P.CHAT_MANAGE },
  { icon: Megaphone, label: 'التنبيهات', path: '/dashboard/broadcast', permission: P.BROADCAST_SEND },
  { icon: BarChart3, label: 'التقارير', path: '/dashboard/reports', permission: P.REPORTS_VIEW },
  { icon: Grid2X2, label: 'سجل العمليات', path: '/dashboard/audit-logs', permission: P.AUDIT_VIEW },
  { icon: MessageSquareWarning, label: 'البلاغات', path: '/dashboard/moderation', permission: P.REVIEWS_MANAGE },
  { icon: MapPinned, label: 'المناطق', path: '/dashboard/locations', permission: P.LOCATIONS_MANAGE },
  { icon: CreditCard, label: 'الباقات', path: '/dashboard/subscriptions', permission: P.SUBSCRIPTIONS_MANAGE },
  { icon: Settings, label: 'الإعدادات', path: '/dashboard/settings', permission: P.SETTINGS_MANAGE },
] as const;

function routeIsActive(pathname: string, path: string) {
  return path === '/dashboard' ? pathname === path : pathname.startsWith(path);
}

export default function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const adminUser = useMemo(() => readAdminUser(), []);
  const visiblePrimaryItems = useMemo(
    () => primaryItems.filter((item) => canAccess(adminUser, item.permission as AdminPermission)),
    [adminUser],
  );
  const visibleMoreItems = useMemo(
    () => moreItems.filter((item) => canAccess(adminUser, item.permission as AdminPermission)),
    [adminUser],
  );
  const moreIsActive = visibleMoreItems.some((item) => routeIsActive(pathname, item.path));

  return (
    <>
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.button
              type="button"
              aria-label="إغلاق قائمة الخدمات"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 z-[68] bg-slate-950/55 backdrop-blur-sm lg:hidden"
            />
            <motion.section
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              className="admin-more-sheet fixed inset-x-0 bottom-0 z-[70] rounded-t-[24px] border-t border-slate-200 bg-white px-4 pb-[calc(92px+env(safe-area-inset-bottom))] pt-4 shadow-[0_-24px_70px_rgba(7,20,38,.22)] lg:hidden"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-slate-900">كل خدمات الإدارة</p>
                  <p className="mt-0.5 text-[10px] font-bold text-slate-400">وصول سريع لأدوات تشغيل المنصة</p>
                </div>
                <button type="button" onClick={() => setMoreOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500" aria-label="إغلاق">
                  <X size={18} />
                </button>
              </div>
              <div className="grid max-h-[52vh] grid-cols-3 gap-2 overflow-y-auto pb-2">
                {visibleMoreItems.map((item) => {
                  const active = routeIsActive(pathname, item.path);
                  return (
                    <Link key={item.path} href={item.path} onClick={() => setMoreOpen(false)} className={`flex min-h-[82px] flex-col items-center justify-center gap-2 rounded-2xl border text-[10px] font-black transition-colors ${active ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                      <item.icon size={20} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>

      <nav className="admin-mobile-dock fixed inset-x-0 bottom-0 z-[72] lg:hidden" aria-label="التنقل الرئيسي للموبايل">
        <div className="admin-mobile-dock-inner grid grid-cols-5 border-t border-slate-200 bg-white px-2 pb-[max(7px,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-10px_35px_rgba(7,20,38,.1)]">
          {visiblePrimaryItems.map((item) => {
            const active = routeIsActive(pathname, item.path);
            return (
              <Link key={item.path} href={item.path} className={`admin-dock-item ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined}>
                <span className="admin-dock-icon"><item.icon size={20} strokeWidth={active ? 2.5 : 2} /></span>
                <span className="admin-dock-label">{item.label}</span>
              </Link>
            );
          })}
          <button type="button" onClick={() => setMoreOpen((open) => !open)} className={`admin-dock-item ${moreIsActive || moreOpen ? 'is-active' : ''}`} aria-expanded={moreOpen}>
            <span className="admin-dock-icon"><MoreHorizontal size={21} /></span>
            <span className="admin-dock-label">المزيد</span>
          </button>
        </div>
      </nav>
    </>
  );
}
