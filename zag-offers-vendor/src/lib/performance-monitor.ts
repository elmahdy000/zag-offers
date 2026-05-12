/**
 * نظام مراقبة الأداء (Performance Monitoring System)
 * يقوم بتتبع سرعة استجابة الـ API ومقاييس تجربة المستخدم (Web Vitals).
 */

type MetricType = 'API_LATENCY' | 'WEB_VITAL' | 'PAGE_LOAD';

interface PerformanceMetric {
  type: MetricType;
  name: string;
  value: number;
  metadata?: any;
  timestamp: number;
}

const METRICS_STORAGE_KEY = 'zag_performance_metrics';
const SLOW_REQUEST_THRESHOLD = 1000; // 1 ثانية

import { secureStorage } from './crypto';

export const PerformanceMonitor = {
  /** تسجيل مقياس جديد */
  log(type: MetricType, name: string, value: number, metadata?: any) {
    const metric: PerformanceMetric = {
      type,
      name,
      value,
      metadata,
      timestamp: Date.now(),
    };

    // طباعة في الكونسول للتطوير
    if (process.env.NODE_ENV === 'development') {
      const color = value > SLOW_REQUEST_THRESHOLD ? 'color: #ff4d4d' : 'color: #00ff88';
      console.log(`%c[Performance] ${type} | ${name}: ${value.toFixed(2)}ms`, color, metadata || '');
    }

    // حفظ في التخزين الآمن للمراجعة لاحقاً أو الإرسال للباك-إند
    this.saveMetric(metric);

    // إذا كان الطلب بطيئاً جداً، يمكن إرسال تنبيه فوري للباك-إند هنا
    if (type === 'API_LATENCY' && value > 3000) {
      this.reportCriticalLatency(metric);
    }
  },

  /** حفظ المقياس محلياً */
  saveMetric(metric: PerformanceMetric) {
    try {
      const existing = secureStorage.get<PerformanceMetric[]>(METRICS_STORAGE_KEY) || [];
      // نحتفظ بآخر 50 مقياس فقط لتجنب امتلاء الذاكرة
      const updated = [metric, ...existing].slice(0, 50);
      secureStorage.set(METRICS_STORAGE_KEY, updated);
    } catch (e) {
      console.error('Failed to save performance metric', e);
    }
  },

  /** جلب التقارير المخزنة */
  getMetrics(): PerformanceMetric[] {
    return secureStorage.get<PerformanceMetric[]>(METRICS_STORAGE_KEY) || [];
  },

  /** إرسال تقرير عن تأخير حرج */
  async reportCriticalLatency(metric: PerformanceMetric) {
    // يمكن هنا استدعاء API خاص بالـ Logging في الباك-إند
    console.warn(`[Performance] CRITICAL LATENCY DETECTED: ${metric.name}`, metric);
  }
};
