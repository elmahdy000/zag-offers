import 'package:flutter_test/flutter_test.dart';
import 'package:zag_offers_app/features/offers/presentation/utils/offer_pricing_utils.dart';

void main() {
  group('OfferPricingResult tests', () {
    test('Case 1: Both prices provided with valid discount (200 -> 160 EGP)', () {
      final pricing = OfferPricingResult.compute(
        newPrice: 160,
        oldPrice: 200,
        discountString: '20%',
        discountPercentage: 20,
      );

      expect(pricing.hasExplicitPrices, isTrue);
      expect(pricing.hasSavings, isTrue);
      expect(pricing.finalPrice, 160);
      expect(pricing.originalPrice, 200);
      expect(pricing.savingsAmount, 40);
      expect(pricing.savingsPercentage, 20);
      expect(pricing.topDiscountBadge, '20%');
    });

    test('Case 1: Both prices provided but oldPrice <= newPrice (no strikethrough)', () {
      final pricing = OfferPricingResult.compute(
        newPrice: 200,
        oldPrice: 200,
        discountString: '',
        discountPercentage: 0,
      );

      expect(pricing.hasExplicitPrices, isTrue);
      expect(pricing.hasSavings, isFalse);
      expect(pricing.finalPrice, 200);
      expect(pricing.originalPrice, isNull);
      expect(pricing.savingsAmount, 0);
    });

    test('Case 2: Only oldPrice provided with discount percentage', () {
      final pricing = OfferPricingResult.compute(
        newPrice: null,
        oldPrice: 100,
        discountString: '25%',
        discountPercentage: 25,
      );

      expect(pricing.hasExplicitPrices, isTrue);
      expect(pricing.hasSavings, isTrue);
      expect(pricing.finalPrice, 75);
      expect(pricing.originalPrice, 100);
      expect(pricing.savingsAmount, 25);
      expect(pricing.savingsPercentage, 25);
      expect(pricing.topDiscountBadge, '25%');
    });

    test('Case 3: Only newPrice provided with discount percentage', () {
      final pricing = OfferPricingResult.compute(
        newPrice: 80,
        oldPrice: null,
        discountString: '20%',
        discountPercentage: 20,
      );

      expect(pricing.hasExplicitPrices, isTrue);
      expect(pricing.hasSavings, isTrue);
      expect(pricing.finalPrice, 80);
      expect(pricing.originalPrice, 100);
      expect(pricing.savingsAmount, 20);
      expect(pricing.savingsPercentage, 20);
      expect(pricing.topDiscountBadge, '20%');
    });

    test('Case 4: Single price only (no discount percentage to derive counterpart)', () {
      final pricing = OfferPricingResult.compute(
        newPrice: 150,
        oldPrice: null,
        discountString: '',
        discountPercentage: 0,
      );

      expect(pricing.hasExplicitPrices, isTrue);
      expect(pricing.hasSavings, isFalse);
      expect(pricing.finalPrice, 150);
      expect(pricing.originalPrice, isNull);
      expect(pricing.savingsAmount, 0);
    });

    test('Case 5: Store-wide offer with no explicit prices', () {
      final pricing = OfferPricingResult.compute(
        newPrice: null,
        oldPrice: null,
        discountString: 'خصم 30%',
        discountPercentage: 30,
      );

      expect(pricing.hasExplicitPrices, isFalse);
      expect(pricing.hasSavings, isFalse);
      expect(pricing.finalPrice, isNull);
      expect(pricing.originalPrice, isNull);
      expect(pricing.topDiscountBadge, '30%');
    });
  });
}
