# Zag Offers — Verified Changelog

## [2026-10-22] - Vendor Flutter App Audit, Kotlin 2.3.21 Migration & Live Emulator Verification
### Fixed / Changed
- **Kotlin Gradle & JVM Target Migration (`zag_offers_vendor_app`)**:
  - Upgraded `org.jetbrains.kotlin.android` from `2.1.0` to `2.3.21` in `android/settings.gradle.kts` to satisfy modern Flutter Gradle plugin requirements.
  - Replaced deprecated `kotlinOptions { jvmTarget = ... }` with modern `kotlin { compilerOptions { jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17) } }` in `android/app/build.gradle.kts`.
  - Added Flutter build flags in `android/gradle.properties` (`android.builtInKotlin=false`, `android.newDsl=false`).
  - Successfully built debug APK (`build/app/outputs/flutter-apk/app-debug.apk`) in 116.0s.
- **Live Emulator Deployment & Functional Audit**:
  - Successfully installed package `com.zag.offers.vendor.zag_offers_vendor_app` onto live Android emulator (`emulator-5554`).
  - Verified live startup, notification permission prompt, and full brand-compliant dark login page ("بوابة التجار").
  - Verified form validation on email/phone and password fields.
- **Test Suite & Analyzer Verification**:
  - `flutter analyze lib/` ➜ 0 issues found across all vendor packages.
  - `flutter test` ➜ 6/6 unit tests passed (auth role enforcement, session restoration, account deletion, and constants).

## [2026-10-21] - Coupon Voucher Ads Banner & Universal Theme-Aware Shimmer System
### Added / Changed
- **Coupon Voucher Ads Banner (`AdsSlider`)**:
  - Redesigned home feed ad banners into authentic perforated coupon vouchers featuring semicircular top/bottom cutout notches, vertical dashed perforation divider, scissors indicator ("قص هنا"), coupon ticket badge stub, and barcode lines.
  - Implemented multi-criterion intelligent navigation supporting `offer:<id>`, `store:<id>`, `vendor:<id>`, `category:<name>`, web URLs, and intelligent category/title/tag fallback matching for remote banners with `actionUrl: null`.
  - Directional CTA button pointing inwards (`<`) in Arabic RTL.
- **Universal Theme-Aware Shimmer System (`AppShimmer`)**:
  - Upgraded `lib/core/widgets/skeleton_loader.dart` with adaptive `AppShimmer` selecting dark slate (`#1E293B` to `#334155`) in Dark Mode and `#E2E8F0` to `#F8FAFC` in Light Mode, eliminating blinding glare in dark mode.
  - Added specialized skeleton components: `OfferCardSkeleton`, `CouponTicketSkeleton`, `OfferDetailShimmer`, and `StoreDetailShimmer`.
  - Upgraded `OffersSkeleton` to replicate the full home feed structure (header, live stats, search bar, coupon banner, category avatars, and horizontal cards).
  - Replaced raw `CircularProgressIndicator` spinners across the app with dedicated shimmer skeletons:
    - `OfferLoadingPage` ➔ `OfferDetailShimmer`
    - `StoreLoadingPage` ➔ `StoreDetailShimmer`
    - `FavoritesPage` ➔ Responsive `OfferCardSkeleton` grid (`_buildFavoritesSkeleton`)
    - `CategoriesPage` ➔ Categories grid shimmer (`_buildCategoriesSkeleton`)
    - `SearchPage` ➔ Filter pills & offer cards shimmer (`_buildSearchSkeleton`)
    - `AllOffersPage` ➔ Responsive `OfferCardSkeleton` grid (`_buildOffersGridSkeleton`)
    - `ZagRewardsPage` ➔ Rewards card & history shimmer (`_buildRewardsSkeleton`)
    - `StoreDetailPage` ➔ Shimmer skeletons for offers and customer reviews
    - `OfferDetailPage` ➔ Shimmer placeholder for customer reviews
    - `MyCouponsPage` ➔ Realistic `CouponTicketSkeleton` list
- **Fixed Subtree Hero Tag Collision**:
  - Resolved `There are multiple heroes that share the same tag within a subtree` in `home_page.dart` by hashing the section title into the card Hero tag namespace (`'home_${title.hashCode}_${offer.id}_$index'`).
### Verified
- `flutter analyze lib/` ➜ 0 issues found.
- `flutter test` ➜ 27/27 unit tests passed.
- Verified live on Android emulator (`emulator-5554`) and iOS simulator (`iPhone 17 Pro Max`).

## [2026-10-20] - Elimination of RTL Arrow Double-Inversion Bug Across All Components
### Fixed / Changed
- **Systemic RTL Arrow Double-Inversion Resolution (18 files)**:
  - Eliminated the double inversion bug caused by manually writing `Directionality.of(context) == TextDirection.rtl ? Icons.arrow_forward... : Icons.arrow_back...` on directional arrow icons that already declare `matchTextDirection: true` in the Flutter SDK.
  - Replaced manual ternaries with direct semantic icon usage across 18 files:
    - Back navigation buttons (`Icons.arrow_back_ios_new_rounded` / `Icons.arrow_back_rounded`): now point outwards (`>`) in Arabic RTL and (`<`) in LTR across all AppBars (`SearchPage`, `NotificationsPage`, `FavoritesPage`, `OfferDetailPage`, `StoreDetailPage`, `CategoriesPage`, `AllOffersPage`, `MapPage`, `MyCouponsPage`, `ZagRewardsPage`, `InviteFriendsPage`, `LoginPage`, `RegisterPage`, `ForgotPasswordPage`).
    - Forward/Disclosure chevrons (`Icons.arrow_forward_ios_rounded` / `Icons.arrow_forward_rounded`): now point inwards (`<`) in Arabic RTL and (`>`) in LTR across cards and list items (`OfferCard` CTA, `OfferDetailPage` store row, `StoreDetailPage` offers list, `ProfilePage` settings & secondary menus, `CategoriesPage` category card, `HomePage` "عرض الكل", `OnboardingPage` "التالي").
### Verified
- `flutter analyze lib/` ➜ 0 issues.
- `flutter test` ➜ 27/27 tests passed.
- Visually verified via screenshots on Android emulator (`emulator-5554`) and iOS simulator (`iPhone 17 Pro Max`).

## [2026-10-20] - Search Screen Full-Width Redesign & Card Content Deduplication
### Added / Changed
- **Replaced 82px Vertical Sidebar with Horizontal Category Bar (`SearchPage`)**:
  - Replaced the clunky vertical category sidebar (which occupied >22% of screen width) with a sleek, horizontal scrolling category pills bar (`_buildHorizontalCategoriesBar`).
  - Active category pill rendered in solid Egyptian Orange with soft shadow; inactive pills rendered with clean hairline border and category icons/thumbnails.
  - Reclaimed 100% full screen width for offer cards, eliminating vertical card squeezing and bloated heights.
- **Card Content Deduplication & Smart Title Enrichment (`OfferCard`)**:
  - Removed duplicate merchant name text from inside the image placeholder monogram avatar, keeping the clean monogram circle and displaying the merchant name once in the info section.
  - Added smart title sanitizer (`_getDisplayTitle`) that enriches bare discount titles (e.g., `40% خصم` repeating `خصم 40%`) into informative, professional titles (`40% خصم على جميع الخدمات والطلبات`).
- **Layout & Spacing Polish**:
  - Standardized horizontal margins to 16px across search header, active filters, and offer feed.
  - Verified instant 0ms category filtering, active filter chip tags, and one-tap filter reset.
### Verified
- 27/27 unit tests passing in `flutter test`.
- 0 analyzer issues in `flutter analyze lib/`.
- Verified live on Android emulator (`emulator-5554`) across categories and search states.

## [2026-10-19] - Arabic Search Normalization & Unified Multi-Filter Engine
### Added / Fixed
- **Arabic Normalization Engine (`OfferFilterUtils`)**:
  - Full glyph normalization for Alefs (`[أ, إ, آ, ٱ]` ➔ `ا`), Taa Marbuta (`ة` ➔ `ه`), Yaa & Alef Maksura (`[ى, ي, ئ]` ➔ `ي`), and Waw with Hamza (`ؤ` ➔ `و`).
  - Stripping Tashkeel (harakat), Tatweel (kashida), and invisible Unicode marks/control characters (`\u200B-\u200F`, `\uFEFF`).
  - Eastern Arabic numerals conversion (`٠-٩` ➔ `0-9`) allowing numeric search across both keyboards and locales.
  - Multi-token matching with definite article (`ال`) tolerance in both directions (e.g. searching "فلل" matches "فلل الجامعة" and "الفلل").
  - Egyptian spelling variants support (`ه` vs `ا`, e.g. "شاورمة" matches "شاورما").
- **Unified 0ms Client-Side & Remote Search (`SearchPage`)**:
  - Replaced siloed search sourcing with `_getAllSourceOffers` combining `allOffers`, `trendingOffers`, `recommendedOffers`, and `searchResults` deduplicated by ID.
  - Triggered instantaneous 0ms client-side re-render on keystroke via `setState` with 350ms debounced backend enrichment.
  - Category sidebar remains persistent and accessible during search, enabling simultaneous category + area + discount + search filtering.
  - Added active filter chips row with counter (`X عروض مطابقة`) and instant tap-to-delete on each active criterion.
  - Added one-tap "إعادة ضبط الفلاتر والبحث" in the empty state.
- **Category & Area Filter Robustness**:
  - Normalized and cross-mapped backend enums (`FOOD` vs `مطاعم`), display names, and Arabic aliases (`دلع كرشك`).
  - Updated `AllOffersPage` and `HomePage` to use `OfferFilterUtils.matchesCategory`.
- **BLoC Search Hardening (`OffersBloc`)**:
  - Replaced unawaited Timer in `_onSearchOffers` to fix `StateError: emit was called after handler completed`.
  - Converted remote search failures to non-destructive so local filtered offers remain visible.
- **Verification**:
  - 14/14 unit tests passed in `test/offer_filter_arabic_search_test.dart` (27/27 overall suite).
  - 0 issues on `flutter analyze lib/`.
  - Verified live on Android emulator (`emulator-5554`) and iOS Simulator (`iPhone 17 Pro Max`).

## [2026-10-19] - Explore Offers Screen Redesign & Complete Arrow/Filter Audit
### Added / Changed
- **Zero-Gradient Brand System (`SearchPage` & `OfferCard`)**: Completely removed all gradients from offer cards, badges, buttons, and placeholders in favor of crisp solid tokens (`#FF5A0A`, `#142033`, `#FFFFFF`, `#F1F5F9`).
- **Compact Offer Cards Layout**: Eliminated fixed aspect ratios and child stretching, shifting to content-driven natural sizing. Reduced card vertical height from ~340px to ~235px and increased screen offer density by 2x.
- **Categories Sidebar Redesign**: Narrowed right-side sidebar to 82px with 40px circular thumbnails, solid selection state, subtle vertical divider, and independent scrolling.
- **Branded Monogram Fallback**: Solid orange monogram avatar on cream surface for missing store/offer images, replacing shimmering grey placeholders.
- **Comprehensive Arrow & RTL Navigation Audit**:
  - Fixed `CategoriesPage` forward arrow inversion where `Transform.flip(flipX: true)` was flipping it to point backward.
  - Direction-aware chevrons in `OfferCard` ("احصل عليه"), `MyCouponsPage`, `ProfilePage` (ZagRewards banner & settings), and `OnboardingPage` ("التالي").
  - Verified back button behavior across all 14 screens.
- **Filter Invariants Across All Pages**: Directional padding in `FilterBottomSheet`, tuned `AllOffersPage` grid aspect ratio (0.68), and verified full category/area/discount filter pipelines.

## [2026-10-19] - Complete Multi-Page Back Button & RTL Navigation Audit
### Fixed
- **RTL Back Arrow Direction**: Corrected back button chevrons that were hardcoded to left-pointing (`Icons.arrow_back_ios_new_rounded`) in `CategoriesPage`, `MapPage`, and `LoginPage`. They now dynamically evaluate `Directionality.of(context) == TextDirection.rtl` to point to the right (→), matching correct Arabic back navigation.
- **Explicit Leading Navigation Buttons**: Added standard RTL-adaptive leading back buttons to `AllOffersPage`, `MyCouponsPage`, `RegisterPage`, `ForgotPasswordPage`, `ZagRewardsPage`, and `NotificationsPage` when navigated via `Navigator.canPop`.
- **RTL Action Chevron Consistency**: Corrected "عرض الكل" text button in `HomePage` so the chevron points forward (←) in RTL, and adapted the back button in `NotificationsPage` empty state.

## [2026-10-19] - Offer Details Screen Header Symmetry & Breathing Room Polish
### Fixed
- **Sheet Clearance & Padding**: Increased sheet top padding from 18px to 34px, granting generous breathing room between the top curved edge and the meta row.
- **Symmetrical Secondary Metadata Pill**: Enclosed view counts and dynamic social proof tags into an elegant secondary pill container (`Color(0xFFF1F5F9)` light / `Color(0xFF1E293B)` dark) with matching 10px rounded corners and height aligned with the Egyptian Orange discount badge (`خصم 40%`).
- **Emoji Clutter**: Removed duplicate sparkle emojis (`✨ جديد ✨`), keeping a single crisp vector icon (`Icons.auto_awesome_rounded`).
- **Font & Glyph Rendering**: Fixed missing bullet glyph tofu (`■`) in store address subtitles by using `GoogleFonts.cairo` and a styled circular dot container.
- **RTL Parentheses Integrity**: Replaced inverted `(%40)` with correctly aligned `(خصم 40%)` in the price savings breakdown.

## [2026-10-18] - Complete Multi-Platform Page-by-Page Visual & Functional Verification
### Verified
- **Android (`emulator-5554` API 37)**:
  - `HomePage` (`01_android_home_page.png`): Live deal counter pill, carousel ad slider, category avatars, trending offers, floating nav.
  - `CategoriesPage` (`02_android_categories_page.png`): 2-column luxury category cards, RTL back arrow, count badges.
  - `AllOffersPage` (`03_android_all_offers_reset.png`): Perforated coupon cards, live badges, strike-through prices, reset filter action.
  - `OfferDetailPage` (`04_android_offer_detail_page.png`): Thumbnails spacing, store card, terms, expiration, coupon claim lock.
  - `StoreDetailPage` (`05_android_store_detail_page.png`): Store avatar monogram, location directions CTA, offers list.
  - `MyCouponsPage` (`06_android_my_coupons_page.png`): Segmented status tabs (الكل, النشطة, تم استخدامها), `جاهز للاستخدام ✨`.
  - `CouponQrModal` (`07_android_qr_modal.png`): High contrast QR matrix, store monogram, monospaced LTR coupon code.
  - `ProfilePage` (`08_android_profile_page.png`): Customer badge, quick stats, Zag Rewards card, settings list.
  - `FavoritesPage` (`09_android_favorites_page.png`): Favorited offers list, heart action, price strike-through.
  - `SearchPage` (`10_android_search_page.png` & `11_android_search_results.png`): Vertical category rail, search input, filtered results.

- **iOS (`iPhone 17 Pro Max` iOS 26.5 Simulator)**:
  - `OnboardingPage` (`01_ios_home_page.png`): Multi-slide photo collage, dark mode, RTL skip and next buttons.
  - `HomePage` (`02_ios_home_page.png`): Midnight Navy dark theme, live deal counter, glowing category rings, floating nav bar.
  - `CategoriesPage` (`12_ios_categories_page.png`): Full luxury category cards, gradient header, RTL chevrons.
  - `AllOffersPage` (`13_ios_all_offers_page.png`): Perforated coupon cards, live badges, strike-through prices.
  - `MyCouponsPage` (`14_ios_my_coupons_page.png`): Guest empty state, ticket icon, sign-in CTA.
  - `ProfilePage` (`15_ios_profile_page.png`): User header, stats cards, settings menu, safe-area floating nav.
  - `SearchPage` (`16_ios_search_page.png`): Vertical category rail, search input with orange border, search results grid.
  - `FavoritesPage` (`17_ios_favorites_page.png`): Guest empty state, lock icon, sign-in CTA.
  - `OfferDetailPage` (`18_ios_offer_detail_page.png`): Hero monogram, pricing breakdown, branch info, map button, CTA.
  - `StoreDetailPage` (`19_ios_store_detail_page.png`): Store profile, monogram logo, map directions, call action, offers.

- **Quality & Health Invariants**:
  - `flutter analyze lib/` ➜ 0 issues found.
  - `flutter test` ➜ 13/13 passing.
  - Zero `RenderFlex overflowed` across all screens and orientations.
  - Safe area clearance verified on both Dynamic Island / Home Indicator (iOS) and System Gesture Navigation (Android).

---

## [2026-10-18] - Production-Grade UI/UX Polish: Stability, Gesture Hardening & RTL Invariance
### Fixed
- **Coupon Claim Synchronous Lock**: Added `_isClaimingCoupon` state lock in `OfferDetailPage` to synchronously block rapid repetitive taps from firing duplicate coupon generation events before BLoC transitions to loading.
- **Eliminated Button-Inside-BouncyTap Collisions**: Replaced nested `ElevatedButton` and `IconButton.filledTonal` inside `BouncyTap` with decorated `Container` children directly, preventing duplicate gesture recognizer fights and splash artifacts.
- **Safe Area Inset Protection**: Replaced rigid `80px` bottom space in `StoreDetailPage` reviews list with `80 + MediaQuery.paddingOf(context).bottom`, ensuring the bottom review never collides with home indicators on modern gesture-nav devices.
- **Interactive Notice Banner on HomePage**: Enhanced `_buildNoticeBanner` with an inline, 1-tap `إعادة المحاولة` (Retry) button so customers can immediately recover from timeouts or transient network disruptions without waiting or manual pull-to-refresh.
- **Arabic RTL Directional Navigation**: Fixed leading back icons across `SearchPage`, `StoreDetailPage`, and `FavoritesPage` to dynamically point right (`Icons.arrow_forward_ios_rounded`) in Arabic RTL context, adhering strictly to Arabic mental models.
- **RTL Directional Badging**: Replaced hardcoded `Positioned(right: 12, top: 12)` with `PositionedDirectional(end: 12, top: 12)` in `SearchPage` and `AllOffersPage`.
- **Robust Root Cross-Tab Navigation**: In both `FavoritesPage` and `MyCouponsPage`, updated empty state CTA "استكشف العروض الآن" to use `NavigationService.navigatorKey` fallback when pushed in modal stacks, reliably switching the root `MainScreen` to tab index 1 (Offers).

### Verified
- Built and verified live on `iPhone 17 Pro Max` iOS simulator (`ios_verified_phase1.png`).
- 0 issues on `flutter analyze lib/`.
- 13/13 passing on `flutter test`.

---

## [2026-10-18] - Categories Page Luxury Redesign & RTL Precision
### Added
- **CategoriesPage Modernization**:
  - Replaced washed-out peach full-screen tint with crisp `#F8FAFC` light background and `#0D1422` Midnight Navy dark background with ambient radial corner glow.
  - Added a modern gradient Hero Header Banner (`اختر تصنيفك المفضل`) with an active Egyptian Orange flame chip (`عروض الزقازيق الحصرية`).
  - Added Arabic category subtitle descriptions (`أقوى عروض الأكل`, `كافيهات ومشروبات`, `وقت اللعب والترفيه`, `تجميل وعناية`, etc.).
  - Added active offer count pill badges (`🔥 عرض متاح`, `متوفر ✨`) dynamically computed from live offers.
  - Upgraded category cards to high-end surfaces with signature category-colored gradient borders, 56x56 high-resolution asset thumbnails, and subtle drop shadows.
  - Added robust category alias resolution and fuzzy matching in `CategoryUtils` (`جميلة` ➔ `دلع بنات`, `أكل` ➔ `دلع كرشك`, etc.).

### Fixed
- **RTL Navigation Arrow Directionality**:
  - Fixed AppBar back button to point right (`>`) for natural Arabic RTL screen popping.
  - Fixed Category card explore action chevron to point left (`<`) for forward category exploration.

### Verified
- Built and tested on Android emulator (`screen_categories_verified_final3.png`).
- 0 issues on `flutter analyze lib/`.
- 13/13 passing on `flutter test`.

---

## [2026-10-18] - Complete UI/UX, Flex Rendering & Gallery Spacing Overhaul
### Fixed
- Fixed `RenderFlex overflowed by 60/76 pixels` across cards in `SearchPage`, `AllOffersPage`, and `FavoritesPage`:
  - Dynamically calibrated responsive grid `childAspectRatio` (0.88 for 1-column mobile sidebar layouts, 0.58 for 2-column mobile grids, 0.72-0.80 for tablets).
  - Immune flex card architecture: Wrapped `_buildInfoSection` in `LayoutBuilder` + `FittedBox(fit: BoxFit.scaleDown)` and wrapped price & CTA buttons with `Flexible(flex: 0)` to guarantee zero overflow under any accessibility scale or constrained height.
- Fixed Gallery Thumbnails collision and lack of top spacing in `OfferDetailPage`:
  - Adjusted content sheet overlap offset from `-28px` to `-20px`.
  - Added 22px top padding to content sheet and 14px top padding to thumbnail strip, providing 20px+ of generous breathing room between hero image and thumbnails.
  - Adjusted hero dot indicators to `bottom: 32` so dots never collide with the card curve.
- Fixed Empty Section Fallback on `HomePage`:
  - Added dedicated fallback card when an area filter (e.g. `الصيادين`) has no offers, with a direct 1-tap "عرض جميع العروض" reset button.
- Fixed Filter Reset in `AllOffersPage`:
  - Animate `_categoryScrollController` back to index 0 (`الكل`) and reload all offers on reset.

---

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
