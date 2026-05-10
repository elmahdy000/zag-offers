'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MessageSquare, CheckCircle2, X, Tag } from 'lucide-react';
import { useSocket } from '@/lib/socket';
import { getCookie } from '@/lib/api';

interface Notification {
  id: string;
  title: string;
  body: string;
  type?: string;
  show?: boolean;
}

const NotificationContext = createContext<{
  addNotification: (title: string, body: string, type?: string) => void;
} | null>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const { socket } = useSocket(token);

  useEffect(() => {
    const t = getCookie('auth_token');
    setToken(t);
  }, []);

  const addNotification = useCallback((title: string, body: string, type?: string) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, title, body, type, show: true }]);
    
    setTimeout(() => {
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, show: false } : n));
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 300);
    }, 8000);
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('coupon_shared', (data: { customerName: string, code: string }) => {
      addNotification(
        '💬 عميل تواصل معك!',
        `العميل ${data.customerName} شارك معك الكوبون ${data.code} عبر واتساب.`,
        'COUPON_SHARED'
      );
    });

    socket.on('coupon_generated', (data: { offerTitle: string, code: string }) => {
      addNotification(
        '🎟️ كوبون جديد!',
        `عميل حصل على كوبون لعرض: ${data.offerTitle}`,
        'COUPON_GENERATED'
      );
    });

    return () => {
      socket.off('coupon_shared');
      socket.off('coupon_generated');
    };
  }, [socket, addNotification]);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}

      {/* Notification Toasts */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="pointer-events-auto flex items-start gap-3 px-4 py-4 bg-[#1A1A1A] border border-white/10 text-white rounded-2xl shadow-2xl"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                {notif.type === 'COUPON_SHARED' ? <MessageSquare size={20} /> : 
                 notif.type === 'COUPON_GENERATED' ? <Tag size={20} /> : 
                 <Bell size={20} />}
              </div>
              
              <div className="flex-1 py-0.5">
                <h4 className="text-sm font-black text-white">{notif.title}</h4>
                <p className="text-xs text-text-dim mt-1 font-bold leading-relaxed">{notif.body}</p>
              </div>
              
              <button 
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                className="p-1 text-white/20 hover:text-white transition-colors"
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
