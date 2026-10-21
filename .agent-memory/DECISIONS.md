# Zag Offers — Architectural & Design Decisions

## 1. Coupon Lifecycle & Status Integrity
- **Decision**: Claiming, viewing, or scanning a coupon must NEVER mark it as `USED` on the client side.
- **Rationale**: Previously, an animated green rubber stamp "تم الاستخدام" appeared immediately upon claiming a coupon while instructions asked the user to show the QR to the cashier. This caused severe confusion for both customers and store cashiers.
- **Rule**:
  - `GENERATED`: Active, valid. Must display `جاهز للاستخدام ✨`.
  - `USED`: Exclusively set by backend when cashier redeems the coupon. Displays `تم الاستخدام ✓`.
  - `EXPIRED`: Time limit reached. Displays `منتهي الصلاحية`.

---

## 2. Monogram Fallback for Missing Brand Assets
- **Decision**: When merchant logos or offer hero images are missing, render an initial monogram avatar with a styled radial navy glow, rather than a generic placeholder or solid orange block.
- **Rationale**: Oversized solid orange rectangles create visual harshness and degrade user trust. Monograms maintain high visual polish while accurately representing the store's identity.

---

## 3. Strict LTR for Coupon Codes
- **Decision**: All coupon codes (e.g. `ZAG-789456`) must be rendered using `TextDirection.ltr` with `GoogleFonts.spaceMono`.
- **Rationale**: In RTL contexts, alphanumeric codes with hyphens can invert (e.g., displaying `789456-ZAG`), confusing users and cashiers during manual entry.

---

## 4. Root Navigation via Global Key
- **Decision**: Modals and pushed subpages must navigate across main tabs using `NavigationService.navigatorKey.currentContext` rather than `context.findAncestorStateOfType<MainScreenState>()`.
- **Rationale**: Pushed routes exist as sibling entries in the root `Navigator` overlay, not descendants of `MainScreen`. Popping a route deactivates its local context, so accessing `MainScreen.of(context)` after `Navigator.popUntil` fails. `NavigationService.navigatorKey` guarantees access to the root context.

---

## 5. Pricing Display & Savings Invariants
- **Decision**: Real backend prices (`newPrice`, `oldPrice`) are strictly honored through the centralized `OfferPricingResult.compute()` calculation engine.
- **Rule**:
  - `discountPercentage = ((originalPrice - finalPrice) / originalPrice) * 100`.
  - When `rawOld` and `rawNew` are provided, the badge, strikethrough, and savings pill are strictly tied to this mathematical formula.
  - Single prices are never struck through. Strikethrough is only applied when an actual lower price is actively displayed alongside it.
  - Store-wide offers without specific item prices suppress the product before/after price box, showing only the verified discount badge.

---

## 6. Non-Interactive Redeemed Status Banner
- **Decision**: When a coupon is in the `USED` state, the sticky bottom bar must render as an informative, clearly non-interactive container with a verified checkmark and redemption timestamp, rather than a disabled button.
- **Rationale**: Disabled buttons often look like interactive elements that are temporarily locked or malfunctioning, causing users to tap repeatedly trying to re-redeem. An informational status card makes it unambiguous that the coupon has already been successfully redeemed at the store.

---

## 7. RTL Numeric and Counter Isolation
- **Decision**: All numeric percentages `(X%)` and fractional counters `current / total` in Arabic layouts must be rendered with explicit `textDirection: TextDirection.ltr`.
- **Rationale**: The Unicode bidirectional algorithm automatically flips surrounding ASCII punctuation in RTL text, causing `(20%)` to appear as `%20)` or `1 / 3` to appear as `3 / 1`. Enforcing LTR prevents any unintended glyph inversion.

---

## 8. Centralized Pricing Authority Across Components
- **Decision**: `OfferPricingResult` in `offer_pricing_utils.dart` is the sole calculation authority for `OfferCard`, `OfferDetailPage`, and `MyCouponsPage`.
- **Rationale**: Eliminates divergent price derivations between summary feeds and detail views, guaranteeing mathematically verified badges, strikethroughs, and savings amounts across the entire ecosystem.

---

## 9. Scarcity & Sold-Out Card Semantics
- **Decision**: When `remaining <= 0`, cards render a disabled `نفد الكوبون` action container and `نفدت الكمية` live stat tag rather than "احصل عليه" or "باقي 0".
- **Rationale**: Prevents false customer expectations and cashier disputes by immediately communicating exhausted coupon allocation.

---

## 10. Egyptian WhatsApp Number Normalization
- **Decision**: All merchant and referral WhatsApp URLs must sanitize phone strings via `_cleanWhatsAppNumber()`, guaranteeing the `+20` country code prefix (`201xxxxxxxxx`) before invoking `https://wa.me/`.
- **Rationale**: Numbers formatted locally starting with `01` fail on WhatsApp web/app redirect when launched without Egypt's country code prefix.

---

## 11. Customer-Facing Network Messaging Policy
- **Decision**: End-user network error mappers must never expose backend development terminology (such as "الباك إند", "عنوان IP", "نفس الشبكة").
- **Rationale**: Technical developer jargon looks amateurish and confuses non-technical users in production mobile environments. Use polite, action-oriented Arabic: "تعذر الاتصال بالخادم حاليًا. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجددًا."

---

## 12. Directional Layouts for Arabic RTL Invariance
- **Decision**: Positioned elements and layout margins must always use `PositionedDirectional` (with `start` / `end`) and `EdgeInsetsDirectional` rather than hardcoded `left` or `right`.
- **Rationale**: In RTL layouts, `left` places elements on the trailing edge rather than the leading edge, leading to reversed avatars and misaligned carousels.

---

## 13. Production-Grade UI/UX Philosophy: Refine, Don't Redesign
- **Decision**: The engineering principle across all Zag Offers apps is **"Premium Quality Without Overdesign"** (*Refine, Don't Redesign*).
- **Core Directives**:
  1. **No Overdesign**: Do not invent new pages, replace established layouts, or add exaggerated animations, heavy glassmorphism, or artificial 3D effects.
  2. **Preserve Identity**: Preserve the Egyptian Orange (`#FF6A00` / `#FF5722`) and Midnight Navy (`#0D1422` / `#161C2A`) tokens, existing typography, and Arabic RTL mental model.
  3. **3-Phase Execution Hierarchy**:
     - **Phase 1 (Stability - P0)**: Safe Areas, notch & keyboard insets, sticky CTA protection (preventing overlap on content), real retry mechanisms, verified coupon states, and 0 layout overflows.
     - **Phase 2 (Visual Polish - P1)**: Tightening card aspect ratios, eliminating excessive glow/shadow in light mode, unifying border radii and spacing tokens, and ensuring complete Light/Dark mode parity.
     - **Phase 3 (Performance & QA - P2)**: Image caching, list virtualization, responsive testing on iOS & Android screen sizes, and avoiding unnecessary re-renders.
  4. **Component-First Fixes**: Address issues locally or within shared design components (`OfferCard`, `CategoryUtils`, `GlassmorphismCard`) rather than rebuilding entire views.

---

## 14. Zero-Gradient Flat Brand System for Explore Offers & Offer Cards
- **Decision**: In `SearchPage` and `OfferCard`, strictly eliminate all linear/radial gradients (backgrounds, buttons, badges, placeholders, and image overlays) in favor of solid curated tokens: Primary Orange (`#FF5A0A`), Dark Navy (`#142033`), Clean Card White (`#FFFFFF`), Subtle Hairline (`#F1F5F9`), and Flat Light Gray Placeholder (`#F1F5F9` light / `#1E293B` dark).
- **Rationale**: Gradients caused inconsistent visual noise, tacky orange-to-pink clashes, and stretched appearance. Solid flat colors give the app a modern, premium, distinctive identity and eliminate render artifacts.
- **Rules**:
  - Right-side category sidebar width is fixed to 82 logical pixels with circular 40px avatars.
  - Phone cards use content-driven vertical sizing without forced empty vertical voids.
  - Missing image states use a store monogram initial in solid orange over soft cream rather than shimmer gradients.

---

## 15. Arabic Search Normalization & Non-Destructive Multi-Filter Engine
- **Decision**: All offer search and filter queries must pass through `OfferFilterUtils.normalizeArabic()` and execute against a unified offer pool (`_getAllSourceOffers`) with immediate 0ms local client-side feedback.
- **Rationale**: Arabic orthography has many glyph variations (Alefs, Taa Marbuta, Yaa/Alef Maksura, Hamzas, Tashkeel, Eastern numerals `٠-٩`). Relying on raw string equality or waiting for remote API roundtrips caused empty screens and broken filters while typing.
- **Rules**:
  1. **Instant Client-Side Response**: Keystrokes in `SearchPage` immediately trigger `setState` to filter loaded offers with 0ms latency, while debouncing (350ms) remote search calls in the background.
  2. **Non-Destructive Offer Sourcing**: Never reset or discard loaded offers (`allOffers`, `trendingOffers`, `recommendedOffers`) when search starts; always merge remote results without duplicates.
  3. **Multi-Filter Concurrency**: Category sidebar selection, area filter, minimum discount, sorting, and Arabic search query must be applied concurrently through `OfferFilterUtils.apply`.
  4. **Persistent Sidebar**: The category sidebar must remain visible and interactive during search.
  5. **Arabic Definite Article Tolerance**: Search matching must be agnostic to leading "ال" and common Egyptian alternate spellings (`ه` vs `ا`).

---

## 16. Horizontal Category Scroll Bar Over Vertical Sidebar on Mobile & Card Deduplication
- **Decision**: In `SearchPage`, replace the 82px vertical category sidebar with a horizontal scrolling category pill bar directly beneath the search header, and eliminate card text redundancies in `OfferCard`.
- **Rationale**:
  1. On mobile screens (360-400px width), an 82px vertical sidebar steals >22% of the screen width, severely squeezing offer cards into an unnaturally narrow column, degrading readability, and causing vertical card bloating.
  2. Horizontal scrolling category pills (`_buildHorizontalCategoriesBar`) free 100% of the screen width for offers, conforming to standard mobile e-commerce UX (Talabat, Noon, Amazon).
  3. In `OfferCard`, the store name was previously duplicated both inside the fallback image placeholder and in the store info line below it. Eliminating the duplicate text and rendering a clean monogram avatar resolves visual clutter.
  4. Bare discount titles (e.g. `40% خصم` repeating `خصم 40%` top badge) are smartly sanitized to descriptive titles (`40% خصم على جميع الخدمات والطلبات`).

---

## 17. Elimination of RTL Arrow Double-Inversion Bug Across Mobile Apps
- **Decision**: Never use manual `Directionality.of(context) == TextDirection.rtl ? Icons.arrow_forward... : Icons.arrow_back...` ternaries for directional arrow icons. Always declare the semantic icon directly (`Icons.arrow_back_ios_new_rounded` for back actions, `Icons.arrow_forward_ios_rounded` for disclosures/next actions).
- **Rationale**:
  1. In Flutter SDK (`material/icons.dart`), `Icons.arrow_back_ios_new_rounded`, `Icons.arrow_back_rounded`, `Icons.arrow_forward_ios_rounded`, and `Icons.arrow_forward_rounded` are declared with `matchTextDirection: true`.
  2. In an RTL tree (`TextDirection.rtl`), Flutter's rendering pipeline automatically applies a horizontal flip (`Matrix4.identity()..scale(-1.0, 1.0, 1.0)`).
  3. When developers wrote a manual ternary selecting `arrow_forward` for RTL, Flutter flipped it back to point LEFT (`<`), causing Back buttons in RTL to point into the screen instead of backwards/outwards (`>`).
  4. Similarly, disclosure chevrons manually selecting `arrow_back` in RTL flipped to point RIGHT (`>`), pointing away from child screens instead of leftward (`<`).
- **Rule**:
  - For **Back / Pop** navigation: Always use `Icons.arrow_back_ios_new_rounded` or `Icons.arrow_back_rounded`. (Automatically points `>` in RTL and `<` in LTR).
  - For **Next / Forward / Disclosure** chevrons: Always use `Icons.arrow_forward_ios_rounded` or `Icons.arrow_forward_rounded`. (Automatically points `<` in RTL and `>` in LTR).

---

## 18. Coupon Voucher Ads Banner & Universal Theme-Aware Shimmer System
- **Decision**:
  1. Redesign home feed ad banners (`AdsSlider`) as realistic promotional coupon voucher tickets featuring semicircular top/bottom cutout notches, vertical dashed perforation divider, scissors indicator, coupon stub, barcode lines, and intelligent multi-criterion navigation to matching Offer or Store pages.
  2. Implement an adaptive, theme-aware universal shimmer architecture (`AppShimmer`, `OfferDetailShimmer`, `StoreDetailShimmer`, `OffersSkeleton`, `OfferCardSkeleton`, `CouponTicketSkeleton`) replacing all bare `CircularProgressIndicator` spinners across waiting states and screen transitions.
  3. Guarantee unique Hero animation tags across multiple home feed horizontal sections by hashing section titles into the tag namespace.
- **Rationale**:
  1. Generic carousel image banners felt detached from the app's core coupon identity. Designing them as authentic perforated coupon vouchers establishes immediate brand recognition and encourages engagement.
  2. Production banners frequently have `actionUrl: null`. An intelligent matcher resolves tags, titles, and categories against loaded offers/stores, eliminating dead taps.
  3. In Dark Mode First design, standard white/light grey shimmer flashes like a glaring strobe light. `AppShimmer` uses dark slate `#1E293B` to `#334155` for dark mode and `#E2E8F0` to `#F8FAFC` for light mode, creating a seamless, premium loading experience.
  4. Bare circular progress indicators break spatial immersion. Skeletons that match the exact page anatomy prevent layout shifts upon data load.

---

## 19. Vendor App Auth State Flow & Universal Error Translation
- **Decision**:
  1. In `zag_offers_vendor_app`, `AuthWrapper` displays `SplashScreen` exclusively on `AuthInitial` (cold startup). During `AuthLoading`, `LoginPage` remains mounted and handles the submit button progress indicator locally.
  2. All BLoCs in the vendor app (`QRScannerBloc`, `ReviewsBloc`, `ProfileBloc`, `OffersBloc`, `DashboardBloc`) must route network errors through `ErrorHandler.handle(e)` rather than `e.toString()`.
  3. Manual coupon code entry in `QRScannerPage` strictly enforces `GoogleFonts.spaceMono`, uppercase capitalization, and `TextDirection.ltr`.
- **Rationale**:
  1. Unmounting `LoginPage` during `AuthLoading` trapped users in an infinite splash screen if login failed or timed out. Keeping the form mounted preserves user inputs and displays error SnackBars reliably.
  2. Raw `DioException.toString()` dumps confusing English debug strings and internal request URLs onto merchant screens. `ErrorHandler.handle()` cleanly extracts backend Arabic validation messages (e.g., `عفواً، الكود ده مش صحيح`).
  3. Monospace font and LTR directionality prevent alphanumeric coupon code inversion in Arabic RTL layouts.

