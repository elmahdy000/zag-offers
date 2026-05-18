'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Tag, Ticket, Settings, Scan } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { icon: LayoutDashboard, label: 'الرئيسية', path: '/dashboard' },
  { icon: Tag, label: 'عروضي', path: '/dashboard/offers' },
  { icon: Scan, label: 'امسح', path: '/dashboard/scan' },
  { icon: Ticket, label: 'الكوبونات', path: '/dashboard/coupons' },
  { icon: Settings, label: 'المتجر', path: '/dashboard/profile' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[60]">
      <div className="glass rounded-t-[2rem] border-t border-glass-border bg-bg/80 backdrop-blur-2xl shadow-2xl flex items-center justify-around px-3 pt-3 pb-8">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className="relative flex flex-col items-center justify-center py-2 px-3 transition-all min-w-0"
            >
              <div className={`relative z-10 transition-all duration-200 ${isActive ? 'text-primary' : 'text-text-dim hover:text-text'}`}>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              
              <motion.span 
                initial={false}
                animate={{ 
                  opacity: isActive ? 1 : 0,
                  y: isActive ? 0 : 4
                }}
                transition={{ duration: 0.2 }}
                className="text-[9px] font-black mt-1 text-primary"
              >
                {isActive ? item.label : ''}
              </motion.span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
