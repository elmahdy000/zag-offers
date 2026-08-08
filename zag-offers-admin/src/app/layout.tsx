import type { Metadata } from 'next';
import '@fontsource-variable/cairo';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://admin.zagoffers.online'),
  title: 'ZAG Offers - لوحة التحكم',
  description: 'نظام إدارة منصة ZAG Offers',
  icons: {
    icon: '/icon-192.svg',
    apple: '/icon-192.svg',
  },
  manifest: '/manifest.webmanifest',
  robots: 'noindex, nofollow',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className="h-full antialiased">
      <head>
        <link rel="icon" type="image/svg+xml" href="/icon-192.svg" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
