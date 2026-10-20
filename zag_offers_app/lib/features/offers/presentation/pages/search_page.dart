import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_app/core/utils/category_utils.dart';
import 'package:zag_offers_app/core/widgets/bouncy_tap.dart';
import 'package:zag_offers_app/core/widgets/network_image_widget.dart';
import 'package:zag_offers_app/features/offers/domain/entities/offer_entity.dart';
import 'package:zag_offers_app/features/offers/presentation/bloc/offers_bloc.dart';
import 'package:zag_offers_app/features/offers/presentation/bloc/offers_event.dart';
import 'package:zag_offers_app/features/offers/presentation/bloc/offers_state.dart';
import 'package:zag_offers_app/features/offers/presentation/pages/offer_detail_page.dart';
import 'package:zag_offers_app/features/offers/presentation/utils/offer_filter_utils.dart';
import 'package:zag_offers_app/features/offers/presentation/widgets/filter_bottom_sheet.dart';
import 'package:zag_offers_app/features/offers/presentation/widgets/offer_card.dart';

class SearchPage extends StatefulWidget {
  const SearchPage({super.key});

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  // Brand Color Tokens (Strictly Solid - Zero Gradients)
  static const Color _primaryOrange = Color(0xFFFF5A0A);
  static const Color _darkNavy = Color(0xFF142033);
  static const Color _lightBg = Color(0xFFF8F9FB);
  static const Color _secondaryGray = Color(0xFF718096);
  static const Color _cardDark = Color(0xFF162032);
  static const Color _borderLight = Color(0xFFE2E8F0);

  String _selectedCategory = 'الكل';
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounceTimer;

  String _currentArea = 'الكل';
  double _minDiscount = 0;
  String _sortBy = 'newest';

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query, BuildContext context) {
    // 1. Instant client-side re-render (0ms)
    setState(() {});

    // 2. Debounce remote search enrichment
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 350), () {
      final trimmed = query.trim();
      if (OfferFilterUtils.shouldRunSearch(trimmed)) {
        context.read<OffersBloc>().add(SearchOffers(trimmed));
      } else {
        context.read<OffersBloc>().add(SearchOffers(''));
      }
    });
  }

  void _clearSearch(BuildContext context) {
    _debounceTimer?.cancel();
    setState(() {
      _searchController.clear();
    });
    context.read<OffersBloc>().add(SearchOffers(''));
  }

  void _resetAllFilters() {
    _debounceTimer?.cancel();
    setState(() {
      _selectedCategory = 'الكل';
      _currentArea = 'الكل';
      _minDiscount = 0;
      _sortBy = 'newest';
      _searchController.clear();
    });
    context.read<OffersBloc>().add(SearchOffers(''));
  }

  List<OfferEntity> _getAllSourceOffers(OffersLoaded state) {
    final Map<String, OfferEntity> map = {};

    // 1. Add remote search results first if available
    if (state.searchResults != null) {
      for (final offer in state.searchResults!) {
        map[offer.id] = offer;
      }
    }

    // 2. Add all loaded offers
    for (final offer in state.allOffers) {
      map.putIfAbsent(offer.id, () => offer);
    }

    // 3. Add trending offers
    for (final offer in state.trendingOffers) {
      map.putIfAbsent(offer.id, () => offer);
    }

    // 4. Add recommended offers
    if (state.recommendedOffers != null) {
      for (final offer in state.recommendedOffers!) {
        map.putIfAbsent(offer.id, () => offer);
      }
    }

    return map.values.toList();
  }

  Future<void> _showFilterSheet() async {
    final loadedState = context.read<OffersBloc>().state;
    final allOffers = loadedState is OffersLoaded
        ? _getAllSourceOffers(loadedState)
        : const <OfferEntity>[];
    final availableAreas = OfferFilterUtils.extractAreas(allOffers);

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

    if (result != null && mounted) {
      setState(() {
        _currentArea = result['area'];
        _minDiscount = result['minDiscount'];
        _sortBy = result['sortBy'];
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final scaffoldBg = isDark ? const Color(0xFF0F172A) : _lightBg;

    return Scaffold(
      backgroundColor: scaffoldBg,
      appBar: _buildAppBar(context, isDark),
      body: BlocBuilder<OffersBloc, OffersState>(
        buildWhen: (prev, next) =>
            next is OffersLoaded || next is OffersLoading || next is OffersError,
        builder: (context, state) {
          if (state is OffersLoading) {
            return const Center(
              child: CircularProgressIndicator(color: _primaryOrange, strokeWidth: 2.5),
            );
          }

          if (state is OffersLoaded) {
            return Column(
              children: [
                _buildHorizontalCategoriesBar(context, state, isDark),
                Expanded(child: _buildOffersFeed(context, state, isDark)),
              ],
            );
          }

          if (state is OffersError) {
            final isConnectionError = state.message.toLowerCase().contains('connection') ||
                state.message.toLowerCase().contains('network') ||
                state.message.toLowerCase().contains('socket');

            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEE2E2),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        isConnectionError ? Icons.wifi_off_rounded : Icons.error_outline_rounded,
                        size: 48,
                        color: const Color(0xFFDC2626),
                      ),
                    ),
                    const SizedBox(height: 18),
                    Text(
                      isConnectionError ? 'تعذر الاتصال بالخادم' : 'تعذر تحميل العروض',
                      style: GoogleFonts.cairo(
                        fontSize: 17,
                        fontWeight: FontWeight.w900,
                        color: isDark ? Colors.white : _darkNavy,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      isConnectionError
                          ? 'يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.'
                          : state.message,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.cairo(
                        fontSize: 12.5,
                        color: _secondaryGray,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 22),
                    BouncyTap(
                      onTap: () {
                        HapticFeedback.lightImpact();
                        context.read<OffersBloc>().add(SearchOffers(_searchController.text));
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
                        decoration: BoxDecoration(
                          color: _primaryOrange,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.refresh_rounded, size: 16, color: Colors.white),
                            const SizedBox(width: 6),
                            Text(
                              'إعادة المحاولة',
                              style: GoogleFonts.cairo(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
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

          return const SizedBox.shrink();
        },
      ),
    );
  }

  // =========================================================================
  // 1. COMPACT, ACCESSIBLE SEARCH & FILTER HEADER
  // =========================================================================
  PreferredSizeWidget _buildAppBar(BuildContext context, bool isDark) {
    final hasActiveFilter =
        _currentArea != 'الكل' || _minDiscount > 0 || _sortBy != 'newest';

    return AppBar(
      elevation: 0,
      scrolledUnderElevation: 0,
      backgroundColor: isDark ? _darkNavy : Colors.white,
      toolbarHeight: 60,
      automaticallyImplyLeading: false,
      titleSpacing: 0,
      title: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Row(
          children: [
            // Back Button (Directional RTL)
            BouncyTap(
              onTap: () {
                HapticFeedback.lightImpact();
                Navigator.pop(context);
              },
              child: Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: isDark ? _cardDark : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isDark ? Colors.white.withValues(alpha: 0.08) : _borderLight,
                    width: 0.8,
                  ),
                ),
                child: Icon(
                  Directionality.of(context) == TextDirection.rtl
                      ? Icons.arrow_forward_ios_rounded
                      : Icons.arrow_back_ios_new_rounded,
                  size: 16,
                  color: isDark ? Colors.white : _darkNavy,
                ),
              ),
            ),

            const SizedBox(width: 8),

            // Search TextField (Compact Squircle)
            Expanded(
              child: Container(
                height: 42,
                decoration: BoxDecoration(
                  color: isDark ? _cardDark : _lightBg,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isDark ? Colors.white.withValues(alpha: 0.08) : _borderLight,
                    width: 0.8,
                  ),
                ),
                child: TextField(
                  controller: _searchController,
                  onChanged: (val) => _onSearchChanged(val, context),
                  onSubmitted: (val) {
                    _debounceTimer?.cancel();
                    final trimmed = val.trim();
                    if (OfferFilterUtils.shouldRunSearch(trimmed)) {
                      context.read<OffersBloc>().add(SearchOffers(trimmed));
                    }
                    FocusScope.of(context).unfocus();
                  },
                  textInputAction: TextInputAction.search,
                  style: GoogleFonts.cairo(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.white : _darkNavy,
                  ),
                  decoration: InputDecoration(
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(vertical: 10),
                    hintText: 'ابحث عن عرض أو متجر...',
                    hintStyle: GoogleFonts.cairo(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600,
                      color: _secondaryGray,
                    ),
                    border: InputBorder.none,
                    prefixIcon: const Icon(
                      Icons.search_rounded,
                      color: _primaryOrange,
                      size: 18,
                    ),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            padding: EdgeInsets.zero,
                            icon: const Icon(
                              Icons.close_rounded,
                              size: 17,
                              color: _secondaryGray,
                            ),
                            onPressed: () => _clearSearch(context),
                          )
                        : null,
                  ),
                ),
              ),
            ),

            const SizedBox(width: 8),

            // Filter Button
            BouncyTap(
              onTap: () {
                HapticFeedback.lightImpact();
                _showFilterSheet();
              },
              child: Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: isDark ? _cardDark : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: hasActiveFilter
                        ? _primaryOrange
                        : (isDark ? Colors.white.withValues(alpha: 0.08) : _borderLight),
                    width: hasActiveFilter ? 1.5 : 0.8,
                  ),
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Icon(
                      Icons.tune_rounded,
                      size: 18,
                      color: hasActiveFilter
                          ? _primaryOrange
                          : (isDark ? Colors.white : _darkNavy),
                    ),
                    if (hasActiveFilter)
                      PositionedDirectional(
                        top: 5,
                        end: 5,
                        child: Container(
                          width: 6,
                          height: 6,
                          decoration: const BoxDecoration(
                            color: _primaryOrange,
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
      ),
    );
  }

  // =========================================================================
  // 2. HORIZONTAL CATEGORIES BAR (FULL WIDTH, SLEEK BRANDED PILLS)
  // =========================================================================
  Widget _buildHorizontalCategoriesBar(
    BuildContext context,
    OffersLoaded state,
    bool isDark,
  ) {
    final dynamicCategories = state.categories;
    final itemCount = dynamicCategories.length + 1; // + "الكل"

    return Container(
      height: 44,
      margin: const EdgeInsets.only(top: 8, bottom: 4),
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 14),
        itemCount: itemCount,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final bool isAll = index == 0;
          final categoryBackendName =
              isAll ? 'الكل' : dynamicCategories[index - 1].name;
          final categoryDisplayName = isAll
              ? 'الكل'
              : CategoryUtils.getDisplayName(dynamicCategories[index - 1].name);
          final categoryImage =
              isAll ? null : dynamicCategories[index - 1].image;
          final isSelected = _selectedCategory == categoryBackendName;

          return BouncyTap(
            onTap: () {
              setState(() {
                _selectedCategory = categoryBackendName;
              });
              HapticFeedback.lightImpact();
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeOutCubic,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
              decoration: BoxDecoration(
                color: isSelected
                    ? _primaryOrange
                    : (isDark ? _cardDark : Colors.white),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: isSelected
                      ? _primaryOrange
                      : (isDark ? Colors.white.withValues(alpha: 0.1) : _borderLight),
                  width: 1,
                ),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: _primaryOrange.withValues(alpha: 0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ]
                    : null,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (isAll)
                    Icon(
                      Icons.grid_view_rounded,
                      size: 15,
                      color: isSelected ? Colors.white : _primaryOrange,
                    )
                  else if (categoryImage != null && categoryImage.isNotEmpty)
                    ClipOval(
                      child: SizedBox(
                        width: 18,
                        height: 18,
                        child: NetworkImageWidget(
                          imageUrl: categoryImage,
                          fit: BoxFit.cover,
                        ),
                      ),
                    )
                  else
                    Icon(
                      CategoryUtils.getIcon(categoryBackendName),
                      size: 15,
                      color: isSelected ? Colors.white : _primaryOrange,
                    ),
                  const SizedBox(width: 6),
                  Text(
                    categoryDisplayName,
                    style: GoogleFonts.cairo(
                      fontSize: 12,
                      fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
                      color: isSelected
                          ? Colors.white
                          : (isDark ? Colors.grey.shade300 : _darkNavy),
                      height: 1.15,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // =========================================================================
  // 3. RESPONSIVE, CONTENT-DRIVEN OFFERS FEED (ZERO WASTED VERTICAL SPACE)
  // =========================================================================
  Widget _buildOffersFeed(BuildContext context, OffersLoaded state, bool isDark) {
    final query = _searchController.text.trim();
    final allOffers = _getAllSourceOffers(state);
    final filtered = OfferFilterUtils.apply(
      offers: allOffers,
      category: _selectedCategory,
      area: _currentArea,
      minDiscount: _minDiscount,
      sortBy: _sortBy,
      searchQuery: query,
    );

    final hasActiveFilter =
        _currentArea != 'الكل' || _minDiscount > 0 || _selectedCategory != 'الكل';

    if (filtered.isEmpty) {
      return _buildEmptyState(
        isDark: isDark,
        icon: query.isNotEmpty ? Icons.search_off_rounded : Icons.local_offer_outlined,
        title: query.isNotEmpty ? 'لم نعثر على نتائج مطابقة' : 'لا توجد عروض مطابقة',
        subtitle: query.isNotEmpty
            ? 'جرّب البحث بكلمة أخرى أو تعديل التصنيف والفلاتر للعثور على عروض.'
            : 'جرّب اختيار تصنيف آخر أو خفّف الفلاتر للعثور على عروض حصرية.',
      );
    }

    return Column(
      children: [
        if (hasActiveFilter || query.isNotEmpty)
          _buildActiveFiltersHeader(context, filtered.length, isDark),
        Expanded(
          child: _buildResponsiveList(context, filtered),
        ),
      ],
    );
  }

  Widget _buildActiveFiltersHeader(
    BuildContext context,
    int count,
    bool isDark,
  ) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 6, 16, 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                '$count ${count == 1 ? "عرض مطابق" : "عروض مطابقة"}',
                style: GoogleFonts.cairo(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white70 : _darkNavy,
                ),
              ),
              const Spacer(),
              if (_selectedCategory != 'الكل' ||
                  _currentArea != 'الكل' ||
                  _minDiscount > 0)
                BouncyTap(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    setState(() {
                      _selectedCategory = 'الكل';
                      _currentArea = 'الكل';
                      _minDiscount = 0;
                    });
                  },
                  child: Text(
                    'مسح الفلاتر',
                    style: GoogleFonts.cairo(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: _primaryOrange,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 6),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                if (_selectedCategory != 'الكل')
                  _buildFilterChip(
                    label: CategoryUtils.getDisplayName(_selectedCategory),
                    onDelete: () {
                      setState(() => _selectedCategory = 'الكل');
                    },
                    isDark: isDark,
                  ),
                if (_currentArea != 'الكل')
                  _buildFilterChip(
                    label: _currentArea,
                    icon: Icons.location_on_outlined,
                    onDelete: () {
                      setState(() => _currentArea = 'الكل');
                    },
                    isDark: isDark,
                  ),
                if (_minDiscount > 0)
                  _buildFilterChip(
                    label: 'خصم ${_minDiscount.toInt()}%+',
                    icon: Icons.percent_rounded,
                    onDelete: () {
                      setState(() => _minDiscount = 0);
                    },
                    isDark: isDark,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip({
    required String label,
    required VoidCallback onDelete,
    required bool isDark,
    IconData? icon,
  }) {
    return Padding(
      padding: const EdgeInsetsDirectional.only(end: 6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
        decoration: BoxDecoration(
          color: isDark ? _cardDark : const Color(0xFFFFF3EC),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: _primaryOrange.withValues(alpha: 0.35),
            width: 0.8,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 12, color: _primaryOrange),
              const SizedBox(width: 4),
            ],
            Text(
              label,
              style: GoogleFonts.cairo(
                fontSize: 10.5,
                fontWeight: FontWeight.w700,
                color: _primaryOrange,
              ),
            ),
            const SizedBox(width: 4),
            BouncyTap(
              onTap: () {
                HapticFeedback.lightImpact();
                onDelete();
              },
              child: const Icon(
                Icons.close_rounded,
                size: 13,
                color: _primaryOrange,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResponsiveList(BuildContext context, List<OfferEntity> offers) {
    final bottomInset = MediaQuery.paddingOf(context).bottom;

    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;

        // Mobile Phone Column (< 520px): Content-Driven ListView (No fixed stretched heights!)
        if (width < 520) {
          return ListView.separated(
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            padding: EdgeInsets.fromLTRB(16, 8, 16, 24 + bottomInset),
            itemCount: offers.length,
            separatorBuilder: (_, __) => const SizedBox(height: 14),
            itemBuilder: (context, index) {
              final offer = offers[index];
              final cardHeroTag = 'explore_offers_${offer.id}_$index';
              return OfferCard(
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
              );
            },
          );
        }

        // Tablet / Foldable Screen (>= 520px): Multi-column Grid
        final crossAxisCount = width >= 780 ? 3 : 2;
        return GridView.builder(
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          padding: EdgeInsets.fromLTRB(14, 14, 14, 24 + bottomInset),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 0.80,
          ),
          itemCount: offers.length,
          itemBuilder: (context, index) {
            final offer = offers[index];
            final cardHeroTag = 'explore_offers_${offer.id}_$index';
            return OfferCard(
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
            );
          },
        );
      },
    );
  }

  // =========================================================================
  // 4. CLEAN, SOLID BRANDED EMPTY STATE
  // =========================================================================
  Widget _buildEmptyState({
    required bool isDark,
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 58,
              height: 58,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : const Color(0xFFFFF3EC),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 26,
                color: _primaryOrange,
              ),
            ),
            const SizedBox(height: 14),
            Text(
              title,
              textAlign: TextAlign.center,
              style: GoogleFonts.cairo(
                fontWeight: FontWeight.w900,
                fontSize: 15,
                color: isDark ? Colors.white : _darkNavy,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: GoogleFonts.cairo(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: _secondaryGray,
                height: 1.4,
              ),
            ),
            if (_selectedCategory != 'الكل' ||
                _currentArea != 'الكل' ||
                _minDiscount > 0 ||
                _searchController.text.isNotEmpty) ...[
              const SizedBox(height: 18),
              BouncyTap(
                onTap: () {
                  HapticFeedback.lightImpact();
                  _resetAllFilters();
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: isDark ? _cardDark : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isDark ? Colors.white.withValues(alpha: 0.08) : _borderLight,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.restart_alt_rounded, size: 14, color: _primaryOrange),
                      const SizedBox(width: 4),
                      Text(
                        'إعادة ضبط الفلاتر',
                        style: GoogleFonts.cairo(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w800,
                          color: _primaryOrange,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
