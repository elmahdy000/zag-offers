'use client';

import { Bell, User } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useSocketContext } from '@/components/SocketProvider';
import { useToast } from './shared/Toast';
import AdminThemeToggle from './AdminThemeToggle';
import { ADMIN_PERMISSIONS as P, canAccess, readAdminUser } from '@/lib/admin-auth';

async function fetchPendingCount() {
  try {
    const [storesResult, offersResult] = await Promise.allSettled([
      adminApi().get<unknown[]>('/admin/stores/pending'),
      adminApi().get<unknown[]>('/admin/offers/pending'),
    ]);
    const sc = storesResult.status === 'fulfilled' ? storesResult.value.data.length : 0;
    const oc = offersResult.status === 'fulfilled' ? offersResult.value.data.length : 0;
    return sc + oc;
  } catch { return 0; }
}

export default function DashboardHeader() {
  const router = useRouter();
  const adminUser = useMemo(() => readAdminUser(), []);
  const canViewApprovals = canAccess(adminUser, P.APPROVALS_MANAGE);
  const canViewSettings = canAccess(adminUser, P.SETTINGS_MANAGE);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: pendingCount = 0 } = useQuery<number>({
    queryKey: ['pending-count'],
    queryFn: fetchPendingCount,
    staleTime: 30000,
    enabled: canViewApprovals,
  });

  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket) return;

    const handleAdminNotification = (data: Record<string, unknown>) => {
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
      const title = typeof data.title === 'string' ? data.title : 'إشعار جديد';
      const body = typeof data.body === 'string' ? data.body : '';
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
    <header className="admin-header sticky top-0 z-30 flex h-[76px] items-center justify-between px-5 lg:px-8">
      <div className="admin-header-brand mr-14 flex items-center gap-2 lg:mr-0">
        <span className="text-sm font-bold">لوحة الإدارة</span>
        <span className="admin-header-dot" />
        <span className="hidden text-[10px] font-bold sm:inline">Zag Offers</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <AdminThemeToggle compact />
        {canViewApprovals && <button
          onClick={() => router.push('/dashboard/approvals')}
          className="admin-icon-button relative"
          title="التنبيهات ومركز الموافقات"
          aria-label="التنبيهات ومركز الموافقات"
        >
          <Bell size={20} />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -left-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-600 px-1 text-xs font-bold text-white ring-2 ring-white">
              {pendingCount}
            </span>
          )}
        </button>}

        <div className="admin-header-divider hidden h-8 w-px sm:block" />

        <button 
          onClick={() => canViewSettings && router.push('/dashboard/settings')}
          className="admin-profile-button group flex items-center gap-3 rounded-2xl py-1.5 pl-2 pr-1.5"
        >
          <div className="admin-profile-icon flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-105">
            <User size={18} />
          </div>
          <div className="flex flex-col items-start hidden sm:flex">
             <span className="admin-profile-name text-xs font-bold">{adminUser?.name || 'الإدارة'}</span>
          </div>
        </button>
      </div>
    </header>
  );
}
