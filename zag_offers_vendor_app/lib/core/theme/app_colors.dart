import 'package:flutter/material.dart';

class AppColors {
  // Brand Colors - Zag Offers Theme
  static const Color primary = Color(0xFFFF6B00); // Zag Orange
  static const Color primaryDark = Color(0xFFD95A00);
  static const Color primaryLight = Color(0xFFFF8533);
  static const Color primaryLt = Color(0xFFFFB380); // Light gradient end
  
  // UI Colors - Premium Dark Theme (from React app)
  static const Color background = Color(0xFF0A0A0A); // Pure depth
  static const Color card = Color(0xFF141414); // Glass cards
  static const Color surface = Color(0xFF1A1A1A);
  static const Color border = Color(0xFF2A2A2A);
  
  // Secondary & Accent Colors
  static const Color secondary = Color(0xFF00D4AA); // Emerald/Mint
  static const Color accent = Color(0xFF00C2FF); // Electric Blue
  static const Color success = Color(0xFF00E676);
  static const Color error = Color(0xFFFF3D00);
  static const Color warning = Color(0xFFFFC107);
  
  // Text Colors - React App Consistency
  static const Color text = Color(0xFFFFFFFF); // Main text
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFFA0A0A0);
  static const Color textDim = Color(0xFF666666);
  static const Color textDimmer = Color(0xFF404040);
  static const Color textTertiary = Color(0xFF888888); // Added for compatibility
  
  // Glass Effects - Enhanced
  static Color glassBackground = Colors.white.withOpacity(0.02);
  static Color glassBorder = Colors.white.withOpacity(0.05);
  static Color glassHeavy = Colors.white.withOpacity(0.08);
  
  // Status Colors (from React app)
  static const Color emerald = Color(0xFF00D4AA);
  static const Color purple = Color(0xFF8B5CF6);
  static const Color blue = Color(0xFF3B82F6);
  static const Color amber = Color(0xFFF59E0B);
  
  // Gradient Colors
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primary, primaryLt],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient secondaryGradient = LinearGradient(
    colors: [secondary, Color(0xFF00F5D4)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
