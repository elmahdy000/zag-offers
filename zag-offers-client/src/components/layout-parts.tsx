"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { ShoppingBag, User, Heart, Menu, X, Bell, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { API_URL } from '@/lib/constants';

interface ClientNotification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  type?: string;
  data?: {
    offerId?: string;
    storeId?: string;
    couponId?: string;
  };
}

function getNotifRoute(n: ClientNotification): string {
  const d = n.data || {};
  switch (n.type) {
    case 'NEW_OFFER':
    case 'OFFER_APPROVED':
      return d.offerId ? `/offers/${d.offerId}` : '/offers';
    case 'STORE_APPROVED':
      return d.storeId ? `/stores/${d.storeId}` : '/stores';
    case 'COUPON_REDEEMED':
      return '/profile/coupons';
    default:
      return '/';
  }
}

/* ─── Notification Dropdown Portal ─────────────────────── */
function NotificationPortal({
  notifications,
  onClose,
  onMarkAllRead,
  onNotifClick,
}: {
  notifications: ClientNotification[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onNotifClick: (n: ClientNotification) => void;
}) {
  const unread = notifications.filter(n => !n.isRead).length;

  const panel = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      />
      {/* Panel */}
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
          background: '#1A1A1A',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '1.5rem',
          boxShadow: '0 25px 60px -12px rgba(0,0,0,0.6)',
          overflow: 'hidden'
        }}
        className="sm:!left-auto sm:!right-4 sm:!top-20 sm:!w-[22rem]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05] bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <Bell size={16} className="text-[#FF6B00]" />
            <span className="text-sm font-black text-[#F0F0F0]">الإشعارات</span>
            {unread > 0 && (
              <span className="bg-[#FF6B00] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {unread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {unread > 0 && (
              <button
                onClick={onMarkAllRead}
                className="flex items-center gap-1 text-[11px] text-[#FF6B00] font-black hover:underline"
              >
                <CheckCheck size={12} />
                قراءة الكل
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/30 hover:text-white hover:bg-white/5 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {notifications.length === 0 ? (
            <div className="py-16 text-center">
              <Bell size={40} className="text-white/[0.05] mx-auto mb-4" />
              <p className="text-white/30 text-sm font-bold">لا توجد إشعارات جديدة</p>
            </div>
          ) : (
            notifications.slice(0, 30).map((n) => (
              <button
                key={n.id}
                onClick={() => onNotifClick(n)}
                className={`w-full text-right px-5 py-4 border-b border-white/[0.03] hover:bg-white/[0.04] transition-all flex items-start gap-4 ${
                  n.isRead ? 'opacity-50' : 'bg-[#FF6B00]/[0.03]'
                }`}
              >
                {!n.isRead && (
                  <span className="mt-2 w-2 h-2 rounded-full bg-[#FF6B00] flex-shrink-0 shadow-[0_0_8px_rgba(255,107,0,0.5)]" />
                )}
                <div className={`flex-1 min-w-0 ${n.isRead ? 'mr-6' : ''}`}>
                  <p className="text-sm font-black text-[#F0F0F0] truncate">{n.title}</p>
                  <p className="text-[11px] text-[#9A9A9A] mt-1 leading-relaxed line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-[#9A9A9A]/40 mt-2 font-bold uppercase tracking-wider">
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

/* ─── Navbar ─────────────────────────────────────────────── */
export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled,       setIsScrolled]       = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn,       setIsLoggedIn]       = useState(false);
  const [notifications,    setNotifications]    = useState<ClientNotification[]>([]);
  const [showBell,         setShowBell]         = useState(false);
  const [mounted,          setMounted]          = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => { setMounted(true); }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
  };

  const handleNotifClick = async (n: ClientNotification) => {
    if (!n.isRead) {
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
      );
      try {
        const token = localStorage.getItem('token');
        if (token) {
          fetch(`${API_URL}/notifications/${n.id}/read`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
      } catch { /* silent */ }
    }
    setShowBell(false);
    router.push(getNotifRoute(n));
  };

  // Update login status
  useEffect(() => {
    const checkAuth = () => setIsLoggedIn(!!localStorage.getItem('token'));
    checkAuth();
    window.addEventListener('auth-change', checkAuth);
    window.addEventListener('storage', checkAuth);
    return () => {
      window.removeEventListener('auth-change', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, [pathname]);

  // Fetch notifications
  useEffect(() => {
    if (!isLoggedIn) { setNotifications([]); return; }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setIsMobileMenuOpen(false); }, [pathname]);

  const NavLink = ({ href, label }: { href: string; label: string }) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`relative text-sm font-bold transition-colors
          ${active ? 'text-[#FF6B00]' : 'text-[#9A9A9A] hover:text-[#F0F0F0]'}`}
      >
        {label}
        {active && (
          <motion.div
            layoutId="nav-underline"
            className="absolute -bottom-1 right-0 left-0 h-[2px] bg-[#FF6B00] rounded-full"
          />
        )}
      </Link>
    );
  };

  return (
    <>
      {mounted && showBell && (
        <NotificationPortal
          notifications={notifications}
          onClose={() => setShowBell(false)}
          onMarkAllRead={markAllRead}
          onNotifClick={handleNotifClick}
        />
      )}

      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300
          ${isScrolled
            ? 'bg-[rgba(26,26,26,0.9)] backdrop-blur-[20px] border-b border-white/[0.07] shadow-[0_4px_24px_rgba(0,0,0,0.3)] h-16'
            : 'bg-transparent h-20'}`}
      >
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between" dir="rtl">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-[#FF6B00] to-[#D95A00] rounded-xl
                            flex items-center justify-center shadow-[0_4px_12px_rgba(255,107,0,0.35)]
                            group-hover:scale-105 transition-transform">
              <ShoppingBag className="text-white" size={18} />
            </div>
            <span className="text-lg font-black tracking-tight">
              Zag<span className="text-[#FF6B00]">Offers</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink href="/"           label="الرئيسية" />
            <NavLink href="/categories" label="الأقسام" />
            <NavLink href="/stores"     label="المحلات" />
            <NavLink href="/offers"     label="أقوى العروض" />
            <Link 
              href="https://vendor.zagoffers.online" 
              target="_blank"
              className="text-[10px] font-black text-[#FF6B00]/70 hover:text-[#FF6B00] transition-colors border border-[#FF6B00]/20 px-3 py-1 rounded-full uppercase tracking-widest"
            >
              لوحة التاجر
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/favorites"
              className="p-2 text-[#9A9A9A] hover:text-[#F0F0F0] transition-colors rounded-lg hover:bg-white/5"
            >
              <Heart size={19} />
            </Link>

            {isLoggedIn && (
              <button
                onClick={() => setShowBell((v) => !v)}
                className={`relative p-2 transition-colors rounded-lg hover:bg-white/5
                           ${showBell ? 'text-[#FF6B00]' : 'text-[#9A9A9A] hover:text-[#F0F0F0]'}`}
                aria-label="الإشعارات"
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#FF6B00] text-white text-[10px] font-black rounded-full flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            <div className="h-5 w-px bg-white/[0.08] hidden sm:block" />

            {isLoggedIn ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 py-1.5 px-3 bg-white/[0.05] rounded-full
                           border border-white/[0.07] hover:border-[#FF6B00]/40 transition-all"
              >
                <span className="text-xs font-bold hidden sm:block text-[#9A9A9A]">حسابي</span>
                <div className="w-7 h-7 bg-[#FF6B00] rounded-full flex items-center justify-center">
                  <User size={14} className="text-white" />
                </div>
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2 bg-gradient-to-br from-[#FF6B00] to-[#D95A00] text-white
                           text-sm font-black rounded-full shadow-[0_4px_12px_rgba(255,107,0,0.35)]
                           hover:scale-105 active:scale-95 transition-all"
              >
                دخول
              </Link>
            )}

            {/* Hamburger */}
            <button
              className="md:hidden p-2 text-[#9A9A9A] hover:text-white transition-colors rounded-lg hover:bg-white/5"
              onClick={() => setIsMobileMenuOpen(v => !v)}
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#1E1E1E] border-t border-white/[0.07] overflow-hidden"
            >
              <div className="px-5 py-5 flex flex-col gap-1" dir="rtl">
                {[
                  { href: '/',           label: 'الرئيسية' },
                  { href: '/categories', label: 'الأقسام' },
                  { href: '/stores',     label: 'المحلات' },
                  { href: '/offers',     label: 'أقوى العروض' },
                  { href: '/favorites',  label: 'المفضلة' },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`text-base font-bold py-3 px-3 rounded-xl transition-all
                      ${pathname === href
                        ? 'text-[#FF6B00] bg-[#FF6B00]/10'
                        : 'text-[#9A9A9A] hover:text-[#F0F0F0] hover:bg-white/5'}`}
                  >
                    {label}
                  </Link>
                ))}
                {!isLoggedIn && (
                  <Link
                    href="/login"
                    className="mt-3 py-3 text-center bg-gradient-to-br from-[#FF6B00] to-[#D95A00]
                               text-white font-black rounded-xl shadow-[0_4px_12px_rgba(255,107,0,0.3)]"
                  >
                    تسجيل الدخول
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}

/* ─── Footer ─────────────────────────────────────────────── */
export function Footer() {
  return (
    <footer className="bg-[#151515] border-t border-white/[0.07] pt-14 pb-8 mt-20" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="col-span-1 md:col-span-2">
          <Link href="/" className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 bg-gradient-to-br from-[#FF6B00] to-[#D95A00] rounded-xl
                            flex items-center justify-center shadow-[0_4px_12px_rgba(255,107,0,0.35)]">
              <ShoppingBag className="text-white" size={18} />
            </div>
            <span className="text-xl font-black">Zag<span className="text-[#FF6B00]">Offers</span></span>
          </Link>
          <p className="text-[#9A9A9A] text-sm leading-relaxed max-w-sm mb-6">
            وجهتك الأولى لأفضل العروض والخصومات في مدينة الزقازيق. كوبونات حصرية من أفضل المحلات والخدمات.
          </p>
          <div className="flex gap-3">
            {['f', '𝕏', 'ig'].map((s, i) => (
              <div key={i}
                className="w-9 h-9 rounded-full bg-white/[0.05] border border-white/[0.07]
                           flex items-center justify-center text-sm text-[#9A9A9A] font-bold
                           hover:bg-[#FF6B00] hover:text-white hover:border-[#FF6B00]
                           transition-all cursor-pointer">
                {s}
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-[#F0F0F0] font-bold mb-5">روابط سريعة</h4>
          <ul className="space-y-3 text-[#9A9A9A] text-sm font-semibold">
            {['عن زقازيق أوفرز', 'كيفية استخدام الكوبونات', 'الأسئلة الشائعة', 'اتصل بنا'].map(t => (
              <li key={t} className="hover:text-[#FF6B00] cursor-pointer transition-colors">{t}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-[#F0F0F0] font-bold mb-5">لأصحاب المحلات</h4>
          <ul className="space-y-3 text-[#9A9A9A] text-sm font-semibold">
            <li>
              <Link href="https://vendor.zagoffers.online/register" className="hover:text-[#FF6B00] transition-colors">سجل محلك الآن</Link>
            </li>
            <li>
              <Link href="https://vendor.zagoffers.online" className="hover:text-[#FF6B00] transition-colors">دخول لوحة التاجر</Link>
            </li>
            {['دليل التجار', 'باقات الاشتراك', 'شروط الخدمة'].map(t => (
              <li key={t} className="hover:text-[#FF6B00] cursor-pointer transition-colors">{t}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12 pt-6 border-t border-white/[0.07]
                      flex flex-col sm:flex-row justify-between items-center gap-3
                      text-xs font-bold text-[#9A9A9A]">
        <p>© 2026 ZagOffers — جميع الحقوق محفوظة.</p>
        <div className="flex gap-5">
          <span className="hover:text-[#FF6B00] cursor-pointer transition-colors">سياسة الخصوصية</span>
          <span className="hover:text-[#FF6B00] cursor-pointer transition-colors">شروط الاستخدام</span>
        </div>
      </div>
    </footer>
  );
}
