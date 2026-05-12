'use client';
import { useEffect, useState, useMemo } from 'react';
import { LayoutDashboard, Tag, History, Scan, Store, LogOut, Bell, X, MessageSquare, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCookie, deleteCookie } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online').replace(/\/$/, '');

/* ── Main Sidebar ── */
export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showBell, setShowBell] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);
  
  const userId = useMemo(() => {
    if (typeof localStorage === 'undefined') return null;
    try {
      const user = JSON.parse(localStorage.getItem('vendor_user') || '{}');
      return user.id;
    } catch { return null; }
  }, []);

  const storeId = useMemo(() => {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem('vendor_store_id');
  }, []);

  const socket = useSocket(userId);

  // Fetch notifications once
  useEffect(() => {
    if (!mounted) return;
    const fetchNotifs = async () => {
      const token = getCookie('auth_token');
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(Array.isArray(data) ? data : []);
        }
      } catch (e) {}
    };
    fetchNotifs();
  }, [mounted]);

  // Real-time listener
  useEffect(() => {
    const s = socket.current;
    if (!s) return;
    const handleNotif = (data: any) => {
      setNotifications((prev) => [data, ...prev].slice(0, 30));
    };
    s.on('merchant_notification', handleNotif);
    return () => { s.off('merchant_notification', handleNotif); };
  }, [socket]);

  const handleLogout = () => {
    deleteCookie('auth_token');
    // مسح كافة الكاشات عند تسجيل الخروج
    const cacheKeys = [
      'vendor_user', 'vendor_store_id', 'cache_vendor_stats', 
      'cache_vendor_coupons', 'cache_vendor_offers_list', 
      'cache_vendor_dashboard_recent', 'pending_redemptions',
      'vendor_recent_scans'
    ];
    cacheKeys.forEach(k => localStorage.removeItem(k));
    window.location.href = '/login';
  };

  const menuItems = useMemo(() => [
    { name: 'لوحة التحكم', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'التنبيهات', icon: Bell, href: '/dashboard/notifications' },
    { name: 'العروض', icon: Tag, href: '/dashboard/offers' },
    { name: 'الكوبونات', icon: History, href: '/dashboard/coupons' },
    { name: 'مسح الكود', icon: Scan, href: '/dashboard/scan' },
    { name: 'ملف المتجر', icon: Store, href: '/dashboard/profile' },
    { name: 'معاينة المتجر', icon: MessageSquare, href: `https://zagoffers.online/stores/${storeId}`, external: true },
    { name: 'الدعم الفني', icon: Bell, href: 'https://wa.me/201091428238', external: true },
    { name: 'الإعدادات', icon: Settings, href: '/dashboard/settings' },
  ], [userId, storeId]);

  if (!mounted) return null;

  return (
    <aside className="w-[280px] lg:w-[260px] h-full lg:h-[calc(100vh-2rem)] lg:m-4 flex flex-col z-[70]">
      <div className="glass h-full flex flex-col rounded-none lg:rounded-[2.5rem] border-l lg:border border-white/5 bg-bg/95 lg:bg-white/[0.02] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 pb-4 flex items-center justify-between border-b border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-xl shadow-primary/30">
              <span className="text-white font-black text-base italic">Z</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-black text-sm tracking-tight">زاچ أوفرز</span>
              <span className="text-primary font-bold text-[9px] uppercase tracking-widest opacity-70">لوحة التاجر</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBell(!showBell)}
              className="relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-dim"
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full shadow-lg shadow-primary/50" />}
            </button>
            {onClose && (
              <button onClick={onClose} className="lg:hidden w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-text-dim border border-white/5">
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto scrollbar-none">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const content = (
              <>
                <item.icon size={19} className={isActive ? 'text-white' : 'group-hover:text-primary transition-colors'} />
                <span className={`text-[13px] tracking-tight ${isActive ? 'font-black' : 'font-bold'}`}>{item.name}</span>
              </>
            );

            const className = `
              group flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200
              ${isActive 
                ? 'bg-primary text-white shadow-lg shadow-primary/10' 
                : 'text-text-dim hover:text-text hover:bg-white/5'}
            `;

            if (item.external) {
              return (
                <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
                  {content}
                </a>
              );
            }

            return (
              <Link 
                key={item.href}
                href={item.href}
                onClick={() => onClose?.()}
                className={className}
              >
                {content}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
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
      
      {/* Simple Overlays instead of Portals for performance */}
      <AnimatePresence>
        {showBell && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="absolute top-20 right-4 left-4 lg:left-auto lg:w-80 bg-bg/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl z-[100] p-4 max-h-[70vh] overflow-y-auto scrollbar-none"
          >
            <div className="flex items-center justify-between mb-4 px-2">
               <span className="text-xs font-black text-text">الإشعارات</span>
               <button onClick={() => setShowBell(false)} className="text-text-dimmer"><X size={14}/></button>
            </div>
            {notifications.length === 0 ? (
               <p className="py-8 text-center text-[10px] text-text-dimmer font-bold">لا توجد إشعارات</p>
            ) : (
               notifications.map(n => (
                 <div key={n.id} className="p-3 mb-2 rounded-xl bg-white/5 border border-white/5 last:mb-0">
                    <p className="text-[12px] font-bold text-text">{n.title}</p>
                    <p className="text-[10px] text-text-dim mt-0.5">{n.body}</p>
                 </div>
               ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
