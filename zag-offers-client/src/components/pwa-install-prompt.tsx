'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'other'>('other');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 1. Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
                         || (window.navigator as any).standalone 
                         || document.referrer.includes('android-app://');
    
    if (isStandalone) return;

    // 2. Check if dismissed before
    const isDismissed = localStorage.getItem('pwa_prompt_dismissed');
    if (isDismissed) {
      const dismissedDate = new Date(isDismissed);
      const now = new Date();
      const daysPassed = (now.getTime() - dismissedDate.getTime()) / (1000 * 3600 * 24);
      if (daysPassed < 7) return; // Don't show again for 7 days
    }

    // 3. Detect Platform
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform('ios');
    } else if (/android/.test(ua)) {
      setPlatform('android');
    }

    // 4. Listen for Android Install Prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show after 3 seconds for better UX
      setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS, show after 5 seconds since there's no event
    if (/iphone|ipad|ipod/.test(ua)) {
      setTimeout(() => setShow(true), 5000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (platform === 'android' && deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShow(false);
      }
      setDeferredPrompt(null);
    } else if (platform === 'ios') {
      // iOS just gets info, can't trigger prompt programmatically
      alert('لتثبيت التطبيق: اضغط على زر "مشاركة" (Share) ثم اختر "إضافة للشاشة الرئيسية" (Add to Home Screen) ✨');
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa_prompt_dismissed', new Date().toISOString());
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-[70] md:hidden"
        >
          <div className="bg-[#1A1A1A]/90 backdrop-blur-xl border border-white/10 p-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B00] to-[#FF9E53] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF6B00]/20">
                <Download className="text-white" size={24} />
              </div>
              <div>
                <h4 className="text-white font-black text-sm">ثبت تطبيق زاچ عروض</h4>
                <p className="text-[#9A9A9A] text-[10px] font-bold mt-0.5">تابع أحدث الخصومات أسرع وأسهل</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleInstall}
                className="bg-white text-black px-5 py-2.5 rounded-xl font-black text-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                {platform === 'ios' ? <Share size={14} /> : null}
                {platform === 'ios' ? 'تثبيت' : 'تثبيت الآن'}
              </button>
              <button
                onClick={handleDismiss}
                className="w-10 h-10 flex items-center justify-center text-[#9A9A9A] hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
