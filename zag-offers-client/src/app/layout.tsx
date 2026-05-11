import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar, Footer } from "@/components/layout-parts";
import { NotificationProvider } from "@/components/notification-provider";
import BottomNav from "@/components/bottom-nav";
import PWAInstallPrompt from "@/components/pwa-install-prompt";
import { ReactQueryProvider } from "@/lib/react-query-provider";
import ClientInit from "@/components/client-init";
import OnlineStatusBanner from "@/components/online-status-banner";

export const metadata: Metadata = {
  title: "Zag Offers | أفضل عروض الزقازيق",
  description: "اكتشف أفضل الخصومات والكوبونات الحصرية في زاج. وفر أكثر مع زقازيق أوفرز.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Zag Offers",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192.png" },
      { url: "/icons/icon-192.png", sizes: "152x152" },
      { url: "/icons/icon-192.png", sizes: "180x180" },
      { url: "/icons/icon-192.png", sizes: "167x167" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1A1A1A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased bg-[#1A1A1A] text-[#F0F0F0] selection:bg-[#FF6B00]/30 overflow-x-hidden">
        <ReactQueryProvider>
          <NotificationProvider>
            <OnlineStatusBanner />
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
