'use client';

import { useState } from 'react';
import { Smartphone, Lock, Eye, EyeOff, Loader2, ArrowRight, LogIn } from 'lucide-react';
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
      setError('بيانات الدخول غير صحيحة. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[#0A0A0A]" dir="rtl">
      {/* Client-style top gradient */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-[#FF6B00]/10 to-transparent -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[400px] glass p-8 sm:p-9 rounded-[32px] shadow-2xl relative overflow-hidden border border-white/5"
      >
        {/* Glow effect */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#FF6B00]/20 blur-[60px] rounded-full" />
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#FF6B00] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-950/20 mx-auto mb-5">
            <LogIn className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-black text-white mb-2">شريك زاچ أوفيرز</h1>
          <p className="text-white/40 text-xs font-bold">سجل دخولك لإدارة متجرك وعروضك</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[11px] font-bold text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/50 mr-2 uppercase tracking-widest">رقم الموبايل</label>
            <div className="relative group">
              <Smartphone className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FF6B00] transition-colors" size={16} />
              <input 
                type="tel" 
                placeholder="01xxxxxxxxx"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-3.5 text-sm font-bold text-white focus:border-[#FF6B00] outline-none transition-all placeholder:text-white/5"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/50 mr-2 uppercase tracking-widest">كلمة المرور</label>
            <div className="relative group">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FF6B00] transition-colors" size={16} />
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-3.5 text-sm font-bold text-white focus:border-[#FF6B00] outline-none transition-all placeholder:text-white/5"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-[#FF6B00] text-white font-black rounded-2xl shadow-xl shadow-orange-900/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                دخول الشركاء
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>


      </motion.div>
    </div>
  );
}

