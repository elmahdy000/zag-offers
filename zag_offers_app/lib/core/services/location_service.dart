import 'package:geolocator/geolocator.dart';

class LocationService {
  static double? userLatitude;
  static double? userLongitude;

  static const double defaultLat = 30.5877;
  static const double defaultLng = 31.5020;

  static double get currentLatitude => userLatitude ?? defaultLat;
  static double get currentLongitude => userLongitude ?? defaultLng;

  static Future<void> initialize() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return;

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) return;
      }

      if (permission == LocationPermission.deniedForever) return;

      Position position = await Geolocator.getCurrentPosition(
        locationSettings: LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: const Duration(seconds: 10),
        ),
      );
      userLatitude = position.latitude;
      userLongitude = position.longitude;
    } catch (_) {}
  }

  /// Calculates the distance in meters from the user's current location to [targetLat, targetLng].
  static double distanceBetween(double targetLat, double targetLng) {
    return Geolocator.distanceBetween(
      currentLatitude,
      currentLongitude,
      targetLat,
      targetLng,
    );
  }

  /// Returns a user-friendly Arabic formatted distance string (e.g., "650 متر" or "2.3 كم").
  static String formatDistance(double meters) {
    if (meters < 1000) {
      return '${meters.round()} متر';
    } else {
      final km = meters / 1000;
      return '${km.toStringAsFixed(1)} كم';
    }
  }

  /// Convenience method that calculates and formats the distance to [targetLat, targetLng].
  static String? getFormattedDistanceTo(double? targetLat, double? targetLng) {
    if (targetLat == null || targetLng == null) return null;
    final meters = distanceBetween(targetLat, targetLng);
    return formatDistance(meters);
  }
}
