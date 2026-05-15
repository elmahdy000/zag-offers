'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users,
  Store,
  Tag,
  Loader2,
  Search,
  Bell,
  Inbox,
  ArrowRight,
  ClipboardCheck,
  Zap,
  MoreVertical,
  Check,
  X,
  ExternalLink,
  Percent,
  TrendingUp,
  Award,
  ChevronDown,
  LayoutGrid,
  TicketPercent,
  Moon,
  Sun,
  Download,
  Calendar,
  RefreshCw,
  Keyboard,
  Activity,
  SquareStack,
  Filter,
  CheckSquare,
  Square,
  Trash2,
  History,
  Eye,
  MapPin,
  Play,
  Pause,
  Sparkles,
  Settings2,
  Database,
  RefreshCcw,
  Terminal,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { adminApi, resolveImageUrl } from '@/lib/api';

interface GlobalStats {
  users: { totalUsers: number; totalMerchants: number };
  stores: { totalStores: number; pendingStores: number; approvedStores: number };
  offers: { totalOffers: number; activeOffers: number; pendingOffers: number; expiredOffers: number };
  coupons: {
    totalCouponsGenerated: number;
    totalCouponsUsed: number;
    couponConversionRate: string;
  };
  engagement: { totalFavorites: number; totalReviews: number };
}

interface PeriodStats {
  newUsers: number;
  newStores: number;
  newOffers: number;
  newCoupons: number;
}

interface TopStore {
  id: string;
  name: string;
  logo?: string;
  _count: { offers: number; reviews: number };
  offers: { _count: { coupons: number } }[];
  totalCoupons?: number;
}

interface TopCategory {
  name: string;
  count: number;
}

interface PendingItem {
  id: string;
  type: 'store' | 'offer';
  name: string;
  category?: string;
  area?: string;
  createdAt: string;
}

interface ActivityLog {
  id: string;
  action: string;
  target: string;
  targetType: 'store' | 'offer' | 'user';
  admin: string;
  timestamp: string;
  details?: string;
}

interface Notification {
  id: string;
  type: 'store_pending' | 'offer_pending' | 'user_registered' | 'coupon_claimed';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

// ─── Dark Mode Hook ───────────────────────────────────
function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('admin_dark_mode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved ? saved === 'true' : prefersDark;
    setIsDark(initial);
    if (initial) document.documentElement.classList.add('dark');
  }, []);

  const toggle = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('admin_dark_mode', String(next));
      if (next) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      return next;
    });
  }, []);

  return { isDark, toggle, mounted };
}

// ─── Keyboard Shortcuts Hook ──────────────────────────
function useKeyboardShortcuts(callbacks: { onSearch: () => void; onRefresh: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'k') {
          e.preventDefault();
          callbacks.onSearch();
        }
        if (e.key === 'r') {
          e.preventDefault();
          callbacks.onRefresh();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [callbacks]);
}

// ─── Export to CSV Helper ─────────────────────────────
function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

// ─── Activity Logs Hook ───────────────────────────────
function useActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  const addLog = useCallback((action: string, target: string, targetType: 'store' | 'offer' | 'user', details?: string) => {
    const newLog: ActivityLog = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      action,
      target,
      targetType,
      admin: 'Current Admin', // Would come from auth context
      timestamp: new Date().toISOString(),
      details,
    };
    setLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep last 100
    // Persist to localStorage
    try {
      localStorage.setItem('admin_activity_logs', JSON.stringify([newLog, ...logs].slice(0, 100)));
    } catch { /* ignore */ }
  }, [logs]);

  // Load logs on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin_activity_logs');
      if (saved) setLogs(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  return { logs, addLog, clearLogs: () => { setLogs([]); localStorage.removeItem('admin_activity_logs'); } };
}

// ─── Real-time Notifications Hook (SSE) ─────────────
function useRealTimeNotifications(onNotification?: (n: Notification) => void) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // For demo, simulate notifications with interval
    // In production: const es = new EventSource('/api/notifications/stream');
    const simulateNotifications = () => {
      const types: Notification['type'][] = ['store_pending', 'offer_pending', 'user_registered'];
      const type = types[Math.floor(Math.random() * types.length)];
      const newNotification: Notification = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
        type,
        title: type === 'store_pending' ? 'متجر جديد' : type === 'offer_pending' ? 'عرض جديد' : 'مستخدم جديد',
        message: type === 'store_pending' ? 'تم تسجيل متجر جديد بانتظار الموافقة' : type === 'offer_pending' ? 'تم إضافة عرض جديد بانتظار المراجعة' : 'مستخدم جديد سجل في المنصة',
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications(prev => [newNotification, ...prev].slice(0, 50));
      onNotification?.(newNotification);
    };

    // Simulate connection
    setConnected(true);
    const interval = setInterval(simulateNotifications, 30000); // Every 30 seconds for demo

    return () => {
      clearInterval(interval);
      setConnected(false);
    };
  }, [onNotification]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, connected, unreadCount, markAsRead, markAllAsRead, clearNotifications };
}

// ─── Demo Data Generator ────────────────────────────
const DEMO_DATA = {
  areas: ['الزقازيق', 'العاشر من رمضان', 'منيا القمح', 'أبو حماد', 'بلبيس', 'فاقوس', 'كفر صقر', 'الإبراهيمية'],
  categories: ['مطاعم', 'ملابس', 'إلكترونيات', 'سوبر ماركت', 'صيدليات', 'مستحضرات تجميل', 'ألعاب', 'مفروشات'],
  storeNames: ['هايبر وان', 'الفا ماركت', 'Carrefour', 'اللؤلؤة', 'البلاتينوم', 'أضواء مصر', 'بيتزا هت', 'KFC', 'ماكدونالدز', 'بابا جونز', 'ستارز', 'أمازون مصر', 'نون', 'جوميا'],
  offerTitles: ['خصم 50%', 'اشترِ 1 واحصل على 1 مجاناً', 'توصيل مجاني', 'خصم 20% على كل شيء', 'هدية مجانية', 'كاش باك 10%', 'عرض اليوم الواحد', 'تخفيضات نهاية الموسم'],
};

function generateMockStats(): GlobalStats {
  return {
    users: {
      totalUsers: Math.floor(Math.random() * 5000) + 1000,
      totalMerchants: Math.floor(Math.random() * 200) + 50,
    },
    stores: {
      totalStores: Math.floor(Math.random() * 300) + 100,
      pendingStores: Math.floor(Math.random() * 10) + 2,
      approvedStores: Math.floor(Math.random() * 290) + 100,
    },
    offers: {
      totalOffers: Math.floor(Math.random() * 500) + 200,
      activeOffers: Math.floor(Math.random() * 300) + 100,
      pendingOffers: Math.floor(Math.random() * 15) + 3,
      expiredOffers: Math.floor(Math.random() * 100) + 50,
    },
    coupons: {
      totalCouponsGenerated: Math.floor(Math.random() * 10000) + 5000,
      totalCouponsUsed: Math.floor(Math.random() * 8000) + 3000,
      couponConversionRate: `${(Math.random() * 30 + 40).toFixed(1)}%`,
    },
    engagement: {
      totalFavorites: Math.floor(Math.random() * 2000) + 500,
      totalReviews: Math.floor(Math.random() * 1000) + 200,
    },
  };
}

function generateMockPendingItems(count: number): PendingItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `pending-${i}`,
    type: Math.random() > 0.5 ? 'store' : 'offer',
    name: Math.random() > 0.5
      ? DEMO_DATA.storeNames[Math.floor(Math.random() * DEMO_DATA.storeNames.length)]
      : DEMO_DATA.offerTitles[Math.floor(Math.random() * DEMO_DATA.offerTitles.length)],
    category: DEMO_DATA.categories[Math.floor(Math.random() * DEMO_DATA.categories.length)],
    area: DEMO_DATA.areas[Math.floor(Math.random() * DEMO_DATA.areas.length)],
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

function generateMockTopStores(count: number): TopStore[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `store-${i}`,
    name: DEMO_DATA.storeNames[i % DEMO_DATA.storeNames.length],
    logo: undefined,
    _count: { offers: Math.floor(Math.random() * 20) + 5, reviews: Math.floor(Math.random() * 100) + 20 },
    offers: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, () => ({
      _count: { coupons: Math.floor(Math.random() * 200) + 50 },
    })),
    totalCoupons: Math.floor(Math.random() * 500) + 100,
  }));
}

function generateMockTopCategories(): TopCategory[] {
  return DEMO_DATA.categories.map(name => ({
    name,
    count: Math.floor(Math.random() * 100) + 10,
  })).sort((a, b) => b.count - a.count);
}

// ─── Demo Mode Hook ─────────────────────────────────
function useDemoMode() {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(5000); // ms between events
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [topStores, setTopStores] = useState<TopStore[]>([]);
  const [topCategories, setTopCategories] = useState<TopCategory[]>([]);
  const [periodStats, setPeriodStats] = useState<PeriodStats>({
    newUsers: 0,
    newStores: 0,
    newOffers: 0,
    newCoupons: 0,
  });

  // Initialize demo data
  const initDemo = useCallback(() => {
    setStats(generateMockStats());
    setPendingItems(generateMockPendingItems(8));
    setTopStores(generateMockTopStores(5));
    setTopCategories(generateMockTopCategories());
    setPeriodStats({
      newUsers: Math.floor(Math.random() * 50) + 10,
      newStores: Math.floor(Math.random() * 10) + 2,
      newOffers: Math.floor(Math.random() * 20) + 5,
      newCoupons: Math.floor(Math.random() * 100) + 20,
    });
    setEventLog(['🎮 Demo mode initialized']);
  }, []);

  // Simulate random events
  useEffect(() => {
    if (!isDemoMode) return;

    const handleNewStore = () => {
      const newItem: PendingItem = {
        id: `pending-${Date.now()}`,
        type: 'store',
        name: DEMO_DATA.storeNames[Math.floor(Math.random() * DEMO_DATA.storeNames.length)],
        category: DEMO_DATA.categories[Math.floor(Math.random() * DEMO_DATA.categories.length)],
        area: DEMO_DATA.areas[Math.floor(Math.random() * DEMO_DATA.areas.length)],
        createdAt: new Date().toISOString(),
      };
      setPendingItems(prev => [newItem, ...prev].slice(0, 15));
      setStats(prev => prev ? {
        ...prev,
        stores: { ...prev.stores, pendingStores: prev.stores.pendingStores + 1 },
      } : null);
      setEventLog(prev => [`🏪 New store pending: ${newItem.name}`, ...prev].slice(0, 20));
    };

    const handleNewOffer = () => {
      const newItem: PendingItem = {
        id: `pending-${Date.now()}`,
        type: 'offer',
        name: DEMO_DATA.offerTitles[Math.floor(Math.random() * DEMO_DATA.offerTitles.length)],
        category: DEMO_DATA.categories[Math.floor(Math.random() * DEMO_DATA.categories.length)],
        area: DEMO_DATA.areas[Math.floor(Math.random() * DEMO_DATA.areas.length)],
        createdAt: new Date().toISOString(),
      };
      setPendingItems(prev => [newItem, ...prev].slice(0, 15));
      setStats(prev => prev ? {
        ...prev,
        offers: { ...prev.offers, pendingOffers: prev.offers.pendingOffers + 1 },
      } : null);
      setEventLog(prev => [`🏷️ New offer pending: ${newItem.name}`, ...prev].slice(0, 20));
    };

    const handleNewCoupon = () => {
      setStats(prev => prev ? {
        ...prev,
        coupons: {
          ...prev.coupons,
          totalCouponsUsed: prev.coupons.totalCouponsUsed + 1,
        },
      } : null);
      setPeriodStats(prev => ({ ...prev, newCoupons: prev.newCoupons + 1 }));
      setEventLog(prev => [`🎫 Coupon claimed!`, ...prev].slice(0, 20));
    };

    // Listen for manual triggers
    window.addEventListener('demo:new-store', handleNewStore);
    window.addEventListener('demo:new-offer', handleNewOffer);
    window.addEventListener('demo:new-coupon', handleNewCoupon);

    // Auto-play simulation
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        const events = [handleNewStore, handleNewOffer, handleNewCoupon];
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        randomEvent();
      }, simulationSpeed);
    }

    return () => {
      window.removeEventListener('demo:new-store', handleNewStore);
      window.removeEventListener('demo:new-offer', handleNewOffer);
      window.removeEventListener('demo:new-coupon', handleNewCoupon);
      if (interval) clearInterval(interval);
    };
  }, [isDemoMode, isPlaying, simulationSpeed]);

  const approveItem = useCallback((id: string) => {
    setPendingItems(prev => prev.filter(item => item.id !== id));
    setStats(prev => prev ? {
      ...prev,
      stores: { ...prev.stores, pendingStores: Math.max(0, prev.stores.pendingStores - 1) },
      offers: { ...prev.offers, pendingOffers: Math.max(0, prev.offers.pendingOffers - 1) },
    } : null);
    setEventLog(prev => [`✅ Item approved: ${id}`, ...prev].slice(0, 20));
  }, []);

  const rejectItem = useCallback((id: string) => {
    setPendingItems(prev => prev.filter(item => item.id !== id));
    setEventLog(prev => [`❌ Item rejected: ${id}`, ...prev].slice(0, 20));
  }, []);

  const bulkApprove = useCallback((ids: string[]) => {
    setPendingItems(prev => prev.filter(item => !ids.includes(item.id)));
    setStats(prev => prev ? {
      ...prev,
      stores: { ...prev.stores, pendingStores: Math.max(0, prev.stores.pendingStores - ids.length) },
    } : null);
    setEventLog(prev => [`✅ Bulk approved: ${ids.length} items`, ...prev].slice(0, 20));
  }, []);

  const clearEventLog = useCallback(() => {
    setEventLog(['🎮 Log cleared']);
  }, []);

  return {
    isDemoMode,
    setIsDemoMode,
    isPlaying,
    setIsPlaying,
    simulationSpeed,
    setSimulationSpeed,
    eventLog,
    clearEventLog,
    stats,
    pendingItems,
    topStores,
    topCategories,
    periodStats,
    initDemo,
    approveItem,
    rejectItem,
    bulkApprove,
  };
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { isDark, toggle, mounted } = useDarkMode();
  const { logs, addLog, clearLogs } = useActivityLogs();
  const {
    isDemoMode,
    setIsDemoMode,
    isPlaying,
    setIsPlaying,
    simulationSpeed,
    setSimulationSpeed,
    eventLog,
    clearEventLog,
    stats: demoStats,
    pendingItems: demoPendingItems,
    topStores: demoTopStores,
    topCategories: demoTopCategories,
    periodStats: demoPeriodStats,
    initDemo,
    approveItem: demoApproveItem,
    rejectItem: demoRejectItem,
    bulkApprove: demoBulkApprove,
  } = useDemoMode();
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showActivityLogs, setShowActivityLogs] = useState(false);
  const [showSimulationLog, setShowSimulationLog] = useState(false);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    status: 'all' as 'all' | 'pending' | 'approved' | 'rejected',
    type: 'all' as 'all' | 'store' | 'offer',
    area: '',
  });
  const { notifications, connected, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useRealTimeNotifications(
    useCallback((n: Notification) => {
      // Auto-refresh data on new notification
      if (n.type === 'store_pending' || n.type === 'offer_pending') {
        queryClient.invalidateQueries({ queryKey: ['pending-items'] });
        queryClient.invalidateQueries({ queryKey: ['global-stats'] });
      }
    }, [queryClient])
  );

  // ─── Auto Refresh Every 5 Minutes ─────────────────
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['global-stats'] });
      queryClient.invalidateQueries({ queryKey: ['stats-period'] });
      queryClient.invalidateQueries({ queryKey: ['top-stores'] });
      queryClient.invalidateQueries({ queryKey: ['top-categories'] });
      queryClient.invalidateQueries({ queryKey: ['pending-items'] });
    }, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [autoRefresh, queryClient]);

  // ─── Keyboard Shortcuts ─────────────────────────────
  useKeyboardShortcuts({
    onSearch: () => searchInputRef.current?.focus(),
    onRefresh: () => {
      queryClient.invalidateQueries({ queryKey: ['global-stats'] });
      queryClient.invalidateQueries({ queryKey: ['stats-period'] });
      queryClient.invalidateQueries({ queryKey: ['top-stores'] });
      queryClient.invalidateQueries({ queryKey: ['top-categories'] });
      queryClient.invalidateQueries({ queryKey: ['pending-items'] });
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['global-stats'],
    queryFn: async () => {
      const response = await adminApi().get<GlobalStats>('/admin/stats/global');
      return response.data;
    },
    staleTime: 120000,
    refetchInterval: autoRefresh ? 5 * 60 * 1000 : false,
    refetchOnWindowFocus: false,
  });

  const { data: pStats, isLoading: pStatsLoading } = useQuery({
    queryKey: ['stats-period', period],
    queryFn: async () => {
      const params: any = { period };
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to) params.to = dateRange.to;
      const response = await adminApi().get<PeriodStats>('/admin/stats/period', { params });
      return response.data;
    },
    staleTime: 30000,
    refetchInterval: autoRefresh ? 5 * 60 * 1000 : false,
  });

  const { data: topStores = [], isLoading: topStoresLoading } = useQuery({
    queryKey: ['top-stores'],
    queryFn: async () => {
      const response = await adminApi().get<TopStore[]>('/admin/stats/top-stores', { params: { limit: 5 } });
      return response.data;
    },
    staleTime: 180000,
    refetchInterval: autoRefresh ? 5 * 60 * 1000 : false,
    refetchOnWindowFocus: false,
  });

  const { data: topCategories = [], isLoading: topCategoriesLoading } = useQuery({
    queryKey: ['top-categories'],
    queryFn: async () => {
      const response = await adminApi().get<TopCategory[]>('/admin/stats/top-categories');
      return response.data;
    },
    staleTime: 180000,
    refetchInterval: autoRefresh ? 5 * 60 * 1000 : false,
    refetchOnWindowFocus: false,
  });

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-items'],
    queryFn: async () => {
      const ax = adminApi();
      const [storesResponse, offersResponse] = await Promise.all([
        ax.get<any[]>('/admin/stores/pending'),
        ax.get<any[]>('/admin/offers/pending'),
      ]);
      return {
        stores: storesResponse.data,
        offers: offersResponse.data,
      };
    },
    staleTime: 45000,
    refetchInterval: autoRefresh ? 5 * 60 * 1000 : false,
    refetchOnWindowFocus: false,
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, type, action }: { id: string; type: 'store' | 'offer'; action: 'approve' | 'reject' }) => {
      const resource = type === 'store' ? 'stores' : 'offers';
      return adminApi().patch(`/admin/${resource}/${id}/${action}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pending-items'] });
      queryClient.invalidateQueries({ queryKey: ['global-stats'] });
      // Log activity
      addLog(
        variables.action === 'approve' ? 'APPROVE' : 'REJECT',
        variables.id,
        variables.type,
        `${variables.type === 'store' ? 'متجر' : 'عرض'} ${variables.action === 'approve' ? 'تمت الموافقة' : 'تم الرفض'}`
      );
    },
  });

  // ─── Bulk Actions ───────────────────────────────────
  const bulkActionMutation = useMutation({
    mutationFn: async ({ action }: { action: 'approve' | 'reject' }) => {
      const promises: Promise<any>[] = [];
      selectedItems.forEach(id => {
        const item = pendingItems.find(p => p.id === id);
        if (item) {
          const resource = item.type === 'store' ? 'stores' : 'offers';
          promises.push(adminApi().patch(`/admin/${resource}/${id}/${action}`));
        }
      });
      return Promise.all(promises);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pending-items'] });
      queryClient.invalidateQueries({ queryKey: ['global-stats'] });
      addLog(
        variables.action === 'approve' ? 'BULK_APPROVE' : 'BULK_REJECT',
        `${selectedItems.size} items`,
        'store',
        `تم ${variables.action === 'approve' ? 'الموافقة' : 'الرفض'} على ${selectedItems.size} عناصر`
      );
      setSelectedItems(new Set());
      setBulkMode(false);
    },
  });

  const toggleItemSelection = useCallback((id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const pendingItems: PendingItem[] = [
    ...(pendingData?.stores.map((s) => ({ id: s.id, type: 'store' as const, name: s.name, category: s.category?.name, area: s.area, createdAt: s.createdAt })) ?? []),
    ...(pendingData?.offers.map((o) => ({ id: o.id, type: 'offer' as const, name: o.title, category: o.store?.category?.name, area: o.store?.area, createdAt: o.createdAt })) ?? []),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // ─── Advanced Filters ───────────────────────────────
  const filteredPendingItems = pendingItems.filter(item => {
    const matchesType = advancedFilters.type === 'all' || item.type === advancedFilters.type;
    const matchesArea = !advancedFilters.area || item.area?.toLowerCase().includes(advancedFilters.area.toLowerCase());
    const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.category?.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesArea && matchesSearch;
  });

  const selectAll = useCallback(() => {
    if (selectedItems.size === filteredPendingItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredPendingItems.map((i: PendingItem) => i.id)));
    }
  }, [filteredPendingItems, selectedItems.size]);

  const format = (n: number) => new Intl.NumberFormat('ar-EG').format(n);

  // ─── Export Handlers ─────────────────────────────────
  const handleExportStats = () => {
    if (stats) {
      exportToCSV([{
        'إجمالي المستخدمين': stats.users.totalUsers,
        'التجار': stats.users.totalMerchants,
        'إجمالي المتاجر': stats.stores.totalStores,
        'المتاجر المعلقة': stats.stores.pendingStores,
        'إجمالي العروض': stats.offers.totalOffers,
        'العروض النشطة': stats.offers.activeOffers,
        'الكوبونات المولدة': stats.coupons.totalCouponsGenerated,
        'الكوبونات المستخدمة': stats.coupons.totalCouponsUsed,
        'معدل التحويل': stats.coupons.couponConversionRate,
      }], 'stats');
    }
  };

  const handleExportPending = () => {
    if (pendingItems.length > 0) {
      exportToCSV(pendingItems.map(i => ({
        'النوع': i.type === 'store' ? 'متجر' : 'عرض',
        'الاسم': i.name,
        'الفئة': i.category || '-',
        'المنطقة': i.area || '-',
        'تاريخ الإنشاء': new Date(i.createdAt).toLocaleDateString('ar-EG'),
      })), 'pending_items');
    }
  };

  if (statsLoading) {
    return (
      <div className={`flex h-screen items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
        <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-10 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 leading-tight">لوحة التحكم الرئيسية</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">أهلاً بك مجدداً، إليك ملخص لأداء المنصة اليوم</p>
          </div>
          {/* Demo Mode Badge */}
          {isDemoMode && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full shadow-lg"
            >
              <Sparkles size={14} className={isPlaying ? 'animate-pulse' : ''} />
              DEMO MODE {isPlaying && '▶'}
            </motion.div>
          )}
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-3 flex-wrap">

          {/* Date Range Filter */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2 py-1.5">
            <Calendar size={14} className="text-slate-400 mr-1" />
            <input
              type="date"
              value={dateRange.from || ''}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="text-xs font-medium border-none outline-none text-slate-600 w-28"
              placeholder="من"
            />
            <span className="text-slate-300">-</span>
            <input
              type="date"
              value={dateRange.to || ''}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="text-xs font-medium border-none outline-none text-slate-600 w-28"
              placeholder="إلى"
            />
          </div>

          {/* Period Selector */}
          <div className="flex p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
            {(['today', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${period === p ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                {p === 'today' ? 'اليوم' : p === 'week' ? 'الأسبوع' : 'الشهر'}
              </button>
            ))}
          </div>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              autoRefresh
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
            title="تحديث تلقائي كل 5 دقائق"
          >
            <RefreshCw size={14} className={autoRefresh ? 'animate-spin' : ''} style={{ animationDuration: '3s' }} />
            {autoRefresh ? 'تنشيط' : 'متوقف'}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggle}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-orange-600 hover:border-orange-300 transition-all"
            title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
          >
            {mounted && (isDark ? <Sun size={18} /> : <Moon size={18} />)}
          </button>

          {/* Activity Logs */}
          <button
            onClick={() => setShowActivityLogs(true)}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-purple-600 hover:border-purple-300 transition-all relative"
            title="سجل النشاطات"
          >
            <Activity size={18} />
            {logs.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {logs.length > 9 ? '9+' : logs.length}
              </span>
            )}
          </button>

          {/* Notifications Bell */}
          <button
            onClick={() => setShowNotifications(true)}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-orange-600 hover:border-orange-300 transition-all relative"
            title="الإشعارات"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            {connected && (
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-500 border-2 border-white rounded-full" title="متصل" />
            )}
          </button>

          {/* Keyboard Shortcuts Help */}
          <button
            onClick={() => setShowShortcuts(true)}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-all"
            title="اختصارات لوحة المفاتيح"
          >
            <Keyboard size={18} />
          </button>

          {/* Demo Mode Toggle */}
          <button
            onClick={() => {
              if (!isDemoMode) {
                setIsDemoMode(true);
                initDemo();
                setIsPlaying(true);
              } else {
                setIsDemoMode(false);
                setIsPlaying(false);
              }
            }}
            className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all ${
              isDemoMode
                ? 'bg-gradient-to-br from-purple-600 to-pink-600 border-transparent text-white shadow-lg shadow-purple-200'
                : 'bg-white border-slate-200 text-slate-600 hover:text-purple-600 hover:border-purple-300'
            }`}
            title={isDemoMode ? 'إيقاف وضع المحاكاة' : 'تشغيل وضع المحاكاة'}
          >
            <Database size={18} />
          </button>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-slate-50/50 p-2 rounded-[2rem] border border-slate-100 flex flex-wrap items-center gap-2">
         <Link href="/dashboard/broadcast" className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 hover:border-orange-500 hover:text-orange-600 transition-all text-xs font-black">
            <Bell size={14} /> إرسال تنبيه عاجل
         </Link>
         <Link href="/dashboard/audit-logs" className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:text-blue-600 transition-all text-xs font-black">
            <ClipboardCheck size={14} /> مراجعة سجلات الأمان
         </Link>
         <Link href="/dashboard/users" className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 transition-all text-xs font-black">
            <Users size={14} /> إدارة الطاقم
         </Link>
         {/* Export Buttons */}
         <button
            onClick={handleExportStats}
            className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 hover:border-violet-500 hover:text-violet-600 transition-all text-xs font-black"
         >
            <Download size={14} /> تصدير الإحصائيات
         </button>
         <button
            onClick={handleExportPending}
            className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 hover:border-pink-500 hover:text-pink-600 transition-all text-xs font-black"
         >
            <Download size={14} /> تصدير الطلبات
         </button>
      </div>

      {/* Demo Mode Control Panel */}
      <AnimatePresence>
        {isDemoMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 border border-purple-200 rounded-2xl p-4 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                    <Terminal size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">وضع المحاكاة التفاعلي</h3>
                    <p className="text-xs text-slate-500">جميع البيانات المعروضة الآن هي بيانات تجريبية</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isPlaying
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {isPlaying ? <><Pause size={14} /> إيقاف مؤقت</> : <><Play size={14} /> تشغيل</>}
                  </button>
                  <button
                    onClick={() => setShowSimulationLog(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    <Terminal size={14} /> السجل
                  </button>
                  <button
                    onClick={() => {
                      initDemo();
                      setIsPlaying(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    <RefreshCcw size={14} /> إعادة
                  </button>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-purple-200/50">
                <div className="flex items-center gap-2">
                  <Settings2 size={14} className="text-purple-600" />
                  <span className="text-xs font-bold text-slate-600">سرعة المحاكاة:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSimulationSpeed(10000)}
                      className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                        simulationSpeed === 10000 ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 hover:bg-purple-100'
                      }`}
                    >
                      بطيء
                    </button>
                    <button
                      onClick={() => setSimulationSpeed(5000)}
                      className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                        simulationSpeed === 5000 ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 hover:bg-purple-100'
                      }`}
                    >
                      عادي
                    </button>
                    <button
                      onClick={() => setSimulationSpeed(2000)}
                      className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                        simulationSpeed === 2000 ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 hover:bg-purple-100'
                      }`}
                    >
                      سريع
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">|</span>
                  <span className="text-xs font-bold text-slate-600">إجراء يدوي:</span>
                  <button
                    onClick={() => {
                      // Trigger a simulated event through the hook
                      const mockEvent = new CustomEvent('demo:new-store');
                      window.dispatchEvent(mockEvent);
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-emerald-600 hover:border-emerald-300 transition-all"
                  >
                    + متجر جديد
                  </button>
                  <button
                    onClick={() => {
                      const mockEvent = new CustomEvent('demo:new-offer');
                      window.dispatchEvent(mockEvent);
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-orange-600 hover:border-orange-300 transition-all"
                  >
                    + عرض جديد
                  </button>
                  <button
                    onClick={() => {
                      const mockEvent = new CustomEvent('demo:new-coupon');
                      window.dispatchEvent(mockEvent);
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-violet-600 hover:border-violet-300 transition-all"
                  >
                    🎫 كوبون جديد
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="إجمالي المستخدمين"
          value={statsLoading ? '...' : format(stats?.users.totalUsers ?? 0)}
          icon={Users}
          color="text-blue-600"
          bg="bg-blue-50"
          trend={pStats?.newUsers ? `+${pStats.newUsers} جديد` : undefined}
        />
        <StatCard
          label="إجمالي المتاجر"
          value={statsLoading ? '...' : format(stats?.stores.totalStores ?? 0)}
          icon={Store}
          color="text-emerald-600"
          bg="bg-emerald-50"
          trend={pStats?.newStores ? `+${pStats.newStores} جديد` : undefined}
          subValue={`${stats?.stores.pendingStores ?? 0} بانتظار الاعتماد`}
        />
        <StatCard
          label="إجمالي العروض"
          value={statsLoading ? '...' : format(stats?.offers.totalOffers ?? 0)}
          icon={Zap}
          color="text-orange-600"
          bg="bg-orange-50"
          trend={pStats?.newOffers ? `+${pStats.newOffers} جديد` : undefined}
          subValue={`${stats?.offers.activeOffers ?? 0} عرض نشط الآن`}
        />
        <StatCard
          label="إجمالي الكوبونات"
          value={statsLoading ? '...' : format(stats?.coupons.totalCouponsGenerated ?? 0)}
          icon={TicketPercent}
          color="text-violet-600"
          bg="bg-violet-50"
          trend={pStats?.newCoupons ? `+${pStats.newCoupons} جديد` : undefined}
        />
        <StatCard
          label="معدل التحويل"
          value={statsLoading ? '...' : stats?.coupons.couponConversionRate ?? '0%'}
          icon={TrendingUp}
          color="text-pink-600"
          bg="bg-pink-50"
          subValue={`${stats?.coupons.totalCouponsUsed ?? 0} عملية مسح`}
        />
      </div>

      {/* Middle Section: Trends & Lists */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Pending Requests */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm h-full">
            {/* Advanced Filters Bar */}
            <div className="border-b border-slate-100 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-900">طلبات المراجعة المعلقة</h2>
                  <span className="rounded-lg bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600 border border-orange-100 uppercase tracking-widest">
                    {filteredPendingItems.length} طلب
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBulkMode(!bulkMode)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      bulkMode ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <SquareStack size={14} />
                    {bulkMode ? 'إلغاء التحديد' : 'تحديد متعدد'}
                  </button>
                  <Link href="/dashboard/approvals" className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1 transition-all">
                    عرض الكل <ArrowRight size={14} className="rotate-180" />
                  </Link>
                </div>
              </div>

              {/* Advanced Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
                  <Filter size={12} className="text-slate-400 mr-1" />
                  <select
                    value={advancedFilters.type}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, type: e.target.value as any }))}
                    className="text-xs font-bold bg-transparent border-none outline-none text-slate-600 cursor-pointer"
                  >
                    <option value="all">الكل</option>
                    <option value="store">المتاجر فقط</option>
                    <option value="offer">العروض فقط</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5">
                  <MapPin size={12} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="فلترة بالمنطقة..."
                    value={advancedFilters.area}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, area: e.target.value }))}
                    className="text-xs font-bold bg-transparent border-none outline-none text-slate-600 w-24"
                  />
                </div>

                {(advancedFilters.type !== 'all' || advancedFilters.area || search) && (
                  <button
                    onClick={() => {
                      setAdvancedFilters({ status: 'all', type: 'all', area: '' });
                      setSearch('');
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600"
                  >
                    إعادة ضبط الفلاتر
                  </button>
                )}
              </div>

              {/* Bulk Actions Bar */}
              {bulkMode && selectedItems.size > 0 && (
                <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-orange-600">{selectedItems.size} عنصر محدد</span>
                    <button
                      onClick={selectAll}
                      className="text-xs font-bold text-slate-500 hover:text-slate-700"
                    >
                      {selectedItems.size === filteredPendingItems.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => bulkActionMutation.mutate({ action: 'approve' })}
                      disabled={bulkActionMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all"
                    >
                      {bulkActionMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      موافقة
                    </button>
                    <button
                      onClick={() => bulkActionMutation.mutate({ action: 'reject' })}
                      disabled={bulkActionMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-all"
                    >
                      {bulkActionMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                      رفض
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1">
              {pendingLoading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-orange-600" /></div>
              ) : filteredPendingItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                    <Inbox size={32} />
                  </div>
                  <p className="text-base font-bold text-slate-900">كل شيء رايق!</p>
                  <p className="mt-1 text-sm text-slate-500 font-medium">لا توجد طلبات متاجر أو عروض بانتظار مراجعتك حالياً</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {filteredPendingItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors group">
                      <div className="flex items-center gap-4">
                        {/* Bulk Selection Checkbox */}
                        {bulkMode && (
                          <button
                            onClick={() => toggleItemSelection(item.id)}
                            className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
                              selectedItems.has(item.id)
                                ? 'bg-orange-600 border-orange-600 text-white'
                                : 'border-slate-300 hover:border-orange-400'
                            }`}
                          >
                            {selectedItems.has(item.id) && <Check size={12} />}
                          </button>
                        )}
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all group-hover:scale-110 ${item.type === 'store' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                          {item.type === 'store' ? <Store size={20} /> : <Tag size={20} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-900 leading-tight">{item.name}</p>
                            <span className="text-[10px] font-bold text-slate-400 border border-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">{item.type === 'store' ? 'متجر' : 'عرض'}</span>
                          </div>
                          <p className="text-[11px] font-medium text-slate-400 mt-1.5 flex items-center gap-2">
                            <span>{item.category}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span>{item.area}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span>{new Date(item.createdAt).toLocaleDateString('ar-EG')}</span>
                          </p>
                        </div>
                      </div>
                      {!bulkMode ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => actionMutation.mutate({ id: item.id, type: item.type, action: 'approve' })}
                            disabled={actionMutation.isPending}
                            className="h-9 px-4 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                          >
                            موافقة
                          </button>
                          <Link href={`/dashboard/approvals`} className="h-9 w-9 rounded-xl bg-slate-900 text-white hover:bg-orange-600 transition-all flex items-center justify-center shadow-lg shadow-slate-200">
                            <ExternalLink size={14} />
                          </Link>
                        </div>
                      ) : (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                          selectedItems.has(item.id)
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {selectedItems.has(item.id) ? 'محدد' : 'غير محدد'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Stores/Categories */}
        <div className="space-y-6">
          {/* Top Categories */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" /> التصنيفات الأكثر طلباً
            </h3>
            <div className="space-y-4">
              {topCategoriesLoading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 animate-pulse bg-slate-50 rounded-lg" />) :
                topCategories.slice(0, 5).map((cat, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700">{cat.name}</span>
                      <span className="text-slate-400">{cat.count} عرض</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (cat.count / topCategories[0].count) * 100)}%` }}
                        className="h-full bg-blue-500"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Top Stores */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Award size={18} className="text-orange-600" /> المتاجر الأعلى أداءً
            </h3>
            <div className="space-y-5">
              {topStoresLoading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 animate-pulse bg-slate-50 rounded-xl" />) :
                topStores.map((store, i) => {
                  const totalClaims = (store.offers || []).reduce((sum, off) => sum + (off._count?.coupons || 0), 0);

                  return (
                    <div key={store.id} className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                        {store.logo ? <img src={resolveImageUrl(store.logo)} alt="logo" className="h-full w-full object-cover" /> : <Store size={18} className="text-slate-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{store.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            {totalClaims} طلب كوبون
                          </p>
                          <span className="h-1 w-1 rounded-full bg-slate-200" />
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">
                            {store._count?.reviews || 0} تقييم
                          </p>
                        </div>
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-[10px] font-black">
                        #{i + 1}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Total Platform Scale */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 pt-4">
        <ScaleCard label="إجمالي المستخدمين" value={format(stats?.users.totalUsers ?? 0)} icon={Users} color="text-slate-600" />
        <ScaleCard label="إجمالي المتاجر" value={format(stats?.stores.totalStores ?? 0)} icon={Store} color="text-slate-600" />
        <ScaleCard label="إجمالي الكوبونات" value={format(stats?.coupons.totalCouponsGenerated ?? 0)} icon={TicketPercent} color="text-slate-600" />
        <ScaleCard label="إجمالي التفاعلات" value={format((stats?.engagement.totalFavorites ?? 0) + (stats?.engagement.totalReviews ?? 0))} icon={LayoutGrid} color="text-slate-600" />
      </div>

      {/* Notifications Modal */}
      <AnimatePresence>
        {showNotifications && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md max-h-[80vh] rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Bell size={20} className="text-orange-600" /> الإشعارات
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-bold text-slate-500 hover:text-slate-700 px-2 py-1"
                    >
                      تحديد الكل كمقروء
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="rounded-xl bg-slate-50 p-2 text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[50vh]">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell size={32} className="text-slate-200 mb-3" />
                    <p className="text-sm font-bold text-slate-500">لا توجد إشعارات</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${!n.read ? 'bg-orange-50/30 border-r-2 border-orange-500' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                            n.type === 'store_pending' ? 'bg-emerald-100 text-emerald-600' :
                            n.type === 'offer_pending' ? 'bg-orange-100 text-orange-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {n.type === 'store_pending' ? <Store size={18} /> :
                             n.type === 'offer_pending' ? <Tag size={18} /> :
                             <Users size={18} />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-900">{n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5">
                              {new Date(n.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {!n.read && <span className="h-2 w-2 bg-orange-500 rounded-full" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="border-t border-slate-100 p-4">
                  <button
                    onClick={() => { clearNotifications(); setShowNotifications(false); }}
                    className="w-full py-2 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
                  >
                    مسح جميع الإشعارات
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Activity Logs Modal */}
      <AnimatePresence>
        {showActivityLogs && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg max-h-[80vh] rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <History size={20} className="text-purple-600" /> سجل النشاطات
                </h3>
                <div className="flex items-center gap-2">
                  {logs.length > 0 && (
                    <button
                      onClick={clearLogs}
                      className="text-xs font-bold text-rose-500 hover:text-rose-700 px-2 py-1"
                    >
                      مسح السجل
                    </button>
                  )}
                  <button
                    onClick={() => setShowActivityLogs(false)}
                    className="rounded-xl bg-slate-50 p-2 text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[50vh]">
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <History size={32} className="text-slate-200 mb-3" />
                    <p className="text-sm font-bold text-slate-500">لا توجد نشاطات مسجلة</p>
                    <p className="text-xs text-slate-400 mt-1">سيتم تسجيل الإجراءات هنا</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {logs.map((log) => (
                      <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                            log.action === 'APPROVE' ? 'bg-emerald-100 text-emerald-600' :
                            log.action === 'REJECT' ? 'bg-rose-100 text-rose-600' :
                            log.action.includes('BULK') ? 'bg-blue-100 text-blue-600' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {log.action === 'APPROVE' ? <Check size={14} /> :
                             log.action === 'REJECT' ? <X size={14} /> :
                             <Activity size={14} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-900">{log.action}</p>
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                {log.targetType}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{log.details || log.target}</p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {new Date(log.timestamp).toLocaleString('ar-EG')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Simulation Log Modal */}
      <AnimatePresence>
        {showSimulationLog && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg max-h-[80vh] rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Terminal size={20} className="text-purple-600" /> سجل المحاكاة
                  {isPlaying && (
                    <span className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearEventLog}
                    className="text-xs font-bold text-slate-500 hover:text-slate-700 px-2 py-1"
                  >
                    مسح السجل
                  </button>
                  <button
                    onClick={() => setShowSimulationLog(false)}
                    className="rounded-xl bg-slate-50 p-2 text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[50vh] bg-slate-900 p-4 font-mono text-xs">
                {eventLog.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                    <Terminal size={32} className="mb-3 opacity-50" />
                    <p>لا توجد أحداث</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {eventLog.map((log, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-2 py-1 ${
                          log.includes('✅') ? 'text-emerald-400' :
                          log.includes('❌') ? 'text-rose-400' :
                          log.includes('🏪') ? 'text-blue-400' :
                          log.includes('🏷️') ? 'text-orange-400' :
                          log.includes('🎫') ? 'text-violet-400' :
                          log.includes('🎮') ? 'text-purple-400' :
                          'text-slate-300'
                        }`}
                      >
                        <span className="text-slate-500">[{new Date().toLocaleTimeString('ar-EG')}]</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 p-4 bg-slate-50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">حالة المحاكاة:</span>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${isPlaying ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="font-bold text-slate-700">
                      {isPlaying ? '▶️ تشغيل' : '⏸️ متوقف'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Keyboard size={20} className="text-orange-600" /> اختصارات لوحة المفاتيح
                </h3>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="rounded-xl bg-slate-50 p-2 text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { key: '⌘K / Ctrl+K', action: 'البحث السريع', desc: 'فتح حقل البحث مباشرة' },
                  { key: '⌘R / Ctrl+R', action: 'تحديث البيانات', desc: 'إعادة تحميل جميع الإحصائيات' },
                  { key: 'Esc', action: 'إغلاق النوافذ', desc: 'إغلاق أي modal مفتوح' },
                ].map((shortcut) => (
                  <div key={shortcut.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{shortcut.action}</p>
                      <p className="text-xs text-slate-400">{shortcut.desc}</p>
                    </div>
                    <kbd className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-600 shadow-sm">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 text-center">
                  يمكنك استخدام هذه الاختصارات في أي وقت داخل لوحة التحكم
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, trend, subValue }: { label: string; value: string; icon: any; color: string; bg: string; trend?: string; subValue?: string }) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
      <div className="flex justify-between items-start mb-5">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bg} ${color} shadow-inner`}>
          <Icon size={22} />
        </div>
        {trend && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1">
            <TrendingUp size={10} /> {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="mt-1.5 text-3xl font-black text-slate-900 leading-none tabular-nums">{value}</p>
        {subValue && (
          <p className="mt-2 text-[11px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md w-fit">
            {subValue}
          </p>
        )}
      </div>
    </div>
  );
}

function ScaleCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:border-orange-200">
      <div className={`h-10 w-10 rounded-xl bg-slate-50 ${color} flex items-center justify-center shrink-0`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
        <p className="text-xl font-bold text-slate-900 leading-none">{value}</p>
      </div>
    </div>
  );
}
