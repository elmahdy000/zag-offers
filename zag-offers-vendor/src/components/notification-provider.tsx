'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MessageSquare, CheckCircle2, X, Tag, AlertCircle, AlertTriangle } from 'lucide-react';
import { useSocket } from '@/lib/socket';
import { getCookie } from '@/lib/api';
import { onGlobalError } from '@/lib/error-events';

interface Notification {
  id: string;
  title: string;
  body: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  show?: boolean;
}

const SEVERITY_CONFIG = {
  success: { icon: CheckCircle2, bg: 'bg-emerald-500/20 text-emerald-400', bar: 'bg-emerald-500', duration: 4000 },
  error: { icon: AlertCircle, bg: 'bg-red-500/20 text-red-400', bar: 'bg-red-500', duration: 12000 },
  warning: { icon: AlertTriangle, bg: 'bg-amber-500/20 text-amber-400 group-hover:bg-amber-500/30', bar: 'bg-amber-500', duration: 8000 },
  info: { icon: Bell, bg: 'bg-primary/20 text-primary', bar: 'bg-primary', duration: 6000 },
};

const NotificationContext = createContext<{
  addNotification: (title: string, body?: string, type?: string) => void;
  addError: (title: string, body?: string) => void;
  addSuccess: (title: string, body?: string) => void;
  addWarning: (title: string, body?: string) => void;
} | null>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const { socket } = useSocket(token);

  useEffect(() => {
    const t = getCookie('auth_token');
    setToken(t);
  }, []);

  const show = useCallback((title: string, body: string, severity: Notification['severity']) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    const duration = SEVERITY_CONFIG[severity].duration;
    setNotifications((prev) => [...prev, { id, title, body, severity, show: true }]);

    setTimeout(() => {
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, show: false } : n));
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 300);
    }, duration);
  }, []);

  const addNotification = useCallback((title: string, body?: string, type?: string) => {
    const severity: Notification['severity'] =
      type === 'error' || type === 'OFFER_REJECTED' || type === 'STORE_REJECTED' ? 'error' :
      type === 'success' || type === 'OFFER_APPROVED' || type === 'STORE_APPROVED' ? 'success' :
      type === 'warning' ? 'warning' : 'info';
    show(title, body || '', severity);
  }, [show]);

  const addError = useCallback((title: string, body?: string) => show(title, body || '', 'error'), [show]);
  const addSuccess = useCallback((title: string, body?: string) => show(title, body || '', 'success'), [show]);
  const addWarning = useCallback((title: string, body?: string) => show(title, body || '', 'warning'), [show]);

  useEffect(() => {
    return onGlobalError((payload) => {
      show(payload.message, '', payload.severity);
    });
  }, [show]);

  useEffect(() => {
    if (!socket) return;
    socket.on('merchant_notification', (data: { type: string, title: string, body: string, payload?: any }) => {
      addNotification(data.title, data.body, data.type);
    });
    return () => { socket.off('merchant_notification'); };
  }, [socket, addNotification]);

  return (
    <NotificationContext.Provider value={{ addNotification, addError, addSuccess, addWarning }}>
      {children}
      <div className="fixed top-4 right-4 left-4 sm:left-auto sm:right-4 z-[1000] flex flex-col gap-3 max-w-sm w-auto pointer-events-none" dir="rtl">
        <AnimatePresence>
          {notifications.map((notif) => {
            const cfg = SEVERITY_CONFIG[notif.severity];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className="pointer-events-auto flex items-stretch gap-4 p-1 bg-[#121212]/90 backdrop-blur-xl border border-glass-border text-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden group"
              >
                <div className={`w-14 rounded-[1.7rem] flex items-center justify-center shrink-0 transition-colors duration-500 ${cfg.bg}`}>
                  <Icon size={24} />
                </div>
                <div className="flex-1 py-4 pr-1 pl-4 min-w-0">
                  <h4 className="text-[14px] font-black text-white leading-tight truncate">{notif.title}</h4>
                  {notif.body && <p className="text-[11px] text-white/50 mt-1 font-bold leading-relaxed line-clamp-2">{notif.body}</p>}
                </div>
                <button
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                  className="px-4 flex items-center justify-center text-text-tertiary hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: cfg.duration / 1000, ease: 'linear' }}
                  className={`absolute bottom-0 left-0 h-1 ${cfg.bar}`}
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
