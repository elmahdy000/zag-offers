import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:zag_offers_app/core/theme/app_colors.dart';
import 'package:zag_offers_app/core/widgets/network_image_widget.dart';
import 'package:zag_offers_app/core/widgets/bouncy_tap.dart';
import 'package:zag_offers_app/core/utils/category_utils.dart';
import '../../domain/entities/category_entity.dart';
import '../../domain/entities/offer_entity.dart';
import '../bloc/offers_bloc.dart';
import '../bloc/offers_state.dart';
import '../constants/offer_categories.dart';
import 'all_offers_page.dart';
import 'search_page.dart';
import 'package:zag_offers_app/core/utils/navigation_service.dart';
import 'package:zag_offers_app/core/widgets/skeleton_loader.dart';

class CategoriesPage extends StatelessWidget {
  const CategoriesPage({super.key});

  static String _formatOfferCount(int count) {
    if (count == 0) return 'متوفر ✨';
    if (count == 1) return 'عرض متاح 🔥';
    if (count == 2) return 'عرضان 🔥';
    if (count <= 10) return '$count عروض 🔥';
    return '$count عرض 🔥';
  }

  Widget _buildCategoriesSkeleton(BuildContext context, bool isDark) {
    final screenWidth = MediaQuery.sizeOf(context).width;
    final int crossAxisCount = screenWidth > 900
        ? 4
        : screenWidth > 600
            ? 3
            : 2;
    final double childAspectRatio = screenWidth > 600 ? 1.05 : 0.95;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 70, 16, 120),
      child: GridView.builder(
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: crossAxisCount,
          crossAxisSpacing: 14,
          mainAxisSpacing: 14,
          childAspectRatio: childAspectRatio,
        ),
        itemCount: 6,
        itemBuilder: (context, index) {
          return AppShimmer(
            child: Container(
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF162032) : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
                ),
              ),
              padding: const EdgeInsets.all(14),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      SkeletonCircle(size: 44),
                      SkeletonBox(width: 48, height: 20, borderRadius: 10),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SkeletonBox(width: 80, height: 16, borderRadius: 4),
                      SizedBox(height: 6),
                      SkeletonBox(width: 110, height: 12, borderRadius: 4),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : const Color(0xFFF8FAFC),
      body: Stack(
        children: [
          // Ambient decorative top glow
          Positioned(
            top: -60,
            right: -40,
            child: Container(
              width: 220,
              height: 220,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.primary.withValues(alpha: isDark ? 0.12 : 0.06),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            top: 120,
            left: -50,
            child: Container(
              width: 180,
              height: 180,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.info.withValues(alpha: isDark ? 0.06 : 0.03),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          BlocBuilder<OffersBloc, OffersState>(
            buildWhen: (prev, next) =>
                next is OffersLoaded ||
                next is OffersLoading ||
                next is OffersError,
            builder: (context, state) {
              if (state is OffersLoading) {
                return _buildCategoriesSkeleton(context, isDark);
              }
              if (state is OffersError) {
                return Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.error_outline_rounded,
                        size: 48,
                        color: AppColors.error.withValues(alpha: 0.8),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'تعذر تحميل التصنيفات',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white70 : AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                );
              }

              final items = (state is OffersLoaded && state.categories.isNotEmpty)
                  ? state.categories
                  : browseCategories
                      .map((c) => CategoryEntity(
                            id: c.backendName ?? c.name,
                            name: c.backendName ?? c.name,
                            image: c.imagePath,
                          ))
                      .toList();

              final allOffers = state is OffersLoaded
                  ? state.allOffers
                  : const <OfferEntity>[];

              final screenWidth = MediaQuery.sizeOf(context).width;
              final int crossAxisCount = screenWidth > 900
                  ? 5
                  : screenWidth > 600
                      ? 4
                      : screenWidth < 340
                          ? 1
                          : 2;
              final double childAspectRatio =
                  screenWidth > 600 ? 1.05 : 0.98;

              return CustomScrollView(
                physics: const BouncingScrollPhysics(),
                slivers: [
                  // Sleek Custom Sliver App Bar
                  SliverAppBar(
                    floating: true,
                    pinned: false,
                    backgroundColor: Colors.transparent,
                    elevation: 0,
                    surfaceTintColor: Colors.transparent,
                    centerTitle: true,
                    title: Text(
                      'كل التصنيفات',
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w900,
                        fontSize: 20,
                        color: isDark ? Colors.white : AppColors.textPrimary,
                      ),
                    ),
                    leading: Padding(
                      padding: const EdgeInsetsDirectional.only(start: 12),
                      child: Center(
                        child: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF1E2638)
                                : Colors.white,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: isDark
                                  ? Colors.white.withValues(alpha: 0.1)
                                  : Colors.black.withValues(alpha: 0.06),
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black
                                    .withValues(alpha: isDark ? 0.3 : 0.05),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: IconButton(
                            padding: EdgeInsets.zero,
                            icon: Icon(
                              NavigationService.getBackIcon(context),
                              size: 16,
                              color: isDark ? Colors.white : AppColors.textPrimary,
                            ),
                            onPressed: () {
                              HapticFeedback.lightImpact();
                              Navigator.pop(context);
                            },
                          ),
                        ),
                      ),
                    ),
                    actions: [
                      Padding(
                        padding: const EdgeInsetsDirectional.only(end: 12),
                        child: Center(
                          child: Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: isDark
                                  ? const Color(0xFF1E2638)
                                  : Colors.white,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: isDark
                                    ? Colors.white.withValues(alpha: 0.1)
                                    : Colors.black.withValues(alpha: 0.06),
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black
                                      .withValues(alpha: isDark ? 0.3 : 0.05),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: IconButton(
                              padding: EdgeInsets.zero,
                              icon: Icon(
                                Icons.search_rounded,
                                size: 20,
                                color: isDark
                                    ? Colors.white
                                    : AppColors.textPrimary,
                              ),
                              onPressed: () {
                                HapticFeedback.lightImpact();
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => const SearchPage(),
                                  ),
                                );
                              },
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),

                  // Hero Header Card
                  SliverToBoxAdapter(
                    child: Container(
                      margin: const EdgeInsets.fromLTRB(16, 6, 16, 18),
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(24),
                        gradient: LinearGradient(
                          begin: Alignment.topRight,
                          end: Alignment.bottomLeft,
                          colors: isDark
                              ? [
                                  const Color(0xFF1E293B),
                                  const Color(0xFF131B2A),
                                ]
                              : [
                                  AppColors.primary.withValues(alpha: 0.08),
                                  Colors.white,
                                ],
                        ),
                        border: Border.all(
                          color: isDark
                              ? AppColors.primary.withValues(alpha: 0.25)
                              : AppColors.primary.withValues(alpha: 0.15),
                          width: 1.2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: isDark
                                ? Colors.black.withValues(alpha: 0.3)
                                : AppColors.primary.withValues(alpha: 0.06),
                            blurRadius: 16,
                            offset: const Offset(0, 5),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary
                                        .withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        Icons.local_fire_department_rounded,
                                        color: AppColors.primary,
                                        size: 14,
                                      ),
                                      SizedBox(width: 4),
                                      Text(
                                        'عروض الزقازيق الحصرية',
                                        style: TextStyle(
                                          color: AppColors.primary,
                                          fontSize: 11,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'اختر تصنيفك المفضل',
                                  style: theme.textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 17,
                                    color: isDark
                                        ? Colors.white
                                        : AppColors.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  'اكتشف خصومات حصرية وكوبونات فعالة بكل سهولة',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    fontSize: 12,
                                    color: isDark
                                        ? AppColors.textDarkDim
                                        : AppColors.textSecondary,
                                    height: 1.3,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [
                                  AppColors.primary,
                                  AppColors.primaryLight
                                ],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color:
                                      AppColors.primary.withValues(alpha: 0.35),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: const Center(
                              child: Icon(
                                Icons.auto_awesome_rounded,
                                color: Colors.white,
                                size: 24,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Categories Grid
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 120),
                    sliver: SliverGrid(
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: crossAxisCount,
                        crossAxisSpacing: 14,
                        mainAxisSpacing: 14,
                        childAspectRatio: childAspectRatio,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final cat = items[index];
                          final String filterName = cat.name;
                          final String name =
                              CategoryUtils.getDisplayName(cat.name);
                          final String description =
                              CategoryUtils.getDescription(cat.name);
                          final Color color =
                              CategoryUtils.getColor(cat.name);
                          final IconData icon =
                              CategoryUtils.getIcon(cat.name);
                          final String? assetFallback =
                              CategoryUtils.getAssetImagePath(cat.name);

                          final int offerCount = allOffers.where((offer) {
                            final storeCat = offer.store.category;
                            if (storeCat == null) return false;
                            final trimmed = storeCat.trim();
                            return trimmed == filterName ||
                                trimmed == name ||
                                CategoryUtils.getDisplayName(trimmed) == name;
                          }).length;

                          final String offerCountStr =
                              _formatOfferCount(offerCount);

                          return BouncyTap(
                            scaleFactor: 0.96,
                            onTap: () {
                              HapticFeedback.lightImpact();
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => AllOffersPage(
                                    initialCategory: filterName,
                                  ),
                                ),
                              );
                            },
                            child: Container(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(22),
                                color: isDark
                                    ? const Color(0xFF161C2A)
                                    : Colors.white,
                                border: Border.all(
                                  color: color.withValues(
                                      alpha: isDark ? 0.3 : 0.16),
                                  width: 1.2,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: isDark
                                        ? Colors.black.withValues(alpha: 0.3)
                                        : color.withValues(alpha: 0.08),
                                    blurRadius: 14,
                                    offset: const Offset(0, 5),
                                  ),
                                ],
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(22),
                                child: Stack(
                                  children: [
                                    // Corner ambient radial glow
                                    PositionedDirectional(
                                      top: -24,
                                      end: -24,
                                      child: Container(
                                        width: 90,
                                        height: 90,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          gradient: RadialGradient(
                                            colors: [
                                              color.withValues(
                                                  alpha: isDark ? 0.22 : 0.14),
                                              color.withValues(alpha: 0.0),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.all(14),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          // Top: Avatar + Offer Count Badge
                                          Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.spaceBetween,
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Container(
                                                width: 56,
                                                height: 56,
                                                padding: const EdgeInsets.all(2),
                                                decoration: BoxDecoration(
                                                  borderRadius:
                                                      BorderRadius.circular(16),
                                                  gradient: LinearGradient(
                                                    begin: Alignment.topLeft,
                                                    end: Alignment.bottomRight,
                                                    colors: [
                                                      color.withValues(
                                                          alpha: isDark
                                                              ? 0.35
                                                              : 0.2),
                                                      color.withValues(
                                                          alpha: isDark
                                                              ? 0.1
                                                              : 0.06),
                                                    ],
                                                  ),
                                                  border: Border.all(
                                                    color: color.withValues(
                                                        alpha: isDark
                                                            ? 0.5
                                                            : 0.3),
                                                    width: 1.2,
                                                  ),
                                                  boxShadow: [
                                                    BoxShadow(
                                                      color: color.withValues(
                                                          alpha: isDark
                                                              ? 0.25
                                                              : 0.12),
                                                      blurRadius: 10,
                                                      offset:
                                                          const Offset(0, 3),
                                                    ),
                                                  ],
                                                ),
                                                child: ClipRRect(
                                                  borderRadius:
                                                      BorderRadius.circular(14),
                                                  child: _buildCategoryImage(
                                                    image: cat.image,
                                                    assetFallback:
                                                        assetFallback,
                                                    color: color,
                                                    icon: icon,
                                                  ),
                                                ),
                                              ),
                                              Container(
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                        horizontal: 8,
                                                        vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: color.withValues(
                                                      alpha:
                                                          isDark ? 0.18 : 0.1),
                                                  borderRadius:
                                                      BorderRadius.circular(10),
                                                  border: Border.all(
                                                    color: color.withValues(
                                                        alpha: isDark
                                                            ? 0.35
                                                            : 0.25),
                                                    width: 0.8,
                                                  ),
                                                ),
                                                child: Text(
                                                  offerCountStr,
                                                  style: TextStyle(
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.w800,
                                                    color: isDark
                                                        ? color.withValues(
                                                            alpha: 0.95)
                                                        : color,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 8),
                                          // Title & Subtitle Description
                                          Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                name,
                                                style: theme
                                                    .textTheme.titleMedium
                                                    ?.copyWith(
                                                  fontWeight: FontWeight.w900,
                                                  fontSize: 16,
                                                  color: isDark
                                                      ? Colors.white
                                                      : AppColors.textPrimary,
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                              const SizedBox(height: 2),
                                              Text(
                                                description,
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.w600,
                                                  color: isDark
                                                      ? AppColors.textDarkDim
                                                      : AppColors.textSecondary,
                                                  height: 1.2,
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 6),
                                          // Bottom Action: "تصفح العروض" + RTL Forward Arrow (points left in RTL)
                                          Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.spaceBetween,
                                            children: [
                                              Text(
                                                'تصفح العروض',
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.w800,
                                                  color: isDark
                                                      ? color.withValues(
                                                          alpha: 0.9)
                                                      : color,
                                                ),
                                              ),
                                              Icon(
                                                NavigationService.getForwardIcon(context),
                                                size: 12,
                                                color: isDark
                                                    ? color.withValues(
                                                        alpha: 0.9)
                                                    : color,
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
                        childCount: items.length,
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryImage({
    required String? image,
    required String? assetFallback,
    required Color color,
    required IconData icon,
  }) {
    if (image != null && image.isNotEmpty) {
      if (image.startsWith('http://') || image.startsWith('https://')) {
        return NetworkImageWidget(
          imageUrl: image,
          fit: BoxFit.cover,
        );
      } else if (image.startsWith('assets/')) {
        return Image.asset(
          image,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _fallbackIcon(color, icon),
        );
      }
    }
    if (assetFallback != null && assetFallback.isNotEmpty) {
      return Image.asset(
        assetFallback,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _fallbackIcon(color, icon),
      );
    }
    return _fallbackIcon(color, icon);
  }

  Widget _fallbackIcon(Color color, IconData icon) {
    return Container(
      color: color.withValues(alpha: 0.12),
      child: Center(
        child: Icon(
          icon,
          color: color,
          size: 26,
        ),
      ),
    );
  }
}
