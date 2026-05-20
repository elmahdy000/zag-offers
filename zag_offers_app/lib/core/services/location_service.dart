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
}
