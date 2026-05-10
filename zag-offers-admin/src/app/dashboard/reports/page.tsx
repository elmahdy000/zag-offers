'use client';

import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Store,
  Tag,
  Calendar,
  Download,
  Loader2,
  ArrowUp,
  ArrowDown,
  Activity,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { adminApi } from '@/lib/api';

// Components
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

export default function ReportsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats-period', period],
    queryFn: async () => {
      const response = await adminApi().get<PeriodStats>('/admin/stats/period', {
        params: { period },
      });
      return response.data;
    },
    staleTime: 120000,
    refetchOnWindowFocus: false,
  });

  const { data: topStores, isLoading: storesLoading } = useQuery({
    queryKey: ['admin-top-stores'],
    queryFn: async () => {
      const response = await adminApi().get<TopStore[]>('/admin/stats/top-stores');
      return response.data;
    },
    staleTime: 180000,
    refetchOnWindowFocus: false,
  });

  const { data: topCategories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['admin-top-categories'],
    queryFn: async () => {
      const response = await adminApi().get<TopCategory[]>('/admin/stats/top-categories');
      return response.data;
    },
    staleTime: 180000,
    refetchOnWindowFocus: false,
  });

  const StatCard = ({
    label,
    value,
    change,
    icon: Icon,
    color,
  }: {
    label: string;
    value: string | number;
    change?: number;
    icon: any;
    color: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon size={24} className="text-white" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-bold ${
            change >= 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {change >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </motion.div>
  );

  const SimpleBarChart = ({ data, label }: { data: number[]; label: string }) => {
    const max = Math.max(...data);
    return (
      <div className="space-y-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <div className="flex items-end gap-2 h-32">
          {data.map((value, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${(value / max) * 100}%` }}
              className="flex-1 bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg"
              transition={{ delay: i * 0.1 }}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-10 space-y-8">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <PageHeader 
          title="التقارير والتحليلات" 
          description="رؤية شاملة لأداء المنصة ومؤشرات النمو والتفاعل" 
          icon={BarChart3}
        />
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`h-10 px-4 rounded-xl text-xs font-bold transition-all ${
                period === p
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/10'
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {p === 'week' ? 'أسبوع' : p === 'month' ? 'شهر' : 'سنة'}
            </button>
          ))}
          <button className="h-10 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all">
            <Download size={14} />
            تصدير
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="المستخدمين الجدد"
          value={stats?.users.newUsers || 0}
          change={12}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          label="المتاجر الجديدة"
          value={stats?.stores.newStores || 0}
          change={8}
          icon={Store}
          color="bg-orange-500"
        />
        <StatCard
          label="العروض الجديدة"
          value={stats?.offers.newOffers || 0}
          change={15}
          icon={Tag}
          color="bg-emerald-500"
        />
        <StatCard
          label="الكوبونات المستخدمة"
          value={stats?.coupons.totalCouponsUsed || 0}
          change={22}
          icon={Activity}
          color="bg-purple-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-900">نمو المستخدمين</h3>
            <TrendingUp size={18} className="text-emerald-500" />
          </div>
          {statsLoading ? (
            <div className="h-32 flex items-center justify-center">
              <Loader2 className="animate-spin text-slate-300" size={24} />
            </div>
          ) : (
            <SimpleBarChart data={[40, 65, 80, 95, 110, 130, 150]} label="آخر 7 أيام" />
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-900">نشاط الكوبونات</h3>
            <Activity size={18} className="text-purple-500" />
          </div>
          {statsLoading ? (
            <div className="h-32 flex items-center justify-center">
              <Loader2 className="animate-spin text-slate-300" size={24} />
            </div>
          ) : (
            <SimpleBarChart data={[25, 45, 35, 60, 55, 80, 70]} label="آخر 7 أيام" />
          )}
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">أفضل المتاجر أداءً</h3>
          {storesLoading ? (
            <div className="h-32 flex items-center justify-center">
              <Loader2 className="animate-spin text-slate-300" size={24} />
            </div>
          ) : (
            <div className="space-y-3">
              {topStores?.slice(0, 5).map((store, i) => (
                <div key={store.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all">
                  <div className="h-8 w-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-black text-xs">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{store.name}</p>
                    <p className="text-[10px] text-slate-500">{store.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{store._count.offers}</p>
                    <p className="text-[10px] text-slate-400">عرض</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">أفضل التصنيفات</h3>
          {categoriesLoading ? (
            <div className="h-32 flex items-center justify-center">
              <Loader2 className="animate-spin text-slate-300" size={24} />
            </div>
          ) : (
            <div className="space-y-3">
              {topCategories?.slice(0, 5).map((category, i) => (
                <div key={category.name} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-xs">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{category.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{category._count.stores}</p>
                    <p className="text-[10px] text-slate-400">متجر</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-6">إحصائيات تفصيلية</h3>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">إجمالي المستخدمين</p>
            <p className="text-xl font-black text-slate-900">{stats?.users.totalUsers || 0}</p>
            <p className="text-xs text-slate-500 mt-1">{stats?.users.totalMerchants || 0} تاجر</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">إجمالي المتاجر</p>
            <p className="text-xl font-black text-slate-900">{stats?.stores.totalStores || 0}</p>
            <p className="text-xs text-slate-500 mt-1">{stats?.stores.pendingStores || 0} معلق</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">إجمالي العروض</p>
            <p className="text-xl font-black text-slate-900">{stats?.offers.totalOffers || 0}</p>
            <p className="text-xs text-slate-500 mt-1">{stats?.offers.activeOffers || 0} نشط</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">معدل التحويل</p>
            <p className="text-xl font-black text-slate-900">{stats?.coupons.couponConversionRate || '0%'}</p>
            <p className="text-xs text-slate-500 mt-1">{stats?.coupons.totalCouponsGenerated || 0} كوبون</p>
          </div>
        </div>
      </div>

    </div>
  );
}
