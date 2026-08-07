'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AdminThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('zag-admin-theme');
    const active = savedTheme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = active;
    const timer = window.setTimeout(() => setTheme(active), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem('zag-admin-theme', nextTheme);
  };

  const label = theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`admin-theme-toggle ${compact ? 'is-compact' : ''}`}
      aria-label={label}
      title={label}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      {!compact && <span>{theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}</span>}
    </button>
  );
}
