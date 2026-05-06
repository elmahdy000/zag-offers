import 'package:flutter/material.dart';

class AppColors {
  // Brand Colors
  static const Color primary = Color(0xFFFF6B00); // Zag Orange
  static const Color primaryDark = Color(0xFFD95A00);
  static const Color primaryLight = Color(0xFFFF8533);
  
  // UI Colors - Industrial Dark
  static const Color background = Color(0xFF0D0D0D); // Pure depth
  static const Color card = Color(0xFF161616); // High-end card
  static const Color surface = Color(0xFF1F1F1F);
  static const Color border = Color(0xFF262626);
  
  // Accent Colors
  static const Color accent = Color(0xFF00C2FF); // Electric Blue
  static const Color success = Color(0xFF00E676);
  static const Color error = Color(0xFFFF3D00);
  static const Color warning = Color(0xFFFFC107);
  
  // Text Colors
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFFA0A0A0);
  static const Color textTertiary = Color(0xFF666666);
  
  // Glass Effects
  static Color glassBackground = Colors.white.withValues(alpha: 0.03);
  static Color glassBorder = Colors.white.withValues(alpha: 0.1);
}
