import type { Metadata } from 'next';
import '@fontsource-variable/cairo';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://admin.zagoffers.online'),
  title: 'ZAG Offers - لوحة التحكم',
  description: 'نظام إدارة منصة ZAG Offers',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
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
        <link rel="icon" type="image/png" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
