import 'package:flutter/material.dart';
import '../../../../core/widgets/skeleton_loader.dart';

/// Full-fidelity Home Feed Shimmer that matches HomePage's exact visual anatomy.
class OffersSkeleton extends StatelessWidget {
  const OffersSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgSurface = isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);

    return Scaffold(
      backgroundColor: bgSurface,
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.only(top: 8, bottom: 36),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. App Bar Skeleton: Location Pill + Icons
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    SkeletonCircle(size: 40),
                    SizedBox(width: 8),
                    SkeletonCircle(size: 40),
                    SizedBox(width: 8),
                    SkeletonCircle(size: 40),
                    Spacer(),
                    SkeletonBox(width: 140, height: 38, borderRadius: 20),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // 2. Greeting Header
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SkeletonBox(width: 220, height: 26, borderRadius: 6),
                    SizedBox(height: 6),
                    SkeletonBox(width: 130, height: 14, borderRadius: 4),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // 3. Live Stats Pill
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: SkeletonBox(width: 170, height: 32, borderRadius: 16),
              ),
              const SizedBox(height: 16),

              // 4. Search Bar
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: SkeletonBox(
                  width: double.infinity,
                  height: 52,
                  borderRadius: 16,
                ),
              ),
              const SizedBox(height: 16),

              // 5. Coupon Voucher Banner (AdsSlider Shimmer)
              const CouponTicketSkeleton(),
              const SizedBox(height: 18),

              // 6. "هتدور فين؟" Category Circles Row
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: SkeletonBox(width: 110, height: 20, borderRadius: 4),
              ),
              const SizedBox(height: 12),
              SizedBox(
                height: 96,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  physics: const NeverScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: 5,
                  itemBuilder: (context, index) {
                    return const Padding(
                      padding: EdgeInsetsDirectional.only(end: 16),
                      child: Column(
                        children: [
                          SkeletonCircle(size: 64),
                          SizedBox(height: 8),
                          SkeletonBox(width: 50, height: 11, borderRadius: 3),
                        ],
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 20),

              // 7. Section: "الأكثر انتشارًا"
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SkeletonBox(width: 120, height: 20, borderRadius: 4),
                        SizedBox(height: 4),
                        SkeletonBox(width: 150, height: 12, borderRadius: 4),
                      ],
                    ),
                    SkeletonBox(width: 60, height: 20, borderRadius: 4),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // 8. Horizontal Trending Offers Cards
              SizedBox(
                height: 330,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  physics: const NeverScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: 2,
                  itemBuilder: (context, index) {
                    return const Padding(
                      padding: EdgeInsetsDirectional.only(end: 14),
                      child: SizedBox(
                        width: 275,
                        child: OfferCardSkeleton(isWide: true),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
