'use client';
import { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, Tag, History, Scan, Store, LogOut, Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online';

interface Notification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  type?: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showBell, setShowBell] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Fetch notifications from DB
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('vendor_token');
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
      const token = localStorage.getItem('vendor_token');
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

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('vendor_token');
      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // ignore network errors on logout
    } finally {
      localStorage.removeItem('vendor_token');
      localStorage.removeItem('vendor_user');
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

          {/* Dropdown */}
          {showBell && (
            <div
              className="absolute left-0 top-full mt-2 w-80 bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
              dir="rtl"
            >
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-sm font-black text-white">الإشعارات</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-primary font-bold hover:underline"
                  >
                    قراءة الكل
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-text-dim text-sm">
                    لا توجد إشعارات
                  </div>
                ) : (
                  notifications.slice(0, 20).map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-white/[0.04] transition-colors ${
                        n.isRead ? 'opacity-60' : 'bg-primary/5'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.isRead && (
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                        <div className={n.isRead ? 'mr-4' : ''}>
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
                    </div>
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
