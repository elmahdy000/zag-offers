'use client';
import { useState } from 'react';
import { LogIn, Smartphone, Lock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(`${API_URL}/auth/login`, { phone, password });
      const { access_token, user } = res.data as {
        access_token: string;
        user: { id: string; name: string; role: string };
      };

      // تحقق من أن المستخدم تاجر أو أدمن
      if (user.role !== 'MERCHANT' && user.role !== 'ADMIN') {
        setError('هذا الحساب ليس حساب تاجر. استخدم تطبيق الموبايل.');
        setLoading(false);
        return;
      }

      // حفظ التوكن في الكوكي
      document.cookie = `auth_token=${encodeURIComponent(access_token)}; path=/; SameSite=Lax`;
      // حفظ بيانات المستخدم
      localStorage.setItem('vendor_user', JSON.stringify(user));

      // جلب storeId الخاص بالتاجر
      try {
        const storesRes = await axios.get(`${API_URL}/admin/stats/merchant`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        const stores = storesRes.data as Array<{ id: string }>;
        if (stores.length > 0) {
          localStorage.setItem('vendor_store_id', stores[0].id);
        }
      } catch {
        // نكمل حتى لو فشل جلب الـ storeId
      }

      router.push('/dashboard');
    } catch {
      setError('رقم الموبايل أو كلمة السر غلط');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 font-[sans-serif]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full p-8"
      >
        {/* Logo & Heading */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <LogIn className="text-orange-600" size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 leading-tight">شريك زاچ أوفيرز</h1>
          <p className="text-gray-400 text-sm mt-2">سجل دخولك لإدارة عروض متجرك</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3 mb-6">
            <AlertCircle size={18} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 mr-2 uppercase tracking-widest">
              رقم الموبايل
            </label>
            <div className="relative group">
              <Smartphone
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-orange-600 transition-colors"
                size={18}
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pr-12 pl-4 text-gray-900 focus:ring-2 focus:ring-orange-200 focus:bg-white outline-none transition-all text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 mr-2 uppercase tracking-widest">
              كلمة السر
            </label>
            <div className="relative group">
              <Lock
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-orange-600 transition-colors"
                size={18}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pr-12 pl-4 text-gray-900 focus:ring-2 focus:ring-orange-200 focus:bg-white outline-none transition-all text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
          >
            {loading ? 'جاري التحقق...' : 'دخول'}
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-gray-400 text-xs">
            هل تحتاج لمساعدة؟{' '}
            <span className="text-orange-600 font-bold cursor-pointer hover:underline">تواصل معنا</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
