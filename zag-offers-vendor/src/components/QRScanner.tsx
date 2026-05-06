'use client';
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, RefreshCcw, AlertTriangle, Video, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string>("جاري تهيئة الكاميرا...");
  const [cameras, setCameras] = useState<any[]>([]);
  const [activeCam, setActiveCam] = useState<string | null>(null);
  const html5QrCode = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const initScanner = async () => {
      try {
        // 1. Check for HTTPS
        if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          setError("عذراً، الكاميرا تتطلب اتصالاً آمناً (HTTPS). لا يمكن فتح الكاميرا عبر IP أو رابط غير مشفر.");
          setDebug("HTTPS Required");
          return;
        }

        // 2. Get Cameras
        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          setError("لم يتم العثور على أي كاميرا متصلة بهذا الجهاز.");
          return;
        }
        setCameras(devices);

        // 3. Select default (back camera usually has 'back' or is the last one)
        const backCam = devices.find(d => d.label.toLowerCase().includes('back')) || devices[devices.length - 1];
        setActiveCam(backCam.id);
        
        await startCamera(backCam.id);
      } catch (err: any) {
        console.error("Scanner Init Error:", err);
        setError("فشل في الوصول للكاميرا. تأكد من إعطاء الصلاحية للموقع.");
        setDebug(err?.message || "Permission Denied");
      }
    };

    const startCamera = async (cameraId: string) => {
      try {
        if (html5QrCode.current && html5QrCode.current.isScanning) {
          await html5QrCode.current.stop();
        }

        const scanner = new Html5Qrcode("qr-reader");
        html5QrCode.current = scanner;

        setDebug(`جاري تشغيل: ${cameras.find(c => c.id === cameraId)?.label || 'الكاميرا'}`);

        await scanner.start(
          cameraId,
          { fps: 15, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            scanner.stop().then(() => onScan(decodedText));
          },
          () => {}
        );
        setDebug("الكاميرا تعمل الآن");
      } catch (err: any) {
        console.error("Start Camera Error:", err);
        setError("فشل في تشغيل هذه الكاميرا المحددة.");
      }
    };

    const timer = setTimeout(initScanner, 1000);

    return () => {
      clearTimeout(timer);
      if (html5QrCode.current && html5QrCode.current.isScanning) {
        html5QrCode.current.stop().catch(e => console.error(e));
      }
    };
  }, []);

  const switchCamera = async (id: string) => {
    setActiveCam(id);
    if (html5QrCode.current) {
      try {
        if (html5QrCode.current.isScanning) await html5QrCode.current.stop();
        const scanner = new Html5Qrcode("qr-reader");
        html5QrCode.current = scanner;
        await scanner.start(id, { fps: 15, qrbox: { width: 250, height: 250 } }, (text) => {
          scanner.stop().then(() => onScan(text));
        }, () => {});
      } catch (e) { setError("تعذر التبديل لهذه الكاميرا"); }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl overflow-y-auto flex flex-col items-center py-10 px-6"
    >
      <div className="w-full max-w-md relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
               <Camera className="text-primary" size={20} />
             </div>
             <div>
               <h2 className="text-white font-black text-lg">ماسح الكود</h2>
               <p className="text-white/40 text-[10px] font-black uppercase tracking-widest leading-none mt-1">{debug}</p>
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
                   <motion.div animate={{ top: ['10%', '90%'] }} transition={{ duration: 2, repeat: Infinity }} className="absolute left-4 right-4 h-0.5 bg-primary/50 shadow-[0_0_15px_rgba(255,126,26,0.5)]" />
                </div>
             </div>
           )}
        </div>

        {error && (
          <div className="mt-8 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex flex-col items-center text-center gap-3">
            <AlertTriangle className="text-red-500" size={32} />
            <p className="text-red-500 text-xs font-black leading-relaxed">{error}</p>
          </div>
        )}

        {cameras.length > 1 && (
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {cameras.map((cam, idx) => (
              <button 
                key={cam.id} 
                onClick={() => switchCamera(cam.id)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${activeCam === cam.id ? 'bg-primary text-white border-primary' : 'bg-white/5 text-text-dim border-white/5'}`}
              >
                كاميرا {idx + 1}
              </button>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
           <button onClick={() => window.location.reload()} className="flex items-center gap-2 mx-auto text-[11px] font-black text-primary hover:underline">
              <RefreshCcw size={14} /> إعادة المحاولة
           </button>
        </div>
      </div>

      <style jsx global>{`
        #qr-reader video { width: 100% !important; height: 100% !important; object-fit: cover !important; border-radius: 2.5rem !important; }
      `}</style>
    </motion.div>
  );
}
