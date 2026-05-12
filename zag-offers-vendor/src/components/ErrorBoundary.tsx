'use client';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-bg text-center">
          <div className="max-w-md w-full glass p-10 rounded-[3rem] border border-red-500/10 shadow-2xl shadow-red-500/5">
            <div className="w-20 h-20 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-red-500/20">
              <AlertCircle size={40} className="text-red-500" />
            </div>
            
            <h1 className="text-2xl font-black text-white mb-4">عذراً، حدث خطأ غير متوقع</h1>
            <p className="text-text-dim font-bold text-sm leading-relaxed mb-10">
              واجه التطبيق مشكلة تقنية. لا تقلق، بياناتك في أمان. يمكنك محاولة إعادة تحميل الصفحة.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <RotateCcw size={18} /> إعادة المحاولة
              </button>
              
              <Link
                href="/dashboard"
                onClick={() => this.setState({ hasError: false })}
                className="w-full py-4 bg-white/5 text-text font-black rounded-2xl border border-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-3"
              >
                <Home size={18} /> العودة للرئيسية
              </Link>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 p-4 bg-black/40 rounded-2xl text-left overflow-auto max-h-40">
                <code className="text-[10px] text-red-400 font-mono">
                  {this.state.error?.message}
                </code>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
