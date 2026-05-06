import type { Metadata } from "next";
import "./globals.css";
import { Navbar, Footer } from "@/components/layout-parts";
import { NotificationProvider } from "@/components/notification-provider";
import BottomNav from "@/components/bottom-nav";

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
      <body className="antialiased">
        <NotificationProvider>
          <Navbar />
          <main className="min-h-screen pt-20 pb-32 md:pb-0">
            {children}
          </main>
          <Footer />
          <BottomNav />
        </NotificationProvider>
      </body>
    </html>
  );
}
