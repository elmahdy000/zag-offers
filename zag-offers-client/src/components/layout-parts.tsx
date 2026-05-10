"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { 
  ShoppingBag, User, Heart, Menu, X, Bell, CheckCheck, 
  Ticket, Phone, Shield, FileText, Tag, Building2, 
  LayoutDashboard, FileCheck, Headphones, Store, Mail,
  Link as LinkIcon
} from 'lucide-react';
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
  let d: any = n.data || {};
  if (typeof d === 'string') {
    try { d = JSON.parse(d); } catch { d = {}; }
  }
  
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

/* ─── NavLink Helper ────────────────────────────────────────── */
const NavLink = ({ href, label, active }: { href: string; label: string; active: boolean }) => {
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

  useEffect(() => { setTimeout(() => setMounted(true), 0); }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const normalized = (Array.isArray(data) ? data : []).map(n => {
          if (typeof n.data === 'string') {
            try { n.data = JSON.parse(n.data); } catch { /* ignore */ }
          }
          return n;
        });
        setNotifications(normalized);
      }
    } catch { /* ignore */ }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
  }, []);

  const handleNotifClick = useCallback(async (n: ClientNotification) => {
    if (!n.isRead) {
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
      );
      try {
        const token = localStorage.getItem('token');
        if (token) {
          fetch(`${API_URL}/notifications/${n.id}/read`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
      } catch { /* silent */ }
    }
    setShowBell(false);
    router.push(getNotifRoute(n));
  }, [router]);

  // Update login status
  useEffect(() => {
    const checkAuth = () => setTimeout(() => setIsLoggedIn(!!localStorage.getItem('token')), 0);
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
    if (!isLoggedIn) { setTimeout(() => setNotifications([]), 0); return; }
    setTimeout(() => fetchNotifications(), 0);
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [isLoggedIn, fetchNotifications]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { 
    setTimeout(() => setIsMobileMenuOpen(false), 0); 
  }, [pathname]);



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
            <NavLink href="/"           label="الرئيسية" active={pathname === "/"} />
            <NavLink href="/categories" label="الأقسام"  active={pathname === "/categories"} />
            <NavLink href="/stores"     label="المحلات"  active={pathname === "/stores"} />
            <NavLink href="/offers"     label="أقوى العروض" active={pathname === "/offers"} />
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
    <footer className="bg-[#111111] border-t border-white/[0.05] mt-20" dir="rtl">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-10 mb-16">
        <Link 
          href="/offers" 
          className="group block relative overflow-hidden rounded-[2rem] p-8 sm:p-10 text-center
                     bg-gradient-to-r from-[#2A1B12] via-[#3D2618] to-[#2A1B12]
                     border border-white/[0.08] shadow-2xl hover:scale-[1.01] transition-all duration-500"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <div className="w-14 h-14 bg-[#FF6B00] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,107,0,0.3)] group-hover:rotate-12 transition-transform">
              <Ticket className="text-white" size={28} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#F0F0F0] tracking-tight">
              🎟️ احصل على <span className="text-[#FF6B00]">الكوبون</span>
            </h2>
          </div>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand Info */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FF6B00] rounded-xl flex items-center justify-center shadow-lg">
                <ShoppingBag className="text-white" size={20} />
              </div>
              <span className="text-2xl font-black text-white">Zag<span className="text-[#FF6B00]">Offers</span></span>
            </Link>
            <p className="text-[#9A9A9A] text-sm leading-relaxed font-medium">
              وجهتك الأولى لأفضل العروض والخصومات في مدينة الزقازيق. كوبونات حصرية من أفضل المحلات والخدمات.
            </p>
            <div className="flex gap-3">
              {[
                { 
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>, 
                  href: 'https://facebook.com/zagoffers' 
                },
                { 
                  icon: <XIcon size={18} />, 
                  href: 'https://x.com/zagoffers' 
                },
                { 
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>, 
                  href: 'https://instagram.com/zagoffers' 
                }
              ].map((s, i) => (
                <Link key={i} href={s.href} target="_blank"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10
                             flex items-center justify-center text-[#9A9A9A] hover:text-[#FF6B00]
                             hover:border-[#FF6B00]/50 hover:bg-[#FF6B00]/5 transition-all">
                  {s.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:pr-8">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <LinkIcon size={16} className="text-blue-500" />
              </div>
              <h4 className="text-lg font-black text-white">روابط سريعة</h4>
            </div>
            <ul className="space-y-4">
              {[
                { label: 'اتصل بنا', href: '/contact', icon: <Phone size={14} /> },
                { label: 'سياسة الخصوصية', href: '/privacy', icon: <Shield size={14} /> },
                { label: 'شروط الاستخدام', href: '/terms', icon: <FileText size={14} /> },
                { label: 'أحدث العروض', href: '/offers', icon: <Tag size={14} /> }
              ].map((link, i) => (
                <li key={i}>
                  <Link href={link.href} className="group flex items-center gap-3 text-[#9A9A9A] hover:text-white transition-colors font-bold text-sm">
                    <span className="w-6 h-6 rounded bg-white/5 flex items-center justify-center group-hover:bg-[#FF6B00]/10 group-hover:text-[#FF6B00] transition-colors">
                      {link.icon}
                    </span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Merchant Links */}
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Store size={16} className="text-orange-500" />
              </div>
              <h4 className="text-lg font-black text-white">للتجار</h4>
            </div>
            <ul className="space-y-4">
              {[
                { label: 'سجل محلك', href: 'https://vendor.zagoffers.online/register', icon: <Building2 size={14} /> },
                { label: 'لوحة التاجر', href: 'https://vendor.zagoffers.online', icon: <LayoutDashboard size={14} /> },
                { label: 'شروط التجار', href: '/terms#vendors', icon: <FileCheck size={14} /> },
                { label: 'دعم التجار', href: '/contact', icon: <Headphones size={14} /> }
              ].map((link, i) => (
                <li key={i}>
                  <Link href={link.href} className="group flex items-center gap-3 text-[#9A9A9A] hover:text-white transition-colors font-bold text-sm">
                    <span className="w-6 h-6 rounded bg-white/5 flex items-center justify-center group-hover:bg-[#FF6B00]/10 group-hover:text-[#FF6B00] transition-colors">
                      {link.icon}
                    </span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Subscribe */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/10 flex items-center justify-center">
                <Mail size={20} className="text-[#FF6B00]" />
              </div>
              <h4 className="text-lg font-black text-white">اشترك ليصلك كل جديد</h4>
            </div>
            <p className="text-[#9A9A9A] text-xs font-bold leading-relaxed">
              احصل على أفضل العروض والكوبونات مباشرة إلى بريدك الإلكتروني
            </p>
            <form className="relative group" onSubmit={e => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="ادخل بريدك الإلكتروني"
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-2xl py-4 px-5 pr-12
                           text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF6B00]/50
                           transition-all"
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FF6B00] transition-colors" size={18} />
              <button 
                type="submit"
                className="mt-3 w-full py-4 bg-[#FF6B00] text-white font-black rounded-2xl
                           shadow-[0_8px_20px_rgba(255,107,0,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
              >
                اشترك
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-20 pt-8 border-t border-white/[0.05] flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] sm:text-xs font-bold text-[#9A9A9A]">
          <p>© 2026 <span className="text-[#FF6B00]">ZagOffers</span> — جميع الحقوق محفوظة.</p>
          <div className="flex gap-4 sm:gap-8">
            <Link href="/privacy" className="hover:text-white transition-colors">سياسة الخصوصية</Link>
            <Link href="/terms" className="hover:text-white transition-colors">شروط الاستخدام</Link>
            <Link href="/contact" className="hover:text-white transition-colors">تواصل معنا</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

const XIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.933zm-1.292 19.49h2.039L6.486 3.24H4.298l13.311 17.403z" />
  </svg>
);
