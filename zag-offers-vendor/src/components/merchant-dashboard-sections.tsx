'use client';

import Link from 'next/link';
import {
  Activity,
  ArrowLeft,
  BadgePercent,
  BarChart3,
  CheckCircle2,
  Clock3,
  Eye,
  History,
  Lightbulb,
  Plus,
  QrCode,
  RefreshCcw,
  Settings,
  Store,
  Tag,
  TicketCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type DashboardStats = {
  storeName?: string;
  todayClaims?: number;
  scansToday?: number;
  totalViewsCount?: number;
  totalClaimsCount?: number;
  topOffers?: DashboardOffer[];
  recentCoupons?: DashboardCoupon[];
};

export type DashboardOffer = {
  id: string;
  title: string;
  discount?: string;
  couponsCount?: number;
  views?: number;
  status?: string;
};

export type DashboardCoupon = {
  id: string;
  status?: string;
  customerName?: string;
  offerTitle?: string;
  createdAt: string;
  code?: string;
};

type StatItem = { label: string; value: number; change: string; icon: LucideIcon; tone: string; points: number[] };

function Sparkline({ points }: { points: number[] }) {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = Math.max(max - min, 1);
  const path = points.map((point, index) => `${index * 14},${30 - ((point - min) / range) * 24}`).join(' ');
  return <svg className="merchant-sparkline" viewBox="0 0 84 34" aria-hidden="true"><polyline points={path} /></svg>;
}

export function OverviewHero({ storeName, lastUpdated, syncing, onRefresh }: { storeName: string; lastUpdated: string; syncing: boolean; onRefresh: () => void }) {
  return (
    <section className="merchant-overview">
      <div>
        <span className="merchant-status"><i /> المتجر نشط الآن {lastUpdated && <small>آخر تحديث {lastUpdated}</small>}</span>
        <h1>مرحبًا، {storeName}</h1>
        <p>تابع أداء متجرك وأدر العروض والكوبونات بسهولة من مكان واحد.</p>
      </div>
      <div className="merchant-overview-actions">
        <Link href="/dashboard/offers/new" className="merchant-primary-button"><Plus size={18} /> إضافة عرض</Link>
        <button type="button" onClick={onRefresh} className="merchant-secondary-button" disabled={syncing}><RefreshCcw size={17} className={syncing ? 'animate-spin' : ''} /> تحديث البيانات</button>
      </div>
    </section>
  );
}

export function StatsGrid({ stats, activeOffers, loading }: { stats?: DashboardStats | null; activeOffers: number; loading: boolean }) {
  const items: StatItem[] = [
    { label: 'زيارات المتجر', value: stats?.totalViewsCount ?? 0, change: 'إجمالي الزيارات', icon: Eye, tone: 'info', points: [3, 5, 4, 8, 7, 10, 12] },
    { label: 'طلبات اليوم', value: stats?.todayClaims ?? 0, change: 'طلبات كوبونات', icon: TicketCheck, tone: 'primary', points: [2, 3, 2, 5, 4, 7, 8] },
    { label: 'العروض النشطة', value: activeOffers, change: 'متاحة للعملاء', icon: BadgePercent, tone: 'success', points: [4, 4, 5, 6, 6, 7, 7] },
    { label: 'إجمالي الكوبونات', value: stats?.totalClaimsCount ?? 0, change: `${stats?.scansToday ?? 0} مستخدم اليوم`, icon: Users, tone: 'warning', points: [2, 5, 4, 6, 8, 7, 11] },
  ];
  return (
    <section aria-labelledby="stats-title">
      <div className="merchant-section-heading"><div><span>نظرة سريعة</span><h2 id="stats-title">أداء المتجر</h2></div><small>بيانات محدثة تلقائيًا</small></div>
      <div className="merchant-stats-grid">
        {items.map((item) => <article className="merchant-stat-card" key={item.label}>
          {loading ? <div className="merchant-stat-skeleton" /> : <>
            <div className={`merchant-stat-icon ${item.tone}`}><item.icon size={19} /></div>
            <Sparkline points={item.points} />
            <span>{item.label}</span>
            <strong>{item.value.toLocaleString('ar-EG')}</strong>
            <small>{item.change}</small>
          </>}
        </article>)}
      </div>
    </section>
  );
}

const actions = [
  { label: 'إضافة عرض', note: 'أنشئ عرضًا جديدًا', href: '/dashboard/offers/new', icon: Plus },
  { label: 'مسح كوبون', note: 'فعّل كوبون العميل', href: '/dashboard/scan', icon: QrCode },
  { label: 'الكوبونات', note: 'راجع سجل الاستخدام', href: '/dashboard/coupons', icon: History },
  { label: 'إدارة العروض', note: 'عدّل عروض متجرك', href: '/dashboard/offers', icon: Tag },
  { label: 'بيانات المتجر', note: 'حدّث معلوماتك', href: '/dashboard/profile', icon: Store },
  { label: 'الإعدادات', note: 'خصّص حسابك', href: '/dashboard/settings', icon: Settings },
];

export function QuickActions() {
  return <section aria-labelledby="actions-title"><div className="merchant-section-heading"><div><span>وصول مباشر</span><h2 id="actions-title">الإجراءات السريعة</h2></div></div><div className="merchant-actions-grid">{actions.map((action) => <Link href={action.href} className="merchant-action-tile" key={action.href}><span><action.icon size={19} /></span><div><b>{action.label}</b><small>{action.note}</small></div><ArrowLeft size={15} /></Link>)}</div></section>;
}

export function TopOffersSection({ offers = [], totalClaims = 0 }: { offers?: DashboardOffer[]; totalClaims?: number }) {
  const visible = offers.slice(0, 5);
  return <section className="merchant-panel" aria-labelledby="top-offers-title"><header><div className="merchant-heading-icon success"><BarChart3 size={19} /></div><div><h2 id="top-offers-title">العروض الأكثر تأثيرًا</h2><p>أعلى العروض تفاعلًا خلال آخر 7 أيام</p></div></header>{visible.length ? <div className="merchant-offers-list">{visible.map((offer, index) => { const count = offer.couponsCount ?? 0; const percent = Math.min((count / Math.max(totalClaims, 1)) * 100, 100); return <div className="merchant-offer-row" key={offer.id}><span className="merchant-rank">{index + 1}</span><div className="merchant-offer-copy"><b>{offer.title}</b><span>{offer.discount || 'عرض نشط'} · {count.toLocaleString('ar-EG')} كوبون</span><i><em style={{ width: `${Math.max(percent, 5)}%` }} /></i></div><span className="merchant-active-badge">نشط</span></div>; })}</div> : <div className="merchant-empty-state"><span><BadgePercent size={24} /></span><div><b>لا توجد عروض بعد</b><p>ابدأ بإضافة أول عرض ليظهر أداءه هنا.</p></div><Link href="/dashboard/offers/new">إضافة عرض <ArrowLeft size={14} /></Link></div>}</section>;
}

export function RecentActivitySection({ activities = [] }: { activities?: DashboardCoupon[] }) {
  const visible = activities.slice(0, 5);
  return <section className="merchant-panel" aria-labelledby="activity-title"><header><div className="merchant-heading-icon primary"><Activity size={19} /></div><div><h2 id="activity-title">سجل العمليات</h2><p>آخر أنشطة الكوبونات والعملاء</p></div><Link href="/dashboard/coupons">عرض الكل</Link></header>{visible.length ? <div className="merchant-activity-list">{visible.map((item) => { const used = item.status === 'USED'; return <div className="merchant-activity-row" key={item.id}><span className={used ? 'used' : 'new'}>{used ? <CheckCircle2 size={17} /> : <TicketCheck size={17} />}</span><div><b>{item.customerName || 'عميل'}</b><p>{item.offerTitle || 'طلب كوبون'}</p></div><time><Clock3 size={12} /> {new Date(item.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</time></div>; })}</div> : <div className="merchant-empty-state compact"><span><History size={23} /></span><div><b>لا توجد عمليات حديثة</b><p>ستظهر هنا عمليات استخدام الكوبونات.</p></div></div>}</section>;
}

export function SmartInsights({ activeOffers }: { activeOffers: number }) {
  const insight = activeOffers === 0 ? 'أضف عرضًا جديدًا لزيادة ظهور متجرك للعملاء.' : 'العروض ذات الصور الواضحة تحصل عادةً على تفاعل أعلى.';
  return <section className="merchant-insight"><span><Lightbulb size={20} /></span><div><small>نصيحة لتحسين الأداء</small><b>{insight}</b></div><Link href={activeOffers === 0 ? '/dashboard/offers/new' : '/dashboard/offers'}>اتخذ إجراء <ArrowLeft size={14} /></Link></section>;
}
