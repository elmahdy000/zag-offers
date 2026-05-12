'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share } from 'lucide-react';
import { secureStorage } from '@/lib/crypto';

export default function PWAInstallPrompt() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'other'>('other');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 1. Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
                         || (window.navigator as any).standalone;
    
    if (isStandalone) return;

    // 2. Check if dismissed before
    const isDismissed = secureStorage.get<string>('vendor_pwa_dismissed');
    if (isDismissed) {
      const dismissedDate = new Date(isDismissed);
      const now = new Date();
      const daysPassed = (now.getTime() - dismissedDate.getTime()) / (1000 * 3600 * 24);
      if (daysPassed < 3) return; // For vendors, show more often (every 3 days) if not installed
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
      setTimeout(() => setShow(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    if (/iphone|ipad|ipod/.test(ua)) {
      setTimeout(() => setShow(true), 4000);
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
      alert('لتثبيت لوحة التاجر: اضغط على زر "مشاركة" (Share) ثم اختر "إضافة للشاشة الرئيسية" (Add to Home Screen) لتصلك الإشعارات فوراً 🔔');
    }
  };

  const handleDismiss = () => {
    setShow(false);
    secureStorage.set('vendor_pwa_dismissed', new Date().toISOString());
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-[100] md:hidden"
        >
          <div className="bg-[#1A1A1A] border border-primary/20 p-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Download className="text-white" size={24} />
              </div>
              <div>
                <h4 className="text-white font-black text-sm">ثبت لوحة التاجر</h4>
                <p className="text-text-dim text-[10px] font-bold mt-0.5">لاستقبال إشعارات العملاء والطلبات</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleInstall}
                className="bg-primary text-white px-5 py-2.5 rounded-xl font-black text-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                {platform === 'ios' ? <Share size={14} /> : null}
                تثبيت
              </button>
              <button
                onClick={handleDismiss}
                className="w-10 h-10 flex items-center justify-center text-text-dim hover:text-white"
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
