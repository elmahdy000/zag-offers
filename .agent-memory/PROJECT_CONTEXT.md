# Zag Offers — Project Context

## 1. Platform Purpose & Overview
Zag Offers (منصة عروض وخصومات الزقازيق) is a localized city-scale discounts and offers ecosystem operating in Zagazig, Egypt.
It connects local merchants (restaurants, cafes, fashion, electronics, clinics, services) with customers through real-time flash sales, exclusive discounts, verified coupon redemption, and push notifications.

---

## 2. Repository Structure & Technologies
The repository `elmahdy000/zag-offers` is a monorepo containing:

### A. Mobile Applications (Flutter 3.x / Dart)
1. `zag_offers_app`: Customer-facing mobile application.
   - **Architecture**: Clean Architecture (Domain, Data, Presentation) + BLoC State Management.
   - **Dependency Injection**: `get_it` (`injection_container.dart`).
   - **Networking**: `http`, `web_socket_channel` / `socket_io_client`.
   - **Key Features**: Live home feed, location-based offers, flash sales countdowns, favorites, coupon wallet, QR generator/scanner dialog, reviews & ratings.
2. `zag_offers_vendor_app`: Merchant POS and offer management app.
3. `zag_offers_admin_app`: System administrator monitoring and moderation app.

### B. Backend Services (`zag_offers_backend`)
- **Runtime**: Node.js / Express / TypeScript.
- **ORM / Database**: Prisma ORM with PostgreSQL.
- **Authentication**: JWT authentication with role-based access (`CUSTOMER`, `STORE_OWNER`, `ADMIN`).
- **Real-Time**: Socket.io for live view counts, real-time flash sales, social proof toasts, and notifications.

### C. Web Applications (Next.js 14+)
1. `zag-offers-client`: Customer web portal.
2. `zag-offers-vendor`: Merchant portal for dashboard metrics and campaign creation.
3. `zag-offers-admin`: Superadmin dashboard.

---

## 3. Design System & Brand Invariants
- **Primary Accent**: Egyptian Orange (`#FF5722` / gradient `[Color(0xFFFF5722), Color(0xFFFF7043)]`).
- **Base Background**: Deep Midnight Navy (`#0F172A` / `#131B2A`).
- **Cards & Surfaces**: Dark slate surfaces (`#162032` / `#1E293B`) with subtle border highlights (`rgba(255,255,255,0.06)`).
- **Typography**:
  - Arabic: Modern sans-serif Arabic typography matching system defaults.
  - Coupon Codes: Monospaced strictly LTR (`GoogleFonts.spaceMono`).
- **RTL Standards**: Full Right-to-Left orientation throughout the user interface. Back buttons must point rightwards in RTL (`Icons.arrow_forward_ios_rounded`).

---

## 4. Business Rules & Data Model Invariants
- **Coupons**:
  - Generated coupons are identified by human-readable unique codes (e.g., `ZAG-789456`).
  - Statuses:
    - `GENERATED`: Active, valid, awaiting redemption at store. Must show `جاهز للاستخدام ✨`.
    - `USED`: Redeemed by cashier. Must show `تم الاستخدام ✓`.
    - `EXPIRED`: Time expired. Must show `منتهي الصلاحية`.
  - Claiming or viewing an active coupon must NEVER change its status to `USED`.
- **Pricing & Discounts**:
  - Only real backend prices (`newPrice`, `oldPrice`).
  - Savings displayed as `وفرت X ج.م (Y%)`.
  - Strikethrough is only applied to original prices when an actual discounted price is present.
