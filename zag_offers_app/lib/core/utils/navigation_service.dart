import 'package:flutter/material.dart';

class NavigationService {
  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  /// Returns the semantic back icon.
  /// Flutter automatically mirrors [Icons.arrow_back_ios_new_rounded] (matchTextDirection: true):
  /// - In LTR: renders '<' (points left / back).
  /// - In RTL: automatically flipped by Flutter to '>' (points right / back).
  static IconData getBackIcon(BuildContext context) {
    return Icons.arrow_back_ios_new_rounded;
  }

  /// Returns the semantic forward icon.
  /// Flutter automatically mirrors [Icons.arrow_forward_ios_rounded] (matchTextDirection: true):
  /// - In LTR: renders '>' (points right / forward).
  /// - In RTL: automatically flipped by Flutter to '<' (points left / forward).
  static IconData getForwardIcon(BuildContext context) {
    return Icons.arrow_forward_ios_rounded;
  }
}
