"use client";

import React, { useState, useEffect } from 'react';
import { User, Smartphone, LogOut, Ticket, Heart, Settings, ChevronLeft, Shield, MessageCircle } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        router.replace('/login');
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 py-10" 
      dir="rtl"
    >
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
        {/* Quick Access Group */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-white/30 mr-2 uppercase tracking-[0.2em]">الوصول السريع</h3>
          
          <Link href="/coupons" className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-[28px] hover:border-[#FF6B00]/40 hover:bg-white/10 transition-all group min-h-[90px]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#FF6B00]/10 rounded-2xl flex items-center justify-center text-[#FF6B00] group-hover:scale-110 transition-transform"><Ticket size={26} /></div>
              <div>
                <h4 className="font-black text-white text-base">كوبوناتي</h4>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">تاريخ الخصومات</p>
              </div>
            </div>
            <ChevronLeft className="text-white/20 group-hover:text-[#FF6B00] group-hover:translate-x-[-4px] transition-all" />
          </Link>

          <Link href="/favorites" className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-[28px] hover:border-[#FF6B00]/40 hover:bg-white/10 transition-all group min-h-[90px]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform"><Heart size={26} /></div>
              <div>
                <h4 className="font-black text-white text-base">المفضلة</h4>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">العروض المحفوظة</p>
              </div>
            </div>
            <ChevronLeft className="text-white/20 group-hover:text-red-500 group-hover:translate-x-[-4px] transition-all" />
          </Link>
        </div>

        {/* Settings Group */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-white/30 mr-2 uppercase tracking-[0.2em]">الإعدادات والدعم</h3>
          
          <Link href="/profile/edit" className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-[28px] hover:border-[#FF6B00]/40 hover:bg-white/10 transition-all group min-h-[90px]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white/80 group-hover:text-[#FF6B00] group-hover:scale-110 transition-transform"><Settings size={26} /></div>
              <div>
                <h4 className="font-black text-white text-base">تعديل البيانات</h4>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-0.5">تحديث الملف الشخصي</p>
              </div>
            </div>
            <ChevronLeft className="text-white/20 group-hover:text-[#FF6B00] group-hover:translate-x-[-4px] transition-all" />
          </Link>

          <Link href="/contact" className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-[28px] hover:border-[#FF6B00]/40 hover:bg-white/10 transition-all group min-h-[90px]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white/80 group-hover:text-[#FF6B00] group-hover:scale-110 transition-transform"><MessageCircle size={26} /></div>
              <div>
                <h4 className="font-black text-white text-base">تواصل معنا</h4>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-0.5">الدعم الفني والمساعدة</p>
              </div>
            </div>
            <ChevronLeft className="text-white/20 group-hover:text-[#FF6B00] group-hover:translate-x-[-4px] transition-all" />
          </Link>
        </div>

        {/* Loyalty Banner - Spans Full Width */}
        <div className="col-span-full mt-2">
          <div className="relative overflow-hidden p-8 bg-gradient-to-br from-orange-600/20 via-orange-900/10 to-transparent border border-[#FF6B00]/20 rounded-[32px] group">
            <div className="absolute top-0 left-0 w-32 h-32 bg-[#FF6B00]/10 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-right">
                <h4 className="text-xl font-black text-white mb-2 flex items-center justify-center sm:justify-start gap-2">
                  برنامج الولاء <span className="text-2xl">🌟</span>
                </h4>
                <p className="text-sm font-bold text-white/50 leading-relaxed max-w-md">
                  قريباً ستتمكن من جمع النقاط مع كل كوبون تستخدمه واستبدالها بهدايا قيمة وحصرية.
                </p>
              </div>
              <div className="px-6 py-3 bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-2xl text-[#FF6B00] font-black text-xs uppercase tracking-tighter">
                قريباً جداً
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Footer */}
      <div className="flex flex-wrap items-center justify-center gap-6 px-2 mt-8 opacity-40 hover:opacity-100 transition-opacity">
        <Link href="/terms" className="text-[10px] font-black uppercase tracking-widest hover:text-[#FF6B00] transition-colors">الشروط والأحكام</Link>
        <div className="w-1 h-1 rounded-full bg-white/20" />
        <Link href="/privacy" className="text-[10px] font-black uppercase tracking-widest hover:text-[#FF6B00] transition-colors">سياسة الخصوصية</Link>
        <div className="w-1 h-1 rounded-full bg-white/20" />
        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Zag Offers v2.0</p>
      </div>
    </motion.div>
  );
}
