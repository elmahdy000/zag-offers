'use client';

import { useState } from 'react';
import { Smartphone, Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, BarChart3, Users2, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import AdminThemeToggle from '@/components/AdminThemeToggle';

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
      const res = await api.post('/auth/login', {
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
      document.cookie = `admin_token=${encodeURIComponent(access_token)}; path=/; max-age=86400; SameSite=Strict${isSecure ? '; Secure' : ''}`;
      sessionStorage.setItem('admin_user', JSON.stringify(user));
      localStorage.setItem('admin_user', JSON.stringify(user));

      router.replace('/dashboard');
    } catch {
      setError('بيانات الدخول غير صحيحة أو توجد مشكلة في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-auth-page" dir="rtl">
      <div className="admin-auth-frame">
        <section className="admin-auth-brand-panel">
          <div className="admin-auth-brand-top">
            <span className="flex items-center gap-3">
              <span className="relative block h-12 w-12 overflow-hidden rounded-2xl">
                <Image src="/brand/zag-mark.png" alt="" fill priority className="object-contain" sizes="48px" />
              </span>
              <span>
                <b className="block text-base font-black text-white">Zag Offers</b>
                <small className="text-[10px] font-black text-orange-400">بوابة الإدارة المركزية</small>
              </span>
            </span>
          </div>

          <div className="admin-auth-brand-copy">
            <span className="admin-auth-eyebrow"><ShieldCheck size={15} /> تحكم آمن وموحّد</span>
            <h2>كل أدوات إدارة المنصة في مكان واحد.</h2>
            <p>راجع التجار والعروض والمستخدمين، وتابع أداء Zag Offers بتجربة متناسقة مع بوابتي العميل والتاجر.</p>
          </div>

          <div className="admin-auth-features">
            <div><BarChart3 size={18} /><b>متابعة الأداء</b><span>إحصائيات مباشرة وواضحة</span></div>
            <div><Users2 size={18} /><b>إدارة المستخدمين</b><span>صلاحيات ومراجعات مركزية</span></div>
            <div><Store size={18} /><b>إدارة المتاجر</b><span>اعتمادات وعروض من مكان واحد</span></div>
          </div>
        </section>

        <section className="admin-auth-form-panel">
          <div className="admin-auth-topbar"><AdminThemeToggle compact /></div>
          <div className="admin-auth-content w-full max-w-[430px]">
            <div className="mb-8">
              <span className="admin-auth-kicker">بوابة المسؤولين</span>
              <h1 className="admin-auth-title">مرحبًا بعودتك</h1>
              <p className="admin-auth-subtitle">أدخل بيانات حساب الإدارة للمتابعة.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && <div className="admin-auth-error" role="alert">{error}</div>}

              <div>
                <label htmlFor="admin-phone" className="admin-auth-label">رقم الموبايل</label>
                <div className="admin-auth-input-wrap">
                  <Smartphone size={17} />
                  <input id="admin-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="01xxxxxxxxx" autoComplete="tel" required />
                </div>
              </div>

              <div>
                <label htmlFor="admin-password" className="admin-auth-label">كلمة المرور</label>
                <div className="admin-auth-input-wrap">
                  <Lock size={17} />
                  <input id="admin-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" autoComplete="current-password" required />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="admin-auth-submit">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <><span>دخول النظام</span><ArrowRight size={19} /></>}
              </button>
            </form>

            <p className="admin-auth-security"><Lock size={13} /> جلسة آمنة ومخصصة لحسابات الإدارة فقط</p>
          </div>
        </section>
      </div>
    </main>
  );
}


