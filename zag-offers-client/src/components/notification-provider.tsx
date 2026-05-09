'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Tag, CheckCircle2, X } from 'lucide-react';
import { useSocket } from '@/lib/socket';

interface Notification {
  id: string;
  title: string;
  body: string;
  type?: 'NEW_OFFER' | 'COUPON_UPDATE' | 'GENERAL' | string;
  show?: boolean;
}

const NotificationContext = createContext<{
  addNotification: (title: string, body: string, type?: any) => void;
} | null>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const { socket, isConnected, connectionStatus } = useSocket(token);

  useEffect(() => {
    const t = document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];
    setToken(t || null);
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for new offers
    socket.on('new_offer', (data: any) => {
      addNotification(
        `🔥 عرض جديد!`,
        `${data.storeName}: ${data.title}`,
        'NEW_OFFER'
      );
    });

    // Listen for coupon status updates
    socket.on('coupon_update', (data: any) => {
      const statusText = data.status === 'USED' ? 'تم تفعيله بنجاح' : 'انتهت صلاحيته';
      addNotification(
        `🎫 تحديث للكوبون`,
        `كوبون العرض "${data.offerTitle}" ${statusText}`,
        'COUPON_UPDATE'
      );
    });

    return () => {
      socket.off('new_offer');
      socket.off('coupon_update');
    };
  }, [socket]);

  const addNotification = (title: string, body: string, type: string) => {
    const notification = { id: Date.now().toString(), title, body, type, show: true };
    setNotifications((prev) => [...prev, notification]);
    setTimeout(() => {
      setNotifications((prev) => prev.map((n) => n.id === notification.id ? { ...n, show: false } : n));
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      }, 300);
    }, 5000);
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {/* Connection Status Indicator */}
      {connectionStatus === 'error' && (
        <div className="fixed bottom-20 left-4 z-50 px-4 py-2 bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-black rounded-xl">
          ⚠️ مشكلة في الاتصال
        </div>
      )}
      {connectionStatus === 'connecting' && (
        <div className="fixed bottom-20 left-4 z-50 px-4 py-2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-black rounded-xl">
          🔄 جاري الاتصال...
        </div>
      )}

      {children}

      {/* Notification Toasts */}
      <div className="fixed top-4 left-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-start gap-3 px-4 py-3 bg-[#FF6B00] text-white text-sm font-black rounded-xl shadow-lg"
            >
              {notif.type === 'NEW_OFFER' ? <Tag size={20} /> : 
               notif.type === 'COUPON_UPDATE' ? <CheckCircle2 size={20} /> : 
               <Bell size={20} />}
              
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-black text-sm leading-tight">{notif.title}</h4>
                <p className="text-white/80 text-xs mt-1 font-medium leading-relaxed">{notif.body}</p>
              </div>
              
              <button 
                onClick={() => setNotifications(prev => prev.filter(item => item.id !== notif.id))}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={16} />
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
