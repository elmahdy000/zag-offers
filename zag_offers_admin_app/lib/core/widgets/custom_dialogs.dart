import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:zag_offers_admin_app/core/theme/app_colors.dart';

class CustomDialogs {
  static Future<bool?> showConfirmDialog({
    required BuildContext context,
    required String title,
    required String message,
    String confirmText = 'تأكيد',
    String cancelText = 'إلغاء',
    bool isDestructive = false,
  }) {
    return showGeneralDialog<bool>(
      context: context,
      barrierDismissible: true,
      barrierLabel: '',
      barrierColor: Colors.black.withValues(alpha: 0.5),
      pageBuilder: (context, anim1, anim2) => const SizedBox(),
      transitionBuilder: (context, anim1, anim2, child) {
        return BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 5 * anim1.value, sigmaY: 5 * anim1.value),
          child: ScaleTransition(
            scale: Tween<double>(begin: 0.8, end: 1.0).animate(CurvedAnimation(parent: anim1, curve: Curves.easeOutBack)),
            child: FadeTransition(
              opacity: anim1,
              child: AlertDialog(
                backgroundColor: Colors.white.withValues(alpha: 0.9),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                title: Text(title, style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 18)),
                content: Text(message, style: GoogleFonts.cairo(fontSize: 14, color: AppColors.textSecondary)),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context, false),
                    child: Text(cancelText, style: GoogleFonts.cairo(color: AppColors.textSecondary)),
                  ),
                  ElevatedButton(
                    onPressed: () => Navigator.pop(context, true),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isDestructive ? AppColors.error : AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    child: Text(confirmText, style: GoogleFonts.cairo(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  static Future<void> showInfoDialog({
    required BuildContext context,
    required String title,
    required String message,
    IconData icon = Icons.info_outline_rounded,
    Color iconColor = AppColors.primary,
  }) {
    return showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: '',
      barrierColor: Colors.black.withValues(alpha: 0.4),
      pageBuilder: (context, anim1, anim2) => const SizedBox(),
      transitionBuilder: (context, anim1, anim2, child) {
        return ScaleTransition(
          scale: anim1,
          child: FadeTransition(
            opacity: anim1,
            child: AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: iconColor.withValues(alpha: 0.1), shape: BoxShape.circle),
                    child: Icon(icon, color: iconColor, size: 40),
                  ),
                  const SizedBox(height: 20),
                  Text(title, textAlign: TextAlign.center, style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 18)),
                  const SizedBox(height: 12),
                  Text(message, textAlign: TextAlign.center, style: GoogleFonts.cairo(fontSize: 14, color: AppColors.textSecondary)),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('فهمت'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
