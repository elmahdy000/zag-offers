'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import PullToRefresh from '@/components/PullToRefresh';
import {
  OverviewHero,
  QuickActions,
  RecentActivitySection,
  SmartInsights,
  StatsGrid,
  TopOffersSection,
  type DashboardStats,
} from '@/components/merchant-dashboard-sections';
import { useVendorOffers, useVendorStats } from '@/hooks/use-vendor-api';
import { secureStorage, secureUserData } from '@/lib/crypto';
import { useNotifications } from '@/components/notification-provider';

type VendorUser = { id?: string; name?: string };
type VendorOffer = { id?: string; status?: string };
type MerchantNotification = { type?: string; offerTitle?: string; body?: string };

function readCachedStats(): DashboardStats | null {
  if (typeof window === 'undefined') return null;
  try { return secureStorage.get<DashboardStats>('cache_vendor_stats'); } catch { return null; }
}

function readVendorUser(): VendorUser {
  if (typeof window === 'undefined') return { name: 'تاجر' };
  try { return secureUserData.load() as VendorUser || { name: 'تاجر' }; } catch { return { name: 'تاجر' }; }
}

export default function MerchantDashboard() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useVendorStats();
  const { data: offers, refetch: refetchOffers } = useVendorOffers();
  const [cachedStats, setCachedStats] = useState<DashboardStats | null>(readCachedStats);
  const [vendorUser] = useState<VendorUser>(readVendorUser);
  const [lastUpdated, setLastUpdated] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [notification, setNotification] = useState<{ title: string; body: string; type: string } | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { socket } = useNotifications();

  useEffect(() => {
    if (!stats) return;
    secureStorage.set('cache_vendor_stats', stats);
    const timer = window.setTimeout(() => {
      setCachedStats(stats as DashboardStats);
      setLastUpdated(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [stats]);

  useEffect(() => {
    if (!socket) return;
    const handleNotify = (data: MerchantNotification) => {
      const approved = data.type === 'OFFER_APPROVED';
      const coupon = data.type === 'COUPON_GENERATED';
      setNotification({
        title: approved ? 'تمت الموافقة على العرض' : coupon ? 'طلب كوبون جديد' : 'إشعار جديد',
        body: data.body || (approved ? `عرض "${data.offerTitle || ''}" نشط الآن` : coupon ? `طلب عميل كوبونًا لعرض "${data.offerTitle || ''}"` : ''),
        type: approved || coupon ? 'success' : 'info',
      });
      if (coupon) void refetchStats();
      if (approved) void refetchOffers();
      if (notificationTimer.current) clearTimeout(notificationTimer.current);
      notificationTimer.current = setTimeout(() => setNotification(null), 6000);
    };
    socket.on('merchant_notification', handleNotify);
    return () => { socket.off('merchant_notification', handleNotify); };
  }, [socket, refetchStats, refetchOffers]);

  useEffect(() => () => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    if (notificationTimer.current) clearTimeout(notificationTimer.current);
  }, []);

  const displayStats = (stats as DashboardStats | undefined) || cachedStats;
  const offerList = useMemo(() => Array.isArray(offers) ? offers as VendorOffer[] : [], [offers]);
  const activeOffers = useMemo(() => offerList.filter((offer) => !offer.status || offer.status === 'ACTIVE' || offer.status === 'APPROVED').length, [offerList]);
  const storeName = displayStats?.storeName || vendorUser.name || 'تاجر';

  const handleRefresh = async () => {
    setIsSyncing(true);
    if (syncTimer.current) clearTimeout(syncTimer.current);
    await Promise.all([refetchStats(), refetchOffers()]);
    syncTimer.current = setTimeout(() => setIsSyncing(false), 650);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <main className="merchant-dashboard" dir="rtl">
        <AnimatePresence>
          {notification && <motion.div className="merchant-live-notification" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}><span><Bell size={19} /></span><div><b>{notification.title}</b><p>{notification.body}</p></div></motion.div>}
        </AnimatePresence>
        <div className="merchant-dashboard-container">
          <OverviewHero storeName={storeName} lastUpdated={lastUpdated} syncing={isSyncing} onRefresh={handleRefresh} />
          <StatsGrid stats={displayStats} activeOffers={activeOffers} loading={statsLoading && !cachedStats} />
          <QuickActions />
          <div className="merchant-dashboard-columns">
            <TopOffersSection offers={displayStats?.topOffers} totalClaims={displayStats?.totalClaimsCount} />
            <RecentActivitySection activities={displayStats?.recentCoupons} />
          </div>
          <SmartInsights activeOffers={activeOffers} />
        </div>
      </main>
    </PullToRefresh>
  );
}
