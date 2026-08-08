'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowUpLeft,
  BarChart3,
  BellRing,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  FileText,
  LayoutGrid,
  Loader2,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Tags,
  TicketPercent,
  TrendingUp,
  UserRoundCheck,
  Users,
  Zap,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { adminApi } from '@/lib/api';

interface GlobalStats {
  users: {
    totalUsers: number;
    totalMerchants: number;
    tiers: { bronze: number; silver: number; gold: number; platinum: number };
    totalPoints: number;
  };
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
  category?: { name?: string } | string;
  _count?: { offers?: number; reviews?: number };
  totalCoupons?: number;
}

interface TopCategory {
  name: string;
  storeCount?: number;
  totalOffers?: number;
}

const numberFormatter = new Intl.NumberFormat('ar-EG');

function formatNumber(value: number | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? numberFormatter.format(value) : '—';
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
  delay,
}: {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone: 'orange' | 'blue' | 'emerald' | 'violet';
  delay: number;
}) {
  const tones = {
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="group relative overflow-hidden rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_16px_45px_-38px_rgba(15,23,42,.35)] transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_24px_60px_-38px_rgba(255,101,0,.28)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl border ${tones[tone]}`}>
          <Icon size={21} strokeWidth={2.2} />
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">بيانات المنصة</span>
      </div>

      <div className="mt-7 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-900 tabular-nums">{value}</p>
          <p className="mt-2 text-[10px] font-bold text-slate-400">{helper}</p>
        </div>
      </div>
    </motion.article>
  );
}

function QuickAction({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-24 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_18px_45px_-34px_rgba(255,101,0,.35)]"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-600 transition-colors group-hover:bg-orange-600 group-hover:text-white">
        <Icon size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <b className="block text-sm font-black text-slate-900">{title}</b>
        <small className="mt-1 block truncate text-[10px] font-bold text-slate-400">{description}</small>
      </span>
      <ChevronLeft size={17} className="text-slate-300 transition-transform group-hover:-translate-x-1 group-hover:text-orange-600" />
    </Link>
  );
}

function SectionTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-600">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-black text-slate-900">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-5 lg:p-8">
      <div className="h-64 animate-pulse rounded-[32px] bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-52 animate-pulse rounded-[18px] bg-slate-200" />)}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();

  const statsQuery = useQuery({
    queryKey: ['global-stats'],
    queryFn: async () => (await adminApi().get<GlobalStats>('/admin/stats/global')).data,
    staleTime: 60_000,
  });

  const periodQuery = useQuery({
    queryKey: ['stats-period', 'week'],
    queryFn: async () => (await adminApi().get<PeriodStats>('/admin/stats/period', { params: { period: 'week' } })).data,
    staleTime: 60_000,
  });

  const storesQuery = useQuery({
    queryKey: ['top-stores', 4],
    queryFn: async () => (await adminApi().get<TopStore[]>('/admin/stats/top-stores', { params: { limit: 4 } })).data,
    staleTime: 120_000,
  });

  const categoriesQuery = useQuery({
    queryKey: ['top-categories'],
    queryFn: async () => (await adminApi().get<TopCategory[]>('/admin/stats/top-categories')).data,
    staleTime: 120_000,
  });

  if (statsQuery.isLoading) return <DashboardSkeleton />;
  if (statsQuery.isError && !statsQuery.data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-5">
        <div role="alert" className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-8 text-center">
          <AlertTriangle className="mx-auto text-rose-500" size={36} />
          <h1 className="mt-4 text-xl font-bold text-slate-900">تعذر تحميل بيانات لوحة الإدارة</h1>
          <p className="mt-2 text-sm text-slate-500">لم يتم استبدال البيانات الفاشلة بقيم صفرية. حاول التحديث مرة أخرى.</p>
          <button onClick={() => void statsQuery.refetch()} className="admin-focus mt-5 h-11 rounded-xl bg-orange-600 px-5 text-sm font-bold text-white">إعادة المحاولة</button>
        </div>
      </div>
    );
  }

  const stats = statsQuery.data;
  const period = periodQuery.data;
  const pendingCount = (stats?.stores.pendingStores ?? 0) + (stats?.offers.pendingOffers ?? 0);
  const engagement = (stats?.engagement.totalFavorites ?? 0) + (stats?.engagement.totalReviews ?? 0);
  const usedCoupons = stats?.coupons.totalCouponsUsed ?? 0;
  const generatedCoupons = stats?.coupons.totalCouponsGenerated ?? 0;
  const isRefreshing = statsQuery.isFetching || periodQuery.isFetching || storesQuery.isFetching || categoriesQuery.isFetching;
  const lastUpdatedAt = statsQuery.dataUpdatedAt ? new Date(statsQuery.dataUpdatedAt) : null;

  const refreshDashboard = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['global-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['stats-period'] }),
      queryClient.invalidateQueries({ queryKey: ['top-stores'] }),
      queryClient.invalidateQueries({ queryKey: ['top-categories'] }),
    ]);
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-7 p-4 sm:p-6 lg:p-8">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative isolate overflow-hidden rounded-[20px] border border-white/10 bg-[#071426] px-6 py-6 text-white sm:px-8 lg:px-9 lg:py-7"
      >
        <div className="absolute -left-20 -top-40 -z-10 h-96 w-96 rounded-full border border-orange-500/15" />
        <div className="absolute -left-5 -top-24 -z-10 h-64 w-64 rounded-full bg-orange-500/5 blur-3xl" />
        <div className="absolute bottom-0 right-[48%] -z-10 h-px w-72 bg-orange-500/40" />

        <div className="grid items-center gap-8 lg:grid-cols-[1fr_310px]">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black text-emerald-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                النظام يعمل بكفاءة
              </span>
              <span className="text-[10px] font-bold text-slate-400">آخر تحديث: {lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' }) : '—'}</span>
            </div>

            <p className="text-xs font-bold text-orange-400">لوحة إدارة Zag Offers</p>
            <h1 className="mt-2 max-w-2xl text-2xl font-bold leading-relaxed sm:text-3xl lg:text-[34px]">
              نظرة شاملة على أداء المنصة
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-400">
              تابع المستخدمين والمتاجر والعروض والموافقات من مكان واحد.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/dashboard/approvals" className="inline-flex h-12 items-center gap-2 rounded-2xl bg-orange-600 px-5 text-xs font-black text-white shadow-[0_14px_30px_-15px_rgba(255,101,0,.8)] transition hover:bg-orange-500">
                <ShieldCheck size={18} /> مراجعة الموافقات
                {pendingCount > 0 && <span className="rounded-full bg-white px-2 py-0.5 text-[9px] text-orange-700">{pendingCount}</span>}
              </Link>
              <Link href="/dashboard/reports" className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 text-xs font-black text-white transition hover:border-orange-500/40 hover:bg-white/10">
                <BarChart3 size={18} /> فتح التقارير <ArrowLeft size={15} />
              </Link>
            </div>
          </div>

          <div className="rounded-[18px] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-orange-400">حالة الاتصال</p>
                <p className="mt-1 text-xs font-bold text-slate-400">الحالة الفعلية للبيانات</p>
              </div>
              <Activity size={22} className="text-orange-400" />
            </div>
            <div className="my-5 space-y-3 text-[11px] font-bold">
                <div className="flex justify-between text-slate-300"><span>API الرئيسي</span><span className={statsQuery.isError ? 'text-rose-400' : 'text-emerald-400'}>{statsQuery.isError ? 'تعذر التحديث' : 'متصل'}</span></div>
                <div className="h-px bg-white/10" />
                <div className="flex justify-between text-slate-300"><span>طلبات معلقة</span><span className="text-orange-400">{pendingCount}</span></div>
            </div>
            <button disabled={isRefreshing} onClick={() => void refreshDashboard()} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-[11px] font-bold text-slate-200 transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-60">
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} /> {isRefreshing ? 'جاري التحديث' : 'تحديث بيانات اللوحة'}
            </button>
          </div>
        </div>
      </motion.section>

      <section>
        <SectionTitle eyebrow="نظرة تنفيذية" title="نبض المنصة اليوم" action={<span className="text-[10px] font-bold text-slate-400">بيانات محدثة تلقائيًا</span>} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="إجمالي المستخدمين" value={formatNumber(stats?.users.totalUsers)} helper={period ? `+${formatNumber(period.newUsers)} خلال آخر أسبوع` : 'بيانات الفترة غير متاحة'} icon={Users} tone="blue" delay={0.04} />
          <MetricCard label="المتاجر المعتمدة" value={formatNumber(stats?.stores.approvedStores)} helper={`${formatNumber(stats?.stores.pendingStores)} بانتظار المراجعة`} icon={Store} tone="emerald" delay={0.08} />
          <MetricCard label="العروض النشطة" value={formatNumber(stats?.offers.activeOffers)} helper={`${formatNumber(stats?.offers.totalOffers)} عرض على المنصة`} icon={Tags} tone="orange" delay={0.12} />
          <MetricCard label="الكوبونات المستخدمة" value={formatNumber(usedCoupons)} helper={stats?.coupons.couponConversionRate ? `معدل تحويل ${stats.coupons.couponConversionRate}` : 'معدل التحويل غير متاح'} icon={TicketPercent} tone="violet" delay={0.16} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_.92fr]">
        <section>
          <SectionTitle eyebrow="وصول مباشر" title="الإجراءات السريعة" />
          <div className="grid gap-3 sm:grid-cols-2">
            <QuickAction href="/dashboard/approvals" title="مركز الموافقات" description="راجع التجار والعروض الجديدة" icon={ShieldCheck} />
            <QuickAction href="/dashboard/broadcast" title="إرسال تنبيه عام" description="تواصل مع مستخدمي المنصة" icon={Megaphone} />
            <QuickAction href="/dashboard/merchants" title="إدارة التجار" description="الحسابات والحالة التشغيلية" icon={UserRoundCheck} />
            <QuickAction href="/dashboard/offers" title="إدارة العروض" description="راجع المحتوى والحملات" icon={ShoppingBag} />
            <QuickAction href="/dashboard/banners" title="محتوى الواجهة" description="إدارة البانرات الرئيسية" icon={LayoutGrid} />
            <QuickAction href="/dashboard/audit-logs" title="سجل العمليات" description="تتبع كل تغييرات الإدارة" icon={FileText} />
          </div>
        </section>

        <section>
          <SectionTitle eyebrow="يتطلب انتباهك" title="مركز المتابعة" action={<Link href="/dashboard/approvals" className="text-[10px] font-black text-orange-600 hover:underline">عرض الكل</Link>} />
          <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_18px_50px_-40px_rgba(15,23,42,.32)]">
            <div className="relative overflow-hidden border-b border-slate-100 bg-orange-50 p-5">
              <div className="absolute -left-8 -top-12 h-32 w-32 rounded-full bg-orange-200/40 blur-2xl" />
              <div className="relative flex items-center gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-orange-600 shadow-sm"><BellRing size={23} /></span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-500">طلبات في قائمة المراجعة</p>
                  <p className="mt-1 text-3xl font-black text-slate-900">{formatNumber(pendingCount)}</p>
                </div>
                <Link href="/dashboard/approvals" className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-600 text-white transition hover:bg-orange-700"><ArrowUpLeft size={18} /></Link>
              </div>
            </div>

            <div className="divide-y divide-slate-100 px-5">
              {[
                { label: 'متاجر تنتظر الاعتماد', value: stats?.stores.pendingStores ?? 0, icon: Store, color: 'text-emerald-600 bg-emerald-50' },
                { label: 'عروض تنتظر المراجعة', value: stats?.offers.pendingOffers ?? 0, icon: Tags, color: 'text-orange-600 bg-orange-50' },
                { label: 'عروض منتهية تحتاج متابعة', value: stats?.offers.expiredOffers ?? 0, icon: Clock3, color: 'text-slate-600 bg-slate-100' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 py-4">
                  <span className={`grid h-10 w-10 place-items-center rounded-xl ${item.color}`}><item.icon size={17} /></span>
                  <span className="flex-1 text-xs font-bold text-slate-600">{item.label}</span>
                  <b className="text-sm font-black text-slate-900 tabular-nums">{formatNumber(item.value)}</b>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,.32)] sm:p-6">
          <SectionTitle eyebrow="أداء الشركاء" title="المتاجر الأكثر نشاطًا" action={<Link href="/dashboard/reports" className="inline-flex items-center gap-1 text-[10px] font-black text-orange-600">التقرير الكامل <ChevronLeft size={14} /></Link>} />
          <div className="space-y-3">
            {(storesQuery.data ?? []).slice(0, 4).map((store, index) => {
              const category = typeof store.category === 'string' ? store.category : store.category?.name;
              const metric = store._count?.reviews ?? 0;
              const maxMetric = Math.max(...(storesQuery.data ?? []).map((item) => item._count?.reviews ?? 0), 1);
              return (
                <div key={store.id} className="group flex items-center gap-4 rounded-2xl border border-transparent bg-slate-50 p-3.5 transition hover:border-orange-100 hover:bg-orange-50/50">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-sm font-black ${index === 0 ? 'bg-[#071426] text-orange-400' : 'bg-white text-slate-500 shadow-sm'}`}>{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-900">{store.name}</p>
                    <p className="mt-1 text-[10px] font-bold text-slate-400">{category || 'متجر شريك'} · {formatNumber(metric)} تقييم</p>
                  </div>
                  <div className="hidden w-32 sm:block">
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-200"><span className="block h-full rounded-full bg-orange-500" style={{ width: `${(metric / maxMetric) * 100}%` }} /></div>
                  </div>
                  <TrendingUp size={17} className="text-emerald-500" />
                </div>
              );
            })}
            {!storesQuery.isLoading && (storesQuery.data?.length ?? 0) === 0 && <p className="py-10 text-center text-xs font-bold text-slate-400">لا توجد بيانات متاجر كافية بعد</p>}
            {storesQuery.isLoading && <div className="flex justify-center py-10"><Loader2 className="animate-spin text-orange-600" /></div>}
          </div>
        </section>

        <section className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,.32)] sm:p-6">
          <SectionTitle eyebrow="توزيع النشاط" title="التصنيفات الرائدة" />
          <div className="space-y-5">
            {(categoriesQuery.data ?? []).slice(0, 5).map((category, index, list) => {
              const categoryCount = category.storeCount ?? 0;
              const max = Math.max(...list.map((item) => item.storeCount ?? 0), 1);
              return (
                <div key={category.name}>
                  <div className="mb-2 flex items-center justify-between gap-4 text-xs font-bold">
                    <span className="text-slate-700">{category.name}</span>
                    <span className="text-slate-400">{formatNumber(categoryCount)} {categoryCount === 1 ? 'متجر' : 'متاجر'}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100"><motion.span initial={{ width: 0 }} animate={{ width: `${(categoryCount / max) * 100}%` }} transition={{ delay: 0.15 + index * 0.07 }} className="block h-full rounded-full bg-orange-500" /></div>
                </div>
              );
            })}
            {!categoriesQuery.isLoading && (categoriesQuery.data?.length ?? 0) === 0 && <p className="py-10 text-center text-xs font-bold text-slate-400">لا توجد بيانات تصنيفات كافية بعد</p>}
          </div>
        </section>
      </div>

      <section className="grid gap-4 rounded-[18px] border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4 lg:p-6">
        {[
          { label: 'تجار المنصة', value: stats?.users.totalMerchants ?? 0, icon: UserRoundCheck, note: 'حساب تجاري' },
          { label: 'تفاعل العملاء', value: engagement, icon: Sparkles, note: 'مفضلة وتقييم' },
          { label: 'كوبونات مولّدة', value: generatedCoupons, icon: Zap, note: 'إجمالي النظام' },
          { label: 'نقاط العملاء', value: stats?.users.totalPoints ?? 0, icon: Activity, note: 'نقطة ولاء' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-orange-600 shadow-sm"><item.icon size={19} /></span>
            <div><p className="text-[10px] font-bold text-slate-400">{item.label}</p><p className="mt-1 text-lg font-black text-slate-900">{formatNumber(item.value)}</p><p className="text-[9px] font-bold text-slate-400">{item.note}</p></div>
          </div>
        ))}
      </section>

      {statsQuery.isError && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-800">
          <span className="flex items-center gap-2"><CheckCircle2 size={17} /> تم عرض آخر بيانات متاحة، وقد تتأخر بعض المؤشرات.</span>
          <button onClick={() => void refreshDashboard()} className="rounded-xl bg-amber-100 px-3 py-2">إعادة المحاولة</button>
        </div>
      )}
    </div>
  );
}
