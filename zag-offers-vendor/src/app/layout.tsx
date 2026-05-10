import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ReactQueryProvider } from '@/lib/react-query-provider';
import SWProvider from '@/components/sw-provider';

export const viewport: Viewport = {
  themeColor: '#ff7e1a',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'ZAG Offers - Vendor',
  description: 'لوحة تحكم تجار زاچ لإدارة العروض وتفعيل الكوبونات',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Zag Vendor',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FF6B00" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <link rel="icon" type="image/svg+xml" href="/icon-192.svg" />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <SWProvider>
          <ReactQueryProvider>
            {children}
          </ReactQueryProvider>
        </SWProvider>
      </body>
    </html>
  );
}
