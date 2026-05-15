import 'package:flutter/material.dart';
import 'package:zag_offers_app/core/theme/app_colors.dart';

class SnackBarUtils {
  static void showSuccess(BuildContext context, String message) {
    _show(
      context,
      message,
      backgroundColor: const Color(0xFF0F9D58),
      icon: Icons.check_circle_rounded,
    );
  }

  static void showError(BuildContext context, String message) {
    _show(
      context,
      message,
      backgroundColor: AppColors.error,
      icon: Icons.error_rounded,
    );
  }

  static void showInfo(BuildContext context, String message) {
    _show(
      context,
      message,
      backgroundColor: AppColors.primary,
      icon: Icons.info_rounded,
    );
  }

  static void _show(
    BuildContext context,
    String message, {
    required Color backgroundColor,
    required IconData icon,
  }) {
    final messenger = ScaffoldMessenger.of(context);
    final mediaQuery = MediaQuery.of(context);
    final bottomOffset = 20 + mediaQuery.padding.bottom + mediaQuery.viewInsets.bottom;

    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        content: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 13.5,
                  height: 1.25,
                ),
              ),
            ),
          ],
        ),
        backgroundColor: backgroundColor,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(
            color: Colors.white.withValues(alpha: 0.16),
            width: 1,
          ),
        ),
        margin: EdgeInsets.fromLTRB(16, 12, 16, bottomOffset),
        elevation: 8,
        dismissDirection: DismissDirection.horizontal,
        showCloseIcon: true,
        closeIconColor: Colors.white.withValues(alpha: 0.9),
        duration: const Duration(seconds: 3),
      ),
    );
  }
}
