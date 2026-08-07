"use client";

import { useState } from 'react';
import { Smartphone, Lock, User, Loader2, ArrowLeft, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { API_URL } from '@/lib/constants';
import { AuthShell } from '@/components/auth-shell';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    } catch (err: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(err) ? err.response?.data?.message : undefined;
      setError(message || 'حدث خطأ أثناء التسجيل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell mode="register">
      <motion.div initial={false} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-7">
          <span className="auth-kicker">ابدأ التوفير من النهارده</span>
          <h1 className="auth-title mt-3">إنشاء حساب جديد</h1>
          <p className="auth-subtitle mt-2">سجّل بيانات بسيطة وابدأ في حفظ واستخدام أفضل العروض.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="auth-error" role="alert">
              {error}
            </motion.div>
          )}

          <div className="space-y-2">
            <label htmlFor="register-name" className="auth-label">الاسم بالكامل</label>
            <div className="auth-input-wrap group">
              <User className="auth-input-icon" size={19} />
              <input 
                id="register-name"
                type="text" 
                placeholder="أحمد محمد"
                className="auth-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="register-phone" className="auth-label">رقم الموبايل</label>
            <div className="auth-input-wrap group">
              <Smartphone className="auth-input-icon" size={19} />
              <input 
                id="register-phone"
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
            <label htmlFor="register-password" className="auth-label">كلمة المرور</label>
            <div className="auth-input-wrap group">
              <Lock className="auth-input-icon" size={19} />
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="6 أحرف على الأقل"
                className="auth-input px-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
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

          <div className="auth-consent">
            <ShieldCheck size={16} />
            <p>بإنشاء الحساب، أنت توافق على <Link href="/terms">الشروط</Link> و<Link href="/privacy">سياسة الخصوصية</Link>.</p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="auth-submit"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : (
              <>
                إنشاء الحساب
                <ArrowLeft size={19} />
              </>
            )}
          </button>
        </form>

        <div className="auth-switch mt-7">
          <p>
            لديك حساب بالفعل؟ <Link href="/login">سجّل دخولك</Link>
          </p>
        </div>
      </motion.div>
    </AuthShell>
  );
}
