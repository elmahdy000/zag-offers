'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import {
  ADMIN_PERMISSIONS as P,
  canAccess,
  firstAllowedAdminRoute,
  type AdminPermission,
  type AdminUser,
} from '@/lib/admin-auth';

const routePermissions: Array<[string, AdminPermission]> = [
  ['/dashboard/approvals', P.APPROVALS_MANAGE],
  ['/dashboard/merchants', P.STORES_VIEW],
  ['/dashboard/stores', P.STORES_VIEW],
  ['/dashboard/offers', P.OFFERS_VIEW],
  ['/dashboard/categories', P.CATEGORIES_MANAGE],
  ['/dashboard/banners', P.BANNERS_MANAGE],
  ['/dashboard/coupons', P.COUPONS_VIEW],
  ['/dashboard/users', P.USERS_VIEW],
  ['/dashboard/broadcast', P.BROADCAST_SEND],
  ['/dashboard/chat', P.CHAT_MANAGE],
  ['/dashboard/reports', P.REPORTS_VIEW],
  ['/dashboard/audit-logs', P.AUDIT_VIEW],
  ['/dashboard/moderation', P.REVIEWS_MANAGE],
  ['/dashboard/locations', P.LOCATIONS_MANAGE],
  ['/dashboard/settings', P.SETTINGS_MANAGE],
  ['/dashboard', P.DASHBOARD_VIEW],
];

export default function AdminAccessGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    api.get<AdminUser>('/auth/me').then(({ data: user }) => {
      if (!active) return;
      if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
        router.replace('/login');
        return;
      }
      const currentPermission = routePermissions.find(([route]) =>
        route === '/dashboard' ? pathname === route : pathname.startsWith(route),
      )?.[1];
      sessionStorage.setItem('admin_user', JSON.stringify(user));
      localStorage.setItem('admin_user', JSON.stringify(user));
      if (currentPermission && !canAccess(user, currentPermission)) {
        router.replace(firstAllowedAdminRoute(user));
        return;
      }
      setReady(true);
    }).catch(() => router.replace('/login'));
    return () => { active = false; };
  }, [pathname, router]);

  if (!ready) {
    return <div className="grid min-h-screen place-items-center bg-slate-50 text-orange-600"><Loader2 className="animate-spin" size={28} /></div>;
  }
  return children;
}
