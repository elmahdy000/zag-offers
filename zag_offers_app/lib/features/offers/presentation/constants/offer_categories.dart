import 'package:flutter/material.dart';
import 'package:flutter_iconly/flutter_iconly.dart';

import '../models/offer_category_item.dart';

const List<OfferCategoryItem> browseCategories = [
  OfferCategoryItem(
    name: 'دلع كرشك',
    backendName: 'مطاعم',
    icon: Icons.restaurant_rounded,
    color: Colors.orange,
    description: 'أقوى عروض الأكل',
    imagePath: 'assets/categories/food.png',
  ),
  OfferCategoryItem(
    name: 'روقان',
    backendName: 'كافيهات',
    icon: Icons.coffee_rounded,
    color: Colors.brown,
    description: 'كافيهات ومشروبات',
    imagePath: 'assets/categories/cafe.png',
  ),
  OfferCategoryItem(
    name: 'اون فاير',
    backendName: 'ألعاب',
    icon: IconlyBold.game,
    color: Colors.indigo,
    description: 'وقت اللعب والترفيه',
    imagePath: 'assets/categories/games.png',
  ),
  OfferCategoryItem(
    name: 'نعيماً',
    backendName: 'حلاقين',
    icon: Icons.content_cut_rounded,
    color: Colors.blueGrey,
    description: 'حلاقة واهتمام',
    imagePath: 'assets/categories/barber.png',
  ),
  OfferCategoryItem(
    name: 'دلع بنات',
    backendName: 'تجميل',
    icon: IconlyBold.heart,
    color: Colors.pink,
    description: 'تجميل وعناية',
    imagePath: 'assets/categories/beauty.png',
  ),
  OfferCategoryItem(
    name: 'فورمة',
    backendName: 'جيم',
    icon: IconlyBold.activity,
    color: Colors.blue,
    description: 'جيم ولياقة بدنية',
    imagePath: 'assets/categories/gym.png',
  ),
  OfferCategoryItem(
    name: 'شياكة',
    backendName: 'ملابس',
    icon: Icons.checkroom_rounded,
    color: Colors.purple,
    description: 'ملابس وأحدث الموديلات',
    imagePath: 'assets/categories/fashion.png',
  ),
  OfferCategoryItem(
    name: 'طور نفسك',
    backendName: 'كورسات',
    icon: IconlyBold.document,
    color: Colors.green,
    description: 'كورسات ومنح تعليمية',
    imagePath: 'assets/categories/education.png',
  ),
  OfferCategoryItem(
    name: 'حلى بوقك',
    backendName: 'حلويات',
    icon: Icons.cake_rounded,
    color: Colors.amber,
    description: 'حلويات وتورت',
    imagePath: 'assets/categories/sweets.png',
  ),
  OfferCategoryItem(
    name: 'دلع عربيتك',
    backendName: 'خدمات سيارات',
    icon: Icons.directions_car_rounded,
    color: Colors.blueGrey,
    description: 'صيانة وخدمات سيارات',
    imagePath: 'assets/categories/car.png',
  ),
  OfferCategoryItem(
    name: 'عروستي',
    backendName: 'مناسبات',
    icon: Icons.celebration_rounded,
    color: Colors.deepPurple,
    description: 'قاعات وتجهيز أفراح',
    imagePath: 'assets/categories/wedding.png',
  ),
  OfferCategoryItem(
    name: 'عيالنا',
    backendName: 'أطفال',
    icon: Icons.child_care_rounded,
    color: Colors.lightBlue,
    description: 'كل ما يخص الأطفال',
    imagePath: 'assets/categories/kids.png',
  ),
  OfferCategoryItem(
    name: 'ست البيت',
    backendName: 'أدوات منزلية',
    icon: Icons.home_work_rounded,
    color: Colors.brown,
    description: 'أجهزة وأدوات منزلية',
    imagePath: 'assets/categories/home.png',
  ),
];

const List<OfferCategoryItem> searchSidebarCategories = [
  OfferCategoryItem(
    name: 'الكل',
    backendName: 'الكل',
    icon: IconlyBold.category,
    color: Colors.teal,
    imagePath: 'assets/categories/all.png',
  ),
  OfferCategoryItem(
    name: 'دلع كرشك',
    backendName: 'مطاعم',
    icon: Icons.restaurant_rounded,
    color: Colors.orange,
    imagePath: 'assets/categories/food.png',
  ),
  OfferCategoryItem(
    name: 'روقان',
    backendName: 'كافيهات',
    icon: Icons.coffee_rounded,
    color: Colors.brown,
    imagePath: 'assets/categories/cafe.png',
  ),
  OfferCategoryItem(
    name: 'شياكة',
    backendName: 'ملابس',
    icon: Icons.checkroom_rounded,
    color: Colors.purple,
    imagePath: 'assets/categories/fashion.png',
  ),
  OfferCategoryItem(
    name: 'فورمة',
    backendName: 'جيم',
    icon: IconlyBold.activity,
    color: Colors.blue,
    imagePath: 'assets/categories/gym.png',
  ),
  OfferCategoryItem(
    name: 'نعيماً',
    backendName: 'حلاقين',
    icon: Icons.content_cut_rounded,
    color: Colors.blueGrey,
    imagePath: 'assets/categories/barber.png',
  ),
  OfferCategoryItem(
    name: 'دلع بنات',
    backendName: 'تجميل',
    icon: IconlyBold.heart,
    color: Colors.pink,
    imagePath: 'assets/categories/beauty.png',
  ),
  OfferCategoryItem(
    name: 'حلى بوقك',
    backendName: 'حلويات',
    icon: Icons.cake_rounded,
    color: Colors.amber,
    imagePath: 'assets/categories/sweets.png',
  ),
  OfferCategoryItem(
    name: 'ست البيت',
    backendName: 'أدوات منزلية',
    icon: Icons.home_work_rounded,
    color: Colors.brown,
    imagePath: 'assets/categories/home.png',
  ),
];

const List<String> filterCategoryNames = [
  'الكل',
  'دلع كرشك',
  'روقان',
  'شياكة',
  'فورمة',
  'نعيماً',
  'اون فاير',
  'دلع بنات',
  'طور نفسك',
  'حلى بوقك',
  'دلع عربيتك',
  'عروستي',
  'عيالنا',
  'ست البيت',
];

// Helper to get backend name from display name
String getBackendCategoryName(String displayName) {
  if (displayName == 'الكل') return 'الكل';
  
  try {
    final category = browseCategories.firstWhere(
      (c) => c.name == displayName,
      orElse: () => searchSidebarCategories.firstWhere(
        (c) => c.name == displayName,
      ),
    );
    return category.backendName ?? displayName;
  } catch (_) {
    // If not found in primary lists, try manual mapping for common cases
    if (displayName == 'دلع كرشك') return 'مطاعم';
    if (displayName == 'روقان') return 'كافيهات';
    if (displayName == 'اون فاير') return 'ألعاب';
    if (displayName == 'نعيماً') return 'حلاقين';
    if (displayName == 'دلع بنات') return 'تجميل';
    if (displayName == 'طور نفسك') return 'كورسات';
    if (displayName == 'شياكة') return 'ملابس';
    if (displayName == 'فورمة') return 'جيم';
    if (displayName == 'حلى بوقك') return 'حلويات';
    if (displayName == 'دلع عربيتك') return 'خدمات سيارات';
    if (displayName == 'عروستي') return 'مناسبات';
    if (displayName == 'عيالنا') return 'أطفال';
    if (displayName == 'ست البيت') return 'أدوات منزلية';
    
    return displayName;
  }
}
