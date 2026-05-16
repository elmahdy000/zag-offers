'use client';

/**
 * Admin Dashboard - Clean Professional Version
 * =============================================
 * Logic Documentation:
 * --------------------
 * 
 * 1. DATA FETCHING (React Query):
 *    - useQuery hooks fetch data from API endpoints
 *    - Data is cached and auto-refreshed every 5 minutes
 *    - Stale data is served while fetching fresh data
 * 
 * 2. STATE MANAGEMENT:
 *    - useState for local UI state (search, filters, modals)
 *    - useRef for DOM references (search input focus)
 *    - useCallback for memoized event handlers
 * 
 * 3. DARK MODE:
 *    - useDarkMode hook manages theme state
 *    - Persists to localStorage
 *    - Toggles class on document root
 * 
 * 4. REAL-TIME NOTIFICATIONS:
 *    - useRealTimeNotifications simulates SSE
 *    - Polls every 30 seconds for new data
 *    - Shows badge count for unread notifications
 * 
 * 5. BULK ACTIONS:
 *    - selectedItems Set tracks selected pending items
 *    - bulkActionMutation sends multiple approve/reject requests
 *    - Updates cache after successful mutation
 * 
 * 6. ADVANCED FILTERS:
 *    - Filters pending items by type (store/offer)
 *    - Filters by area (text match)
 *    - Filters by search query (name/category)
 * 
 * 7. ACTIVITY LOGS:
 *    - useActivityLogs tracks all admin actions
 *    - Persists to localStorage (last 100 logs)
 *    - Auto-logs on approve/reject/bulk actions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { adminApi } from '@/lib/api';

// ============================================
// INTERFACES - Type definitions for data structures
// ============================================
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
}

// ============================================
// HOOKS - Custom logic hooks
// ============================================

/**
 * useDarkMode Hook
 * ----------------
 * Manages dark/light theme state
 * - Reads initial value from localStorage or system preference
 * - Saves changes to localStorage
 * - Toggles 'dark' class on document root for CSS styling
 */
function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('admin_dark_mode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved ? saved === 'true' : prefersDark;
    setIsDark(initial);
    document.documentElement.classList.toggle('dark', initial);
  }, []);

  const toggle = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('admin_dark_mode', String(next));
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  }, []);

  return { isDark, toggle, mounted };
}

/**
 * useActivityLogs Hook
 * --------------------
 * Tracks and persists admin activity logs
 * - Maintains last 100 logs in memory
 * - Persists to localStorage for durability
 * - Provides addLog function for recording actions
 */
function useActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  const addLog = useCallback((action: string, target: string, targetType: 'store' | 'offer' | 'user', details?: string) => {
    const newLog: ActivityLog = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      action,
      target,
      targetType,
      admin: 'Current Admin',
      timestamp: new Date().toISOString(),
      details,
    };
    setLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 100);
      try {
        localStorage.setItem('admin_activity_logs', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin_activity_logs');
      if (saved) setLogs(JSON.parse(saved));
    } catch {}
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem('admin_activity_logs');
  }, []);

  return { logs, addLog, clearLogs };
}

/**
 * useRealTimeNotifications Hook
 * -----------------------------
 * Simulates real-time notifications via polling
 * - Generates random notifications every 30 seconds
 * - Tracks read/unread status
 * - Auto-refreshes dashboard data on relevant notifications
 * 
 * In production: Replace with EventSource for Server-Sent Events
 */
function useRealTimeNotifications(onNotification?: (n: Notification) => void) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const simulateNotifications = () => {
      const types: Notification['type'][] = ['store_pending', 'offer_pending', 'user_registered'];
      const type = types[Math.floor(Math.random() * types.length)];
      const titles: Record<Notification['type'], string> = {
        store_pending: 'متجر جديد',
        offer_pending: 'عرض جديد',
        user_registered: 'مستخدم جديد',
        coupon_claimed: 'كوبون جديد',
      };
      const messages: Record<Notification['type'], string> = {
        store_pending: 'تم تسجيل متجر جديد بانتظار الموافقة',
        offer_pending: 'تم إضافة عرض جديد بانتظار المراجعة',
        user_registered: 'مستخدم جديد سجل في المنصة',
        coupon_claimed: 'عميل استخدم كوبون جديد',
      };
      
      const newNotification: Notification = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
        type,
        title: titles[type],
        message: messages[type],
        timestamp: new Date().toISOString(),
        read: false,
      };
      
      setNotifications(prev => [newNotification, ...prev].slice(0, 50));
      onNotification?.(newNotification);
    };

    setConnected(true);
    const interval = setInterval(simulateNotifications, 30000);

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

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, connected, unreadCount, markAsRead, markAllAsRead };
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { isDark, toggle, mounted } = useDarkMode();
  const { logs, addLog, clearLogs } = useActivityLogs();

  // -----------------------------------------
  // LOCAL STATE - UI state management
  // -----------------------------------------
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showActivityLogs, setShowActivityLogs] = useState(false);
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

  // -----------------------------------------
  // REAL-TIME NOTIFICATIONS - Live updates
  // -----------------------------------------
  const { notifications, connected, unreadCount, markAsRead, markAllAsRead } = useRealTimeNotifications(
    useCallback((n: Notification) => {
      // Invalidate cache to refresh data when new items arrive
      if (n.type === 'store_pending' || n.type === 'offer_pending') {
        queryClient.invalidateQueries({ queryKey: ['pending-items'] });
        queryClient.invalidateQueries({ queryKey: ['global-stats'] });
      }
    }, [queryClient])
  );

  // -----------------------------------------
  // AUTO REFRESH - Periodic data sync
  // -----------------------------------------
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

  // -----------------------------------------
  // KEYBOARD SHORTCUTS - Productivity features
  // -----------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: Focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Ctrl/Cmd + R: Refresh data
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        queryClient.invalidateQueries();
      }
      // Esc: Close modals
      if (e.key === 'Escape') {
        setShowShortcuts(false);
        setShowNotifications(false);
        setShowActivityLogs(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [queryClient]);

  // -----------------------------------------
  // DATA FETCHING - API calls with React Query
  // -----------------------------------------
  
  // Global statistics (cached for 5 minutes when auto-refresh enabled)
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['global-stats'],
    queryFn: async () => {
      const response = await adminApi().get<GlobalStats>('/admin/stats/global');
      return response.data;
    },
    refetchInterval: autoRefresh ? 5 * 60 * 1000 : false,
  });

  // Period-based statistics (today/week/month)
  const { data: pStats, isLoading: pStatsLoading } = useQuery({
    queryKey: ['stats-period', period, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({ period });
      if (dateRange.from) params.append('from', dateRange.from);
      if (dateRange.to) params.append('to', dateRange.to);
      const response = await adminApi().get<PeriodStats>(`/admin/stats/period?${params}`);
      return response.data;
    },
    refetchInterval: autoRefresh ? 5 * 60 * 1000 : false,
  });

  // Top performing stores
  const { data: topStores, isLoading: topStoresLoading } = useQuery({
    queryKey: ['top-stores'],
    queryFn: async () => {
      const response = await adminApi().get<TopStore[]>('/admin/stats/top-stores');
      return response.data;
    },
    refetchInterval: autoRefresh ? 5 * 60 * 1000 : false,
  });

  // Top categories
  const { data: topCategories, isLoading: topCategoriesLoading } = useQuery({
    queryKey: ['top-categories'],
    queryFn: async () => {
      const response = await adminApi().get<TopCategory[]>('/admin/stats/top-categories');
      return response.data;
    },
    refetchInterval: autoRefresh ? 5 * 60 * 1000 : false,
  });

  // Pending stores and offers awaiting approval
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
    staleTime: 30000,
    refetchInterval: autoRefresh ? 5 * 60 * 1000 : false,
  });

  // -----------------------------------------
  // MUTATIONS - Data modification operations
  // -----------------------------------------
  
  /**
   * Single item approve/reject mutation
   * - Sends PATCH request to approve or reject a store/offer
   * - Invalidates pending-items cache on success
   * - Logs activity for audit trail
   */
  const actionMutation = useMutation({
    mutationFn: async ({ id, type, action }: { id: string; type: 'store' | 'offer'; action: 'approve' | 'reject' }) => {
      const resource = type === 'store' ? 'stores' : 'offers';
      return adminApi().patch(`/admin/${resource}/${id}/${action}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pending-items'] });
      queryClient.invalidateQueries({ queryKey: ['global-stats'] });
      addLog(
        variables.action === 'approve' ? 'APPROVE' : 'REJECT',
        variables.id,
        variables.type,
        `${variables.type === 'store' ? 'متجر' : 'عرض'} ${variables.action === 'approve' ? 'تمت الموافقة' : 'تم الرفض'}`
      );
    },
  });

  /**
   * Bulk action mutation
   * - Sends multiple approve/reject requests in parallel
   * - Updates cache after all succeed
   * - Logs bulk action for audit trail
   */
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

  // -----------------------------------------
  // DERIVED DATA - Computed from fetched data
  // -----------------------------------------
  
  // Combine and sort pending stores and offers by creation date
  const pendingItems: PendingItem[] = [
    ...(pendingData?.stores.map((s) => ({ 
      id: s.id, 
      type: 'store' as const, 
      name: s.name, 
      category: s.category?.name, 
      area: s.area, 
      createdAt: s.createdAt 
    })) ?? []),
    ...(pendingData?.offers.map((o) => ({ 
      id: o.id, 
      type: 'offer' as const, 
      name: o.title, 
      category: o.store?.category?.name, 
      area: o.store?.area, 
      createdAt: o.createdAt 
    })) ?? []),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  /**
   * Advanced filtering logic
   * - Matches type filter (store/offer/all)
   * - Matches area (case-insensitive substring match)
   * - Matches search query (name or category)
   */
  const filteredPendingItems = pendingItems.filter(item => {
    const matchesType = advancedFilters.type === 'all' || item.type === advancedFilters.type;
    const matchesArea = !advancedFilters.area || item.area?.toLowerCase().includes(advancedFilters.area.toLowerCase());
    const matchesSearch = !search || 
      item.name.toLowerCase().includes(search.toLowerCase()) || 
      item.category?.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesArea && matchesSearch;
  });

  // -----------------------------------------
  // HANDLERS - Event handlers
  // -----------------------------------------
  
  const toggleItemSelection = useCallback((id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedItems.size === filteredPendingItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredPendingItems.map((i: PendingItem) => i.id)));
    }
  }, [filteredPendingItems, selectedItems.size]);

  const format = (n: number) => new Intl.NumberFormat('ar-EG').format(n);

  /**
   * CSV Export logic
   * - Creates CSV with UTF-8 BOM for Excel compatibility
   * - Generates filename with current date
   * - Triggers browser download
   */
  const exportToCSV = (data: any[], filename: string) => {
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
  };

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

  // -----------------------------------------
  // RENDER - Loading state
  // -----------------------------------------
  if (statsLoading) {
    return (
      <div className={`flex h-screen items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="text-slate-400">جاري التحميل...</div>
      </div>
    );
  }

  // -----------------------------------------
  // MAIN RENDER
  // -----------------------------------------
  return (
    <div className="p-6 lg:p-10 space-y-10 pb-20">
      
      {/* HEADER - Page title and controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">لوحة التحكم الرئيسية</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">أهلاً بك مجدداً، إليك ملخص لأداء المنصة اليوم</p>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center gap-3 flex-wrap">
          {/* Search with keyboard shortcut hint */}
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="بحث سريع..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 lg:w-56 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-orange-500 transition-all"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">Q</span>
            <span className="absolute left-10 top-1/2 -translate-y-1/2 text-xs text-slate-300 font-bold">Ctrl+K</span>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2 py-1.5">
            <input
              type="date"
              value={dateRange.from || ''}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="text-xs font-medium border-none outline-none text-slate-600 w-28"
            />
            <span className="text-slate-300">-</span>
            <input
              type="date"
              value={dateRange.to || ''}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="text-xs font-medium border-none outline-none text-slate-600 w-28"
            />
          </div>

          {/* Period Selector */}
          <div className="flex p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
            {(['today', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  period === p ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
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
              autoRefresh ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <span className={autoRefresh ? 'animate-spin' : ''}>R</span>
            {autoRefresh ? 'تنشيط' : 'متوقف'}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggle}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-orange-600 transition-all"
          >
            {mounted && (isDark ? 'L' : 'D')}
          </button>

          {/* Activity Logs */}
          <button
            onClick={() => setShowActivityLogs(true)}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-purple-600 transition-all relative"
          >
            <span>A</span>
            {logs.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {logs.length > 9 ? '9+' : logs.length}
              </span>
            )}
          </button>

          {/* Notifications */}
          <button
            onClick={() => setShowNotifications(true)}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-orange-600 transition-all relative"
          >
            <span>N</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            {connected && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-500 border-2 border-white rounded-full" />}
          </button>

          {/* Keyboard Shortcuts Help */}
          <button
            onClick={() => setShowShortcuts(true)}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 transition-all"
          >
            <span>?</span>
          </button>
        </div>
      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="bg-slate-50/50 p-2 rounded-[2rem] border border-slate-100 flex flex-wrap items-center gap-2">
        <Link href="/dashboard/broadcast" className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 hover:border-orange-500 hover:text-orange-600 transition-all text-xs font-bold">
          إرسال تنبيه عاجل
        </Link>
        <Link href="/dashboard/audit-logs" className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:text-blue-600 transition-all text-xs font-bold">
          مراجعة سجلات الأمان
        </Link>
        <Link href="/dashboard/users" className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 transition-all text-xs font-bold">
          إدارة الطاقم
        </Link>
        <button onClick={handleExportStats} className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 hover:border-violet-500 hover:text-violet-600 transition-all text-xs font-bold">
          تصدير الإحصائيات
        </button>
        <button onClick={handleExportPending} className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 hover:border-pink-500 hover:text-pink-600 transition-all text-xs font-bold">
          تصدير الطلبات
        </button>
      </div>

      {/* STATS GRID - Dynamic statistics display */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="مستخدمين جدد"
          value={pStatsLoading ? '...' : format(pStats?.newUsers ?? 0)}
          trend="+12%"
        />
        <StatCard
          label="متاجر جديدة"
          value={pStatsLoading ? '...' : format(pStats?.newStores ?? 0)}
          trend="+5%"
        />
        <StatCard
          label="عروض مضافة"
          value={pStatsLoading ? '...' : format(pStats?.newOffers ?? 0)}
          trend="+18%"
        />
        <StatCard
          label="طلبات الكوبونات"
          value={pStatsLoading ? '...' : format(pStats?.newCoupons ?? 0)}
          trend="+24%"
        />
        <StatCard
          label="معدل التحويل"
          value={statsLoading ? '...' : stats?.coupons.couponConversionRate ?? '0%'}
          subValue={`${stats?.coupons.totalCouponsUsed ?? 0} مسح فعلي`}
        />
      </div>

      {/* MIDDLE SECTION - Pending requests and analytics */}
      <div className="grid gap-8 lg:grid-cols-3">
        
        {/* PENDING REQUESTS - With advanced filters and bulk actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm h-full">
            
            {/* Advanced Filters Bar */}
            <div className="border-b border-slate-100 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-900">طلبات المراجعة المعلقة</h2>
                  <span className="rounded-lg bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-600 border border-orange-100 uppercase tracking-widest">
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
                    {bulkMode ? 'إلغاء التحديد' : 'تحديد متعدد'}
                  </button>
                  <Link href="/dashboard/approvals" className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1 transition-all">
                    عرض الكل
                  </Link>
                </div>
              </div>

              {/* Advanced Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
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

              {/* Bulk Actions Bar - Shows when items selected */}
              {bulkMode && selectedItems.size > 0 && (
                <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-orange-600">{selectedItems.size} عنصر محدد</span>
                    <button onClick={selectAll} className="text-xs font-bold text-slate-500 hover:text-slate-700">
                      {selectedItems.size === filteredPendingItems.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => bulkActionMutation.mutate({ action: 'approve' })}
                      disabled={bulkActionMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all"
                    >
                      موافقة
                    </button>
                    <button
                      onClick={() => bulkActionMutation.mutate({ action: 'reject' })}
                      disabled={bulkActionMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-all"
                    >
                      رفض
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Pending Items List */}
            <div className="flex-1">
              {pendingLoading ? (
                <div className="py-20 flex justify-center">
                  <div className="text-slate-400">جاري التحميل...</div>
                </div>
              ) : filteredPendingItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                  <p className="text-base font-bold text-slate-900">لا توجد طلبات</p>
                  <p className="mt-1 text-sm text-slate-500 font-medium">لا توجد طلبات متاجر أو عروض بانتظار مراجعتك حالياً</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {filteredPendingItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors group">
                      <div className="flex items-center gap-4">
                        {/* Checkbox for bulk selection */}
                        {bulkMode && (
                          <button
                            onClick={() => toggleItemSelection(item.id)}
                            className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
                              selectedItems.has(item.id)
                                ? 'bg-orange-600 border-orange-600 text-white'
                                : 'border-slate-300 hover:border-orange-400'
                            }`}
                          >
                            {selectedItems.has(item.id) && <span className="text-xs">V</span>}
                          </button>
                        )}
                        
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all group-hover:scale-110 ${
                          item.type === 'store' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                        }`}>
                          <span className="text-sm font-bold">{item.type === 'store' ? 'S' : 'O'}</span>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-900 leading-tight">{item.name}</p>
                            <span className="text-xs font-bold text-slate-400 border border-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                              {item.type === 'store' ? 'متجر' : 'عرض'}
                            </span>
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
                          <Link href="/dashboard/approvals" className="h-9 w-9 rounded-xl bg-slate-900 text-white hover:bg-orange-600 transition-all flex items-center justify-center shadow-lg shadow-slate-200 text-xs font-bold">
                            {'>'}
                          </Link>
                        </div>
                      ) : (
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                          selectedItems.has(item.id) ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'
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

        {/* TOP STORES/CATEGORIES - Analytics sidebar */}
        <div className="space-y-6">
          
          {/* Top Categories */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-6">التصنيفات الأكثر طلباً</h3>
            <div className="space-y-4">
              {topCategoriesLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-8 animate-pulse bg-slate-50 rounded-lg" />
                ))
              ) : (
                topCategories?.slice(0, 5).map((cat, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700">{cat.name}</span>
                      <span className="text-slate-400">{cat.count} عرض</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (cat.count / (topCategories[0]?.count || 1)) * 100)}%` }}
                        className="h-full bg-blue-500"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Stores */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-6">المتاجر الأعلى أداءً</h3>
            <div className="space-y-5">
              {topStoresLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse bg-slate-50 rounded-xl" />
                ))
              ) : (
                topStores?.map((store, i) => {
                  const totalClaims = (store.offers || []).reduce((sum, off) => sum + (off._count?.coupons || 0), 0);
                  return (
                    <div key={store.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{store.name}</p>
                          <p className="text-[11px] font-bold text-slate-400">{store._count?.offers || 0} عرض | {totalClaims} كوبون</p>
                        </div>
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-xs font-bold">
                        #{i + 1}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION - Total platform scale */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 pt-4">
        <ScaleCard label="إجمالي المستخدمين" value={format(stats?.users.totalUsers ?? 0)} />
        <ScaleCard label="إجمالي المتاجر" value={format(stats?.stores.totalStores ?? 0)} />
        <ScaleCard label="إجمالي الكوبونات" value={format(stats?.coupons.totalCouponsGenerated ?? 0)} />
        <ScaleCard label="إجمالي التفاعلات" value={format((stats?.engagement.totalFavorites ?? 0) + (stats?.engagement.totalReviews ?? 0))} />
      </div>

      {/* MODALS */}
      
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
                <h3 className="text-lg font-bold text-slate-900">الإشعارات</h3>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <button onClick={markAllAsRead} className="text-xs font-bold text-slate-500 hover:text-slate-700 px-2 py-1">
                      تحديد الكل كمقروء
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)} className="rounded-xl bg-slate-50 p-2 text-slate-400 hover:text-slate-900">
                    X
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[50vh]">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
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
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-900">{n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                            <p className="text-xs text-slate-400 mt-1.5">
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
                <h3 className="text-lg font-bold text-slate-900">سجل النشاطات</h3>
                <div className="flex items-center gap-2">
                  {logs.length > 0 && (
                    <button onClick={clearLogs} className="text-xs font-bold text-rose-500 hover:text-rose-700 px-2 py-1">
                      مسح السجل
                    </button>
                  )}
                  <button onClick={() => setShowActivityLogs(false)} className="rounded-xl bg-slate-50 p-2 text-slate-400 hover:text-slate-900">
                    X
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[50vh]">
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm font-bold text-slate-500">لا توجد نشاطات مسجلة</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {logs.map((log) => (
                      <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-900">{log.action}</p>
                              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{log.targetType}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{log.details || log.target}</p>
                            <p className="text-xs text-slate-400 mt-1">{new Date(log.timestamp).toLocaleString('ar-EG')}</p>
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
                <h3 className="text-lg font-bold text-slate-900">اختصارات لوحة المفاتيح</h3>
                <button onClick={() => setShowShortcuts(false)} className="rounded-xl bg-slate-50 p-2 text-slate-400 hover:text-slate-900">
                  X
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'Ctrl+K', action: 'البحث السريع', desc: 'فتح حقل البحث مباشرة' },
                  { key: 'Ctrl+R', action: 'تحديث البيانات', desc: 'إعادة تحميل جميع الإحصائيات' },
                  { key: 'Esc', action: 'إغلاق النوافذ', desc: 'إغلاق أي modal مفتوح' },
                ].map((shortcut) => (
                  <div key={shortcut.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{shortcut.action}</p>
                      <p className="text-xs text-slate-400">{shortcut.desc}</p>
                    </div>
                    <kbd className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-sm">
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

// ============================================
// SUB-COMPONENTS - Reusable UI components
// ============================================

function StatCard({ label, value, trend, subValue }: { 
  label: string; 
  value: string; 
  trend?: string; 
  subValue?: string;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
      <div className="flex justify-between items-start mb-5">
        <div className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 font-bold text-lg">
          {label[0]}
        </div>
        {trend && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{trend}</span>}
      </div>
      <div>
        <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="mt-1.5 text-2xl font-bold text-slate-900 leading-none tabular-nums">{value}</p>
        {subValue && <p className="mt-2 text-[11px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md w-fit">{subValue}</p>}
      </div>
    </div>
  );
}

function ScaleCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-bold">
          {label[0]}
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-2xl font-bold text-slate-900 leading-none mt-1">{value}</p>
        </div>
      </div>
    </div>
  );
}
