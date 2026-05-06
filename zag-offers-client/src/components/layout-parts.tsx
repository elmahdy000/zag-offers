"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, User, Heart, Menu, X, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    // Auth Check
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setIsLoggedIn(!!token);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${isScrolled ? 'glass h-16 shadow-lg' : 'h-20 bg-transparent'}`}>
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between" dir="rtl">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B00] to-[#D95A00] rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/20 group-hover:scale-105 transition-transform">
            <ShoppingBag className="text-white" size={22} />
          </div>
          <span className="text-xl font-black tracking-tight">Zag<span className="text-[#FF6B00]">Offers</span></span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-bold text-white/90 hover:text-[#FF6B00] transition-colors">الرئيسية</Link>
          <Link href="/categories" className="text-sm font-bold text-white/70 hover:text-[#FF6B00] transition-colors">الأقسام</Link>
          <Link href="/stores" className="text-sm font-bold text-white/70 hover:text-[#FF6B00] transition-colors">المحلات</Link>
          <Link href="/top-offers" className="text-sm font-bold text-white/70 hover:text-[#FF6B00] transition-colors">أقوى الخصومات</Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button className="p-2 text-white/70 hover:text-white transition-colors"><Search size={20} /></button>
          <Link href="/favorites" className="p-2 text-white/70 hover:text-white transition-colors relative">
            <Heart size={20} />
          </Link>
          
          <div className="h-6 w-[1px] bg-white/10 mx-1 hidden sm:block"></div>

          {isLoggedIn ? (
            <Link href="/profile" className="flex items-center gap-2 p-1 pr-3 bg-white/5 rounded-full border border-white/10 hover:border-[#FF6B00]/50 transition-all">
              <span className="text-xs font-bold hidden sm:block">حسابي</span>
              <div className="w-8 h-8 bg-[#FF6B00] rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
            </Link>
          ) : (
            <Link href="/login" className="px-5 py-2 bg-[#FF6B00] text-white text-sm font-bold rounded-full shadow-lg shadow-orange-900/20 hover:scale-105 active:scale-95 transition-all">
              دخول
            </Link>
          )}

          <button 
            className="md:hidden p-2 text-white/70"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
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
            className="md:hidden glass border-t border-white/10 overflow-hidden"
          >
            <div className="px-4 py-6 flex flex-col gap-4 text-right" dir="rtl">
              <Link href="/" className="text-lg font-bold">الرئيسية</Link>
              <Link href="/categories" className="text-lg font-bold text-white/70">الأقسام</Link>
              <Link href="/stores" className="text-lg font-bold text-white/70">المحلات</Link>
              <Link href="/top-offers" className="text-lg font-bold text-white/70">أقوى الخصومات</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/5 pt-16 pb-8" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-[#FF6B00] rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingBag className="text-white" size={22} />
            </div>
            <span className="text-2xl font-black">Zag<span className="text-[#FF6B00]">Offers</span></span>
          </Link>
          <p className="text-white/50 text-sm max-w-sm leading-relaxed mb-6">
            وجهتك الأولى لأفضل العروض والخصومات في مدينة الزقازيق. نسعى دائماً لتوفير المال والوقت لكل سكان المدينة من خلال كوبونات حصرية وعروض مميزة من أفضل المحلات والخدمات.
          </p>
          <div className="flex gap-4">
             {/* Social Placeholder icons */}
             <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#FF6B00] transition-colors cursor-pointer">f</div>
             <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#FF6B00] transition-colors cursor-pointer">𝕏</div>
             <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#FF6B00] transition-colors cursor-pointer">ig</div>
          </div>
        </div>
        
        <div>
          <h4 className="text-white font-bold mb-6">روابط سريعة</h4>
          <ul className="space-y-4 text-white/50 text-sm font-semibold">
            <li className="hover:text-[#FF6B00] cursor-pointer transition-colors">عن زقازيق أوفرز</li>
            <li className="hover:text-[#FF6B00] cursor-pointer transition-colors">كيفية استخدام الكوبونات</li>
            <li className="hover:text-[#FF6B00] cursor-pointer transition-colors">الأسئلة الشائعة</li>
            <li className="hover:text-[#FF6B00] cursor-pointer transition-colors">اتصل بنا</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">لأصحاب المحلات</h4>
          <ul className="space-y-4 text-white/50 text-sm font-semibold">
            <li className="hover:text-[#FF6B00] cursor-pointer transition-colors">سجل محلك الآن</li>
            <li className="hover:text-[#FF6B00] cursor-pointer transition-colors">دليل التجار</li>
            <li className="hover:text-[#FF6B00] cursor-pointer transition-colors">باقات الاشتراك</li>
            <li className="hover:text-[#FF6B00] cursor-pointer transition-colors">شروط الخدمة</li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-white/30 tracking-wider uppercase">
        <p>© 2026 ZAG OFFERS. جميع الحقوق محفوظة لمدينة الزقازيق.</p>
        <div className="flex gap-6">
          <span>سياسة الخصوصية</span>
          <span>شروط الاستخدام</span>
        </div>
      </div>
    </footer>
  );
}
