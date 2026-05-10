"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Clock, CheckCircle2, AlertCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { API_URL } from '@/lib/constants';

interface Coupon {
  id: string;
  code: string;
  isRedeemed: boolean;
  offer?: {
    id: string;
    title: string;
    discount: string;
    store?: {
      name: string;
    };
  };
}

export default function MyCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // null = checking

  useEffect(() => {
    const fetchCoupons = async () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
      if (!token) {
        setLoading(false);
        return; // will show login prompt below
      }

      try {
        const res = await axios.get(`${API_URL}/coupons/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCoupons(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchCoupons();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10" dir="rtl">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black mb-2">كوبوناتي</h1>
          <p className="text-white/40 text-sm font-bold">هنا تجد جميع الكوبونات التي حصلت عليها</p>
        </div>
        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-[#FF6B00] border border-white/10">
          <Ticket size={24} />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-white/5 rounded-[24px] animate-pulse" />)}
        </div>
      ) : isLoggedIn === false ? (
        /* Not logged in — show login prompt instead of empty/stuck state */
        <div className="text-center py-20 glass rounded-[32px]">
          <Ticket className="mx-auto text-white/10 mb-4" size={64} />
          <h3 className="text-xl font-black mb-2">يرجى تسجيل الدخول</h3>
          <p className="text-white/40 text-sm font-bold mb-8">سجّل دخولك لترى كوبوناتك وخصوماتك</p>
          <Link href="/login" className="px-8 py-3 bg-[#FF6B00] text-white font-black rounded-full shadow-lg">
            تسجيل الدخول
          </Link>
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-20 glass rounded-[32px]">
          <ShoppingBag className="mx-auto text-white/10 mb-4" size={64} />
          <h3 className="text-xl font-black mb-2">لا توجد كوبونات بعد</h3>
          <p className="text-white/40 text-sm font-bold mb-8">ابدأ بتصفح العروض واحصل على خصوماتك الأولى</p>
          <Link href="/" className="px-8 py-3 bg-[#FF6B00] text-white font-black rounded-full shadow-lg">
            تصفح العروض
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {coupons.map((coupon) => (
            <motion.div 
              key={coupon.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative glass p-6 rounded-[24px] overflow-hidden border-r-4 border-r-[#FF6B00]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-black/40 rounded-2xl flex flex-col items-center justify-center border border-white/5">
                    <span className="text-[10px] font-black text-[#FF6B00] uppercase">خصم</span>
                    <span className="text-lg font-black">{coupon.offer?.discount || '%'}</span>
                  </div>
                  <div>
                    <h4 className="font-black text-white group-hover:text-[#FF6B00] transition-colors">{coupon.offer?.title}</h4>
                    <p className="text-xs font-bold text-white/40 mt-1">🏪 {coupon.offer?.store?.name}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                    <Ticket size={14} className="text-[#FF6B00]" />
                    <span className="text-sm font-black tracking-widest">{coupon.code}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {coupon.isRedeemed ? (
                      <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-1 rounded-md flex items-center gap-1">
                        <CheckCircle2 size={10} /> تم الاستخدام
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-2 py-1 rounded-md flex items-center gap-1">
                        <Clock size={10} /> صالح للاستخدام
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Detail Link */}
              <Link href={`/offers/${coupon.offer?.id}`} className="absolute top-4 left-4 p-2 text-white/20 hover:text-white transition-colors">
                <ArrowRight size={18} />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
