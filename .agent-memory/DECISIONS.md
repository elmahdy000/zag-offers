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
- **Decision**: Real backend prices (`newPrice`, `oldPrice`) are strictly honored. When `newPrice` is absent but `discountPercentage` is present, `effectiveNewPrice = oldPrice * (1 - discountPercentage / 100)` is calculated for display so customers see accurate savings.
- **Rule**: Single prices are never struck through. Strikethrough is only applied when an actual lower price is actively displayed alongside it.
