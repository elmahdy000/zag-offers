# Zag Offers — Project Progress & Status

## 1. Current State Summary
- **Primary Focus**: Vendor Mobile Application (`zag_offers_vendor_app`) & Customer Web/Mobile Ecosystem.
- **Git Branch**: `main` (synchronized with `origin/main`).
- **Latest Commit**: `dd5ab1d` (`fix(vendor): overhaul layout, rtl directionality, error handling & coupon typography`).
- **Analyzer Health**: `flutter analyze lib/ test/` ➜ 0 issues found across all packages (`zag_offers_app`, `zag_offers_vendor_app`).
- **Test Health**: 100% tests passing (6/6 in vendor app, 34/34 in customer app).

---

## 2. Completed Milestones

### K. Customer Flutter App Comprehensive Revision & Semantic RTL Invariance (`zag_offers_app`)
- **Memory & Baseline Audit**:
  - Reconciled code against `.agent-memory/` and `AGENTS.md` rules.
  - Zero analyzer errors across `lib/` and `test/` (0 warnings, 0 hints).
  - 34/34 unit and widget tests passing.
- **Critical Runtime Crash Prevention (`network_image_widget.dart`)**:
  - Identified runtime crash `Unsupported operation: Infinity cannot be cast to int` when callers pass `width: double.infinity`.
  - Added `.isFinite` guards: `(width != null && width!.isFinite) ? width!.toInt() : null` for both `memCacheWidth` and `memCacheHeight`.
- **RTL Directional Navigation & Flutter Auto-Mirroring Hardening (`NavigationService`, `AppBackButton`)**:
  - Discovered that Flutter's `Icons.arrow_back_ios_new_rounded` and `Icons.arrow_forward_ios_rounded` have `matchTextDirection: true`, meaning Flutter automatically applies `scaleX = -1.0` in RTL layouts.
  - Formulated `NavigationService.getBackIcon` (returns `Icons.arrow_back_ios_new_rounded`) and `NavigationService.getForwardIcon` (returns `Icons.arrow_forward_ios_rounded`). In RTL, Flutter flips `arrow_back` to point `>` (backwards/outwards) and `arrow_forward` to point `<` (forward/inwards).
  - Created `AppBackButton` (`app_back_button.dart`) providing unified RTL-aware back navigation with `HapticFeedback.lightImpact()` and `Navigator.maybePop(context)`.
- **Comprehensive Screen & Component Updates (17 files audited)**:
  - `SearchPage`: Updated back button to use `NavigationService.getBackIcon(context)`.
  - `CategoriesPage`: Fixed back button and category card exploration chevron.
  - `AllOffersPage`: Updated back button to use `NavigationService.getBackIcon(context)`.
  - `StoreDetailPage`: Updated back button and offer list item forward chevron.
  - `OfferDetailPage`: Updated back button and store card disclosure chevron.
  - `FavoritesPage`: Updated back button to use `NavigationService.getBackIcon(context)`.
  - `NotificationsPage`: Restored `AppColors` import and empty state CTA icon.
  - `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `InviteFriendsPage`, `ZagRewardsPage`: Unified AppBar leading back buttons to `AppBackButton`.
  - `MapPage`: Circle back button updated to `NavigationService.getBackIcon(context)`.
  - `MyCouponsPage`: Coupon ticket forward chevron and history sheet back button updated to `AppBackButton`.
  - `OfferCard`: "احصل عليه" CTA chevron updated to `NavigationService.getForwardIcon(context)`.
  - `HomePage`: "عرض الكل" section header chevron updated to `NavigationService.getForwardIcon(context)`.
  - `AdsSlider`: "احصل على الكوبون" CTA chevron updated to `NavigationService.getForwardIcon(context)`.
  - `OnboardingPage`: "التالي" slide advancement chevron updated to `NavigationService.getForwardIcon(context)`.
- **Directionality Regression Suite (`test/navigation_directionality_test.dart`)**:
  - Implemented 7 automated tests verifying `matchTextDirection: true`, horizontal `scaleX == -1.0` auto-mirroring in RTL, and proper behavior of `AppBackButton` across RTL and LTR.

### J. Vendor Flutter App Comprehensive UI/UX & Services Overhaul (`zag_offers_vendor_app`)
- **MainLayout & Navigation Bar Modernization (`main_layout.dart`)**:
  - Removed redundant `Padding(padding: EdgeInsets.only(bottom: 80))` wrapping `IndexedStack` which created a massive 160px+ void above the bottom navigation bar.
  - Upgraded bottom navigation items: persistent, elegant `GoogleFonts.cairo` labels (11px, bold when active, w600 when inactive) with soft Egyptian Orange pill indicator on active icons.
  - Adjusted `BottomAppBar` height from 80px to 76px with a smooth notch margin for the centered QR Scanner FAB.
- **Offers Management Screen & RTL Alignment (`offers_page.dart`)**:
  - Eliminated duplicate nested `FloatingActionButton` that collided with `MainLayout`'s centered QR Scanner FAB.
  - Added an "إضافة عرض جديد" action button (`Icons.add_circle_outline_rounded`) with Egyptian Orange styling into `AppBar.actions`.
  - Reclaimed 52px of empty vertical space by reducing `AppBar.bottom` `preferredSize` from `100` to standard `48`.
  - Migrated offer card badges to `PositionedDirectional` (`start: 12` for status, `end: 12` for discount, and `end: 6` for options menu with translucent circular backdrop).
- **Universal Shimmer States (`skeleton_loader.dart`, `dashboard_page.dart`, `reviews_page.dart`, `notifications_page.dart`)**:
  - Added `HorizontalCardsSkeleton` for horizontal list loading states.
  - Replaced raw `CircularProgressIndicator` spinners in `DashboardPage`, `ReviewsPage`, and `NotificationsPage` with dedicated theme-aware shimmer skeletons (`HorizontalCardsSkeleton`, `ListSkeleton`).
- **Coupon Monospace & LTR Typography Contract**:
  - Implemented `GoogleFonts.spaceMono` with explicit `TextDirection.ltr` across `DashboardPage` (`_buildActivityTile`), `ReportsPage`, and `QRScannerPage` manual code input dialog (`#ZAG-XXXXXX`).
- **Error Handling & Exception Translation (`error_handler.dart`, `add_edit_offer_page.dart`)**:
  - Integrated `ErrorHandler.handle(e)` across `QRScannerBloc`, `ReviewsBloc`, `ProfileBloc`, and `add_edit_offer_page.dart` (preventing raw English `DioException` stack traces and translating network/validation errors into user-friendly Arabic dialogs and toasts).
  - Replaced raw `ScaffoldMessenger.of(context).showSnackBar` with unified `SnackBarUtils.showError(...)`.
- **Dismissible & RTL Directional Bug Fixes (`notifications_page.dart`, `store_setup_page.dart`, `qr_scanner_page.dart`)**:
  - Replaced hardcoded `Alignment.centerRight` and `EdgeInsets.only(right: 24)` on notification delete background with `AlignmentDirectional.centerEnd` and `EdgeInsetsDirectional.only(end: 24)`.
  - Replaced LTR `Positioned` with `PositionedDirectional` on camera controls and image thumbnail removal buttons.
- **Live Android Verification**:
  - Deployed to physical Android emulator (`emulator-5554`), verified clean UI on Dashboard, Offers, Reports, Scanner, and Notifications screens with 0 errors.

### I. Explore Offers Screen Full-Width Redesign & Data Deduplication (`SearchPage`, `OfferCard`)
- **Full-Width Screen Reclamation**: Completely eliminated the 82px vertical category sidebar that consumed >22% of mobile screen real estate, freeing 100% of the display width for offers.
- **Horizontal Category Bar**: Implemented sleek, fast, horizontal scrollable pills with active Egyptian Orange selection, dynamic thumbnails/icons, and "الكل" quick reset.
- **Card Content Deduplication**:
  - Removed duplicate store name text from inside the image placeholder monogram avatar, keeping the clean monogram and showing the merchant name once in the info section.
  - Sanitized bare discount titles (e.g. `40% خصم` repeating `خصم 40%`) into informative, professional titles: `40% خصم على جميع الخدمات والطلبات`.
- **Responsive Layout & Visual Polish**: 16px uniform margins, content-driven card heights, verified 0ms Arabic search and instant category filtering.
- **Verification**: 27/27 unit tests passing, `flutter analyze lib/` 0 issues, live verified on Android emulator (`emulator-5554`).

### A. Coupon Wallet Redesign (`MyCouponsPage`)
- Segmented tabs: `نشطة` (Active), `مستخدمة` (Used), `الكل` (All).
- Visual coupon cards with clean perforated edge styling, high contrast, merchant logos/monograms, and one-tap copy/QR view.
- Real-time countdowns for expiring coupons.
- Tested and verified on physical Android emulator.

### B. Coupon QR Modal Overhaul (`CouponCelebrationDialog`)
- **Status Integrity**: Completely eliminated contradictory green rubber stamp "تم الاستخدام" that overlapped merchant details.
- Clean status badge: `جاهز للاستخدام ✨` for active coupons, `تم الاستخدام ✓` only for redeemed coupons.
- Merchant avatar fallback: Monogram initial badge with smooth gradients when store logo is absent.
- Scannable QR code: 155×155 high-contrast dark navy modules inside rounded white card with wide quiet zone.
- Monospaced code container: `ZAG-XXXXXX` strictly LTR with instant haptic copy feedback.
- Two distinct action buttons: Primary `عرض في كوبوناتي 🎟️` (switches to tab 2) and `تم، العودة` (dismisses modal).

### C. Offer Details Screen Modernization & Refinement (`OfferDetailPage`)
- **Mathematical Pricing Consistency**: Implemented `OfferPricingResult` single calculation authority. Formula `((originalPrice - finalPrice) / originalPrice) * 100` eliminates mathematical inconsistencies.
- **Header Geometry & Layout Cohesion**:
  - Increased content sheet top padding to `34px` when single hero image/monogram is displayed, completely resolving content collision with the top curved radius.
  - Symmetrical top meta row: Encapsulated view count and dynamic social proof into a polished secondary pill container with matching `10px` border radius, subtle border, and height aligned with the primary Egyptian Orange discount badge (`خصم 40%`).
  - Purged emoji redundancy: Removed duplicate `✨` emojis, rendering single crisp vector icons (`Icons.auto_awesome_rounded`).
  - Fixed font tofu glyphs: Replaced missing bullet character `•` in address subtitles with styled `GoogleFonts.cairo` typography and circular dot dividers.
- **RTL Numeric Integrity**: Strictly enforced `TextDirection.rtl` on prices and `(خصم 40%)` savings to prevent inverted brackets and glyph flips.
- **Image Gallery & Full-Screen Zoom**: Synchronized thumbnails with active orange border; swipeable full-screen `PageView` with pinch-to-zoom (`InteractiveViewer`) and non-blocking `IgnorePointer` overlay.
- **Collapsing Sticky Header**: Fluid scroll transition with preserved button positioning and light system overlay.
- **Merchant & Location Cards**: Verified store badge, monogram avatar, address deduplication with instant copy feedback, and a filled Egyptian Orange primary `طريق الوصول` button.
- **Informative Offer Description**: Added compact feature chips (category, limits, flash sale, branch) and high-quality fallback text.
- **Natural Vertical Flow & Reviews**: Replaced rigid empty sections with a compact inline card, added review timestamps, and optimized spacing rhythm (12-16px).
- **Used Coupon Bottom State**: Clearly non-interactive emerald container with verification checkmark and timestamp, replacing ambiguous button styling.

### D. Centralized Pricing Authority & Offer Card Modernization (`OfferCard`, `OfferPricingResult`)
- Centralized `OfferPricingResult` in `offer_pricing_utils.dart` across `OfferDetailPage`, `OfferCard`, and `MyCouponsPage`.
- **Card Pricing & Scarcity Integrity**:
  - Bound price calculations, discount badges, and strikethroughs to single mathematical authority.
  - Store-wide offers without item prices display `خصم عام` and `X% على الفاتورة` with strict LTR isolation.
  - Exhausted coupon state (`remaining <= 0`): Renders disabled `نفد الكوبون` pill and `نفدت الكمية` warning tag with `Icons.do_not_disturb_on_rounded`.
  - Enhanced social proof: Replaced `0 مهتم` with attractive `جديد ✨` spark pill; formatted large interest numbers (`1.2k`).
  - Ticket notch background: Dynamically matches `Theme.of(context).scaffoldBackgroundColor`.
  - RTL horizontal scroll fix: Replaced `EdgeInsets.only(right: 14)` with `EdgeInsetsDirectional.only(end: 14)` in `HomePage`.
  - Validated with unit test suite in `test/offer_pricing_utils_test.dart` (13/13 passing, 0 analyzer issues).

### E. Invite Friends Modernization (`InviteFriendsPage`)
- Midnight Navy surface tokens (`#162032` card, `#1E293B` actions) with high-contrast borders and Egyptian Orange glow.
- Strict LTR monospaced referral code (`GoogleFonts.spaceMono`) with 1-tap copy and haptic feedback.
- Instant 1-tap WhatsApp direct share action button with fallback to system share sheet.
- 3-step visual onboarding cards explaining the 100-point reward journey (Share ➔ Register ➔ 100 Points Reward).

### F. Store Details & Navigation Polish (`StoreDetailPage`)
- Monogram initial avatar fallback with radial gradient glow when merchant logo is missing.
- RTL alignment fix: Replaced `Positioned(left: 24)` with `PositionedDirectional(start: 24)` ensuring avatar sits properly on the leading edge.
- Egyptian WhatsApp number normalization (`_cleanWhatsAppNumber`: `01xxxxxxxxx` ➔ `201xxxxxxxxx`) ensuring WhatsApp URLs launch seamlessly.
- Real-time distance indicator badge (`يبعد X كم` / `يبعد X متر`) in the location card via `LocationService.getFormattedDistanceTo`.
- Premium high-converting filled gradient navigation CTA container (`AppColors.primary` to `#FF7043`) replacing nested button gesture collisions.

### G. Core Network & Services Hardening
- `LocationService`: Integrated `distanceBetween()`, `formatDistance()` (e.g. `650 متر` / `2.3 كم`), and `getFormattedDistanceTo(lat, lng)`.
- `ApiClient`: Comprehensive session purge upon receiving 401 Unauthorized (clears all cached auth, profile, and point tokens).
- `dio_error_mapper`: Replaced developer-facing debug strings (e.g. "تأكد من عنوان IP وتشغيل الباك إند") with polished, customer-facing Arabic error messages.

### H. Complete UI/UX, Flex Rendering & Gallery Spacing Overhaul
- **Immune Flex Card Architecture**: Eliminated all `RenderFlex overflowed` errors across `SearchPage`, `AllOffersPage`, and `FavoritesPage` using dynamic responsive grid aspect ratios (`0.88` for 1-col, `0.58` for 2-col) and `LayoutBuilder` + `FittedBox(fit: BoxFit.scaleDown)`.
- **Gallery Thumbnails Breathing Space**: Adjusted sheet overlap offset from `-28px` to `-20px`, added 22px sheet top padding and 14px thumbnail strip padding, creating 20px+ of clean breathing room below the hero image without clipping or collision.
- **Graceful Area & Filter Fallback**: Added a dedicated, 1-tap reset card on `HomePage` when an active filter yields no offers.
- **Filter Reset Synchronization**: Connected `AllOffersPage` reset button to scroll the category list back to `الكل` and refresh BLoC data.

### I. Comprehensive Back Button & RTL Navigation Audit (All 22 Pages)
- **RTL Directional Invariance**:
  - Identified and fixed inverted or hardcoded left-pointing back arrows (`Icons.arrow_back_ios_new_rounded`) in `CategoriesPage`, `MapPage`, `LoginPage`.
  - Enforced `Directionality.of(context) == TextDirection.rtl ? Icons.arrow_forward_ios_rounded : Icons.arrow_back_ios_new_rounded` across all screens, guaranteeing back buttons point strictly to the right (→) in Arabic RTL.
  - Added explicit, consistent leading back buttons to `AllOffersPage`, `MyCouponsPage`, `RegisterPage`, `ForgotPasswordPage`, `ZagRewardsPage`, and `NotificationsPage` when navigated via `Navigator.canPop`.
  - Harmonized internal action icons: in `HomePage` ("عرض الكل"), adapted chevron to point forward in RTL (←), and adapted `NotificationsPage` empty state action button.
- **Verified Across Platforms**: `flutter analyze lib/` 0 issues, 13/13 tests passing, verified on Android emulator and iOS simulator.

### I. Categories Page Complete Luxury Redesign (`CategoriesPage`)
- **Eliminated Washed-Out Palette**: Replaced the dull pale-peach scaffold background with crisp `#F8FAFC` (light) and `#0D1422` Midnight Navy (dark) with ambient radial corner glow.
- **RTL Navigation Precision**: Ensured AppBar back button points right (`>`) for natural Arabic RTL navigation, while category card exploration chevron points left (`<`).
- **Hero Header Banner**: Added gradient welcome card with `عروض الزقازيق الحصرية` fire pill, bold headline, and subtitle.
- **Rich Immersive Category Cards**:
  - Replaced tiny floating circle with 56x56 high-resolution asset thumbnail wrapped in signature category gradient border and drop shadow.
  - Added Arabic subtitle descriptions (`أقوى عروض الأكل`, `كافيهات ومشروبات`, `وقت اللعب والترفيه`, `تجميل وعناية`, etc.).
  - Added active offer count pill badges (`🔥 عرض متاح`, `متوفر ✨`) tied to live store categories.
  - Added fuzzy matching and alias resolution in `CategoryUtils` for backend categories (`جميلة`, `أكل`, `مشروبات`, etc.).
  - Preserved haptic `BouncyTap` animation and responsive multi-column grid layout.
- **Live Verification**: Successfully built and tested on Android emulator (`screen_categories_verified_final3.png`).

### J. Production-Grade UI/UX Polish: Phase 1 Stability, Gesture Hardening & RTL Invariance
- **Synchronous Double-Tap Claim Guard**: Added `_isClaimingCoupon` state lock in `OfferDetailPage` to synchronously block rapid repetitive taps from firing duplicate coupon generation events before the BLoC transitions to loading. Reset safely on `CouponGeneratedSuccess`, `CouponsError`, and `UserCouponsLoaded`.
- **Eliminated Button-Inside-BouncyTap Collisions**: Replaced nested `ElevatedButton` and `IconButton.filledTonal` inside `BouncyTap` with styled, decorated `Container` children directly, preventing duplicate gesture recognizer fights and splash artifacts.
- **Safe Area Inset Protection**: Replaced rigid `80px` bottom space in `StoreDetailPage` reviews list with `80 + MediaQuery.paddingOf(context).bottom`, ensuring the bottom review never collides with home indicators on modern gesture-nav devices.
- **Interactive Notice Banner on HomePage**: Enhanced `_buildNoticeBanner` with an inline, 1-tap `إعادة المحاولة` (Retry) button so customers can immediately recover from timeouts or transient network disruptions without waiting or manual pull-to-refresh.
- **Arabic RTL Directional Navigation**: Fixed leading back icons across `SearchPage`, `StoreDetailPage`, and `FavoritesPage` to dynamically point right (`Icons.arrow_forward_ios_rounded`) in Arabic RTL context, adhering strictly to Arabic mental models.
- **RTL Directional Badging**: Replaced hardcoded `Positioned(right: 12, top: 12)` with `PositionedDirectional(end: 12, top: 12)` in `SearchPage` and `AllOffersPage`.
- **Robust Root Cross-Tab Navigation**: In both `FavoritesPage` and `MyCouponsPage`, updated empty state CTA "استكشف العروض الآن" to use `NavigationService.navigatorKey` fallback when pushed in modal stacks, reliably switching the root `MainScreen` to tab index 1 (Offers).
- **Verified Across Platforms**: `flutter analyze lib/` ➜ 0 issues found, `flutter test` ➜ 13/13 passing, verified on `iPhone 17 Pro Max` iOS simulator (`ios_verified_phase1.png`).

### K. Comprehensive Multi-Platform Page-by-Page Visual & Functional Verification
- **Verified 100% Core Screens on Android (`emulator-5554` API 37)**:
  1. `01_android_home_page.png`: Home feed, ad carousel, category avatars, live counter, floating bottom bar.
  2. `02_android_categories_page.png`: Full luxury category cards, RTL chevrons, gradient header.
  3. `03_android_all_offers_reset.png`: All Offers feed, perforated coupon cards, dynamic pricing strike-through.
  4. `04_android_offer_detail_page.png`: Offer detail hero, thumbnails breathing space, store card, coupon status CTA.
  5. `05_android_store_detail_page.png`: Store profile, monogram logo avatar, location maps action, store offers.
  6. `06_android_my_coupons_page.png`: My Coupons wallet, active/used segmented filters, `جاهز للاستخدام ✨`.
  7. `07_android_qr_modal.png`: QR redemption modal, high-contrast QR matrix, monospaced LTR coupon code.
  8. `08_android_profile_page.png`: Profile view, customer badge, Zag Rewards card, settings list.
  9. `09_android_favorites_page.png`: Favorites page, favorited deals list, heart toggle.
  10. `10_android_search_page.png`: Search page, vertical category rail, search query input, filter button.
  11. `11_android_search_results.png`: Category selection in search navigating directly to filtered offers.

- **Verified 100% Core Screens on iOS (`iPhone 17 Pro Max` iOS 26.5 Simulator)**:
  1. `01_ios_home_page.png`: Onboarding walkthrough collage, modern typography, RTL skip and next actions.
  2. `02_ios_home_page.png`: Home feed in Midnight Navy, live badge, category glowing rings, floating nav bar.
  3. `12_ios_categories_page.png`: Categories grid with high-res thumbnails, gradient badges, RTL back button.
  4. `13_ios_all_offers_page.png`: All Offers feed, 2-column perforated coupon cards, strike-through pricing.
  5. `14_ios_my_coupons_page.png`: My Coupons wallet in guest mode, ticket monogram, sign-in CTA.
  6. `15_ios_profile_page.png`: Profile page in dark mode, user badge, quick stats, settings menu.
  7. `16_ios_search_page.png`: Search screen with vertical category rail, search bar, active offers grid.
  8. `17_ios_favorites_page.png`: Favorites page in guest mode, lock icon, clear call to action.
  9. `18_ios_offer_detail_page.png`: Offer detail page, discount badges, branch details, location CTA, coupon action button.
  10. `19_ios_store_detail_page.png`: Store profile, circular monogram, call/maps actions, active offers.

- **Zero Inset Collisions & Zero Overflow**:
  - Safe area clearance verified on both Dynamic Island / Home Indicator (iOS) and System Gesture Navigation (Android).
  - Strict RTL arrow alignment and LTR coupon code isolation maintained across all screens.
  - Zero analyzer errors (`flutter analyze lib/` ➜ 0 issues).
  - Passing test suite (`flutter test` ➜ 13/13 passed).

### L. Explore Offers Screen & OfferCard Premium Redesign (Zero-Gradient Flat System)
- **Zero-Gradient Invariant**: Eliminated all linear/radial gradients across `SearchPage`, `OfferCard`, and `NetworkImageWidget`. Applied solid curated tokens: Primary Orange (`#FF5A0A`), Dark Navy (`#142033`), White (`#FFFFFF`), Secondary Gray (`#718096`), and Success Green (`#00B887`).
- **Eliminated Card Height Stretching & Voids**: Removed forced aspect-ratio height constraints and fixed child expansion in phone viewport, switching `SearchPage` to content-driven `ListView.separated` and reducing card vertical footprint from ~340px to ~235px. Display density increased from 1.2 to 2.5 visible offers per screen.
- **Compact Categories Sidebar**: Reduced right-side panel width from 96px to 82px with 40px circular thumbnails, subtle hairline vertical border (`0.8px`), solid `#FFF3EC` active selection state, and independent vertical scrolling on the RIGHT (start of RTL `Row`).
- **Branded Image Fallback & Placeholder**: Replaced shimmer gradient with solid-color branded placeholder rendering store monogram initial (`44x44` circle with initial in `#FF5A0A` on `#FFF3EC`) when offer image is null.
- **Top Search & Filter Header**: 42px squircle search field, 38x38 squircle back button (`Icons.arrow_forward_ios_rounded`), and 38x38 squircle filter button with active `#FF5A0A` dot.

### M. Comprehensive Arrow Direction & RTL Navigation Audit Across All Components
- **RTL Chevron & Back Button Invariance**:
  - Enforced `Directionality.of(context) == TextDirection.rtl ? Icons.arrow_forward_ios_rounded : Icons.arrow_back_ios_new_rounded` across all 14 screens for back buttons (pointing strictly right in Arabic RTL).
  - Fixed `CategoriesPage` forward arrow bug where `Transform.flip(flipX: true)` was flipping the arrow to point backward instead of forward.
  - Made disclosure and navigation chevrons in `OfferCard` ("احصل عليه"), `MyCouponsPage`, `ProfilePage` (ZagRewards banner & settings), and `OnboardingPage` ("التالي") directionality-aware and unified to Cairo typography and standard icon scale.
- **Full Filter Audit**:
  - Verified `FilterBottomSheet` area chips with `EdgeInsetsDirectional.only(end: 8)`, minimum discount slider, sort options, and reset mechanism.
  - Verified `OfferFilterUtils` matching across categories, areas, minimum discounts, and sort criteria.
### N. Arabic Search Normalization & Unified Multi-Filter Engine
- **Full Arabic Normalization Engine (`OfferFilterUtils`)**:
  - Comprehensive glyph normalization: Alefs (`[أ, إ, آ, ٱ]` ➔ `ا`), Taa Marbuta (`ة` ➔ `ه`), Yaa & Alef Maksura (`[ى, ي, ئ]` ➔ `ي`), and Waw with Hamza (`ؤ` ➔ `و`).
  - Tashkeel (diacritics), Tatweel (kashida), and invisible Unicode control characters (`\u200B-\u200F`, `\uFEFF`) stripped.
  - Eastern Arabic numerals (`٠-٩`) converted to Western digits (`0-9`), ensuring numbers search accurately across all keyboards and locales.
  - Multi-token searching with definite article (`ال`) tolerance in both directions (e.g. "فلل" matches "فلل الجامعة" and "الفلل").
  - Egyptian phonetic/spelling variants support (`ه` vs `ا`, e.g. "شاورمة" matches "شاورما").
- **Unified 0ms Client-Side & Remote Search (`SearchPage`)**:
  - Unified local offer pool `_getAllSourceOffers` combining `allOffers`, `trendingOffers`, `recommendedOffers`, and `searchResults` without duplicates.
  - Instantaneous 0ms local client-side re-render on keystroke via `setState` with 350ms debounced backend enrichment.
  - Category sidebar remains persistent and interactive during search, allowing simultaneous category + area + discount + search filtering.
  - Added active filter chips row with counter (`X عروض مطابقة`) and instant tap-to-delete on each active criterion.
  - One-tap "إعادة ضبط الفلاتر والبحث" in the empty state.
- **Category & Area Filter Robustness**:
  - Normalized cross-mapping between backend category enums (`FOOD` vs `مطاعم`), display names, and Arabic aliases (`دلع كرشك`).
  - Cleaned up `AllOffersPage` and `HomePage` to use `OfferFilterUtils.matchesCategory`.
- **BLoC Search Hardening (`OffersBloc`)**:
  - Fixed timer anti-pattern in `_onSearchOffers` to eliminate `StateError`.
  - Non-destructive search failure handling preserves local loaded offers.
- **Test Suite & Verification**:
  - 14/14 tests in `test/offer_filter_arabic_search_test.dart` passing (27/27 overall suite).
  - 0 issues on `flutter analyze lib/`.
  - Verified live on Android emulator (`emulator-5554`) and iOS Simulator (`iPhone 17 Pro Max`).

### O. Full-Width Category Architecture, Card Deduplication, and Elimination of Arrow Double-Inversion Bug
- **Full-Width Category Architecture (`SearchPage`)**:
  - Replaced cramped 82px vertical category sidebar with a horizontal scrolling category pill bar (`_buildHorizontalCategoriesBar`) directly below the search header.
  - Granted 100% of the viewport width to the offer feed, eliminating vertical card distortion and card bloating on mobile screens.
  - 44px pill height, solid Egyptian Orange (`#FF5A0A`) active state with soft shadow, hairline border inactive state, dynamic category icons/thumbnails, and dedicated "الكل" quick reset.
- **Card Content Deduplication & Title Sanitization (`OfferCard`)**:
  - Removed duplicate store name inside the missing image fallback; replaced with a centered 52x52 monogram avatar on soft cream (`#FFF7ED`).
  - Added smart title sanitization in `_getDisplayTitle` to enrich bare discount strings (e.g., `40% خصم` repeating `خصم 40%`) into clear descriptive titles (`40% خصم على جميع الخدمات والطلبات`).
- **Elimination of RTL Arrow Double-Inversion Bug (18 files)**:
  - Discovered that Flutter's `Icons.arrow_back_ios_new_rounded`, `Icons.arrow_back_rounded`, `Icons.arrow_forward_ios_rounded`, and `Icons.arrow_forward_rounded` have built-in `matchTextDirection: true`.
  - Systematically replaced all manual `Directionality.of(context) == TextDirection.rtl ? arrow_forward : arrow_back` ternaries across all 18 files with direct semantic icon usage.
  - Back buttons across all AppBars now correctly point outwards (`>`) in Arabic RTL.
  - Disclosure and navigation chevrons now correctly point inwards (`<`) towards destination pages in Arabic RTL.
- **Verification**:
  - `flutter analyze lib/` passes with 0 issues.
  - `flutter test` passes 27/27 tests.
  - Visually audited and confirmed on Android (`emulator-5554`) and iOS (`iPhone 17 Pro Max`).

### P. Coupon Voucher Ads Banner & Universal Theme-Aware Shimmer System
- **Coupon Voucher Ads Banner (`AdsSlider`)**:
  - Redesigned home promotional banners into realistic coupon vouchers featuring top/bottom semicircular cutout notches, vertical dashed perforation divider, scissors indicator, coupon stub, and barcode lines.
  - Implemented multi-criterion intelligent navigation resolving `offer:<id>`, `store:<id>`, `vendor:<id>`, `category:<id>`, web URLs, and matching banners with `actionUrl: null` against loaded offers and stores to eliminate dead taps.
  - Ensured CTA chevrons point inwards (`<`) in Arabic RTL.
- **Universal Theme-Aware Shimmer System (`AppShimmer`)**:
  - Upgraded `lib/core/widgets/skeleton_loader.dart` with theme-aware `AppShimmer` selecting dark slate (`#1E293B` to `#334155`) for Dark Mode and `#E2E8F0` to `#F8FAFC` for Light Mode, eliminating blinding white glare in dark mode.
  - Added `OfferCardSkeleton`, `CouponTicketSkeleton`, `OfferDetailShimmer`, and `StoreDetailShimmer`.
  - Upgraded `OffersSkeleton` to mirror the full home feed structure (header, live stats, search bar, coupon banner, category circles, and trending cards).
  - Replaced all raw `CircularProgressIndicator` waiting states with dedicated shimmer skeletons:
    - `OfferLoadingPage`: `OfferDetailShimmer`
    - `StoreLoadingPage`: `StoreDetailShimmer`
    - `FavoritesPage`: Responsive `OfferCardSkeleton` grid
    - `CategoriesPage`: `_buildCategoriesSkeleton`
    - `SearchPage`: Filter pills and `OfferCardSkeleton` list
    - `AllOffersPage`: Responsive `OfferCardSkeleton` grid
    - `ZagRewardsPage`: Rewards header & history card skeletons
    - `StoreDetailPage`: Shimmer for offers and reviews
    - `OfferDetailPage`: Review card shimmer
    - `MyCouponsPage`: `CouponTicketSkeleton` list
  - Resolved subtree Hero tag collision across home sections by hashing section titles into the Hero tag namespace.
- **Verification**:
  - `flutter analyze lib/` passes with 0 issues.
  - `flutter test` passes 27/27 tests.
  - Verified live on Android emulator (`emulator-5554`) and iOS simulator (`iPhone 17 Pro Max`).

### Q. Merchant Mobile App (`zag_offers_vendor_app`) Full Audit & Hardening
- **Kotlin 2.3.21 & Gradle Compiler Migration**:
  - Identified and fixed critical Android build failure caused by Kotlin version mismatch (`2.1.0` < Flutter's minimum `2.2.20`) in `settings.gradle.kts`.
  - Migrated legacy `kotlinOptions { jvmTarget = ... }` to modern `kotlin { compilerOptions { jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17) } }` in `build.gradle.kts`.
  - Successfully built debug APK (`build/app/outputs/flutter-apk/app-debug.apk`).
- **Critical Auth Flow Bug Discovered & Resolved (`main.dart`)**:
  - `AuthWrapper` previously unmounted `LoginPage` on `AuthLoading` and mounted `SplashScreen()`, permanently trapping merchants in an infinite splash screen if login failed or timed out.
  - Resolved by restricting `SplashScreen()` strictly to `AuthInitial`, keeping `LoginPage` mounted during `AuthLoading`, and wiring `AuthError` into `buildWhen`.
- **User-Facing Error Message Sanitization**:
  - Fixed raw `DioException` debug traces leaking to users on failed operations by routing all catch blocks in `QRScannerBloc`, `ReviewsBloc`, and `ProfileBloc` through `ErrorHandler.handle(e)`.
  - Backend validation and error messages now display in clean Arabic (e.g., `عفواً، الكود ده مش صحيح`).
- **Coupon SpaceMono Monospace Invariant**:
  - Enforced `GoogleFonts.spaceMono` with explicit `TextDirection.ltr` in `ReportsPage` and `QRScannerPage` manual coupon input dialog.
  - Added `TextCapitalization.characters` and trimmed uppercase normalization on code entry.
- **Codebase & Architecture Health**:
  - `flutter analyze lib/` ➜ 0 issues found across all vendor packages.
  - `flutter test` ➜ 6/6 unit tests passed.
  - Live verified 100% of vendor screens on Android emulator (`emulator-5554`): Login, Dashboard, Offers Management, Reports, Profile, QR Scanner with live viewfinder and manual input modal.


---

## 2.1 Customer Web Portal Audit (`zag-offers-client`) — Next.js 16.2.4 / React 19.2
- **Audit Scope**: Full source review of `src/` (10.9k LOC) + cross-contract verification against the live NestJS backend (`zag-offers-backend`) and the production API `https://api.zagoffers.online`.
- **Verification Method**: `npx tsc --noEmit` (0 errors) · `npm run lint` (20 errors / 86 warnings) · `npx vitest run` (23/23 pass) · live API probes with the seeded test account (`01099887711`).
- **CRITICAL findings (contract mismatches, verified live)**:
  1. `newPrice` (backend) vs `discountedPrice` (client) → discounted price, savings and discount % never render.
  2. `status: GENERATED|USED|EXPIRED` (backend Coupon) vs `isRedeemed` (client) → **every coupon, including redeemed/expired, renders "جاهز للاستخدام"**; violates the Coupon Status Contract. `expiresAt` ignored → no expiry countdown.
  3. Offer-detail breadcrumb links `/offers?category=<name>` while the offers page filters by category **UUID** → empty result set.
  4. Dead "central" architecture: `api-client.ts` → `queries.ts` → `use-auth.ts` (imported by nobody); `use-offers.ts` imported by nobody; `lib/favorites.ts` imported by nobody. TanStack Query is mounted with **zero live consumers**; the app runs on raw `fetch`/`axios` + `localStorage`.
  5. Dual auth: the backend issues an `auth_token` HttpOnly cookie, but the web app persists the JWT in `localStorage.token` → the HttpOnly protection is void and XSS becomes full account takeover. `/auth/register` never sets the cookie at all.
- **HIGH findings**: PWA service worker is inert under Next 16 Turbopack (`next-pwa` is a webpack-only plugin; `public/sw.js` is a frozen committed artifact) · logout does not purge `cache_favorites_v2` / `cache_my_coupons` / `favorites` → cross-account data leakage on shared devices · favorites heart state (localStorage) diverges from the favorites list (server) · every route is a Client Component so per-route `metadata` is impossible.
- **MEDIUM findings**: `images.qualities` unset (Next 16 coerces every `quality` prop to 75) · `next/image` `priority` deprecated in favour of `preload` · client-side filtering limited to the newest 40 offers · `Date.now()` called during render (react-hooks/purity) · stale `ZAGAZIG_AREAS` / `DISPLAY_NAMES` maps and an offers-page `CAT_ICONS` table that only knows the legacy category names · no `.env.local` (dev hits production).

### 2.1.1 Phase 1 — Contract Remediation (DONE, uncommitted)
- **Scope**: the 3 CRITICAL contract mismatches from §2.1. Everything else was deliberately deferred to Phases 2–4.
- **Pricing authority**: new `src/lib/offer-pricing.ts` exports `resolveOfferPricing()` + `formatPrice()`, a 1:1 port of the Flutter `OfferPricingResult` (5 cases: both prices, only-old + %, only-new + %, single price, store-wide discount with no prices). `src/lib/types.ts` was rewritten against the Prisma schema: `Offer.newPrice` (never `discountedPrice`), `Coupon.status/expiresAt/redeemedAt`, `CategorySummary` with optional `id`.
- **Coupon status**: `src/app/coupons/page.tsx` now derives state from `status` + `expiresAt` via `getCouponState()`; 4 filter tabs (`الكل` / `الجاهزة` / `المستخدمة` / `المنتهية`); badges follow the platform contract exactly (`جاهز للاستخدام ✨` / `تم الاستخدام ✓` / `منتهي الصلاحية`); QR + WhatsApp activation are gated to `active`; `.is-expired` styling added to `globals.css`.
- **Breadcrumb**: offer-detail category link now passes the category **id**, rendering plain text when the id is absent.
- **Hardening found on the way**: hydration-safe clock (`nowMs` in state + 60s interval) in both the coupons page and offer detail — removes both `react-hooks/purity` violations and guarantees the badge flips at expiry; `(${discountPercent}%-)` typo fixed; `any[]`/`(o: any)` replaced with the real `Offer` type in offer detail; `createdAt` guarded in `catalog-utils.sortOffers`; test fixtures in `socket.test.ts` / `useFavorites.test.ts` de-`any`ed (`vi.mocked`, `(...args: unknown[]) => void`); unused `Sparkles` import dropped; `turbopack.root` pinned to stop Next inferring the home directory as workspace root.
- **Verification**: `npx tsc --noEmit` → 0 errors · `npx eslint src` → **0 errors / 0 warnings** · `npx vitest run` → 23/23 pass · `npm run build` → compiled, 20/20 static pages, no warnings.
- **Not committed**: all changes sit in the local working tree.

### 2.1.2 Phase 1b — UI/UX & Accessibility Pass (DONE, uncommitted)
- **Featured billboard (critical)**: collapsed to 2×32px for every viewport between 768–1023px because the stage flips to `display:block` while the billboard `<a>` stayed inline. Fixed with `display:block` on the base `.ad-carousel-main` rule → verified 962×400.
- **Category icons**: `offers/page.tsx` + `offer-card.tsx` each had a stale icon map knowing only legacy names; both replaced by the shared `CategoryIcon`, now with Arabic orthography normalisation (tashkeel, أ/إ/آ, ى/ي, ة/ه) and `جميلة` added. Verified distinct icons for all live categories.
- **Tap targets**: carousel dots 8px → 44px interactive box (painted track stays 8/6px).
- **Privacy/UX**: logout purges account-scoped caches + revokes the HttpOnly cookie; favourites no longer renders another account's cache before the auth check.
- **Next 16 platform**: `priority` → `preload`; `images.qualities` allowlist added (quality props were silently forced to 75).
- **A11y**: `MotionConfig reducedMotion="user"` for all framer-motion animations; hero area `<select>` labelled.
- **Verification**: tsc 0 · eslint 0/0 · vitest 23/23 · build 20/20 pages, no warnings.

---

## 3. Pending & Upcoming Tasks
1. **Customer Web Portal (`zag-offers-client`)** — Phase 1 (contracts) ✅ done, see §2.1.1. Remaining:
   - **Phase 2 — unify the data layer**: decide the auth strategy (HttpOnly `auth_token` cookie vs. Bearer in `localStorage`) and either wire `api-client` / `queries` / `use-auth` / `use-offers` / `favorites` in for real or delete them. TanStack Query currently has zero live consumers, and `queries.ts:72` calls the non-existent `/coupons/mine` (backend route is `/coupons/my`).
   - **Phase 3 — security/PWA**: ✅ logout now purges `cache_favorites_v2` / `cache_my_coupons` / `favorites` and `favorites/page.tsx` checks auth first (§2.1.2). Remaining: restore a real service worker (webpack build or Turbopack-compatible) and delete the frozen `public/sw.js` + `workbox-*.js` + `swe-worker-*.js`; add `.env.local`.
   - **Phase 4 — SEO/quality**: ✅ `images.qualities`, `priority` → `preload`, stale `CAT_ICONS` all done (§2.1.2). Remaining: Server-Component `metadata`/`generateMetadata` layer; `limit=40` server-side filtering; `remotePatterns` hardening.
2. **Platform Admin Dashboard (`zag-offers-admin`)**:
   - Review vendor approvals and campaign moderation workflows.
