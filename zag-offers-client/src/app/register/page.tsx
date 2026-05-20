"use client";

import { useState } from 'react';
import { Smartphone, Lock, User, Loader2, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { API_URL } from '@/lib/constants';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!navigator.onLine) {
      setError('هذا الإجراء يحتاج اتصال بالإنترنت');
      return;
    }
    setError(null);
    setLoading(true);

    const trimmedPhone = phone.trim();
    const phoneRegex = /^01[0-9]{9}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      setError('يرجى إدخال رقم موبايل مصري صحيح');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/auth/register`, {
        phone: trimmedPhone,
        password,
        name,
      });
      
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      window.dispatchEvent(new Event('auth-change'));
      router.replace('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء التسجيل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-[#FF6B00]/10 to-transparent -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF6B00]/5 blur-[120px] rounded-full -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[450px] glass p-8 sm:p-12 rounded-[3rem] shadow-2xl border border-white/5 relative"
      >
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
            <div className="w-16 h-16 bg-[#FF6B00] rounded-[2rem] flex items-center justify-center shadow-2xl shadow-orange-900/40 group-hover:scale-105 group-hover:rotate-3 transition-all duration-500">
              <ShoppingBag className="text-white" size={32} />
            </div>
          </Link>
          <h1 className="text-3xl font-black mb-3 tracking-tight">إنشاء حساب جديد</h1>
          <p className="text-white/40 text-sm font-bold">انضم لعروض الزقازيق واستمتع بالخصومات</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[11px] font-bold text-center">
              {error}
            </motion.div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-black text-white/30 mr-2 uppercase tracking-wider">الاسم بالكامل</label>
            <div className="relative group">
              <User className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FF6B00] transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="أحمد محمد"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-sm font-bold focus:border-[#FF6B00] focus:bg-white/[0.08] outline-none transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-white/30 mr-2 uppercase tracking-wider">رقم الموبايل</label>
            <div className="relative group">
              <Smartphone className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FF6B00] transition-colors" size={18} />
              <input 
                type="tel" 
                placeholder="01xxxxxxxxx"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-sm font-bold focus:border-[#FF6B00] focus:bg-white/[0.08] outline-none transition-all text-left dir-ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-white/30 mr-2 uppercase tracking-wider">كلمة المرور</label>
            <div className="relative group">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FF6B00] transition-colors" size={18} />
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-sm font-bold focus:border-[#FF6B00] focus:bg-white/[0.08] outline-none transition-all text-left dir-ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-5 h-5 rounded-md bg-[#FF6B00]/20 flex items-center justify-center flex-shrink-0">
               <ShieldCheck className="text-[#FF6B00]" size={12} />
            </div>
            <p className="text-[10px] text-white/30 font-bold leading-tight">بإنشاء الحساب، أنت توافق على شروط زاج وسياسة الاستخدام العادل.</p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4.5 bg-[#FF6B00] text-white font-black rounded-2xl shadow-2xl shadow-orange-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : (
              <>
                إنشاء الحساب الآن
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-sm font-bold text-white/30">
            لديك حساب بالفعل؟ <Link href="/login" className="text-[#FF6B00] hover:underline hover:text-white transition-colors">سجل دخولك من هنا</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
