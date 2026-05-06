'use client';
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, RefreshCcw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isHttps, setIsHttps] = useState(true);
  const html5QrCodeScanner = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // Check for HTTPS (required for camera in modern browsers)
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setIsHttps(false);
      setError("الكاميرا تتطلب اتصالاً آمناً (HTTPS). برجاء التأكد من رابط الموقع.");
      return;
    }

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("qr-reader");
        html5QrCodeScanner.current = scanner;

        const config = {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        // Try to start with environment camera (back camera)
        await scanner.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            scanner.stop().then(() => {
              onScan(decodedText);
            }).catch(e => console.error(e));
          },
          (errorMessage) => {
            // silent fail for non-matching frames
          }
        );
      } catch (err: any) {
        console.error("Scanner Error:", err);
        if (err?.includes("NotFoundException")) {
          setError("لم يتم العثور على كاميرا في هذا الجهاز.");
        } else if (err?.includes("NotAllowedError")) {
          setError("برجاء إعطاء المتصفح صلاحية الوصول للكاميرا.");
        } else {
          setError("فشل في تشغيل الكاميرا. تأكد من إغلاق أي تطبيقات أخرى تستخدم الكاميرا.");
        }
      }
    };

    const timer = setTimeout(startScanner, 1000);

    return () => {
      clearTimeout(timer);
      if (html5QrCodeScanner.current && html5QrCodeScanner.current.isScanning) {
        html5QrCodeScanner.current.stop().catch(e => console.error("Stop Error:", e));
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
               <Camera className="text-primary" size={20} />
             </div>
             <div>
               <h2 className="text-white font-black text-lg">ماسح الكود</h2>
               <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Mobile Camera Active</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scanner Container */}
        <div className="relative group">
           <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full opacity-50" />
           <div 
             id="qr-reader" 
             className="relative z-10 glass rounded-[2.5rem] border-2 border-primary/40 overflow-hidden shadow-2xl shadow-primary/20 aspect-square"
           />
           
           {/* Custom Overlay (Only shown when not error) */}
           {!error && (
             <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-64 h-64 border-2 border-primary/20 rounded-[2rem] relative">
                   <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                   <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                   <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                   <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-2xl" />
                   
                   <motion.div 
                     animate={{ top: ['5%', '95%'] }}
                     transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                     className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_rgba(255,126,26,0.8)]"
                   />
                </div>
             </div>
           )}
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex flex-col items-center text-center gap-3"
          >
            <AlertTriangle className="text-red-500" size={32} />
            <p className="text-red-500 text-xs font-black leading-relaxed">{error}</p>
            {!isHttps && (
              <p className="text-[10px] text-red-500/60 font-bold">
                متصفحات الجوال تمنع الوصول للكاميرا إلا من خلال روابط HTTPS مشفرة.
              </p>
            )}
          </motion.div>
        )}

        <div className="mt-12 text-center space-y-5">
           <p className="text-white/40 text-xs font-bold leading-relaxed">
             وجه الكاميرا الخلفية نحو الكوبون ليتم التعرف عليه تلقائياً
           </p>
           <div className="flex items-center justify-center gap-6">
             <button 
               onClick={() => window.location.reload()}
               className="flex items-center gap-2 text-[11px] font-black text-primary hover:underline uppercase tracking-wider"
             >
                <RefreshCcw size={14} /> إعادة المحاولة
             </button>
           </div>
        </div>
      </div>

      <style jsx global>{`
        #qr-reader {
          border: none !important;
          background: rgba(255,255,255,0.02) !important;
        }
        #qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 2.5rem !important;
        }
      `}</style>
    </motion.div>
  );
}
