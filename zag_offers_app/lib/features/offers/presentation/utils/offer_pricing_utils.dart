import '../../domain/entities/offer_entity.dart';

/// Single source of truth for all offer pricing calculations, discount badges,
/// savings derivations, and store-wide offer handling across the platform.
class OfferPricingResult {
  final double? finalPrice;
  final double? originalPrice;
  final double savingsAmount;
  final int savingsPercentage;
  final bool hasSavings;
  final bool hasExplicitPrices;
  final String topDiscountBadge;

  const OfferPricingResult({
    this.finalPrice,
    this.originalPrice,
    required this.savingsAmount,
    required this.savingsPercentage,
    required this.hasSavings,
    required this.hasExplicitPrices,
    required this.topDiscountBadge,
  });

  /// Factory constructor to compute pricing directly from an [OfferEntity].
  factory OfferPricingResult.fromOffer(OfferEntity offer) {
    return compute(
      newPrice: offer.newPrice,
      oldPrice: offer.oldPrice,
      discountString: offer.discount,
      discountPercentage: offer.discountPercentage,
    );
  }

  /// Calculates mathematically verified pricing values based on explicit prices
  /// or percentage discounts, adhering to platform pricing invariants:
  /// 1. Strikethrough is only applied when an actual lower price is actively displayed.
  /// 2. Formula: ((originalPrice - finalPrice) / originalPrice) * 100.
  /// 3. Store-wide offers without item prices suppress before/after price boxes.
  static OfferPricingResult compute({
    required double? newPrice,
    required double? oldPrice,
    required String discountString,
    required double discountPercentage,
  }) {
    final rawNew = (newPrice != null && newPrice > 0 && newPrice.isFinite) ? newPrice : null;
    final rawOld = (oldPrice != null && oldPrice > 0 && oldPrice.isFinite) ? oldPrice : null;

    double parsedPercent = discountPercentage > 0 ? discountPercentage : 0;
    if (parsedPercent == 0 && discountString.isNotEmpty) {
      final clean = discountString.replaceAll(RegExp(r'[^0-9.]'), '');
      final p = double.tryParse(clean);
      if (p != null && p > 0 && p < 100) {
        parsedPercent = p;
      }
    }

    // Case 1: Both prices explicitly provided
    if (rawNew != null && rawOld != null) {
      if (rawOld > rawNew) {
        final savings = rawOld - rawNew;
        // Strict formula: ((originalPrice - finalPrice) / originalPrice) * 100
        final mathPercent = ((savings / rawOld) * 100).round();
        return OfferPricingResult(
          finalPrice: rawNew,
          originalPrice: rawOld,
          savingsAmount: savings,
          savingsPercentage: mathPercent,
          hasSavings: true,
          hasExplicitPrices: true,
          topDiscountBadge: '$mathPercent%',
        );
      } else {
        return OfferPricingResult(
          finalPrice: rawNew,
          originalPrice: null,
          savingsAmount: 0,
          savingsPercentage: 0,
          hasSavings: false,
          hasExplicitPrices: true,
          topDiscountBadge: parsedPercent > 0 ? '${parsedPercent.toInt()}%' : '',
        );
      }
    }

    // Case 2: Only oldPrice provided, with valid percentage discount
    if (rawOld != null && rawNew == null && parsedPercent > 0) {
      final effectiveFinal = rawOld * (1 - (parsedPercent / 100));
      final savings = rawOld - effectiveFinal;
      final mathPercent = parsedPercent.round();
      return OfferPricingResult(
        finalPrice: effectiveFinal,
        originalPrice: rawOld,
        savingsAmount: savings,
        savingsPercentage: mathPercent,
        hasSavings: savings > 0,
        hasExplicitPrices: true,
        topDiscountBadge: '$mathPercent%',
      );
    }

    // Case 3: Only newPrice provided, with valid percentage discount
    if (rawNew != null && rawOld == null && parsedPercent > 0 && parsedPercent < 100) {
      final effectiveOriginal = rawNew / (1 - (parsedPercent / 100));
      final savings = effectiveOriginal - rawNew;
      final mathPercent = parsedPercent.round();
      return OfferPricingResult(
        finalPrice: rawNew,
        originalPrice: effectiveOriginal,
        savingsAmount: savings,
        savingsPercentage: mathPercent,
        hasSavings: savings > 0,
        hasExplicitPrices: true,
        topDiscountBadge: '$mathPercent%',
      );
    }

    // Case 4: Single price only (no discount percentage to derive counterpart)
    if (rawNew != null || rawOld != null) {
      final single = rawNew ?? rawOld;
      return OfferPricingResult(
        finalPrice: single,
        originalPrice: null,
        savingsAmount: 0,
        savingsPercentage: 0,
        hasSavings: false,
        hasExplicitPrices: true,
        topDiscountBadge: parsedPercent > 0 ? '${parsedPercent.toInt()}%' : '',
      );
    }

    // Case 5: Store-wide offer with NO specific prices (e.g. 20% off whole store)
    final badge = parsedPercent > 0
        ? '${parsedPercent.toInt()}%'
        : (discountString.trim().isNotEmpty ? discountString.trim() : '');
    return OfferPricingResult(
      finalPrice: null,
      originalPrice: null,
      savingsAmount: 0,
      savingsPercentage: parsedPercent.round(),
      hasSavings: false,
      hasExplicitPrices: false,
      topDiscountBadge: badge,
    );
  }
}
