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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0F2F5] p-4 dir-ltr font-cairo">
      {/* Brand Section Above Card */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black text-orange-600 tracking-tighter mb-2 italic">zag offers</h1>
        <p className="text-lg font-bold text-slate-600 max-w-sm leading-relaxed">
          Sign in to manage offers and stores in the #1 platform.
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[400px] w-full"
      >
        <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200">
          <form onSubmit={handleLogin} className="space-y-5">
            {(validationError || error) && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-3">
                <AlertCircle size={18} className="shrink-0" />
                {validationError || error}
              </div>
            )}

            <div className="relative group/field">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-orange-600 transition-colors">
                <Smartphone size={20} />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setValidationError(null);
                }}
                className="w-full h-14 pl-12 pr-4 rounded-xl border border-slate-200 bg-white text-base font-semibold text-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 focus:outline-none transition-all placeholder:text-slate-300"
                placeholder="Phone Number"
                required
              />
            </div>

            <div className="relative group/field">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-orange-600 transition-colors">
                <Lock size={20} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setValidationError(null);
                }}
                className="w-full h-14 pl-12 pr-4 rounded-xl border border-slate-200 bg-white text-base font-semibold text-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 focus:outline-none transition-all placeholder:text-slate-300"
                placeholder="Password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-xl bg-slate-900 text-white font-black text-lg hover:bg-orange-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-slate-200"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : 'Login Now'}
            </button>

            <div className="text-center pt-2">
              <button type="button" className="text-sm font-bold text-orange-600 hover:underline">
                Forgot Password?
              </button>
            </div>

            <div className="border-t border-slate-100 my-4 pt-5 text-center">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                Central Admin Control
              </p>
            </div>
          </form>
        </div>
        
        <p className="text-center mt-10 text-sm text-slate-500 font-bold">
          <span className="text-slate-400">Merchant Account?</span> <Link href="#" className="text-orange-600 hover:underline">Download App</Link>
        </p>
      </motion.div>

      <footer className="mt-auto py-8">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          © 2026 ZAG OFFERS • SECURE PORTAL
        </p>
      </footer>
    </div>
  );
}
