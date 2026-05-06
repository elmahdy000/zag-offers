"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, User, Heart, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

/* ─── Navbar ─────────────────────────────────────────────── */
export function Navbar() {
  const pathname = usePathname();
  const [isScrolled,      setIsScrolled]      = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn,       setIsLoggedIn]       = useState(false);

  // Update login status on mount and whenever the path changes
  useEffect(() => {
    const checkAuth = () => {
      try {
        setIsLoggedIn(!!localStorage.getItem('token'));
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // close mobile menu on route change
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
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/favorites"
            className="p-2 text-[#9A9A9A] hover:text-[#F0F0F0] transition-colors rounded-lg hover:bg-white/5"
          >
            <Heart size={19} />
          </Link>

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
            aria-label="القائمة"
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
  );
}

/* ─── Footer ─────────────────────────────────────────────── */
export function Footer() {
  return (
    <footer className="bg-[#151515] border-t border-white/[0.07] pt-14 pb-8 mt-20" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* Brand */}
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

        {/* Quick links */}
        <div>
          <h4 className="text-[#F0F0F0] font-bold mb-5">روابط سريعة</h4>
          <ul className="space-y-3 text-[#9A9A9A] text-sm font-semibold">
            {['عن زقازيق أوفرز', 'كيفية استخدام الكوبونات', 'الأسئلة الشائعة', 'اتصل بنا'].map(t => (
              <li key={t} className="hover:text-[#FF6B00] cursor-pointer transition-colors">{t}</li>
            ))}
          </ul>
        </div>

        {/* Merchant */}
        <div>
          <h4 className="text-[#F0F0F0] font-bold mb-5">لأصحاب المحلات</h4>
          <ul className="space-y-3 text-[#9A9A9A] text-sm font-semibold">
            {['سجل محلك الآن', 'دليل التجار', 'باقات الاشتراك', 'شروط الخدمة'].map(t => (
              <li key={t} className="hover:text-[#FF6B00] cursor-pointer transition-colors">{t}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
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
