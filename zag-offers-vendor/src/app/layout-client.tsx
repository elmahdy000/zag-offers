'use client';

import { ReactQueryProvider } from '@/lib/react-query-provider';
import SWProvider from '@/components/sw-provider';
import { NotificationProvider } from '@/components/notification-provider';
import PWAInstallPrompt from '@/components/pwa-install-prompt';
import ErrorBoundary from '@/components/ErrorBoundary';
import { PerformanceTracker } from '@/components/PerformanceTracker';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-bg text-text font-bold">
        <ErrorBoundary>
          <PerformanceTracker />
          <ReactQueryProvider>
            <SWProvider>
              <NotificationProvider>
                {children}
                <PWAInstallPrompt />
              </NotificationProvider>
            </SWProvider>
          </ReactQueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
