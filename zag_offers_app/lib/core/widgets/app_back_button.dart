import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../utils/navigation_service.dart';
import 'bouncy_tap.dart';

/// A unified, directionality-aware back button for Arabic RTL and LTR layouts.
/// Flutter automatically mirrors [Icons.arrow_back_ios_new_rounded] in RTL to point RIGHT (>),
/// and in LTR to point LEFT (<).
class AppBackButton extends StatelessWidget {
  final Color? color;
  final VoidCallback? onPressed;
  final double size;
  final EdgeInsetsGeometry padding;

  const AppBackButton({
    super.key,
    this.color,
    this.onPressed,
    this.size = 18,
    this.padding = const EdgeInsets.all(8),
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final iconColor = color ?? theme.iconTheme.color ?? (theme.brightness == Brightness.dark ? Colors.white : Colors.black87);

    return BouncyTap(
      onTap: () {
        HapticFeedback.lightImpact();
        if (onPressed != null) {
          onPressed!();
        } else {
          Navigator.maybePop(context);
        }
      },
      child: Padding(
        padding: padding,
        child: Icon(
          NavigationService.getBackIcon(context),
          size: size,
          color: iconColor,
        ),
      ),
    );
  }
}
