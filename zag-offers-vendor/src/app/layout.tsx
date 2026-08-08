import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/cairo';
import './globals.css';
import LayoutClient from './layout-client';

export const viewport: Viewport = {
  themeColor: '#ff7e1a',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://vendor.zagoffers.online'),
  title: 'ZAG Offers - Vendor',
  description: 'لوحة تحكم تجار زاچ لإدارة العروض وتفعيل الكوبونات',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon-192x192.png',
    apple: '/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Zag Vendor',
  },
  openGraph: {
    title: 'ZAG Offers - Vendor Dashboard',
    description: 'لوحة تحكم تجار زاچ لإدارة العروض وتفعيل الكوبونات',
    url: 'https://vendor.zagoffers.online',
    siteName: 'ZAG Offers',
    images: ['/icon-512x512.png'],
    locale: 'ar_EG',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZAG Offers - Vendor Dashboard',
    description: 'لوحة تحكم تجار زاچ لإدارة العروض وتفعيل الكوبونات',
    images: ['/icon-512x512.png'],
  },
  robots: 'noindex, nofollow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('zag-vendor-theme');document.documentElement.dataset.theme=t==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}})();`,
          }}
        />
      </head>
      <body className="bg-bg text-text">
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
