'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { PerformanceMonitor } from '@/lib/performance-monitor';
import { useEffect } from 'react';

/**
 * مكون تتبع أداء الويب (Web Vitals Tracker)
 * يقوم بالتقاط مقاييس أداء المتصفح وإرسالها لنظام المراقبة.
 */
export function PerformanceTracker() {
  useReportWebVitals((metric) => {
    // التقاط مقاييس الويب الأساسية
    // LCP: Largest Contentful Paint
    // FID: First Input Delay
    // CLS: Cumulative Layout Shift
    // FCP: First Contentful Paint
    // TTFB: Time to First Byte
    
    PerformanceMonitor.log('WEB_VITAL', metric.name, metric.value, {
      id: metric.id,
      label: metric.label, // 'web-vital' or 'custom'
    });
  });

  useEffect(() => {
    // قياس وقت تحميل الصفحة بالكامل
    if (typeof window !== 'undefined' && window.performance) {
      const nav = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (nav) {
        PerformanceMonitor.log('PAGE_LOAD', 'complete_load', nav.loadEventEnd - nav.startTime, {
          domInteractive: nav.domInteractive,
          domContentLoaded: nav.domContentLoadedEventEnd
        });
      }
    }
  }, []);

  return null; // مكون صامت
}
