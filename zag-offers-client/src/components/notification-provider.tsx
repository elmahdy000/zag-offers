'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Tag, CheckCircle2, X } from 'lucide-react';
import { useSocket } from '@/lib/socket';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  title: string;
  body: string;
  type?: 'NEW_OFFER' | 'COUPON_UPDATE' | 'GENERAL' | string;
  data?: any;
  show?: boolean;
}

const NotificationContext = createContext<{
  addNotification: (title: string, body: string, type?: string, data?: any) => void;
} | null>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const { socket, connectionStatus } = useSocket(token);
  const router = useRouter();

  // Read token from localStorage
  useEffect(() => {
    const updateToken = () => {
      const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      setToken(t);
    };
    updateToken();
    window.addEventListener('auth-change', updateToken);
    window.addEventListener('storage', updateToken);
    return () => {
      window.removeEventListener('auth-change', updateToken);
      window.removeEventListener('storage', updateToken);
    };
  }, []);

  const addNotification = (title: string, body: string, type?: string, data?: any) => {
    const notification = { id: Date.now().toString(), title, body, type, data, show: true };
    setNotifications((prev) => [...prev, notification]);
    setTimeout(() => {
      setNotifications((prev) => prev.map((n) => n.id === notification.id ? { ...n, show: false } : n));
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      }, 300);
    }, 8000); // 8 seconds
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('new_offer', (data: any) => {
      addNotification(
        `🔥 عرض جديد!`,
        `${data.storeName}: ${data.title}`,
        'NEW_OFFER',
        { url: `/offers/${data.offerId}` }
      );
    });

    socket.on('coupon_update', (data: any) => {
      const statusText = data.status === 'USED' ? 'تم تفعيله بنجاح' : 'انتهت صلاحيته';
      addNotification(
        `🎫 تحديث للكوبون`,
        `كوبون العرض "${data.offerTitle}" ${statusText}`,
        'COUPON_UPDATE',
        { url: '/profile/coupons' }
      );
    });

    return () => {
      socket.off('new_offer');
      socket.off('coupon_update');
    };
  }, [socket]);

  const handleToastClick = (notif: Notification) => {
    if (notif.data?.url) {
      router.push(notif.data.url);
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    }
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {/* Connection Error - Subtle & Temporary */}
      <AnimatePresence>
        {connectionStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] pointer-events-none"
          >
            <div className="px-4 py-1.5 rounded-full text-[10px] font-black border bg-red-500/10 border-red-500/20 text-red-400 backdrop-blur-md shadow-lg flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              تنبيه: تعذر الاتصال اللحظي بالخادم
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {children}

      {/* Notification Toasts */}
      <div className="fixed top-4 left-4 z-50 flex flex-col gap-2 max-w-[calc(100vw-2rem)]">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={() => handleToastClick(notif)}
              className={`flex items-start gap-3 px-4 py-3 bg-[#1A1A1A] border border-white/10 text-white text-sm font-black rounded-xl shadow-2xl cursor-pointer hover:border-[#FF6B00]/50 transition-all group active:scale-95`}
            >
              <div className="w-10 h-10 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center text-[#FF6B00] group-hover:bg-[#FF6B00] group-hover:text-white transition-colors">
                {notif.type === 'NEW_OFFER' ? <Tag size={20} /> : 
                 notif.type === 'COUPON_UPDATE' ? <CheckCircle2 size={20} /> : 
                 <Bell size={20} />}
              </div>
              
              <div className="flex-1 min-w-0 py-0.5">
                <h4 className="text-[#F0F0F0] font-black text-sm leading-tight">{notif.title}</h4>
                <p className="text-[#9A9A9A] text-[11px] mt-1 font-bold leading-relaxed line-clamp-2">{notif.body}</p>
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setNotifications(prev => prev.filter(item => item.id !== notif.id));
                }}
                className="p-1 text-white/20 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
