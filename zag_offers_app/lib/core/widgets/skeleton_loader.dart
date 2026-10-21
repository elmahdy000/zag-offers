import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

// Brand Slate Shimmer Palette
const Color _shimmerDarkBase = Color(0xFF1E293B);
const Color _shimmerDarkHighlight = Color(0xFF334155);
const Color _shimmerLightBase = Color(0xFFE2E8F0);
const Color _shimmerLightHighlight = Color(0xFFF8FAFC);

/// Theme-aware shimmer container that adapts seamlessly to Dark/Light mode.
class AppShimmer extends StatelessWidget {
  final Widget child;
  final Color? baseColor;
  final Color? highlightColor;

  const AppShimmer({
    super.key,
    required this.child,
    this.baseColor,
    this.highlightColor,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Shimmer.fromColors(
      baseColor: baseColor ?? (isDark ? _shimmerDarkBase : _shimmerLightBase),
      highlightColor:
          highlightColor ?? (isDark ? _shimmerDarkHighlight : _shimmerLightHighlight),
      child: child,
    );
  }
}

/// Generic rounded skeleton box placeholder.
class SkeletonBox extends StatelessWidget {
  final double? width;
  final double height;
  final double borderRadius;
  final EdgeInsetsGeometry? margin;

  const SkeletonBox({
    super.key,
    this.width,
    required this.height,
    this.borderRadius = 8,
    this.margin,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      width: width,
      height: height,
      margin: margin,
      decoration: BoxDecoration(
        color: isDark ? _shimmerDarkBase : _shimmerLightBase,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    );
  }
}

/// Circular skeleton placeholder for avatars and badges.
class SkeletonCircle extends StatelessWidget {
  final double size;
  final EdgeInsetsGeometry? margin;

  const SkeletonCircle({
    super.key,
    required this.size,
    this.margin,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      width: size,
      height: size,
      margin: margin,
      decoration: BoxDecoration(
        color: isDark ? _shimmerDarkBase : _shimmerLightBase,
        shape: BoxShape.circle,
      ),
    );
  }
}

/// Backward compatible SkeletonLoader widget using AppShimmer.
class SkeletonLoader extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;

  const SkeletonLoader({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = 8,
  });

  @override
  Widget build(BuildContext context) {
    return AppShimmer(
      child: SkeletonBox(
        width: width,
        height: height,
        borderRadius: borderRadius,
      ),
    );
  }
}

/// Single card skeleton (Horizontal list / standard tile).
class CardSkeleton extends StatelessWidget {
  const CardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return AppShimmer(
      child: Container(
        height: 120,
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF162032) : Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        padding: const EdgeInsets.all(14),
        child: const Row(
          children: [
            SkeletonBox(width: 88, height: 88, borderRadius: 12),
            SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SkeletonBox(width: double.infinity, height: 16, borderRadius: 4),
                  SizedBox(height: 10),
                  SkeletonBox(width: 130, height: 12, borderRadius: 4),
                  SizedBox(height: 10),
                  SkeletonBox(width: 90, height: 12, borderRadius: 4),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// List skeleton for simple item views.
class ListSkeleton extends StatelessWidget {
  final int itemCount;

  const ListSkeleton({super.key, this.itemCount = 5});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: itemCount,
      itemBuilder: (context, index) => const Padding(
        padding: EdgeInsets.only(bottom: 12),
        child: CardSkeleton(),
      ),
    );
  }
}

/// Grid skeleton for 2-column views.
class GridSkeleton extends StatelessWidget {
  final int itemCount;

  const GridSkeleton({super.key, this.itemCount = 6});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.75,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: itemCount,
      itemBuilder: (context, index) => AppShimmer(
        child: Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF162032) : Colors.white,
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 5,
                child: SkeletonBox(
                  width: double.infinity,
                  height: double.infinity,
                  borderRadius: 16,
                ),
              ),
              Expanded(
                flex: 4,
                child: Padding(
                  padding: EdgeInsets.all(10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      SkeletonBox(width: double.infinity, height: 14, borderRadius: 4),
                      SkeletonBox(width: 80, height: 11, borderRadius: 4),
                      SkeletonBox(width: 50, height: 14, borderRadius: 4),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// High-fidelity OfferCard skeleton that accurately mirrors OfferCard.
class OfferCardSkeleton extends StatelessWidget {
  final bool isWide;
  final double? width;

  const OfferCardSkeleton({
    super.key,
    this.isWide = true,
    this.width,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return AppShimmer(
      child: Container(
        width: width ?? (isWide ? 275 : double.infinity),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF162032) : Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
            width: 1,
          ),
        ),
        clipBehavior: Clip.antiAlias,
        child: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image area with top corner badge placeholders
            SizedBox(
              height: 160,
              width: double.infinity,
              child: Stack(
                children: [
                  Positioned.fill(
                    child: SkeletonBox(
                      width: double.infinity,
                      height: 160,
                      borderRadius: 0,
                    ),
                  ),
                  PositionedDirectional(
                    top: 10,
                    start: 10,
                    child: SkeletonBox(width: 65, height: 24, borderRadius: 6),
                  ),
                  PositionedDirectional(
                    top: 10,
                    end: 10,
                    child: SkeletonCircle(size: 32),
                  ),
                ],
              ),
            ),

            // Card Body
            Padding(
              padding: EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Store logo + Store Name
                  Row(
                    children: [
                      SkeletonCircle(size: 20),
                      SizedBox(width: 8),
                      SkeletonBox(width: 90, height: 12, borderRadius: 4),
                      Spacer(),
                      SkeletonBox(width: 45, height: 12, borderRadius: 4),
                    ],
                  ),
                  SizedBox(height: 10),

                  // Title (2 lines)
                  SkeletonBox(width: double.infinity, height: 15, borderRadius: 4),
                  SizedBox(height: 6),
                  SkeletonBox(width: 160, height: 13, borderRadius: 4),
                  SizedBox(height: 14),

                  // Price & CTA Row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SkeletonBox(width: 50, height: 10, borderRadius: 3),
                          SizedBox(height: 4),
                          SkeletonBox(width: 75, height: 16, borderRadius: 4),
                        ],
                      ),
                      SkeletonBox(width: 80, height: 32, borderRadius: 8),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Coupon Voucher Ticket Skeleton (with realistic cutout notches and barcode).
class CouponTicketSkeleton extends StatelessWidget {
  const CouponTicketSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgCard = isDark ? const Color(0xFF162032) : Colors.white;

    return AppShimmer(
      child: Container(
        height: 165,
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: bgCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
            width: 1,
          ),
        ),
        clipBehavior: Clip.antiAlias,
        child: const Row(
          children: [
            // Main body
            Expanded(
              child: Padding(
                padding: EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    SkeletonBox(width: 80, height: 22, borderRadius: 6),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SkeletonBox(width: 170, height: 16, borderRadius: 4),
                        SizedBox(height: 6),
                        SkeletonBox(width: 120, height: 12, borderRadius: 4),
                      ],
                    ),
                    SkeletonBox(width: 110, height: 28, borderRadius: 8),
                  ],
                ),
              ),
            ),

            // Perforation divider placeholder
            SizedBox(
              width: 16,
              child: Center(
                child: SkeletonBox(width: 1.5, height: 130, borderRadius: 1),
              ),
            ),

            // Stub
            SizedBox(
              width: 88,
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 10, vertical: 14),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SkeletonCircle(size: 36),
                    SizedBox(height: 8),
                    SkeletonBox(width: 60, height: 12, borderRadius: 4),
                    SizedBox(height: 8),
                    SkeletonBox(width: 50, height: 16, borderRadius: 2),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Full Page Shimmer for OfferLoadingPage and OfferDetailPage loading states.
class OfferDetailShimmer extends StatelessWidget {
  const OfferDetailShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgSurface = isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final cardBg = isDark ? const Color(0xFF162032) : Colors.white;

    return Scaffold(
      backgroundColor: bgSurface,
      body: SafeArea(
        child: AppShimmer(
          child: SingleChildScrollView(
            physics: const NeverScrollableScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top App Bar
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      SkeletonCircle(size: 40),
                      Row(
                        children: [
                          SkeletonCircle(size: 40),
                          SizedBox(width: 10),
                          SkeletonCircle(size: 40),
                        ],
                      ),
                    ],
                  ),
                ),

                // Hero Image Banner
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: SkeletonBox(
                    width: double.infinity,
                    height: 250,
                    borderRadius: 20,
                  ),
                ),
                const SizedBox(height: 16),

                // Store card
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Row(
                      children: [
                        SkeletonCircle(size: 48),
                        SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              SkeletonBox(width: 120, height: 15, borderRadius: 4),
                              SizedBox(height: 6),
                              SkeletonBox(width: 80, height: 12, borderRadius: 4),
                            ],
                          ),
                        ),
                        SkeletonBox(width: 44, height: 26, borderRadius: 6),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 18),

                // Title & Badges
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          SkeletonBox(width: 80, height: 26, borderRadius: 8),
                          SizedBox(width: 8),
                          SkeletonBox(width: 60, height: 26, borderRadius: 8),
                        ],
                      ),
                      SizedBox(height: 12),
                      SkeletonBox(width: double.infinity, height: 20, borderRadius: 4),
                      SizedBox(height: 8),
                      SkeletonBox(width: 220, height: 16, borderRadius: 4),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Pricing Card
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SkeletonBox(width: 60, height: 12, borderRadius: 4),
                            SizedBox(height: 6),
                            SkeletonBox(width: 100, height: 22, borderRadius: 4),
                          ],
                        ),
                        SkeletonBox(width: 90, height: 36, borderRadius: 8),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Description Block
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SkeletonBox(width: 100, height: 16, borderRadius: 4),
                      SizedBox(height: 10),
                      SkeletonBox(width: double.infinity, height: 12, borderRadius: 4),
                      SizedBox(height: 6),
                      SkeletonBox(width: double.infinity, height: 12, borderRadius: 4),
                      SizedBox(height: 6),
                      SkeletonBox(width: 180, height: 12, borderRadius: 4),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: cardBg,
          border: Border(
            top: BorderSide(
              color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
            ),
          ),
        ),
        child: const SafeArea(
          child: AppShimmer(
            child: SkeletonBox(
              width: double.infinity,
              height: 52,
              borderRadius: 14,
            ),
          ),
        ),
      ),
    );
  }
}

/// Full Page Shimmer for StoreLoadingPage and StoreDetailPage loading states.
class StoreDetailShimmer extends StatelessWidget {
  const StoreDetailShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgSurface = isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final cardBg = isDark ? const Color(0xFF162032) : Colors.white;

    return Scaffold(
      backgroundColor: bgSurface,
      body: AppShimmer(
        child: SingleChildScrollView(
          physics: const NeverScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Store Header Cover Image with Overlay Logo
              SizedBox(
                height: 220,
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    const SkeletonBox(
                      width: double.infinity,
                      height: 180,
                      borderRadius: 0,
                    ),
                    const PositionedDirectional(
                      top: 48,
                      start: 16,
                      child: SkeletonCircle(size: 38),
                    ),
                    PositionedDirectional(
                      bottom: 0,
                      start: 20,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: bgSurface,
                          shape: BoxShape.circle,
                        ),
                        child: const SkeletonCircle(size: 76),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Store Info (Name, Rating, Area)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        SkeletonBox(width: 160, height: 22, borderRadius: 4),
                        SkeletonBox(width: 56, height: 24, borderRadius: 6),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Row(
                      children: [
                        SkeletonBox(width: 70, height: 14, borderRadius: 4),
                        SizedBox(width: 8),
                        SkeletonBox(width: 100, height: 14, borderRadius: 4),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Quick Action Buttons Row (Call, Maps, Share)
                    Row(
                      children: List.generate(
                        3,
                        (index) => const Expanded(
                          child: Padding(
                            padding: EdgeInsets.symmetric(horizontal: 4),
                            child: SkeletonBox(
                              height: 42,
                              borderRadius: 12,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 22),

              // Section Header
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    SkeletonBox(width: 120, height: 18, borderRadius: 4),
                    SkeletonBox(width: 50, height: 14, borderRadius: 4),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Offers List Cards
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  children: List.generate(
                    3,
                    (index) => Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Row(
                        children: [
                          SkeletonBox(width: 80, height: 80, borderRadius: 12),
                          SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                SkeletonBox(width: 60, height: 18, borderRadius: 6),
                                SizedBox(height: 8),
                                SkeletonBox(width: 130, height: 14, borderRadius: 4),
                                SizedBox(height: 8),
                                SkeletonBox(width: 80, height: 12, borderRadius: 4),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
