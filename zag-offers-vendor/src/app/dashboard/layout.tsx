'use client';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Menu, X, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteCookie, getCookie } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import { secureStorage, secureUserData } from '@/lib/crypto';
import { OfflineSync } from '@/lib/offline-sync';
import BrandMark from '@/components/BrandMark';
import ThemeToggle from '@/components/ThemeToggle';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    const token = getCookie('auth_token');
    const user = secureUserData.load();

    if (!token || user?.role !== 'MERCHANT') {
      deleteCookie('auth_token');
      secureStorage.clear();
      const reason = user?.role === 'ADMIN' ? 'admin-account' : 'unauthorized';
      router.replace(`/login?reason=${reason}`);
      return;
    }

    const authorizationTimer = window.setTimeout(() => setIsAuthorized(true), 0);

    if (typeof window !== 'undefined') {
      const statusTimer = window.setTimeout(() => setIsOnline(navigator.onLine), 0);
      const stopOfflineSync = OfflineSync.init();

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.clearTimeout(authorizationTimer);
        window.clearTimeout(statusTimer);
        stopOfflineSync?.();
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [pathname, router]);

  if (!isAuthorized) {
    return <div className="min-h-screen bg-bg" aria-busy="true" />;
  }

  return (
    <div className="vendor-shell flex bg-bg min-h-screen relative overflow-x-hidden">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-[#071426]/80 z-[60] lg:hidden"
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
        <header className="vendor-mobile-header lg:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
             <BrandMark priority className="h-10 w-10" />
             <div className="flex flex-col">
                <span className="text-text font-black text-sm tracking-tight leading-none">لوحة التاجر</span>
                {!isOnline && <span className="text-[9px] text-red-500 font-bold mt-0.5">وضع الأوفلاين</span>}
             </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="icon-button"
              aria-label="فتح القائمة"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>

        {/* Dynamic Padding for Desktop & Mobile Bottom Nav */}
        <main className="vendor-main flex-1 w-full max-w-[100vw] overflow-x-hidden pb-28 lg:pb-0">
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
