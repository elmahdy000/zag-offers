import 'package:flutter/material.dart';
import 'package:flutter_iconly/flutter_iconly.dart';
import 'package:zag_offers_app/features/offers/presentation/constants/offer_categories.dart';

class CategoryUtils {
  static Color getColor(String categoryName) {
    try {
      final item = browseCategories.firstWhere(
        (c) => c.name == categoryName || c.backendName == categoryName,
      );
      return item.color;
    } catch (_) {
      return Colors.grey;
    }
  }

  static IconData getIcon(String categoryName) {
    try {
      final item = browseCategories.firstWhere(
        (c) => c.name == categoryName || c.backendName == categoryName,
      );
      return item.icon;
    } catch (_) {
      return IconlyBold.category;
    }
  }

  static String getDisplayName(String backendName) {
    try {
      final item = browseCategories.firstWhere(
        (c) => c.backendName == backendName,
      );
      return item.name;
    } catch (_) {
      return backendName;
    }
  }
}
