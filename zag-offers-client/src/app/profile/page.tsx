"use client";

import React, { useState, useEffect } from 'react';
import { User, Smartphone, LogOut, Ticket, Heart, Settings, ChevronLeft, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  name: string;
  phone: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setTimeout(() => setUser(JSON.parse(savedUser)), 0);
    } else {
      router.replace('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.replace('/login');
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10" dir="rtl">
      {/* Profile Header */}
      <div className="glass rounded-[40px] p-8 sm:p-12 mb-8 relative overflow-hidden text-center sm:text-right">
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#FF6B00]/5 blur-[100px] -z-10" />
        
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <div className="w-24 h-24 bg-[#FF6B00] rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-orange-900/40">
            <User size={48} />
          </div>
          
          <div className="flex-1 space-y-2">
            <h1 className="text-3xl font-black">{user.name}</h1>
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-white/40 text-sm font-bold">
              <div className="flex items-center gap-1.5"><Smartphone size={16} className="text-[#FF6B00]" /> {user.phone}</div>
              <div className="flex items-center gap-1.5"><Shield size={16} className="text-[#FF6B00]" /> حساب عميل نشط</div>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all"
          >
            <LogOut size={18} /> تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Profile Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-black mr-2 mb-4">الوصول السريع</h3>
          
          <a href="/profile/coupons" className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-[24px] hover:border-[#FF6B00]/40 hover:bg-white/10 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FF6B00]/10 rounded-xl flex items-center justify-center text-[#FF6B00] group-hover:scale-110 transition-transform"><Ticket size={24} /></div>
              <div>
                <h4 className="font-black text-white">كوبوناتي</h4>
                <p className="text-xs font-bold text-white/30 uppercase tracking-widest">تاريخ الخصومات</p>
              </div>
            </div>
            <ChevronLeft className="text-white/20" />
          </a>

          <a href="/favorites" className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-[24px] hover:border-[#FF6B00]/40 hover:bg-white/10 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform"><Heart size={24} /></div>
              <div>
                <h4 className="font-black text-white">المفضلة</h4>
                <p className="text-xs font-bold text-white/30 uppercase tracking-widest">العروض المحفوظة</p>
              </div>
            </div>
            <ChevronLeft className="text-white/20" />
          </a>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-black mr-2 mb-4">الإعدادات</h3>
          
          <Link href="/profile/edit" className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-[24px] hover:border-[#FF6B00]/40 hover:bg-white/10 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-white/80 group-hover:text-[#FF6B00] group-hover:scale-110 transition-transform"><Settings size={24} /></div>
              <div>
                <h4 className="font-black text-white">تعديل البيانات</h4>
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest">تحديث الملف الشخصي</p>
              </div>
            </div>
            <ChevronLeft className="text-white/20" />
          </Link>

          {/* Contact & Support */}
          <Link href="/contact" className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-[24px] hover:border-[#FF6B00]/40 hover:bg-white/10 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-white/80 group-hover:text-[#FF6B00] group-hover:scale-110 transition-transform"><Smartphone size={24} /></div>
              <div>
                <h4 className="font-black text-white">تواصل معنا</h4>
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest">الدعم الفني والمساعدة</p>
              </div>
            </div>
            <ChevronLeft className="text-white/20" />
          </Link>

          {/* Legal Links */}
          <div className="flex items-center justify-between gap-4 px-2">
            <Link href="/terms" className="text-xs font-bold text-white/40 hover:text-white transition-colors">الشروط والأحكام</Link>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <Link href="/privacy" className="text-xs font-bold text-white/40 hover:text-white transition-colors">سياسة الخصوصية</Link>
          </div>

          <div className="p-6 bg-gradient-to-br from-orange-600/20 to-orange-900/20 border border-[#FF6B00]/20 rounded-[24px] mt-4">
             <h4 className="font-black text-white mb-2">انضم لبرنامج الولاء 🌟</h4>
             <p className="text-xs font-bold text-white/50 leading-relaxed">قريباً ستتمكن من جمع النقاط مع كل كوبون تستخدمه واستبدالها بهدايا قيمة.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
