'use client';

import { ClipboardCheck, Store, Zap } from 'lucide-react';
import Link from 'next/link';

interface DashboardHeaderProps {
  pendingCount: number;
}

export function DashboardHeader({ pendingCount }: DashboardHeaderProps) {
  return (
    <header className="relative mb-6 overflow-hidden rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-100 lg:p-10 border border-slate-50">
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-orange-500/[0.02] blur-[100px]" />
      
      <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-600 px-3 py-1 text-[9px] font-bold text-white">
              <Zap size={10} fill="white" />
              <span>ZAG OFFERS Admin</span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">مركز التحكم</span>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 lg:text-4xl">
              لوحة <span className="text-orange-500">العمليات</span>
            </h1>
            <p className="max-w-lg text-sm font-bold leading-relaxed text-slate-500">
              متابعة أداء المنصة وإدارة الطلبات المعلقة في الوقت الفعلي.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/approvals"
            className="group relative flex items-center justify-center gap-3 rounded-2xl bg-orange-600 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-orange-700 shadow-lg shadow-orange-100"
          >
            <ClipboardCheck size={18} />
            <span>طلبات الاعتماد</span>
            {pendingCount > 0 && (
              <span className="flex h-6 min-w-[24px] items-center justify-center rounded-lg bg-slate-950 text-xs text-white">
                {pendingCount}
              </span>
            )}
          </Link>

          <Link
            href="/dashboard/merchants"
            className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-900 transition-all hover:bg-slate-50"
          >
            <Store size={18} className="text-slate-400" />
            <span>المتاجر</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
