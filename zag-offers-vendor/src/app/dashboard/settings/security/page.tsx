'use client';
import { useState } from 'react';
import { Lock, ShieldCheck, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useChangePassword } from '@/hooks/use-vendor-api';

export default function SecurityPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { mutate: changePassword, isPending } = useChangePassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('برجاء ملء جميع الخانات');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('كلمة المرور الجديدة غير متطابقة');
      return;
    }

    changePassword(
      {
        oldPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      },
      {
        onSuccess: () => {
          setSuccess(true);
          setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setTimeout(() => setSuccess(false), 5000);
        },
        onError: (err: any) => {
          setError(err.message || 'فشل تغيير كلمة المرور. تأكد من كلمة المرور الحالية.');
        },
      }
    );
  };

  return (
    <div className="p-4 sm:p-8 dir-rtl max-w-2xl mx-auto animate-in">
      <div className="flex items-center gap-6 mb-12">
        <button
          onClick={() => router.back()}
          className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-text-dim hover:text-primary transition-all border border-white/5"
        >
          <ArrowRight size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-text tracking-tight flex items-center gap-3">
            الأمان والحساب <ShieldCheck className="text-blue-500" size={24} />
          </h1>
          <p className="text-text-dim mt-1 font-bold text-xs">تحديث بيانات تسجيل الدخول وكلمة المرور</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass p-8 sm:p-10 rounded-[3rem] border border-white/5 space-y-8 inner-shadow bg-white/[0.01]">
          <div className="space-y-6">
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-text-dim mr-1 uppercase tracking-widest">كلمة المرور الحالية</label>
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="password" 
                  value={formData.currentPassword}
                  onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
                  className="w-full bg-bg border border-white/5 rounded-2xl py-4 pr-12 focus:border-primary outline-none transition-all text-sm font-bold text-text shadow-inner" 
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="h-px bg-white/5 w-full" />

            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-text-dim mr-1 uppercase tracking-widest">كلمة المرور الجديدة</label>
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="password" 
                  value={formData.newPassword}
                  onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                  className="w-full bg-bg border border-white/5 rounded-2xl py-4 pr-12 focus:border-blue-500 outline-none transition-all text-sm font-bold text-text shadow-inner" 
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-text-dim mr-1 uppercase tracking-widest">تأكيد كلمة المرور الجديدة</label>
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="password" 
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-bg border border-white/5 rounded-2xl py-4 pr-12 focus:border-blue-500 outline-none transition-all text-sm font-bold text-text shadow-inner" 
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[11px] font-black flex items-center gap-3"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-secondary/10 border border-secondary/20 rounded-2xl text-secondary text-[11px] font-black flex items-center gap-3"
              >
                <CheckCircle2 size={18} />
                تم تغيير كلمة المرور بنجاح!
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-600/30 hover:bg-blue-500 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="animate-spin" size={24} /> : <ShieldCheck size={24} />}
            تحديث كلمة المرور
          </button>
        </div>
      </form>

      <div className="mt-12 p-8 glass rounded-[2.5rem] border border-dashed border-white/10 text-center">
        <p className="text-[10px] font-bold text-text-dimmer leading-relaxed">
          في حال نسيان كلمة المرور الحالية، يرجى التواصل مع إدارة <span className="text-primary font-black">Zag Offers</span> لإعادة تعيين حسابك يدوياً لضمان أعلى مستويات الأمان.
        </p>
      </div>
    </div>
  );
}
