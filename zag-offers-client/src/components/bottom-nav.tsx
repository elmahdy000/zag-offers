'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  RiHome5Line, RiHome5Fill, 
  RiFunctionLine, RiFunctionFill, 
  RiCoupon2Line, RiCoupon2Fill, 
  RiUser3Line, RiUser3Fill 
} from 'react-icons/ri';
import { motion } from 'framer-motion';

const navItems = [
  { icon: RiHome5Line, activeIcon: RiHome5Fill, label: 'الرئيسية', path: '/' },
  { icon: RiFunctionLine, activeIcon: RiFunctionFill, label: 'الأقسام', path: '/categories' },
  { icon: RiCoupon2Line, activeIcon: RiCoupon2Fill, label: 'كوبوناتي', path: '/coupons' },
  { icon: RiUser3Line, activeIcon: RiUser3Fill, label: 'حسابي', path: '/profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

  if (isAuthPage) return null;

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
                {isActive ? <item.activeIcon size={24} /> : <item.icon size={24} />}
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
