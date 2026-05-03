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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden dir-rtl font-cairo">
      {/* Precision Industrial Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e293b,0%,#020617_100%)]" />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
        
        {/* Animated Glows */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3] 
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-48 -right-48 w-96 h-96 bg-orange-600 rounded-full blur-[128px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.4, 0.2] 
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-48 -left-48 w-96 h-96 bg-blue-600 rounded-full blur-[128px]" 
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[2.5rem] shadow-[0_0_80px_-15px_rgba(0,0,0,0.5)] border border-white/5 relative overflow-hidden group">
          {/* Internal card highlight */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          
          <div className="text-center mb-10 relative">
            <motion.div 
              initial={{ rotate: -10, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 bg-orange-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_20px_50px_-10px_rgba(234,88,12,0.4)] relative"
            >
              <ShieldCheck size={40} strokeWidth={1.5} />
              <div className="absolute inset-0 rounded-3xl bg-white/20 animate-pulse" />
            </motion.div>
            <h1 className="text-4xl font-black text-white tracking-tight font-outfit uppercase">ZAG Admin</h1>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="h-px w-8 bg-slate-700" />
              <p className="text-slate-400 font-bold text-sm tracking-wide">نظام إدارة العروض</p>
              <div className="h-px w-8 bg-slate-700" />
            </div>
          </div>

          {(validationError || error) && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`flex items-start gap-3 p-4 rounded-2xl mb-8 text-sm font-bold border ${
                validationError 
                  ? 'bg-amber-500/10 text-amber-200 border-amber-500/20' 
                  : 'bg-rose-500/10 text-rose-200 border-rose-500/20'
              }`}
            >
              <div className="mt-0.5">
                {(error?.includes('اتصال') || error?.includes('إنترنت')) ? <WifiOff size={18} /> : <AlertCircle size={18} />}
              </div>
              <p>{validationError || error}</p>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2 group/field">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 transition-colors group-focus-within/field:text-orange-500">
                رقم الموبايل
              </label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/field:text-orange-500 transition-colors">
                  <Smartphone size={20} strokeWidth={1.5} />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setValidationError(null);
                  }}
                  className="w-full bg-slate-950/50 border border-slate-800 h-16 pr-12 pl-4 rounded-2xl outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/5 transition-all font-bold text-white placeholder:text-slate-700 font-outfit"
                  placeholder="01xxxxxxxxx"
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 group/field">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 transition-colors group-focus-within/field:text-orange-500">
                كلمة السر
              </label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/field:text-orange-500 transition-colors">
                  <Lock size={20} strokeWidth={1.5} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setValidationError(null);
                  }}
                  className="w-full bg-slate-950/50 border border-slate-800 h-16 pr-12 pl-4 rounded-2xl outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/5 transition-all font-bold text-white placeholder:text-slate-700 font-outfit"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 text-white h-16 rounded-2xl font-black text-lg hover:bg-orange-500 transition-all shadow-[0_20px_40px_-12px_rgba(234,88,12,0.3)] flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span>جاري التحقق...</span>
                </>
              ) : (
                <>
                  <span>تسجيل الدخول</span>
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <ShieldCheck size={18} />
                  </div>
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-12 text-center border-t border-slate-800/50 pt-8">
            <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.3em]">
              © 2026 ZAG Offers • Control Center v2.0
            </p>
          </div>
        </div>
        
        {/* Subtle decorative edge */}
        <div className="absolute -inset-[1px] bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-[2.5rem] pointer-events-none -z-10" />
      </motion.div>
    </div>
  );
}
