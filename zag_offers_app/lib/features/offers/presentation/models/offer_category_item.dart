import 'package:flutter/material.dart';

class OfferCategoryItem {
  final String name;
  final String? backendName; // The actual name in database
  final IconData icon;
  final Color color;
  final String? description;
  final String? imagePath;

  const OfferCategoryItem({
    required this.name,
    this.backendName,
    required this.icon,
    required this.color,
    this.description,
    this.imagePath,
  });
}
