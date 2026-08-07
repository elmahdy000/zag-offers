'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BadgePercent, ChartNoAxesCombined, ScanLine, Settings, Tickets } from 'lucide-react';

const navItems = [
  { icon: ChartNoAxesCombined, label: 'الرئيسية', path: '/dashboard' },
  { icon: BadgePercent, label: 'العروض', path: '/dashboard/offers' },
  { icon: ScanLine, label: 'امسح', path: '/dashboard/scan', featured: true },
  { icon: Tickets, label: 'الكوبونات', path: '/dashboard/coupons' },
  { icon: Settings, label: 'الإعدادات', path: '/dashboard/settings' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="vendor-mobile-dock lg:hidden" aria-label="التنقل الرئيسي">
      <div className="vendor-mobile-dock-inner">
        {navItems.map((item) => {
          const active = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(`${item.path}/`));
          return (
            <Link key={item.path} href={item.path} className={`vendor-dock-item ${active ? 'is-active' : ''} ${item.featured ? 'is-featured' : ''}`} aria-current={active ? 'page' : undefined}>
              <span className="vendor-dock-icon"><item.icon size={item.featured ? 23 : 21} strokeWidth={active ? 2.5 : 1.9} /></span>
              <span className="vendor-dock-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
