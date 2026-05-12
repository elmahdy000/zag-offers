import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTheme {
  // Text Styles - React App Consistency
  static TextStyle get heading1 => GoogleFonts.cairo(
    fontSize: 48,
    fontWeight: FontWeight.w900,
    color: AppColors.text,
    letterSpacing: -1.5,
    height: 1.1,
  );

  static TextStyle get heading2 => GoogleFonts.cairo(
    fontSize: 36,
    fontWeight: FontWeight.w900,
    color: AppColors.text,
    letterSpacing: -1,
    height: 1.2,
  );

  static TextStyle get heading3 => GoogleFonts.cairo(
    fontSize: 24,
    fontWeight: FontWeight.w900,
    color: AppColors.text,
    letterSpacing: -0.5,
    height: 1.3,
  );

  static TextStyle get title => GoogleFonts.cairo(
    fontSize: 18,
    fontWeight: FontWeight.w900,
    color: AppColors.text,
    letterSpacing: 0.2,
  );

  static TextStyle get body => GoogleFonts.cairo(
    fontSize: 14,
    fontWeight: FontWeight.w700,
    color: AppColors.textSecondary,
    letterSpacing: 0.1,
  );

  static TextStyle get caption => GoogleFonts.cairo(
    fontSize: 12,
    fontWeight: FontWeight.w700,
    color: AppColors.textDim,
    letterSpacing: 0.2,
  );

  static TextStyle get small => GoogleFonts.cairo(
    fontSize: 10,
    fontWeight: FontWeight.w900,
    color: AppColors.textDimmer,
    letterSpacing: 0.3,
  );

  // Glass Card Decoration
  static BoxDecoration get glassCard => BoxDecoration(
    color: AppColors.glassBackground,
    borderRadius: BorderRadius.circular(32),
    border: Border.all(
      color: AppColors.glassBorder,
      width: 1,
    ),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withOpacity(0.2),
        blurRadius: 20,
        offset: const Offset(0, 8),
      ),
    ],
  );

  static BoxDecoration get glassHeavy => BoxDecoration(
    color: AppColors.glassHeavy,
    borderRadius: BorderRadius.circular(40),
    border: Border.all(
      color: AppColors.glassBorder,
      width: 1,
    ),
    boxShadow: [
      BoxShadow(
        color: AppColors.primary.withOpacity(0.1),
        blurRadius: 40,
        offset: const Offset(0, 16),
      ),
    ],
  );

  // Button Styles
  static ButtonStyle get primaryButton => ElevatedButton.styleFrom(
    backgroundColor: AppColors.primary,
    foregroundColor: Colors.white,
    elevation: 0,
    shadowColor: AppColors.primary.withValues(alpha: 0.3),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(32),
    ),
    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
    textStyle: GoogleFonts.cairo(
      fontSize: 14,
      fontWeight: FontWeight.w900,
      letterSpacing: 0.2,
    ),
  );

  static ButtonStyle get secondaryButton => ElevatedButton.styleFrom(
    backgroundColor: AppColors.glassBackground,
    foregroundColor: AppColors.text,
    elevation: 0,
    side: const BorderSide(
      color: AppColors.glassBorder,
      width: 1,
    ),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(32),
    ),
    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
    textStyle: GoogleFonts.cairo(
      fontSize: 14,
      fontWeight: FontWeight.w900,
      letterSpacing: 0.2,
    ),
  );

  // Input Decoration
  static InputDecoration get inputDecoration => InputDecoration(
    filled: true,
    fillColor: AppColors.glassBackground,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(20),
      borderSide: const BorderSide(color: AppColors.glassBorder),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(20),
      borderSide: const BorderSide(color: AppColors.glassBorder),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(20),
      borderSide: const BorderSide(color: AppColors.primary),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(20),
      borderSide: const BorderSide(color: AppColors.error),
    ),
    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
    hintStyle: GoogleFonts.cairo(
      color: AppColors.textDimmer,
      fontWeight: FontWeight.w700,
      fontSize: 14,
    ),
    labelStyle: GoogleFonts.cairo(
      color: AppColors.textDim,
      fontWeight: FontWeight.w900,
      fontSize: 10,
      letterSpacing: 0.3,
    ),
  );

  // Complete ThemeData
  static ThemeData get darkTheme => ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: AppColors.background,
    colorScheme: const ColorScheme.dark(
      primary: AppColors.primary,
      secondary: AppColors.secondary,
      surface: AppColors.surface,
      background: AppColors.background,
      error: AppColors.error,
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onSurface: AppColors.text,
      onBackground: AppColors.text,
      onError: Colors.white,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.background,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: heading2,
      iconTheme: const IconThemeData(
        color: AppColors.text,
        size: 24,
      ),
    ),
    cardTheme: CardTheme(
      color: AppColors.card,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: AppColors.border, width: 1),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: primaryButton,
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: secondaryButton,
    ),
    inputDecorationTheme: InputDecorationTheme(
      ...inputDecoration,
    ),
    textTheme: GoogleFonts.cairoTextTheme(
      ThemeData.dark().textTheme,
    ).copyWith(
      displayLarge: heading1,
      displayMedium: heading2,
      displaySmall: heading3,
      headlineLarge: heading3,
      headlineMedium: title,
      headlineSmall: title,
      titleLarge: title,
      titleMedium: body,
      titleSmall: body,
      bodyLarge: body,
      bodyMedium: body,
      bodySmall: caption,
      labelLarge: body,
      labelMedium: caption,
      labelSmall: small,
    ),
    iconTheme: const IconThemeData(
      color: AppColors.textSecondary,
      size: 20,
    ),
    dividerTheme: const DividerThemeData(
      color: AppColors.border,
      thickness: 1,
    ),
  );
}
