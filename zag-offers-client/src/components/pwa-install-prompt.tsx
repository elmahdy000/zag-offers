'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'other'>('other');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

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
      if (daysPassed < 3) return; // Show every 3 days if not installed
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
      setTimeout(() => setShow(true), 3000);
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
      if (outcome === 'accepted') setShow(false);
      setDeferredPrompt(null);
    } else if (platform === 'ios') {
      setShowIOSInstructions(true);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa_prompt_dismissed', new Date().toISOString());
  };

  return (
    <>
      <AnimatePresence>
        {show && !showIOSInstructions && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 z-[70] md:hidden"
          >
            <div className="bg-[#1E1E1E]/95 backdrop-blur-2xl border border-white/10 p-4 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B00] to-[#D95A00] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-950/20">
                  <Download className="text-white" size={24} />
                </div>
                <div>
                  <h4 className="text-white font-black text-xs">ثبت تطبيق زاچ</h4>
                  <p className="text-[#9A9A9A] text-[9px] font-bold mt-0.5">تابع العروض والخصومات أسرع وأسهل</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleInstall}
                  className="bg-white text-black px-5 py-2.5 rounded-xl font-black text-[11px] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  {platform === 'ios' ? <Share size={14} /> : null}
                  {platform === 'ios' ? 'تثبيت' : 'تثبيت الآن'}
                </button>
                <button onClick={handleDismiss} className="w-8 h-8 flex items-center justify-center text-[#9A9A9A] hover:text-white">
                  <X size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showIOSInstructions && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowIOSInstructions(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="relative w-full max-w-sm bg-[#1E1E1E] border border-white/10 rounded-[3rem] p-8 pb-10 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-[#FF6B00] to-[#D95A00] rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-orange-950/40">
                <Download className="text-white" size={40} />
              </div>
              <h3 className="text-xl font-black text-white mb-4">ثبت التطبيق على الآيفون</h3>
              <div className="space-y-6 text-right">
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-[#FF6B00] font-black shrink-0">1</div>
                  <p className="text-sm font-bold text-white/80 leading-relaxed">
                    اضغط على زر **مشاركة (Share)** الموجود في شريط الأدوات بالأسفل.
                  </p>
                </div>
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-[#FF6B00] font-black shrink-0">2</div>
                  <p className="text-sm font-bold text-white/80 leading-relaxed">
                    مرر للأسفل واضغط على **إضافة للشاشة الرئيسية (Add to Home Screen)**.
                  </p>
                </div>
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-[#FF6B00] font-black shrink-0">3</div>
                  <p className="text-sm font-bold text-white/80 leading-relaxed">
                    اضغط على **إضافة (Add)** في الزاوية العلوية لتأبيت التطبيق.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowIOSInstructions(false)}
                className="mt-8 w-full py-4 bg-white text-black rounded-2xl font-black text-sm"
              >
                فهمت، شكراً!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
