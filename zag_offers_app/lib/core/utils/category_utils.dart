import 'package:flutter/material.dart';
import 'package:flutter_iconly/flutter_iconly.dart';

class CategoryUtils {
  static IconData getIcon(String? categoryName) {
    if (categoryName == null) return IconlyBold.discount;
    switch (categoryName.toLowerCase()) {
      case 'مطاعم':
      case 'food':
      case 'restaurants':
        return IconlyBold.category; // placeholder
      case 'ملابس':
      case 'fashion':
      case 'clothing':
        return IconlyBold.bag;
      case 'صيدليات':
      case 'pharmacy':
      case 'health':
        return IconlyBold.plus;
      case 'سوبر ماركت':
      case 'supermarket':
      case 'grocery':
        return IconlyBold.buy;
      case 'إلكترونيات':
      case 'electronics':
      case 'tech':
        return IconlyBold.image2;
      case 'أحذية':
      case 'shoes':
        return IconlyBold.bag;
      case 'عطور':
      case 'perfumes':
        return IconlyBold.filter;
      case 'نظارات':
      case 'optics':
        return IconlyBold.show;
      case 'ألعاب':
      case 'games':
        return IconlyBold.game;
      default:
        return IconlyBold.discount;
    }
  }
}
