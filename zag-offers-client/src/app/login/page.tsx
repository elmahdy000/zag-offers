"use client";

import { useState } from 'react';
import { Smartphone, Lock, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { API_URL } from '@/lib/constants';
import { AuthShell } from '@/components/auth-shell';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch {
      setError('رقم الموبايل أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell mode="login">
      <motion.div initial={false} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <span className="auth-kicker">أهلاً بعودتك</span>
          <h1 className="auth-title mt-3">سجّل دخولك</h1>
          <p className="auth-subtitle mt-2">ادخل بياناتك للوصول إلى كوبوناتك وعروضك المحفوظة.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="auth-error" role="alert">
              {error}
            </motion.div>
          )}

          <div className="space-y-2">
            <label htmlFor="login-phone" className="auth-label">رقم الموبايل</label>
            <div className="auth-input-wrap group">
              <Smartphone className="auth-input-icon" size={19} />
              <input 
                id="login-phone"
                type="tel" 
                placeholder="01xxxxxxxxx"
                className="auth-input text-left"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="numeric"
                autoComplete="tel"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="auth-label">كلمة المرور</label>
              <Link href="/forgot-password" className="auth-inline-link text-xs">نسيت كلمة المرور؟</Link>
            </div>
            <div className="auth-input-wrap group">
              <Lock className="auth-input-icon" size={19} />
              <input 
                id="login-password"
                type={showPassword ? 'text' : 'password'} 
                placeholder="أدخل كلمة المرور"
                className="auth-input px-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button 
                type="button" 
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="auth-submit"
          >
            {loading ? <Loader2 className="animate-spin" size={21} /> : (
              <>
                تسجيل الدخول
                <ArrowLeft size={19} />
              </>
            )}
          </button>
        </form>

        <div className="auth-benefit mt-6"><CheckCircle2 size={17} /> الدخول مجاني ولن يستغرق أكثر من دقيقة</div>

        <div className="auth-switch mt-8">
          <p>
            ليس لديك حساب؟ <Link href="/register">أنشئ حساباً جديداً</Link>
          </p>
        </div>
      </motion.div>
    </AuthShell>
  );
}
