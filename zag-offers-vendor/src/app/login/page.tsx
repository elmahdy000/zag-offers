'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, BadgePercent, Eye, EyeOff, Loader2, Lock, ScanLine, ShieldCheck, Smartphone, Store, Sun, Moon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { validateEgyptianPhone, validatePassword } from '@/lib/auth-validation';
import { handleApiError, logError } from '@/lib/errorHandler';
import { secureUserData, secureStoreData } from '@/lib/crypto';
import BrandMark from '@/components/BrandMark';
import { deleteCookie } from '@/lib/cookie-utils';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online').replace(/\/$/, '') + '/api';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const active = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    const reason = new URLSearchParams(window.location.search).get('reason');
    const timer = window.setTimeout(() => {
      setTheme(active);
      if (reason === 'admin-account') setError('هذا حساب إدارة. افتح لوحة الإدارة لتسجيل الدخول.');
      if (reason === 'session-expired') setError('انتهت الجلسة. سجّل الدخول مرة أخرى.');
      if (reason === 'unauthorized') setError('الجلسة لا تملك صلاحية لوحة التاجر. سجّل الدخول بحساب تاجر.');
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem('zag-vendor-theme', next);
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    if (!validateEgyptianPhone(phone.trim())) {
      setError('يرجى إدخال رقم موبايل مصري صحيح');
      setLoading(false);
      return;
    }
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.error!);
      setLoading(false);
      return;
    }
    try {
      deleteCookie('auth_token'); // Remove the legacy JavaScript-readable cookie before migration.
      const response = await axios.post(
        `${API_URL}/auth/login`,
        { phone: phone.trim(), password },
        { withCredentials: true },
      );
      const { access_token, user } = response.data as { access_token: string; user: { id: string; name: string; role: string } };
      if (!access_token || !user?.id || !user?.role) {
        throw new Error('استجابة تسجيل الدخول غير مكتملة. حاول مرة أخرى.');
      }
      if (user.role !== 'MERCHANT') {
        await axios.post(`${API_URL}/auth/logout`, undefined, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${access_token}` },
        }).catch(() => undefined);
        setError(user.role === 'ADMIN'
          ? 'هذا حساب إدارة. استخدم لوحة الإدارة بدلًا من لوحة التاجر.'
          : 'هذا الحساب ليس حساب تاجر. استخدم تطبيق العملاء.');
        setLoading(false);
        return;
      }
      secureUserData.save(user);
      try {
        const statsResponse = await axios.get(`${API_URL}/stores/my-dashboard`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${access_token}` },
        });
        const stats = statsResponse.data as { storeId: string };
        if (stats.storeId) secureStoreData.save(stats.storeId);
      } catch (storeError) {
        logError(handleApiError(storeError), 'Store ID Fetch');
      }
      router.push('/dashboard');
    } catch (loginError: unknown) {
      const apiError = handleApiError(loginError);
      logError(apiError, 'Login');
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="vendor-auth-page" dir="rtl">
      <div className="vendor-auth-frame">
        <section className="vendor-auth-form-panel">
          <div className="vendor-auth-topbar">
            <div className="flex items-center gap-2 text-xs font-black text-text"><BrandMark priority className="h-9 w-9" /> Zag Offers</div>
            <button className="icon-button" onClick={toggleTheme} aria-label="تغيير المظهر">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
          </div>

          <div className="vendor-auth-content w-full max-w-[430px]">
            <span className="vendor-auth-kicker">بوابة شركاء Zag Offers</span>
            <h1 className="vendor-auth-title">أهلًا بعودتك</h1>
            <p className="vendor-auth-subtitle">أدر عروضك، تابع الكوبونات، وراقب أداء متجرك من مكان واحد.</p>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              {error && <div className="vendor-auth-error" role="alert">{error}</div>}
              <div>
                <label className="vendor-auth-label" htmlFor="phone">رقم الموبايل</label>
                <div className="vendor-auth-input-wrap"><Smartphone size={18} /><input id="phone" type="tel" inputMode="tel" autoComplete="tel" autoFocus placeholder="01xxxxxxxxx" value={phone} onChange={(event) => setPhone(event.target.value)} required /></div>
              </div>
              <div>
                <label className="vendor-auth-label" htmlFor="password">كلمة المرور</label>
                <div className="vendor-auth-input-wrap"><Lock size={18} /><input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="أدخل كلمة المرور" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="إظهار كلمة المرور">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
              </div>
              <button className="vendor-auth-submit" type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" size={20} /> : <><span>دخول لوحة التحكم</span><ArrowLeft size={18} /></>}</button>
            </form>
            <p className="vendor-auth-security"><ShieldCheck size={16} /> اتصال مشفر وآمن لحماية بيانات متجرك</p>
          </div>
        </section>

        <aside className="vendor-auth-brand-panel">
          <div className="vendor-auth-brand-copy">
            <BrandMark priority className="h-28 w-28" />
            <span className="vendor-auth-eyebrow"><Store size={15} /> صُممت للتاجر</span>
            <h2>كل ما يحتاجه متجرك للنمو.</h2>
            <p>تجربة إدارة واضحة وسريعة تمنحك صورة كاملة عن عروضك وعملائك لحظة بلحظة.</p>
          </div>
          <div className="vendor-auth-features">
            <div><BadgePercent size={21} /><b>عروضك</b><span>إنشاء وإدارة فورية</span></div>
            <div><ScanLine size={21} /><b>كوبوناتك</b><span>تفعيل آمن وسريع</span></div>
            <div><ShieldCheck size={21} /><b>بياناتك</b><span>متابعة موثوقة</span></div>
          </div>
        </aside>
      </div>
    </main>
  );
}
