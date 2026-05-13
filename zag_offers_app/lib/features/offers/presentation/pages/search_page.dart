import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:zag_offers_app/core/theme/app_colors.dart';
import 'package:zag_offers_app/features/offers/domain/entities/offer_entity.dart';
import 'package:zag_offers_app/features/offers/presentation/bloc/offers_bloc.dart';
import 'package:zag_offers_app/features/offers/presentation/bloc/offers_event.dart';
import 'package:zag_offers_app/features/offers/presentation/bloc/offers_state.dart';
import 'package:zag_offers_app/features/offers/presentation/constants/offer_categories.dart';
import 'package:zag_offers_app/features/offers/presentation/pages/offer_detail_page.dart';
import 'package:zag_offers_app/features/offers/presentation/utils/offer_filter_utils.dart';
import 'package:zag_offers_app/features/offers/presentation/widgets/filter_bottom_sheet.dart';
import 'package:zag_offers_app/features/offers/presentation/widgets/offer_card.dart';
import 'package:zag_offers_app/core/widgets/network_image_widget.dart';

class SearchPage extends StatefulWidget {
  const SearchPage({super.key});

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
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
    setState(() {});
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 400), () {
      final trimmed = query.trim();
      if (OfferFilterUtils.shouldRunSearch(trimmed)) {
        context.read<OffersBloc>().add(SearchOffers(trimmed));
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

  List<OfferEntity> _getCurrentSourceOffers(OffersLoaded state) {
    final source = _searchController.text.trim().isNotEmpty
        ? state.searchResults ?? const <OfferEntity>[]
        : state.trendingOffers;

    return source
        .where((offer) =>
            _selectedCategory == 'الكل' ||
            offer.store.category == _selectedCategory)
        .toList();
  }

  Future<void> _showFilterSheet() async {
    final loadedState = context.read<OffersBloc>().state;
    final availableAreas = loadedState is OffersLoaded
        ? OfferFilterUtils.extractAreas(_getCurrentSourceOffers(loadedState))
        : const ['الكل'];

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
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => Navigator.pop(context),
        ),
        title: Container(
          height: 50,
          decoration: BoxDecoration(
            color: theme.cardColor,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: theme.dividerColor),
          ),
          child: TextField(
            controller: _searchController,
            onChanged: (val) => _onSearchChanged(val, context),
            autofocus: true,
            style: const TextStyle(fontSize: 14),
            decoration: InputDecoration(
              hintText: 'ابحث عن عرض أو متجر',
              helperText: _searchController.text.isNotEmpty &&
                      !OfferFilterUtils.shouldRunSearch(_searchController.text)
                  ? 'اكتب 3 أحرف على الأقل لبدء البحث'
                  : null,
              border: InputBorder.none,
              prefixIcon: const Icon(
                Icons.search_rounded,
                color: AppColors.primary,
                size: 20,
              ),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(
                        Icons.close_rounded,
                        size: 18,
                      ),
                      onPressed: () => _clearSearch(context),
                    )
                  : null,
            ),
          ),
        ),
        actions: [
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.tune_rounded),
                onPressed: _showFilterSheet,
              ),
              if (_currentArea != 'الكل' ||
                  _minDiscount > 0 ||
                  _sortBy != 'newest')
                Positioned(
                  right: 12,
                  top: 12,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: BlocBuilder<OffersBloc, OffersState>(
        builder: (context, state) {
          if (state is OffersLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state is OffersLoaded) {
            if (_searchController.text.trim().isNotEmpty) {
              if (!OfferFilterUtils.shouldRunSearch(_searchController.text)) {
                return _buildEmptyState(
                  icon: Icons.search_rounded,
                  title: 'اكتب كلمة أوضح للبحث',
                  subtitle: 'ابدأ بـ 3 أحرف على الأقل لعرض نتائج دقيقة.',
                );
              }
              return _buildSearchResults(context, state);
            }

            return Row(
              children: [
                _buildSidebar(context),
                Expanded(child: _buildOffersGrid(context, state)),
              ],
            );
          }

          if (state is OffersError) {
            final isConnectionError = state.message.toLowerCase().contains('connection') || 
                                     state.message.toLowerCase().contains('network') ||
                                     state.message.toLowerCase().contains('socket');

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
                      isConnectionError ? 'مشكلة في الاتصال' : 'تعذر تحميل العروض',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      isConnectionError 
                          ? 'يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى'
                          : state.message,
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
                        onPressed: () => context.read<OffersBloc>().add(SearchOffers(_searchController.text)),
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

          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildSidebar(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: 96,
      decoration: BoxDecoration(
        color: theme.cardColor.withValues(alpha: 0.8),
        border: Border(
          left: BorderSide(
            color: theme.dividerColor.withValues(alpha: 0.1),
            width: 1,
          ),
        ),
      ),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 12),
        itemCount: searchSidebarCategories.length,
        itemBuilder: (context, index) {
          final category = searchSidebarCategories[index];
          final categoryBackendName = category.backendName ?? category.name;
          final isSelected = _selectedCategory == categoryBackendName;
          
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
            child: InkWell(
              onTap: () {
                setState(() {
                  _selectedCategory = categoryBackendName;
                });
                HapticFeedback.lightImpact();
              },
              borderRadius: BorderRadius.circular(16),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeInOut,
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  color: isSelected 
                      ? AppColors.primary.withValues(alpha: 0.1) 
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      padding: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isSelected 
                              ? AppColors.primary 
                              : theme.dividerColor.withValues(alpha: 0.1),
                          width: 1.5,
                        ),
                      ),
                      child: ClipOval(
                        child: category.imagePath != null
                            ? NetworkImageWidget(
                                imageUrl: category.imagePath!,
                                fit: BoxFit.cover,
                              )
                            : Container(
                                color: category.color.withValues(alpha: 0.1),
                                child: Icon(
                                  category.icon,
                                  color: category.color,
                                  size: 20,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      category.name,
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.labelSmall?.copyWith(
                        fontSize: 10,
                        color: isSelected ? AppColors.primary : AppColors.textSecondary,
                        fontWeight: isSelected ? FontWeight.w900 : FontWeight.w600,
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

  Widget _buildOffersGrid(BuildContext context, OffersLoaded state) {
    final filtered = OfferFilterUtils.apply(
      offers: _getCurrentSourceOffers(state),
      category: _selectedCategory,
      area: _currentArea,
      minDiscount: _minDiscount,
      sortBy: _sortBy,
    );

    if (filtered.isEmpty) {
      return _buildEmptyState(
        icon: Icons.local_offer_outlined,
        title: 'لا توجد عروض مطابقة',
        subtitle: 'جرّب تغيير التصنيف أو إعادة ضبط الفلاتر لتجد ما تبحث عنه.',
      );
    }

    return _buildResponsiveOffersGrid(context, filtered);
  }

  Widget _buildSearchResults(BuildContext context, OffersLoaded state) {
    final results = OfferFilterUtils.apply(
      offers: _getCurrentSourceOffers(state),
      category: _selectedCategory,
      area: _currentArea,
      minDiscount: _minDiscount,
      sortBy: _sortBy,
    );

    if (results.isEmpty) {
      return _buildEmptyState(
        icon: Icons.search_off_rounded,
        title: 'لم نعثر على نتائج',
        subtitle: 'جرّب كلمات مختلفة أو خفّف الفلاتر الحالية للحصول على نتائج أفضل.',
      );
    }

    return _buildResponsiveOffersGrid(context, results);
  }

  Widget _buildResponsiveOffersGrid(
    BuildContext context,
    List<OfferEntity> offers,
  ) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        final crossAxisCount = width >= 920
            ? 4
            : width >= 680
                 ? 3
                 : 2;
        final childAspectRatio = crossAxisCount >= 4
            ? 0.8
            : crossAxisCount == 3
                ? 0.75
                : 0.67;

        return GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: childAspectRatio,
          ),
          itemCount: offers.length,
          itemBuilder: (context, index) {
            final offer = offers[index];
            return OfferCard(
              offer: offer,
              isWide: true,
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => OfferDetailPage(offer: offer),
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
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
              child: Icon(
                icon,
                size: 64,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w900,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
