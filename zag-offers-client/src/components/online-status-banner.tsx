'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OnlineStatusBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-[#FF3B30] text-white py-2 px-4 shadow-lg flex items-center justify-center gap-3 dir-rtl"
          dir="rtl"
        >
          <WifiOff size={14} className="animate-pulse" />
          <p className="text-[11px] font-black tracking-tight">
            أنت غير متصل بالإنترنت. بعض البيانات قد لا تكون محدثة.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
