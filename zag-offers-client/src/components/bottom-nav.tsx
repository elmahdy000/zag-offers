'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BadgePercent, Grid2X2, House, Tickets, UserRound } from 'lucide-react';

const navItems = [
  { icon: House, label: 'الرئيسية', path: '/' },
  { icon: Grid2X2, label: 'الأقسام', path: '/categories' },
  { icon: BadgePercent, label: 'العروض', path: '/offers' },
  { icon: Tickets, label: 'كوبوناتي', path: '/coupons' },
  { icon: UserRound, label: 'حسابي', path: '/profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
  if (isAuthPage) return null;

  return (
    <nav className="mobile-dock md:hidden" aria-label="التنقل الرئيسي">
      <div className="mobile-dock-inner">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(`${item.path}/`));
          const Icon = item.icon;
          return (
            <Link prefetch={false} key={item.path} href={item.path} className={`mobile-dock-item ${isActive ? 'is-active' : ''}`} aria-current={isActive ? 'page' : undefined}>
              <span className="mobile-dock-icon">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              </span>
              <span className="mobile-dock-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
