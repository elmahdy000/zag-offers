'use client';

import { Bell, Search, User, Inbox, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from './shared/Toast';

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
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');

  // Get token and user from localStorage (simplified for now)
  const [authData, setAuthData] = useState<{ token: string; userId: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = document.cookie.split('; ').find(row => row.startsWith('admin_token='))?.split('=')[1];
      const userStr = localStorage.getItem('admin_user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        setAuthData({ token, userId: user.id });
      }
    }
  }, []);

  const { data: pendingCount = 0 } = useQuery<number>({
    queryKey: ['pending-count'],
    queryFn: fetchPendingCount,
    staleTime: 30000,
  });

  const socket = useSocket(authData?.token ?? null, authData?.userId ?? null, 'ADMIN');

  useEffect(() => {
    if (!socket) return;

    const handleAdminNotification = (data: any) => {
      console.log('Received admin notification:', data);
      
      // Safety check: if data is null/undefined or not an object, ignore
      if (!data || typeof data !== 'object') {
        console.warn('Received malformed socket data:', data);
        return;
      }

      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['pending-items'] });
      queryClient.invalidateQueries({ queryKey: ['global-stats'] });

      // Show Toast with fallback values
      const title = data.title || 'إشعار جديد';
      const body = data.body || '';
      const message = body ? `${title}: ${body}` : title;
      
      showToast(
        message,
        data.type === 'NEW_PENDING_STORE' || data.type === 'NEW_PENDING_OFFER' ? 'success' : 'info'
      );
    };

    socket.on('admin_notification', handleAdminNotification);

    return () => {
      socket.off('admin_notification', handleAdminNotification);
    };
  }, [socket, queryClient, showToast]);

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md lg:px-10">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="البحث السريع..."
          className="h-[44px] w-full rounded-2xl border border-slate-200 bg-slate-50/50 pr-11 pl-4 text-sm font-medium focus:border-orange-500 focus:bg-white focus:outline-none transition-all shadow-inner"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 mr-4">
        <button 
          onClick={() => router.push('/dashboard/approvals')}
          className="relative flex h-[44px] w-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-orange-500 hover:text-orange-600 transition-all shadow-sm"
          title="التنبيهات ومركز الموافقات"
        >
          <Bell size={20} />
          {pendingCount > 0 && (
            <span className="absolute -top-1.5 -left-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-black text-white ring-2 ring-white shadow-lg animate-bounce">
              {pendingCount}
            </span>
          )}
        </button>

        <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block" />

        <button 
          onClick={() => router.push('/dashboard/settings')}
          className="flex items-center gap-3 pl-1 pr-4 py-1.5 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group"
        >
          <div className="h-9 w-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
            <User size={18} />
          </div>
          <div className="flex flex-col items-start hidden sm:flex">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Administrator</span>
             <span className="text-xs font-black text-slate-900">المدير العام</span>
          </div>
        </button>
      </div>
    </header>
  );
}
