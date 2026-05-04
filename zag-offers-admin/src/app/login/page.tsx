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
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 relative overflow-hidden dir-rtl font-cairo">
      {/* Premium Background Art */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-orange-100/40 to-transparent blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-blue-100/40 to-transparent blur-[140px]" />
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[460px] w-full relative z-10"
      >
        <div className="bg-white/70 backdrop-blur-2xl p-10 lg:p-14 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] border border-white/80 relative group">
          {/* Card Shine Effect */}
          <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
          
          {/* Brand Header */}
          <div className="text-center mb-12">
            <motion.div 
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="w-22 h-22 bg-orange-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-orange-200 ring-[12px] ring-orange-50/50 transition-transform cursor-default"
            >
              <ShieldCheck size={44} strokeWidth={1.5} />
            </motion.div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
              ZAG <span className="text-orange-600">OFFERS</span>
            </h1>
            <div className="mt-4 flex items-center justify-center gap-3">
               <span className="h-px w-6 bg-slate-200" />
               <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">بوابة التحكم المؤمنة</p>
               <span className="h-px w-6 bg-slate-200" />
            </div>
          </div>

          {(validationError || error) && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-start gap-4 p-5 rounded-2xl mb-10 text-xs font-bold bg-rose-50/80 border border-rose-100 text-rose-600 backdrop-blur-md"
            >
              <AlertCircle size={20} className="shrink-0" />
              <p className="leading-relaxed">{validationError || error}</p>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-8">
            {/* Field Container */}
            <div className="space-y-6">
              {/* Phone Input */}
              <div className="space-y-3 group/field">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 group-focus-within/field:text-orange-600 transition-colors">
                  رقم الهاتف الشخصي
                </label>
                <div className="relative">
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/field:text-orange-600 transition-colors">
                    <Smartphone size={20} strokeWidth={1.5} />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setValidationError(null);
                    }}
                    className="h-16 w-full rounded-[1.25rem] border border-slate-100 bg-slate-50/50 pr-14 pl-5 text-base font-bold text-slate-900 focus:border-orange-500/30 focus:bg-white focus:ring-[6px] focus:ring-orange-500/5 focus:outline-none transition-all placeholder:text-slate-200"
                    placeholder="01xxxxxxxxx"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-3 group/field">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 group-focus-within/field:text-orange-600 transition-colors">
                  كلمة المرور المشفرة
                </label>
                <div className="relative">
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/field:text-orange-600 transition-colors">
                    <Lock size={20} strokeWidth={1.5} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setValidationError(null);
                    }}
                    className="h-16 w-full rounded-[1.25rem] border border-slate-100 bg-slate-50/50 pr-14 pl-5 text-base font-bold text-slate-900 focus:border-orange-500/30 focus:bg-white focus:ring-[6px] focus:ring-orange-500/5 focus:outline-none transition-all placeholder:text-slate-200"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ y: -2, shadow: "0 20px 40px -12px rgba(234,88,12,0.35)" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full h-16 rounded-[1.25rem] bg-slate-900 text-white font-black text-lg shadow-2xl shadow-slate-200 hover:bg-orange-600 transition-all flex items-center justify-center gap-4 mt-6 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={28} />
              ) : (
                <>
                  <span>تأكيد الهوية والدخول</span>
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <ShieldCheck size={22} />
                  </div>
                </>
              )}
            </motion.button>
          </form>

          {/* Luxury Footer */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-slate-50/80 border border-slate-100 backdrop-blur-sm">
               <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                 System Status: <span className="text-slate-900">Encrypted & Ready</span>
               </p>
            </div>
          </div>
        </div>
        
        <div className="mt-10 flex items-center justify-center gap-6">
           <button className="text-[11px] font-bold text-slate-400 hover:text-orange-600 transition-colors uppercase tracking-widest">المساعدة</button>
           <span className="h-1 w-1 rounded-full bg-slate-200" />
           <button className="text-[11px] font-bold text-slate-400 hover:text-orange-600 transition-colors uppercase tracking-widest">الشروط</button>
           <span className="h-1 w-1 rounded-full bg-slate-200" />
           <button className="text-[11px] font-bold text-slate-400 hover:text-orange-600 transition-colors uppercase tracking-widest">الخصوصية</button>
        </div>
      </motion.div>
    </div>
  );
}
