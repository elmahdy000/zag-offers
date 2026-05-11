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

    socket.on('merchant_notification', (data: { type: string, title: string, body: string, payload?: any }) => {
      addNotification(
        data.title,
        data.body,
        data.type
      );
    });

    return () => {
      socket.off('merchant_notification');
    };
  }, [socket, addNotification]);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}

      {/* Notification Toasts */}
      <div className="fixed top-4 right-4 left-4 sm:left-auto sm:right-4 z-[1000] flex flex-col gap-3 max-w-sm w-auto pointer-events-none" dir="rtl">
        <AnimatePresence>
          {notifications.map((notif) => {
            const isApproved = notif.type === 'OFFER_APPROVED' || notif.type === 'STORE_APPROVED';
            const isRejected = notif.type === 'OFFER_REJECTED' || notif.type === 'STORE_REJECTED';
            
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className="pointer-events-auto flex items-stretch gap-4 p-1 bg-[#121212]/90 backdrop-blur-xl border border-white/10 text-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden group"
              >
                <div className={`w-14 rounded-[1.7rem] flex items-center justify-center shrink-0 transition-colors duration-500 ${
                  isApproved ? 'bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30' : 
                  isRejected ? 'bg-rose-500/20 text-rose-400 group-hover:bg-rose-500/30' : 
                  'bg-primary/20 text-primary group-hover:bg-primary/30'
                }`}>
                  {isApproved ? <CheckCircle2 size={24} /> : 
                   isRejected ? <X size={24} /> : 
                   notif.type === 'COUPON_SHARED' ? <MessageSquare size={24} /> : 
                   notif.type === 'COUPON_GENERATED' ? <Tag size={24} /> : 
                   <Bell size={24} />}
                </div>
                
                <div className="flex-1 py-4 pr-1 pl-4 min-w-0">
                  <h4 className="text-[14px] font-black text-white leading-tight truncate">{notif.title}</h4>
                  <p className="text-[11px] text-white/50 mt-1 font-bold leading-relaxed line-clamp-2">{notif.body}</p>
                </div>
                
                <button 
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                  className="px-4 flex items-center justify-center text-white/10 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>

                {/* Loading progress bar for auto-close */}
                <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 8, ease: 'linear' }}
                  className={`absolute bottom-0 left-0 h-1 ${
                    isApproved ? 'bg-emerald-500' : isRejected ? 'bg-rose-500' : 'bg-primary'
                  }`}
                />
              </motion.div>
            );
          })}
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
