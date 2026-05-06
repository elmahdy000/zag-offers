'use client';
import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // delay initialization to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          formatsToSupport: [
             Html5QrcodeSupportedFormats.QR_CODE,
             Html5QrcodeSupportedFormats.CODE_128,
             Html5QrcodeSupportedFormats.CODE_39
          ],
          showTorchButtonIfSupported: true,
        };

        const scanner = new Html5QrcodeScanner("qr-reader", config, false);
        scannerRef.current = scanner;

        scanner.render(
          (decodedText) => {
            scanner.clear();
            onScan(decodedText);
          },
          (errorMessage) => {
            // silent fail for non-matching frames
          }
        );
      } catch (err) {
        console.error("Scanner init error:", err);
        setError("فشل في تشغيل الكاميرا. تأكد من إعطاء الصلاحية.");
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Scanner clear error:", err));
      }
    };
  }, [onScan]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6"
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
               <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Scanner Mode Active</p>
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
           <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full group-hover:bg-primary/30 transition-all duration-700" />
           <div 
             id="qr-reader" 
             className="relative z-10 glass rounded-[2rem] border-2 border-primary/40 overflow-hidden shadow-2xl shadow-primary/20"
           />
           
           {/* Custom Overlay */}
           <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-64 h-64 border-2 border-primary/20 rounded-3xl relative">
                 <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                 <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                 <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                 <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
                 
                 {/* Scanning Animation */}
                 <motion.div 
                   animate={{ top: ['0%', '100%'] }}
                   transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                   className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_rgba(var(--primary-rgb),0.8)]"
                 />
              </div>
           </div>
        </div>

        {error && (
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-black text-center">
            {error}
          </div>
        )}

        <div className="mt-12 text-center space-y-4">
           <p className="text-white/60 text-sm font-bold">ضع الكود في منتصف المربع للتعرف عليه</p>
           <button 
             onClick={() => window.location.reload()}
             className="flex items-center gap-2 mx-auto text-[11px] font-black text-primary hover:underline uppercase tracking-wider"
           >
              <RefreshCcw size={14} /> إعادة تحميل الكاميرا
           </button>
        </div>
      </div>

      <style jsx global>{`
        #qr-reader {
          border: none !important;
          background: transparent !important;
        }
        #qr-reader__dashboard {
          padding: 20px !important;
          background: rgba(255, 255, 255, 0.02) !important;
          border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
        #qr-reader__dashboard_section_csr button {
          background: #ff7e1a !important; /* primary color */
          color: white !important;
          border: none !important;
          padding: 10px 20px !important;
          border-radius: 12px !important;
          font-weight: 900 !important;
          font-size: 12px !important;
          cursor: pointer !important;
          transition: all 0.3s !important;
        }
        #qr-reader__dashboard_section_csr button:hover {
          transform: scale(1.05) !important;
          box-shadow: 0 10px 20px rgba(255, 126, 26, 0.2) !important;
        }
        #qr-reader video {
          border-radius: 2rem !important;
        }
      `}</style>
    </motion.div>
  );
}
