'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Menu, X, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { vendorApi, getVendorStoreId } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import { secureStoreData } from '@/lib/crypto';
import { OfflineSync } from '@/lib/offline-sync';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      OfflineSync.init();

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      const storeId = getVendorStoreId();
      if (!storeId) {
        vendorApi().get('/stores/my-dashboard')
          .then((res: { data?: { storeId?: string } }) => {
            if (res.data?.storeId) {
              secureStoreData.save(res.data.storeId);
            }
          })
          .catch(() => {});
      }

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return (
    <div className="flex bg-bg min-h-screen relative overflow-x-hidden">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <div className={`
        fixed lg:sticky top-0 right-0 h-screen z-[70] transition-transform duration-500
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen w-full">
        {/* Connection Status Banner */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-500 text-white text-[10px] font-black py-1 px-4 text-center overflow-hidden flex items-center justify-center gap-2"
            >
              <WifiOff size={12} /> انقطع الاتصال — أنت تعمل في وضع الأوفلاين (سيتم مزامنة العمليات لاحقاً)
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Header */}
        <header className="lg:hidden glass sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-bg/80">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-white font-black text-xs">Z</span>
             </div>
             <div className="flex flex-col">
                <span className="text-text font-black text-sm tracking-tight leading-none">لوحة التاجر</span>
                {!isOnline && <span className="text-[9px] text-red-500 font-bold mt-0.5">وضع الأوفلاين</span>}
             </div>
          </div>
          
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="w-10 h-10 glass rounded-xl flex items-center justify-center text-text-dim hover:text-primary transition-all border border-white/5"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {/* Dynamic Padding for Desktop & Mobile Bottom Nav */}
        <main className="flex-1 w-full max-w-[100vw] overflow-x-hidden pb-32 lg:pb-0">
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
