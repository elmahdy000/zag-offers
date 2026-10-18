import 'package:flutter/material.dart';
import 'package:flutter_iconly/flutter_iconly.dart';
import 'package:zag_offers_app/features/offers/presentation/constants/offer_categories.dart';
import 'package:zag_offers_app/features/offers/presentation/models/offer_category_item.dart';

class CategoryUtils {
  static OfferCategoryItem? _findItem(String categoryName) {
    final clean = categoryName.trim();
    for (final c in browseCategories) {
      if (c.name == clean || c.backendName == clean) return c;
    }
    // Fuzzy matching for aliases and backend variations
    if (clean.contains('جميل') || clean.contains('بنات') || clean.contains('تجميل') || clean.contains('ميك اب')) {
      return browseCategories.firstWhere((c) => c.backendName == 'تجميل');
    }
    if (clean.contains('مطعم') || clean.contains('مطاعم') || clean.contains('أكل') || clean.contains('اكل')) {
      return browseCategories.firstWhere((c) => c.backendName == 'مطاعم');
    }
    if (clean.contains('كافيه') || clean.contains('قهو') || clean.contains('مشروب')) {
      return browseCategories.firstWhere((c) => c.backendName == 'كافيهات');
    }
    if (clean.contains('جيم') || clean.contains('لياق') || clean.contains('رياض')) {
      return browseCategories.firstWhere((c) => c.backendName == 'جيم');
    }
    if (clean.contains('حلاق') || clean.contains('شعر') || clean.contains('صالون')) {
      return browseCategories.firstWhere((c) => c.backendName == 'حلاقين');
    }
    if (clean.contains('لعب') || clean.contains('العاب') || clean.contains('ألعاب') || clean.contains('بلايستيشن') || clean.contains('جيمينج')) {
      return browseCategories.firstWhere((c) => c.backendName == 'ألعاب');
    }
    if (clean.contains('لبس') || clean.contains('ملابس') || clean.contains('ازياء') || clean.contains('أزياء')) {
      return browseCategories.firstWhere((c) => c.backendName == 'ملابس');
    }
    if (clean.contains('كورس') || clean.contains('تعليم') || clean.contains('دراسة')) {
      return browseCategories.firstWhere((c) => c.backendName == 'كورسات');
    }
    if (clean.contains('حلو') || clean.contains('حلويات') || clean.contains('تورت')) {
      return browseCategories.firstWhere((c) => c.backendName == 'حلويات');
    }
    if (clean.contains('عرب') || clean.contains('سيار') || clean.contains('صيانة')) {
      return browseCategories.firstWhere((c) => c.backendName == 'خدمات سيارات');
    }
    if (clean.contains('فرح') || clean.contains('مناسب') || clean.contains('عروس')) {
      return browseCategories.firstWhere((c) => c.backendName == 'مناسبات');
    }
    if (clean.contains('طفل') || clean.contains('اطفال') || clean.contains('أطفال')) {
      return browseCategories.firstWhere((c) => c.backendName == 'أطفال');
    }
    if (clean.contains('بيت') || clean.contains('منزل') || clean.contains('ادوات')) {
      return browseCategories.firstWhere((c) => c.backendName == 'أدوات منزلية');
    }
    return null;
  }

  static Color getColor(String categoryName) {
    final item = _findItem(categoryName);
    return item?.color ?? Colors.orange;
  }

  static IconData getIcon(String categoryName) {
    final item = _findItem(categoryName);
    return item?.icon ?? IconlyBold.category;
  }

  static String getDisplayName(String categoryName) {
    final item = _findItem(categoryName);
    return item?.name ?? categoryName;
  }

  static String getDescription(String categoryName) {
    final item = _findItem(categoryName);
    return item?.description ?? 'عروض وخصومات حصرية';
  }

  static String? getAssetImagePath(String categoryName) {
    final item = _findItem(categoryName);
    return item?.imagePath;
  }
}
