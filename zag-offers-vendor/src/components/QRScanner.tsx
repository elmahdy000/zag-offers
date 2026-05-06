'use client';
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, RefreshCcw, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string>("Initializing...");
  const html5QrCodeScanner = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const startScanner = async () => {
      try {
        setDebug("Checking permissions...");
        const scanner = new Html5Qrcode("qr-reader");
        html5QrCodeScanner.current = scanner;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        setDebug("Requesting back camera...");
        try {
          // Attempt 1: Back camera
          await scanner.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
              scanner.stop().then(() => onScan(decodedText)).catch(e => console.error(e));
            },
            () => {}
          );
          setDebug("Back camera active.");
        } catch (e1) {
          console.warn("Back camera failed, trying any camera...", e1);
          setDebug("Back camera failed, trying any...");
          // Attempt 2: Any available camera
          await scanner.start(
            { facingMode: "user" }, // or just {}
            config,
            (decodedText) => {
              scanner.stop().then(() => onScan(decodedText)).catch(e => console.error(e));
            },
            () => {}
          );
          setDebug("User camera active.");
        }
      } catch (err: any) {
        console.error("Scanner Error:", err);
        setDebug(`Error: ${err?.message || err}`);
        if (err?.toString().includes("NotAllowedError")) {
          setError("برجاء إعطاء صلاحية الوصول للكاميرا من إعدادات المتصفح.");
        } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          setError("المتصفح يمنع الكاميرا في المواقع غير المشفرة (HTTPS).");
        } else {
          setError("تعذر تشغيل الكاميرا. تأكد أنها غير مستخدمة في تطبيق آخر.");
        }
      }
    };

    const timer = setTimeout(startScanner, 800);

    return () => {
      clearTimeout(timer);
      if (html5QrCodeScanner.current && html5QrCodeScanner.current.isScanning) {
        html5QrCodeScanner.current.stop().catch(e => console.error(e));
      }
    };
  }, [onScan]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6"
    >
      <div className="w-full max-w-md relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
               <Camera className="text-primary" size={20} />
             </div>
             <div>
               <h2 className="text-white font-black text-lg">ماسح الكود</h2>
               <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{debug}</p>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="relative group">
           <div id="qr-reader" className="relative z-10 glass rounded-[2.5rem] border-2 border-primary/40 overflow-hidden aspect-square" />
           {!error && (
             <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-64 h-64 border-2 border-primary/20 rounded-[2rem] relative">
                   <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                   <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                   <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                   <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-2xl" />
                </div>
             </div>
           )}
        </div>

        {error && (
          <div className="mt-8 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex flex-col items-center text-center gap-3">
            <AlertTriangle className="text-red-500" size={32} />
            <p className="text-red-500 text-xs font-black leading-relaxed">{error}</p>
            <p className="text-[9px] text-white/30 font-mono">{debug}</p>
          </div>
        )}

        <div className="mt-12 text-center space-y-5">
           <button onClick={() => window.location.reload()} className="flex items-center gap-2 mx-auto text-[11px] font-black text-primary hover:underline">
              <RefreshCcw size={14} /> إعادة المحاولة
           </button>
        </div>
      </div>

      <style jsx global>{`
        #qr-reader video {
          width: 100% !important; height: 100% !important; object-fit: cover !important; border-radius: 2.5rem !important;
        }
      `}</style>
    </motion.div>
  );
}
