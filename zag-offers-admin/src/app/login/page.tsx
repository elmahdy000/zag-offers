'use client';

import { useState, useEffect } from 'react';
import { Smartphone, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online') + '/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidEgyptianPhone = (p: string) => /^01[0125][0-9]{8}$/.test(p.trim());

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidEgyptianPhone(phone)) {
      setError('يرجى إدخال رقم موبايل مصري صحيح');
      return;
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        phone: phone.trim(),
        password,
      });
      const { access_token, user } = res.data;

      if (user.role !== 'ADMIN' && user.role !== 'MERCHANT') {
        setError('عذراً، هذا الحساب غير مصرح له بالدخول');
        return;
      }

      const isSecure = window.location.protocol === 'https:';
      document.cookie = `admin_token=${encodeURIComponent(access_token)}; path=/; SameSite=Strict${isSecure ? '; Secure' : ''}`;
      sessionStorage.setItem('admin_user', JSON.stringify(user));

      router.replace('/dashboard');
    } catch (err: any) {
      setError('بيانات الدخول غير صحيحة أو توجد مشكلة في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        
        :root {
          --orange: #FF6B00;
          --orange-dk: #D95A00;
          --bg: #0A0A0A;
          --card: rgba(255, 255, 255, 0.04);
          --border: rgba(255, 255, 255, 0.08);
        }

        .login-root {
          min-height: 100vh;
          background: var(--bg);
          color: white;
          font-family: 'Cairo', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        /* Abstract Background Glows */
        .glow {
          position: absolute;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(255, 107, 0, 0.15) 0%, transparent 70%);
          z-index: 0;
          pointer-events: none;
        }
        .glow-1 { top: -100px; left: -100px; }
        .glow-2 { bottom: -100px; right: -100px; }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: var(--card);
          backdrop-filter: blur(20px);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 40px;
          z-index: 10;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        .logo-area { text-align: center; margin-bottom: 32px; }
        .logo-text { font-size: 28px; font-weight: 800; color: white; text-decoration: none; }
        .logo-text span { color: var(--orange); }
        .subtitle { color: #999; font-size: 14px; margin-top: 8px; }

        .form-group { margin-bottom: 20px; position: relative; }
        .form-group label { display: block; font-size: 13px; font-weight: 600; color: #BBB; margin-bottom: 8px; margin-right: 4px; }
        .input-wrap { position: relative; }
        .input-wrap input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 12px 42px 12px 16px;
          color: white;
          font-family: inherit;
          font-size: 15px;
          outline: none;
          transition: all 0.2s;
        }
        .input-wrap input:focus { border-color: var(--orange); background: rgba(255,107,0,0.03); box-shadow: 0 0 0 4px rgba(255,107,0,0.1); }
        .input-icon { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); color: #666; }
        .pass-toggle { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #666; cursor: pointer; padding: 4px; }

        .btn-login {
          width: 100%;
          background: linear-gradient(135deg, var(--orange), var(--orange-dk));
          color: white;
          border: none;
          border-radius: 14px;
          padding: 14px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 10px;
          box-shadow: 0 4px 15px rgba(255,107,0,0.3);
        }
        .btn-login:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255,107,0,0.4); }
        .btn-login:disabled { opacity: 0.6; cursor: not-allowed; }

        .error-msg { background: rgba(255, 68, 68, 0.1); border: 1px solid rgba(255, 68, 68, 0.2); color: #FF4444; border-radius: 12px; padding: 12px; font-size: 13px; font-weight: 600; margin-bottom: 20px; text-align: center; }

        .footer-links { text-align: center; margin-top: 24px; font-size: 13px; color: #666; }
        .footer-links a { color: var(--orange); text-decoration: none; font-weight: 700; }
        .footer-links a:hover { text-decoration: underline; }

        .demo-box { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border); text-align: center; }
        .btn-demo { background: none; border: 1px solid var(--border); color: #888; padding: 6px 16px; border-radius: 10px; font-size: 12px; cursor: pointer; transition: 0.2s; }
        .btn-demo:hover { border-color: var(--orange); color: white; }
      ` }} />

      <div className="glow glow-1"></div>
      <div className="glow glow-2"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="login-card"
      >
        <div className="logo-area">
          <Link href="/" className="logo-text">Zag<span>Offers</span></Link>
          <p className="subtitle">لوحة التحكم في العروض والخصومات</p>
        </div>

        <form onSubmit={handleLogin}>
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="error-msg"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="form-group">
            <label>رقم الموبايل</label>
            <div className="input-wrap">
              <Smartphone className="input-icon" size={18} />
              <input 
                type="tel" 
                placeholder="01xxxxxxxxx" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>كلمة المرور</label>
            <div className="input-wrap">
              <Lock className="input-icon" size={18} />
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="pass-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button className="btn-login" type="submit" disabled={loading}>
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                تسجيل الدخول
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="demo-box">
          <button 
            className="btn-demo"
            onClick={() => { setPhone('01000000000'); setPassword('password123'); }}
          >
            استخدام حساب تجريبي
          </button>
        </div>

        <div className="footer-links">
          ليس لديك حساب؟ <Link href="#">تواصل مع الإدارة</Link>
        </div>
      </motion.div>
    </div>
  );
}
