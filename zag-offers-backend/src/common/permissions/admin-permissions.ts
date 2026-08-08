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
  COUPONS_MANAGE: 'coupons.manage',
  BROADCAST_SEND: 'broadcast.send',
  REPORTS_VIEW: 'reports.view',
  AUDIT_VIEW: 'audit.view',
  SETTINGS_MANAGE: 'settings.manage',
  CHAT_MANAGE: 'chat.manage',
  REVIEWS_MANAGE: 'reviews.manage',
  LOCATIONS_MANAGE: 'locations.manage',
} as const;

export type AdminPermission =
  (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];

export const ALL_ADMIN_PERMISSIONS = Object.values(ADMIN_PERMISSIONS);
