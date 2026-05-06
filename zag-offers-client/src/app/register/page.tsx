"use client";

import { useState } from 'react';
import { Smartphone, Lock, User, Loader2, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

const API_URL = 'https://api.zagoffers.online/api';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Step 1: Register
      await axios.post(`${API_URL}/auth/register`, {
        name,
        phone,
        password,
      });
      
      // Step 2: Auto-login
      const res = await axios.post(`${API_URL}/auth/login`, {
        phone,
        password,
      });
      
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      router.replace('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء التسجيل. يرجى التأكد من البيانات.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-[#FF6B00]/10 to-transparent -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[450px] glass p-8 sm:p-10 rounded-[32px] shadow-2xl relative overflow-hidden"
      >
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-[#FF6B00] rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6">
            <ShoppingBag className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-black mb-2">أنشئ حساباً جديداً</h1>
          <p className="text-white/40 text-sm font-bold">انضم لآلاف الموفرين في الزقازيق واستمتع بالعروض</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black text-white/50 mr-2">الاسم الكامل</label>
            <div className="relative">
              <User className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                type="text" 
                placeholder="أحمد محمد"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-sm font-bold focus:border-[#FF6B00] outline-none transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-white/50 mr-2">رقم الموبايل</label>
            <div className="relative">
              <Smartphone className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                type="tel" 
                placeholder="01xxxxxxxxx"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-sm font-bold focus:border-[#FF6B00] outline-none transition-all"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-white/50 mr-2">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-sm font-bold focus:border-[#FF6B00] outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 px-2 pb-2">
            <ShieldCheck className="text-[#FF6B00]" size={16} />
            <p className="text-[10px] text-white/30 font-bold leading-tight">بالتوقيع، أنت توافق على شروط الخدمة وسياسة الخصوصية الخاصة بنا.</p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-[#FF6B00] text-white font-black rounded-2xl shadow-xl shadow-orange-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                إنشاء الحساب
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm font-bold text-white/30">
            لديك حساب بالفعل؟ <Link href="/login" className="text-[#FF6B00] hover:underline">سجل دخولك هنا</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
