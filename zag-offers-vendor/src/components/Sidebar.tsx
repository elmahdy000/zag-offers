'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  ExternalLink,
  Headphones,
  History,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  ScanLine,
  Settings,
  Store,
  Tag,
  CreditCard,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { deleteCookie, getVendorStoreId, vendorApi } from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import { secureStorage } from '@/lib/crypto';
import BrandMark from './BrandMark';
import ThemeToggle from './ThemeToggle';
import { useNotifications } from './notification-provider';

type VendorNotification = {
  id: string;
  title?: string;
  body?: string;
  isRead?: boolean;
};

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<VendorNotification[]>([]);
  const [showBell, setShowBell] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { socket } = useNotifications();

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications]);
  const storeId = mounted ? getVendorStoreId() || undefined : undefined;

  useEffect(() => {
    if (!mounted) return;
    const fetchNotifications = async () => {
      try {
        const response = await vendorApi().get('/notifications');
        const data: unknown = response.data;
        setNotifications(Array.isArray(data) ? data as VendorNotification[] : []);
      } catch {}
    };
    void fetchNotifications();
  }, [mounted]);

  useEffect(() => {
    if (!socket) return;
    const handleNotification = (data: VendorNotification) => {
      setNotifications((current) => [data, ...current].slice(0, 30));
    };
    socket.on('merchant_notification', handleNotification);
    return () => { socket.off('merchant_notification', handleNotification); };
  }, [socket]);

  const menuItems = [
    { name: 'نظرة عامة', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'الإشعارات', icon: Bell, href: '/dashboard/notifications', badge: unreadCount },
    { name: 'إدارة العروض', icon: Tag, href: '/dashboard/offers' },
    { name: 'سجل الكوبونات', icon: History, href: '/dashboard/coupons' },
    { name: 'مسح الكوبون', icon: ScanLine, href: '/dashboard/scan' },
    { name: 'بيانات المتجر', icon: Store, href: '/dashboard/profile' },
    { name: 'الدعم الفني', icon: MessageSquare, href: '/dashboard/chat' },
    { name: 'الإعدادات', icon: Settings, href: '/dashboard/settings' },
    { name: 'الباقة والاشتراك', icon: CreditCard, href: '/dashboard/subscription' },
  ];

  const handleLogout = async () => {
    try {
      await vendorApi().post('/auth/logout');
    } finally {
      deleteCookie('auth_token'); // Clears legacy host-only cookies; the API clears HttpOnly cookies.
      secureStorage.clear();
      window.location.href = '/login';
    }
  };

  if (!mounted) return null;

  return (
    <aside className="vendor-sidebar h-full w-[286px] lg:m-4 lg:h-[calc(100vh-2rem)] lg:w-[272px]">
      <div className="vendor-sidebar-panel flex h-full flex-col overflow-hidden lg:rounded-[24px]">
        <div className="flex items-center justify-between border-b border-border p-5">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
            <BrandMark priority className="h-12 w-12" />
            <span className="leading-tight">
              <b className="block text-sm font-black text-text">Zag Offers</b>
              <small className="text-[10px] font-bold text-primary">بوابة الشركاء</small>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <button className="icon-button relative" onClick={() => setShowBell((value) => !value)} aria-label="الإشعارات">
              <Bell size={18} />
              {unreadCount > 0 && <span className="notification-dot" />}
            </button>
            {onClose && <button className="icon-button sidebar-mobile-close" onClick={onClose} aria-label="إغلاق القائمة"><X size={18} /></button>}
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
          <p className="px-3 pb-2 text-[9px] font-black tracking-[.16em] text-text-dimmer">إدارة المتجر</p>
          {menuItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
            return (
              <Link key={item.href} href={item.href} onClick={onClose} className={`sidebar-link ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined}>
                <span className="sidebar-icon"><item.icon size={19} /></span>
                <span className="flex-1">{item.name}</span>
                {!!item.badge && <span className="sidebar-badge">{item.badge > 99 ? '99+' : item.badge}</span>}
              </Link>
            );
          })}

          <div className="my-3 border-t border-border" />
          <a href={storeId ? `https://zagoffers.online/stores/${storeId}` : 'https://zagoffers.online'} target="_blank" rel="noreferrer" className="sidebar-link">
            <span className="sidebar-icon"><ExternalLink size={19} /></span><span className="flex-1">معاينة المتجر</span>
          </a>
          <a href="https://wa.me/201091428238" target="_blank" rel="noreferrer" className="sidebar-link">
            <span className="sidebar-icon"><Headphones size={19} /></span><span className="flex-1">تواصل معنا</span>
          </a>
        </nav>

        <div className="space-y-2 border-t border-border p-4">
          <ThemeToggle />
          <button className="sidebar-logout" onClick={handleLogout}><LogOut size={18} /><span>تسجيل الخروج</span></button>
        </div>
      </div>

      <AnimatePresence>
        {showBell && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="notification-popover absolute left-4 right-4 top-20 z-[100] max-h-[70vh] overflow-y-auto rounded-2xl border border-border p-4 shadow-2xl lg:left-auto lg:w-80">
            <div className="mb-3 flex items-center justify-between">
              <b className="text-xs text-text">آخر الإشعارات</b>
              <button className="text-text-dimmer" onClick={() => setShowBell(false)} aria-label="إغلاق"><X size={15} /></button>
            </div>
            {notifications.length === 0 ? (
              <p className="py-8 text-center text-[11px] font-bold text-text-dimmer">لا توجد إشعارات جديدة</p>
            ) : notifications.map((item) => (
              <div key={item.id} className="mb-2 rounded-xl border border-border bg-card p-3 last:mb-0">
                <p className="text-xs font-black text-text">{item.title}</p>
                <p className="mt-1 text-[10px] leading-5 text-text-dim">{item.body}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
