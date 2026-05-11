'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LayoutDashboard, Tag, History, Scan, Store, LogOut, Bell, X, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCookie, deleteCookie } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';

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
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[9998]"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        dir="rtl"
        className="fixed z-[9999] top-4 right-4 left-4 max-h-[calc(100vh-2rem)] sm:right-auto sm:left-4 sm:top-20 sm:w-[24rem] flex flex-col bg-bg border border-white/5 rounded-[2rem] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-primary" />
            <span className="font-black text-text text-[14px]">الإشعارات</span>
            {unread > 0 && (
              <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-lg">
                {unread} جديد
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {unread > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-[11px] text-primary font-black hover:opacity-80 transition-opacity"
              >
                قراءة الكل
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-text-dim hover:text-text hover:bg-white/5 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 scrollbar-none">
          {notifications.length === 0 ? (
            <div className="py-16 text-center opacity-30">
              <Bell size={40} className="mx-auto mb-4" />
              <p className="text-xs font-black">لا توجد إشعارات حالياً</p>
            </div>
          ) : (
            notifications.slice(0, 20).map((n) => (
              <button
                key={n.id}
                onClick={() => onNotifClick(n)}
                className={`w-full text-right px-6 py-5 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors flex items-start gap-4 ${
                  n.isRead ? 'opacity-40' : 'bg-primary/5'
                }`}
              >
                <div className={`mt-2 w-2 h-2 rounded-full shrink-0 ${n.isRead ? 'bg-transparent' : 'bg-primary'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black text-text">{n.title}</p>
                  <p className="text-[11px] text-text-dim mt-1 leading-relaxed line-clamp-2">{n.body}</p>
                  <p className="text-[9px] text-text-dimmer mt-2 font-black uppercase tracking-wider">
                    {new Date(n.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </motion.div>
    </>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(panel, document.body);
}

/* ── Main Sidebar ── */
export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showBell, setShowBell] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { 
    setTimeout(() => setMounted(true), 0); 
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const getToken = () => getCookie('auth_token');

  // Get userId from localStorage
  const getUserId = () => {
    if (typeof localStorage === 'undefined') return null;
    const userStr = localStorage.getItem('vendor_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id;
      } catch { return null; }
    }
    return null;
  };

  const userId = getUserId();

  // Use WebSocket for real-time notifications
  const socket = useSocket(userId);

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

  // Fetch notifications on mount
  useEffect(() => {
    if (mounted) {
      setTimeout(() => fetchNotifications(), 0);
    }
  }, [mounted]);

  // Listen for real-time notifications via WebSocket
  useEffect(() => {
    if (!socket.current) return;

    const socketRef = socket.current;
    socketRef.on('merchant_notification', (data: Notification) => {
      setNotifications((prev) => [data, ...prev].slice(0, 50));
    });

    return () => {
      socketRef.off('merchant_notification');
    };
  }, [socket]);

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
    onClose?.();
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
    { name: 'لوحة التحكم', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'العروض', icon: Tag, href: '/dashboard/offers' },
    { name: 'الكوبونات', icon: History, href: '/dashboard/coupons' },
    { name: 'مسح الكود', icon: Scan, href: '/dashboard/scan' },
    { name: 'ملف المتجر', icon: Store, href: '/dashboard/profile' },
    { name: 'دعم ومساعدة', icon: MessageSquare, href: '/dashboard/chat' },
  ];

  return (
    <>
      <AnimatePresence>
        {mounted && showBell && (
          <NotificationPanel
            notifications={notifications}
            onClose={() => setShowBell(false)}
            onMarkAllRead={markAllRead}
            onNotifClick={handleNotifClick}
          />
        )}
      </AnimatePresence>

      <aside className="w-[280px] lg:w-[260px] h-full lg:h-[calc(100vh-2rem)] lg:m-4 flex flex-col z-[70]">
        <div className="glass h-full flex flex-col rounded-none lg:rounded-[2.5rem] border-l lg:border border-white/5 bg-bg/95 lg:bg-white/[0.02] overflow-hidden inner-shadow">
          
          {/* Header */}
          <div className="p-5 pb-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-xl shadow-primary/40">
                <span className="text-white font-black text-base italic tracking-tighter">Z</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white font-black text-sm tracking-tight leading-none">زاچ أوفرز</span>
                <span className="text-primary font-bold text-[9px] uppercase tracking-widest opacity-70">لوحة التاجر</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Bell always visible */}
              <button
                onClick={() => setShowBell(!showBell)}
                className="relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-dim hover:text-primary hover:border-primary/30 transition-all"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-lg shadow-primary/50">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {onClose && (
                <button onClick={onClose} className="lg:hidden w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-text-dim hover:text-white transition-all border border-white/5">
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto scrollbar-none">
            <div className="px-4 mb-4">
               <span className="text-[10px] font-black text-text-dimmer uppercase tracking-[0.3em]">القائمة الرئيسية</span>
            </div>
            
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href}
                  href={item.href}
                  onClick={() => onClose?.()}
                  className={`
                    group flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 relative overflow-hidden
                    ${isActive 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'text-text-dim hover:text-text hover:bg-white/5'}
                  `}
                >
                  <item.icon size={20} className={isActive ? 'text-white' : 'group-hover:text-primary transition-colors'} />
                  <span className={`text-[13px] tracking-tight ${isActive ? 'font-black' : 'font-bold'}`}>{item.name}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="active-pill"
                      className="absolute left-4 w-1.5 h-1.5 bg-white rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer — Logout */}
          <div className="p-4 border-t border-white/5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl hover:bg-red-500/10 transition-all text-red-500/50 hover:text-red-500 group"
            >
              <LogOut size={18} />
              <span className="text-[13px] font-black tracking-tight">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
