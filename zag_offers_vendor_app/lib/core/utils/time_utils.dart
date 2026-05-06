import 'package:intl/intl.dart';

class TimeUtils {
  static String getRelativeTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inMinutes < 1) {
      return 'الآن';
    } else if (difference.inMinutes < 60) {
      return 'منذ ${difference.inMinutes} دقيقة';
    } else if (difference.inHours < 24) {
      if (difference.inHours == 1) return 'منذ ساعة';
      if (difference.inHours == 2) return 'منذ ساعتين';
      return 'منذ ${difference.inHours} ساعة';
    } else if (difference.inDays < 7) {
      if (difference.inDays == 1) return 'أمس';
      if (difference.inDays == 2) return 'منذ يومين';
      return 'منذ ${difference.inDays} أيام';
    } else {
      return DateFormat('yyyy/MM/dd').format(dateTime);
    }
  }
}
