# Zag Offers — Verified Changelog

## [2026-10-18] - Core Services Hardening, Store Details & Invite Friends Modernization
### Fixed
- Fixed Arabic RTL header alignment in `StoreDetailPage`: Replaced `Positioned(left: 24)` with `PositionedDirectional(start: 24)` ensuring the store avatar aligns correctly with RTL layout.
- Fixed WhatsApp link failure on local Egyptian numbers in `StoreDetailPage`: Added `_cleanWhatsAppNumber()` normalizing `01xxxxxxxxx` to E.164 without plus (`201xxxxxxxxx`).
- Fixed gesture recognizer collision in `StoreDetailPage`: Replaced double-nested `OutlinedButton` inside `BouncyTap` with a sleek, high-converting filled gradient CTA container.
- Fixed developer debug jargon leakage in `dio_error_mapper.dart`: Replaced internal mentions of "الباك إند" and "عنوان IP" with polite, professional customer-facing Arabic messages.
- Fixed session leakage on authentication invalidation in `ApiClient`: Purged all cached credentials (`auth_token`, `user_id`, `user_name`, `user_role`, `avatar_url`, `user_points`, `user_tier`, `referral_code`) on 401 response.

### Changed
- Modernized `InviteFriendsPage`:
  - Upgraded styling to Midnight Navy card tokens (`#162032` card, `#1E293B` actions) with Egyptian Orange accents and soft glows.
  - Formatted referral code with strict `TextDirection.ltr` and `GoogleFonts.spaceMono` with one-tap copy and haptic feedback.
  - Added dedicated 1-tap WhatsApp sharing button with fallback to system share sheet.
  - Created 3-step visual onboarding cards explaining the 100-point reward journey clearly.
- Upgraded `StoreDetailPage`:
  - Added monogram initial fallback with radial gradient glow when store logo is absent.
  - Added real-time distance badge (`يبعد X كم` / `يبعد X متر`) to the location card using `LocationService.getFormattedDistanceTo`.
- Enhanced `LocationService`:
  - Added `distanceBetween(targetLat, targetLng)`, `formatDistance(meters)` (with Arabic formatting for meters/kilometers), and `getFormattedDistanceTo(targetLat, targetLng)`.

### Verified
- Zero issues on `flutter analyze lib/`.
- 13/13 tests passed on `flutter test`.

---

## [2026-10-18] - Centralized Pricing Engine & Offer Card Usability Modernization
### Fixed
- Fixed pricing and discount divergence: Extracted `OfferPricingResult` into `offer_pricing_utils.dart` as shared authority across `OfferCard`, `OfferDetailPage`, and `MyCouponsPage`.
- Fixed RTL horizontal carousel padding bug in `HomePage`: Replaced `EdgeInsets.only(right: 14)` with `EdgeInsetsDirectional.only(end: 14)`, eliminating asymmetrical margin spacing.
- Fixed negative savings and invalid strikethrough in `MyCouponsPage`: Replaced ad-hoc `oldPrice - newPrice` with verified `pricing.hasSavings` and `pricing.savingsAmount`.
- Fixed RTL percentage inversion in `OfferCard`: Enforced `TextDirection.ltr` on discount badge and store-wide invoice discount tokens.

### Changed
- Modernized `OfferCard`:
  - Added exhausted coupon handling: Renders disabled `نفد الكوبون` container and `نفدت الكمية` live stat when `remaining <= 0`.
  - Upgraded store-wide offer display without specific item prices to clearly show `خصم عام` and `X% على الفاتورة`.
  - Replaced `0 مهتم` with attractive `جديد ✨` spark badge; formatted interest numbers above 1,000 as `1.2k`.
  - Dynamic ticket notch background matching `Theme.of(context).scaffoldBackgroundColor`.
- Created comprehensive unit test suite in `test/offer_pricing_utils_test.dart` validating all 5 pricing variants.

### Verified
- Zero issues on `flutter analyze lib/`.
- 13/13 tests passed on `flutter test`.

---

## [2026-10-17] - Final Offer Details UI/UX Refinement
### Fixed
- Fixed pricing calculation inconsistency: Implemented authoritative `OfferPricingResult.compute()` engine using `((originalPrice - finalPrice) / originalPrice) * 100`. Eliminates discrepancy where 200 EGP original and 160/180 EGP final showed conflicting percentages.
- Fixed RTL parentheses inversion: Bound savings percentage and gallery fraction counters to explicit `TextDirection.ltr`.
- Fixed hero gesture blocking: Wrapped gradient overlay and indicator row in `IgnorePointer` to restore full-screen tap recognition.
- Fixed used-coupon ambiguity: Replaced disabled button with an informative non-interactive emerald status container with verification checkmark and redemption date.

### Changed
- Added full-screen image gallery with multi-image swipeable `PageView`, pinch-to-zoom (`InteractiveViewer`), and `1 / N` page counter.
- Enriched offer description with merchant feature chips (category, limits, flash sale, branch area) and improved default text.
- Replaced OutlinedButton with a solid Egyptian Orange `ElevatedButton.icon` for "طريق الوصول" in the location card.
- Modernized customer reviews with compact layout, formatted dates (`d MMMM yyyy`), and an inline empty state card.
- Tightened vertical rhythm throughout the page (12-16px) and calibrated bottom padding to avoid CTA overlap.

### Verified
- Zero issues on `flutter analyze lib/`.
- Full swipe, zoom, pricing, location CTA, and redeemed state verified on physical Android emulator (`emulator-5554`).

---
### Fixed
- Fixed coupon lifecycle status contradiction: Removed the green rubber stamp "تم الاستخدام" that previously appeared immediately upon claiming a coupon.
- Fixed `intl` name clash shadowing Flutter's `TextDirection`.
- Fixed tab switching bug when navigating to Coupon Wallet from QR modal via `NavigationService.navigatorKey`.
- Corrected orphaned strikethrough price when `newPrice` is null in backend response.

### Changed
- Replaced flat orange hero banner with adaptive 280px image carousel or 210px midnight navy monogram fallback.
- Added clean status badge (`جاهز للاستخدام ✨` for active coupons, `تم الاستخدام ✓` for redeemed).
- Upgraded QR modal with 155×155 high-contrast scannable QR card, generous quiet zone, and monospaced LTR code container.
- Updated sticky CTA on Offer Details to dynamically reflect coupon state (`احصل على الكوبون`, `عرض الكوبون`, `تم استخدام الكوبون ✓`, or `انتهت صلاحية العرض`).
- Modernized merchant card and simplified location card (single address, copy button, primary navigation CTA).

### Verified
- Zero issues on `flutter analyze lib/`.
- End-to-end verified on physical Android emulator (`emulator-5554`).
- Committed as `8cf7fe3` on branch `main` and pushed to `origin/main`.

---

## [2026-10-17] - Coupon Wallet Redesign (`MyCouponsPage`)
### Added
- Segmented tabs for Active (`نشطة`), Used (`مستخدمة`), and All (`الكل`) coupons.
- Perforated coupon card visuals with merchant monograms and instant copy action.
- Real-time expiry countdowns.

### Verified
- Tested and verified on live Android emulator across dark mode and RTL orientation.
