"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, KeyRound, ChevronLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online/api'}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل إرسال الكود');

      setMessage({ type: 'success', text: data.message });
      setTimeout(() => {
        setStep(2);
        setMessage(null);
      }, 2000);
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'حدث خطأ' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online/api'}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'الكود غير صحيح');

      setMessage({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح! جاري التوجيه...' });
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'حدث خطأ' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#FF6B00]/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#FF6B00]/10 rounded-full blur-[120px] -z-10" />

      <div className="w-full max-w-md">
        <Link 
          href="/login"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-8 transition-colors"
        >
          <ChevronLeft size={20} className="rotate-180" />
          <span className="text-sm font-bold">العودة لتسجيل الدخول</span>
        </Link>

        <div className="glass rounded-[32px] p-8 sm:p-10 shadow-2xl border border-white/10 relative overflow-hidden">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#FF6B00]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#FF6B00]">
              <Lock size={32} />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">استعادة كلمة المرور</h1>
            <p className="text-sm font-bold text-white/50">
              {step === 1 ? 'أدخل بريدك الإلكتروني المسجل في حسابك.' : 'أدخل الكود المرسل لبريدك الإلكتروني.'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-2xl mb-6 flex items-center gap-3 text-sm font-bold ${
                  message.type === 'success' 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}
              >
                {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>

          {step === 1 ? (
            <motion.form 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSendOtp} 
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-[11px] font-black text-white/50 px-1">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pr-12 pl-4 py-4 text-sm font-bold text-white focus:border-[#FF6B00] focus:bg-white/10 transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-4 bg-[#FF6B00] hover:bg-[#E56000] disabled:bg-[#FF6B00]/50 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(255,107,0,0.3)] disabled:shadow-none"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'إرسال الكود'}
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleResetPassword} 
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-[11px] font-black text-white/50 px-1">كود التحقق (OTP)</label>
                <div className="relative">
                  <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    placeholder="أدخل الكود المكون من 6 أرقام"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pr-12 pl-4 py-4 text-sm font-bold text-white focus:border-[#FF6B00] focus:bg-white/10 transition-all outline-none text-center tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-white/50 px-1">كلمة المرور الجديدة</label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="أدخل كلمة مرور قوية"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pr-12 pl-4 py-4 text-sm font-bold text-white focus:border-[#FF6B00] focus:bg-white/10 transition-all outline-none"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !otp || !newPassword}
                className="w-full py-4 bg-[#FF6B00] hover:bg-[#E56000] disabled:bg-[#FF6B00]/50 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(255,107,0,0.3)] disabled:shadow-none"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'تأكيد التغيير'}
              </button>
            </motion.form>
          )}
        </div>
      </div>
    </div>
  );
}
