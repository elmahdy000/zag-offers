import React from 'react';
import Link from 'next/link';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center p-6 text-center dir-rtl" dir="rtl">
      <div className="max-w-md w-full bg-[#242424] border border-white/5 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#FF6B00]/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-8 border border-white/5">
            <WifiOff size={48} className="text-[#F0F0F0]/20" />
          </div>

          <h1 className="text-3xl font-black text-[#F0F0F0] mb-4 tracking-tight">لا يوجد اتصال بالإنترنت</h1>
          
          <div className="space-y-4 mb-10">
            <p className="text-[#F0F0F0]/60 text-sm font-bold leading-relaxed">
              عذراً، يبدو أنك غير متصل بالشبكة حالياً. يرجى التحقق من اتصالك والمحاولة مرة أخرى.
            </p>
            <p className="text-[#F0F0F0]/40 text-[11px] font-bold border-t border-white/5 pt-4">
              بعض الصفحات التي قمت بزيارتها مسبقاً قد تظل متاحة للعرض بشكل مؤقت.
            </p>
          </div>

          <Link 
            href="/"
            className="w-full bg-[#FF6B00] text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-[#FF6B00]/20 hover:bg-[#FF8533] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <RefreshCw size={18} />
            إعادة المحاولة
          </Link>
          
          <p className="mt-8 text-[9px] font-black text-[#F0F0F0]/20 uppercase tracking-[0.3em]">Zag Offers Offline Mode</p>
        </div>
      </div>
    </div>
  );
}
