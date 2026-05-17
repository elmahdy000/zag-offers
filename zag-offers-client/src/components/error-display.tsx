"use client";

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorDisplayProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorDisplay({ message = 'حدث خطأ أثناء تحميل البيانات', onRetry }: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center py-20 gap-4 text-center">
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
        <AlertCircle className="text-red-500" size={32} />
      </div>
      <h3 className="text-lg font-bold text-white">عذراً، حدث خطأ!</h3>
      <p className="text-sm text-[#9A9A9A] max-w-xs leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B00] text-white font-bold rounded-xl hover:bg-[#E56000] transition-all shadow-lg"
        >
          <RefreshCw size={16} />
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}

export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (value === null) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
