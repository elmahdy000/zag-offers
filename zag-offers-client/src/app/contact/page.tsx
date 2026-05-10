"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, MessageCircle, Phone, Mail, MapPin, Send } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ContactPage() {
  const handleWhatsApp = () => {
    window.open('https://wa.me/201066711545', '_blank');
  };

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
            <MessageCircle className="text-[#FF6B00]" size={24} />
            تواصل معنا
          </h1>
          <p className="text-xs text-white/50 font-bold tracking-widest mt-1">نحن هنا للإجابة على استفساراتك</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass rounded-[32px] p-6 sm:p-8 space-y-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6B00]/5 blur-[100px] -z-10 rounded-full" />
          
          <div>
            <h2 className="text-xl font-black text-white mb-2">معلومات التواصل</h2>
            <p className="text-sm font-bold text-white/50 leading-relaxed">
              تطبيق عروض الزقازيق هو منصتك الأولى لاكتشاف أفضل الخصومات في مدينتك. إذا واجهت أي مشكلة أو كان لديك استفسار، لا تتردد في مراسلتنا.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/50 group-hover:text-[#FF6B00] group-hover:scale-110 transition-all">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-[11px] font-black text-white/30 uppercase tracking-widest mb-1">المقر الرئيسي</p>
                <p className="text-sm font-bold text-white">الزقازيق، محافظة الشرقية، مصر</p>
              </div>
            </div>

            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/50 group-hover:text-[#FF6B00] group-hover:scale-110 transition-all">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-[11px] font-black text-white/30 uppercase tracking-widest mb-1">البريد الإلكتروني</p>
                <p className="text-sm font-bold text-white">support@zagoffers.online</p>
              </div>
            </div>

            <div className="flex items-center gap-4 group cursor-pointer" onClick={handleWhatsApp}>
              <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/10 flex items-center justify-center text-[#FF6B00] group-hover:scale-110 transition-all">
                <Phone size={20} />
              </div>
              <div>
                <p className="text-[11px] font-black text-white/30 uppercase tracking-widest mb-1">واتساب (مباشر)</p>
                <p className="text-sm font-bold text-white" dir="ltr">+20 10 6671 1545</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contact Form Placeholder */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-[32px] p-6 sm:p-8 space-y-6 border border-white/10"
        >
          <div>
            <h2 className="text-xl font-black text-white mb-2">أرسل لنا رسالة</h2>
            <p className="text-sm font-bold text-white/50">سيتم الرد عليك في أقرب وقت ممكن.</p>
          </div>

          <form className="space-y-4" onSubmit={e => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-white/50 px-1">الاسم</label>
              <input
                type="text"
                placeholder="أدخل اسمك"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:border-[#FF6B00] focus:bg-white/10 transition-all outline-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[11px] font-black text-white/50 px-1">الموضوع</label>
              <input
                type="text"
                placeholder="عنوان الرسالة"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:border-[#FF6B00] focus:bg-white/10 transition-all outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-white/50 px-1">الرسالة</label>
              <textarea
                placeholder="اكتب رسالتك هنا..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:border-[#FF6B00] focus:bg-white/10 transition-all outline-none resize-none"
              ></textarea>
            </div>

            <button
              type="button"
              onClick={handleWhatsApp}
              className="w-full py-4 bg-white/5 hover:bg-[#FF6B00] border border-white/10 hover:border-transparent text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <Send size={18} />
              التواصل عبر الواتساب بدلاً من ذلك
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
