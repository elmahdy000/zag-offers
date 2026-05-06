'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { adminApi } from '@/lib/api';

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

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['global-stats'],
    queryFn: async () => {
      const response = await adminApi().get<GlobalStats>('/admin/stats/global');
      return response.data;
    },
    staleTime: 60000,
  });

  const { data: pStats, isLoading: pStatsLoading } = useQuery({
    queryKey: ['stats-period', period],
    queryFn: async () => {
      const response = await adminApi().get<PeriodStats>('/admin/stats/period', { params: { period } });
      return response.data;
    },
    staleTime: 30000,
  });

  const { data: topStores = [], isLoading: topStoresLoading } = useQuery({
    queryKey: ['top-stores'],
    queryFn: async () => {
      const response = await adminApi().get<TopStore[]>('/admin/stats/top-stores', { params: { limit: 5 } });
      return response.data;
    },
  });

  const { data: topCategories = [], isLoading: topCategoriesLoading } = useQuery({
    queryKey: ['top-categories'],
    queryFn: async () => {
      const response = await adminApi().get<TopCategory[]>('/admin/stats/top-categories');
      return response.data;
    },
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
    staleTime: 30000,
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, type, action }: { id: string; type: 'store' | 'offer'; action: 'approve' | 'reject' }) => {
      const resource = type === 'store' ? 'stores' : 'offers';
      return adminApi().patch(`/admin/${resource}/${id}/${action}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-items'] });
      queryClient.invalidateQueries({ queryKey: ['global-stats'] });
    },
  });

  const pendingItems: PendingItem[] = [
    ...(pendingData?.stores.map((s) => ({ id: s.id, type: 'store' as const, name: s.name, category: s.category?.name, area: s.area, createdAt: s.createdAt })) ?? []),
    ...(pendingData?.offers.map((o) => ({ id: o.id, type: 'offer' as const, name: o.title, category: o.store?.category?.name, area: o.store?.area, createdAt: o.createdAt })) ?? []),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const format = (n: number) => new Intl.NumberFormat('ar-EG').format(n);

  if (statsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-10 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 leading-tight">لوحة التحكم الرئيسية</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">أهلاً بك مجدداً، إليك ملخص لأداء المنصة اليوم</p>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl shadow-slate-200">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Live Server Time</span>
                <span className="text-sm font-black tracking-widest font-mono">
                   {new Date().toLocaleTimeString('ar-EG', { hour12: true })}
                </span>
             </div>
          </div>
          <div className="flex p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
            {(['today', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${period === p ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                {p === 'today' ? 'اليوم' : p === 'week' ? 'الأسبوع' : 'الشهر'}
              </button>
            ))}
          </div>
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
      </div>

      {/* Dynamic Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="مستخدمين جدد"
          value={pStatsLoading ? '...' : format(pStats?.newUsers ?? 0)}
          icon={Users}
          color="text-blue-600"
          bg="bg-blue-50"
          trend="+12%"
        />
        <StatCard
          label="متاجر جديدة"
          value={pStatsLoading ? '...' : format(pStats?.newStores ?? 0)}
          icon={Store}
          color="text-emerald-600"
          bg="bg-emerald-50"
          trend="+5%"
        />
        <StatCard
          label="عروض مضافة"
          value={pStatsLoading ? '...' : format(pStats?.newOffers ?? 0)}
          icon={Zap}
          color="text-orange-600"
          bg="bg-orange-50"
          trend="+18%"
        />
        <StatCard
          label="طلبات الكوبونات"
          value={pStatsLoading ? '...' : format(pStats?.newCoupons ?? 0)}
          icon={TicketPercent}
          color="text-violet-600"
          bg="bg-violet-50"
          trend="+24%"
        />
        <StatCard
          label="معدل التحويل"
          value={statsLoading ? '...' : stats?.coupons.couponConversionRate ?? '0%'}
          icon={TrendingUp}
          color="text-pink-600"
          bg="bg-pink-50"
          subValue={`${stats?.coupons.totalCouponsUsed ?? 0} مسح فعلي`}
        />
      </div>

      {/* Middle Section: Trends & Lists */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Pending Requests */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm h-full">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900">طلبات المراجعة المعلقة</h2>
                <span className="rounded-lg bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600 border border-orange-100 uppercase tracking-widest">
                  {pendingItems.length} طلب
                </span>
              </div>
              <Link href="/dashboard/approvals" className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1 transition-all">
                عرض الكل <ArrowRight size={14} className="rotate-180" />
              </Link>
            </div>

            <div className="flex-1">
              {pendingLoading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-orange-600" /></div>
              ) : pendingItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                    <Inbox size={32} />
                  </div>
                  <p className="text-base font-bold text-slate-900">كل شيء رايق!</p>
                  <p className="mt-1 text-sm text-slate-500 font-medium">لا توجد طلبات متاجر أو عروض بانتظار مراجعتك حالياً</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {pendingItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors group">
                      <div className="flex items-center gap-4">
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
                      <div className="flex items-center gap-2">
                        <button onClick={() => actionMutation.mutate({ id: item.id, type: item.type, action: 'approve' })} className="h-9 px-4 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                          موافقة
                        </button>
                        <Link href={`/dashboard/approvals`} className="h-9 w-9 rounded-xl bg-slate-900 text-white hover:bg-orange-600 transition-all flex items-center justify-center shadow-lg shadow-slate-200">
                          <ExternalLink size={14} />
                        </Link>
                      </div>
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
                  const totalScans = store.totalCoupons || 0; // Using totalCoupons as redeemed count if available
                  
                  return (
                    <div key={store.id} className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                        {store.logo ? <img src={store.logo} alt="logo" className="h-full w-full object-cover" /> : <Store size={18} className="text-slate-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{store.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            {totalClaims} طلب
                          </p>
                          <span className="h-1 w-1 rounded-full bg-slate-200" />
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">
                            {totalScans} مسح
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
