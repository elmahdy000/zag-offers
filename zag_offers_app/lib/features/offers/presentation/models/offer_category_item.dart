import 'package:flutter/material.dart';

class OfferCategoryItem {
  final String name;
  final IconData icon;
  final Color color;
  final String? description;
  final String? image;

  const OfferCategoryItem({
    required this.name,
    required this.icon,
    required this.color,
    this.description,
    this.image,
  });
}
