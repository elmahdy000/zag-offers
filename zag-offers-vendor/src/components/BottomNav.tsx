'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Tag, Ticket, Settings, Scan } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { icon: LayoutDashboard, label: 'الرئيسية', path: '/dashboard' },
  { icon: Tag, label: 'عروضي', path: '/dashboard/offers' },
  { icon: Scan, label: 'امسح 🤳', path: '/dashboard/scan' },
  { icon: Ticket, label: 'الكوبونات', path: '/dashboard/coupons' },
  { icon: Settings, label: 'المتجر', path: '/dashboard/profile' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] px-4 pb-6 pt-2">
      <div className="glass rounded-[2rem] border border-white/5 bg-bg/80 backdrop-blur-2xl shadow-2xl flex items-center justify-around p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className="relative flex flex-col items-center justify-center p-3 transition-all"
            >
              <div className={`relative z-10 transition-all ${isActive ? 'text-primary scale-110' : 'text-text-dim hover:text-text'}`}>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              
              {isActive && (
                <motion.div 
                  layoutId="bottom-nav-active"
                  className="absolute inset-0 bg-primary/10 rounded-2xl -z-0"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              {isActive && (
                <motion.span 
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[9px] font-black mt-1 text-primary"
                >
                  {item.label}
                </motion.span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
