'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد الحذف',
  cancelText = 'إلغاء',
  isLoading = false,
  type = 'danger'
}: ConfirmModalProps) {
  const getStyles = () => {
    switch (type) {
      case 'warning':
        return {
          icon: <AlertTriangle size={36} className="text-amber-500" />,
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/20',
          button: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
        };
      case 'info':
        return {
          icon: <AlertTriangle size={36} className="text-blue-500" />,
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
          button: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20'
        };
      default: // danger
        return {
          icon: <AlertTriangle size={36} className="text-red-500" />,
          bg: 'bg-red-500/10',
          border: 'border-red-500/20',
          button: 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
        };
    }
  };

  const styles = getStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md glass rounded-[2.5rem] border border-white/10 p-8 shadow-2xl bg-bg/90"
            dir="rtl"
          >
            <button 
              onClick={onClose}
              className="absolute left-6 top-6 p-2 text-text-dim hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
 
            <div className="flex flex-col items-center text-center">
              <div className={`w-20 h-20 ${styles.bg} rounded-[2rem] flex items-center justify-center mb-6 border ${styles.border}`}>
                {styles.icon}
              </div>
 
              <h3 className="text-2xl font-black text-text mb-3 tracking-tight">{title}</h3>
              <p className="text-text-dim font-bold text-sm leading-relaxed mb-10 max-w-[280px]">
                {message}
              </p>
 
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`flex-1 ${styles.button} text-white font-black py-4 rounded-2xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm`}
                >
                  <Trash2 size={18} />
                  {confirmText}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 glass text-text font-black py-4 rounded-2xl hover:bg-white/5 active:scale-[0.98] transition-all text-sm border border-white/5"
                >
                  {cancelText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
