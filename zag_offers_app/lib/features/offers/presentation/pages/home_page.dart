import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:flutter_iconly/flutter_iconly.dart';
import 'package:zag_offers_app/core/constants/app_constants.dart';
import 'package:zag_offers_app/core/theme/app_colors.dart';
import 'package:zag_offers_app/features/home/presentation/pages/main_screen.dart';
import 'package:zag_offers_app/features/home/presentation/pages/notifications_page.dart';
import 'package:zag_offers_app/features/offers/presentation/bloc/offers_bloc.dart';
import 'package:zag_offers_app/features/offers/presentation/bloc/offers_event.dart';
import 'package:zag_offers_app/features/offers/presentation/bloc/offers_state.dart';
import 'package:zag_offers_app/features/notifications/presentation/bloc/notification_bloc.dart';
import 'package:zag_offers_app/features/offers/presentation/pages/map_page.dart';
import 'package:zag_offers_app/features/offers/presentation/pages/offer_detail_page.dart';

import 'package:zag_offers_app/features/offers/presentation/widgets/ads_slider.dart';
import 'package:zag_offers_app/features/offers/presentation/widgets/categories_section.dart';
import 'package:zag_offers_app/features/offers/presentation/utils/offer_filter_utils.dart';
import 'package:zag_offers_app/features/offers/presentation/constants/offer_categories.dart';
import 'package:zag_offers_app/features/offers/presentation/widgets/filter_bottom_sheet.dart';
import 'package:zag_offers_app/features/offers/presentation/widgets/offer_card.dart';
import 'package:zag_offers_app/features/offers/presentation/widgets/offers_skeleton.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  String _currentArea = 'الكل';
  double _minDiscount = 0;
  String _sortBy = 'newest';



  void _showFilterSheet(BuildContext context, OffersLoaded state) async {
    final availableAreas = OfferFilterUtils.extractAreas([
      ...state.trendingOffers,
      ...(state.recommendedOffers ?? []),
    ]);

    final result = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => FilterBottomSheet(
        selectedArea: _currentArea,
        minDiscount: _minDiscount,
        sortBy: _sortBy,
        availableAreas: availableAreas,
      ),
    );

    if (!context.mounted) return;
    if (result != null) {
      setState(() {
        _currentArea = result['area'];
        _minDiscount = result['minDiscount'];
        _sortBy = result['sortBy'];
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        body: BlocBuilder<OffersBloc, OffersState>(
        buildWhen: (previous, current) => current is OffersLoading || current is OffersError || current is OffersLoaded,
        builder: (context, state) {
          if (state is OffersLoading) {
            return const OffersSkeleton();
          }

          if (state is OffersError) {
            return _HomeErrorState(
              message: state.message,
              onRetry: () => context.read<OffersBloc>().add(FetchHomeData()),
            );
          }

          if (state is OffersLoaded) {
            return RefreshIndicator(
              onRefresh: () async {
                context.read<OffersBloc>().add(FetchHomeData());
              },
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(
                  parent: BouncingScrollPhysics(),
                ),
                slivers: [
                  _buildSliverAppBar(context, state),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 10, bottom: 36),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildHeader(context),
                          const SizedBox(height: 16),
                          _buildLiveStats(context, state),
                          if (state.noticeMessage != null) ...[
                            const SizedBox(height: 12),
                            _buildNoticeBanner(context, state.noticeMessage!),
                          ],
                          const SizedBox(height: 24),
                          // _buildSearchBar(context, state), // Removed search bar
                          const AdsSlider(),
                          const SizedBox(height: 20),
                          CategoriesSection(categories: state.categories),
                          const SizedBox(height: 24),
                          _buildOffersSection(
                            context,
                            title: 'الأكثر انتشارًا',
                            subtitle: 'عروض يكثر عليها الطلب الآن',
                            offers: OfferFilterUtils.apply(
                              offers: state.trendingOffers,
                              area: _currentArea,
                              minDiscount: _minDiscount,
                              sortBy: _sortBy,
                            ),
                          ),
                          _buildOffersSection(
                            context,
                            title: 'مقترح لك',
                            subtitle: 'عروض مناسبة حسب نشاطك الحالي',
                            offers: OfferFilterUtils.apply(
                              offers: state.recommendedOffers ?? const [],
                              area: _currentArea,
                              minDiscount: _minDiscount,
                              sortBy: _sortBy,
                            ),
                          ),
                          _CategorySection(
                            state: state,
                            currentArea: _currentArea,
                            minDiscount: _minDiscount,
                            sortBy: _sortBy,
                            category: 'دلع كرشك',
                            title: 'ركن الأكل',
                            subtitle: 'أفضل العروض القريبة لتجربة سريعة',
                          ),
                          _CategorySection(
                            state: state,
                            currentArea: _currentArea,
                            minDiscount: _minDiscount,
                            sortBy: _sortBy,
                            category: 'شياكة',
                            title: 'اختيارات الموضة',
                            subtitle: 'عروض مختارة على الملابس والإطلالات',
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            );
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildSliverAppBar(BuildContext context, OffersLoaded state) {
    final canOpenMap = AppConstants.mapsEnabled;
    final theme = Theme.of(context);

    return SliverAppBar(
      expandedHeight: 80,
      floating: true,
      pinned: true,
      elevation: 0,
      centerTitle: false,
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(IconlyBold.location, color: AppColors.primary, size: 16),
              const SizedBox(width: 4),
              Text(
                'الزقازيق، الشرقية',
                style: theme.textTheme.labelLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: AppColors.textSecondary),
            ],
          ),
          Text(
            'ZAG OFFERS',
            style: theme.textTheme.labelSmall?.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                ),
          ),
        ],
      ),
      actions: [
        BlocBuilder<NotificationBloc, NotificationState>(
          builder: (context, notifState) {
            int unreadCount = 0;
            if (notifState is NotificationFeedState) {
              unreadCount = notifState.items.where((e) => !e.isRead).length;
            }
            return Stack(
              alignment: Alignment.center,
              children: [
                IconButton(
                  icon: const Icon(IconlyLight.notification),
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    Navigator.push(context, MaterialPageRoute(builder: (context) => const NotificationsPage()));
                  },
                ),
                if (unreadCount > 0)
                  Positioned(
                    top: 10,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                        border: Border.all(color: Theme.of(context).scaffoldBackgroundColor, width: 1.5),
                      ),
                      child: Text(
                        unreadCount > 9 ? '9+' : unreadCount.toString(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 8,
                          fontWeight: FontWeight.bold,
                          height: 1,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
        IconButton(
          icon: const Icon(Icons.explore_rounded, color: AppColors.primary, size: 26),
          tooltip: 'استكشف العروض على الرادار',
          onPressed: () {
            HapticFeedback.lightImpact();
            if (canOpenMap) {
               Navigator.push(
                 context,
                 MaterialPageRoute(
                   builder: (context) => MapPage(
                     stores: state.featuredStores,
                     offers: state.allOffers,
                   ),
                 ),
               );
            }
          },
        ),
        IconButton(
          icon: const Icon(Icons.tune_rounded),
          onPressed: () {
            HapticFeedback.lightImpact();
            _showFilterSheet(context, state);
          },
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildHeader(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Flexible(
                child: Text(
                  'عروض النهاردة في الزقازيق',
                  style: textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.5,
                      ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 6),
              const Icon(
                IconlyBold.location,
                color: AppColors.primary,
                size: 22,
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'وفر أكتر مع كل خروجة',
            style: textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildLiveStats(BuildContext context, OffersLoaded state) {
    final textTheme = Theme.of(context).textTheme;
    final offersCount = state.trendingOffers.length;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.green.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: Colors.green.withValues(alpha: 0.1)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: Colors.green,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 10),
            Text(
              'مباشر: $offersCount عرض متاح الآن',
              style: textTheme.labelSmall?.copyWith(
                    color: Colors.green,
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoticeBanner(BuildContext context, String message) {
    final textTheme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.orange.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.orange.withValues(alpha: 0.18)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              Icons.info_outline_rounded,
              color: Colors.orange[800],
              size: 18,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                message,
                style: textTheme.labelSmall?.copyWith(
                  color: Colors.orange[900],
                  fontWeight: FontWeight.w700,
                  height: 1.4,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }


  Widget _buildOffersSection(
    BuildContext context, {
    required String title,
    required String subtitle,
    required List offers,
  }) {
    return _buildOffersSectionWidget(context, title: title, subtitle: subtitle, offers: offers);
  }

}

class _CategorySection extends StatelessWidget {
  final OffersLoaded state;
  final String currentArea;
  final double minDiscount;
  final String sortBy;
  final String category;
  final String title;
  final String subtitle;

  const _CategorySection({
    required this.state,
    required this.currentArea,
    required this.minDiscount,
    required this.sortBy,
    required this.category,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    final backendCategory = getBackendCategoryName(category);
    final filtered = OfferFilterUtils.apply(
      offers: state.trendingOffers.where((offer) {
        final cat = offer.store.category?.trim();
        return cat == category.trim() || cat == backendCategory.trim();
      }).toList(),
      area: currentArea,
      minDiscount: minDiscount,
      sortBy: sortBy,
    );
    if (filtered.isEmpty) return const SizedBox.shrink();

    return _buildOffersSectionWidget(
      context,
      title: title,
      subtitle: subtitle,
      offers: filtered,
    );
  }
}

Widget _buildOffersSectionWidget(
  BuildContext context, {
  required String title,
  required String subtitle,
  required List offers,
}) {
  final textTheme = Theme.of(context).textTheme;
  if (offers.isEmpty) return const SizedBox.shrink();

  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
        child: Text(
          title,
          style: textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w900,
            fontSize: 22,
            letterSpacing: -0.5,
          ),
        ),
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(20, 4, 10, 4),
        child: Row(
          children: [
            Expanded(
              child: Text(
                subtitle,
                style: textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w500,
                    ),
              ),
            ),
            TextButton.icon(
              onPressed: () => MainScreen.of(context)?.setSelectedIndex(1),
              label: const Icon(Icons.arrow_forward_rounded, size: 16),
              icon: Text(
                'عرض الكل',
                style: textTheme.labelLarge?.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                    ),
              ),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 12),
              ),
            ),
          ],
        ),
      ),
      SizedBox(
        height: 270,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          itemCount: offers.length,
          itemBuilder: (context, index) {
            final offer = offers[index];
            return RepaintBoundary(
              child: Padding(
                padding: const EdgeInsets.only(right: 12),
                child: SizedBox(
                  width: 165,
                  child: OfferCard(
                    offer: offer,
                    isWide: true,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => OfferDetailPage(offer: offer),
                      ),
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
      const SizedBox(height: 8),
    ],
  );
}

class _HomeErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _HomeErrorState({
    required this.message,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final isConnectionError = message.toLowerCase().contains('connection') || 
                             message.toLowerCase().contains('network') ||
                             message.toLowerCase().contains('socket');

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.error.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                isConnectionError ? Icons.wifi_off_rounded : Icons.error_outline_rounded,
                size: 64,
                color: AppColors.error,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              isConnectionError ? 'مشكلة في الاتصال' : 'تعذر تحميل المحتوى',
              style: textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w900,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              isConnectionError 
                  ? 'يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى'
                  : message,
              textAlign: TextAlign.center,
              style: textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: 200,
              height: 50,
              child: ElevatedButton(
                onPressed: onRetry,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 0,
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.refresh_rounded, size: 20),
                    SizedBox(width: 8),
                    Text(
                      'إعادة المحاولة',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
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
