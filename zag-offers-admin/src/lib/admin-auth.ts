export type AdminUser = {
  id: string;
  name: string;
  role: 'ADMIN' | 'STAFF';
  adminPermissions?: string[];
};

export const ADMIN_PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',
  APPROVALS_MANAGE: 'approvals.manage',
  STORES_VIEW: 'stores.view',
  STORES_MANAGE: 'stores.manage',
  OFFERS_VIEW: 'offers.view',
  OFFERS_MANAGE: 'offers.manage',
  USERS_VIEW: 'users.view',
  USERS_MANAGE: 'users.manage',
  CATEGORIES_MANAGE: 'categories.manage',
  BANNERS_MANAGE: 'banners.manage',
  COUPONS_VIEW: 'coupons.view',
  BROADCAST_SEND: 'broadcast.send',
  REPORTS_VIEW: 'reports.view',
  AUDIT_VIEW: 'audit.view',
  SETTINGS_MANAGE: 'settings.manage',
  CHAT_MANAGE: 'chat.manage',
  REVIEWS_MANAGE: 'reviews.manage',
  LOCATIONS_MANAGE: 'locations.manage',
} as const;

export type AdminPermission = typeof ADMIN_PERMISSIONS[keyof typeof ADMIN_PERMISSIONS];

export function readAdminUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem('admin_user') || localStorage.getItem('admin_user');
    return raw ? JSON.parse(raw) as AdminUser : null;
  } catch {
    return null;
  }
}

export function canAccess(user: AdminUser | null, permission: AdminPermission) {
  return user?.role === 'ADMIN' || user?.adminPermissions?.includes(permission) === true;
}

export function firstAllowedAdminRoute(user: AdminUser) {
  const routes: Array<[AdminPermission, string]> = [
    [ADMIN_PERMISSIONS.DASHBOARD_VIEW, '/dashboard'],
    [ADMIN_PERMISSIONS.APPROVALS_MANAGE, '/dashboard/approvals'],
    [ADMIN_PERMISSIONS.STORES_VIEW, '/dashboard/stores'],
    [ADMIN_PERMISSIONS.OFFERS_VIEW, '/dashboard/offers'],
    [ADMIN_PERMISSIONS.USERS_VIEW, '/dashboard/users'],
    [ADMIN_PERMISSIONS.CATEGORIES_MANAGE, '/dashboard/categories'],
    [ADMIN_PERMISSIONS.BANNERS_MANAGE, '/dashboard/banners'],
    [ADMIN_PERMISSIONS.COUPONS_VIEW, '/dashboard/coupons'],
    [ADMIN_PERMISSIONS.BROADCAST_SEND, '/dashboard/broadcast'],
    [ADMIN_PERMISSIONS.CHAT_MANAGE, '/dashboard/chat'],
    [ADMIN_PERMISSIONS.REPORTS_VIEW, '/dashboard/reports'],
    [ADMIN_PERMISSIONS.AUDIT_VIEW, '/dashboard/audit-logs'],
    [ADMIN_PERMISSIONS.REVIEWS_MANAGE, '/dashboard/moderation'],
    [ADMIN_PERMISSIONS.LOCATIONS_MANAGE, '/dashboard/locations'],
    [ADMIN_PERMISSIONS.SETTINGS_MANAGE, '/dashboard/settings'],
  ];
  return routes.find(([permission]) => canAccess(user, permission))?.[1] ?? '/login';
}
