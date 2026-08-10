"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { 
  RiUser3Fill, RiHeart3Fill, RiMenu3Line, RiCloseLine,
  RiNotification3Fill, RiCheckDoubleLine, RiSearch2Line, RiMapPin2Line,
  RiHome4Line, RiSunLine, RiMoonClearLine, RiArrowLeftLine,
  RiPriceTag3Line, RiShieldCheckLine, RiCustomerService2Line, RiMapPin2Fill
} from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { API_URL } from '@/lib/constants';
import { BrandMark } from '@/components/brand-mark';

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
  const raw: unknown = n.data;
  let d: NonNullable<ClientNotification['data']> = {};
  if (typeof raw === 'string') {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') d = parsed as NonNullable<ClientNotification['data']>;
    } catch { d = {}; }
  } else if (raw && typeof raw === 'object') {
    d = raw as NonNullable<ClientNotification['data']>;
  }
  
  switch (n.type) {
    case 'NEW_OFFER':
    case 'OFFER_APPROVED':
      return d.offerId ? `/offers/${d.offerId}` : '/offers';
    case 'STORE_APPROVED':
      return d.storeId ? `/stores/${d.storeId}` : '/stores';
    case 'COUPON_REDEEMED':
    case 'COUPON_GENERATED':
    case 'COUPON_SHARED':
    case 'COUPON_UPDATE':
      return '/coupons';
    case 'OPEN_OFFER':
      return d.offerId ? `/offers/${d.offerId}` : '/offers';
    case 'REVIEW_REPLY':
      return d.storeId ? `/stores/${d.storeId}` : '/stores';
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
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-label="الإشعارات"
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
            <RiNotification3Fill size={16} className="text-[#FF6B00]" />
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
                <RiCheckDoubleLine size={12} />
                قراءة الكل
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="إغلاق الإشعارات"
              className="p-1.5 rounded-xl text-white/30 hover:text-white hover:bg-white/5 transition-all"
            >
              <RiCloseLine size={16} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {notifications.length === 0 ? (
            <div className="py-16 text-center">
              <RiNotification3Fill size={40} className="text-white/[0.05] mx-auto mb-4" />
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
      prefetch={false}
      href={href}
      className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors
        ${active ? 'nav-link-active bg-[#162238] text-white' : 'text-[#AAB5C6] hover:bg-[#101B2D] hover:text-white'}`}
    >
      {label}
    </Link>
  );
};

/* ─── Navbar ─────────────────────────────────────────────── */
export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navSearch,        setNavSearch]        = useState('');
  const [isLoggedIn,       setIsLoggedIn]       = useState(false);
  const [notifications,    setNotifications]    = useState<ClientNotification[]>([]);
  const [showBell,         setShowBell]         = useState(false);
  const [mounted,          setMounted]          = useState(false);
  const [theme,            setTheme]            = useState<'light' | 'dark'>('dark');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const current = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    setTimeout(() => {
      setTheme(current);
      setMounted(true);
    }, 0);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem('zag-theme', nextTheme);
  };

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
    setTimeout(() => setIsMobileMenuOpen(false), 0); 
  }, [pathname]);



  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

  if (isAuthPage) return null;

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

      <nav className="fixed inset-x-0 top-0 z-50 h-[72px] border-b border-[#25344A] bg-[#0A1324]/95 backdrop-blur-xl">
        <div className="site-container flex h-full items-center gap-4" dir="rtl">
          {/* Logo */}
          <Link prefetch={false} href="/" className="group flex flex-shrink-0 items-center gap-2.5" aria-label="Zag Offers - الرئيسية">
            <span className="relative block h-12 w-14 transition-transform group-hover:-translate-y-0.5">
              <BrandMark priority className="h-full w-full drop-shadow-[0_6px_9px_rgba(0,0,0,.25)]" />
            </span>
            <span className="hidden leading-tight xl:block">
              <b className="block text-sm tracking-tight text-white"><span className="text-[#FF6500]">Zag</span> Offers</b>
              <small className="text-[9px] text-[#93A1B7]">عروض قريبة منك</small>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden items-center gap-1 lg:flex">
            <NavLink href="/"           label="الرئيسية" active={pathname === "/"} />
            <NavLink href="/offers"     label="العروض" active={pathname === "/offers"} />
            <NavLink href="/stores"     label="المتاجر"  active={pathname === "/stores"} />
            <NavLink href="/categories" label="الأقسام"  active={pathname === "/categories"} />
            <NavLink href="/coupons" label="المحفظة" active={pathname === "/coupons"} />
            <NavLink href="/favorites" label="المفضلة" active={pathname === "/favorites"} />
            <NavLink href="/contact" label="تواصل معنا" active={pathname === "/contact"} />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (navSearch.trim()) router.push(`/offers?q=${encodeURIComponent(navSearch.trim())}`);
            }}
            className="relative hidden min-w-0 flex-1 xl:block"
          >
            <RiSearch2Line className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8795AA]" size={18} />
            <input
              value={navSearch}
              onChange={(event) => setNavSearch(event.target.value)}
              placeholder="ابحث عن متجر، منتج أو عرض"
              className="no-focus-ring h-10 w-full rounded-xl border border-[#25344A] bg-[#0C1627] pr-11 pl-4 text-sm font-normal text-white placeholder:text-[#74839A]"
            />
          </form>

          {/* Actions */}
          <div className="mr-auto flex flex-shrink-0 items-center gap-1 sm:gap-2">
            <span className="hidden items-center gap-1.5 px-2 text-xs font-semibold text-[#D3DAE5] xl:flex">
              <RiMapPin2Line className="text-[#FF8A32]" size={17} /> كل المناطق
            </span>
            <Link
              prefetch={false}
              href="/favorites"
              aria-label="المفضلة"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-[#C4CDDA] transition-colors hover:bg-[#152238] hover:text-white"
            >
              <RiHeart3Fill size={19} />
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 transition-colors"
              aria-label={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
              title={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
            >
              {mounted && theme === 'light' ? <RiMoonClearLine size={19} /> : <RiSunLine size={19} />}
            </button>

            {isLoggedIn && (
              <button
                onClick={() => setShowBell((v) => !v)}
                className={`relative p-2 transition-colors rounded-lg hover:bg-white/5
                           ${showBell ? 'text-[#FF6B00]' : 'text-[#9A9A9A] hover:text-[#F0F0F0]'}`}
                aria-label="الإشعارات"
              >
                <RiNotification3Fill size={19} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#FF6B00] text-white text-[10px] font-black rounded-full flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {isLoggedIn ? (
              <Link
                prefetch={false}
                href="/profile"
                className="flex items-center gap-2 py-1.5 px-3 bg-white/[0.05] rounded-full
                           border border-white/[0.07] hover:border-[#FF6B00]/40 transition-all"
              >
                <span className="text-xs font-bold hidden sm:block text-[#9A9A9A]">حسابي</span>
                <div className="w-7 h-7 bg-[#FF6B00] rounded-full flex items-center justify-center">
                  <RiUser3Fill size={14} className="text-white" />
                </div>
              </Link>
            ) : (
              <Link
                prefetch={false}
                href="/login"
                aria-label="تسجيل الدخول"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-[#C4CDDA] transition-colors hover:bg-[#152238] hover:text-white"
              >
                <RiUser3Fill size={19} />
              </Link>
            )}

            <Link
              href="https://vendor.zagoffers.online"
              target="_blank"
              className="hidden h-10 items-center gap-2 rounded-xl border border-[#34445B] px-3 text-xs font-bold text-white hover:border-[#FF8A32] sm:flex"
            >
              <RiHome4Line size={16} /> أضف متجرك
            </Link>

            {/* Hamburger */}
            <button
              className="flex min-h-11 min-w-11 items-center justify-center p-2 text-[#9A9A9A] hover:text-white transition-colors rounded-lg hover:bg-white/5 lg:hidden"
              onClick={() => setIsMobileMenuOpen(v => !v)}
              aria-label={isMobileMenuOpen ? 'إغلاق قائمة التنقل' : 'فتح قائمة التنقل'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {isMobileMenuOpen ? <RiCloseLine size={22} /> : <RiMenu3Line size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              id="mobile-navigation"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-[#25344A] bg-[#0A1324] lg:hidden"
            >
              <div className="px-5 py-5 flex flex-col gap-1" dir="rtl">
                {[
                  { href: '/',           label: 'الرئيسية' },
                  { href: '/categories', label: 'الأقسام' },
                  { href: '/stores',     label: 'المحلات' },
                  { href: '/offers',     label: 'أقوى العروض' },
                  { href: '/coupons',    label: 'المحفظة والكوبونات' },
                  { href: '/favorites',  label: 'المفضلة' },
                  { href: '/contact',    label: 'تواصل معنا' },
                  ...(isLoggedIn ? [{ href: '/notifications', label: 'الإشعارات' }, { href: '/profile', label: 'حسابي' }] : []),
                ].map(({ href, label }) => (
                  <Link
                    prefetch={false}
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
                    prefetch={false}
                    href="/login"
                    className="mt-3 py-3 text-center bg-[#FF6B00]
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
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

  if (isAuthPage) return null;

  return (
    <footer className="site-footer">
      <div className="site-container footer-cta">
        <div className="footer-cta-icon"><RiPriceTag3Line size={28} /></div>
        <div><span>اختيارات جديدة كل يوم</span><h3>أفضل العروض أقرب إليك مما تتخيل</h3></div>
        <Link prefetch={false} href="/offers">اكتشف العروض <RiArrowLeftLine size={18} /></Link>
      </div>
      <div className="site-container footer-main">
        <div className="footer-brand">
          <Link prefetch={false} href="/" className="footer-logo" aria-label="Zag Offers - الرئيسية">
            <span className="relative block h-16 w-20"><BrandMark className="h-full w-full" /></span>
            <span><b><span>Zag</span> Offers</b><small>عروض قريبة منك</small></span>
          </Link>
          <p>منصتك لاكتشاف أفضل العروض والخصومات الموثوقة في الزقازيق، بسهولة وفي مكان واحد.</p>
          <div className="footer-badges">
            <span><RiShieldCheckLine /> عروض موثوقة</span>
            <span><RiMapPin2Fill /> داخل الزقازيق</span>
          </div>
        </div>
        {[
          { title: 'استكشف', links: [['تصفح العروض', '/offers'], ['المتاجر', '/stores'], ['الأقسام', '/categories']] },
          { title: 'المساعدة', links: [['تواصل معنا', '/contact'], ['الخصوصية', '/privacy'], ['الشروط', '/terms']] },
          { title: 'للتجار', links: [['أضف متجرك', 'https://vendor.zagoffers.online'], ['لوحة التحكم', 'https://vendor.zagoffers.online']] },
        ].map((column) => (
          <div key={column.title} className="footer-column">
            <h4>{column.title}</h4>
            <ul>
              {column.links.map(([label, href]) => <li key={label}><Link prefetch={false} href={href}><RiArrowLeftLine />{label}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="site-container footer-bottom">
        <span>© 2026 ZagOffers. جميع الحقوق محفوظة.</span>
        <span><RiCustomerService2Line /> نحن هنا لمساعدتك</span>
      </div>
    </footer>
  );
}
