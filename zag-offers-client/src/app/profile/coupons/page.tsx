import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Clock, CheckCircle2, ShoppingBag, ArrowRight, X, QrCode } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { API_URL } from '@/lib/constants';
import { QRCodeSVG } from 'qrcode.react';

interface Coupon {
  id: string;
  code: string;
  isRedeemed: boolean;
  offer?: {
    id: string;
    title: string;
    discount: string;
    store?: {
      id: string;
      name: string;
    };
  };
}

export default function MyCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
      if (!token) {
        setLoading(false);
        return;
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
              className="group relative glass p-6 rounded-[24px] overflow-hidden border-r-4 border-r-[#FF6B00] cursor-pointer"
              onClick={() => setSelectedCoupon(coupon)}
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

                <div className="flex flex-row items-center gap-4">
                  {/* Small QR Preview */}
                  {!coupon.isRedeemed && (
                    <div className="hidden sm:block p-2 bg-white rounded-xl">
                      <QRCodeSVG value={coupon.code} size={40} />
                    </div>
                  )}
                  
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
                          <Clock size={10} /> صالح للاستخدام (اضغط للمسح)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detail Link - Prevent trigger selectedCoupon */}
              <div 
                className="absolute top-4 left-4 p-2 text-white/20 hover:text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/offers/${coupon.offer?.id}`;
                }}
              >
                <ArrowRight size={18} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      <AnimatePresence>
        {selectedCoupon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedCoupon(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-[40px] p-8 w-full max-w-sm text-center"
            >
              <button 
                onClick={() => setSelectedCoupon(null)}
                className="absolute top-6 right-6 w-10 h-10 bg-black/5 rounded-full flex items-center justify-center text-black/40 hover:text-black transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mt-4 mb-6">
                <div className="w-20 h-20 bg-[#FF6B00]/10 rounded-[24px] flex items-center justify-center text-[#FF6B00] mx-auto mb-4">
                  <QrCode size={40} />
                </div>
                <h3 className="text-2xl font-black text-black">كود التفعيل</h3>
                <p className="text-black/40 text-sm font-bold mt-1">أظهر هذا الكود للتاجر للحصول على الخصم</p>
              </div>

              <div className="bg-white p-6 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] inline-block mb-6 border-2 border-black/5">
                <QRCodeSVG value={selectedCoupon.code} size={200} includeMargin={true} />
              </div>

              <div className="space-y-2">
                <div className="bg-black/5 py-4 rounded-2xl">
                  <span className="text-2xl font-black tracking-[0.2em] text-black">{selectedCoupon.code}</span>
                </div>
                <p className="text-[11px] font-bold text-black/30 uppercase tracking-widest">Store: {selectedCoupon.offer?.store?.name}</p>
              </div>

              <button 
                onClick={() => setSelectedCoupon(null)}
                className="mt-8 w-full py-4 bg-black text-white font-black rounded-2xl hover:bg-black/90 transition-all"
              >
                إغلاق
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
