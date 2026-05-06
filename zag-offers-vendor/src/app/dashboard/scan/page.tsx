'use client';
import { useState } from 'react';
import { Scan, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { vendorApi, getVendorStoreId } from '@/lib/api';

interface RedeemResult {
  offer?: { title?: string; discount?: string };
  message?: string;
}

export default function ScanPage() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const storeId = getVendorStoreId();
    // We allow proceeding even without storeId because the backend can infer it from the merchantId in JWT
    // or verify ownership of the coupon's store.

    setStatus('loading');
    setResult(null);
    setErrorMsg('');

    let finalCode = code.toUpperCase().trim();
    if (finalCode && !finalCode.startsWith('ZAG-') && finalCode.length === 6) {
      finalCode = `ZAG-${finalCode}`;
    }

    try {
      const res = await vendorApi().post<RedeemResult>('/coupons/redeem', {
        code: finalCode,
        storeId,
      });
      setResult(res.data);
      setStatus('success');
      setCode('');
    } catch (err: unknown) {
      setStatus('error');
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        axiosErr.response?.data?.message ?? 'الكود غير صحيح أو منتهي الصلاحية أو لا يخص هذا المتجر'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 text-white dir-rtl">
      <div className="max-w-md w-full">
        <button
          onClick={() => window.history.back()}
          className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          العودة
        </button>

        <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-900/20">
              <Scan size={40} />
            </div>
            <h1 className="text-2xl font-black">تحقق من الكوبون</h1>
            <p className="text-gray-400 mt-2">أدخل الكود الموجود في موبايل العميل</p>
          </div>

          <form onSubmit={handleValidate} className="space-y-6">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setStatus('idle');
              }}
              placeholder="مثلاً: ZAG-X7Y2Z"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-4 text-center text-2xl font-mono font-black tracking-[0.2em] focus:ring-2 focus:ring-orange-500 outline-none uppercase placeholder:text-white/20"
              required
            />

            <button
              type="submit"
              disabled={status === 'loading' || !code.trim()}
              className="w-full bg-orange-600 py-5 rounded-2xl font-black text-xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-900/40 disabled:opacity-50"
            >
              {status === 'loading' ? 'جاري التحقق...' : 'تأكيد الخصم'}
            </button>
          </form>

          <AnimatePresence>
            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-5 bg-green-500/20 border border-green-500/30 rounded-2xl flex items-center gap-4"
              >
                <CheckCircle2 className="text-green-500 shrink-0" size={32} />
                <div>
                  <p className="font-bold text-green-500">تم تفعيل الخصم بنجاح!</p>
                  {result?.offer?.title && (
                    <p className="text-xs text-green-200/70 mt-1">
                      العرض: {result.offer.title}
                      {result.offer.discount ? ` • ${result.offer.discount}` : ''}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-5 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center gap-4"
              >
                <AlertCircle className="text-red-500 shrink-0" size={32} />
                <div>
                  <p className="font-bold text-red-500">عفواً، فشل التحقق</p>
                  <p className="text-xs text-red-200/60 mt-1">{errorMsg}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
