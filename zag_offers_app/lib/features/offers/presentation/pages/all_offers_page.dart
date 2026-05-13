import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:zag_offers_app/core/theme/app_colors.dart';
import 'package:zag_offers_app/core/widgets/network_image_widget.dart';
import 'package:zag_offers_app/features/offers/domain/entities/offer_entity.dart';
import 'package:zag_offers_app/features/offers/presentation/bloc/offers_bloc.dart';
import 'package:zag_offers_app/features/offers/presentation/bloc/offers_event.dart';
import 'package:zag_offers_app/features/offers/presentation/bloc/offers_state.dart';
import 'package:zag_offers_app/features/offers/presentation/constants/offer_categories.dart';
import 'package:zag_offers_app/features/offers/presentation/utils/offer_filter_utils.dart';
import 'package:zag_offers_app/features/offers/presentation/widgets/filter_bottom_sheet.dart';
import 'package:zag_offers_app/features/offers/presentation/widgets/offer_card.dart';

import 'offer_detail_page.dart';

class AllOffersPage extends StatefulWidget {
  final String? initialCategory;

  const AllOffersPage({super.key, this.initialCategory});

  @override
  State<AllOffersPage> createState() => _AllOffersPageState();
}

class _AllOffersPageState extends State<AllOffersPage> {
  late String _selectedCategory;
  final TextEditingController _searchController = TextEditingController();

  String _currentArea = 'الكل';
  double _minDiscount = 0;
  String _sortBy = 'newest';

  @override
  void initState() {
    super.initState();
    _selectedCategory = widget.initialCategory ?? 'الكل';
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<OffersBloc>().add(FetchAllOffers());
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query, BuildContext context) {
    final trimmed = query.trim();
    if (OfferFilterUtils.shouldRunSearch(trimmed)) {
      context.read<OffersBloc>().add(SearchOffers(trimmed));
    }
    setState(() {});
  }

  void _clearSearch(BuildContext context) {
    setState(() {
      _searchController.clear();
    });
    context.read<OffersBloc>().add(SearchOffers(''));
  }

  void _resetAllFilters(BuildContext context) {
    setState(() {
      _selectedCategory = 'الكل';
      _currentArea = 'الكل';
      _minDiscount = 0;
      _sortBy = 'newest';
    });
    _clearSearch(context);
  }

  List<OfferEntity> _getSourceOffers(OffersLoaded state) {
    if (_searchController.text.trim().isNotEmpty &&
        !OfferFilterUtils.shouldRunSearch(_searchController.text)) {
      return const <OfferEntity>[];
    }
    if (_searchController.text.trim().isNotEmpty) {
      return (state.searchResults ?? const <OfferEntity>[]).cast<OfferEntity>();
    }
    if (state.allOffers.isNotEmpty) {
      return state.allOffers;
    }
    return state.trendingOffers;
  }

  Future<void> _showFilterSheet() async {
    final loadedState = context.read<OffersBloc>().state;
    final sourceOffers = loadedState is OffersLoaded
        ? _getSourceOffers(loadedState)
        : const <OfferEntity>[];
    final availableAreas = OfferFilterUtils.extractAreas(
      sourceOffers
          .where((offer) =>
              _selectedCategory == 'الكل' ||
              offer.store.category == _selectedCategory)
          .toList(),
    );

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
      body: BlocBuilder<OffersBloc, OffersState>(
        builder: (context, state) {
          return CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 140,
                pinned: true,
                backgroundColor: AppColors.primary,
                flexibleSpace: FlexibleSpaceBar(
                  titlePadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 16,
                  ),
                  centerTitle: false,
                  title: Text(
                    'استكشف العروض',
                    style: theme.textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                        ),
                  ),
                ),
                actions: [
                  Stack(
                    children: [
                      IconButton(
                        icon: const Icon(
                          Icons.tune_rounded,
                          color: Colors.white,
                        ),
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
                              color: Colors.white,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(width: 8),
                ],
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          color: theme.cardColor,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: theme.dividerColor),
                        ),
                        child: TextField(
                          controller: _searchController,
                          onChanged: (val) => _onSearchChanged(val, context),
                          decoration: InputDecoration(
                            hintText: 'ابحث عن عرض أو محل...',
                            helperText: _searchController.text.isNotEmpty &&
                                    !OfferFilterUtils.shouldRunSearch(
                                      _searchController.text,
                                    )
                                ? 'اكتب 3 أحرف على الأقل لبدء البحث'
                                : null,
                            border: InputBorder.none,
                            icon: const Icon(
                              Icons.search,
                              color: AppColors.primary,
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
                      const SizedBox(height: 20),
                      SizedBox(
                        height: 90,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          physics: const BouncingScrollPhysics(),
                          itemCount: searchSidebarCategories.length,
                          itemBuilder: (context, index) {
                            final categoryItem = searchSidebarCategories[index];
                            final categoryBackendName = categoryItem.backendName ?? categoryItem.name;
                            final isSelected = _selectedCategory == categoryBackendName;
                            return Padding(
                              padding: const EdgeInsets.only(right: 16),
                              child: GestureDetector(
                                onTap: () {
                                  setState(() => _selectedCategory = categoryBackendName);
                                },
                                child: Column(
                                  children: [
                                    Container(
                                      width: 54,
                                      height: 54,
                                      padding: const EdgeInsets.all(2),
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        border: Border.all(
                                          color: isSelected ? AppColors.primary : Colors.transparent,
                                          width: 2,
                                        ),
                                      ),
                                      child: ClipOval(
                                        child: categoryItem.imagePath != null
                                            ? NetworkImageWidget(
                                                imageUrl: categoryItem.imagePath!,
                                                fit: BoxFit.cover,
                                              )
                                            : Container(
                                                color: categoryItem.color.withValues(alpha: 0.1),
                                                child: Icon(
                                                  categoryItem.icon,
                                                  color: categoryItem.color,
                                                  size: 20,
                                                ),
                                              ),
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      categoryItem.name,
                                      style: theme.textTheme.labelSmall?.copyWith(
                                            color: isSelected ? AppColors.primary : AppColors.textSecondary,
                                            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                            fontSize: 11,
                                          ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (state is OffersLoaded)
                _buildOffersGrid(context, state)
              else if (state is OffersLoading)
                const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (state is OffersError)
                _buildErrorState(context, state.message)
            ],
          );
        },
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, String message) {
    final isConnectionError = message.toLowerCase().contains('connection') || 
                             message.toLowerCase().contains('network') ||
                             message.toLowerCase().contains('socket');

    return SliverFillRemaining(
      hasScrollBody: false,
      child: Center(
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
                  onPressed: () => context.read<OffersBloc>().add(FetchAllOffers()),
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
      ),
    );
  }

  Widget _buildOffersGrid(BuildContext context, OffersLoaded state) {
    final filtered = OfferFilterUtils.apply(
      offers: _getSourceOffers(state),
      category: _selectedCategory,
      area: _currentArea,
      minDiscount: _minDiscount,
      sortBy: _sortBy,
    );

    if (filtered.isEmpty) {
      return SliverFillRemaining(
        hasScrollBody: false,
        child: Center(
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
                  'لا توجد عروض',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'لا توجد نتائج تطابق الفلاتر المختارة حالياً. جرّب تغيير التصنيف أو إعادة ضبط الفلاتر.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 24),
                TextButton(
                  onPressed: () => _resetAllFilters(context),
                  child: const Text(
                    'إعادة تعيين الكل',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.all(16),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 16,
          crossAxisSpacing: 16,
          childAspectRatio: 0.67,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final offer = filtered[index];
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
          childCount: filtered.length,
        ),
      ),
    );
  }
}
