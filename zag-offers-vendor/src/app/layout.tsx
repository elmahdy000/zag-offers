import type { Metadata, Viewport } from 'next';
import './globals.css';
import LayoutClient from './layout-client';

export const viewport: Viewport = {
  themeColor: '#ff7e1a',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'ZAG Offers - Vendor',
  description: 'لوحة تحكم تجار زاچ لإدارة العروض وتفعيل الكوبونات',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.svg',
    apple: '/icon-192.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Zag Vendor',
  },
  openGraph: {
    title: 'ZAG Offers - Vendor Dashboard',
    description: 'لوحة تحكم تجار زاچ لإدارة العروض وتفعيل الكوبونات',
    url: 'https://zagoffers.online/vendor',
    siteName: 'ZAG Offers',
    images: ['/icon-512.svg'],
    locale: 'ar_EG',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZAG Offers - Vendor Dashboard',
    description: 'لوحة تحكم تجار زاچ لإدارة العروض وتفعيل الكوبونات',
    images: ['/icon-512.svg'],
  },
  robots: 'noindex, nofollow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutClient>{children}</LayoutClient>;
}
