"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveImageUrl } from '@/lib/utils';
import type { Banner } from '@/lib/types';

/**
 * Auto-advances every 6s, pauses on hover / hidden tab / manual scroll.
 * Dot indicators via IntersectionObserver + mobile swipe hint.
 * Renders nothing when banners.length === 0.
 * For length === 1 the caller can render a single card directly if it prefers.
 */
export function BannersCarousel({ banners }: { banners: Banner[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const isHoveredRef = useRef(false);
  const isTabVisibleRef = useRef(true);

  const total = banners.length;
  const showDots = total >= 2;

  // Scroll the carousel HORIZONTALLY only. We used to call scrollIntoView,
  // but with block:'nearest' the browser also pulls the PAGE vertically to
  // bring the target into view — which yanked users back up to the banners
  // section every 6 s while they were reading offers below. Now we compute
  // the desired horizontal offset and set it directly on the scroller.
  const scrollToIndex = useCallback((idx: number) => {
    const scroller = scrollerRef.current;
    const target = cardRefs.current[idx];
    if (!scroller || !target) return;
    // Offset that centers the card within the scroller viewport.
    // In RTL, offsetLeft still measures from the left edge — Chrome/Firefox
    // handle negative scrollLeft correctly on RTL containers.
    const left = target.offsetLeft - (scroller.clientWidth - target.clientWidth) / 2;
    scroller.scrollTo({ left, behavior: 'smooth' });
  }, []);

  const advance = useCallback(() => {
    if (total < 2) return;
    const next = (activeIdx + 1) % total;
    scrollToIndex(next);
  }, [activeIdx, total, scrollToIndex]);

  const startInterval = useCallback(() => {
    if (intervalRef.current || total < 2) return;
    intervalRef.current = setInterval(() => {
      if (isHoveredRef.current || !isTabVisibleRef.current) return;
      advance();
    }, 6000);
  }, [advance, total]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    startInterval();
    return stopInterval;
  }, [startInterval, stopInterval]);

  useEffect(() => {
    const onVis = () => { isTabVisibleRef.current = document.visibilityState === 'visible'; };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || total < 2) return;
    const observer = new IntersectionObserver(
      (entries) => {
        let best: IntersectionObserverEntry | null = null;
        for (const e of entries) {
          if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
        }
        if (best && best.isIntersecting) {
          const idx = cardRefs.current.findIndex((el) => el === best!.target);
          if (idx >= 0) setActiveIdx(idx);
        }
      },
      { root: scroller, threshold: [0.5, 0.75, 1] }
    );
    cardRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [total]);

  const handleScroll = useCallback(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      stopInterval();
      startInterval();
    }, 180);
  }, [startInterval, stopInterval]);

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const goTo = (idx: number) => scrollToIndex(idx);

  if (total === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 mb-8">
      <div
        className="relative"
        onMouseEnter={() => { isHoveredRef.current = true; }}
        onMouseLeave={() => { isHoveredRef.current = false; }}
      >
        <div
          ref={scrollerRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="عروض مميزة"
          onScroll={handleScroll}
          onTouchStart={() => setShowHint(false)}
          className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory"
        >
          {banners.map((banner, i) => (
            <a
              key={banner.id}
              ref={(el) => { cardRefs.current[i] = el; }}
              href={banner.actionUrl || '#'}
              className="group relative flex-shrink-0 w-[85vw] sm:w-[500px] h-[150px] sm:h-[190px] rounded-3xl overflow-hidden border border-white/[0.06] bg-[#1B1B1B] transition-all duration-500 hover:border-[#FF6B00]/40 snap-center"
              aria-label={banner.title}
            >
              {banner.image ? (
                <Image
                  src={resolveImageUrl(banner.image) ?? '/placeholder-offer.jpg'}
                  alt={banner.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 640px) 85vw, 500px"
                  quality={85}
                />
              ) : (
                <div className="absolute inset-0 bg-[#36200F]" />
              )}
              <div className="absolute inset-0 bg-black/45" />
              {banner.tag && (
                <span className="absolute top-3 right-3 px-2.5 py-1 bg-[#FF6B00] text-white text-[10px] font-black rounded-full">
                  {banner.tag}
                </span>
              )}
              <div className="absolute bottom-4 right-4 left-4">
                <h3 className="text-white text-base sm:text-lg font-black leading-tight">{banner.title}</h3>
                {banner.subtitle && (
                  <p className="text-white/70 text-xs sm:text-sm font-semibold mt-1 line-clamp-1">{banner.subtitle}</p>
                )}
              </div>
            </a>
          ))}
        </div>

        <AnimatePresence>
          {showHint && total >= 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, x: [0, -6, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              className="sm:hidden pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white text-lg font-black"
              aria-hidden="true"
            >
              ‹
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showDots && (
        <div className="flex items-center justify-center gap-1.5 mt-3" role="tablist" aria-label="عروض مميزة">
          {banners.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-label={`عرض ${i + 1} من ${total}`}
              aria-current={activeIdx === i}
              onClick={() => goTo(i)}
              className={`transition-all duration-300 rounded-full ${
                activeIdx === i ? 'bg-[#FF6B00] w-4 h-1.5' : 'bg-white/20 w-1.5 h-1.5 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
