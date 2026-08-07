import type { Metadata } from "next";
import "@fontsource-variable/cairo";
import "./globals.css";
import { Navbar, Footer } from "@/components/layout-parts";
import { NotificationProvider } from "@/components/notification-provider";
import BottomNav from "@/components/bottom-nav";
import { ReactQueryProvider } from "@/lib/react-query-provider";

export const metadata: Metadata = {
  metadataBase: new URL('https://zagoffers.online'),
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
  themeColor: "#071426",
};

import ClientInit from "@/components/client-init";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('zag-theme');if(!t)t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}})()` }} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://api.zagoffers.online" />
        <link rel="dns-prefetch" href="https://api.zagoffers.online" />
        <meta name="theme-color" content="#071426" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/brand/zag-app-icon.png" />
      </head>
      <body className="antialiased">
        <ClientInit />
        <ReactQueryProvider>
          <NotificationProvider>
            <Navbar />
            <main className="min-h-screen pt-[72px] pb-32 md:pb-0">
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
