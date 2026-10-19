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


