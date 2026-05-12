'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const PULL_THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // Apply resistance
      const distance = Math.pow(diff, 0.8);
      setPullDistance(distance);
      
      if (distance > 10) {
        if (e.cancelable) e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance > PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-full"
    >
      <motion.div 
        style={{ height: pullDistance }}
        className="overflow-hidden flex items-center justify-center bg-transparent pointer-events-none"
      >
        <div className="flex flex-col items-center gap-2">
          <motion.div
            animate={isRefreshing ? { rotate: 360 } : { rotate: pullDistance * 2 }}
            transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : { duration: 0 }}
            className={`p-2 rounded-full bg-primary/20 text-primary border border-primary/20`}
          >
            <RefreshCw size={20} />
          </motion.div>
          {pullDistance > 20 && (
             <span className="text-[10px] font-black text-primary uppercase tracking-widest">
               {pullDistance > PULL_THRESHOLD ? 'اترك للتحديث' : 'اسحب للتحديث'}
             </span>
          )}
        </div>
      </motion.div>

      <motion.div
        animate={{ y: isRefreshing ? 0 : 0 }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
