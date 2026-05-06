'use client';

import { useState } from 'react';
import { LogIn, Smartphone, Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online').replace(/\/$/, '') + '/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidEgyptianPhone = (p: string) => /^01[0125][0-9]{8}$/.test(p.trim());

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidEgyptianPhone(phone)) {
      setError('يرجى إدخال رقم موبايل مصري صحيح');
      return;
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        phone: phone.trim(),
        password,
      });
      const { access_token, user } = res.data;

      if (user.role !== 'ADMIN') {
        setError('عذراً، هذا الحساب غير مصرح له بدخول لوحة الإدارة');
        setLoading(false);
        return;
      }

      const isSecure = window.location.protocol === 'https:';
      document.cookie = `admin_token=${encodeURIComponent(access_token)}; path=/; SameSite=Strict${isSecure ? '; Secure' : ''}`;
      sessionStorage.setItem('admin_user', JSON.stringify(user));

      router.replace('/dashboard');
    } catch (err: any) {
      setError('بيانات الدخول غير صحيحة أو توجد مشكلة في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-4" dir="rtl">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
        body { font-family: 'Cairo', sans-serif; }
        .glass {
          background: rgba(25, 25, 25, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
      `}</style>

      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FF6B00]/10 blur-[120px] rounded-full" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#FF6B00]/5 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass p-10 rounded-[2.5rem] relative z-10 shadow-2xl shadow-black/60"
      >
        {/* Logo & Heading */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-[#FF6B00]/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[#FF6B00]/20">
            <ShieldCheck className="text-[#FF6B00]" size={40} />
          </div>
          <h1 className="text-3xl font-black text-white leading-tight">لوحة الإدارة المركزية</h1>
          <p className="text-white/40 text-sm mt-2 font-bold uppercase tracking-widest">Zag Offers Admin</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-2xl px-5 py-4 mb-8"
          >
            <AlertCircle size={18} className="shrink-0" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-white/30 mr-2 uppercase tracking-widest">رقم الموبايل</label>
            <div className="relative group">
              <Smartphone className="absolute right-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#FF6B00] transition-colors" size={20} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pr-14 pl-4 text-white focus:border-[#FF6B00] outline-none transition-all text-base font-bold placeholder:text-white/5"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-white/30 mr-2 uppercase tracking-widest">كلمة المرور</label>
            <div className="relative group">
              <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#FF6B00] transition-colors" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pr-14 pl-14 text-white focus:border-[#FF6B00] outline-none transition-all text-base font-bold placeholder:text-white/5"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF6B00] text-white py-5 rounded-2xl font-black text-base shadow-xl shadow-orange-950/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : (
              <>
                <span>تسجيل الدخول للنظام</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-12 text-center pt-8 border-t border-white/5">
          <button 
            type="button"
            onClick={() => { setPhone('01000000000'); setPassword('password123'); }}
            className="text-white/20 text-xs font-black uppercase tracking-widest hover:text-[#FF6B00] transition-colors"
          >
            استخدام الحساب التجريبي للأدمن
          </button>
        </div>
      </motion.div>
    </div>
  );
}

