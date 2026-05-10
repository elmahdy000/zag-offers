"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, FileText, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TermsPage() {
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
            <FileText className="text-[#FF6B00]" size={24} />
            الشروط والأحكام
          </h1>
          <p className="text-xs text-white/50 font-bold tracking-widest mt-1">تاريخ آخر تحديث: مايو 2026</p>
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
            <h2 className="text-lg font-black text-[#FF6B00] border-b border-white/10 pb-2">1. مقدمة</h2>
            <p className="text-sm font-semibold leading-relaxed">
              أهلاً بك في منصة &quot;عروض الزقازيق&quot; (Zag Offers). باستخدامك لهذه المنصة، فإنك توافق على الالتزام بالشروط والأحكام الموضحة أدناه. يرجى قراءتها بعناية قبل استخدام خدماتنا.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-[#FF6B00] border-b border-white/10 pb-2">2. حساب المستخدم</h2>
            <ul className="text-sm font-semibold leading-relaxed space-y-2 list-disc list-inside">
              <li>يجب أن تكون المعلومات المقدمة عند التسجيل (مثل رقم الهاتف والاسم) دقيقة وحقيقية.</li>
              <li>أنت مسؤول بالكامل عن الحفاظ على سرية معلومات حسابك وكلمة المرور.</li>
              <li>المنصة غير مسؤولة عن أي استخدام غير مصرح به لحسابك ناتج عن إهمالك.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-[#FF6B00] border-b border-white/10 pb-2">3. استخدام الكوبونات والعروض</h2>
            <ul className="text-sm font-semibold leading-relaxed space-y-2 list-disc list-inside">
              <li>الكوبونات المقدمة عبر المنصة صالحة للاستخدام مرة واحدة ما لم يُنص على خلاف ذلك.</li>
              <li>كل عرض له تاريخ انتهاء صلاحية وشروط خاصة يحددها التاجر، ويجب مراجعتها قبل استخدام الكوبون.</li>
              <li>المنصة تعمل كوسيط بين المستخدم والتاجر، ولا تتحمل مسؤولية جودة المنتجات أو الخدمات المقدمة من التاجر.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-[#FF6B00] border-b border-white/10 pb-2">4. حقوق الملكية</h2>
            <p className="text-sm font-semibold leading-relaxed">
              جميع المحتويات الموجودة على المنصة (النصوص، التصاميم، الشعارات، الصور) هي ملكية حصرية لمنصة &quot;عروض الزقازيق&quot; ولا يجوز نسخها أو إعادة استخدامها دون إذن كتابي مسبق.
            </p>
          </section>

          <section className="p-4 bg-orange-900/20 border border-orange-500/20 rounded-2xl flex gap-3 items-start mt-8">
            <ShieldAlert className="text-orange-500 flex-shrink-0" size={24} />
            <p className="text-xs font-bold text-orange-200/80 leading-relaxed">
              تحتفظ إدارة المنصة بالحق في تعديل هذه الشروط في أي وقت. استمرارك في استخدام التطبيق بعد أي تعديل يُعد قبولاً منك بالشروط الجديدة.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
