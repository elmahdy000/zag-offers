'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LayoutDashboard, Tag, History, Scan, Store, LogOut, Bell, X, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCookie, deleteCookie } from '@/lib/api';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online').replace(/\/$/, '');

interface Notification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  type?: string;
  data?: { offerId?: string; couponId?: string; storeId?: string };
}

function getNotifRoute(n: Notification): string {
  switch (n.type) {
    case 'OFFER_APPROVED':
    case 'OFFER_REJECTED':
    case 'NEW_OFFER':
      return '/dashboard/offers';
    case 'COUPON_REDEEMED':
    case 'NEW_COUPON':
      return '/dashboard/coupons';
    case 'STORE_APPROVED':
    case 'STORE_REJECTED':
      return '/dashboard/profile';
    default:
      return '/dashboard';
  }
}

/* ── Notification Panel rendered via Portal directly in body ── */
function NotificationPanel({
  notifications,
  onClose,
  onMarkAllRead,
  onNotifClick,
}: {
  notifications: Notification[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onNotifClick: (n: Notification) => void;
}) {
  const unread = notifications.filter((n) => !n.isRead).length;

  const panel = (
    <>
      {/* Full-screen backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />
      {/* Notification panel */}
      <div
        dir="rtl"
        style={{
          position: 'fixed',
          zIndex: 9999,
          top: '1rem',
          right: '1rem',
          left: '1rem',
          maxHeight: 'calc(100vh - 2rem)',
          display: 'flex',
          flexDirection: 'column',
          background: '#161618',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '1.5rem',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
        className="sm:!right-[17.5rem] sm:!left-auto sm:!w-[20rem] sm:!top-16"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-primary" />
            <span className="font-black text-text text-[13px]">الإشعارات</span>
            {unread > 0 && (
              <span className="bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                {unread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button
                onClick={onMarkAllRead}
                className="flex items-center gap-1 text-[10px] text-primary font-black hover:opacity-80 transition-opacity"
              >
                <CheckCheck size={12} />
                قراءة الكل
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-dim hover:text-text hover:bg-white/5 transition-all"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Scrollable list */}
        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell size={32} className="text-white/5 mx-auto mb-3" />
              <p className="text-text-dim text-[11px] font-bold">لا توجد إشعارات حالياً</p>
            </div>
          ) : (
            notifications.slice(0, 30).map((n) => (
              <button
                key={n.id}
                onClick={() => onNotifClick(n)}
                className={`w-full text-right px-5 py-4 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors flex items-start gap-3 ${
                  n.isRead ? 'opacity-40' : 'bg-primary/5'
                }`}
              >
                <span
                  className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all ${
                    n.isRead ? 'bg-transparent' : 'bg-primary'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-black text-text">{n.title}</p>
                  <p className="text-[11px] text-text-dim mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                  <p className="text-[9px] text-text-dimmer mt-1.5 font-bold uppercase tracking-wider">
                    {new Date(n.createdAt).toLocaleString('ar-EG', {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(panel, document.body);
}

/* ── Main Sidebar ── */
export default function Sidebar() {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showBell, setShowBell] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const getToken = () => getCookie('auth_token');

  const fetchNotifications = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    try {
      const token = getToken();
      if (!token) return;
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* silent */ }
  };

  const handleNotifClick = async (n: Notification) => {
    if (!n.isRead) {
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, isRead: true } : x));
      try {
        const token = getToken();
        if (token) {
          fetch(`${API_URL}/api/notifications/${n.id}/read`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
      } catch { /* silent */ }
    }
    setShowBell(false);
    window.location.href = getNotifRoute(n);
  };

  const handleLogout = async () => {
    try {
      const token = getToken();
      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch { /* silent */ } finally {
      deleteCookie('auth_token');
      localStorage.removeItem('vendor_user');
      localStorage.removeItem('vendor_store_id');
      window.location.href = '/login';
    }
  };

  const menuItems = [
    { name: 'الرئيسية', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'عروضي', icon: Tag, href: '/dashboard/offers' },
    { name: 'سجل الكوبونات', icon: History, href: '/dashboard/coupons' },
    { name: 'تحقق من كود', icon: Scan, href: '/dashboard/scan' },
    { name: 'إعدادات المتجر', icon: Store, href: '/dashboard/profile' },
  ];

  return (
    <>
      {mounted && showBell && (
        <NotificationPanel
          notifications={notifications}
          onClose={() => setShowBell(false)}
          onMarkAllRead={markAllRead}
          onNotifClick={handleNotifClick}
        />
      )}

      <aside className="w-[240px] glass h-[calc(100vh-2rem)] fixed right-4 top-4 rounded-[2.5rem] flex flex-col z-50 inner-shadow">
        {/* Logo + Bell */}
        <div className="p-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 inner-shadow">
              <Tag className="text-primary" size={18} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-[15px] text-text leading-none tracking-tight">ZAG VENDOR</span>
              <span className="text-[8px] text-primary font-black uppercase tracking-[0.2em] mt-1">Merchant Hub</span>
            </div>
          </div>

          <button
            onClick={() => setShowBell((v) => !v)}
            className="relative p-2 rounded-lg text-text-dim hover:text-text hover:bg-white/5 transition-all"
            aria-label="الإشعارات"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(255,107,0,0.5)]" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1.5 mt-4 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-item ${isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-text-dim hover:bg-white/5 hover:text-text'}`}
              >
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span className={isActive ? 'font-black' : 'font-bold'}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-text-dim hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all font-black text-[11px] uppercase tracking-wider"
          >
            <LogOut size={16} />
            تسجيل الخروج
          </button>
        </div>
      </aside>
    </>
  );
}
