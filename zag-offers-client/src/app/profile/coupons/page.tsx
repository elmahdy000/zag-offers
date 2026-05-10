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
      phone?: string;
      whatsapp?: string;
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

              <div className="space-y-4">
                <div className="bg-black/5 py-4 rounded-2xl relative group">
                  <span className="text-2xl font-black tracking-[0.2em] text-black">{selectedCoupon.code}</span>
                  <p className="text-[10px] font-bold text-black/30 mt-1 uppercase">كود الكوبون الرقمي</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={async () => {
                      if (!selectedCoupon) return;
                      const text = `مرحباً، أود تفعيل كوبون خصم تطبيق عروض الزقازيق:\n\n🏷️ العرض: ${selectedCoupon.offer?.title}\n🏪 المحل: ${selectedCoupon.offer?.store?.name}\n🔑 الكود: ${selectedCoupon.code}\n\nشكراً لكم!`;
                      let phone = selectedCoupon.offer?.store?.whatsapp || selectedCoupon.offer?.store?.phone || '';
                      if (phone.startsWith('01')) phone = '2' + phone;
                      
                      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
                      
                      // Notify Merchant via API first
                      try {
                        const token = localStorage.getItem('token');
                        if (token) {
                          fetch(`${API_URL}/coupons/${selectedCoupon.id}/notify-share`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` }
                          }).catch(() => {});
                        }
                      } catch { /* silent */ }

                      window.open(whatsappUrl, '_blank');
                    }}
                    className="flex items-center justify-center gap-2 py-4 bg-[#25D366] text-white font-black rounded-2xl hover:scale-[1.02] transition-all shadow-lg shadow-[#25D366]/20"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    واتساب
                  </button>
                  <button 
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'كوبون خصم ZagOffers',
                          text: `كود الكوبون الخاص بي هو: ${selectedCoupon.code} لعرض ${selectedCoupon.offer?.title}`,
                        });
                      } else {
                        navigator.clipboard.writeText(selectedCoupon.code);
                        alert('تم نسخ الكود بنجاح');
                      }
                    }}
                    className="flex items-center justify-center gap-2 py-4 bg-black text-white font-black rounded-2xl hover:scale-[1.02] transition-all shadow-lg shadow-black/10"
                  >
                    <ArrowRight size={18} className="-rotate-45" />
                    مشاركة
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setSelectedCoupon(null)}
                className="mt-6 w-full py-3 text-black/40 font-bold hover:text-black transition-all"
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
