"use client";

import { useState, useEffect } from 'react';
import { Smartphone, Lock, Eye, EyeOff, Loader2, ArrowRight, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { API_URL } from '@/lib/constants';

declare global {
  interface Window {
    google: any;
    fbAsyncInit: any;
    FB: any;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [googleLoaded, setGoogleLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      try {
        if (window.google) {
          setGoogleLoaded(true);
          window.google.accounts.id.initialize({
            client_id: '20027545873-m3eipii9r6o4k8od8diht31pufn3nurk.apps.googleusercontent.com',
            callback: handleGoogleResponse,
            auto_select: false,
            ux_mode: 'popup', 
          });
          window.google.accounts.id.renderButton(
            document.getElementById('google-login-btn'),
            { theme: 'outline', size: 'large', width: '100%', shape: 'pill', text: 'continue_with', locale: 'ar' }
          );
        }
      } catch (err) {
        console.error('Google GSI Load Error:', err);
      }
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const handleGoogleResponse = async (response: any) => {
    if (!navigator.onLine) {
      setError('هذا الإجراء يحتاج اتصال بالإنترنت');
      return;
    }
    setSocialLoading('google');
    // ... rest of code
    if (response.credential) {
      try {
        const res = await axios.post(`${API_URL}/auth/google`, { idToken: response.credential });
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        window.dispatchEvent(new Event('auth-change'));
        router.replace('/');
      } catch (err: any) {
        console.error('Google Auth Backend Error:', err.response?.data || err.message);
        setError('تعذر تسجيل الدخول عبر جوجل حالياً: ' + (err.response?.data?.message || 'خطأ في السيرفر'));
      }
    }
    setSocialLoading(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
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
      const res = await axios.post(`${API_URL}/auth/login`, {
        phone: trimmedPhone,
        password,
      });
      const { access_token, user } = res.data;
      
      if (user.role === 'MERCHANT' || user.role === 'ADMIN') {
        setError('هذا الحساب مسجل كتاجر. يرجى الدخول من لوحة التاجر.');
        setLoading(false);
        return;
      }
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new Event('auth-change'));
      router.replace('/');
    } catch (err: any) {
      setError('رقم الموبايل أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Now handled by the rendered button automatically
    if (window.google) {
      window.google.accounts.id.prompt(); 
    }
  };

  const handleFacebookLogin = () => {
    setError('تسجيل فيسبوك يتطلب إضافة الـ App ID في الإعدادات');
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
          <h1 className="text-3xl font-black mb-3 tracking-tight">مرحباً بك مجدداً</h1>
          <p className="text-white/40 text-sm font-bold">سجل دخولك لتتمكن من استخدام كوبوناتك</p>
        </div>

        {/* Social Login Buttons */}
        <div className="flex flex-col gap-4 mb-8">
          <div id="google-login-btn" className="w-full min-h-[44px]"></div>
          
          <button 
            onClick={handleFacebookLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
          >
            <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span className="text-xs font-black">فيسبوك</span>
          </button>

          {/* Optional: Add a subtle hint if Google button fails to show */}
          {!googleLoaded && (
             <p className="text-[10px] text-white/20 text-center font-bold">
               إذا لم يظهر زر جوجل، يرجى الدخول من المتصفح العادي (Safari)
             </p>
          )}
        </div>

        <div className="relative mb-8 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
          <span className="relative px-4 bg-transparent text-[10px] font-black text-white/20 uppercase tracking-widest">أو عبر الموبايل</span>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[11px] font-bold text-center">
              {error}
            </motion.div>
          )}

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
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-sm font-bold focus:border-[#FF6B00] focus:bg-white/[0.08] outline-none transition-all text-left dir-ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-[#FF6B00] transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="flex justify-end pt-1">
              <Link href="/forgot-password" className="text-[10px] font-black text-white/20 hover:text-[#FF6B00] transition-colors">
                نسيت كلمة المرور؟
              </Link>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4.5 bg-[#FF6B00] text-white font-black rounded-2xl shadow-2xl shadow-orange-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : (
              <>
                تسجيل الدخول
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-sm font-bold text-white/30">
            ليس لديك حساب؟ <Link href="/register" className="text-[#FF6B00] hover:underline hover:text-white transition-colors">أنشئ حساباً جديداً</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
