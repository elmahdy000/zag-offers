'use client';
import { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, Tag, History, Scan, Store, LogOut, Bell, X } from 'lucide-react';
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

/** Map notification type → dashboard route */
function getNotifRoute(n: Notification): string {
  const d = n.data || {};
  switch (n.type) {
    case 'OFFER_APPROVED':
    case 'OFFER_REJECTED':
    case 'NEW_OFFER':
      return d.offerId ? `/dashboard/offers` : '/dashboard/offers';
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

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showBell, setShowBell] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

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
    } catch {
      // silently ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowBell(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
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
    } catch {
      // silently ignore
    }
  };

  const handleNotifClick = async (n: Notification) => {
    // Mark single as read
    if (!n.isRead) {
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
      );
      try {
        const token = getToken();
        if (token) {
          await fetch(`${API_URL}/api/notifications/${n.id}/read`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } catch { /* ignore */ }
    }
    setShowBell(false);
    router.push(getNotifRoute(n));
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
    } catch {
      // ignore network errors on logout
    } finally {
      deleteCookie('auth_token');
      localStorage.removeItem('vendor_user');
      localStorage.removeItem('vendor_store_id');
      router.push('/login');
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
    <aside className="w-64 glass h-[calc(100vh-2rem)] fixed right-4 top-4 rounded-[2rem] flex flex-col z-50 overflow-hidden">
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

        {/* Notification Bell */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => {
              setShowBell((v) => !v);
              if (!showBell && unreadCount > 0) markAllRead();
            }}
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

          {/* Dropdown — fixed position to avoid clipping on mobile */}
          {showBell && (
            <div
              className="fixed inset-x-2 top-[5rem] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[200]"
              dir="rtl"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-sm font-black text-white">الإشعارات</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-primary font-bold hover:underline"
                    >
                      قراءة الكل
                    </button>
                  )}
                  <button
                    onClick={() => setShowBell(false)}
                    className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all sm:hidden"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="max-h-[60vh] sm:max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-text-dim text-sm">
                    لا توجد إشعارات
                  </div>
                ) : (
                  notifications.slice(0, 20).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`w-full text-right px-4 py-3 border-b border-white/[0.04] hover:bg-white/5 transition-colors ${
                        n.isRead ? 'opacity-60' : 'bg-primary/5'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.isRead && (
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                        <div className={n.isRead ? 'mr-4 w-full' : 'w-full'}>
                          <p className="text-xs font-black text-white">{n.title}</p>
                          <p className="text-[11px] text-text-dim mt-0.5 leading-relaxed">{n.body}</p>
                          <p className="text-[10px] text-text-dim/60 mt-1">
                            {new Date(n.createdAt).toLocaleString('ar-EG', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
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
  );
}
