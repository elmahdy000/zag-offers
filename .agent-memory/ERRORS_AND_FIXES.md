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
