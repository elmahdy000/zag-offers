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

