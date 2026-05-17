'use client';

import { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Download,
  Loader2,
  Store,
  Tag,
  TrendingUp,
  Users,
  TicketPercent,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { adminApi } from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';

interface PeriodStats {
  users: { totalUsers: number; totalMerchants: number; newUsers: number };
  stores: { totalStores: number; newStores: number; pendingStores: number };
  offers: { totalOffers: number; newOffers: number; activeOffers: number };
  coupons: { totalCouponsGenerated: number; totalCouponsUsed: number; couponConversionRate: string };
  engagement: { totalFavorites: number; totalReviews: number };
}

interface TopStore {
  id: string;
  name: string;
  category: string;
  _count: { offers: number; coupons: number };
}

interface TopCategory {
  name: string;
  _count: { stores: number; offers: number };
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: 'blue' | 'orange' | 'emerald' | 'purple';
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  } as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="admin-panel p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className={`h-11 w-11 rounded-xl border flex items-center justify-center ${tones[tone]}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="text-[11px] font-bold text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
    </motion.div>
  );
}

function PanelSkeleton() {
  return (
    <div className="admin-panel p-6 animate-pulse">
      <div className="h-4 w-32 bg-slate-100 rounded mb-6" />
      <div className="space-y-3">
        <div className="h-12 bg-slate-50 rounded-xl" />
        <div className="h-12 bg-slate-50 rounded-xl" />
        <div className="h-12 bg-slate-50 rounded-xl" />
      </div>
    </div>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="admin-panel p-10 text-center">
      <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
        <AlertTriangle size={22} />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">فشل تحميل البيانات</h3>
      <p className="text-sm font-medium text-slate-500">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition-all hover:bg-orange-700"
        >
          <RefreshCw size={16} />
          <span>إعادة المحاولة</span>
        </button>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErrorData,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['admin-stats-period', period],
    queryFn: async () => {
      const response = await adminApi().get<PeriodStats>('/admin/stats/period', { params: { period } });
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('تنسيق استجابة غير صالح');
      }
      return response.data;
    },
    staleTime: 120000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const {
    data: topStores,
    isLoading: storesLoading,
    isError: storesError,
    refetch: refetchStores,
  } = useQuery({
    queryKey: ['admin-top-stores'],
    queryFn: async () => {
      const response = await adminApi().get<TopStore[]>('/admin/stats/top-stores');
      if (!Array.isArray(response.data)) {
        throw new Error('تنسيق استجابة غير صالح');
      }
      return response.data;
    },
    staleTime: 180000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const {
    data: topCategories,
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ['admin-top-categories'],
    queryFn: async () => {
      const response = await adminApi().get<TopCategory[]>('/admin/stats/top-categories');
      if (!Array.isArray(response.data)) {
        throw new Error('تنسيق استجابة غير صالح');
      }
      return response.data;
    },
    staleTime: 180000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const periodLabel = useMemo(() => {
    if (period === 'week') return 'آخر أسبوع';
    if (period === 'month') return 'آخر شهر';
    return 'آخر سنة';
  }, [period]);

  if (statsError && !storesError && !categoriesError) {
    return (
      <div className="p-6 lg:p-10">
        <ErrorPanel
          message={(statsErrorData as Error)?.message || 'حدث خطأ أثناء تحميل البيانات'}
          onRetry={() => refetchStats()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <PageHeader
          title="التقارير والإحصائيات"
          description={`نظرة عامة على أداء المنصة - ${periodLabel}`}
          icon={BarChart3}
        />

        <div className="flex flex-wrap items-center gap-2">
          {(['week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`h-10 px-4 rounded-xl text-xs font-bold transition-all border ${
                period === p
                  ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {p === 'week' ? 'أسبوع' : p === 'month' ? 'شهر' : 'سنة'}
            </button>
          ))}

          <button
            type="button"
            className="h-10 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all"
          >
            <Download size={14} />
            تصدير
          </button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="المستخدمون الجدد" value={stats?.users.newUsers ?? 0} icon={Users} tone="blue" />
        <StatCard label="المتاجر الجديدة" value={stats?.stores.newStores ?? 0} icon={Store} tone="orange" />
        <StatCard label="العروض الجديدة" value={stats?.offers.newOffers ?? 0} icon={Tag} tone="emerald" />
        <StatCard label="الكوبونات المستخدمة" value={stats?.coupons.totalCouponsUsed ?? 0} icon={Activity} tone="purple" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="admin-panel p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-slate-900">أفضل المتاجر أداء</h3>
            <TrendingUp size={18} className="text-emerald-600" />
          </div>

          {storesError ? (
            <ErrorPanel
              message="فشل تحميل المتاجر الأكثر أداءً"
              onRetry={() => refetchStores()}
            />
          ) : storesLoading ? (
            <PanelSkeleton />
          ) : topStores && topStores.length > 0 ? (
            <div className="space-y-3">
              {topStores.slice(0, 5).map((store, index) => (
                <div key={store.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="h-8 w-8 rounded-lg bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{store.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{store.category}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900 tabular-nums">{store._count?.offers ?? 0}</p>
                    <p className="text-xs text-slate-500">عرض</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">لا توجد بيانات كافية لعرضها.</p>
          )}
        </div>

        <div className="admin-panel p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-slate-900">أفضل التصنيفات</h3>
            <TicketPercent size={18} className="text-purple-600" />
          </div>

          {categoriesError ? (
            <ErrorPanel
              message="فشل تحميل التصنيفات الأكثر أداءً"
              onRetry={() => refetchCategories()}
            />
          ) : categoriesLoading ? (
            <PanelSkeleton />
          ) : topCategories && topCategories.length > 0 ? (
            <div className="space-y-3">
              {topCategories.slice(0, 5).map((category, index) => (
                <div key={category.name} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{category.name}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900 tabular-nums">{category._count?.stores ?? 0}</p>
                    <p className="text-xs text-slate-500">متجر</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">لا توجد تصنيفات كافية لعرضها.</p>
          )}
        </div>
      </div>

      <div className="admin-panel p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-5">ملخص النظام</h3>

        {statsLoading ? (
          <div className="h-28 flex items-center justify-center text-slate-400">
            <Loader2 className="animate-spin" size={22} />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[11px] font-bold text-slate-500 mb-1">إجمالي المستخدمين</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats?.users.totalUsers ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[11px] font-bold text-slate-500 mb-1">إجمالي المتاجر</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats?.stores.totalStores ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[11px] font-bold text-slate-500 mb-1">إجمالي العروض</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats?.offers.totalOffers ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[11px] font-bold text-slate-500 mb-1">معدل التحويل</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats?.coupons.couponConversionRate ?? '0%'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
