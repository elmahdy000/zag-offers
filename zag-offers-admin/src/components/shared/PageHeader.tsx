'use client';

import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  icon: LucideIcon;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({ 
  title, 
  description, 
  subtitle, 
  icon: Icon, 
  actions, 
  children 
}: PageHeaderProps) {
  const displaySubtitle = subtitle || description;
  
  return (
    <div className="admin-page-header mb-7 flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <div className="admin-page-header-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-orange-600">
          <Icon size={20} strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-[26px] font-bold text-slate-900 leading-relaxed sm:text-[30px]">{title}</h1>
          {displaySubtitle && <p className="mt-1 max-w-3xl text-xs font-semibold leading-6 text-slate-500">{displaySubtitle}</p>}
        </div>
      </div>
      {(actions || children) && (
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}
