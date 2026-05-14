import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar, Footer } from "@/components/layout-parts";
import { NotificationProvider } from "@/components/notification-provider";
import BottomNav from "@/components/bottom-nav";
import { ReactQueryProvider } from "@/lib/react-query-provider";
import { register } from "@/lib/register-sw";
import OnlineStatusBanner from "@/components/online-status-banner";

export const metadata: Metadata = {
  title: "Zag Offers | زقازيق أوفرز - أفضل عروض الزقازيق",
  description: "اكتشف أفضل الخصومات والكوبونات الحصرية في مدينة الزقازيق. وفر أكثر مع زقازيق أوفرز في المطاعم، الكافيهات، والخدمات.",
  keywords: ["زقازيق", "عروض الزقازيق", "خصومات الزقازيق", "كوبونات", "Zag Offers", "دليل الزقازيق", "توفير", "مطاعم الزقازيق"],
  openGraph: {
    title: "زقازيق أوفرز | أفضل عروض الزقازيق",
    description: "وفر أكثر مع أفضل الخصومات الحصرية في الزقازيق.",
    url: "https://zagoffers.online",
    siteName: "Zag Offers",
    locale: "ar_EG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "زقازيق أوفرز | أفضل عروض الزقازيق",
    description: "اكتشف ووفر في مدينة الزقازيق.",
  },
};

export const viewport = {
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
  // تسجيل Service Worker
  if (typeof window !== 'undefined') {
    register();
  }
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FF6B00" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased">
        <ReactQueryProvider>
          <NotificationProvider>
            <Navbar />
            <main className="min-h-screen pt-20 pb-32 md:pb-0">
              {children}
            </main>
            <Footer />
            <BottomNav />
          </NotificationProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
