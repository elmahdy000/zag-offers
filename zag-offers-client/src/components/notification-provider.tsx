'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Tag, CheckCircle2, X } from 'lucide-react';
import { useSocket } from '@/lib/socket';

interface Notification {
  id: string;
  title: string;
  body: string;
  type?: 'NEW_OFFER' | 'COUPON_UPDATE' | 'GENERAL';
}

const NotificationContext = createContext<{
  addNotification: (title: string, body: string, type?: any) => void;
} | null>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Try to get token from cookies
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];
    if (t) setToken(t);
  }, []);

  const socket = useSocket(token);

  const addNotification = (title: string, body: string, type: any = 'GENERAL') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, title, body, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 6000);
  };

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

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      
      {/* Toast UI */}
      <div className="fixed bottom-8 left-8 z-[100] flex flex-col gap-4 pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.9 }}
              className="pointer-events-auto bg-slate-900/90 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-2xl flex items-center gap-4 min-w-[320px] max-w-md"
            >
              <div className={`p-3 rounded-2xl ${
                n.type === 'NEW_OFFER' ? 'bg-orange-500/20 text-orange-500' : 
                n.type === 'COUPON_UPDATE' ? 'bg-emerald-500/20 text-emerald-500' : 
                'bg-blue-500/20 text-blue-500'
              }`}>
                {n.type === 'NEW_OFFER' ? <Tag size={24} /> : 
                 n.type === 'COUPON_UPDATE' ? <CheckCircle2 size={24} /> : 
                 <Bell size={24} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-black text-sm leading-tight">{n.title}</h4>
                <p className="text-slate-400 text-xs mt-1 font-medium leading-relaxed">{n.body}</p>
              </div>
              
              <button 
                onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))}
                className="text-slate-500 hover:text-white transition-colors"
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
