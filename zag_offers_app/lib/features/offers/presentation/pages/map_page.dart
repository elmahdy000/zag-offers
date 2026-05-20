import 'dart:math' as math;
import 'dart:ui' as ui;
import 'dart:async';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_iconly/flutter_iconly.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:zag_offers_app/core/theme/app_colors.dart';
import 'package:zag_offers_app/core/services/location_service.dart';
import 'package:zag_offers_app/core/utils/category_utils.dart';
import '../../domain/entities/store_entity.dart';
import '../../domain/entities/offer_entity.dart';
import 'store_detail_page.dart';
import 'offer_detail_page.dart';

class MapPage extends StatefulWidget {
  final List<StoreEntity> stores;
  final List<OfferEntity> offers;

  const MapPage({
    super.key,
    required this.stores,
    this.offers = const [],
  });

  @override
  State<MapPage> createState() => _MapPageState();
}

class _MapPageState extends State<MapPage> with TickerProviderStateMixin {
  static final _appBarTitleStyle = GoogleFonts.cairo(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18);
  static final _carouselCategoryStyle = GoogleFonts.cairo(fontSize: 10, fontWeight: FontWeight.bold);
  static final _carouselNameStyle = GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 14);
  static final _carouselDistStyle = GoogleFonts.cairo(fontSize: 11, color: Colors.grey);
  static final _emptyTitleStyle = GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 18);
  static final _emptySubStyle = GoogleFonts.cairo(fontSize: 14, color: Colors.grey);

  // Controllers
  late AnimationController _sweepController;
  late PageController _pageController;
  GoogleMapController? _mapController;

  // State Management
  int _selectedStoreIndex = 0;
  bool _showRadarView = false;
  String _searchQuery = '';
  String _selectedCategory = 'الكل';

  // Constants
  static const double _zagazigLat = 30.5877;
  static const double _zagazigLng = 31.5020;

  // Stores lists
  late List<StoreEntity> _validStores;
  late List<StoreEntity> _filteredStores;
  late List<_RadarNode> _radarNodes;

  // Caching for custom Google Map Marker Icons
  final Map<String, BitmapDescriptor> _markerIconCache = {};

  @override
  void initState() {
    super.initState();
    _sweepController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat();

    _pageController = PageController(viewportFraction: 0.88);

    _prepareStores();
    _generateFallbackIcons();
  }

  void _prepareStores() {
    final Map<String, StoreEntity> uniqueStoresMap = {};
    
    // Add stores from featured stores list
    for (var store in widget.stores) {
      uniqueStoresMap[store.id] = store;
    }
    
    // Dynamically extract stores from the offers list (very useful if featuredStores is empty)
    for (var offer in widget.offers) {
      if (offer.store != null) {
        uniqueStoresMap[offer.store.id] = offer.store;
      }
    }
    
    _validStores = uniqueStoresMap.values.toList();
    _filteredStores = List.from(_validStores);
    _prepareRadarNodes();
  }

  void _prepareRadarNodes() {
    _radarNodes = [];
    if (_filteredStores.isEmpty) return;

    final double centerLat = LocationService.currentLatitude;
    final double centerLng = LocationService.currentLongitude;

    for (int i = 0; i < _filteredStores.length; i++) {
      final store = _filteredStores[i];
      // Generate slightly offset visual positions if coordinates are missing, using a stable seed
      final double lat = store.latitude ?? (centerLat + (math.Random(store.id.hashCode).nextDouble() - 0.5) * 0.012);
      final double lng = store.longitude ?? (centerLng + (math.Random(store.id.hashCode + 1).nextDouble() - 0.5) * 0.012);

      final double dy = lat - centerLat;
      final double dx = lng - centerLng;
      final double distance = math.sqrt(dx * dx + dy * dy);
      final double angle = math.atan2(dy, dx);

      _radarNodes.add(_RadarNode(
        index: i,
        store: store,
        angle: angle,
        relativeDistance: distance,
      ));
    }

    if (_radarNodes.isNotEmpty) {
      double maxDist = _radarNodes.map((n) => n.relativeDistance).reduce(math.max);
      if (maxDist == 0) maxDist = 1.0;

      for (var node in _radarNodes) {
        node.normalizedRadius = 0.2 + (node.relativeDistance / maxDist) * 0.65;
      }
    }
  }

  // Generates clean circular vector markers instantly to provide lag-free initial maps rendering
  Future<void> _generateFallbackIcons() async {
    for (var store in _validStores) {
      for (bool selected in [true, false]) {
        final String cacheKey = "${store.id}_${selected ? 'selected' : 'normal'}";
        if (_markerIconCache.containsKey(cacheKey)) continue;

        final descriptor = await _drawFallbackMarker(80, store, selected);
        _markerIconCache[cacheKey] = descriptor;
      }
    }
    if (mounted) {
      setState(() {});
    }

    // Lazily fetch real network store logos to elegantly replace the fallbacks
    _loadRealLogos();
  }

  Future<void> _loadRealLogos() async {
    for (var store in _validStores) {
      if (store.logo != null && store.logo!.isNotEmpty) {
        _fetchAndCacheLogo(store, 80);
      }
    }
  }

  Future<void> _fetchAndCacheLogo(StoreEntity store, int size) async {
    final String cacheKeySelected = "${store.id}_selected";
    final String cacheKeyNormal = "${store.id}_normal";

    if (_markerIconCache.containsKey(cacheKeySelected) && _markerIconCache.containsKey(cacheKeyNormal)) {
      // Check if we already have the custom images loaded
      if (_markerIconCache[cacheKeySelected] != BitmapDescriptor.defaultMarker) {
        return;
      }
    }

    try {
      final NetworkImage networkImage = NetworkImage(store.logo!);
      final ImageStream stream = networkImage.resolve(ImageConfiguration.empty);
      final Completer<ui.Image> completer = Completer<ui.Image>();
      ImageStreamListener? listener;
      listener = ImageStreamListener((ImageInfo info, bool _) {
        completer.complete(info.image);
        stream.removeListener(listener!);
      }, onError: (dynamic exception, StackTrace? stackTrace) {
        completer.completeError(exception);
        stream.removeListener(listener!);
      });
      stream.addListener(listener);

      final ui.Image image = await completer.future;

      for (bool selected in [true, false]) {
        final ui.PictureRecorder pictureRecorder = ui.PictureRecorder();
        final Canvas canvas = Canvas(pictureRecorder);
        final Paint paint = Paint()..isAntiAlias = true;
        final double radius = size / 2;

        if (selected) {
          paint.color = AppColors.primary; // Orange selected outline
          canvas.drawCircle(Offset(radius, radius), radius, paint);
          paint.color = Colors.white;
          canvas.drawCircle(Offset(radius, radius), radius - 3.0, paint);
        } else {
          paint.color = Colors.white.withOpacity(0.85);
          canvas.drawCircle(Offset(radius, radius), radius, paint);
        }

        final double innerRadius = selected ? radius - 6.0 : radius - 3.0;
        final Rect rect = Rect.fromCircle(center: Offset(radius, radius), radius: innerRadius);
        canvas.save();
        canvas.clipPath(Path()..addOval(rect));

        paintImage(
          canvas: canvas,
          rect: rect,
          image: image,
          fit: BoxFit.cover,
        );

        canvas.restore();

        final ui.Image resultImage = await pictureRecorder.endRecording().toImage(size, size);
        final ByteData? byteData = await resultImage.toByteData(format: ui.ImageByteFormat.png);
        if (byteData != null) {
          final BitmapDescriptor descriptor = BitmapDescriptor.fromBytes(byteData.buffer.asUint8List());
          _markerIconCache[selected ? cacheKeySelected : cacheKeyNormal] = descriptor;
        }
      }

      if (mounted) {
        setState(() {});
      }
    } catch (_) {
      // Gracefully let fallback handle any missing logos or offline errors
    }
  }

  Future<BitmapDescriptor> _drawFallbackMarker(int size, StoreEntity store, bool isSelected) async {
    final ui.PictureRecorder pictureRecorder = ui.PictureRecorder();
    final Canvas canvas = Canvas(pictureRecorder);
    final Paint paint = Paint()..isAntiAlias = true;
    final double radius = size / 2;

    if (isSelected) {
      paint.color = AppColors.primary;
      canvas.drawCircle(Offset(radius, radius), radius, paint);
      paint.color = Colors.white;
      canvas.drawCircle(Offset(radius, radius), radius - 3.0, paint);
    } else {
      paint.color = Colors.white.withOpacity(0.85);
      canvas.drawCircle(Offset(radius, radius), radius, paint);
    }

    final double innerRadius = isSelected ? radius - 6.0 : radius - 3.0;
    final Rect rect = Rect.fromCircle(center: Offset(radius, radius), radius: innerRadius);
    canvas.save();
    canvas.clipPath(Path()..addOval(rect));

    paint.color = _getCategoryColor(store.category);
    canvas.drawRect(rect, paint);

    final String initial = store.name.isNotEmpty ? store.name[0] : 'S';
    final TextPainter textPainter = TextPainter(
      textDirection: TextDirection.rtl,
      textAlign: TextAlign.center,
    );
    textPainter.text = TextSpan(
      text: initial,
      style: GoogleFonts.cairo(
        color: Colors.white,
        fontWeight: FontWeight.bold,
        fontSize: isSelected ? 22 : 18,
      ),
    );
    textPainter.layout();
    textPainter.paint(
      canvas,
      Offset(radius - textPainter.width / 2, radius - textPainter.height / 2),
    );

    canvas.restore();

    final ui.Image image = await pictureRecorder.endRecording().toImage(size, size);
    final ByteData? byteData = await image.toByteData(format: ui.ImageByteFormat.png);
    if (byteData == null) return BitmapDescriptor.defaultMarker;

    return BitmapDescriptor.fromBytes(byteData.buffer.asUint8List());
  }

  @override
  void dispose() {
    _sweepController.dispose();
    _pageController.dispose();
    _mapController?.dispose();
    super.dispose();
  }

  IconData _getCategoryIcon(String? category) {
    return category != null ? CategoryUtils.getIcon(category) : Icons.storefront_rounded;
  }

  Color _getCategoryColor(String? category) {
    return category != null ? CategoryUtils.getColor(category) : AppColors.primary;
  }

  double _calculateRealDistance(StoreEntity store) {
    if (store.latitude == null || store.longitude == null) {
      // Use stable seeded random distance so it does not flicker on rebuilds
      return (400 + math.Random(store.id.hashCode).nextInt(800)).toDouble();
    }
    
    // Calculate distance from live user position rather than central static coordinate
    final double centerLat = LocationService.currentLatitude;
    final double centerLng = LocationService.currentLongitude;

    const double p = 0.017453292519943295;
    final double a = 0.5 -
        math.cos((store.latitude! - centerLat) * p) / 2 +
        math.cos(centerLat * p) *
            math.cos(store.latitude! * p) *
            (1 - math.cos((store.longitude! - centerLng) * p)) /
            2;
    return 12742 * math.asin(math.sqrt(a)) * 1000;
  }

  List<String> get _categories {
    final List<String> cats = ['الكل'];
    for (var store in _validStores) {
      if (store.category != null && store.category!.isNotEmpty) {
        final displayName = CategoryUtils.getDisplayName(store.category!);
        if (!cats.contains(displayName)) {
          cats.add(displayName);
        }
      }
    }
    return cats;
  }

  void _applyFilters() {
    _filteredStores = _validStores.where((store) {
      final bool matchesCategory = _selectedCategory == 'الكل' || 
          (store.category != null && CategoryUtils.getDisplayName(store.category!) == _selectedCategory);
      
      final List<OfferEntity> storeOffers = widget.offers.where((o) => o.store.id == store.id).toList();
      final bool matchesSearch = _searchQuery.isEmpty || 
          store.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          storeOffers.any((offer) => offer.title.toLowerCase().contains(_searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    }).toList();

    _prepareRadarNodes();

    if (_selectedStoreIndex >= _filteredStores.length) {
      _selectedStoreIndex = 0;
    }

    setState(() {});

    if (_filteredStores.isNotEmpty) {
      _animateCameraToStore(_filteredStores[_selectedStoreIndex]);
      if (_pageController.hasClients) {
        _pageController.jumpToPage(_selectedStoreIndex);
      }
    }
  }

  void _animateCameraToStore(StoreEntity store) {
    if (_mapController != null) {
      final double centerLat = LocationService.currentLatitude;
      final double centerLng = LocationService.currentLongitude;
      final double lat = store.latitude ?? (centerLat + (math.Random(store.id.hashCode).nextDouble() - 0.5) * 0.012);
      final double lng = store.longitude ?? (centerLng + (math.Random(store.id.hashCode + 1).nextDouble() - 0.5) * 0.012);

      _mapController!.animateCamera(
        CameraUpdate.newLatLngZoom(
          LatLng(lat, lng),
          16.0,
        ),
      );
    }
  }

  void _onMapCreated(GoogleMapController controller) {
    _mapController = controller;
    _mapController!.setMapStyle(_darkMapStyle);
    if (_filteredStores.isNotEmpty) {
      _animateCameraToStore(_filteredStores[_selectedStoreIndex]);
    }
  }

  Set<Marker> _buildMapMarkers() {
    final Set<Marker> markers = {};
    final double centerLat = LocationService.currentLatitude;
    final double centerLng = LocationService.currentLongitude;

    for (int i = 0; i < _filteredStores.length; i++) {
      final store = _filteredStores[i];
      final double lat = store.latitude ?? (centerLat + (math.Random(store.id.hashCode).nextDouble() - 0.5) * 0.012);
      final double lng = store.longitude ?? (centerLng + (math.Random(store.id.hashCode + 1).nextDouble() - 0.5) * 0.012);

      final isSelected = _selectedStoreIndex == i;
      final String cacheKey = "${store.id}_${isSelected ? 'selected' : 'normal'}";
      final BitmapDescriptor? icon = _markerIconCache[cacheKey];

      markers.add(
        Marker(
          markerId: MarkerId(store.id),
          position: LatLng(lat, lng),
          icon: icon ?? BitmapDescriptor.defaultMarkerWithHue(
            isSelected ? BitmapDescriptor.hueOrange : BitmapDescriptor.hueRed
          ),
          onTap: () {
            setState(() {
              _selectedStoreIndex = i;
            });
            _pageController.animateToPage(
              i,
              duration: const Duration(milliseconds: 400),
              curve: Curves.easeInOut,
            );
            _animateCameraToStore(store);
          },
        ),
      );
    }
    return markers;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final backgroundColor = isDark ? AppColors.darkBackground : const Color(0xFF0F172A);

    return Scaffold(
      backgroundColor: backgroundColor,
      body: Stack(
        children: [
          // 1. Google Map always stays in the background tree to preserve state and load fast
          Positioned.fill(
            child: _buildGoogleMapWidget(),
          ),

          // 2. Radar view overlays on top with smooth fade transition
          Positioned.fill(
            child: IgnorePointer(
              ignoring: !_showRadarView,
              child: AnimatedOpacity(
                duration: const Duration(milliseconds: 300),
                opacity: _showRadarView ? 1.0 : 0.0,
                child: _buildRadarWidget(),
              ),
            ),
          ),

          // 2. Premium Top Controls Overlay
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            left: 0,
            right: 0,
            child: _buildTopPanel(context),
          ),

          // 3. Bottom Cards Carousel Overlay
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: _filteredStores.isEmpty ? _buildEmptyState() : _buildBottomCarousel(),
          ),
        ],
      ),
    );
  }

  Widget _buildGoogleMapWidget() {
    final double centerLat = LocationService.userLatitude ?? _zagazigLat;
    final double centerLng = LocationService.userLongitude ?? _zagazigLng;

    return GoogleMap(
      initialCameraPosition: CameraPosition(
        target: LatLng(centerLat, centerLng),
        zoom: 15.0,
      ),
      onMapCreated: _onMapCreated,
      markers: _buildMapMarkers(),
      myLocationEnabled: true,
      myLocationButtonEnabled: false,
      zoomControlsEnabled: false,
      compassEnabled: false,
      mapToolbarEnabled: false,
    );
  }

  Widget _buildRadarWidget() {
    return Container(
      color: const Color(0xFF0F172A),
      child: Column(
        children: [
          const SizedBox(height: 160),
          Expanded(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final center = Offset(constraints.maxWidth / 2, constraints.maxHeight / 2 - 30);
                final radius = math.min(constraints.maxWidth, constraints.maxHeight) * 0.40;

                return Stack(
                  alignment: Alignment.center,
                  children: [
                    Positioned.fill(
                      child: AnimatedBuilder(
                        animation: _sweepController,
                        builder: (context, child) => child!,
                        child: CustomPaint(
                          painter: _RadarPainter(
                            sweepController: _sweepController,
                            primaryColor: AppColors.primary,
                          ),
                        ),
                      ),
                    ),
                    ..._buildRadarNodes(center, radius),
                    Positioned(
                      left: center.dx - 24,
                      top: center.dy - 24,
                      child: Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.primary.withOpacity(0.15),
                          border: Border.all(color: AppColors.primary, width: 2),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withOpacity(0.4),
                              blurRadius: 12,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.my_location_rounded,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
          const SizedBox(height: 220),
        ],
      ),
    );
  }

  List<Widget> _buildRadarNodes(Offset center, double radius) {
    return _radarNodes.map((node) {
      final isSelected = _selectedStoreIndex == node.index;
      final nodeRadius = node.normalizedRadius * radius;
      final x = center.dx + nodeRadius * math.cos(node.angle);
      final y = center.dy + nodeRadius * math.sin(node.angle);

      final storeColor = _getCategoryColor(node.store.category);

      final nodeChild = Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned.fill(
            child: ClipOval(
              child: node.store.logo != null && node.store.logo!.isNotEmpty
                  ? Image.network(
                      node.store.logo!,
                      width: double.infinity,
                      height: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Icon(
                        _getCategoryIcon(node.store.category),
                        color: Colors.white,
                        size: 14,
                      ),
                    )
                  : Icon(
                      _getCategoryIcon(node.store.category),
                      color: Colors.white,
                      size: 14,
                    ),
            ),
          ),
          if (node.store.logo != null && node.store.logo!.isNotEmpty)
            Positioned(
              right: -3,
              bottom: -3,
              child: Container(
                padding: const EdgeInsets.all(2.5),
                decoration: BoxDecoration(
                  color: storeColor,
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFF0F172A), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: storeColor.withOpacity(0.4),
                      blurRadius: 3,
                      spreadRadius: 0.5,
                    ),
                  ],
                ),
                child: Icon(
                  _getCategoryIcon(node.store.category),
                  color: Colors.white,
                  size: 8,
                ),
              ),
            ),
        ],
      );

      return Positioned(
        left: x - 22,
        top: y - 22,
        child: AnimatedBuilder(
          animation: _sweepController,
          builder: (context, child) {
            double diff = (_sweepController.value * 2 * math.pi - node.angle) % (2 * math.pi);
            bool isSweeping = diff < 0.25;

            return GestureDetector(
              onTap: () {
                setState(() {
                  _selectedStoreIndex = node.index;
                });
                _pageController.animateToPage(
                  node.index,
                  duration: const Duration(milliseconds: 400),
                  curve: Curves.easeInOut,
                );
              },
              child: SizedBox(
                width: 44,
                height: 44,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      width: isSelected ? 44 : (isSweeping ? 38 : 32),
                      height: isSelected ? 44 : (isSweeping ? 38 : 32),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isSelected
                            ? storeColor.withOpacity(0.25)
                            : const Color(0xFF1E293B).withOpacity(0.85),
                        border: Border.all(
                          color: isSelected
                              ? storeColor
                              : (isSweeping ? Colors.white : storeColor.withOpacity(0.6)),
                          width: isSelected ? 2.5 : 1.2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: storeColor.withOpacity(isSelected ? 0.5 : 0.15),
                            blurRadius: isSelected ? 10 : 4,
                            spreadRadius: isSelected ? 2 : 0.5,
                          ),
                        ],
                      ),
                      child: child,
                    ),
                    if (isSelected)
                      Positioned.fill(
                        child: _PulsingRing(color: storeColor),
                      ),
                  ],
                ),
              ),
            );
          },
          child: nodeChild,
        ),
      );
    }).toList();
  }

  Widget _buildTopPanel(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          // Row containing Back, Search and Recenter controls
          Row(
            children: [
              // Back Button
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B).withOpacity(0.9),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white10),
                ),
                child: IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
              const SizedBox(width: 8),

              // Search Bar
              Expanded(
                child: Container(
                  height: 48,
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B).withOpacity(0.9),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: Colors.white10),
                  ),
                  child: TextField(
                    onChanged: (val) {
                      _searchQuery = val;
                      _applyFilters();
                    },
                    style: GoogleFonts.cairo(color: Colors.white, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: "دور على مطعم، كافيه، جيم…",
                      hintStyle: GoogleFonts.cairo(color: Colors.white38, fontSize: 13),
                      prefixIcon: const Icon(IconlyLight.search, color: Colors.white38, size: 20),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // GPS Recenter Button
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B).withOpacity(0.9),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white10),
                ),
                child: IconButton(
                  icon: const Icon(Icons.gps_fixed_rounded, color: Colors.white, size: 20),
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    if (_mapController != null) {
                      final double userLat = LocationService.userLatitude ?? _zagazigLat;
                      final double userLng = LocationService.userLongitude ?? _zagazigLng;
                      _mapController!.animateCamera(
                        CameraUpdate.newLatLngZoom(LatLng(userLat, userLng), 15.0),
                      );
                    }
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Horizontal Category Selector Row & Mode switcher
          Row(
            children: [
              // Category chips list
              Expanded(
                child: SizedBox(
                  height: 38,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: _categories.length,
                    itemBuilder: (context, index) {
                      final cat = _categories[index];
                      final isSelected = _selectedCategory == cat;
                      return Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: ChoiceChip(
                          label: Text(
                            cat,
                            style: GoogleFonts.cairo(
                              color: isSelected ? Colors.white : Colors.white70,
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                            ),
                          ),
                          selected: isSelected,
                          selectedColor: AppColors.primary,
                          backgroundColor: const Color(0xFF1E293B).withOpacity(0.9),
                          checkmarkColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(18),
                            side: const BorderSide(color: Colors.white10),
                          ),
                          onSelected: (selected) {
                            if (selected) {
                              _selectedCategory = cat;
                              _applyFilters();
                            }
                          },
                        ),
                      );
                    },
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Switch Tab: Map / Radar Mode Toggle
              Container(
                height: 38,
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B).withOpacity(0.9),
                  borderRadius: BorderRadius.circular(19),
                  border: Border.all(color: Colors.white10),
                ),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () {
                        setState(() => _showRadarView = false);
                        _applyFilters();
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: !_showRadarView ? AppColors.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(19),
                        ),
                        child: Center(
                          child: Text(
                            'خريطة',
                            style: GoogleFonts.cairo(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
                    GestureDetector(
                      onTap: () {
                        setState(() => _showRadarView = true);
                        _applyFilters();
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: _showRadarView ? AppColors.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(19),
                        ),
                        child: Center(
                          child: Text(
                            'رادار',
                            style: GoogleFonts.cairo(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBottomCarousel() {
    return Container(
      height: 250,
      margin: const EdgeInsets.only(bottom: 24),
      child: PageView.builder(
        controller: _pageController,
        itemCount: _filteredStores.length,
        onPageChanged: (index) {
          setState(() {
            _selectedStoreIndex = index;
          });
          _animateCameraToStore(_filteredStores[index]);
        },
        itemBuilder: (context, index) {
          final store = _filteredStores[index];
          final distance = _calculateRealDistance(store);
          final categoryColor = _getCategoryColor(store.category);

          // Get offers for this store dynamically
          final storeOffers = widget.offers.where((o) => o.store.id == store.id).toList();
          final bool hasOffers = storeOffers.isNotEmpty;
          final String offerTitle = hasOffers ? storeOffers.first.title : "خصومات وعروض ممتازة بانتظارك";
          final String discountText = hasOffers ? storeOffers.first.discount : "خصم خاص";

          return AnimatedBuilder(
            animation: _pageController,
            builder: (context, child) {
              double value = 1.0;
              if (_pageController.position.haveDimensions) {
                value = (_pageController.page! - index).abs();
                value = (1 - (value * 0.08)).clamp(0.0, 1.0);
              }
              return Center(
                child: SizedBox(
                  height: Curves.easeOut.transform(value) * 235,
                  width: double.infinity,
                  child: child,
                ),
              );
            },
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B).withOpacity(0.95),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: _selectedStoreIndex == index ? AppColors.primary : Colors.white.withOpacity(0.08),
                  width: _selectedStoreIndex == index ? 2 : 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.4),
                    blurRadius: 16,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(23),
                child: Stack(
                  children: [
                    // Corner accent background blob
                    Positioned(
                      top: -40,
                      left: -40,
                      child: Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: categoryColor.withOpacity(0.08),
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 1. Store profile header
                          Row(
                            children: [
                              // Store Logo
                              Container(
                                width: 54,
                                height: 54,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: Colors.white12),
                                  color: const Color(0xFF0F172A),
                                ),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(15),
                                  child: store.logo != null && store.logo!.isNotEmpty
                                      ? Image.network(
                                          store.logo!,
                                          fit: BoxFit.cover,
                                          errorBuilder: (_, __, ___) => Icon(
                                            _getCategoryIcon(store.category),
                                            color: categoryColor,
                                            size: 24,
                                          ),
                                        )
                                      : Icon(
                                          _getCategoryIcon(store.category),
                                          color: categoryColor,
                                          size: 24,
                                        ),
                                ),
                              ),
                              const SizedBox(width: 12),

                              // Store info
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Text(
                                          store.name,
                                          style: _carouselNameStyle.copyWith(color: Colors.white),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(width: 6),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: categoryColor.withOpacity(0.15),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            store.category ?? 'عام',
                                            style: _carouselCategoryStyle.copyWith(color: categoryColor),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        const Icon(IconlyLight.location, color: Colors.white54, size: 13),
                                        const SizedBox(width: 4),
                                        Expanded(
                                          child: Text(
                                            '${store.area} (يبعد ${distance.toStringAsFixed(0)}م)',
                                            style: _carouselDistStyle.copyWith(color: Colors.white70),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Row(
                                          children: [
                                            const Icon(Icons.star_rounded, color: Colors.amber, size: 14),
                                            const SizedBox(width: 3),
                                            Text(
                                              store.rating.toStringAsFixed(1),
                                              style: GoogleFonts.inter(
                                                color: Colors.white,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 11,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const Divider(color: Colors.white10, height: 20),

                          // 2. Offer teaser section
                          Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      offerTitle,
                                      style: GoogleFonts.cairo(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 13,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      "عرض العضوية الحصري",
                                      style: GoogleFonts.cairo(
                                        color: Colors.white38,
                                        fontSize: 10,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                                ),
                                child: Text(
                                  discountText,
                                  style: GoogleFonts.cairo(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),

                          // 3. Elegant Action Buttons calling existing navigations
                          Row(
                            children: [
                              // "شوف العرض" Button
                              Expanded(
                                child: SizedBox(
                                  height: 40,
                                  child: ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.primary,
                                      foregroundColor: Colors.white,
                                      elevation: 0,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                    ),
                                    onPressed: () {
                                      HapticFeedback.lightImpact();
                                      if (hasOffers) {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) => OfferDetailPage(offer: storeOffers.first),
                                          ),
                                        );
                                      } else {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) => StoreDetailPage(store: store),
                                          ),
                                        );
                                      }
                                    },
                                    child: Text(
                                      'شوف العرض',
                                      style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 12),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),

                              // "طلع كوبون" Button
                              Expanded(
                                child: SizedBox(
                                  height: 40,
                                  child: OutlinedButton(
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: Colors.white,
                                      side: const BorderSide(color: Colors.white24),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                    ),
                                    onPressed: () {
                                      HapticFeedback.lightImpact();
                                      if (hasOffers) {
                                        // Navigate directly to Offer Detail Page where the coupon generator UI resides
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) => OfferDetailPage(offer: storeOffers.first),
                                          ),
                                        );
                                      } else {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) => StoreDetailPage(store: store),
                                          ),
                                        );
                                      }
                                    },
                                    child: Text(
                                      'طلع كوبون',
                                      style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 12),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      height: 250,
      margin: const EdgeInsets.only(bottom: 24),
      child: Center(
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xFF1E293B).withOpacity(0.95),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.white.withOpacity(0.08)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.4),
                blurRadius: 16,
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.radar_rounded,
                size: 48,
                color: Colors.white.withOpacity(0.15),
              ),
              const SizedBox(height: 12),
              Text(
                'مفيش عروض قريبة منك دلوقتي',
                style: _emptyTitleStyle.copyWith(color: Colors.white, fontSize: 15),
              ),
              const SizedBox(height: 6),
              Text(
                'جرب تغير التصنيف أو تبحث عن كلمات تانية لتكتشف عروض الزقازيق المميزة.',
                textAlign: TextAlign.center,
                style: _emptySubStyle.copyWith(color: Colors.white60, fontSize: 11),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Premium Elegant Dark Map Styles JSON configuration
  static const String _darkMapStyle = '''
[
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#1e293b"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#94a3b8"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#0f172a"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#334155"
      }
    ]
  },
  {
    "featureType": "landscape",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#0f172a"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#1e293b"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#64748b"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#1e293b"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#334155"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#334155"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#020617"
      }
    ]
  }
]
''';
}

class _RadarNode {
  final int index;
  final StoreEntity store;
  final double angle;
  final double relativeDistance;
  double normalizedRadius = 0.5;

  _RadarNode({
    required this.index,
    required this.store,
    required this.angle,
    required this.relativeDistance,
  });
}

class _RadarPainter extends CustomPainter {
  final AnimationController sweepController;
  final Color primaryColor;

  _RadarPainter({required this.sweepController, required this.primaryColor});

  @override
  void paint(Canvas canvas, Size size) {
    final angle = sweepController.value * 2 * math.pi;
    final center = Offset(size.width / 2, size.height / 2 - 30);
    final maxRadius = math.min(size.width, size.height) * 0.43;

    final circlePaint = Paint()
      ..color = Colors.white.withOpacity(0.04)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    canvas.drawCircle(center, maxRadius * 0.33, circlePaint);
    canvas.drawCircle(center, maxRadius * 0.66, circlePaint);
    canvas.drawCircle(center, maxRadius, circlePaint);

    final linePaint = Paint()
      ..color = Colors.white.withOpacity(0.05)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    canvas.drawLine(Offset(center.dx - maxRadius, center.dy), Offset(center.dx + maxRadius, center.dy), linePaint);
    canvas.drawLine(Offset(center.dx, center.dy - maxRadius), Offset(center.dx, center.dy + maxRadius), linePaint);

    final sweepPaint = Paint()
      ..shader = ui.Gradient.sweep(
        center,
        [
          primaryColor.withOpacity(0.0),
          primaryColor.withOpacity(0.18),
          primaryColor.withOpacity(0.35),
        ],
        [0.0, 0.9, 1.0],
        TileMode.clamp,
        angle - 0.5,
        angle + 0.1,
      );

    canvas.drawCircle(center, maxRadius, sweepPaint);
  }

  @override
  bool shouldRepaint(covariant _RadarPainter oldDelegate) {
    return oldDelegate.sweepController.value != sweepController.value;
  }
}

class _PulsingRing extends StatefulWidget {
  final Color color;
  const _PulsingRing({required this.color});

  @override
  State<_PulsingRing> createState() => _PulsingRingState();
}

class _PulsingRingState extends State<_PulsingRing> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.scale(
          scale: 1.0 + _controller.value * 0.45,
          child: Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: widget.color.withOpacity((1.0 - _controller.value).clamp(0.0, 1.0)),
                width: 2.0,
              ),
            ),
            child: child,
          ),
        );
      },
      child: const SizedBox.shrink(),
    );
  }
}
