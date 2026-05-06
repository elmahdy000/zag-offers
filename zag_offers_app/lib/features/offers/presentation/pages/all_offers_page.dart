import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:zag_offers_app/core/theme/app_colors.dart';
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
    return Scaffold(
      backgroundColor: Colors.white,
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
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
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
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(20),
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
                                      color: Colors.grey,
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
                            final isSelected = _selectedCategory == categoryItem.name;
                            return Padding(
                              padding: const EdgeInsets.only(right: 16),
                              child: GestureDetector(
                                onTap: () {
                                  setState(() => _selectedCategory = categoryItem.name);
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
                                        child: categoryItem.image != null
                                            ? Image.network(
                                                categoryItem.image!,
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
                                    const SizedBox(height: 6),
                                    Text(
                                      categoryItem.name,
                                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                            color: isSelected ? AppColors.primary : AppColors.textPrimary,
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
                SliverFillRemaining(
                  child: Center(child: Text(state.message)),
                ),
            ],
          );
        },
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
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.local_offer_outlined,
                size: 64,
                color: Colors.grey[300],
              ),
              const SizedBox(height: 16),
              const Text(
                'لا توجد نتائج تطابق الفلاتر المختارة',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => _resetAllFilters(context),
                child: const Text('إعادة تعيين الكل'),
              ),
            ],
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
          childAspectRatio: 0.68,
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
