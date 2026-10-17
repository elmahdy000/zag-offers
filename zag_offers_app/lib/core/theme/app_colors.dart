import 'package:flutter/material.dart';

class AppColors {
  // Brand Oranges (Primary Spec)
  static const Color primary = Color(0xFFFF6A00); // Primary Vibrant Orange
  static const Color primaryLight = Color(0xFFFF8C35); // Amber Coral
  static const Color primaryDark = Color(0xFFFF3D00); // Sunset Ember
  static const Color secondary = primaryLight;
  
  // Backgrounds & Surfaces
  static const Color background = Color(0xFFF8F9FA); 
  static const Color darkBackground = Color(0xFF0D1422); // Deep Midnight Navy
  static const Color darkSurface = Color(0xFF161C2A); // Elevated Navy Slate
  static const Color darkCardHover = Color(0xFF1E2638);
  
  // High-Contrast Typography
  static const Color textPrimary = Color(0xFF0D0D0F); // Near-black for crisp day readability
  static const Color textSecondary = Color(0xFF64748B); // Slate-500 for balanced subtext
  static const Color textDark = Color(0xFFFFFFFF); // Pure white for headers in dark mode
  static const Color textDarkDim = Color(0xFF94A3B8); // Slate-400 (>5.5:1 WCAG AA contrast in dark mode)
  
  // Accents & Functional States
  static const Color success = Color(0xFF10B981); // Emerald 500
  static const Color error = Color(0xFFEF4444); // Red 500
  static const Color warning = Color(0xFFF59E0B); // Amber 500
  static const Color gold = Color(0xFFFFB800); // Zag Rewards Gold
  static const Color info = Color(0xFF3B82F6); // Blue 500
  static const Color white = Colors.white;
  static const Color borderDark = Color(0x18FFFFFF); // 9.5% White border for crisp dark cards
}
