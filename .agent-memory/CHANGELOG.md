# Zag Offers — Verified Changelog

## [2026-10-17] - Offer Details & Coupon QR Modal Redesign
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
