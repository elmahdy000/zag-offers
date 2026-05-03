import '../../domain/entities/offer_entity.dart';

class OfferFilterUtils {
  static const int minSearchLength = 3;

  static List<String> extractAreas(List<OfferEntity> offers) {
    final unique = offers
        .map((offer) => offer.store.area.trim())
        .where((area) => area.isNotEmpty)
        .toSet()
        .toList()
      ..sort();

    return ['الكل', ...unique];
  }

  static List<OfferEntity> apply({
    required List<OfferEntity> offers,
    String category = 'الكل',
    String area = 'الكل',
    double minDiscount = 0,
    String sortBy = 'newest',
  }) {
    final filtered = offers.where((offer) {
      final normalizedArea = offer.store.area.trim();
      final matchesCategory =
          category == 'الكل' || offer.store.category == category;
      final matchesArea = area == 'الكل' || normalizedArea == area.trim();
      final matchesDiscount = offer.discountPercentage >= minDiscount;
      return matchesCategory && matchesArea && matchesDiscount;
    }).toList();

    if (sortBy == 'highest_discount') {
      filtered.sort(
        (a, b) => b.discountPercentage.compareTo(a.discountPercentage),
      );
    } else if (sortBy == 'highest_rating') {
      filtered.sort((a, b) => b.store.rating.compareTo(a.store.rating));
    }

    return filtered;
  }

  static bool shouldRunSearch(String query) {
    final trimmed = query.trim();
    return trimmed.isEmpty || trimmed.length >= minSearchLength;
  }
}
