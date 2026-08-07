'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const active = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    const timer = window.setTimeout(() => setTheme(active), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem('zag-vendor-theme', next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`theme-toggle ${compact ? 'theme-toggle-compact' : ''}`}
      aria-label={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
      title={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      {!compact && <span>{theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}</span>}
    </button>
  );
}
