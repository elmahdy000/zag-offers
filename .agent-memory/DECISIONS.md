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

