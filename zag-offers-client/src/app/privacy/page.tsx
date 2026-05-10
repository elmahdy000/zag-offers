"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ShieldCheck, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/"
          className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <ChevronLeft size={24} className="rotate-180" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="text-[#FF6B00]" size={24} />
            سياسة الخصوصية
          </h1>
          <p className="text-xs text-white/50 font-bold tracking-widest mt-1">تاريخ الإصدار: مايو 2026</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-[32px] p-6 sm:p-10 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6B00]/5 blur-[100px] -z-10 rounded-full" />
        
        <div className="prose prose-invert max-w-none text-white/80 space-y-6">
          <section className="space-y-3">
            <h2 className="text-lg font-black text-[#FF6B00] border-b border-white/10 pb-2">1. جمع المعلومات</h2>
            <p className="text-sm font-semibold leading-relaxed">
              نحن في &quot;عروض الزقازيق&quot; نجمع فقط المعلومات الضرورية لتقديم أفضل خدمة ممكنة، مثل:
            </p>
            <ul className="text-sm font-semibold leading-relaxed space-y-2 list-disc list-inside">
              <li>الاسم ورقم الهاتف والمنطقة الجغرافية عند التسجيل.</li>
              <li>بيانات الاستخدام الأساسية (مثل العروض المفضلة والكوبونات المستخدمة) لتحسين تجربتك.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-[#FF6B00] border-b border-white/10 pb-2">2. حماية البيانات</h2>
            <p className="text-sm font-semibold leading-relaxed">
              نحن نتخذ كافة التدابير الأمنية والتقنية الحديثة (مثل التشفير وبروتوكولات الأمان) لحماية بياناتك الشخصية من الوصول غير المصرح به أو التعديل أو الإفصاح.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-[#FF6B00] border-b border-white/10 pb-2">3. مشاركة المعلومات</h2>
            <p className="text-sm font-semibold leading-relaxed">
              نلتزم التزاماً كاملاً بعدم بيع أو تأجير بياناتك الشخصية لأي أطراف ثالثة. تتم مشاركة بعض البيانات الأساسية فقط مع التجار المعنيين عند استخدامك لكوبون لديهم (مثل تأكيد هويتك للاستفادة من العرض).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-[#FF6B00] border-b border-white/10 pb-2">4. حقوق المستخدم</h2>
            <p className="text-sm font-semibold leading-relaxed">
              يحق لك في أي وقت:
            </p>
            <ul className="text-sm font-semibold leading-relaxed space-y-2 list-disc list-inside">
              <li>الوصول إلى بياناتك وتعديلها عبر إعدادات الحساب الشخصي.</li>
              <li>طلب حذف حسابك وكافة بياناتك المرتبطة به بشكل نهائي.</li>
            </ul>
          </section>

          <section className="p-4 bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-2xl flex gap-3 items-start mt-8">
            <Lock className="text-[#FF6B00] flex-shrink-0" size={24} />
            <p className="text-xs font-bold text-white/80 leading-relaxed">
              خصوصيتك هي أولويتنا القصوى. إذا كان لديك أي استفسارات بخصوص سياسة الخصوصية أو كيفية تعاملنا مع بياناتك، نرجو عدم التردد في التواصل معنا.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
