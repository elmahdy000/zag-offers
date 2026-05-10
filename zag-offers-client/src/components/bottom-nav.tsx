'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Heart, User } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { icon: Home, label: 'الرئيسية', path: '/offers' },
  { icon: LayoutGrid, label: 'الأقسام', path: '/categories' },
  { icon: Heart, label: 'المفضلة', path: '/favorites' },
  { icon: User, label: 'حسابي', path: '/profile' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-sm">
      <div className="bg-[#1A1A1A]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-around p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className="relative flex flex-col items-center justify-center py-2 px-4 transition-all"
            >
              {isActive && (
                <motion.div 
                  layoutId="bottom-nav-active"
                  className="absolute inset-0 bg-[#FF6B00]/10 rounded-2xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}

              <div className={`relative z-10 transition-all duration-300 ${isActive ? 'text-[#FF6B00] -translate-y-1' : 'text-[#9A9A9A]'}`}>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              
              {isActive && (
                <motion.span 
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative z-10 text-[9px] font-black mt-1 text-[#FF6B00]"
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
