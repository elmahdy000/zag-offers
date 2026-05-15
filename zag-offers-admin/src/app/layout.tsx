import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
});

export const metadata: Metadata = {
  title: 'ZAG Offers - لوحة التحكم',
  description: 'نظام إدارة منصة ZAG Offers',
  icons: {
    icon: '/icon-192.svg',
    apple: '/icon-192.svg',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`h-full antialiased ${cairo.variable}`}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/icon-192.svg" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
