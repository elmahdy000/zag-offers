'use client';

import { useState } from 'react';
import { Smartphone, Lock, Eye, EyeOff, Loader2, LogIn, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online').replace(/\/$/, '') + '/api';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // تحقق من صيغة رقم الموبايل المصري
    const phoneRegex = /^01[0125][0-9]{8}$/;
    if (!phoneRegex.test(phone.trim())) {
      setError('يرجى إدخال رقم موبايل مصري صحيح');
      setLoading(false);
      return;
    }

    // تحقق من طول كلمة المرور
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/auth/login`, { phone, password });
      const { access_token, user } = res.data as {
        access_token: string;
        user: { id: string; name: string; role: string };
      };

      if (user.role !== 'MERCHANT' && user.role !== 'ADMIN') {
        setError('هذا الحساب ليس حساب تاجر. استخدم تطبيق الموبايل.');
        setLoading(false);
        return;
      }

      document.cookie = `auth_token=${encodeURIComponent(access_token)}; path=/; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
      localStorage.setItem('vendor_user', JSON.stringify(user));

      try {
        const statsRes = await axios.get(`${API_URL}/stores/my-dashboard`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        const stats = statsRes.data as { storeId: string };
        if (stats.storeId) {
          localStorage.setItem('vendor_store_id', stats.storeId);
        }
      } catch { }

      router.push('/dashboard');
    } catch {
      setError('بيانات الدخول غير صحيحة. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-bg" dir="rtl">
      {/* Background Accents */}
      <div className="absolute top-0 inset-x-0 h-[50vh] bg-gradient-to-b from-primary/10 to-transparent -z-10" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/5 blur-[100px] rounded-full -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[380px]"
      >
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 border border-primary/20 mb-4 inner-shadow">
            <LogIn className="text-primary" size={28} />
          </div>
          <h1 className="text-2xl font-black text-text tracking-tight">بوابة التُجار</h1>
          <p className="text-text-dim text-[13px] font-bold mt-1">Zag Offers Merchant Hub</p>
        </div>

        <div className="glass p-8 rounded-[2.5rem] relative overflow-hidden border border-white/5 inner-shadow">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-black text-center"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-dim mr-1 uppercase tracking-widest">رقم الموبايل</label>
              <div className="relative group">
                <Smartphone className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-colors" size={16} />
                <input 
                  type="tel" 
                  autoFocus
                  placeholder="01xxxxxxxxx"
                  className="w-full bg-bg2/50 border border-white/5 rounded-xl px-12 py-3 text-sm font-bold text-text focus:border-primary outline-none transition-all placeholder:text-text-dimmer"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-dim mr-1 uppercase tracking-widest">كلمة المرور</label>
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-colors" size={16} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••"
                  className="w-full bg-bg2/50 border border-white/5 rounded-xl px-12 py-3 text-sm font-bold text-text focus:border-primary outline-none transition-all placeholder:text-text-dimmer"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim hover:text-text transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-lt active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-[15px] mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  تسجيل الدخول
                  <ChevronLeft size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-[11px] text-text-dim font-bold uppercase tracking-[0.2em]">
          Zag Offers © 2024
        </p>
      </motion.div>
    </div>
  );
}

