"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgePercent, Heart, MapPin, Moon, ShieldCheck, Sparkles, Sun } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';

type AuthShellProps = {
  mode: 'login' | 'register';
  children: React.ReactNode;
};

export function AuthShell({ mode, children }: AuthShellProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const active = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    setTimeout(() => setTheme(active), 0);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem('zag-theme', next);
  };

  return (
    <div className="auth-page -mt-[72px] min-h-screen p-3 sm:p-6" dir="rtl">
      <div className="auth-frame mx-auto grid min-h-[calc(100vh-1.5rem)] w-full max-w-[1180px] overflow-hidden rounded-[28px] lg:grid-cols-[1.08fr_.92fr] sm:min-h-[calc(100vh-3rem)]">
        <section className="auth-form-panel relative flex items-center justify-center p-5 sm:p-10 lg:p-14">
          <div className="absolute inset-x-5 top-5 flex items-center justify-between sm:inset-x-9 sm:top-8">
            <Link href="/" className="auth-home-link text-xs font-bold">العودة للرئيسية ←</Link>
            <button type="button" onClick={toggleTheme} className="auth-theme-button" aria-label={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
          <div className="mt-14 w-full max-w-[440px] sm:mt-10">{children}</div>
        </section>

        <aside className="auth-brand-panel relative hidden min-h-[680px] overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="auth-grid-pattern absolute inset-0" />
          <span className="auth-glow auth-glow-one" />
          <span className="auth-glow auth-glow-two" />

          <Link href="/" className="auth-brand-logo relative z-10 flex items-center gap-4 self-start" aria-label="Zag Offers">
            <span className="auth-brand-logo-mark relative h-20 w-20">
              <BrandMark priority className="h-full w-full" />
            </span>
            <span className="leading-tight">
              <b className="block text-2xl text-white"><span className="text-[#ff6500]">Zag</span> Offers</b>
              <small className="mt-1 block text-xs text-white/55">عروض الزقازيق في مكان واحد</small>
            </span>
          </Link>

          <div className="relative z-10 max-w-md">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#ff6500]/30 bg-[#ff6500]/10 px-4 py-2 text-xs font-bold text-[#ff9b58]">
              <Sparkles size={15} /> وفر أكتر كل يوم
            </div>
            <h2 className="auth-brand-title text-white">
              {mode === 'login' ? 'كل عروض مدينتك أقرب ليك.' : 'حساب واحد لكل عروضك.'}
            </h2>
            <p className="mt-4 max-w-sm text-sm font-medium leading-7 text-white/58">
              اكتشف الخصومات واحفظ المفضل واستخدم كوبوناتك بسهولة.
            </p>
            <div className="auth-feature-row mt-8">
              {[
                [BadgePercent, 'عروض حصرية'],
                [MapPin, 'قريب منك'],
                [Heart, 'مفضلة محفوظة'],
              ].map(([Icon, label]) => {
                const FeatureIcon = Icon as typeof BadgePercent;
                return <div key={String(label)} className="auth-feature"><FeatureIcon size={18} /><span>{String(label)}</span></div>;
              })}
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 text-xs font-semibold text-white/45">
            <ShieldCheck size={17} className="text-[#ff6500]" /> بياناتك محفوظة وآمنة
          </div>
        </aside>
      </div>
    </div>
  );
}
