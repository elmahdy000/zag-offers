"use client";

import { useState, useEffect } from 'react';
import { Smartphone, Lock, User, Loader2, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { API_URL } from '@/lib/constants';

declare global {
  interface Window {
    google: any;
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize Google SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setError('يرجى إدخال اسم صحيح');
      setLoading(false);
      return;
    }

    const phoneRegex = /^01[0-9]{9}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      setError('يرجى إدخال رقم موبايل مصري صحيح (11 رقم)');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 خانات على الأقل');
      setLoading(false);
      return;
    }

    try {
      const regRes = await axios.post(`${API_URL}/auth/register`, {
        name: trimmedName,
        phone: trimmedPhone,
        password,
      });
      
      if (regRes.data.user?.role === 'MERCHANT' || regRes.data.user?.role === 'ADMIN') {
        setError('هذا الحساب مسجل كتاجر. يرجى الدخول من لوحة التاجر.');
        setLoading(false);
        return;
      }
      
      const res = await axios.post(`${API_URL}/auth/login`, {
        phone: trimmedPhone,
        password,
      });
      
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      window.dispatchEvent(new Event('auth-change'));
      router.replace('/');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : (msg || 'عذراً، هذا الرقم مسجل مسبقاً أو هناك خطأ في البيانات'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setSocialLoading('google');
    try {
      window.google.accounts.id.initialize({
        client_id: '20027545873-m3eipii9r6o4k8od8diht31pufn3nurk.apps.googleusercontent.com',
        callback: async (response: any) => {
          if (response.credential) {
            try {
              const res = await axios.post(`${API_URL}/auth/google`, { idToken: response.credential });
              localStorage.setItem('token', res.data.access_token);
              localStorage.setItem('user', JSON.stringify(res.data.user));
              window.dispatchEvent(new Event('auth-change'));
              router.replace('/');
            } catch (err: any) {
              console.error('Google Auth Backend Error:', err.response?.data || err.message);
              setError('تعذر التسجيل عبر جوجل حالياً: ' + (err.response?.data?.message || 'خطأ في السيرفر'));
            }
          }
          setSocialLoading(null);
        },
      });
      window.google.accounts.id.prompt();
    } catch (e) {
      setError('يرجى ضبط إعدادات Google API Keys');
      setSocialLoading(null);
    }
  };

  const handleFacebookLogin = () => {
    setError('تسجيل فيسبوك يتطلب App ID نشط');
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-[#FF6B00]/10 to-transparent -z-10" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#FF6B00]/5 blur-[100px] rounded-full -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] glass p-8 sm:p-12 rounded-[3rem] shadow-2xl border border-white/5 relative"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#FF6B00] rounded-[2rem] flex items-center justify-center shadow-2xl shadow-orange-900/40 mx-auto mb-6 rotate-3 hover:rotate-0 transition-transform duration-500">
            <ShoppingBag className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black mb-3 tracking-tight">ابدأ التوفير الآن</h1>
          <p className="text-white/40 text-sm font-bold max-w-[280px] mx-auto">انضم لمجتمع زاج واستمتع بأقوى العروض في الزقازيق</p>
        </div>

        {/* Social Login Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button 
            onClick={handleGoogleLogin}
            disabled={socialLoading === 'google'}
            className="flex items-center justify-center gap-3 py-3.5 px-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group disabled:opacity-50"
          >
            {socialLoading === 'google' ? <Loader2 size={20} className="animate-spin" /> : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.48 10.92v3.28h7.84c-.24 1.84-.92 3.36-2.04 4.48-1.28 1.28-3.12 2.12-5.8 2.12-4.68 0-8.52-3.8-8.52-8.52s3.84-8.52 8.52-8.52c2.52 0 4.6 1 6.12 2.44l2.32-2.32C18.64 1.64 15.84 0 12.48 0 5.6 0 0 5.6 0 12.48s5.6 12.48 12.48 12.48c3.72 0 6.52-1.24 8.72-3.48 2.24-2.24 3.12-5.4 3.12-8.12 0-.84-.08-1.48-.2-2.12h-11.64z"/>
              </svg>
            )}
            <span className="text-xs font-black">جوجل</span>
          </button>
          <button 
            onClick={handleFacebookLogin}
            className="flex items-center justify-center gap-3 py-3.5 px-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
          >
            <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span className="text-xs font-black">فيسبوك</span>
          </button>
        </div>

        <div className="relative mb-8 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
          <span className="relative px-4 bg-transparent text-[10px] font-black text-white/20 uppercase tracking-widest">أو عبر الموبايل</span>
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
