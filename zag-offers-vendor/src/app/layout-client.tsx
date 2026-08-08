'use client';

import SWProvider from '@/components/sw-provider';
import ErrorBoundary from '@/components/ErrorBoundary';
import { lazy, Suspense, useEffect, useState } from 'react';
import PWAInstallPrompt from '@/components/pwa-install-prompt';

const PerformanceTracker = lazy(() => import('@/components/PerformanceTracker').then((module) => ({ default: module.PerformanceTracker })));

function DeferredEnhancements() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const load = () => setReady(true);
    const idle = window.requestIdleCallback?.(load, { timeout: 3500 });
    const timer = idle === undefined ? window.setTimeout(load, 2500) : undefined;
    return () => {
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);
  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <PerformanceTracker />
    </Suspense>
  );
}

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SWProvider>{children}</SWProvider>
      <PWAInstallPrompt />
      <DeferredEnhancements />
    </ErrorBoundary>
  );
}
