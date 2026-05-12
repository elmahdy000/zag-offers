'use client';
import { Store, Shield, Bell, ChevronLeft, Lock, Smartphone, LogOut, ExternalLink, HelpCircle, Activity, Wifi, Zap } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { deleteCookie } from '@/lib/api';
import { useEffect, useState } from 'react';
import { PerformanceMonitor } from '@/lib/performance-monitor';

export default function SettingsPage() {
  const [avgLatency, setAvgLatency] = useState<number | null>(null);

  useEffect(() => {
    const metrics = PerformanceMonitor.getMetrics().filter(m => m.type === 'API_LATENCY');
    if (metrics.length > 0) {
      const avg = metrics.reduce((acc, m) => acc + m.value, 0) / metrics.length;
      setAvgLatency(avg);
    }
  }, []);

  const handleLogout = () => {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
      deleteCookie('auth_token');
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  const sections = [
    {
      title: 'بيانات المتجر',
      description: 'تعديل اسم المتجر، اللوجو، العنوان ورقم الموبايل',
      icon: Store,
      href: '/dashboard/profile',
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      title: 'الأمان والحساب',
      description: 'تغيير كلمة المرور وإعدادات تسجيل الدخول',
      icon: Lock,
      href: '/dashboard/settings/security',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'التنبيهات',
      description: 'التحكم في الإشعارات الفورية وصوت التنبيه',
      icon: Bell,
      href: '#',
      color: 'text-secondary',
      bg: 'bg-secondary/10',
      tag: 'قريباً'
    },
    {
      title: 'تطبيق الموبايل',
      description: 'ربط الحساب بتطبيق التاجر على أندرويد و iOS',
      icon: Smartphone,
      href: '#',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    }
  ];

  return (
    <div className="p-4 sm:p-8 dir-rtl max-w-4xl mx-auto animate-in">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-text tracking-tighter">إعدادات النظام</h1>
        <p className="text-text-dim mt-2 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
           <span className="w-1.5 h-1.5 bg-primary rounded-full" />
           تخصيص لوحة التحكم وحساب المتجر
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sections.map((section, i) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link 
              href={section.href}
              className="glass p-6 rounded-[2rem] border border-white/5 flex items-center justify-between hover:border-primary/30 transition-all group active:scale-[0.99] bg-white/[0.01]"
            >
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 ${section.bg} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg`}>
                  <section.icon className={section.color} size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-black text-text text-sm">{section.title}</h3>
                    {section.tag && (
                      <span className="text-[8px] font-black bg-white/10 text-primary px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {section.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-text-dim text-[11px] font-bold mt-1 leading-relaxed">
                    {section.description}
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-text-dimmer group-hover:text-primary group-hover:bg-primary/10 transition-all">
                <ChevronLeft size={18} />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Performance Status Section */}
      <div className="mt-6">
        <div className="glass p-6 rounded-[2rem] border border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-text">حالة الاتصال والأداء</h3>
              <p className="text-[10px] font-bold text-text-dim">بيانات حية من جلسة العمل الحالية</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 mb-2 text-text-dim">
                   <Wifi size={14} />
                   <span className="text-[10px] font-black uppercase">سرعة الـ API</span>
                </div>
                <div className="flex items-end gap-1">
                   <span className={`text-2xl font-black ${!avgLatency ? 'text-text-dimmer' : avgLatency < 500 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {avgLatency ? avgLatency.toFixed(0) : '--'}
                   </span>
                   <span className="text-[10px] font-bold text-text-dimmer mb-1">ms</span>
                </div>
             </div>
             <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 mb-2 text-text-dim">
                   <Zap size={14} />
                   <span className="text-[10px] font-black uppercase">جودة الخدمة</span>
                </div>
                <div className="flex items-end gap-1">
                   <span className="text-2xl font-black text-blue-400">مستقر</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-8 glass rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center text-center bg-white/[0.01]">
          <HelpCircle className="text-text-dimmer mb-4" size={32} />
          <h4 className="text-[11px] font-black text-text uppercase tracking-widest mb-1">مركز المساعدة</h4>
          <p className="text-[10px] font-bold text-text-dimmer max-w-[200px] leading-relaxed">
            لديك استفسار؟ فريق الدعم متاح 24/7 لمساعدتك
          </p>
          <a href="https://wa.me/201091428238" target="_blank" className="mt-6 text-[10px] font-black text-primary hover:underline flex items-center gap-2">
            تواصل معنا <ExternalLink size={12} />
          </a>
        </div>

        <div className="p-8 glass rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center text-center bg-red-500/[0.02]">
          <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-4">
             <LogOut size={24} />
          </div>
          <h4 className="text-[11px] font-black text-text uppercase tracking-widest mb-1">الخروج من الحساب</h4>
          <p className="text-[10px] font-bold text-text-dimmer mb-6">سيتم إنهاء الجلسة الحالية على هذا الجهاز</p>
          <button 
            onClick={handleLogout}
            className="text-[10px] font-black bg-red-500 text-white px-8 py-3 rounded-xl shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}
