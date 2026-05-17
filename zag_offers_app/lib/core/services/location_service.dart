import 'package:geolocator/geolocator.dart';

class LocationService {
  static double? userLatitude;
  static double? userLongitude;
  static bool hasLocation = false;

  // Coordinates default to center of Zagazig, Sharkia
  static const double defaultLat = 30.5877;
  static const double defaultLng = 31.5020;

  static double get currentLatitude => userLatitude ?? defaultLat;
  static double get currentLongitude => userLongitude ?? defaultLng;

  /// Fetches the user's actual live GPS coordinates.
  /// Asks for location permissions if not yet granted.
  static Future<void> initialize() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        return;
      }

      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.medium,
        timeLimit: const Duration(seconds: 4),
      );
      userLatitude = position.latitude;
      userLongitude = position.longitude;
      hasLocation = true;
    } catch (_) {
      // Fallback gracefully to default coordinates
    }
  }
}
