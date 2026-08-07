'use client';

import { useState } from 'react';
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
  ShoppingBag,
  Store,
  Tags,
  TicketPercent,
  Users,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const primaryItems = [
  { icon: LayoutDashboard, label: 'الرئيسية', path: '/dashboard' },
  { icon: ShieldCheck, label: 'الموافقات', path: '/dashboard/approvals' },
  { icon: Store, label: 'المتاجر', path: '/dashboard/stores' },
  { icon: Users, label: 'المستخدمون', path: '/dashboard/users' },
] as const;

const moreItems = [
  { icon: ShoppingBag, label: 'التجار', path: '/dashboard/merchants' },
  { icon: Tags, label: 'العروض', path: '/dashboard/offers' },
  { icon: ListFilter, label: 'التصنيفات', path: '/dashboard/categories' },
  { icon: ImageIcon, label: 'البانرات', path: '/dashboard/banners' },
  { icon: TicketPercent, label: 'الكوبونات', path: '/dashboard/coupons' },
  { icon: MessageSquare, label: 'المحادثات', path: '/dashboard/chat' },
  { icon: Megaphone, label: 'التنبيهات', path: '/dashboard/broadcast' },
  { icon: BarChart3, label: 'التقارير', path: '/dashboard/reports' },
  { icon: Grid2X2, label: 'سجل العمليات', path: '/dashboard/audit-logs' },
  { icon: Settings, label: 'الإعدادات', path: '/dashboard/settings' },
] as const;

function routeIsActive(pathname: string, path: string) {
  return path === '/dashboard' ? pathname === path : pathname.startsWith(path);
}

export default function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreIsActive = moreItems.some((item) => routeIsActive(pathname, item.path));

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
                {moreItems.map((item) => {
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
          {primaryItems.map((item) => {
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
