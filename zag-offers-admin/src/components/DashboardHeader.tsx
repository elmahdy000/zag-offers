'use client';

import { Bell, Search, User } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';

async function fetchPendingCount() {
  try {
    const [storesResult, offersResult] = await Promise.allSettled([
      adminApi().get<any[]>('/admin/stores/pending'),
      adminApi().get<any[]>('/admin/offers/pending'),
    ]);
    const sc = storesResult.status === 'fulfilled' ? storesResult.value.data.length : 0;
    const oc = offersResult.status === 'fulfilled' ? offersResult.value.data.length : 0;
    return sc + oc;
  } catch { return 0; }
}

export default function DashboardHeader() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data: pendingCount = 0 } = useQuery<number>({
    queryKey: ['pending-count'],
    queryFn: fetchPendingCount,
    staleTime: 30000,
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md lg:px-10">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="البحث السريع..."
          className="h-[40px] w-full rounded-xl border border-slate-200 bg-slate-50/50 pr-11 pl-4 text-sm font-medium focus:border-orange-500 focus:bg-white focus:outline-none transition-all"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mr-4">
        <button 
          onClick={() => router.push('/dashboard/approvals')}
          className="relative flex h-[40px] w-[40px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
          title="التنبيهات ومركز الموافقات"
        >
          <Bell size={18} />
          {pendingCount > 0 && (
            <span className="absolute -top-1.5 -left-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-bold text-white ring-2 ring-white shadow-sm">
              {pendingCount}
            </span>
          )}
        </button>

        <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block" />

        <button 
          onClick={() => router.push('/dashboard/settings')}
          className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
        >
          <div className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            <User size={16} />
          </div>
          <span className="text-xs font-bold text-slate-700 hidden sm:block">الأدمن</span>
        </button>
      </div>
    </header>
  );
}
