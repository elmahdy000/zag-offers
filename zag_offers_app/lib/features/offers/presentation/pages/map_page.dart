import 'dart:math' as math;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_iconly/flutter_iconly.dart';
import 'package:zag_offers_app/core/theme/app_colors.dart';
import 'package:zag_offers_app/core/services/location_service.dart';
import '../../domain/entities/store_entity.dart';
import 'store_detail_page.dart';

class MapPage extends StatefulWidget {
  final List<StoreEntity> stores;

  const MapPage({super.key, required this.stores});

  @override
  State<MapPage> createState() => _MapPageState();
}

class _MapPageState extends State<MapPage> with TickerProviderStateMixin {
  late AnimationController _sweepController;
  late PageController _pageController;
  int _selectedStoreIndex = 0;

  static const double _zagazigLat = 30.5877;
  static const double _zagazigLng = 31.5020;

  late List<StoreEntity> _validStores;
  late List<_RadarNode> _radarNodes;

  @override
  void initState() {
    super.initState();
    _sweepController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat();

    _pageController = PageController(viewportFraction: 0.85);

    _prepareStores();
  }

  void _prepareStores() {
    _validStores = widget.stores.isNotEmpty
        ? widget.stores
        : [];

    _radarNodes = [];
    if (_validStores.isEmpty) return;

    final double centerLat = LocationService.currentLatitude;
    final double centerLng = LocationService.currentLongitude;

    for (int i = 0; i < _validStores.length; i++) {
      final store = _validStores[i];
      double lat = store.latitude ?? (centerLat + (math.Random().nextDouble() - 0.5) * 0.015);
      double lng = store.longitude ?? (centerLng + (math.Random().nextDouble() - 0.5) * 0.015);

      double dy = lat - centerLat;
      double dx = lng - centerLng;
      double distance = math.sqrt(dx * dx + dy * dy);
      double angle = math.atan2(dy, dx);

      _radarNodes.add(_RadarNode(
        index: i,
        store: store,
        angle: angle,
        relativeDistance: distance,
      ));
    }

    double maxDist = _radarNodes.map((n) => n.relativeDistance).reduce(math.max);
    if (maxDist == 0) maxDist = 1.0;

    for (var node in _radarNodes) {
      node.normalizedRadius = 0.2 + (node.relativeDistance / maxDist) * 0.65;
    }
  }

  @override
  void dispose() {
    _sweepController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  IconData _getCategoryIcon(String? category) {
    switch (category) {
      case 'مطاعم':
        return Icons.restaurant_rounded;
      case 'ملابس':
        return Icons.checkroom_rounded;
      case 'إلكترونيات':
        return Icons.devices_rounded;
      case 'صيدليات':
        return Icons.local_pharmacy_rounded;
      case 'سوبر ماركت':
        return Icons.shopping_cart_rounded;
      default:
        return Icons.storefront_rounded;
    }
  }

  Color _getCategoryColor(String? category) {
    switch (category) {
      case 'مطاعم':
        return Colors.orange;
      case 'ملابس':
        return Colors.purple;
      case 'إلكترونيات':
        return Colors.blue;
      case 'صيدليات':
        return Colors.green;
      case 'سوبر ماركت':
        return Colors.red;
      default:
        return AppColors.primary;
    }
  }

  double _calculateRealDistance(StoreEntity store) {
    if (store.latitude == null || store.longitude == null) {
      return (400 + math.Random().nextInt(800)).toDouble();
    }
    const double p = 0.017453292519943295;
    final double a = 0.5 -
        math.cos((store.latitude! - _zagazigLat) * p) / 2 +
        math.cos(_zagazigLat * p) *
            math.cos(store.latitude! * p) *
            (1 - math.cos((store.longitude! - _zagazigLng) * p)) /
            2;
    return 12742 * math.asin(math.sqrt(a)) * 1000;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'رادار الخصومات المحيطة',
          style: GoogleFonts.cairo(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
      ),
      body: _validStores.isEmpty
          ? _buildEmptyState()
          : Column(
              children: [
                Expanded(
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      final center = Offset(
                        constraints.maxWidth / 2,
                        constraints.maxHeight / 2,
                      );
                      final radius =
                          math.min(constraints.maxWidth, constraints.maxHeight) * 0.42;

                      return Stack(
                        alignment: Alignment.center,
                        children: [
                          Positioned.fill(
                            child: AnimatedBuilder(
                              animation: _sweepController,
                              builder: (context, child) {
                                return CustomPaint(
                                  painter: _RadarPainter(
                                    angle: _sweepController.value * 2 * math.pi,
                                    primaryColor: AppColors.primary,
                                  ),
                                );
                              },
                            ),
                          ),
                          ..._buildRadarNodes(center, radius),
                          Positioned(
                            child: Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppColors.primary.withValues(alpha: 0.15),
                                border: Border.all(color: AppColors.primary, width: 2),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.primary.withValues(alpha: 0.5),
                                    blurRadius: 16,
                                    spreadRadius: 4,
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
                _buildBottomCarousel(),
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

      return Positioned(
        left: x - 24,
        top: y - 24,
        child: AnimatedBuilder(
          animation: _sweepController,
          builder: (context, child) {
            double diff =
                (_sweepController.value * 2 * math.pi - node.angle) %
                    (2 * math.pi);
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
                width: 48,
                height: 48,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      width: isSelected ? 48 : (isSweeping ? 42 : 36),
                      height: isSelected ? 48 : (isSweeping ? 42 : 36),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isSelected
                            ? storeColor.withValues(alpha: 0.25)
                            : const Color(0xFF1E293B).withValues(alpha: 0.8),
                        border: Border.all(
                          color: isSelected
                              ? storeColor
                              : (isSweeping
                                  ? Colors.white
                                  : storeColor.withValues(alpha: 0.6)),
                          width: isSelected ? 3.0 : 1.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: storeColor
                                .withValues(alpha: isSelected ? 0.6 : 0.2),
                            blurRadius: isSelected ? 12 : 6,
                            spreadRadius: isSelected ? 3 : 1,
                          ),
                        ],
                      ),
                      child: ClipOval(
                        child: node.store.logo != null &&
                                node.store.logo!.isNotEmpty
                            ? Image.network(
                                node.store.logo!,
                                width: double.infinity,
                                height: double.infinity,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => Icon(
                                  _getCategoryIcon(node.store.category),
                                  color: Colors.white,
                                  size: 16,
                                ),
                              )
                            : Icon(
                                _getCategoryIcon(node.store.category),
                                color: Colors.white,
                                size: 16,
                              ),
                      ),
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
        ),
      );
    }).toList();
  }

  Widget _buildBottomCarousel() {
    return Container(
      height: 220,
      margin: const EdgeInsets.only(bottom: 24),
      child: PageView.builder(
        controller: _pageController,
        itemCount: _validStores.length,
        onPageChanged: (index) {
          setState(() {
            _selectedStoreIndex = index;
          });
        },
        itemBuilder: (context, index) {
          final store = _validStores[index];
          final distance = _calculateRealDistance(store);
          final categoryColor = _getCategoryColor(store.category);

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
                  height: Curves.easeOut.transform(value) * 190,
                  width: double.infinity,
                  child: child,
                ),
              );
            },
            child: GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => StoreDetailPage(store: store),
                  ),
                );
              },
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B).withValues(alpha: 0.85),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: _selectedStoreIndex == index ? categoryColor : Colors.white.withValues(alpha: 0.08),
                    width: _selectedStoreIndex == index ? 2 : 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(23),
                  child: Stack(
                    children: [
                      Positioned(
                        top: -40,
                        left: -40,
                        child: Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: categoryColor.withValues(alpha: 0.1),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
                                color: const Color(0xFF0F172A),
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(19),
                                child: store.logo != null && store.logo!.isNotEmpty
                                    ? Image.network(
                                        store.logo!,
                                        fit: BoxFit.cover,
                                        errorBuilder: (_, __, ___) => Icon(
                                          _getCategoryIcon(store.category),
                                          color: categoryColor,
                                          size: 32,
                                        ),
                                      )
                                    : Icon(
                                        _getCategoryIcon(store.category),
                                        color: categoryColor,
                                        size: 32,
                                      ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: categoryColor.withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      store.category ?? 'عام',
                                      style: GoogleFonts.cairo(
                                        color: categoryColor,
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    store.name,
                                    style: GoogleFonts.cairo(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      const Icon(IconlyLight.location, color: Colors.white54, size: 14),
                                      const SizedBox(width: 4),
                                      Expanded(
                                        child: Text(
                                          '???????? - ' + (store.area ?? '') + ' (???? ' + distance.toStringAsFixed(0) + '?)',
                                          style: GoogleFonts.cairo(
                                            color: Colors.white70,
                                            fontSize: 12,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF0F172A),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Row(
                                          children: [
                                            const Icon(Icons.star_rounded, color: Colors.amber, size: 14),
                                            const SizedBox(width: 4),
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
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        left: 0,
                        child: Container(
                          height: 4,
                          color: categoryColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.radar_rounded,
              size: 80,
              color: Colors.white.withValues(alpha: 0.15),
            ),
            const SizedBox(height: 16),
            Text(
              'لا توجد متاجر قريبة حاليًا',
              style: GoogleFonts.cairo(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'انتظر انتهاء تحميل المتاجر وسيتم عرض العروض التفاعلية فوراً على الرادار.',
              textAlign: TextAlign.center,
              style: GoogleFonts.cairo(
                color: Colors.white60,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
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
  final double angle;
  final Color primaryColor;

  _RadarPainter({required this.angle, required this.primaryColor});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final maxRadius = math.min(size.width, size.height) * 0.45;

    final circlePaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.05)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    canvas.drawCircle(center, maxRadius * 0.33, circlePaint);
    canvas.drawCircle(center, maxRadius * 0.66, circlePaint);
    canvas.drawCircle(center, maxRadius, circlePaint);

    final linePaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.08)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    canvas.drawLine(Offset(center.dx - maxRadius, center.dy), Offset(center.dx + maxRadius, center.dy), linePaint);
    canvas.drawLine(Offset(center.dx, center.dy - maxRadius), Offset(center.dx, center.dy + maxRadius), linePaint);

    final sweepPaint = Paint()
      ..shader = ui.Gradient.sweep(
        center,
        [
          primaryColor.withValues(alpha: 0.0),
          primaryColor.withValues(alpha: 0.25),
          primaryColor.withValues(alpha: 0.5),
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
    return oldDelegate.angle != angle;
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
          scale: 1.0 + _controller.value * 0.4,
          child: Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: widget.color.withValues(alpha: (1.0 - _controller.value).clamp(0.0, 1.0)),
                width: 2.0,
              ),
            ),
          ),
        );
      },
    );
  }
}
