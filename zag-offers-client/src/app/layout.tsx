import type { Metadata } from "next";
import "./globals.css";
import { Navbar, Footer } from "@/components/layout-parts";
import { NotificationProvider } from "@/components/notification-provider";
import BottomNav from "@/components/bottom-nav";
import PWAInstallPrompt from "@/components/pwa-install-prompt";
import { ReactQueryProvider } from "@/lib/react-query-provider";
import ClientInit from "@/components/client-init";

export const metadata: Metadata = {
  title: "Zag Offers | أفضل عروض الزقازيق",
  description: "اكتشف أفضل الخصومات والكوبونات الحصرية في زاج. وفر أكثر مع زقازيق أوفرز.",
  icons: {
    icon: '/icon-192.svg',
    apple: '/icon-192.svg',
  },
  manifest: '/manifest.json',
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
        <meta name="theme-color" content="#1A1A1A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <link rel="icon" type="image/svg+xml" href="/icon-192.svg" />
      </head>
      <body className="antialiased bg-[#1A1A1A] text-[#F0F0F0] selection:bg-[#FF6B00]/30 overflow-x-hidden">
        <ReactQueryProvider>
          <NotificationProvider>
            <ClientInit />
            <Navbar />
            <main className="min-h-screen pt-16 sm:pt-20 pb-24 sm:pb-12 md:pb-0 overflow-x-hidden">
              {children}
            </main>
            <Footer />
            <BottomNav />
            <PWAInstallPrompt />
          </NotificationProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
