import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:flutter_iconly/flutter_iconly.dart';
import 'package:zag_offers_app/core/constants/app_constants.dart';
import 'package:zag_offers_app/core/theme/app_colors.dart';
import 'package:zag_offers_app/features/home/presentation/pages/main_screen.dart';
import 'package:zag_offers_app/features/home/presentation/pages/notifications_page.dart';
import 'package:zag_offers_app/features/offers/presentation/bloc/offers_bloc.dart';
import 'package:zag_offers_app/features/offers/presentation/bloc/offers_event.dart';
import 'package:zag_offers_app/features/offers/presentation/bloc/offers_state.dart';
import 'package:zag_offers_app/features/offers/presentation/pages/map_page.dart';
import 'package:zag_offers_app/features/offers/presentation/pages/offer_detail_page.dart';
import 'package:zag_offers_app/features/offers/presentation/pages/search_page.dart';
import 'package:zag_offers_app/features/offers/presentation/widgets/ads_slider.dart';
import 'package:zag_offers_app/features/offers/presentation/widgets/categories_section.dart';
import 'package:zag_offers_app/features/offers/presentation/utils/offer_filter_utils.dart';
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
      backgroundColor: Colors.white,
      body: BlocBuilder<OffersBloc, OffersState>(
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
            final hasAnyContent = state.trendingOffers.isNotEmpty ||
                state.featuredStores.isNotEmpty ||
                (state.recommendedOffers?.isNotEmpty ?? false);

            if (!hasAnyContent) {
              return _HomeEmptyState(
                onRetry: () => context.read<OffersBloc>().add(FetchHomeData()),
              );
            }

            return RefreshIndicator(
              onRefresh: () async {
                context.read<OffersBloc>().add(FetchHomeData());
              },
              child: CustomScrollView(
                physics: const BouncingScrollPhysics(),
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
                          _buildSearchBar(context, state),
                          const SizedBox(height: 24),
                          const AdsSlider(),
                          const SizedBox(height: 20),
                          const CategoriesSection(),
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
                          _buildCategoryFilteredSection(
                            context,
                            state,
                            category: 'مطاعم',
                            title: 'ركن الأكل',
                            subtitle: 'أفضل العروض القريبة لتجربة سريعة',
                          ),
                          _buildCategoryFilteredSection(
                            context,
                            state,
                            category: 'ملابس',
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
    final hasMapData = state.featuredStores.isNotEmpty;
    final canOpenMap = AppConstants.mapsEnabled && hasMapData;

    return SliverAppBar(
      expandedHeight: 80,
      floating: true,
      pinned: true,
      elevation: 0,
      backgroundColor: Colors.white.withValues(alpha: 0.9),
      surfaceTintColor: Colors.transparent,
      centerTitle: false,
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(IconlyBold.location, color: AppColors.primary, size: 16),
              const SizedBox(width: 4),
              Text(
                'الزقازيق، الشرقية',
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
              ),
              const Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: AppColors.textSecondary),
            ],
          ),
          Text(
            'ZAG OFFERS',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                ),
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: Icon(
            IconlyLight.notification,
            color: AppColors.textPrimary,
          ),
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const NotificationsPage(),
            ),
          ),
        ),
        IconButton(
          icon: Icon(
            IconlyLight.show,
            color: canOpenMap
                ? AppColors.textPrimary
                : AppColors.textSecondary.withValues(alpha: 0.5),
          ),
          onPressed: canOpenMap
              ? () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => MapPage(stores: state.featuredStores),
                    ),
                  )
              : () {
                    final message = AppConstants.mapsEnabled
                        ? 'لا توجد متاجر بمواقع متاحة على الخريطة الآن'
                        : 'الخريطة غير مفعلة حاليًا لأن مفتاح Google Maps غير مضبوط';
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(message)),
                    );
                  },
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'عروض النهاردة في الزقازيق 📍',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            'وفر أكتر مع كل خروجة',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildLiveStats(BuildContext context, OffersLoaded state) {
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
              width: 6,
              height: 6,
              decoration: const BoxDecoration(
                color: Colors.green,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'مباشر: $offersCount عرض متاح الآن',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
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
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
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

  Widget _buildSearchBar(BuildContext context, OffersLoaded state) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Expanded(
            child: InkWell(
              borderRadius: BorderRadius.circular(18),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const SearchPage()),
              ),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: Colors.grey[200]!),
                ),
                child: Row(
                  children: [
                    Icon(
                      IconlyLight.search,
                      color: AppColors.textSecondary,
                      size: 22,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'بتدور على إيه؟',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: () => _showFilterSheet(context, state),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.2),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Stack(
                children: [
                  const Icon(
                    Icons.tune_rounded,
                    color: Colors.white,
                    size: 24,
                  ),
                  if (_currentArea != 'الكل' || _minDiscount > 0 || _sortBy != 'newest')
                    Positioned(
                      right: 0,
                      top: 0,
                      child: Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOffersSection(
    BuildContext context, {
    required String title,
    required String subtitle,
    required List offers,
  }) {
    if (offers.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: Text(
            title,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w800,
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
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
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
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
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
          height: 242,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.only(left: 16, right: 4),
            itemCount: offers.length,
            itemBuilder: (context, index) {
              final offer = offers[index];
              return OfferCard(
                offer: offer,
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => OfferDetailPage(offer: offer),
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

  Widget _buildCategoryFilteredSection(
    BuildContext context,
    OffersLoaded state, {
    required String category,
    required String title,
    required String subtitle,
  }) {
    final filtered = OfferFilterUtils.apply(
      offers: state.trendingOffers.where((offer) => offer.store.category == category).toList(),
      area: _currentArea,
      minDiscount: _minDiscount,
      sortBy: _sortBy,
    );

    return _buildOffersSection(
      context,
      title: title,
      subtitle: subtitle,
      offers: filtered,
    );
  }
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
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
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
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
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
                    const SizedBox(width: 8),
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

class _HomeEmptyState extends StatelessWidget {
  final VoidCallback onRetry;

  const _HomeEmptyState({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.local_offer_outlined,
                size: 64,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'لا توجد عروض حالياً',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w900,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'سنقوم بإضافة عروض جديدة قريباً جداً في منطقتك. ترقبوا الإشعارات!',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 32),
            TextButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.sync_rounded),
              label: const Text(
                'تحديث الصفحة',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              style: TextButton.styleFrom(
                foregroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
