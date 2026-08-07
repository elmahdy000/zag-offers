// Lightweight analytics helper.
//
// Setup:
//   To wire this up to Google Analytics 4, add the gtag script tags in
//   `src/app/layout.tsx` (e.g. via next/script with strategy="afterInteractive").
//   Something along the lines of:
//
//     <Script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXX" strategy="afterInteractive" />
//     <Script id="ga4-init" strategy="afterInteractive">{`
//       window.dataLayer = window.dataLayer || [];
//       function gtag(){dataLayer.push(arguments);}
//       gtag('js', new Date());
//       gtag('config', 'G-XXXXXX');
//     `}</Script>
//
//   This helper is intentionally a no-op when window.gtag is unavailable,
//   so it is safe to call in SSR, in tests, and before the GA snippet loads.

type Gtag = (...args: unknown[]) => void;

function getGtag(): Gtag | undefined {
  if (typeof window === 'undefined') return undefined;
  const g = (window as unknown as { gtag?: Gtag }).gtag;
  return typeof g === 'function' ? g : undefined;
}

/**
 * Fire a GA4 event. Silently no-ops if window/gtag is unavailable.
 */
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  const gtag = getGtag();
  if (!gtag) return;
  gtag('event', name, params ?? {});
}

/**
 * Fire a GA4 page_view. Silently no-ops if window/gtag is unavailable.
 */
export function trackPageview(path: string): void {
  const gtag = getGtag();
  if (!gtag) return;
  gtag('event', 'page_view', { page_path: path });
}
