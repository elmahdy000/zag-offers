import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/category_utils.dart';
import '../../../../core/widgets/network_image_widget.dart';
import '../../../../injection_container.dart';
import '../../../auth/data/datasources/auth_local_data_source.dart';
import '../../../coupons/presentation/bloc/coupons_bloc.dart';
import '../../../coupons/presentation/bloc/coupons_event.dart';
import '../../../coupons/presentation/bloc/coupons_state.dart';
import '../../../reviews/presentation/bloc/reviews_bloc.dart';
import '../../domain/entities/offer_entity.dart';
import '../widgets/favorite_button.dart';
import '../../../favorites/presentation/bloc/favorites_bloc.dart';
import 'store_detail_page.dart';

class OfferDetailPage extends StatefulWidget {
  final OfferEntity offer;

  const OfferDetailPage({super.key, required this.offer});

  @override
  State<OfferDetailPage> createState() => _OfferDetailPageState();
}

class _OfferDetailPageState extends State<OfferDetailPage> {
  TextTheme get textTheme => Theme.of(context).textTheme;
  late final Future<bool> _canGenerateCouponFuture;
  late final ReviewsBloc _reviewsBloc;
  late final CouponsBloc _couponsBloc;
  late final TextEditingController _commentController;
  int _selectedImageIndex = 0;
  late final PageController _pageController;

  List<String> get _allImages {
    final images = widget.offer.images ?? [];
    if (images.isEmpty && widget.offer.image != null) {
      return [widget.offer.image!];
    }
    return images;
  }

  @override
  void initState() {
    super.initState();
    _reviewsBloc = sl<ReviewsBloc>()..add(FetchStoreReviews(widget.offer.store.id));
    _couponsBloc = sl<CouponsBloc>();
    _commentController = TextEditingController();
    _canGenerateCouponFuture = _canGenerateCoupon();
    _pageController = PageController(initialPage: _selectedImageIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    _commentController.dispose();
    _reviewsBloc.close();
    _couponsBloc.close();
    super.dispose();
  }

  Future<bool> _canGenerateCoupon() async {
    final role = await sl<AuthLocalDataSource>().getUserRole();
    return role == 'CUSTOMER';
  }

  void _shareOffer() {
    final discountText = widget.offer.discount.isNotEmpty
        ? widget.offer.discount
        : '${widget.offer.discountPercentage.toInt()}%';
    SharePlus.instance.share(
      ShareParams(
        text:
            'شاهد هذا العرض من ${widget.offer.store.name}\n'
            '${widget.offer.title}\n'
            'الخصم: $discountText',
      ),
    );
  }

  Future<void> _copyCouponCode(
    BuildContext context,
    String code,
  ) async {
    final messenger = ScaffoldMessenger.of(context);
    await Clipboard.setData(ClipboardData(text: code));
    if (!mounted) return;
    messenger.showSnackBar(
      const SnackBar(
        content: Text('تم نسخ الكود'),
        backgroundColor: Colors.green,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final usageCount = (widget.offer.id.hashCode % 150) + 40;

    return MultiBlocProvider(
      providers: [
        BlocProvider.value(value: _couponsBloc),
        BlocProvider.value(value: _reviewsBloc),
      ],
      child: MultiBlocListener(
        listeners: [
          BlocListener<CouponsBloc, CouponsState>(listener: _onCouponStateChange),
          BlocListener<ReviewsBloc, ReviewsState>(
            listener: (context, state) {
              if (state is ReviewActionSuccess) {
                _reviewsBloc.add(FetchStoreReviews(widget.offer.store.id));
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('تمت إضافة تقييمك بنجاح'),
                    backgroundColor: Colors.green,
                  ),
                );
              }
              if (state is ReviewsError) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(state.message),
                    backgroundColor: AppColors.error,
                  ),
                );
              }
            },
          ),
          BlocListener<FavoritesBloc, FavoritesState>(
            listener: (context, state) {
              if (state is FavoritesError) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(state.message),
                    backgroundColor: AppColors.error,
                  ),
                );
              }
            },
          ),
        ],
        child: Scaffold(
          body: Stack(
            children: [
              CustomScrollView(
                physics: const BouncingScrollPhysics(),
                slivers: [
                  _buildSliverAppBar(),
                  _buildContentSection(usageCount),
                ],
              ),
              _buildStickyActionArea(usageCount),
            ],
          ),
        ),
      ),
    );
  }

  void _onCouponStateChange(BuildContext context, CouponsState state) {
    if (state is CouponsError) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(state.message),
          backgroundColor: AppColors.error,
        ),
      );
    }
    if (state is CouponGeneratedSuccess) {
      final usageCount = (widget.offer.id.hashCode % 150) + 40;
      _showCouponDialog(context, state.coupon.code, usageCount);
    }
  }

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      expandedHeight: 350,
      pinned: true,
      stretch: true,
      backgroundColor: AppColors.primary,
      leading: _buildCircleIconButton(
        icon: Icons.arrow_back_ios_new_rounded,
        onPressed: () => Navigator.pop(context),
      ),
      actions: [
        FavoriteButton(offerId: widget.offer.id),
        const SizedBox(width: 8),
        _buildCircleIconButton(
          icon: Icons.share_rounded,
          onPressed: _shareOffer,
        ),
        const SizedBox(width: 8),
      ],
      flexibleSpace: FlexibleSpaceBar(
        stretchModes: const [StretchMode.zoomBackground],
        background: _buildAppBarBackground(),
      ),
    );
  }

  Widget _buildCircleIconButton({
    required IconData icon,
    required VoidCallback onPressed,
  }) {
    final theme = Theme.of(context);
    return Container(
      margin: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: theme.cardColor,
        shape: BoxShape.circle,
        border: Border.all(color: theme.dividerColor.withValues(alpha: 0.1)),
      ),
      child: IconButton(
        icon: Icon(icon, size: 18, color: theme.iconTheme.color),
        onPressed: onPressed,
      ),
    );
  }

  Widget _buildAppBarBackground() {
    final images = _allImages;

    return Stack(
      fit: StackFit.expand,
      children: [
        PageView.builder(
          controller: _pageController,
          itemCount: images.length,
          onPageChanged: (index) {
            setState(() => _selectedImageIndex = index);
          },
          itemBuilder: (context, index) {
            return GestureDetector(
              onTap: () => _showFullScreenImage(context, images, index),
              child: NetworkImageWidget(
                imageUrl: images[index],
                fit: BoxFit.cover,
              ),
            );
          },
        ),
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.black45,
                Colors.transparent,
                Colors.black45,
              ],
            ),
          ),
        ),
        if (images.length > 1)
          Positioned(
            bottom: 45,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                images.length,
                (index) => AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  height: 6,
                  width: _selectedImageIndex == index ? 24 : 6,
                  decoration: BoxDecoration(
                    color: _selectedImageIndex == index ? AppColors.primary : Colors.white60,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }

  void _showFullScreenImage(BuildContext context, List<String> images, int initialIndex) {
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
          body: Center(
            child: InteractiveViewer(
              child: NetworkImageWidget(
                imageUrl: images[initialIndex],
                fit: BoxFit.contain,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContentSection(int usageCount) {
    final theme = Theme.of(context);
    return SliverToBoxAdapter(
      child: Transform.translate(
        offset: const Offset(0, -30),
        child: Container(
          decoration: BoxDecoration(
            color: theme.scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          ),
          padding: const EdgeInsets.fromLTRB(24, 32, 24, 140),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_allImages.length > 1) _buildThumbnailsRow(),
              if (_allImages.length > 1) const SizedBox(height: 24),
              _buildStatsRow(usageCount),
              const SizedBox(height: 24),
              _buildTitleSection(),
              const SizedBox(height: 20),
              _buildStoreCard(),
              const SizedBox(height: 32),
              _buildDescriptionSection(),
              const SizedBox(height: 24),
              _buildExpirySection(),
              const SizedBox(height: 32),
              _buildReviewsSection(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatsRow(int usageCount) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: AppColors.primary,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.25),
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Text(
            'خصم ${widget.offer.discountPercentage.toInt()}%',
            style: textTheme.labelLarge?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
        Row(
          children: [
            const Icon(Icons.flash_on_rounded, color: Colors.orange, size: 18),
            const SizedBox(width: 4),
            Text(
              '$usageCount مستفيد من العرض',
              style: textTheme.labelMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildTitleSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.offer.title,
          style: textTheme.headlineLarge?.copyWith(
            fontWeight: FontWeight.w900,
            height: 1.3,
          ),
        ),
        if (widget.offer.oldPrice != null || widget.offer.newPrice != null) ...[
          const SizedBox(height: 8),
          Row(
            children: [
              if (widget.offer.newPrice != null)
                Text(
                  '${widget.offer.newPrice} ج.م',
                  style: textTheme.headlineSmall?.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              if (widget.offer.oldPrice != null) ...[
                const SizedBox(width: 12),
                Text(
                  '${widget.offer.oldPrice} ج.م',
                  style: textTheme.bodyMedium?.copyWith(
                    color: textTheme.bodySmall?.color?.withValues(alpha: 0.6),
                    decoration: TextDecoration.lineThrough,
                  ),
                ),
              ],
            ],
          ),
        ],
      ],
    );
  }

  Widget _buildStoreCard() {
    final theme = Theme.of(context);
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => StoreDetailPage(store: widget.offer.store),
        ),
      ),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: theme.cardColor,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: theme.dividerColor.withValues(alpha: 0.1)),
        ),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: theme.scaffoldBackgroundColor,
                shape: BoxShape.circle,
                border: Border.all(color: theme.dividerColor.withValues(alpha: 0.05)),
              ),
              child: Icon(
                CategoryUtils.getIcon(widget.offer.store.category),
                color: AppColors.primary,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.offer.store.name,
                    style: textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    widget.offer.store.area,
                    style: textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios_rounded,
              size: 16,
              color: theme.iconTheme.color?.withValues(alpha: 0.5),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDescriptionSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'عن هذا العرض',
          style: textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900),
        ),
        const SizedBox(height: 12),
        Text(
          widget.offer.description ??
              'استمتع بخصم مميز لفترة محدودة في ${widget.offer.store.name}.',
          style: textTheme.bodyMedium?.copyWith(height: 1.7),
        ),
      ],
    );
  }

  Widget _buildExpirySection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.error.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.error.withValues(alpha: 0.15)),
      ),
      child: Row(
        children: [
          const Icon(Icons.timer_outlined, color: AppColors.error, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'صالح حتى: ${DateFormat('yyyy-MM-dd').format(widget.offer.expiryDate)}',
              style: textTheme.labelLarge?.copyWith(
                color: AppColors.error,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStickyActionArea(int usageCount) {
    return Positioned(
      bottom: 20,
      left: 20,
      right: 20,
      child: FutureBuilder<bool>(
        future: _canGenerateCouponFuture,
        builder: (context, snapshot) {
          final canGenerate = snapshot.data ?? false;
          return BlocBuilder<CouponsBloc, CouponsState>(
            builder: (context, state) {
              return Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    height: 64,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      boxShadow: [
                        BoxShadow(
                          color: (canGenerate ? AppColors.primary : Colors.black).withValues(alpha: 0.2),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: ElevatedButton(
                      onPressed: (state is CouponsLoading || !canGenerate)
                          ? null
                          : () => _couponsBloc.add(
                                GenerateCouponRequested(widget.offer.id),
                              ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor:
                            canGenerate ? AppColors.primary : Theme.of(context).disabledColor,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                        elevation: 0,
                      ),
                      child: state is CouponsLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(
                                  Icons.confirmation_num_rounded,
                                  color: Colors.white,
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  canGenerate
                                      ? 'احصل على العرض الآن'
                                      : 'متاح للعملاء فقط',
                                  style: textTheme.titleLarge?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ),
                  if (!canGenerate) ...[
                    const SizedBox(height: 8),
                    Text(
                      'سجّل بحساب عميل للحصول على كوبون هذا العرض',
                      textAlign: TextAlign.center,
                      style: textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ],
              );
            },
          );
        },
      ),
    );
  }

  void _showCouponDialog(BuildContext context, String code, int usageCount) {
    final theme = Theme.of(context);
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: theme.cardColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        content: SizedBox(
          width: MediaQuery.of(dialogContext).size.width * 0.85,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.people_alt_rounded,
                    size: 14,
                    color: Colors.orange,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '$usageCount مستفيد من العرض',
                    style: theme.textTheme.labelSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const Icon(
                Icons.check_circle_rounded,
                color: AppColors.success,
                size: 72,
              ),
              const SizedBox(height: 20),
              Text(
                'تم الحصول على العرض بنجاح',
                style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                'يرجى إبراز الكود للتاجر للاستفادة من الخصم',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium,
              ),
              const SizedBox(height: 28),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: QrImageView(
                  data: code,
                  version: QrVersions.auto,
                  size: 160,
                  eyeStyle: const QrEyeStyle(
                    eyeShape: QrEyeShape.circle,
                    color: Colors.black,
                  ),
                  dataModuleStyle: const QrDataModuleStyle(
                    dataModuleShape: QrDataModuleShape.square,
                    color: Colors.black,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 14,
                ),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                ),
                child: Text(
                  code,
                  style: theme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                    letterSpacing: 4,
                  ),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => _copyCouponCode(dialogContext, code),
            child: const Text(
              'نسخ الكود',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text(
              'إغلاق',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildThumbnailsRow() {
    final images = _allImages;
    final theme = Theme.of(context);
    return SizedBox(
      height: 60,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: images.length,
        itemBuilder: (context, index) {
          final isSelected = _selectedImageIndex == index;
          return GestureDetector(
            onTap: () {
              setState(() => _selectedImageIndex = index);
              _pageController.animateToPage(
                index,
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeInOut,
              );
            },
            child: Container(
              width: 60,
              margin: const EdgeInsets.only(left: 12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isSelected ? AppColors.primary : theme.dividerColor.withValues(alpha: 0.15),
                  width: 2,
                ),
              ),
              clipBehavior: Clip.antiAlias,
              child: NetworkImageWidget(
                imageUrl: images[index],
                fit: BoxFit.cover,
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildReviewsSection() {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'آراء العملاء',
              style: textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900),
            ),
            TextButton(
              onPressed: _showAddReviewBottomSheet,
              child: Text(
                'أضف تقييمك',
                style: textTheme.labelLarge?.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        BlocBuilder<ReviewsBloc, ReviewsState>(
          builder: (context, state) {
            if (state is ReviewsLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state is ReviewsLoaded) {
              if (state.reviews.isEmpty) {
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 20),
                    child: Text(
                      'لا توجد تقييمات بعد. كن أول من يقيّم',
                      style: textTheme.bodyMedium,
                    ),
                  ),
                );
              }
              return ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: state.reviews.length,
                separatorBuilder: (context, index) =>
                    const SizedBox(height: 16),
                itemBuilder: (context, index) {
                  final review = state.reviews[index];
                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: theme.cardColor,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: theme.dividerColor.withValues(alpha: 0.1)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                review.customerName,
                                style: textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
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
                                      : theme.disabledColor.withValues(alpha: 0.3),
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (review.comment != null &&
                            review.comment!.trim().isNotEmpty) ...[
                          const SizedBox(height: 10),
                          Text(
                            review.comment!,
                            style: textTheme.bodySmall?.copyWith(height: 1.5),
                          ),
                        ],
                      ],
                    ),
                  );
                },
              );
            }
            return const SizedBox();
          },
        ),
      ],
    );
  }

  void _showAddReviewBottomSheet() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).cardColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (bottomSheetContext) => BlocProvider.value(
        value: _reviewsBloc,
        child: _AddReviewSheet(
          storeId: widget.offer.store.id,
          offerId: widget.offer.id,
          commentController: _commentController,
        ),
      ),
    );
  }
}

class _AddReviewSheet extends StatefulWidget {
  final String storeId;
  final String? offerId;
  final TextEditingController commentController;

  const _AddReviewSheet({
    required this.storeId,
    this.offerId,
    required this.commentController,
  });

  @override
  State<_AddReviewSheet> createState() => _AddReviewSheetState();
}

class _AddReviewSheetState extends State<_AddReviewSheet> {
  int _selectedRating = 5;

  @override
  void initState() {
    super.initState();
    widget.commentController.clear();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Padding(
      padding: EdgeInsets.fromLTRB(
        24,
        24,
        24,
        MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'ما رأيك في هذا العرض؟',
            style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              5,
              (i) => IconButton(
                onPressed: () => setState(() => _selectedRating = i + 1),
                icon: Icon(
                  Icons.star_rounded,
                  size: 36,
                  color: i < _selectedRating ? Colors.amber : theme.disabledColor.withValues(alpha: 0.3),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: widget.commentController,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: 'اكتب تجربتك هنا (اختياري)',
              hintStyle: theme.textTheme.bodyMedium?.copyWith(
                color: theme.textTheme.bodySmall?.color?.withValues(alpha: 0.5),
              ),
              filled: true,
              fillColor: theme.scaffoldBackgroundColor,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: () {
                // Focus out to close keyboard before popping
                FocusManager.instance.primaryFocus?.unfocus();
                
                context.read<ReviewsBloc>().add(
                  AddReviewRequested(
                    storeId: widget.storeId,
                    offerId: widget.offerId,
                    rating: _selectedRating,
                    comment: widget.commentController.text.trim().isEmpty 
                        ? null 
                        : widget.commentController.text.trim(),
                  ),
                );
                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 0,
              ),
              child: const Text(
                'إرسال التقييم',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }
}