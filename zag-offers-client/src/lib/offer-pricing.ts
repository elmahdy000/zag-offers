/**
 * Single source of truth for offer pricing on the web client.
 *
 * Mirrors `OfferPricingResult` from the Flutter customer app
 * (`zag_offers_app/lib/features/offers/presentation/utils/offer_pricing_utils.dart`)
 * so both platforms render identical prices, discounts and savings.
 *
 * Platform pricing invariants:
 * 1. Strikethrough is only applied when an actual lower price is displayed.
 * 2. Percentage formula: ((originalPrice - finalPrice) / originalPrice) * 100.
 * 3. Store-wide offers without item prices suppress before/after price boxes.
 *
 * NOTE: the backend field is `newPrice` (Prisma `Offer.newPrice`) — never
 * `discountedPrice`. Reading the wrong key silently produced `undefined`
 * prices on every card and on the offer details page.
 */

export interface PricingSource {
  originalPrice?: number | null;
  newPrice?: number | null;
  discount?: string | null;
  discountPercentage?: number | null;
}

export interface OfferPricing {
  /** Price the customer actually pays, when known. */
  finalPrice: number | null;
  /** Original (pre-discount) price, only when it is strictly higher. */
  originalPrice: number | null;
  /** Absolute amount saved. */
  savingsAmount: number;
  /** Rounded percentage saved. */
  savingsPercentage: number;
  hasSavings: boolean;
  /** True when at least one real price exists (so price boxes can render). */
  hasExplicitPrices: boolean;
  /** Badge text, e.g. "40%" or "خصم عام". */
  topDiscountBadge: string;
}

function toPositivePrice(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function parsePercent(discount?: string | null): number {
  if (!discount) return 0;
  const cleaned = discount.replace(/[^0-9.]/g, '');
  if (!cleaned) return 0;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) && parsed > 0 && parsed < 100 ? parsed : 0;
}

export function resolveOfferPricing(source: PricingSource | null | undefined): OfferPricing {
  const newPrice = toPositivePrice(source?.newPrice);
  const oldPrice = toPositivePrice(source?.originalPrice);

  const explicitPercent =
    typeof source?.discountPercentage === 'number' && source.discountPercentage > 0
      ? source.discountPercentage
      : 0;
  const parsedPercent = explicitPercent > 0 ? explicitPercent : parsePercent(source?.discount);

  // Case 1 — both explicit prices (exact, mathematically verified values).
  if (newPrice !== null && oldPrice !== null) {
    if (oldPrice > newPrice) {
      const savingsAmount = oldPrice - newPrice;
      const savingsPercentage = Math.round((savingsAmount / oldPrice) * 100);
      return {
        finalPrice: newPrice,
        originalPrice: oldPrice,
        savingsAmount,
        savingsPercentage,
        hasSavings: true,
        hasExplicitPrices: true,
        topDiscountBadge: `${savingsPercentage}%`,
      };
    }
    // A "discount" that is not actually cheaper — never show a fake strikethrough.
    return {
      finalPrice: newPrice,
      originalPrice: null,
      savingsAmount: 0,
      savingsPercentage: 0,
      hasSavings: false,
      hasExplicitPrices: true,
      topDiscountBadge: parsedPercent > 0 ? `${Math.round(parsedPercent)}%` : '',
    };
  }

  // Case 2 — only the original price, derive the final price from the percentage.
  if (oldPrice !== null && newPrice === null && parsedPercent > 0) {
    const finalPrice = oldPrice * (1 - parsedPercent / 100);
    const savingsAmount = oldPrice - finalPrice;
    return {
      finalPrice,
      originalPrice: oldPrice,
      savingsAmount,
      savingsPercentage: Math.round(parsedPercent),
      hasSavings: savingsAmount > 0,
      hasExplicitPrices: true,
      topDiscountBadge: `${Math.round(parsedPercent)}%`,
    };
  }

  // Case 3 — only the new price, derive the original price from the percentage.
  if (newPrice !== null && oldPrice === null && parsedPercent > 0 && parsedPercent < 100) {
    const originalPrice = newPrice / (1 - parsedPercent / 100);
    const savingsAmount = originalPrice - newPrice;
    return {
      finalPrice: newPrice,
      originalPrice,
      savingsAmount,
      savingsPercentage: Math.round(parsedPercent),
      hasSavings: savingsAmount > 0,
      hasExplicitPrices: true,
      topDiscountBadge: `${Math.round(parsedPercent)}%`,
    };
  }

  // Case 4 — a single real price, no counterpart to derive.
  if (newPrice !== null || oldPrice !== null) {
    return {
      finalPrice: newPrice ?? oldPrice,
      originalPrice: null,
      savingsAmount: 0,
      savingsPercentage: 0,
      hasSavings: false,
      hasExplicitPrices: true,
      topDiscountBadge: parsedPercent > 0 ? `${Math.round(parsedPercent)}%` : '',
    };
  }

  // Case 5 — store-wide offer with no item prices (e.g. "20% off the whole bill").
  const badge =
    parsedPercent > 0
      ? `${Math.round(parsedPercent)}%`
      : (source?.discount?.trim() ?? '');

  return {
    finalPrice: null,
    originalPrice: null,
    savingsAmount: 0,
    savingsPercentage: Math.round(parsedPercent),
    hasSavings: false,
    hasExplicitPrices: false,
    topDiscountBadge: badge,
  };
}

/** Formats a numeric price without trailing `.00`, Arabic-friendly. */
export function formatPrice(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '';
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.00$/, '');
}
