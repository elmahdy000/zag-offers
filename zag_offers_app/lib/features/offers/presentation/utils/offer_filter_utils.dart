import '../../domain/entities/offer_entity.dart';
import '../../../../core/utils/category_utils.dart';
import '../constants/offer_categories.dart';

class OfferFilterUtils {
  static const int minSearchLength = 1;

  /// Normalizes Arabic text for flexible, error-tolerant searching & matching:
  /// - Strips Tashkeel (harakat: fatha, damma, kasra, tanween, sukun, shadda).
  /// - Normalizes Alef variants: [أ, إ, آ, ٱ] -> ا
  /// - Normalizes Taa Marbuta: ة -> ه
  /// - Normalizes Yaa variants: [ى, ي, ئ] -> ي
  /// - Normalizes Waw with Hamza: ؤ -> و
  /// - Strips Tatweel (kashida): ـ
  /// - Converts Eastern Arabic numerals (٠-٩) to Western Arabic digits (0-9).
  /// - Strips invisible Unicode marks & control characters.
  /// - Trims and collapses multiple whitespaces to single space.
  static String normalizeArabic(String input) {
    if (input.isEmpty) return '';
    var s = input.trim().toLowerCase();

    // Remove invisible Unicode marks & bidi control characters
    s = s.replaceAll(RegExp(r'[\u200B-\u200F\uFEFF]'), '');

    // Strip Arabic Tashkeel (diacritics)
    s = s.replaceAll(RegExp(r'[\u064B-\u065F\u0670]'), '');

    // Standardize Alef glyphs
    s = s.replaceAll(RegExp(r'[أإآٱ]'), 'ا');

    // Standardize Taa Marbuta & Haa
    s = s.replaceAll(RegExp(r'[ة]'), 'ه');

    // Standardize Yaa, Alef Maksura, and Hamza on Yaa
    s = s.replaceAll(RegExp(r'[ىيئ]'), 'ي');

    // Standardize Waw with Hamza
    s = s.replaceAll(RegExp(r'[ؤ]'), 'و');

    // Strip Tatweel (Kashida)
    s = s.replaceAll(RegExp(r'ـ'), '');

    // Convert Eastern Arabic numerals (٠-٩) to (0-9)
    const easternNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    for (int i = 0; i < 10; i++) {
      s = s.replaceAll(easternNumerals[i], i.toString());
    }

    // Collapse multiple spaces
    s = s.replaceAll(RegExp(r'\s+'), ' ');

    return s.trim();
  }

  /// Extracts unique non-empty areas from a list of offers with 'الكل' first.
  static List<String> extractAreas(List<OfferEntity> offers) {
    final unique = offers
        .map((offer) => offer.store.area.trim())
        .where((area) => area.isNotEmpty)
        .toSet()
        .toList()
      ..sort();

    return ['الكل', ...unique];
  }

  /// Checks if an offer's store category matches the selected category filter,
  /// supporting backend names, Arabic display names, and fuzzy alias matching.
  static bool matchesCategory(String? offerCategory, String selectedCategory) {
    final trimmedSelected = selectedCategory.trim();
    if (trimmedSelected == 'الكل' || trimmedSelected.isEmpty) {
      return true;
    }
    if (offerCategory == null || offerCategory.trim().isEmpty) {
      return false;
    }

    final trimmedOffer = offerCategory.trim();
    if (trimmedOffer == trimmedSelected) return true;

    final normOffer = normalizeArabic(trimmedOffer);
    final normSelected = normalizeArabic(trimmedSelected);

    if (normOffer == normSelected ||
        normOffer.contains(normSelected) ||
        normSelected.contains(normOffer)) {
      return true;
    }

    // Check display name mapping via CategoryUtils
    final offerDisplayName = CategoryUtils.getDisplayName(trimmedOffer);
    final selectedDisplayName = CategoryUtils.getDisplayName(trimmedSelected);
    if (offerDisplayName == selectedDisplayName) return true;

    final normOfferDisplay = normalizeArabic(offerDisplayName);
    final normSelectedDisplay = normalizeArabic(selectedDisplayName);
    if (normOfferDisplay == normSelectedDisplay ||
        normOfferDisplay.contains(normSelectedDisplay) ||
        normSelectedDisplay.contains(normOfferDisplay)) {
      return true;
    }

    // Check backend category mapping
    final backendCategory = getBackendCategoryName(trimmedSelected);
    final normBackend = normalizeArabic(backendCategory);
    if (normOffer == normBackend ||
        normOffer.contains(normBackend) ||
        normBackend.contains(normOffer)) {
      return true;
    }

    final offerBackendCategory = getBackendCategoryName(trimmedOffer);
    final normOfferBackend = normalizeArabic(offerBackendCategory);
    if (normOfferBackend == normSelected ||
        normOfferBackend == normBackend ||
        normOfferBackend == normSelectedDisplay ||
        normOfferBackend.contains(normSelected) ||
        normSelected.contains(normOfferBackend)) {
      return true;
    }

    return false;
  }

  /// Checks if an offer's store area matches the selected area filter,
  /// with flexible Arabic article handling (with / without 'ال').
  static bool matchesArea(String offerArea, String selectedArea) {
    final trimmedSelected = selectedArea.trim();
    if (trimmedSelected == 'الكل' || trimmedSelected.isEmpty) {
      return true;
    }

    final trimmedOffer = offerArea.trim();
    if (trimmedOffer == trimmedSelected) return true;

    final normOffer = normalizeArabic(trimmedOffer);
    final normSelected = normalizeArabic(trimmedSelected);

    if (normOffer == normSelected) return true;
    if (normOffer.contains(normSelected) || normSelected.contains(normOffer)) {
      return true;
    }

    // Strip leading "ال" (Arabic definite article) for loose matching
    final strippedOffer = normOffer.startsWith('ال') && normOffer.length > 2
        ? normOffer.substring(2)
        : normOffer;
    final strippedSelected = normSelected.startsWith('ال') && normSelected.length > 2
        ? normSelected.substring(2)
        : normSelected;

    return strippedOffer == strippedSelected ||
        strippedOffer.contains(strippedSelected) ||
        strippedSelected.contains(strippedOffer);
  }

  /// Searches an offer against a user's query string using multi-token normalized Arabic matching:
  /// Matches across Title, Description, Store Name, Category, Area, Address, Discount, and Percentage.
  static bool matchesSearch(OfferEntity offer, String query) {
    final cleanQuery = query.trim();
    if (cleanQuery.isEmpty) return true;

    final normQuery = normalizeArabic(cleanQuery);
    final tokens = normQuery
        .split(RegExp(r'\s+'))
        .where((t) => t.isNotEmpty)
        .toList();
    if (tokens.isEmpty) return true;

    final title = normalizeArabic(offer.title);
    final desc = normalizeArabic(offer.description ?? '');
    final storeName = normalizeArabic(offer.store.name);
    final storeCategory = normalizeArabic(offer.store.category ?? '');
    final categoryDisplayName = normalizeArabic(
      CategoryUtils.getDisplayName(offer.store.category ?? ''),
    );
    final categoryBackendName = normalizeArabic(
      getBackendCategoryName(offer.store.category ?? ''),
    );
    final storeArea = normalizeArabic(offer.store.area);
    final storeAddress = normalizeArabic(offer.store.address ?? '');
    final discount = normalizeArabic(offer.discount);
    final discountPct = offer.discountPercentage.toInt().toString();

    final haystack =
        '$title $desc $storeName $storeCategory $categoryDisplayName $categoryBackendName $storeArea $storeAddress $discount $discountPct';

    for (final token in tokens) {
      if (haystack.contains(token)) continue;

      // Handle definite article "ال"
      if (token.startsWith('ال') && token.length > 2) {
        final stripped = token.substring(2);
        if (haystack.contains(stripped)) continue;
      }
      if (haystack.contains('ال$token')) continue;

      // Egyptian Arabic phonetic / spelling variants: ending in "ه" vs "ا" (e.g., شاورما / شاورمه)
      if (token.endsWith('ه') && token.length > 2) {
        final withAlef = '${token.substring(0, token.length - 1)}ا';
        if (haystack.contains(withAlef)) continue;
      } else if (token.endsWith('ا') && token.length > 2) {
        final withHaa = '${token.substring(0, token.length - 1)}ه';
        if (haystack.contains(withHaa)) continue;
      }

      return false;
    }

    return true;
  }

  /// Filters and sorts a list of offers based on Category, Area, Minimum Discount,
  /// Sort Criterion, and optional Arabic Search Query.
  static List<OfferEntity> apply({
    required List<OfferEntity> offers,
    String category = 'الكل',
    String area = 'الكل',
    double minDiscount = 0,
    String sortBy = 'newest',
    String searchQuery = '',
  }) {
    final filtered = offers.where((offer) {
      final matchCat = matchesCategory(offer.store.category, category);
      final matchAr = matchesArea(offer.store.area, area);
      final matchDisc = offer.discountPercentage >= minDiscount;
      final matchSrch = matchesSearch(offer, searchQuery);

      return matchCat && matchAr && matchDisc && matchSrch;
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

  /// Determines if a search query is non-empty.
  static bool shouldRunSearch(String query) {
    final trimmed = query.trim();
    return trimmed.isNotEmpty;
  }
}
