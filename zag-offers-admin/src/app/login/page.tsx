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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0F2F5] p-4 dir-rtl font-cairo">
      {/* Brand Section Above Card */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black text-orange-600 tracking-tighter mb-2">zag offers</h1>
        <p className="text-lg font-medium text-slate-600 max-w-sm leading-relaxed">
          سجل دخولك لإدارة العروض والمتاجر في منصة الزقازيق الأولى.
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[400px] w-full"
      >
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
          <form onSubmit={handleLogin} className="space-y-4">
            {(validationError || error) && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} />
                {validationError || error}
              </div>
            )}

            <div className="relative group/field">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-orange-600 transition-colors">
                <Smartphone size={20} />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setValidationError(null);
                }}
                className="w-full h-14 pr-12 pl-4 rounded-lg border border-slate-200 bg-white text-base font-medium text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all placeholder:text-slate-300"
                placeholder="رقم الموبايل"
                required
              />
            </div>

            <div className="relative group/field">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-orange-600 transition-colors">
                <Lock size={20} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setValidationError(null);
                }}
                className="w-full h-14 pr-12 pl-4 rounded-lg border border-slate-200 bg-white text-base font-medium text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all placeholder:text-slate-300"
                placeholder="كلمة السر"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg bg-orange-600 text-white font-bold text-lg hover:bg-orange-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'تسجيل الدخول'}
            </button>

            <div className="text-center pt-2">
              <button type="button" className="text-sm font-medium text-orange-600 hover:underline">
                نسيت كلمة السر؟
              </button>
            </div>

            <div className="border-t border-slate-100 my-4 pt-4 text-center">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                إدارة المنصة المركزية
              </p>
            </div>
          </form>
        </div>
        
        <p className="text-center mt-8 text-sm text-slate-500 font-medium">
          <b>إنشاء حساب جديد</b> للمتاجر عبر تطبيق التاجر فقط.
        </p>
      </motion.div>

      <footer className="mt-auto py-8">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          © 2026 ZAG OFFERS • ALL RIGHTS RESERVED
        </p>
      </footer>
    </div>
  );
}
