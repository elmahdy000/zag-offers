import 'package:flutter/material.dart';
import 'package:flutter_iconly/flutter_iconly.dart';

import '../models/offer_category_item.dart';

const List<OfferCategoryItem> browseCategories = [
  OfferCategoryItem(
    name: 'مطاعم',
    icon: Icons.restaurant_rounded,
    color: Colors.orange,
    description: 'أقوى عروض الأكل',
    imagePath: 'assets/categories/food.png',
  ),
  OfferCategoryItem(
    name: 'كافيهات',
    icon: Icons.coffee_rounded,
    color: Colors.brown,
    description: 'روق بمزاجك',
    imagePath: 'assets/categories/cafe.png',
  ),
  OfferCategoryItem(
    name: 'ألعاب',
    icon: IconlyBold.game,
    color: Colors.indigo,
    description: 'وقت اللعب والترفيه',
    imagePath: 'assets/categories/games.png',
  ),
  OfferCategoryItem(
    name: 'تجميل',
    icon: IconlyBold.heart,
    color: Colors.pink,
    description: 'جمالك بأقل تكلفة',
    imagePath: 'assets/categories/beauty.png',
  ),
  OfferCategoryItem(
    name: 'جيم',
    icon: IconlyBold.activity,
    color: Colors.blue,
    description: 'فورمة الصيف',
    imagePath: 'assets/categories/gym.png',
  ),
  OfferCategoryItem(
    name: 'ملابس',
    icon: IconlyBold.bag,
    color: Colors.purple,
    description: 'أحدث الموديلات',
    imagePath: 'assets/categories/fashion.png',
  ),
  OfferCategoryItem(
    name: 'صيدليات',
    icon: IconlyBold.plus,
    color: Colors.red,
    description: 'صحتك تهمنا',
    imagePath: 'assets/categories/medical.png',
  ),
  OfferCategoryItem(
    name: 'كورسات',
    icon: IconlyBold.document,
    color: Colors.green,
    description: 'طور مهاراتك',
    imagePath: 'assets/categories/education.png',
  ),
];

const List<OfferCategoryItem> searchSidebarCategories = [
  OfferCategoryItem(
    name: 'الكل',
    icon: IconlyBold.category,
    color: Colors.teal,
    imagePath: 'assets/categories/all.png',
  ),
  OfferCategoryItem(
    name: 'مطاعم',
    icon: Icons.restaurant_rounded,
    color: Colors.orange,
    imagePath: 'assets/categories/food.png',
  ),
  OfferCategoryItem(
    name: 'كافيهات',
    icon: Icons.coffee_rounded,
    color: Colors.brown,
    imagePath: 'assets/categories/cafe.png',
  ),
  OfferCategoryItem(
    name: 'ملابس',
    icon: IconlyBold.bag,
    color: Colors.purple,
    imagePath: 'assets/categories/fashion.png',
  ),
  OfferCategoryItem(
    name: 'جيم',
    icon: IconlyBold.activity,
    color: Colors.blue,
    imagePath: 'assets/categories/gym.png',
  ),
  OfferCategoryItem(
    name: 'تجميل',
    icon: IconlyBold.heart,
    color: Colors.pink,
    imagePath: 'assets/categories/beauty.png',
  ),
  OfferCategoryItem(
    name: 'صيدليات',
    icon: IconlyBold.plus,
    color: Colors.red,
    imagePath: 'assets/categories/medical.png',
  ),
  OfferCategoryItem(
    name: 'سوبر ماركت',
    icon: IconlyBold.buy,
    color: Colors.green,
    imagePath: 'assets/categories/home.png',
  ),
];

const List<String> filterCategoryNames = [
  'الكل',
  'مطاعم',
  'كافيهات',
  'ملابس',
  'جيم',
  'تجميل',
  'كورسات',
];
