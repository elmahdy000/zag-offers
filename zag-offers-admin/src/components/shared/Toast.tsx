'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

type ToastTone = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ToastContextType {
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[10000] flex flex-col items-center gap-3 w-full max-w-md px-4 pointer-events-none">
        <AnimatePresence mode="multiple">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`
                pointer-events-auto
                relative flex items-center gap-3 w-full rounded-2xl px-6 py-4 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.2)] 
                border border-white/20 backdrop-blur-xl
                ${toast.tone === 'success' ? 'bg-emerald-600/95 text-white' : ''}
                ${toast.tone === 'error' ? 'bg-rose-600/95 text-white' : ''}
                ${toast.tone === 'info' ? 'bg-slate-900/95 text-white' : ''}
              `}
            >
              <div className="shrink-0">
                {toast.tone === 'success' && <CheckCircle2 size={20} className="text-emerald-100" />}
                {toast.tone === 'error' && <AlertTriangle size={20} className="text-rose-100" />}
                {toast.tone === 'info' && <Info size={20} className="text-slate-100" />}
              </div>
              
              <p className="flex-1 text-sm font-bold leading-relaxed">
                {toast.message}
              </p>

              <button 
                onClick={() => removeToast(toast.id)}
                className="shrink-0 h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
