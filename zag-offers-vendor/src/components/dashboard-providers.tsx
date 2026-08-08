'use client';

import { ReactQueryProvider } from '@/lib/react-query-provider';
import { NotificationProvider } from '@/components/notification-provider';

export default function DashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </ReactQueryProvider>
  );
}
