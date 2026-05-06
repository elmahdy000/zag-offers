'use client';
import { useState } from 'react';
import { LogIn, Smartphone, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online').replace(/\/$/, '') + '/api';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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

      document.cookie = `auth_token=${encodeURIComponent(access_token)}; path=/; SameSite=Lax`;
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
      setError('رقم الموبايل أو كلمة السر غلط');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4 dir-rtl">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass p-10 rounded-[3rem] relative z-10 border-white/5 shadow-2xl shadow-black/40"
      >
        {/* Logo & Heading */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-primary/20 group">
            <LogIn className="text-primary group-hover:scale-110 transition-transform" size={36} />
          </div>
          <h1 className="text-4xl font-black text-white leading-tight tracking-tight">شريك زاچ أوفيرز</h1>
          <p className="text-text-dim text-sm mt-3 font-bold uppercase tracking-widest">Merchant Hub</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black rounded-2xl px-5 py-4 mb-8">
            <AlertCircle size={18} className="shrink-0" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-dim mr-2 uppercase tracking-widest">
              رقم الموبايل
            </label>
            <div className="relative group">
              <Smartphone
                className="absolute right-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-primary transition-colors"
                size={20}
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pr-14 pl-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-base font-bold placeholder:text-white/5"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-dim mr-2 uppercase tracking-widest">
              كلمة السر
            </label>
            <div className="relative group">
              <Lock
                className="absolute right-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-primary transition-colors"
                size={20}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pr-14 pl-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-base font-bold placeholder:text-white/5"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-bg py-5 rounded-2xl font-black text-sm shadow-xl shadow-black/40 hover:bg-primary hover:text-white active:scale-[0.98] transition-all disabled:opacity-50 mt-4 uppercase tracking-widest"
          >
            {loading ? 'جاري التحقق...' : 'دخول'}
          </button>
        </form>

        <div className="mt-12 text-center">
          <button className="text-text-dim text-xs font-black uppercase tracking-widest hover:text-white flex items-center gap-2 mx-auto transition-colors">
            <ArrowLeft size={14} /> هل تحتاج لمساعدة؟
          </button>
        </div>
      </motion.div>
    </div>
  );
}
