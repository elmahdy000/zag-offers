import 'package:flutter/material.dart';
import 'package:flutter_iconly/flutter_iconly.dart';

import '../models/offer_category_item.dart';

const List<OfferCategoryItem> browseCategories = [
  OfferCategoryItem(
    name: 'مطاعم',
    icon: Icons.restaurant_rounded,
    color: Colors.orange,
    description: 'أقوى عروض الأكل',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=500&auto=format&fit=crop',
  ),
  OfferCategoryItem(
    name: 'كافيهات',
    icon: Icons.coffee_rounded,
    color: Colors.brown,
    description: 'روق بمزاجك',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=500&auto=format&fit=crop',
  ),
  OfferCategoryItem(
    name: 'بلايستيشن',
    icon: IconlyBold.game,
    color: Colors.indigo,
    description: 'وقت اللعب والترفيه',
    image: 'https://images.unsplash.com/photo-1605898962319-19451aae15af?q=80&w=500&auto=format&fit=crop',
  ),
  OfferCategoryItem(
    name: 'ميكب',
    icon: IconlyBold.heart,
    color: Colors.pink,
    description: 'جمالك بأقل تكلفة',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=500&auto=format&fit=crop',
  ),
  OfferCategoryItem(
    name: 'جيم',
    icon: IconlyBold.activity,
    color: Colors.blue,
    description: 'فورمة الصيف',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=500&auto=format&fit=crop',
  ),
  OfferCategoryItem(
    name: 'ملابس',
    icon: IconlyBold.bag,
    color: Colors.purple,
    description: 'أحدث الموديلات',
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=500&auto=format&fit=crop',
  ),
  OfferCategoryItem(
    name: 'صيدليات',
    icon: IconlyBold.plus,
    color: Colors.red,
    description: 'صحتك تهمنا',
    image: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?q=80&w=500&auto=format&fit=crop',
  ),
  OfferCategoryItem(
    name: 'كورسات',
    icon: IconlyBold.document,
    color: Colors.green,
    description: 'طور مهاراتك',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=500&auto=format&fit=crop',
  ),
];

const List<OfferCategoryItem> searchSidebarCategories = [
  OfferCategoryItem(
    name: 'الكل',
    icon: IconlyBold.category,
    color: Colors.teal,
    image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=500&auto=format&fit=crop',
  ),
  OfferCategoryItem(
    name: 'مطاعم',
    icon: Icons.restaurant_rounded,
    color: Colors.orange,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=500&auto=format&fit=crop',
  ),
  OfferCategoryItem(
    name: 'كافيهات',
    icon: Icons.coffee_rounded,
    color: Colors.brown,
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=500&auto=format&fit=crop',
  ),
  OfferCategoryItem(
    name: 'ملابس',
    icon: IconlyBold.bag,
    color: Colors.purple,
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=500&auto=format&fit=crop',
  ),
  OfferCategoryItem(
    name: 'جيم',
    icon: IconlyBold.activity,
    color: Colors.blue,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=500&auto=format&fit=crop',
  ),
  OfferCategoryItem(
    name: 'ميكب',
    icon: IconlyBold.heart,
    color: Colors.pink,
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=500&auto=format&fit=crop',
  ),
  OfferCategoryItem(
    name: 'صيدليات',
    icon: IconlyBold.plus,
    color: Colors.red,
    image: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?q=80&w=500&auto=format&fit=crop',
  ),
  OfferCategoryItem(
    name: 'سوبر ماركت',
    icon: IconlyBold.buy,
    color: Colors.green,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=500&auto=format&fit=crop',
  ),
];

const List<String> filterCategoryNames = [
  'الكل',
  'مطاعم',
  'كافيهات',
  'ملابس',
  'جيم',
  'ميكب',
  'كورسات',
];
