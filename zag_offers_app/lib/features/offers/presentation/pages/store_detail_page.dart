import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/widgets/network_image_widget.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../injection_container.dart';
import '../../../reviews/presentation/bloc/reviews_bloc.dart';
import '../../domain/entities/store_entity.dart';
import '../bloc/offers_bloc.dart';
import '../bloc/offers_event.dart';
import '../bloc/offers_state.dart';
import 'offer_detail_page.dart';

class StoreDetailPage extends StatefulWidget {
  final StoreEntity store;

  const StoreDetailPage({super.key, required this.store});

  @override
  State<StoreDetailPage> createState() => _StoreDetailPageState();
}

class _StoreDetailPageState extends State<StoreDetailPage> {
  late final OffersBloc _offersBloc;
  late final ReviewsBloc _reviewsBloc;

  @override
  void initState() {
    super.initState();
    _offersBloc = sl<OffersBloc>()..add(FetchStoreOffers(widget.store.id));
    _reviewsBloc = sl<ReviewsBloc>()..add(FetchStoreReviews(widget.store.id));
  }

  @override
  void dispose() {
    _offersBloc.close();
    _reviewsBloc.close();
    super.dispose();
  }

  Future<void> _launchUrl(BuildContext context, String url) async {
    final uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('تعذر فتح التطبيق المطلوب على هذا الجهاز'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  void _showFullScreenGallery(BuildContext context, int initialIndex) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => Scaffold(
          backgroundColor: Colors.black,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.close, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
          ),
          body: PageView.builder(
            itemCount: widget.store.images!.length,
            controller: PageController(initialPage: initialIndex),
            itemBuilder: (context, index) {
              return Center(
                child: InteractiveViewer(
                  child: NetworkImageWidget(
                    imageUrl: widget.store.images![index],
                    fit: BoxFit.contain,
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider.value(value: _offersBloc),
        BlocProvider.value(value: _reviewsBloc),
      ],
      child: Scaffold(
        body: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            _buildSliverAppBar(context),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildStoreHeader(context),
                    const SizedBox(height: 24),
                    _buildContactButtons(context),
                    if (widget.store.images != null && widget.store.images!.isNotEmpty) ...[
                      const SizedBox(height: 32),
                      Text(
                        'معرض الصور',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        height: 120,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: widget.store.images!.length,
                          itemBuilder: (context, index) {
                            return GestureDetector(
                              onTap: () {
                                HapticFeedback.lightImpact();
                                _showFullScreenGallery(context, index);
                              },
                              child: Container(
                                width: 160,
                                margin: const EdgeInsets.only(left: 12),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(16),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.1),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                clipBehavior: Clip.antiAlias,
                                child: NetworkImageWidget(
                                  imageUrl: widget.store.images![index],
                                  fit: BoxFit.cover,
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                    const SizedBox(height: 40),
                    Text(
                      'العروض المتاحة',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
            _buildOffersList(context),
            const SliverToBoxAdapter(child: SizedBox(height: 40)),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Text(
                  'آراء العملاء',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            _buildReviewsList(context),
            const SliverToBoxAdapter(child: SizedBox(height: 80)),
          ],
        ),
      ),
    );
  }

  Widget _buildSliverAppBar(BuildContext context) {
    return SliverAppBar(
      expandedHeight: 280,
      pinned: true,
      stretch: true,
      backgroundColor: AppColors.primary,
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            if (widget.store.coverImage != null)
              NetworkImageWidget(
                imageUrl: widget.store.coverImage!,
                fit: BoxFit.cover,
              )
            else
              Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.primary, Color(0xFFFF9800)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
              ),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black26,
                    Colors.transparent,
                    Colors.black54,
                  ],
                ),
              ),
            ),
            Positioned(
              bottom: 20,
              left: 24,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Theme.of(context).scaffoldBackgroundColor,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.2),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: NetworkImageWidget(
                  imageUrl: widget.store.logo,
                  width: 90,
                  height: 90,
                  borderRadius: BorderRadius.circular(45),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStoreHeader(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.store.name,
          style: theme.textTheme.displaySmall?.copyWith(
            fontWeight: FontWeight.w900,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                widget.store.category ?? 'متجر',
                style: theme.textTheme.labelMedium?.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Icon(
              Icons.location_on_rounded,
              size: 18,
              color: theme.textTheme.bodyMedium?.color?.withValues(alpha: 0.6),
            ),
            const SizedBox(width: 4),
            Text(
              widget.store.area,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildContactButtons(BuildContext context) {
    return Row(
      children: [
        if (widget.store.phone != null)
          Expanded(
            child: _buildActionButton(
              context,
              icon: Icons.call_rounded,
              label: 'اتصال',
              color: Colors.blue,
              onTap: () {
                HapticFeedback.lightImpact();
                _launchUrl(context, 'tel:${widget.store.phone}');
              },
            ),
          ),
        if (widget.store.phone != null && widget.store.whatsapp != null)
          const SizedBox(width: 12),
        if (widget.store.whatsapp != null)
          Expanded(
            child: _buildActionButton(
              context,
              icon: Icons.chat_bubble_rounded,
              label: 'واتساب',
              color: Colors.green,
              onTap: () {
                HapticFeedback.lightImpact();
                _launchUrl(
                  context,
                  'https://wa.me/${widget.store.whatsapp}',
                );
              },
            ),
          ),
      ],
    );
  }

  Widget _buildActionButton(BuildContext context, {
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 8),
            Text(
              label,
              style: Theme.of(context).textTheme.labelLarge?.copyWith(color: color, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOffersList(BuildContext context) {
    return BlocBuilder<OffersBloc, OffersState>(
      builder: (context, state) {
        if (state is StoreOffersLoading) {
          return const SliverToBoxAdapter(
            child: Center(child: CircularProgressIndicator()),
          );
        }
        if (state is StoreOffersLoaded) {
          if (state.offers.isEmpty) {
            return const SliverToBoxAdapter(
              child: Center(child: Text('لا توجد عروض حالياً')),
            );
          }
          return SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) => _buildOfferCard(context, state.offers[index]),
                childCount: state.offers.length,
              ),
            ),
          );
        }
        return const SliverToBoxAdapter(child: SizedBox());
      },
    );
  }

  Widget _buildOfferCard(BuildContext context, dynamic offer) {
    final theme = Theme.of(context);
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: theme.dividerColor),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(12),
        leading: SizedBox(
          width: 56,
          height: 56,
          child: NetworkImageWidget(
            imageUrl: offer.image,
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        title: Text(
          offer.title,
          style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
        ),
        subtitle: Text(
          'خصم ${offer.discountPercentage.toInt()}%',
          style: theme.textTheme.labelMedium?.copyWith(
            color: AppColors.success,
            fontWeight: FontWeight.bold,
          ),
        ),
        trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
        onTap: () {
          HapticFeedback.lightImpact();
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => OfferDetailPage(offer: offer),
            ),
          );
        },
      ),
    );
  }

  Widget _buildReviewsList(BuildContext context) {
    final theme = Theme.of(context);
    return BlocBuilder<ReviewsBloc, ReviewsState>(
      builder: (context, state) {
        if (state is ReviewsLoading) {
          return const SliverToBoxAdapter(
            child: Center(child: CircularProgressIndicator()),
          );
        }
        if (state is ReviewsLoaded) {
          if (state.reviews.isEmpty) {
            return const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text('كن أول من يقيم هذا المتجر!'),
              ),
            );
          }
          return SliverPadding(
            padding: const EdgeInsets.all(24),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final review = state.reviews[index];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: theme.cardColor,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: theme.dividerColor),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              review.customerName,
                              style: theme.textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Row(
                              children: List.generate(
                                5,
                                (i) => Icon(
                                  Icons.star_rounded,
                                  size: 16,
                                  color: i < review.rating
                                      ? Colors.amber
                                      : theme.dividerColor,
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (review.comment != null) ...[
                          const SizedBox(height: 8),
                          Text(
                            review.comment!,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ],
                    ),
                  );
                },
                childCount: state.reviews.length,
              ),
            ),
          );
        }
        return const SliverToBoxAdapter(child: SizedBox());
      },
    );
  }
}
