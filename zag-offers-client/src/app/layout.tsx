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
  description: "اكتشف أفضل الخصومات والكوبونات الحصرية في مدينة الزقازيق. وفر أكثر مع زقازيق أوفرز.",
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
        <meta name="theme-color" content="#FF6B00" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <link rel="icon" type="image/svg+xml" href="/icon-192.svg" />
      </head>
      <body className="antialiased">
        <ReactQueryProvider>
          <NotificationProvider>
            {/* ClientInit registers the service worker on the client side */}
            <ClientInit />
            <Navbar />
            <main className="min-h-screen pt-20 pb-32 md:pb-0">
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
