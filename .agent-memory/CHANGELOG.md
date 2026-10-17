# Zag Offers — Verified Changelog

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
