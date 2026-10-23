import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:flutter_iconly/flutter_iconly.dart';
import 'package:zag_offers_app/core/theme/app_colors.dart';
import 'package:zag_offers_app/core/utils/navigation_service.dart';
import 'package:zag_offers_app/core/widgets/bouncy_tap.dart';
import 'package:zag_offers_app/features/home/presentation/pages/main_screen.dart';
import 'package:zag_offers_app/features/home/presentation/pages/notifications_page.dart';
import 'package:zag_offers_app/features/offers/presentation/bloc/offers_bloc.dart';
import 'package:zag_offers_app/features/offers/presentation/bloc/offers_event.dart';
import 'package:zag_offers_app/features/offers/presentation/bloc/offers_state.dart';
import 'package:zag_offers_app/features/notifications/presentation/bloc/notification_bloc.dart';
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

    if (!context.mounted) return;
    if (result != null) {
      setState(() {
        _currentArea = result['area'];
        _minDiscount = result['minDiscount'];
        _sortBy = result['sortBy'];
      });
    }
  }

  void _showAreaPickerSheet(BuildContext context) {
    HapticFeedback.lightImpact();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final areas = [
      {'name': 'الكل', 'desc': 'كل أحياء وعروض الزقازيق', 'icon': Icons.stars_rounded},
      {'name': 'القومية', 'desc': 'أشهر المطاعم والكافيهات والبراندات', 'icon': Icons.restaurant_rounded},
      {'name': 'فلل الجامعة', 'desc': 'أماكن روقان وكافيهات شبابية هادئة', 'icon': Icons.coffee_rounded},
      {'name': 'طلبة عويضة', 'desc': 'أكلات سريعة وساندوتشات وجبات خفيفة', 'icon': Icons.lunch_dining_rounded},
      {'name': 'المشاية', 'desc': 'إطلالة بحر مويس وخروجات رايقة', 'icon': Icons.water_rounded},
      {'name': 'شارع المحافظة', 'desc': 'محلات وسط البلد ومستلزمات التسوق', 'icon': Icons.storefront_rounded},
      {'name': 'المنتزه', 'desc': 'أماكن عائلية وأنشطة ترفيهية', 'icon': Icons.attractions_rounded},
      {'name': 'حي الزهور', 'desc': 'خدمات وأسواق متنوعة', 'icon': Icons.local_florist_rounded},
      {'name': 'الصيادين', 'desc': 'محلات وتجارة وخدمات محلية', 'icon': Icons.local_offer_rounded},
    ];

    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? const Color(0xFF1E1E24) : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.location_on_rounded, color: AppColors.primary, size: 20),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'اختر منطقتك في الزقازيق 📍',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      Text(
                        'هنظهرلك العروض والمطاعم الأقرب ليك',
                        style: TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: areas.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (ctx, i) {
                  final area = areas[i];
                  final isSelected = _currentArea == area['name'];
                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    leading: CircleAvatar(
                      backgroundColor: isSelected
                          ? AppColors.primary
                          : (isDark ? Colors.white10 : Colors.grey.shade100),
                      foregroundColor: isSelected ? Colors.white : AppColors.primary,
                      child: Icon(area['icon'] as IconData, size: 18),
                    ),
                    title: Text(
                      area['name'] as String,
                      style: TextStyle(
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                        color: isSelected ? AppColors.primary : null,
                      ),
                    ),
                    subtitle: Text(
                      area['desc'] as String,
                      style: const TextStyle(fontSize: 11, color: Colors.grey),
                    ),
                    trailing: isSelected
                        ? const Icon(Icons.check_circle_rounded, color: AppColors.primary)
                        : null,
                    onTap: () {
                      HapticFeedback.lightImpact();
                      setState(() {
                        _currentArea = area['name'] as String;
                      });
                      Navigator.pop(ctx);
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
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
                          const SizedBox(height: 18),
                          _buildHeroSearchBar(context),
                          const SizedBox(height: 20),
                          const AdsSlider(),
                          const SizedBox(height: 20),
                          CategoriesSection(categories: state.categories),
                          Builder(
                            builder: (context) {
                              final trending = OfferFilterUtils.apply(
                                offers: state.trendingOffers,
                                area: _currentArea,
                                minDiscount: _minDiscount,
                                sortBy: _sortBy,
                              );
                              final recommended = OfferFilterUtils.apply(
                                offers: state.recommendedOffers ?? const [],
                                area: _currentArea,
                                minDiscount: _minDiscount,
                                sortBy: _sortBy,
                              );

                              final hasAnyOffers = trending.isNotEmpty || recommended.isNotEmpty;

                              if (!hasAnyOffers && (_currentArea != 'الكل' || _minDiscount > 0)) {
                                final isDark = Theme.of(context).brightness == Brightness.dark;
                                return Container(
                                  margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                                  padding: const EdgeInsets.all(24),
                                  decoration: BoxDecoration(
                                    color: isDark ? const Color(0xFF19202E) : Colors.white,
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                      color: isDark ? Colors.white10 : Colors.black12,
                                    ),
                                  ),
                                  child: Column(
                                    children: [
                                      Icon(
                                        Icons.location_off_rounded,
                                        size: 48,
                                        color: AppColors.primary.withValues(alpha: 0.8),
                                      ),
                                      const SizedBox(height: 12),
                                      Text(
                                        'لا توجد عروض مطابقة في $_currentArea',
                                        textAlign: TextAlign.center,
                                        style: GoogleFonts.cairo(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 15,
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        'يمكنك استعراض جميع عروض الزقازيق المتاحة الآن',
                                        textAlign: TextAlign.center,
                                        style: GoogleFonts.cairo(
                                          color: AppColors.textSecondary,
                                          fontSize: 12,
                                        ),
                                      ),
                                      const SizedBox(height: 16),
                                      BouncyTap(
                                        onTap: () {
                                          HapticFeedback.lightImpact();
                                          setState(() {
                                            _currentArea = 'الكل';
                                            _minDiscount = 0;
                                            _sortBy = 'newest';
                                          });
                                        },
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                                          decoration: BoxDecoration(
                                            gradient: const LinearGradient(
                                              colors: [AppColors.primary, Color(0xFFFF8C35)],
                                            ),
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                          child: Text(
                                            'عرض جميع العروض',
                                            style: GoogleFonts.cairo(
                                              color: Colors.white,
                                              fontWeight: FontWeight.w800,
                                              fontSize: 13,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }

                              return Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _buildOffersSection(
                                    context,
                                    title: 'الأكثر انتشارًا',
                                    subtitle: 'عروض يكثر عليها الطلب الآن',
                                    offers: trending,
                                  ),
                                  _buildOffersSection(
                                    context,
                                    title: 'مقترح لك',
                                    subtitle: 'عروض مناسبة حسب نشاطك الحالي',
                                    offers: recommended,
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
                              );
                            },
                          ),
                          const SizedBox(height: 120),
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
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return SliverAppBar(
      automaticallyImplyLeading: false,
      expandedHeight: 80,
      floating: true,
      pinned: true,
      elevation: 0,
      backgroundColor: Colors.transparent,
      flexibleSpace: ClipRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: Container(
            decoration: BoxDecoration(
              color: theme.scaffoldBackgroundColor.withValues(alpha: isDark ? 0.82 : 0.88),
              border: Border(
                bottom: BorderSide(
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.06)
                      : Colors.black.withValues(alpha: 0.05),
                  width: 0.8,
                ),
              ),
            ),
          ),
        ),
      ),
      centerTitle: false,
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          BouncyTap(
            scaleFactor: 0.94,
            onTap: () => _showAreaPickerSheet(context),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: AppColors.primary.withValues(alpha: 0.22),
                  width: 0.8,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(IconlyBold.location, color: AppColors.primary, size: 14),
                  const SizedBox(width: 4),
                  Text(
                    _currentArea == 'الكل' ? 'الزقازيق، الشرقية' : '$_currentArea، الزقازيق',
                    style: theme.textTheme.labelMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(width: 2),
                  const Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: AppColors.primary),
                ],
              ),
            ),
          ),
          const SizedBox(height: 3),
          Text(
            'ZAG OFFERS • وفر مع كل خروجة',
            style: theme.textTheme.labelSmall?.copyWith(
              color: AppColors.primary,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.2,
              fontSize: 9.5,
            ),
          ),
        ],
      ),
      actions: [
        BlocBuilder<NotificationBloc, NotificationState>(
          buildWhen: (prev, next) {
            if (prev is NotificationFeedState && next is NotificationFeedState) {
              return prev.items.length != next.items.length ||
                  prev.items.where((e) => !e.isRead).length !=
                      next.items.where((e) => !e.isRead).length;
            }
            return true;
          },
          builder: (context, notifState) {
            int unreadCount = 0;
            if (notifState is NotificationFeedState) {
              unreadCount = notifState.items.where((e) => !e.isRead).length;
            }
            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 4),
              decoration: BoxDecoration(
                color: (isDark ? Colors.white : Colors.black).withValues(alpha: 0.05),
                shape: BoxShape.circle,
                border: Border.all(
                  color: (isDark ? Colors.white : Colors.black).withValues(alpha: 0.08),
                ),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  IconButton(
                    icon: const Icon(IconlyLight.notification, size: 20),
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      Navigator.push(context, MaterialPageRoute(builder: (context) => const NotificationsPage()));
                    },
                  ),
                  if (unreadCount > 0)
                    Positioned(
                      top: 8,
                      right: 8,
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
              ),
            );
          },
        ),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 4),
          decoration: BoxDecoration(
            color: (isDark ? Colors.white : Colors.black).withValues(alpha: 0.05),
            shape: BoxShape.circle,
            border: Border.all(
              color: (isDark ? Colors.white : Colors.black).withValues(alpha: 0.08),
            ),
          ),
          child: IconButton(
            icon: const Icon(Icons.explore_rounded, color: AppColors.primary, size: 22),
            tooltip: 'تصفح عروض أحياء الزقازيق',
            onPressed: () {
              HapticFeedback.lightImpact();
              _showAreaPickerSheet(context);
            },
          ),
        ),
        Container(
          margin: const EdgeInsets.only(left: 12, right: 4),
          decoration: BoxDecoration(
            color: (isDark ? Colors.white : Colors.black).withValues(alpha: 0.05),
            shape: BoxShape.circle,
            border: Border.all(
              color: (isDark ? Colors.white : Colors.black).withValues(alpha: 0.08),
            ),
          ),
          child: IconButton(
            icon: const Icon(Icons.tune_rounded, size: 20),
            onPressed: () {
              HapticFeedback.lightImpact();
              _showFilterSheet(context, state);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildHeroSearchBar(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: BouncyTap(
        scaleFactor: 0.98,
        onTap: () {
          HapticFeedback.lightImpact();
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const SearchPage(),
            ),
          );
        },
        child: Container(
          height: 52,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF19202E) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark
                  ? Colors.white.withValues(alpha: 0.08)
                  : AppColors.primary.withValues(alpha: 0.18),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: isDark
                    ? Colors.black.withValues(alpha: 0.25)
                    : AppColors.primary.withValues(alpha: 0.07),
                blurRadius: 18,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              const Icon(
                IconlyLight.search,
                color: AppColors.primary,
                size: 22,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'بتدور على مطعم، كافيه، أو براند معين؟',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: isDark ? AppColors.textDarkDim : AppColors.textSecondary.withValues(alpha: 0.85),
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.tune_rounded,
                  color: AppColors.primary,
                  size: 16,
                ),
              ),
            ],
          ),
        ),
      ),
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
          color: AppColors.success.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: AppColors.success.withValues(alpha: 0.18)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: AppColors.success,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 10),
            Text(
              'مباشر: $offersCount عرض متاح الآن',
              style: textTheme.labelSmall?.copyWith(
                    color: AppColors.success,
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoticeBanner(BuildContext context, String message) {
    final theme = Theme.of(context);
    final textTheme = theme.textTheme;
    final isDark = theme.brightness == Brightness.dark;
    final warningColor = isDark ? const Color(0xFFFDE68A) : const Color(0xFFC2410C);
    final warningText = isDark ? const Color(0xFFFEF3C7) : const Color(0xFF9A3412);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isDark
              ? AppColors.warning.withValues(alpha: 0.14)
              : AppColors.warning.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDark
                ? AppColors.warning.withValues(alpha: 0.28)
                : AppColors.warning.withValues(alpha: 0.2),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Icon(
              Icons.info_outline_rounded,
              color: warningColor,
              size: 20,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                message,
                style: textTheme.labelSmall?.copyWith(
                  color: warningText,
                  fontWeight: FontWeight.w700,
                  height: 1.4,
                ),
              ),
            ),
            const SizedBox(width: 8),
            BouncyTap(
              scaleFactor: 0.94,
              onTap: () {
                HapticFeedback.lightImpact();
                context.read<OffersBloc>().add(FetchHomeData());
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: warningColor.withValues(alpha: isDark ? 0.22 : 0.14),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.refresh_rounded,
                      size: 14,
                      color: warningColor,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'إعادة المحاولة',
                      style: textTheme.labelSmall?.copyWith(
                        color: warningColor,
                        fontWeight: FontWeight.w800,
                        fontSize: 11,
                      ),
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
    final filtered = OfferFilterUtils.apply(
      offers: state.trendingOffers,
      category: category,
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
              label: Icon(
                NavigationService.getForwardIcon(context),
                size: 13,
              ),
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
        height: 350,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          itemCount: offers.length,
          itemBuilder: (context, index) {
            final offer = offers[index];
            final cardHeroTag = 'home_${title.hashCode}_${offer.id}_$index';
            return RepaintBoundary(
              child: Padding(
                padding: const EdgeInsetsDirectional.only(end: 14),
                child: SizedBox(
                  width: 275,
                  child: OfferCard(
                    offer: offer,
                    isWide: true,
                    heroTag: cardHeroTag,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => OfferDetailPage(
                          offer: offer,
                          heroTag: cardHeroTag,
                        ),
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
