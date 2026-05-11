'use client';
import { Store, Shield, Bell, ChevronLeft, Lock, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function SettingsPage() {
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
        <h1 className="text-3xl font-black text-text tracking-tight">إعدادات النظام</h1>
        <p className="text-text-dim mt-2 font-bold text-xs uppercase tracking-widest">تخصيص لوحة التحكم وحساب المتجر</p>
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
              className="glass p-6 rounded-[2rem] border border-white/5 flex items-center justify-between hover:border-primary/30 transition-all group active:scale-[0.99]"
            >
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 ${section.bg} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <section.icon className={section.color} size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-black text-text text-sm">{section.title}</h3>
                    {section.tag && (
                      <span className="text-[8px] font-black bg-white/5 text-text-dimmer px-2 py-0.5 rounded-md uppercase tracking-wider">
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

      <div className="mt-12 p-8 glass rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center text-center">
        <Shield className="text-text-dimmer mb-4" size={32} />
        <h4 className="text-xs font-black text-text-dim uppercase tracking-widest mb-1">مركز الدعم والمساعدة</h4>
        <p className="text-[10px] font-bold text-text-dimmer max-w-[280px]">
          إذا كنت تواجه مشكلة فنية أو تود استفساراً حول النظام، يمكنك التواصل معنا عبر واتساب الدعم الفني
        </p>
        <button className="mt-6 text-[11px] font-black text-primary hover:underline">
          تواصل مع الدعم الفني
        </button>
      </div>
    </div>
  );
}
