'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiTicket2Fill, RiTimeLine, RiCheckboxCircleFill, 
  RiShoppingBag3Fill, RiArrowRightLine, RiCloseLine, 
  RiQrCodeLine, RiShareLine 
} from 'react-icons/ri';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ErrorDisplay, safeJsonParse } from '@/components/error-display';
import { useNotifications } from '@/components/notification-provider';
import { API_URL } from '@/lib/constants';
import { QRCodeSVG } from 'qrcode.react';
import { BadgePercent, ShieldCheck, Sparkles, WalletCards, Copy, ArrowLeft } from 'lucide-react';

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

function getCouponDiscountDisplay(value?: string) {
  const raw = String(value || '').trim();
  if (!raw) return { label: 'خصم', value: 'عرض' };
  const isSaving = raw.includes('وفر');
  const cleaned = raw.replace(/\bخصم\b/g, '').replace('خصم', '').replace('وفر', '').trim();
  return { label: isSaving ? 'وفّر' : 'خصم', value: cleaned || raw };
}

export default function MyCouponsPage() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'used'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
      if (!token) {
        setLoading(false);
        return;
      }

      const cached = safeJsonParse<Coupon[]>(localStorage.getItem('cache_my_coupons'), []);
      if (cached.length > 0) {
        setCoupons(cached);
        setLoading(false);
      }

      try {
        const res = await axios.get(`${API_URL}/coupons/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCoupons(res.data);
        localStorage.setItem('cache_my_coupons', JSON.stringify(res.data));
        setError(null);
      } catch (e) { 
        console.error('Offline or server error:', e); 
        if (!cached.length) {
          setError('فشل تحميل الكوبونات. يرجى التأكد من اتصالك بالإنترنت.');
        }
      } finally { 
        setLoading(false); 
      }
    };
    fetchCoupons();

    // Re-fetch when coming back online
    const handleOnline = () => fetchCoupons();
    const handleOffline = () => undefined;
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const activeCoupons = coupons.filter(coupon => !coupon.isRedeemed);
  const usedCoupons = coupons.filter(coupon => coupon.isRedeemed);
  const visibleCoupons = activeFilter === 'active' ? activeCoupons : activeFilter === 'used' ? usedCoupons : coupons;

  const copyCouponCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    addNotification('تم النسخ', 'تم نسخ كود الكوبون بنجاح');
    window.setTimeout(() => setCopiedCode(null), 1800);
  };

  return (
    <div className="coupon-wallet-page" dir="rtl">
      <section className="coupon-wallet-hero">
        <div className="site-container coupon-wallet-hero-inner">
          <div className="coupon-wallet-copy">
            <span className="coupon-wallet-kicker"><Sparkles size={14}/> محفظة التوفير الخاصة بك</span>
            <h1>كوبوناتك في مكان واحد</h1>
            <p>احتفظ بكل خصوماتك، اعرض رمز QR للتاجر، واستمتع بتجربة استخدام أسرع.</p>
          </div>
          <div className="coupon-wallet-visual" aria-hidden="true"><WalletCards size={52}/><span>MY WALLET</span><b>{activeCoupons.length}</b><small>كوبون جاهز</small></div>
        </div>
      </section>

      <div className="site-container coupon-wallet-content">
        {isLoggedIn && !loading && (
          <div className="coupon-stats">
            <div><span className="coupon-stat-icon"><RiTicket2Fill/></span><p><small>كل الكوبونات</small><strong>{coupons.length}</strong></p></div>
            <div><span className="coupon-stat-icon is-active"><BadgePercent/></span><p><small>جاهزة للاستخدام</small><strong>{activeCoupons.length}</strong></p></div>
            <div><span className="coupon-stat-icon is-used"><RiCheckboxCircleFill/></span><p><small>تم استخدامها</small><strong>{usedCoupons.length}</strong></p></div>
            <div className="coupon-trust"><ShieldCheck/><span><b>استخدام آمن</b><small>كود فريد لكل كوبون</small></span></div>
          </div>
        )}

      {loading ? (
        <div className="coupon-grid">
          {[1,2,3,4].map(i => <div key={i} className="h-72 bg-white/5 rounded-[24px] animate-pulse" />)}
        </div>
      ) : error ? (
        <ErrorDisplay message={error} onRetry={() => window.location.reload()} />
      ) : isLoggedIn === false ? (
        <div className="coupon-empty-state">
          <div className="coupon-empty-icon"><RiTicket2Fill size={42} /></div>
          <h3 className="text-xl font-black mb-2">يرجى تسجيل الدخول</h3>
          <p className="text-white/40 text-sm font-bold mb-8">سجّل دخولك لترى كوبوناتك وخصوماتك</p>
          <Link href="/login" className="coupon-primary-link">
            تسجيل الدخول
          </Link>
        </div>
      ) : coupons.length === 0 ? (
        <div className="coupon-empty-state">
          <div className="coupon-empty-icon"><RiShoppingBag3Fill size={42} /></div>
          <h3 className="text-xl font-black mb-2">لا توجد كوبونات بعد</h3>
          <p className="text-white/40 text-sm font-bold mb-8">ابدأ بتصفح العروض واحصل على خصوماتك الأولى</p>
          <Link href="/offers" className="coupon-primary-link">
            اكتشف العروض <ArrowLeft size={17}/>
          </Link>
        </div>
      ) : (
        <div>
          <div className="coupon-toolbar">
            <div><h2>محفظة الكوبونات</h2><p>اختر كوبونًا لعرض رمز التفعيل</p></div>
            <div className="coupon-tabs">
              <button className={activeFilter === 'all' ? 'is-active' : ''} onClick={() => setActiveFilter('all')}>الكل <span>{coupons.length}</span></button>
              <button className={activeFilter === 'active' ? 'is-active' : ''} onClick={() => setActiveFilter('active')}>الجاهزة <span>{activeCoupons.length}</span></button>
              <button className={activeFilter === 'used' ? 'is-active' : ''} onClick={() => setActiveFilter('used')}>المستخدمة <span>{usedCoupons.length}</span></button>
            </div>
          </div>
          {visibleCoupons.length === 0 ? <div className="coupon-filter-empty">لا توجد كوبونات في هذا القسم</div> : <div className="coupon-grid">
          {visibleCoupons.map((coupon) => (
            <motion.div 
              key={coupon.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`coupon-ticket-card ${coupon.isRedeemed ? 'is-redeemed' : ''}`}
              onClick={() => setSelectedCoupon(coupon)}
            >
              <div className="coupon-ticket-top">
                <span className="coupon-status">{coupon.isRedeemed ? <><RiCheckboxCircleFill/> تم الاستخدام</> : <><RiTimeLine/> جاهز للاستخدام</>}</span>
                <button aria-label="فتح تفاصيل العرض" onClick={(e) => { e.stopPropagation(); if (coupon.offer?.id) router.push(`/offers/${coupon.offer.id}`); }}><RiArrowRightLine/></button>
              </div>
              <div className="coupon-ticket-offer">
                <div className="coupon-discount"><small>{getCouponDiscountDisplay(coupon.offer?.discount).label}</small><strong>{getCouponDiscountDisplay(coupon.offer?.discount).value}</strong></div>
                <div><p>{coupon.offer?.store?.name || 'Zag Offers'}</p><h3>{coupon.offer?.title || 'كوبون خصم مميز'}</h3></div>
              </div>

                <div className="coupon-ticket-code-row">
                  {!coupon.isRedeemed && (
                    <div className="coupon-mini-qr">
                      <QRCodeSVG value={coupon.code} size={54} fgColor="#071426" />
                    </div>
                  )}
                  <div className="coupon-code-copy"><small>كود الكوبون</small><strong>{coupon.code}</strong></div>
                  <button className="coupon-copy-button" onClick={(e) => { e.stopPropagation(); copyCouponCode(coupon.code); }}><Copy size={16}/>{copiedCode === coupon.code ? 'تم النسخ' : 'نسخ'}</button>
                </div>
                <div className="coupon-ticket-footer">
                  <span><RiQrCodeLine/> اضغط لعرض QR</span>
                  <span>صالح لمرة واحدة</span>
                </div>
            </motion.div>
          ))}
          </div>}
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
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="coupon-redeem-modal"
            >
              {/* Background Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#FF6B00]/10 blur-[80px] -z-10" />

              <button 
                onClick={() => setSelectedCoupon(null)}
                className="absolute top-6 right-6 w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors border border-white/5"
              >
                <RiCloseLine size={20} />
              </button>

              <div className="coupon-modal-heading">
                <div className="coupon-modal-icon">
                  <RiQrCodeLine size={40} />
                </div>
                <h3 className="text-2xl font-black text-white">كود التفعيل</h3>
                <p className="text-white/40 text-sm font-bold mt-1">اعرض الكود للتاجر لتفعيل الخصم</p>
              </div>

              <div className="coupon-modal-ticket">
                <span>امسح الكود لدى التاجر</span>
                <div className="coupon-modal-qr"><QRCodeSVG value={selectedCoupon.code} size={190} includeMargin={true} fgColor="#071426" /></div>
                <strong>{selectedCoupon.code}</strong>
                <small>{selectedCoupon.offer?.store?.name}</small>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={async () => {
                      if (!selectedCoupon) return;
                      const text = `مرحباً، أود تفعيل كوبون خصم تطبيق عروض الزقازيق:\n\nالعرض: ${selectedCoupon.offer?.title}\nالمحل: ${selectedCoupon.offer?.store?.name}\nالكود: ${selectedCoupon.code}\n\nشكراً لكم!`;
                      let p = selectedCoupon.offer?.store?.whatsapp || selectedCoupon.offer?.store?.phone || '';
                      p = p.replace(/\D/g, '');
                      let phone = '';
                      if (p.startsWith('01')) phone = '+20' + p.substring(1);
                      else if (p.startsWith('20')) phone = '+' + p;
                      else phone = '+' + p;
                      
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
                        addNotification('تم النسخ', 'تم نسخ كود الكوبون بنجاح');
                      }
                    }}
                    className="flex items-center justify-center gap-2 py-4 bg-black text-white font-black rounded-2xl hover:scale-[1.02] transition-all shadow-lg shadow-black/10"
                  >
                    <RiShareLine size={18} />
                    مشاركة
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setSelectedCoupon(null)}
                className="mt-6 w-full py-3 text-white/40 font-bold hover:text-white transition-all"
              >
                إغلاق
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
