import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:zag_offers_app/core/constants/app_constants.dart';

import '../../domain/entities/store_entity.dart';
import 'store_detail_page.dart';

class MapPage extends StatefulWidget {
  final List<StoreEntity> stores;

  const MapPage({super.key, required this.stores});

  @override
  State<MapPage> createState() => _MapPageState();
}

class _MapPageState extends State<MapPage> {
  GoogleMapController? mapController;
  final Map<String, BitmapDescriptor> _markerIcons = {};

  static const LatLng _zagazigCenter = LatLng(30.5877, 31.502);

  List<StoreEntity> get _storesWithCoordinates => widget.stores
      .where((store) => store.latitude != null && store.longitude != null)
      .toList();

  @override
  void initState() {
    super.initState();
    _loadCustomMarkers();
  }

  Future<void> _loadCustomMarkers() async {
    final categories = <String, IconData>{
      'مطاعم': Icons.restaurant,
      'ملابس': Icons.checkroom,
      'إلكترونيات': Icons.devices,
      'صيدليات': Icons.local_pharmacy,
      'سوبر ماركت': Icons.shopping_cart,
    };

    final colors = <String, Color>{
      'مطاعم': Colors.orange,
      'ملابس': Colors.purple,
      'إلكترونيات': Colors.blue,
      'صيدليات': Colors.green,
      'سوبر ماركت': Colors.red,
    };

    for (final entry in categories.entries) {
      final icon = await _createMarkerImageFromIcon(
        entry.value,
        colors[entry.key]!,
      );
      if (!mounted) return;
      setState(() {
        _markerIcons[entry.key] = icon;
      });
    }
  }

  Future<BitmapDescriptor> _createMarkerImageFromIcon(
    IconData icon,
    Color color,
  ) async {
    final pictureRecorder = ui.PictureRecorder();
    final canvas = Canvas(pictureRecorder);
    const size = 100.0;

    final paint = Paint()..color = color;
    canvas.drawCircle(const Offset(size / 2, size / 2), size / 2, paint);

    final textPainter = TextPainter(textDirection: TextDirection.rtl);
    textPainter.text = TextSpan(
      text: String.fromCharCode(icon.codePoint),
      style: TextStyle(
        fontSize: 60,
        fontFamily: icon.fontFamily,
        color: Colors.white,
      ),
    );
    textPainter.layout();
    textPainter.paint(
      canvas,
      Offset((size - textPainter.width) / 2, (size - textPainter.height) / 2),
    );

    final image = await pictureRecorder.endRecording().toImage(
          size.toInt(),
          size.toInt(),
        );
    final data = await image.toByteData(format: ui.ImageByteFormat.png);
    return BitmapDescriptor.bytes(data!.buffer.asUint8List());
  }

  Set<Marker> _createMarkers() {
    return _storesWithCoordinates.map((store) {
      return Marker(
        markerId: MarkerId(store.id),
        position: LatLng(store.latitude!, store.longitude!),
        icon: _markerIcons[store.category] ?? BitmapDescriptor.defaultMarker,
        infoWindow: InfoWindow(
          title: store.name,
          snippet: store.category ?? store.area,
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => StoreDetailPage(store: store),
              ),
            );
          },
        ),
      );
    }).toSet();
  }

  @override
  Widget build(BuildContext context) {
    final storesWithCoordinates = _storesWithCoordinates;
    final skippedStores = widget.stores.length - storesWithCoordinates.length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('خريطة العروض'),
      ),
      body: !AppConstants.mapsEnabled
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.map_outlined,
                      size: 72,
                      color: Colors.grey[300],
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'الخريطة غير مفعلة حاليًا',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'أضف Google Maps API key لتفعيل عرض المتاجر على الخريطة بدون انهيار التطبيق.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.black54),
                    ),
                  ],
                ),
              ),
            )
          : storesWithCoordinates.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.location_off_rounded,
                          size: 72,
                          color: Colors.grey[300],
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'لا توجد متاجر بموقع متاح حاليًا',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'ستظهر المتاجر هنا عندما تتوفر لها إحداثيات صحيحة.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.black54),
                        ),
                      ],
                    ),
                  ),
                )
              : Stack(
                  children: [
                    GoogleMap(
                      initialCameraPosition: CameraPosition(
                        target: LatLng(
                          storesWithCoordinates.first.latitude ??
                              _zagazigCenter.latitude,
                          storesWithCoordinates.first.longitude ??
                              _zagazigCenter.longitude,
                        ),
                        zoom: 14,
                      ),
                      markers: _createMarkers(),
                      onMapCreated: (controller) {
                        mapController = controller;
                      },
                    ),
                    Positioned(
                      top: 16,
                      right: 16,
                      left: 16,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _MapInfoChip(
                            text:
                                'يتم عرض ${storesWithCoordinates.length} متجر على الخريطة',
                          ),
                          if (skippedStores > 0) ...[
                            const SizedBox(height: 8),
                            _MapInfoChip(
                              text:
                                  'تم تجاهل $skippedStores متجر لعدم توفر الموقع',
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }
}

class _MapInfoChip extends StatelessWidget {
  final String text;

  const _MapInfoChip({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 12,
          ),
        ],
      ),
      child: Text(
        text,
        style: const TextStyle(fontWeight: FontWeight.w600),
      ),
    );
  }
}
