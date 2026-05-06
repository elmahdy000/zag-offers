'use client';
import { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, Tag, History, Scan, Store, LogOut, Bell, X, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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

/* ── Notification Panel (rendered as fixed overlay, outside sidebar) ── */
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

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[300]"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="fixed top-4 left-4 right-4 sm:right-auto sm:left-auto sm:top-20 sm:w-96 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-[301] flex flex-col"
        dir="rtl"
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-primary" />
            <span className="font-black text-white text-sm">الإشعارات</span>
            {unread > 0 && (
              <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {unread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button
                onClick={onMarkAllRead}
                className="flex items-center gap-1 text-[11px] text-primary font-bold hover:underline"
              >
                <CheckCheck size={12} />
                قراءة الكل
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell size={32} className="text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm font-bold">لا توجد إشعارات</p>
            </div>
          ) : (
            notifications.slice(0, 30).map((n) => (
              <button
                key={n.id}
                onClick={() => onNotifClick(n)}
                className={`w-full text-right px-5 py-4 border-b border-white/[0.04] hover:bg-white/5 transition-colors flex items-start gap-3 ${
                  n.isRead ? 'opacity-60' : ''
                }`}
              >
                {!n.isRead && (
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                )}
                <div className={`flex-1 min-w-0 ${n.isRead ? 'mr-5' : ''}`}>
                  <p className="text-xs font-black text-white truncate">{n.title}</p>
                  <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-white/20 mt-1">
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
}

/* ── Main Sidebar ── */
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showBell, setShowBell] = useState(false);

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
          await fetch(`${API_URL}/api/notifications/${n.id}/read`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
      } catch { /* silent */ }
    }
    setShowBell(false);
    // Use window.location for reliable navigation
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
      {/* Notification Panel — outside aside to avoid overflow-hidden clipping */}
      {showBell && (
        <NotificationPanel
          notifications={notifications}
          onClose={() => setShowBell(false)}
          onMarkAllRead={markAllRead}
          onNotifClick={handleNotifClick}
        />
      )}

      <aside className="w-64 glass h-[calc(100vh-2rem)] fixed right-4 top-4 rounded-[2rem] flex flex-col z-50">
        {/* Logo + Bell */}
        <div className="p-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
              <Tag className="text-primary" size={22} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg text-white leading-none">ZAG VENDOR</span>
              <span className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">Merchant Hub</span>
            </div>
          </div>

          {/* Bell button */}
          <button
            onClick={() => setShowBell((v) => !v)}
            className="relative p-2 rounded-xl text-text-dim hover:text-white hover:bg-white/5 transition-all"
            aria-label="الإشعارات"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center px-0.5">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-item ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-text-dim hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className={isActive ? 'font-black' : 'font-bold'}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-6 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-4 text-text-dim hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all font-black text-xs uppercase tracking-widest"
          >
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </div>
      </aside>
    </>
  );
}
