'use client';
import { useState, useEffect } from 'react';
import { LayoutDashboard, Tag, TrendingUp, Plus, ScanLine, Loader2, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardSkeleton } from '@/components/Skeleton';
import { io } from 'socket.io-client';
import { vendorApi, getCookie, getVendorUser, getVendorStoreId } from '@/lib/api';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface StoreStats {
  id: string;
  name: string;
  _count: { offers: number; reviews: number };
  offers: Array<{ _count: { coupons: number } }>;
}

export default function MerchantDashboard() {
  const [loading, setLoading] = useState(true);
  const [storeStats, setStoreStats] = useState<StoreStats | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const vendorUser = getVendorUser();
  const storeId = getVendorStoreId();
  const merchantId = vendorUser?.id ?? '';
  const storeName = storeStats?.name ?? vendorUser?.name ?? 'متجرك';

  useEffect(() => {
    // تحميل إحصائيات التاجر
    vendorApi()
      .get<StoreStats[]>('/admin/stats/merchant')
      .then((res) => {
        if (res.data.length > 0) setStoreStats(res.data[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // إعداد الـ Socket.io
    const token = getCookie('auth_token');
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log('Vendor connected to socket server');
      // الانضمام لغرفة التاجر مع التوكن
      if (merchantId) {
        socket.emit('join_room', { token, userId: merchantId });
      }
    });

    // الباك-إيند يبعت merchant_notification للتاجر
    socket.on('merchant_notification', (data: { type?: string; comment?: string; offerTitle?: string; storeName?: string; message?: string }) => {
      let msg = '🔔 إشعار جديد';
      if (data.type === 'STORE_APPROVED') {
        msg = `✅ تم قبول متجرك "${data.storeName}"! يمكنك الآن إضافة عروضك.`;
      } else if (data.type === 'STORE_REJECTED') {
        msg = `❌ تم رفض متجرك "${data.storeName}". تواصل مع الإدارة.`;
      } else if (data.type === 'NEW_REVIEW') {
        msg = `🔔 تقييم جديد: ${data.comment || 'بدون تعليق'}`;
      } else if (data.type === 'OFFER_REJECTED') {
        msg = `❌ تم رفض عرضك "${data.offerTitle}"`;
      } else if (data.message) {
        msg = `📢 ${data.message}`;
      }
      setNotification(msg);
      setTimeout(() => setNotification(null), 7000);
    });

    return () => {
      socket.disconnect();
    };
  }, [merchantId]);

  const handleRedeem = async () => {
    if (!couponCode || !storeId) {
      setMessage({ type: 'error', text: '❌ لا يوجد متجر مرتبط بحسابك' });
      return;
    }
    setRedeeming(true);
    setMessage(null);

    try {
      // التوكن من الكوكي (مش localStorage)
      await vendorApi().post('/coupons/redeem', { code: couponCode, storeId });
      setMessage({ type: 'success', text: '🎉 تم تفعيل الكوبون بنجاح!' });
      setCouponCode('');
    } catch {
      setMessage({ type: 'error', text: '❌ الكود غير صحيح أو منتهي الصلاحية' });
    } finally {
      setRedeeming(false);
    }
  };

  // حساب الإحصائيات من الداتا الحقيقية
  const totalCoupons = storeStats?.offers.reduce((sum, o) => sum + (o._count?.coupons ?? 0), 0) ?? 0;
  const activeOffers = storeStats?._count?.offers ?? 0;
  const totalReviews = storeStats?._count?.reviews ?? 0;

  const stats = [
    { label: 'كوبونات مستخدمة', value: String(totalCoupons), icon: Tag, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'عروضك النشطة', value: String(activeOffers), icon: LayoutDashboard, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'إجمالي التقييمات', value: String(totalReviews), icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
  ];

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="p-10 dir-rtl max-w-6xl mx-auto animate-in fade-in duration-700 relative">

      {/* التنبيهات اللحظية */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed top-10 right-10 bg-indigo-900 text-white p-6 rounded-3xl shadow-2xl z-50 border border-white/10 flex items-center gap-4 max-w-md"
          >
            <div className="bg-white/10 p-3 rounded-2xl">
              <Bell size={24} />
            </div>
            <p className="text-sm font-bold leading-relaxed">{notification}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-2xl font-black text-gray-900">أهلاً بك، {storeName} 👋</h1>
          <p className="text-sm text-gray-400 mt-1">إليك ملخص سريع لأداء عروضك اليوم</p>
        </div>
        <button
          onClick={() => (window.location.href = '/dashboard/offers/new')}
          className="bg-orange-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-sm hover:opacity-90 transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          إضافة عرض جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {stats.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon size={24} />
            </div>
            <p className="text-gray-400 text-xs font-bold mb-1">{stat.label}</p>
            <h3 className="text-xl font-black">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* تفعيل الكوبونات */}
      <div className="bg-gray-900 rounded-[2rem] p-8 text-white max-w-md">
        <h3 className="font-bold text-lg mb-2">تفعيل الكوبونات</h3>
        <p className="text-xs text-gray-400 mb-6 leading-relaxed">
          أدخل كود العرض المقدم من العميل لتأكيد عملية الخصم فوراً.
        </p>
        {!storeId && (
          <p className="text-yellow-400 text-xs mb-4">⚠️ لم يتم ربط متجر بحسابك بعد.</p>
        )}
        <div className="space-y-4">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="مثال: ZAG-X7Y2Z"
            className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-all text-center font-bold"
          />
          <button
            disabled={redeeming || !storeId}
            onClick={handleRedeem}
            className="w-full bg-white text-gray-900 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-orange-500 hover:text-white transition-all shadow-xl shadow-black/20 disabled:opacity-50"
          >
            {redeeming ? <Loader2 className="animate-spin" /> : <ScanLine size={20} />}
            تأكيد الخصم
          </button>
          {message && (
            <div className={`mt-4 p-4 rounded-xl text-xs font-bold text-center ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
