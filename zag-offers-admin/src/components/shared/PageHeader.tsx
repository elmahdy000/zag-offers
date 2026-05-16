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
    <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-orange-600 border border-slate-100 shadow-sm transition-all hover:bg-orange-50 hover:border-orange-200">
          <Icon size={24} strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">{title}</h1>
          {displaySubtitle && <p className="text-sm font-medium text-slate-500 mt-1.5">{displaySubtitle}</p>}
        </div>
      </div>
      {(actions || children) && (
        <div className="flex items-center gap-3">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}
