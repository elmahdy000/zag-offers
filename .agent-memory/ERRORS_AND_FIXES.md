# Zag Offers — Errors, Root Causes & Prevention Rules

## 1. Dart `intl` Package Shadowing Flutter's `TextDirection`
- **Error**: `The getter 'rtl' isn't defined for the type 'TextDirection'` when writing `Directionality.of(context) == TextDirection.rtl`.
- **Root Cause**: The `intl` package exports its own `TextDirection` class with uppercase enum values (`TextDirection.LTR`, `TextDirection.RTL`), shadowing Flutter's `dart:ui` / `material` `TextDirection` enum (`TextDirection.ltr`, `TextDirection.rtl`).
- **Fix**: Always hide `TextDirection` when importing `intl`:
  ```dart
  import 'package:intl/intl.dart' hide TextDirection;
  ```
- **Prevention Invariant**: Any Flutter file using both `intl` and `Directionality` or `TextDirection` must use the `hide TextDirection` modifier.

---

## 2. Unmounted `BuildContext` After `Navigator.popUntil`
- **Error**: Modal or subpage tries to switch tabs on `MainScreen` after calling `Navigator.popUntil(context, (route) => route.isFirst)`, but the tab does not switch.
- **Root Cause**: Calling `popUntil` deactivates the local route's `BuildContext`. Any subsequent call using that context fails. Furthermore, pushed routes in the overlay do not have `MainScreen` as an ancestor.
- **Fix**: Use `NavigationService.navigatorKey`:
  ```dart
  Navigator.popUntil(context, (route) => route.isFirst);
  Future.delayed(const Duration(milliseconds: 150), () {
    final rootContext = NavigationService.navigatorKey.currentContext;
    if (rootContext != null && rootContext.mounted) {
      // ignore: use_build_context_synchronously
      MainScreen.of(rootContext)?.setSelectedIndex(targetIndex);
    }
  });
  ```
- **Prevention Invariant**: Cross-feature and root navigation from modal sheets must always route through `NavigationService.navigatorKey`.

---

## 3. Class Scope Intrusion from Unclosed Method Braces
- **Error**: `Classes can't be declared inside other classes` and 80+ cascading getter errors on helper classes declared at the bottom of a page file (e.g., `_AddReviewSheet`).
- **Root Cause**: A code replacement in a method higher up left an extra `{` or missing `}`, causing the enclosing state class to remain unclosed, swallowing subsequent classes into the class body.
- **Fix & Detection**: Verify brace depth across the file:
  ```bash
  python3 -c "
  with open('path/to/file.dart') as f:
      depth = 0
      for i, l in enumerate(f, 1):
          depth += l.count('{') - l.count('}')
      print('Final depth:', depth)
  "
  ```
- **Prevention Invariant**: Final brace depth of any Dart file MUST equal `0`. Run `flutter analyze` immediately after edits.

---

## 4. Single Strikethrough Price Without Discounted Counterpart
- **Error**: Offer details displayed an old price with strikethrough (e.g. `3000 ج.م` struck out) with no current price next to it because `newPrice` in DB was null.
- **Root Cause**: Strikethrough was unconditionally tied to `hasOldPrice` rather than the existence of both an old price AND a lower new price.
- **Fix**: Calculate `effectiveNewPrice = oldPrice * (1 - discountPercentage / 100)` when only `oldPrice` and `discountPercentage` exist. Only apply strikethrough if `effectiveOldPrice > effectiveNewPrice`.

---

## 5. Touch Event Interception by Full-Screen Stack Overlays
- **Error**: Tapping on the hero image carousel in `OfferDetailPage` failed to trigger the full-screen modal GestureDetector.
- **Root Cause**: A `DecoratedBox` providing a subtle top/bottom gradient overlay was placed above `PageView` inside the `Stack` without `IgnorePointer`, capturing touch gestures.
- **Fix**: Wrap visual overlays, gradients, and non-interactive indicators inside `IgnorePointer`:
  ```dart
  const IgnorePointer(
    child: DecoratedBox(decoration: BoxDecoration(...)),
  )
  ```
- **Prevention Invariant**: Any decorative element or container placed on top of interactive widgets in a `Stack` MUST be wrapped in `IgnorePointer`.

---

## 6. RTL Inversion of ASCII Fraction Counters and Enclosed Percentages
- **Error**: Gallery counters rendered as `3 / 1` instead of `1 / 3`, and savings percentages inverted parenthesis placement.
- **Root Cause**: BiDi algorithm flips characters when ASCII numerals and slashes or parentheses appear in an Arabic RTL paragraph context.
- **Fix**: Enforce `textDirection: TextDirection.ltr` on all fraction and percentage tokens:
  ```dart
  Text('${currentIndex + 1} / ${images.length}', textDirection: TextDirection.ltr)
  ```
- **Prevention Invariant**: Any numeric label containing slashes, hyphens, or brackets must explicitly declare `TextDirection.ltr`.

---

## 7. Gesture Collisions with Nested Buttons Inside `BouncyTap`
- **Error**: Double taps or ink splash artifacts occurring when tapping action buttons (e.g. "طريق الوصول").
- **Root Cause**: An `ElevatedButton` or `OutlinedButton` with its own `onPressed` handler was placed inside a `BouncyTap(onTap: ...)`, causing two competing gesture recognizers to fire concurrently.
- **Fix**: Use a decorated `Container` inside `BouncyTap` directly instead of nesting Material buttons.
- **Prevention Invariant**: Never nest `ElevatedButton`, `OutlinedButton`, or `InkWell` inside `BouncyTap`. Style a `Container` child directly.

---

## 8. WhatsApp Deep Link Failures on Local Egyptian Numbers
- **Error**: WhatsApp link `https://wa.me/01012345678` fails to open chat on mobile or shows "phone number shared via url is invalid".
- **Root Cause**: WhatsApp URL scheme requires international format without leading zeros or punctuation (e.g. `201012345678`). Local Egyptian numbers typically start with `01`.
- **Fix**: Sanitize using `_cleanWhatsAppNumber()` regex to prepend `20` and strip the leading `0`.
- **Prevention Invariant**: Always normalize Egyptian phone strings to E.164 without leading plus (`201xxxxxxxxx`) for `wa.me` links.

---

## 9. RenderFlex Overflow in Adaptive Card Grids with Sidebars
- **Error**: `RenderFlex overflowed by 60/76 pixels on the bottom` on `SearchPage` when category sidebar occupies 96px width.
- **Root Cause**: Hardcoded 2-column grid with rigid `childAspectRatio: 0.67` left only ~135px card width, making cards taller than available vertical space.
- **Fix**: Use responsive breakpoints: when available content width `< 340px`, switch to 1 column with `childAspectRatio: 0.88`. Inside `OfferCard`, wrap info column in `LayoutBuilder` + `FittedBox(fit: BoxFit.scaleDown)` and price/CTA in `Flexible(flex: 0)`.
- **Prevention Invariant**: Any grid sharing horizontal space with a persistent drawer/rail MUST calculate columns and aspect ratios from `LayoutBuilder.maxWidth`, not raw `MediaQuery.sizeOf(context).width`.

## 10. Sheet Translation Overlap Colliding with Gallery Thumbnails
- **Error**: Gallery thumbnails in `OfferDetailPage` appeared wedged directly against the bottom edge of the hero image with zero breathing room.
- **Root Cause**: The content sheet used `Transform.translate(offset: Offset(0, -28))` while its internal container top padding was only `18px`, placing the top of the thumbnail strip `-10px` above the hero bottom line.
- **Fix**: Moderate overlap to `Offset(0, -20)`, provide `22px` top padding on the sheet, and add `14px` top padding to `_buildThumbnailsRow()`, creating 20px+ of clean visual space.
- **Prevention Invariant**: When applying negative vertical translation for overlapping card sheets, the first child's effective visual offset (`paddingTop - translationOffset`) MUST exceed `12px`.

---

## 11. Arabic Search & Filters Invariance Breakdown
- **Error**: Searching in Arabic failed or cleared the screen with "لم نعثر على نتائج مطابقة"; filters (category sidebar, area, minimum discount) broke or disappeared when typing in the search bar.
- **Root Cause**:
  1. `_getCurrentSourceOffers` reset to empty list when typing because `state.searchResults` was initially `null`, wiping loaded offers instantly.
  2. `OfferFilterUtils.apply` was called without `searchQuery`, relying solely on backend API without client-side normalization.
  3. Strict exact string matching on categories (`offer.store.category == _selectedCategory`) failed for English enums (`FOOD` vs `مطاعم`) and Arabic display aliases (`دلع كرشك`).
  4. Lack of Arabic normalization caused queries with Alef variants (`أ`, `إ`, `آ`), Taa Marbuta (`ة`), Yaa/Alef Maksura (`ى`/`ي`), Tashkeel, Eastern numerals (`٠-٩`), and definite article `ال` to miss matching offers.
  5. The category sidebar was hidden when `_searchController.text.isNotEmpty`, preventing users from filtering categories during search.
  6. In `OffersBloc`, an unawaited `Timer` in `_onSearchOffers` caused `StateError: emit was called after an event handler completed normally`, and search failures wiped the screen with `OffersError`.
- **Fix**:
  1. Built a comprehensive Arabic normalization engine in `OfferFilterUtils` covering Alefs, Taa Marbuta, Yaa/Alef Maksura, Waw with Hamza, Tashkeel, Tatweel, Eastern numerals (`٠-٩` to `0-9`), and invisible control characters.
  2. Implemented bidirectional token matching with definite article (`ال`) tolerance and Egyptian spelling variants (`ه` vs `ا`).
  3. Integrated `_getAllSourceOffers` combining `allOffers`, `trendingOffers`, `recommendedOffers`, and `searchResults` deduplicated by ID.
  4. Enabled 0ms immediate client-side filtering via `setState` on keystroke with 350ms debounced backend enrichment.
  5. Preserved the persistent category sidebar and added active filter indicator chips with instant one-tap removal.
  6. Fixed `OffersBloc` search handler to be safe and non-destructive.
- **Prevention Invariant**:
  - Always normalize Arabic search inputs using `OfferFilterUtils.normalizeArabic`.
  - Never discard already-loaded local offers while waiting for remote search API responses.
  - Never use raw `==` string equality for categories or areas; use `OfferFilterUtils.matchesCategory` and `OfferFilterUtils.matchesArea`.

---

## 12. Android Emulator Suppressing Soft Keyboard & Missing Arabic IME
- **Error**: User unable to type Arabic in Android Emulator search field ("ليه مش قابل العربي"); on-screen keyboard doesn't appear when tapping text fields, and host physical keyboard sends raw QWERTY scan codes resulting in discarded or English-only input.
- **Root Cause**:
  1. Android detects the host computer's keyboard as an active physical keyboard and sets `secure show_ime_with_hard_keyboard = 0`, suppressing the virtual soft keyboard entirely.
  2. The default emulator system locale is `en-US` with Gboard only having English (US) subtype configured, lacking Arabic physical or soft keyboard mappings.
- **Fix**:
  1. Enable soft keyboard with hard keyboard:
     ```bash
     adb shell settings put secure show_ime_with_hard_keyboard 1
     ```
  2. Set device locale to Arabic Egypt:
     ```bash
     adb shell cmd locale set-device-locale ar-EG
     ```
  3. Enable Gboard with Arabic (`ar-EG` / `LatinIME`).
- **Prevention Invariant**: When initializing or testing Flutter apps on Android emulators in Arabic RTL mode, always ensure `show_ime_with_hard_keyboard` is set to `1` and Arabic locale/keyboard subtype is enabled.

---

## 15. RTL Arrow Double-Inversion Bug (Back Buttons Pointing Inward & Disclosures Pointing Backward)
- **Symptom**: In Arabic RTL layout, back buttons in AppBars pointed leftwards (`<`) into the screen rather than outwards/rightwards (`>`), and menu/card disclosure chevrons pointed rightwards (`>`) away from destination pages rather than leftwards (`<`).
- **Root Cause**: Developers wrote `Directionality.of(context) == TextDirection.rtl ? Icons.arrow_forward_ios_rounded : Icons.arrow_back_ios_new_rounded` under the assumption that Flutter icons are static. However, `Icons.arrow_back_ios_new_rounded`, `Icons.arrow_back_rounded`, `Icons.arrow_forward_ios_rounded`, and `Icons.arrow_forward_rounded` have `matchTextDirection: true` in the Flutter SDK. Because of this, Flutter automatically applied horizontal mirroring on top of the manual ternary swap, resulting in a double inversion.
- **Resolution**: Removed all manual `Directionality.of(context)` checks across all 18 files in `zag_offers_app`, directly specifying `Icons.arrow_back_ios_new_rounded` / `Icons.arrow_back_rounded` for back navigation and `Icons.arrow_forward_ios_rounded` / `Icons.arrow_forward_rounded` for forward/disclosure navigation. Verified across Android emulator and iOS simulator.
- **Prevention Invariant**: Never manually invert icons that declare `matchTextDirection: true`. Semantic back actions always use `arrow_back_*`; semantic forward/disclosure actions always use `arrow_forward_*`.

---

## 16. Multiple Heroes Sharing the Same Tag Within a Subtree Across Feed Sections
- **Symptom**: `There are multiple heroes that share the same tag within a subtree` thrown during home feed rendering or navigation.
- **Root Cause**: In `home_page.dart`, `_buildOffersSectionWidget` was reused across "الأكثر انتشارًا", "مقترح لك", and multiple category sections ("ركن الأكل", "روقان"). All sections constructed their Hero tags with a static prefix: `'home_trending_${offer.id}_$index'`. When an offer appeared in more than one section (e.g. at index 0 of "الأكثر انتشارًا" and index 0 of "ركن الأكل"), both widgets in the active subtree possessed the identical tag `'home_trending_<id>_0'`, triggering Flutter's Hero assertion.
- **Resolution**: Updated `cardHeroTag` generation in `_buildOffersSectionWidget` to incorporate a hash of the section title (`'home_${title.hashCode}_${offer.id}_$index'`), strictly isolating the Hero tag namespace across separate sections.
- **Prevention Invariant**: Whenever rendering card lists in composite screens where items can belong to multiple sections, always prefix the Hero tag with a unique section identifier or section title hash.

---

## 17. Kotlin Gradle Plugin & JVM Target Migration in Vendor App
- **Symptom**: `flutter build apk` in `zag_offers_vendor_app` failed with:
  `Error: Your project's Kotlin version (2.1.0) is lower than Flutter's minimum supported version of 2.2.20` followed by `Using 'jvmTarget: String' is an error. Please migrate to the compilerOptions DSL`.
- **Root Cause**:
  1. `android/settings.gradle.kts` locked `org.jetbrains.kotlin.android` to `2.1.0`, below the modern Flutter engine requirement (minimum `2.2.20`).
  2. In `android/app/build.gradle.kts`, the legacy `kotlinOptions { jvmTarget = ... }` DSL was deprecated and causes a hard compilation error in Kotlin 2.x+.
- **Resolution**:
  1. Updated `org.jetbrains.kotlin.android` to `2.3.21` in `android/settings.gradle.kts` (matching `zag_offers_app`).
  2. Migrated `build.gradle.kts` to the modern `kotlin { compilerOptions { jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17) } }` DSL.
  3. Added `android.builtInKotlin=false` and `android.newDsl=false` in `gradle.properties`.
- **Prevention Invariant**: Across all Flutter sub-apps in this repository, always align Kotlin Android plugin to `2.3.21` and use `kotlin.compilerOptions` DSL targeting `JVM_17`.

---

## 18. Web Client Rendered the Wrong Coupon Status (Contract Drift on `isRedeemed`)
- **Symptom**: On `zag-offers-client`, every coupon in the wallet rendered **"جاهز للاستخدام"** — including coupons the merchant had already redeemed and coupons past their expiry date.
- **Root Cause**: The backend `Coupon` model exposes `status: CouponStatus` (`GENERATED | USED | EXPIRED | CANCELLED`) plus `expiresAt` / `redeemedAt`. The web client declared `interface Coupon { isRedeemed: boolean }` and branched on it. `isRedeemed` is not a field on the response, so it was always `undefined`, and `!undefined === true` classified every coupon as "active". The client also ignored `expiresAt` entirely, so no countdown was ever rendered.
- **Resolution**: **Fixed** (Phase 1). `src/app/coupons/page.tsx` now types coupons from `src/lib/types.ts` (`status`, `expiresAt`, `redeemedAt`) and derives state through `getCouponState()` → `active | used | expired`. Labels are exactly the platform contract (`جاهز للاستخدام ✨`, `تم الاستخدام ✓`, `منتهي الصلاحية`); a 4th `المنتهية` tab was added; QR codes and the WhatsApp activation button are gated to `active` coupons; `.is-expired` styling added in `globals.css`.
- **Prevention Invariant**: Any field the web client branches on MUST be verified against the live API response body before use. Never invent a boolean mirror of an enum without confirming the server actually sends it.

---

## 19. Web Client Read `discountedPrice` While the Backend Sends `newPrice`
- **Symptom**: The discounted (final) price never appeared on offer cards or the offer detail page; savings and the computed discount percentage were always `null`; only the struck-through original price rendered.
- **Root Cause**: `Prisma.model Offer` names the field `newPrice`. The web client's `Offer` type declared `discountedPrice`, and every price branch (`offer-card.tsx`, `offers/[id]/page.tsx`) read `offer.discountedPrice`. `tsc` passed because both types are locally declared — TypeScript cannot detect a wire-format mismatch on its own.
- **Resolution**: **Fixed** (Phase 1). `src/lib/offer-pricing.ts` is now the single pricing authority (`resolveOfferPricing` + `formatPrice`), a 1:1 port of the Flutter `OfferPricingResult`. `types.ts` / `offer-card.tsx` / `offers/[id]/page.tsx` all read `newPrice`; the `${discountPercent}%-` typo became `${discountPercent}%`.
- **Prevention Invariant**: Run a live API probe (`curl` the production endpoint) and diff the real response keys against the client type before trusting a typed client. Consider generating client types from the backend OpenAPI/Prisma schema.

---

## 20. Offer-Detail Category Breadcrumb Filtered by Name While the Page Filters by UUID
- **Symptom**: Clicking the category name in the offer-detail breadcrumb navigated to `/offers` and rendered zero offers.
- **Root Cause**: `offers/[id]/page.tsx` linked to `/offers?category=<category.name>`, but `offers/page.tsx` treats the `category` URL parameter as a **category id** and filters client-side via `filterOffers({ categoryId })`, which compares against `offer.store.category?.id` (a UUID). A name never matches a UUID.
- **Resolution**: **Fixed** (Phase 1). The breadcrumb now emits `?category=<id>` and degrades to plain text when `store.category.id` is missing.
- **Prevention Invariant**: A single URL parameter must always carry a single kind of identifier. Define its semantics once (name or id) and reuse it from every producer.

---

## 21. Next.js 16 Turbopack Silently Disabled the PWA Service Worker
- **Symptom**: The production site ships a service worker whose cache rules no longer match `next.config.ts`; offline caching stopped updating, and every `workboxOptions.runtimeCaching` entry is dead configuration.
- **Root Cause**: `@ducanh2912/next-pwa` only installs a **webpack** hook (`config.webpack`) that generates `sw.js` / `workbox-*.js` / `swe-worker-*.js`. Next.js 16 builds with Turbopack by default, and the Turbopack path never calls `config.webpack`. Setting `turbopack: {}` in `next.config.ts` silences the "webpack config without turbopack config" error, so the plugin is skipped without any warning. The stale artifacts committed under `public/` made the failure invisible.
- **Resolution**: Not yet fixed (deferred to Phase 3).
- **Prevention Invariant**: In Next.js 16, any webpack-only plugin (PWA, custom loaders) requires an explicit `--webpack` build, or the plugin must be replaced with a Turbopack-compatible service worker. Never commit generated `sw.js` / `workbox-*.js` into `public/`.

---

## 22. `Date.now()` Called During Render Broke `react-hooks/purity` (and Expiry Never Flipped)
- **Symptom**: `eslint src` reported `react-hooks/purity` errors in `offers/[id]/page.tsx` and `coupons/page.tsx`. Worse, the countdown/expiry logic was computed once per render from `Date.now()`, so a coupon whose `expiresAt` passed while the tab stayed open kept rendering as "جاهز للاستخدام" until any unrelated re-render happened.
- **Root Cause**: Reading the wall clock inside the component body. The value is neither state nor props, so React has no reason to re-render when it changes, and React 19's purity lint correctly flags the read.
- **Resolution**: **Fixed** (Phase 1). Both pages hold `const [nowMs, setNowMs] = useState(0)` and a mount effect that sets it immediately then on a 60s `setInterval` (cleared on unmount). Derived values are `null` while `nowMs === 0` (pre-effect / SSR), so labels degrade to neutral copy ("ساري ومتاح الآن") instead of flashing "منتهي الصلاحية".
- **Prevention Invariant**: Never read `Date.now()` (or `Math.random()`) in a render body. Put the clock in state, tick it from an effect, and make every derived value tolerant of "clock not mounted yet" — this also avoids hydration mismatches, since the server clock differs from the client clock.

---

## 23. Next Inferred the Wrong Workspace Root From a Stray `package-lock.json`
- **Symptom**: Every `next build` printed `Next.js inferred your workspace root, but it may not be correct. We detected multiple lockfiles and selected /Users/drelmahdy/package-lock.json`.
- **Root Cause**: A `package-lock.json` sitting in the user home directory made Next walk up past the project and pick `$HOME` as the workspace root. That root is used for file tracing and the dev watcher, so it can pull in unrelated `node_modules` and break standalone deployments.
- **Resolution**: **Fixed** (Phase 1). `next.config.ts` now sets `turbopack: { root: process.cwd() }`.
- **Prevention Invariant**: Any Next.js repo not at the filesystem root should pin `turbopack.root`; never rely on lockfile-based inference when a parent directory can contain a lockfile.

---

## 24. `any` / `Function` Types in Test Fixtures Kept the Lint Gate Red
- **Symptom**: After the Phase 1 contract fixes, `npx eslint src` still failed with `@typescript-eslint/no-explicit-any` and `@typescript-eslint/no-unsafe-function-type` in `src/lib/socket.test.ts` and `src/hooks/useFavorites.test.ts` — plus an unused `Sparkles` import and an unused `catch (e)` binding.
- **Root Cause**: Mocks written as `(io as any).mockReturnValue(...)`, `(fetch as any).mockResolvedValueOnce(...)` and `callback: Function`. `Function` accepts any callable, so the mocked handlers were untyped.
- **Resolution**: **Fixed** (Phase 1). `vi.mocked(io)` / `vi.mocked(fetch)` with a typed `Response` stub (`{ ok: true, json: async () => body } as unknown as Response`), a local `type SocketHandler = (...args: unknown[]) => void`, typed `FavoriteItem` / `ApiFavorite` interfaces, `catch {` instead of `catch (e) {`, and the unused `Sparkles` import removed. `npx eslint src` → 0 errors / 0 warnings.
- **Prevention Invariant**: Mock through `vi.mocked(fn)` (never `as any`); type callbacks as `(...args: unknown[]) => void`; keep the lint gate at zero so a real regression is never mistaken for pre-existing noise.

---

## 25. Coupon Code Was Squeezed/Truncated Once the QR Was Hidden
- **Symptom**: In the web coupon wallet, used and expired coupons rendered their code as two clipped lines (`ZAG-` / `...LRMY7`) with a large empty bordered box filling the row.
- **Root Cause**: `.coupon-ticket-code-row` declared a fixed 3-column grid (`72px 1fr auto`) sized for the QR + code + copy-button trio. The QR is only rendered for `active` coupons, so with two children CSS grid auto-placement shifted the code into the 72px column (→ ellipsis) and stretched the copy button across the `1fr` column (→ the empty box). Fixed column counts silently break whenever a child is conditionally rendered.
- **Resolution**: **Fixed** (Phase 1). The row is now `minmax(0,1fr) auto` by default and switches to `auto minmax(0,1fr) auto` only via a `has-qr` class that the JSX sets when the QR is actually rendered (base rule + all three media queries). `.coupon-code-copy strong` also gained `white-space:nowrap; direction:ltr; text-align:right` so codes stay on one line and strictly LTR per the platform contract.
- **Prevention Invariant**: Never size a CSS grid for the maximum number of children unless every child is always rendered. Drive the template from a state class, or use explicit `grid-column` assignments. Coupon codes must always render fully, on one line, and LTR — they are the actual transaction instrument.

---

## 26. Infinite Splash Screen Loop Trapping Merchants on Vendor Login (`zag_offers_vendor_app`)
- **Symptom**: In `zag_offers_vendor_app`, when a merchant submitted their login credentials, the screen immediately replaced the login form with `SplashScreen()` and got permanently stuck there if login took time or returned an error (e.g., incorrect password or network error).
- **Root Cause**: In `lib/main.dart`, `AuthWrapper` listened to `AuthLoading` and immediately rendered `SplashScreen()`. This destroyed and unmounted `LoginPage` from the widget tree. When the backend returned an `AuthError`, `AuthWrapper`'s `buildWhen` did NOT include `AuthError`, so `AuthWrapper` never rebuilt—leaving the merchant permanently trapped on an infinite splash screen while `LoginPage`'s internal SnackBar error listener was never triggered because the page had been unmounted.
- **Resolution**: Updated `AuthWrapper`'s `buildWhen` to handle `AuthAuthenticated`, `AuthUnauthenticated`, `AuthInitial`, and `AuthError`. Restricted `SplashScreen()` display strictly to `AuthInitial` (cold boot). During `AuthLoading`, `LoginPage` remains mounted and handles the loading state internally with its inline circular button spinner.
- **Prevention Invariant**: Never unmount or replace an active form with a full-screen splash loader during user-initiated actions. Skeletons and splash screens belong only to cold boots; active form pages must remain mounted and manage their own inline button loading and SnackBar error notifications.

---

## 27. Raw `DioException` Debug Traces Leaked in Vendor Dialogs & BLoCs
- **Symptom**: When redeeming an invalid coupon or experiencing an API error in `zag_offers_vendor_app`, dialogs and error banners displayed lengthy English debug text: `DioException [bad response]: This exception was thrown because the response has a status code of 404...`.
- **Root Cause**: `QRScannerBloc`, `ReviewsBloc`, and `ProfileBloc` caught exceptions with generic `catch (e)` and passed `e.toString().replaceAll('Exception: ', '')` directly into state error messages. Because `DioException`'s `toString()` includes internal RequestOptions and MDN HTTP explanations, raw library debug internals were dumped onto user screens.
- **Resolution**: Integrated `ErrorHandler.handle(e)` across `QRScannerBloc`, `ReviewsBloc`, and `ProfileBloc`. `ErrorHandler.handle()` cleanly parses backend error responses (extracting Arabic `message` strings such as `عفواً، الكود ده مش صحيح`) or translates status codes into polished Arabic messages.
- **Prevention Invariant**: Never pass raw `e.toString()` from BLoC catch blocks into user-facing states. Always route network errors through `ErrorHandler.handle(e)`.


---

## 26. Featured Billboard Collapsed to a 2×32px Sliver on Tablet Widths
- **Symptom**: Between 768px and 1023px the "عروض وإعلانات مميزة" hero billboard appeared as a thin vertical seam inside a 400px-tall empty block. Desktop and small-mobile looked fine, so it slipped through.
- **Root Cause**: `@media (max-width:1023px)` sets `.homepage .ad-carousel-stage { display:block }`, but `.ad-carousel-main` only became `display:block` at `max-width:767px`. The billboard is an `<a>` whose children (media, copy, counter) are all absolutely positioned, so as an inline element it collapsed to its 1px borders + line box = **2×32px**. A CSS grid silently stopped stretching it the moment the parent stopped being a grid.
- **Resolution**: `display:block` added to the base `.ad-carousel-main` rule (not the media query), so the billboard is block-level at every breakpoint. Verified 2×32 → 962×400 at a 1000px viewport.
- **Prevention Invariant**: A container whose children are all absolutely positioned must declare its own `display` and height. Never rely on grid/flex stretch as the only sizing mechanism for an `<a>`/`<span>`-based component.

---

## 27. Every Category Rendered the Same Icon on the Offers Page
- **Symptom**: All category group headers and chips on `/offers` showed the identical generic icon, while the home page and category cards showed correct per-category icons.
- **Root Cause**: Two separate, stale icon maps. `src/components/category-icon.tsx` (used by home/categories) knew the branded names, but `offers/page.tsx` and `components/offer-card.tsx` each kept their own copy that only knew the legacy names (`مطاعم`, `كافيهات`, …). The API returns branded names (`دلع كرشك`, `روقان`, `شياكة`, `فورمة`, `حلى بوقك`, `نعيماً`), so every lookup missed. On top of that, the map keys used different Arabic spellings than the API: `اون فاير` vs `أون فاير`, `نعيماً` vs `نعيما`, and `جميلة` was missing entirely.
- **Resolution**: Both stale maps deleted; both files now use the shared `CategoryIcon`. Lookups go through `normalizeLabel()` which strips tashkeel/tatweel and unifies alef/hamza, alef-maqsura and teh-marbuta forms. `جميلة` added to the map. Verified live: `حلى بوقك → cake-slice`, `جميلة → sparkles`, `طور نفسك → book-open` (previously all `package`).
- **Prevention Invariant**: One icon/label map per concept, referenced everywhere. Any map keyed by user/database text must be normalised (trim + Arabic orthography) on **both** sides of the lookup — otherwise pronunciation-level spelling differences silently degrade to the fallback.

---

## 28. Carousel Dots Were an 8px-Tall Tap Target
- **Symptom**: `axe`/manual mobile testing flagged the billboard pagination dots: four 30×8px buttons, effectively impossible to hit with a thumb.
- **Root Cause**: The track itself was the `<button>` (`height:8px`), and a mobile override forced `height:6px` on phones.
- **Resolution**: The button now owns a real 44px box (WCAG 2.5.5) and paints the 8px track through `::before`, with the progress fill as an absolutely-positioned `span`. Mobile keeps the 44px box and only the painted track shrinks to 6px. Verified: every dot measures 44px tall at both breakpoints.
- **Prevention Invariant**: Never use the visual size of a control as its hit area. If a control must look thin (dots, sliders, dividers), separate the painted track from the interactive box.

---

## 29. Logout Leaked the Previous Account's Coupons and Favourites
- **Symptom**: On a shared device, logging out and logging in as someone else could briefly show the previous user's saved offers/coupons.
- **Root Cause**: Two independent leaks. (a) `handleLogout` removed only `token` and `user`, leaving `cache_favorites_v2` and `cache_my_coupons` — both account-scoped — in `localStorage`. (b) `favorites/page.tsx` read `cache_favorites_v2` **before** checking whether a token existed, so an anonymous visitor rendered the cached account list before the "not logged in" branch ran.
- **Resolution**: Logout now clears `cache_favorites_v2`, `cache_my_coupons` and `favorites` and sends `credentials: 'include'` so the HttpOnly cookie is revoked too. The favourites page checks the token first and deletes `cache_favorites_v2` for anonymous visitors, reading only the public `favorites` key.
- **Prevention Invariant**: Classify every `localStorage` key as public or account-scoped. Account-scoped caches must be purged on logout **and** must never be read before the auth check resolves.

---

## 30. Next.js 16: `priority` Deprecated and `quality` Silently Forced to 75
- **Symptom**: No visible error, but LCP images were not preloaded as intended after the Next 16 upgrade, and every `quality={60|78|85|86}` prop was being ignored.
- **Root Cause**: Next 16 renamed the `<Image>` `priority` prop to `preload` (docs: `node_modules/next/dist/docs/.../image.md#preload`) and made `images.qualities` a **required** allowlist that defaults to `[75]`. Any other quality value is silently coerced.
- **Resolution**: `priority` → `preload` in `offer-card.tsx`, `brand-mark.tsx` and `page.tsx`. `next.config.ts` now declares `qualities: [60, 75, 76, 78, 85, 86]`.
- **Prevention Invariant**: After a major Next.js upgrade, re-read the affected component docs under `node_modules/next/dist/docs/` and diff every `next/image` prop. A silently coerced prop is worse than a rejected one.

---

## 31. `prefers-reduced-motion` Was Ignored by JS Animations
- **Symptom**: Users who enabled "reduce motion" still got every framer-motion slide/fade on the site.
- **Root Cause**: The `@media (prefers-reduced-motion: reduce)` block in `globals.css` only disabled four CSS keyframe animations; framer-motion animations run in JS and never consult the media query unless told to.
- **Resolution**: New `MotionProvider` (`<MotionConfig reducedMotion="user">`) wraps the app tree inside `layout.tsx`.
- **Prevention Invariant**: CSS media queries cannot reach JS animation libraries. When a design system uses framer-motion, the reduced-motion switch belongs in `MotionConfig`, not only in the stylesheet.

---

## 32. Double Bottom Padding Void in Vendor `MainLayout`
- **Symptom**: Massive 160px+ empty void above the bottom navigation bar on all vendor tabs (`Dashboard`, `Offers`, `Reports`, `Profile`).
- **Root Cause**: `Scaffold` already positions its body above the `bottomNavigationBar` by default unless `extendBody: true` is set. `main_layout.dart` was wrapping `IndexedStack` in `Padding(padding: EdgeInsets.only(bottom: 80))` while child sliver lists already included `SizedBox(height: 100)` at the bottom, compounding the padding into an empty gap.
- **Resolution**: Removed the outer `Padding` wrapper from `IndexedStack` in `main_layout.dart` and calibrated `BottomAppBar` height to 76px.
- **Prevention Invariant**: Never wrap `Scaffold(body: ...)` in bottom padding to account for `bottomNavigationBar`. Let `Scaffold` handle child body bounds.

---

## 33. Duplicate FAB Stacking and Tab Bar Spacing in `OffersPage`
- **Symptom**: Tapping the bottom bar or center scanner FAB in `OffersPage` caused visual conflict with a second nested green/orange floating action button. Tab bar had an unnecessary 100px preferred height causing massive blank space.
- **Root Cause**: `OffersPage` had an independent `FloatingActionButton(heroTag: 'offers_fab')` defined inside its own `Scaffold` which overlaid the parent `MainLayout` dock. Furthermore, `AppBar.bottom` had `preferredSize: const Size.fromHeight(100)`.
- **Resolution**: Removed the nested FAB from `offers_page.dart` and moved the offer creation trigger to an `IconButton` (`Icons.add_circle_outline_rounded`) inside `AppBar.actions`. Compacted `AppBar.bottom` height to `48px`.
- **Prevention Invariant**: Nested sub-pages mounted inside a master shell with a docked FAB must never declare their own `FloatingActionButton`. Primary actions belong in `AppBar.actions`.

---

## 34. Directional Inversion in RTL Badges and Dismissibles
- **Symptom**: On RTL Arabic layouts, notification swiping with `DismissDirection.endToStart` revealed an empty red container while the delete trash icon was positioned on the opposite (right) edge. Card status badges and thumbnails were also inverted.
- **Root Cause**: `notifications_page.dart` used physical `alignment: Alignment.centerRight` and `padding: EdgeInsets.only(right: 24)`. Card overlays used `Positioned(left: 12)`. In RTL, the "end" is the left edge, not right.
- **Resolution**: Converted all dismissible alignments to `AlignmentDirectional.centerEnd` and `EdgeInsetsDirectional.only(end: 24)`. Converted card badges and action overlays to `PositionedDirectional`.
- **Prevention Invariant**: In RTL-first applications, never use physical `left` or `right` for directional items. Always use `start` and `end` with `Directional` primitives.

---

## 35. Crash on `double.infinity` Dimensions in `NetworkImageWidget`
- **Symptom**: `Unsupported operation: Infinity cannot be cast to int` runtime crash when rendering cached network images with `width: double.infinity`.
- **Root Cause**: `memCacheWidth: width?.toInt()` attempts to convert `double.infinity` to `int`, which throws an `UnsupportedError` in the Dart runtime.
- **Resolution**: Guarded cache dimension casts with `.isFinite`: `(width != null && width!.isFinite) ? width!.toInt() : null` for both `memCacheWidth` and `memCacheHeight` in `network_image_widget.dart`.
- **Prevention Invariant**: Whenever casting layout dimension constraints (`width`, `height`) from `double` to `int` for image caching or resizing, always assert `.isFinite` first.

