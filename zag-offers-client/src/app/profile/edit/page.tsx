"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Save, User, MapPin, Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  // Forms state
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setName(parsed.name || '');
      setArea(parsed.area || '');
    } else {
      router.replace('/login');
    }
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const token = localStorage.getItem('token');
    
    try {
      // 1. Update Profile (Name & Area)
      const resProfile = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online/api'}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, area }),
      });

      if (!resProfile.ok) throw new Error('فشل تحديث البيانات الأساسية');
      const updatedUser = await resProfile.json();
      
      // Update local storage user
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      // 2. Update Password if provided
      if (currentPassword && newPassword) {
        if (newPassword.length < 6) {
          throw new Error('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
        }

        const resPass = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online/api'}/auth/password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        });

        if (!resPass.ok) {
          const passData = await resPass.json();
          throw new Error(passData.message || 'كلمة المرور الحالية غير صحيحة');
        }
      }

      setMessage({ type: 'success', text: 'تم تحديث البيانات بنجاح!' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'حدث خطأ غير متوقع' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/profile"
          className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <ArrowRight size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white">تعديل البيانات</h1>
          <p className="text-xs text-white/50 font-bold tracking-widest mt-1">إعدادات الحساب الشخصي</p>
        </div>
      </div>

      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleUpdateProfile}
        className="glass rounded-[32px] p-6 sm:p-8 space-y-6 relative overflow-hidden"
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6B00]/10 blur-[100px] -z-10 rounded-full" />

        {/* Messages */}
        {message && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold ${
            message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        <div className="space-y-5">
          {/* Phone (Read Only) */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-white/50 px-1">رقم الموبايل (لا يمكن تغييره)</label>
            <div className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5 text-sm font-bold text-white/40 cursor-not-allowed">
              {user.phone}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-white/50 px-1">الاسم بالكامل</label>
            <div className="relative">
              <User className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="اسمك هنا..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl pr-12 pl-4 py-3.5 text-sm font-bold text-white focus:border-[#FF6B00] focus:bg-white/10 transition-all outline-none"
                required
              />
            </div>
          </div>

          {/* Area */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-white/50 px-1">المنطقة السكنية</label>
            <div className="relative">
              <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input
                type="text"
                value={area}
                onChange={e => setArea(e.target.value)}
                placeholder="مثال: القومية، فلل الجامعة..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl pr-12 pl-4 py-3.5 text-sm font-bold text-white focus:border-[#FF6B00] focus:bg-white/10 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        <hr className="border-white/10 my-6" />

        <div className="space-y-5">
          <h3 className="text-sm font-black text-[#FF6B00]">تغيير كلمة المرور</h3>
          <p className="text-xs text-white/40 mb-4">اترك هذه الحقول فارغة إذا لم تكن تريد تغيير كلمة المرور.</p>
          
          {/* Current Password */}
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="كلمة المرور الحالية"
                className="w-full bg-white/5 border border-white/10 rounded-2xl pr-12 pl-4 py-3.5 text-sm font-bold text-white focus:border-[#FF6B00] focus:bg-white/10 transition-all outline-none"
              />
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="كلمة المرور الجديدة"
                className="w-full bg-white/5 border border-white/10 rounded-2xl pr-12 pl-4 py-3.5 text-sm font-bold text-white focus:border-[#FF6B00] focus:bg-white/10 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 mt-4 bg-[#FF6B00] hover:bg-[#E56000] disabled:bg-[#FF6B00]/50 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(255,107,0,0.3)] disabled:shadow-none"
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
            <>
              <Save size={20} />
              حفظ التعديلات
            </>
          )}
        </button>
      </motion.form>
    </div>
  );
}
