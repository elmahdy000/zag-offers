'use client';
import { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Smartphone, AlertCircle, WifiOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { getCookie } from '@/lib/api';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api';

const isValidEgyptianPhone = (phone: string) =>
  /^01[0125][0-9]{8}$/.test(phone.trim());

export default function AdminLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const token = getCookie('admin_token');
    if (token) router.replace('/dashboard');
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationError(null);

    if (!isValidEgyptianPhone(phone)) {
      setValidationError('أدخل رقم موبايل مصري صحيح (11 رقم يبدأ بـ 01)');
      return;
    }
    if (password.length < 6) {
      setValidationError('كلمة السر لازم تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        phone: phone.trim(),
        password,
      });
      const { access_token, user } = res.data as {
        access_token: string;
        user: { id: string; name: string; role: string };
      };

      if (user.role !== 'ADMIN') {
        setError('هذا الحساب ليس حساب أدمن. استخدم لوحة التاجر.');
        return;
      }

      const isSecure = window.location.protocol === 'https:';
      document.cookie = `admin_token=${encodeURIComponent(access_token)}; path=/; SameSite=Strict${isSecure ? '; Secure' : ''}`;
      sessionStorage.setItem('admin_user', JSON.stringify(user));

      router.replace('/dashboard');
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 400)) {
        setError('رقم الموبايل أو كلمة السر غلط');
      } else if (axios.isAxiosError(err) && !err.response) {
        setError('تعذر الاتصال بالسيرفر، تحقق من اتصالك بالإنترنت');
      } else {
        setError('حدث خطأ غير متوقع، حاول مرة أخرى');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 relative overflow-hidden dir-rtl font-cairo">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-100/50 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[440px] w-full relative z-10"
      >
        <div className="bg-white p-10 lg:p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-200 relative overflow-hidden">
          {/* Logo Section */}
          <div className="text-center mb-10">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              className="w-20 h-20 bg-orange-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-200 ring-4 ring-orange-50"
            >
              <ShieldCheck size={40} strokeWidth={1.5} />
            </motion.div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">ZAG <span className="text-orange-600">OFFERS</span></h1>
            <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">لوحة التحكم المركزية</p>
          </div>

          {(validationError || error) && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-start gap-3 p-4 rounded-xl mb-8 text-xs font-bold border ${
                validationError 
                  ? 'bg-amber-50 text-amber-700 border-amber-100' 
                  : 'bg-rose-50 text-rose-700 border-rose-100'
              }`}
            >
              <AlertCircle size={18} className="shrink-0" />
              <p>{validationError || error}</p>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Phone Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">رقم الموبايل</label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Smartphone size={18} />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setValidationError(null);
                  }}
                  className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50/50 pr-12 pl-4 text-sm font-bold text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none transition-all placeholder:text-slate-300"
                  placeholder="01xxxxxxxxx"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">كلمة السر</label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setValidationError(null);
                  }}
                  className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50/50 pr-12 pl-4 text-sm font-bold text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none transition-all placeholder:text-slate-300"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-xl bg-slate-900 text-white font-bold text-base shadow-lg shadow-slate-200 hover:bg-orange-600 transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  <span>دخول آمن</span>
                  <ShieldCheck size={20} />
                </>
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-12 text-center border-t border-slate-100 pt-8">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              ZAG OFFERS • SECURE ADMIN PORTAL
            </p>
          </div>
        </div>
        
        <p className="text-center mt-8 text-[11px] font-bold text-slate-400">
          نسيت كلمة السر؟ اتصل بالدعم الفني للمنصة
        </p>
      </motion.div>
    </div>
  );
}
