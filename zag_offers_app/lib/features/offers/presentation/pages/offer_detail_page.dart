import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart' hide TextDirection;
import 'package:share_plus/share_plus.dart' show SharePlus, ShareParams;
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/network_image_widget.dart';
import '../../../../core/utils/snackbar_utils.dart';
import '../../../../core/services/socket_service.dart';
import '../../../../injection_container.dart';
import '../../../auth/data/datasources/auth_local_data_source.dart';
import '../../../auth/presentation/pages/login_page.dart';
import '../../../coupons/presentation/bloc/coupons_bloc.dart';
import '../../../coupons/presentation/bloc/coupons_event.dart';
import '../../../coupons/presentation/bloc/coupons_state.dart';
import '../../../reviews/presentation/bloc/reviews_bloc.dart';
import '../../domain/entities/offer_entity.dart';
import '../widgets/favorite_button.dart';
import '../../../favorites/presentation/bloc/favorites_bloc.dart';
import 'package:zag_offers_app/core/constants/app_strings.dart';
import 'package:google_fonts/google_fonts.dart';
import 'store_detail_page.dart';
import '../../data/datasources/offers_remote_data_source.dart';
import '../widgets/flash_sale_badge.dart';
import '../../../../core/widgets/coupon_celebration_dialog.dart';
import '../../../../core/widgets/bouncy_tap.dart';
import '../../../coupons/domain/entities/coupon_entity.dart';
import '../../../home/presentation/pages/main_screen.dart';
import '../../../../core/utils/navigation_service.dart';

class OfferDetailPage extends StatefulWidget {
  final OfferEntity offer;

  const OfferDetailPage({super.key, required this.offer});

  @override
  State<OfferDetailPage> createState() => _OfferDetailPageState();
}

class _OfferDetailPageState extends State<OfferDetailPage> {
  late final Future<bool> _canGenerateCouponFuture;
  late final ReviewsBloc _reviewsBloc;
  late final CouponsBloc _couponsBloc;
  late final TextEditingController _commentController;
  int _selectedImageIndex = 0;
  late final PageController _pageController;
  StreamSubscription<Map<String, dynamic>>? _reviewReplySubscription;
  Timer? _flashSaleTimer;
  List<CouponEntity> _userCoupons = [];

  CouponEntity? get _existingCoupon {
    for (final c in _userCoupons) {
      if (c.offer.id == widget.offer.id) return c;
    }
    return null;
  }

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
    _reviewsBloc = sl<ReviewsBloc>()
      ..add(FetchStoreReviews(widget.offer.store.id));
    _couponsBloc = sl<CouponsBloc>()..add(FetchUserCoupons());
    _commentController = TextEditingController();
    _canGenerateCouponFuture = _canGenerateCoupon();
    _pageController = PageController(initialPage: _selectedImageIndex);
    _reviewReplySubscription = sl<SocketService>().onReviewReply.listen((data) {
      final reviewId = data['reviewId']?.toString();
      final merchantReply = data['merchantReply']?.toString();
      final replyCreatedAtStr = data['replyCreatedAt']?.toString();
      if (reviewId != null &&
          merchantReply != null &&
          replyCreatedAtStr != null) {
        final replyCreatedAt =
            DateTime.tryParse(replyCreatedAtStr) ?? DateTime.now();
        _reviewsBloc.add(ReviewReplyReceived(
          reviewId: reviewId,
          merchantReply: merchantReply,
          replyCreatedAt: replyCreatedAt,
        ));
      }
    });

    // Fire and forget: Fetch the offer details from backend to increment the view counter
    // and log the analytics event.
    _recordView();

    if (widget.offer.isFlashSale && widget.offer.flashSaleEndsAt != null) {
      if (widget.offer.flashSaleEndsAt!.isAfter(DateTime.now())) {
        _flashSaleTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
          if (widget.offer.flashSaleEndsAt!.isBefore(DateTime.now())) {
            timer.cancel();
            if (mounted) setState(() {});
          }
        });
      }
    }
  }

  void _recordView() {
    try {
      sl<OffersRemoteDataSource>().getOfferById(widget.offer.id);
    } catch (_) {
      // Ignore errors, we just want to trigger the backend view increment
    }
  }

  @override
  void dispose() {
    _flashSaleTimer?.cancel();
    _pageController.dispose();
    _commentController.dispose();
    _reviewReplySubscription?.cancel();
    super.dispose();
  }

  Future<bool> _canGenerateCoupon() async {
    final role = await sl<AuthLocalDataSource>().getUserRole();
    return role == 'CUSTOMER';
  }

  void _shareOffer() {
    HapticFeedback.lightImpact();
    final discountText = widget.offer.discount.isNotEmpty
        ? (widget.offer.discount.startsWith('خصم')
            ? widget.offer.discount
            : 'خصم ${widget.offer.discount}')
        : 'خصم ${widget.offer.discountPercentage.toInt()}%';
    SharePlus.instance.share(
      ShareParams(
        text: '${AppStrings.shareOfferText} ${widget.offer.store.name}\n'
            '${widget.offer.title}\n'
            '${AppStrings.discount} $discountText',
      ),
    );
  }

  Future<void> _openExternalMap() async {
    final store = widget.offer.store;
    Uri? uri;
    if (store.locationUrl != null && store.locationUrl!.trim().isNotEmpty) {
      uri = Uri.tryParse(store.locationUrl!.trim());
    } else if (store.latitude != null &&
        store.longitude != null &&
        store.latitude != 0 &&
        store.longitude != 0) {
      uri = Uri.parse(
          'https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}');
    } else {
      final queryText = '${store.name}, ${store.address ?? store.area}, الزقازيق';
      uri = Uri.parse(
          'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(queryText)}');
    }
    if (uri != null) {
      try {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } catch (_) {
        if (mounted) {
          SnackBarUtils.showError(context, 'تعذر فتح تطبيق الخريطة');
        }
      }
    }
  }

  Future<void> _callStore() async {
    final phone = widget.offer.store.phone;
    if (phone != null && phone.isNotEmpty) {
      final clean = phone.replaceAll(RegExp(r'\s+'), '');
      final uri = Uri.parse('tel:$clean');
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      }
    }
  }

  Future<void> _whatsappStore() async {
    final whatsapp = widget.offer.store.whatsapp ?? widget.offer.store.phone;
    if (whatsapp != null && whatsapp.isNotEmpty) {
      var clean = whatsapp.replaceAll(RegExp(r'\s+'), '').replaceAll('+', '');
      if (clean.startsWith('01')) clean = '20$clean';
      final uri = Uri.parse('https://wa.me/$clean');
      try {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } catch (_) {
        if (mounted) {
          SnackBarUtils.showError(context, 'تعذر فتح تطبيق واتساب');
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    const usageCount = 'الكثير';

    return MultiBlocProvider(
      providers: [
        BlocProvider.value(value: _couponsBloc),
        BlocProvider.value(value: _reviewsBloc),
      ],
      child: MultiBlocListener(
        listeners: [
          BlocListener<CouponsBloc, CouponsState>(
            listenWhen: (_, current) =>
                current is CouponsError ||
                current is CouponGeneratedSuccess ||
                current is UserCouponsLoaded,
            listener: _onCouponStateChange,
          ),
          BlocListener<ReviewsBloc, ReviewsState>(
            listenWhen: (_, current) =>
                current is ReviewActionSuccess || current is ReviewsError,
            listener: (context, state) {
              if (state is ReviewActionSuccess) {
                _reviewsBloc.add(FetchStoreReviews(widget.offer.store.id));
                SnackBarUtils.showSuccess(
                    context, AppStrings.reviewAddedSuccess);
              }
              if (state is ReviewsError) {
                SnackBarUtils.showError(context, state.message);
              }
            },
          ),
          BlocListener<FavoritesBloc, FavoritesState>(
            listenWhen: (_, current) => current is FavoritesError,
            listener: (context, state) {
              if (state is FavoritesError) {
                SnackBarUtils.showError(context, state.message);
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
    if (state is UserCouponsLoaded) {
      if (mounted) {
        setState(() => _userCoupons = state.coupons);
      }
    }
    if (state is CouponsError) {
      SnackBarUtils.showError(context, state.message);
    }
    if (state is CouponGeneratedSuccess) {
      if (mounted) {
        setState(() {
          _userCoupons.removeWhere((c) => c.offer.id == widget.offer.id);
          _userCoupons.insert(0, state.coupon);
        });
      }
      _showCouponDialog(context, state.coupon.code, status: state.coupon.status);
    }
  }

  Widget _buildSliverAppBar() {
    final hasImages = _allImages.isNotEmpty;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return SliverAppBar(
      expandedHeight: hasImages ? 280 : 210,
      pinned: true,
      stretch: true,
      systemOverlayStyle: SystemUiOverlayStyle.light,
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFF131B2A),
      leading: _buildCircleIconButton(
        icon: Directionality.of(context) == TextDirection.rtl
            ? Icons.arrow_forward_ios_rounded
            : Icons.arrow_back_ios_new_rounded,
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
    final isDark = theme.brightness == Brightness.dark;
    return Container(
      margin: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: (isDark ? const Color(0xFF131B2A) : Colors.white)
            .withValues(alpha: 0.85),
        shape: BoxShape.circle,
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.15)
              : Colors.black.withValues(alpha: 0.08),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.18),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: IconButton(
        icon: Icon(
          icon,
          size: 17,
          color: isDark ? Colors.white : AppColors.textPrimary,
        ),
        onPressed: onPressed,
      ),
    );
  }

  Widget _buildAppBarBackground() {
    final images = _allImages;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    if (images.isEmpty) {
      final initial = widget.offer.store.name.trim().isNotEmpty
          ? widget.offer.store.name.trim().characters.first
          : 'Z';

      return Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: isDark
                ? [
                    const Color(0xFF1E293B),
                    const Color(0xFF0F172A),
                  ]
                : [
                    const Color(0xFF131B2A),
                    const Color(0xFF1E293B),
                  ],
          ),
        ),
        child: SafeArea(
          bottom: false,
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(height: 16),
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.4),
                      width: 2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.25),
                        blurRadius: 18,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Center(
                    child: widget.offer.store.logo != null &&
                            widget.offer.store.logo!.isNotEmpty
                        ? ClipOval(
                            child: NetworkImageWidget(
                              imageUrl: widget.offer.store.logo!,
                              width: 72,
                              height: 72,
                              fit: BoxFit.cover,
                            ),
                          )
                        : Text(
                            initial,
                            style: GoogleFonts.cairo(
                              color: AppColors.primary,
                              fontSize: 32,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  widget.offer.store.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  'الزقازيق • ${widget.offer.store.area}',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.7),
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

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
              child: Stack(
                fit: StackFit.expand,
                children: [
                  index == 0
                      ? Hero(
                          tag: 'offer_image_${widget.offer.id}',
                          child: NetworkImageWidget(
                            imageUrl: images[index],
                            fit: BoxFit.cover,
                          ),
                        )
                      : NetworkImageWidget(
                          imageUrl: images[index],
                          fit: BoxFit.cover,
                        ),
                  if (widget.offer.isFlashSale &&
                      widget.offer.flashSaleEndsAt != null)
                    Positioned(
                      bottom: 16,
                      left: 16,
                      child:
                          FlashSaleBadge(endsAt: widget.offer.flashSaleEndsAt!),
                    ),
                ],
              ),
            );
          },
        ),
        const IgnorePointer(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black45,
                  Colors.transparent,
                  Colors.black54,
                ],
              ),
            ),
          ),
        ),
        if (images.length > 1)
          Positioned(
            bottom: 45,
            left: 0,
            right: 0,
            child: IgnorePointer(
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
                      color: _selectedImageIndex == index
                          ? AppColors.primary
                          : Colors.white60,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }

  void _showFullScreenImage(
      BuildContext context, List<String> images, int initialIndex) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) {
          int currentIndex = initialIndex;
          final pageCtrl = PageController(initialPage: initialIndex);
          return StatefulBuilder(
            builder: (context, setModalState) {
              return Scaffold(
                backgroundColor: Colors.black,
                appBar: AppBar(
                  backgroundColor: Colors.transparent,
                  elevation: 0,
                  systemOverlayStyle: SystemUiOverlayStyle.light,
                  title: images.length > 1
                      ? Text(
                          '${currentIndex + 1} / ${images.length}',
                          textDirection: TextDirection.ltr,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                        )
                      : null,
                  centerTitle: true,
                  leading: IconButton(
                    icon: const Icon(Icons.close_rounded, color: Colors.white, size: 24),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
                body: PageView.builder(
                  controller: pageCtrl,
                  itemCount: images.length,
                  onPageChanged: (i) {
                    setModalState(() => currentIndex = i);
                    if (_pageController.hasClients) {
                      _pageController.jumpToPage(i);
                    }
                    setState(() => _selectedImageIndex = i);
                  },
                  itemBuilder: (context, idx) {
                    return InteractiveViewer(
                      minScale: 0.8,
                      maxScale: 4.0,
                      child: Center(
                        child: NetworkImageWidget(
                          imageUrl: images[idx],
                          fit: BoxFit.contain,
                        ),
                      ),
                    );
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildContentSection(String usageCount) {
    final theme = Theme.of(context);
    final bottomInset = MediaQuery.of(context).padding.bottom;

    return SliverToBoxAdapter(
      child: Transform.translate(
        offset: const Offset(0, -28),
        child: Container(
          decoration: BoxDecoration(
            color: theme.scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: EdgeInsets.fromLTRB(
            18,
            20,
            18,
            85 + bottomInset,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_allImages.length > 1) _buildThumbnailsRow(),
              if (_allImages.length > 1) const SizedBox(height: 14),
              _buildOfferHeaderHierarchy(usageCount),
              const SizedBox(height: 14),
              _buildStoreCard(),
              const SizedBox(height: 12),
              _buildStoreLocationCard(),
              const SizedBox(height: 16),
              _buildDescriptionSection(),
              if (widget.offer.terms != null &&
                  widget.offer.terms!.isNotEmpty) ...[
                const SizedBox(height: 14),
                _buildTermsSection(),
              ],
              const SizedBox(height: 14),
              _buildExpirySection(),
              const SizedBox(height: 18),
              _buildReviewsSection(),
            ],
          ),
        ),
      ),
    );
  }

  OfferPricingResult get _pricing => OfferPricingResult.compute(
        newPrice: widget.offer.newPrice,
        oldPrice: widget.offer.oldPrice,
        discountString: widget.offer.discount,
        discountPercentage: widget.offer.discountPercentage,
      );

  Widget _buildOfferHeaderHierarchy(String usageCount) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final pricing = _pricing;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 1. Top Meta: Prominent Discount Badge + Subtle Views
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            if (pricing.topDiscountBadge.isNotEmpty)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFF5722), Color(0xFFFF7043)],
                  ),
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.28),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.local_offer_rounded, color: Colors.white, size: 14),
                    const SizedBox(width: 5),
                    Text(
                      'خصم ${pricing.topDiscountBadge}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 12.5,
                      ),
                    ),
                  ],
                ),
              )
            else
              const SizedBox(),
            // Secondary metrics (Views & Usage)
            Row(
              children: [
                Icon(
                  Icons.remove_red_eye_outlined,
                  size: 15,
                  color: isDark ? Colors.grey.shade400 : AppColors.textSecondary,
                ),
                const SizedBox(width: 4),
                Text(
                  '${widget.offer.viewCount} مشاهدة',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: isDark ? Colors.grey.shade400 : AppColors.textSecondary,
                  ),
                ),
                if (usageCount.isNotEmpty) ...[
                  const SizedBox(width: 12),
                  const Icon(Icons.bolt_rounded, size: 15, color: Colors.amber),
                  const SizedBox(width: 2),
                  Text(
                    usageCount,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.grey.shade400 : AppColors.textSecondary,
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),

        const SizedBox(height: 12),

        // 2. Offer Title
        Text(
          widget.offer.title,
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w900,
            fontSize: 20,
            height: 1.35,
          ),
        ),

        // 3. Pricing & Savings (Only displayed for products with actual prices)
        if (pricing.hasExplicitPrices) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF162032) : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.grey.shade200,
              ),
            ),
            child: Row(
              children: [
                if (pricing.finalPrice != null) ...[
                  Text.rich(
                    TextSpan(
                      children: [
                        TextSpan(
                          text: '${pricing.finalPrice!.toStringAsFixed(0)} ',
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w900,
                            fontSize: 22,
                          ),
                        ),
                        const TextSpan(
                          text: 'ج.م',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                if (pricing.originalPrice != null) ...[
                  const SizedBox(width: 10),
                  Text.rich(
                    TextSpan(
                      children: [
                        TextSpan(
                          text: '${pricing.originalPrice!.toStringAsFixed(0)} ',
                          style: TextStyle(
                            decoration: TextDecoration.lineThrough,
                            color: isDark ? Colors.grey.shade400 : AppColors.textSecondary,
                            fontWeight: FontWeight.w700,
                            fontSize: 15,
                          ),
                        ),
                        TextSpan(
                          text: 'ج.م',
                          style: TextStyle(
                            decoration: TextDecoration.lineThrough,
                            color: isDark ? Colors.grey.shade400 : AppColors.textSecondary,
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const Spacer(),
                if (pricing.hasSavings) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: const Color(0x1810B981),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0x3510B981)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'وفرت ${pricing.savingsAmount.toStringAsFixed(0)} ج.م',
                          style: const TextStyle(
                            color: Color(0xFF10B981),
                            fontWeight: FontWeight.w800,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '(${pricing.savingsPercentage}%)',
                          textDirection: TextDirection.ltr,
                          style: const TextStyle(
                            color: Color(0xFF10B981),
                            fontWeight: FontWeight.w800,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildStoreCard() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final initial = widget.offer.store.name.trim().isNotEmpty
        ? widget.offer.store.name.trim().characters.first
        : 'Z';

    return BouncyTap(
      scaleFactor: 0.98,
      onTap: () {
        HapticFeedback.lightImpact();
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => StoreDetailPage(store: widget.offer.store),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: theme.cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark
                ? Colors.white.withValues(alpha: 0.08)
                : theme.dividerColor.withValues(alpha: 0.08),
          ),
        ),
        child: Row(
          children: [
            // Merchant avatar with smart monogram initial fallback
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFFFF5722).withValues(alpha: 0.2),
                    const Color(0xFFFF8C35).withValues(alpha: 0.12),
                  ],
                ),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppColors.primary.withValues(alpha: 0.25),
                  width: 1,
                ),
              ),
              clipBehavior: Clip.antiAlias,
              child: widget.offer.store.logo != null &&
                      widget.offer.store.logo!.isNotEmpty
                  ? NetworkImageWidget(
                      imageUrl: widget.offer.store.logo!,
                      fit: BoxFit.cover,
                    )
                  : Center(
                      child: Text(
                        initial,
                        style: GoogleFonts.cairo(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w900,
                          fontSize: 19,
                        ),
                      ),
                    ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          widget.offer.store.name,
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                            fontSize: 14.5,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 5),
                      const Icon(
                        Icons.verified_rounded,
                        size: 15,
                        color: Color(0xFF0084FF),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'الزقازيق • ${widget.offer.store.area} — تفاصيل المتجر',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w700,
                      fontSize: 11.5,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Directionality.of(context) == TextDirection.rtl
                  ? Icons.arrow_back_ios_new_rounded
                  : Icons.arrow_forward_ios_rounded,
              size: 14,
              color: isDark ? Colors.grey.shade400 : AppColors.textSecondary,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStoreLocationCard() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final store = widget.offer.store;
    final detailedAddress = (store.address != null && store.address!.trim().isNotEmpty)
        ? store.address!
        : 'الزقازيق، ${store.area}';

    final hasPhone = store.phone != null && store.phone!.trim().isNotEmpty;
    final hasWhatsapp = (store.whatsapp != null && store.whatsapp!.trim().isNotEmpty) || hasPhone;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.08)
              : theme.dividerColor.withValues(alpha: 0.08),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(9),
                ),
                child: const Icon(Icons.place_rounded, color: AppColors.primary, size: 18),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'مكانهم فين؟',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                  ),
                ),
              ),
              // Dedicated Copy Address Action
              BouncyTap(
                scaleFactor: 0.94,
                onTap: () {
                  Clipboard.setData(ClipboardData(text: '$detailedAddress - ${store.name}'));
                  HapticFeedback.lightImpact();
                  SnackBarUtils.showSuccess(context, 'تم نسخ العنوان بنجاح! 📋');
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.06)
                        : Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.copy_rounded, size: 13, color: AppColors.primary),
                      const SizedBox(width: 4),
                      Text(
                        'نسخ العنوان',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          // Address displayed ONCE clearly
          Text(
            detailedAddress,
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
              fontSize: 13,
              height: 1.45,
            ),
          ),

          if (store.workingHours != null && store.workingHours!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  Icons.access_time_rounded,
                  size: 14,
                  color: isDark ? Colors.grey.shade400 : AppColors.textSecondary,
                ),
                const SizedBox(width: 6),
                Text(
                  'مواعيد العمل: ${store.workingHours}',
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w500,
                    color: isDark ? Colors.grey.shade400 : AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ],

          const SizedBox(height: 12),

          // Navigation and Merchant Actions
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _openExternalMap,
                  icon: const Icon(Icons.navigation_rounded, size: 16, color: Colors.white),
                  label: const Text(
                    'طريق الوصول',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                      color: Colors.white,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(vertical: 9),
                  ),
                ),
              ),
              if (hasPhone) ...[
                const SizedBox(width: 8),
                BouncyTap(
                  scaleFactor: 0.92,
                  child: IconButton.filledTonal(
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      _callStore();
                    },
                    icon: const Icon(Icons.call_rounded, size: 18),
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.blue.withValues(alpha: 0.12),
                      foregroundColor: Colors.blue.shade700,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    tooltip: 'اتصال',
                  ),
                ),
              ],
              if (hasWhatsapp) ...[
                const SizedBox(width: 8),
                BouncyTap(
                  scaleFactor: 0.92,
                  child: IconButton.filledTonal(
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      _whatsappStore();
                    },
                    icon: const Icon(Icons.chat_rounded, size: 18),
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.green.withValues(alpha: 0.12),
                      foregroundColor: Colors.green.shade700,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    tooltip: 'واتساب',
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDescriptionSection() {
    final textTheme = Theme.of(context).textTheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final store = widget.offer.store;
    final category = store.category;
    final usageLimit = widget.offer.usageLimit;
    final isFlash = widget.offer.isFlashSale;

    final chips = <Widget>[];
    if (category != null && category.trim().isNotEmpty) {
      chips.add(_buildCompactFeatureChip(
        icon: Icons.category_outlined,
        label: category.trim(),
        isDark: isDark,
      ));
    }
    if (usageLimit != null && usageLimit > 0) {
      chips.add(_buildCompactFeatureChip(
        icon: Icons.person_outline_rounded,
        label: usageLimit == 1 ? 'كوبون واحد لكل عميل' : 'حد أقصى $usageLimit مرات',
        isDark: isDark,
      ));
    }
    if (isFlash) {
      chips.add(_buildCompactFeatureChip(
        icon: Icons.bolt_rounded,
        label: 'عرض فلاش محدود ⚡',
        isDark: isDark,
        highlight: true,
      ));
    }
    if (store.area.trim().isNotEmpty) {
      chips.add(_buildCompactFeatureChip(
        icon: Icons.storefront_outlined,
        label: 'فرع: ${store.area.trim()}',
        isDark: isDark,
      ));
    }

    final meaningfulDesc = (widget.offer.description != null &&
            widget.offer.description!.trim().isNotEmpty)
        ? widget.offer.description!.trim()
        : 'استمتع بخصم حصري ومباشر لدى ${store.name} على جميع الخدمات والمنتجات المشمولة بالعرض داخل الفرع.';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'تفاصيل العرض',
          style: textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w800,
            fontSize: 15,
          ),
        ),
        if (chips.isNotEmpty) ...[
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: chips,
          ),
        ],
        const SizedBox(height: 8),
        Text(
          meaningfulDesc,
          style: textTheme.bodyMedium?.copyWith(
            height: 1.55,
            fontSize: 13,
            color: isDark ? Colors.grey.shade300 : AppColors.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildCompactFeatureChip({
    required IconData icon,
    required String label,
    required bool isDark,
    bool highlight = false,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: highlight
            ? AppColors.primary.withValues(alpha: 0.12)
            : (isDark ? const Color(0xFF162032) : const Color(0xFFF1F5F9)),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: highlight
              ? AppColors.primary.withValues(alpha: 0.35)
              : (isDark ? Colors.white.withValues(alpha: 0.08) : Colors.grey.shade300),
          width: 0.8,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 13,
            color: highlight
                ? AppColors.primary
                : (isDark ? Colors.grey.shade400 : AppColors.textSecondary),
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: highlight
                  ? AppColors.primary
                  : (isDark ? Colors.grey.shade300 : AppColors.textPrimary),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTermsSection() {
    final textTheme = Theme.of(context).textTheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.check_circle_outline_rounded,
                size: 18, color: AppColors.primary),
            const SizedBox(width: 6),
            Text(
              'طريقة الاستخدام والشروط',
              style: textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w800,
                fontSize: 14,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isDark
                  ? Colors.white.withValues(alpha: 0.08)
                  : Theme.of(context).dividerColor.withValues(alpha: 0.08),
            ),
          ),
          child: Text(
            widget.offer.terms!,
            style: textTheme.bodyMedium?.copyWith(height: 1.55, fontSize: 12.5),
          ),
        ),
      ],
    );
  }

  Widget _buildExpirySection() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final now = DateTime.now();
    final isExpired = widget.offer.expiryDate.isBefore(now);
    final daysLeft = widget.offer.expiryDate.difference(now).inDays;
    final isUrgent = !isExpired && daysLeft <= 3 && daysLeft >= 0;

    Color bgColor;
    Color borderColor;
    Color iconColor;
    Color textColor;
    String text;
    IconData icon;

    if (isExpired) {
      bgColor = AppColors.error.withValues(alpha: isDark ? 0.12 : 0.08);
      borderColor = AppColors.error.withValues(alpha: 0.25);
      iconColor = AppColors.error;
      textColor = AppColors.error;
      icon = Icons.history_rounded;
      text = 'انتهت صلاحية هذا العرض في: ${DateFormat.yMMMMd('ar').format(widget.offer.expiryDate)}';
    } else if (isUrgent) {
      bgColor = Colors.amber.withValues(alpha: isDark ? 0.15 : 0.08);
      borderColor = Colors.amber.withValues(alpha: 0.35);
      iconColor = Colors.amber.shade700;
      textColor = isDark ? Colors.amber.shade300 : Colors.amber.shade900;
      icon = Icons.alarm_rounded;
      text = 'ينتهي العرض قريباً، متبقي $daysLeft أيام (${DateFormat.yMMMMd('ar').format(widget.offer.expiryDate)})';
    } else {
      bgColor = isDark ? const Color(0xFF162032) : const Color(0xFFF8FAFC);
      borderColor = isDark ? Colors.white.withValues(alpha: 0.08) : Colors.grey.shade200;
      iconColor = AppColors.primary;
      textColor = isDark ? Colors.grey.shade300 : AppColors.textPrimary;
      icon = Icons.event_available_rounded;
      text = 'ساري حتى: ${DateFormat.yMMMMd('ar').format(widget.offer.expiryDate)}';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor, width: 1),
      ),
      child: Row(
        children: [
          Icon(icon, color: iconColor, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                color: textColor,
                fontWeight: FontWeight.w700,
                fontSize: 12.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStickyActionArea(String usageCount) {
    final textTheme = Theme.of(context).textTheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bottomInset = MediaQuery.of(context).padding.bottom;

    return Positioned(
      bottom: bottomInset > 0 ? bottomInset + 8 : 16,
      left: 16,
      right: 16,
      child: FutureBuilder<bool>(
        future: _canGenerateCouponFuture,
        builder: (context, snapshot) {
          final canGenerate = snapshot.data ?? false;
          final existing = _existingCoupon;
          final redeemedAt = existing?.redeemedAt;
          final isOfferExpired = widget.offer.expiryDate.isBefore(DateTime.now()) ||
              _isFlashSaleFinished() ||
              existing?.status == 'EXPIRED';
          final isRedeemed = existing?.status == 'USED';
          final hasActiveCoupon = existing != null && existing.isActive;

          // 1. Redeemed State: Clearly Non-Interactive Information Banner
          if (isRedeemed) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF132321) : const Color(0xFFECFDF5),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: const Color(0xFF10B981).withValues(alpha: isDark ? 0.35 : 0.4),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.12),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(7),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.verified_rounded,
                      color: Color(0xFF10B981),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          'تم استخدام هذا الكوبون بنجاح ✓',
                          style: TextStyle(
                            color: Color(0xFF10B981),
                            fontWeight: FontWeight.w900,
                            fontSize: 13.5,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          redeemedAt != null
                              ? 'تم الخصم لدى المتجر بتاريخ ${DateFormat('d MMMM yyyy - h:mm a', 'ar').format(redeemedAt)}'
                              : 'تم تأكيد الاستفادة من الخصم لدى المتجر بنجاح',
                          style: TextStyle(
                            color: isDark ? Colors.grey.shade400 : const Color(0xFF065F46),
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }

          // 2. Expired Offer State: Muted Non-Interactive Banner
          if (isOfferExpired) {
            return Container(
              height: 50,
              width: double.infinity,
              decoration: BoxDecoration(
                color: isDark ? Colors.white12 : Colors.grey.shade300,
                borderRadius: BorderRadius.circular(16),
              ),
              alignment: Alignment.center,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.timer_off_outlined,
                    size: 18,
                    color: isDark ? Colors.white54 : Colors.grey.shade600,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'انتهت صلاحية العرض',
                    style: TextStyle(
                      color: isDark ? Colors.white54 : Colors.grey.shade600,
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            );
          }

          // 3. Active States: Claim or View Coupon
          return BlocBuilder<CouponsBloc, CouponsState>(
            buildWhen: (prev, next) =>
                next is CouponsLoading ||
                next is CouponGeneratedSuccess ||
                next is CouponsError ||
                next is UserCouponsLoaded,
            builder: (context, state) {
              final isLoading = state is CouponsLoading;

              final String buttonText;
              final IconData buttonIcon;
              final VoidCallback? onPressed;

              if (hasActiveCoupon) {
                buttonText = 'عرض الكوبون 🎟️';
                buttonIcon = Icons.qr_code_2_rounded;
                onPressed = () {
                  HapticFeedback.lightImpact();
                  _showCouponDialog(
                    context,
                    existing.code,
                    status: existing.status,
                  );
                };
              } else {
                buttonText = canGenerate ? 'احصل على الكوبون 🎟️' : 'سجّل حسابك واستمتع بالخصم';
                buttonIcon = Icons.confirmation_num_rounded;
                onPressed = () async {
                  if (!canGenerate) {
                    HapticFeedback.lightImpact();
                    await Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const LoginPage()),
                    );
                    if (mounted) {
                      setState(() {
                        _canGenerateCouponFuture = _canGenerateCoupon();
                      });
                      _couponsBloc.add(FetchUserCoupons());
                    }
                    return;
                  }
                  if (isLoading) return;
                  HapticFeedback.mediumImpact();
                  _couponsBloc.add(GenerateCouponRequested(widget.offer.id));
                };
              }

              return Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  BouncyTap(
                    scaleFactor: 0.97,
                    child: Container(
                      height: 52,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFFF5722), Color(0xFFFF7043)],
                        ),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.38),
                            blurRadius: 18,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: ElevatedButton(
                        onPressed: onPressed,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          foregroundColor: Colors.white,
                          shadowColor: Colors.transparent,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          elevation: 0,
                        ),
                        child: isLoading
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2.2,
                                ),
                              )
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(buttonIcon, size: 20),
                                  const SizedBox(width: 10),
                                  Text(
                                    buttonText,
                                    style: textTheme.labelLarge?.copyWith(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 15,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                  ),
                  if (!canGenerate && !hasActiveCoupon) ...[
                    const SizedBox(height: 8),
                    Text(
                      'سجّل حسابك في ثواني ووفّر مع كل خروجة',
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

  bool _isFlashSaleFinished() {
    if (widget.offer.isFlashSale && widget.offer.flashSaleEndsAt != null) {
      return widget.offer.flashSaleEndsAt!.isBefore(DateTime.now());
    }
    return false;
  }

  void _showCouponDialog(BuildContext context, String code, {String status = 'GENERATED'}) {
    final pricing = _pricing;
    CouponCelebrationDialog.show(
      context: context,
      code: code,
      storeName: widget.offer.store.name,
      storeLogo: widget.offer.store.logo,
      storeArea: widget.offer.store.area,
      offerTitle: widget.offer.title,
      newPrice: pricing.finalPrice,
      oldPrice: pricing.originalPrice,
      discount: pricing.topDiscountBadge,
      status: status,
      onViewCoupons: () {
        Navigator.popUntil(context, (route) => route.isFirst);
        Future.delayed(const Duration(milliseconds: 150), () {
          final rootContext = NavigationService.navigatorKey.currentContext;
          if (rootContext != null && rootContext.mounted) {
            // ignore: use_build_context_synchronously
            MainScreen.of(rootContext)?.setSelectedIndex(2);
          }
        });
      },
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
                  color: isSelected
                      ? AppColors.primary
                      : theme.dividerColor.withValues(alpha: 0.15),
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
    final isDark = theme.brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'آراء العملاء',
              style: theme.textTheme.titleMedium
                  ?.copyWith(fontWeight: FontWeight.w800, fontSize: 15),
            ),
            TextButton(
              onPressed: _showAddReviewBottomSheet,
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: Text(
                'أضف تقييمك',
                style: theme.textTheme.labelLarge?.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.bold,
                  fontSize: 12.5,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        BlocBuilder<ReviewsBloc, ReviewsState>(
          buildWhen: (prev, next) =>
              next is ReviewsLoaded || next is ReviewsLoading,
          builder: (context, state) {
            if (state is ReviewsLoading) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: CircularProgressIndicator(strokeWidth: 2.5),
                ),
              );
            }
            if (state is ReviewsLoaded) {
              if (state.reviews.isEmpty) {
                return Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: theme.cardColor,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isDark
                          ? Colors.white.withValues(alpha: 0.08)
                          : theme.dividerColor.withValues(alpha: 0.08),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(7),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.chat_bubble_outline_rounded,
                          size: 16,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'لا توجد تقييمات بعد — كن أول من يقيّم هذا العرض!',
                          style: theme.textTheme.bodySmall?.copyWith(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: isDark ? Colors.grey.shade400 : AppColors.textSecondary,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }
              return ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: state.reviews.length,
                separatorBuilder: (context, index) =>
                    const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final review = state.reviews[index];
                  return Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: theme.cardColor,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isDark
                            ? Colors.white.withValues(alpha: 0.08)
                            : theme.dividerColor.withValues(alpha: 0.08),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                review.customerName,
                                style: theme.textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                            Text(
                              DateFormat.yMMMd('ar').format(review.createdAt),
                              style: TextStyle(
                                fontSize: 11,
                                color: isDark ? Colors.grey.shade400 : AppColors.textSecondary,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Row(
                              children: List.generate(
                                5,
                                (i) => Icon(
                                  Icons.star_rounded,
                                  size: 15,
                                  color: i < review.rating
                                      ? Colors.amber
                                      : theme.disabledColor
                                          .withValues(alpha: 0.25),
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (review.comment != null &&
                            review.comment!.trim().isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Text(
                            review.comment!,
                            style: theme.textTheme.bodySmall?.copyWith(
                              height: 1.45,
                              fontSize: 12,
                            ),
                          ),
                        ],
                        if (review.merchantReply != null) ...[
                          const SizedBox(height: 10),
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.05),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                  color: AppColors.primary
                                      .withValues(alpha: 0.15)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Icon(Icons.store_rounded,
                                        size: 14, color: AppColors.primary),
                                    const SizedBox(width: 6),
                                    Text(
                                      'رد المتجر',
                                      style:
                                          theme.textTheme.labelSmall?.copyWith(
                                        color: AppColors.primary,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  review.merchantReply!,
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: AppColors.textSecondary,
                                    height: 1.35,
                                    fontSize: 11.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  );
                },
              );
            }
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Center(
                child: Text(
                  'تعذر تحميل التقييمات',
                  style: theme.textTheme.bodyMedium
                      ?.copyWith(color: AppColors.textSecondary),
                ),
              ),
            );
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
            style: theme.textTheme.headlineSmall
                ?.copyWith(fontWeight: FontWeight.bold),
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
                  color: i < _selectedRating
                      ? Colors.amber
                      : theme.disabledColor.withValues(alpha: 0.3),
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
            height: 48,
            child: ElevatedButton(
              onPressed: () {
                // Focus out to close keyboard before popping
                FocusManager.instance.primaryFocus?.unfocus();
                HapticFeedback.mediumImpact();
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
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
              child: const Text(
                'إرسال التقييم',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class OfferPricingResult {
  final double? finalPrice;
  final double? originalPrice;
  final double savingsAmount;
  final int savingsPercentage;
  final bool hasSavings;
  final bool hasExplicitPrices;
  final String topDiscountBadge;

  const OfferPricingResult({
    this.finalPrice,
    this.originalPrice,
    required this.savingsAmount,
    required this.savingsPercentage,
    required this.hasSavings,
    required this.hasExplicitPrices,
    required this.topDiscountBadge,
  });

  static OfferPricingResult compute({
    required double? newPrice,
    required double? oldPrice,
    required String discountString,
    required double discountPercentage,
  }) {
    final rawNew = (newPrice != null && newPrice > 0 && newPrice.isFinite) ? newPrice : null;
    final rawOld = (oldPrice != null && oldPrice > 0 && oldPrice.isFinite) ? oldPrice : null;

    double parsedPercent = discountPercentage > 0 ? discountPercentage : 0;
    if (parsedPercent == 0 && discountString.isNotEmpty) {
      final clean = discountString.replaceAll(RegExp(r'[^0-9.]'), '');
      final p = double.tryParse(clean);
      if (p != null && p > 0 && p < 100) {
        parsedPercent = p;
      }
    }

    // Case 1: Both prices explicitly provided
    if (rawNew != null && rawOld != null) {
      if (rawOld > rawNew) {
        final savings = rawOld - rawNew;
        // Strict formula: ((originalPrice - finalPrice) / originalPrice) * 100
        final mathPercent = ((savings / rawOld) * 100).round();
        return OfferPricingResult(
          finalPrice: rawNew,
          originalPrice: rawOld,
          savingsAmount: savings,
          savingsPercentage: mathPercent,
          hasSavings: true,
          hasExplicitPrices: true,
          topDiscountBadge: '$mathPercent%',
        );
      } else {
        return OfferPricingResult(
          finalPrice: rawNew,
          originalPrice: null,
          savingsAmount: 0,
          savingsPercentage: 0,
          hasSavings: false,
          hasExplicitPrices: true,
          topDiscountBadge: parsedPercent > 0 ? '${parsedPercent.toInt()}%' : '',
        );
      }
    }

    // Case 2: Only oldPrice provided, with valid percentage discount
    if (rawOld != null && rawNew == null && parsedPercent > 0) {
      final effectiveFinal = rawOld * (1 - (parsedPercent / 100));
      final savings = rawOld - effectiveFinal;
      final mathPercent = parsedPercent.round();
      return OfferPricingResult(
        finalPrice: effectiveFinal,
        originalPrice: rawOld,
        savingsAmount: savings,
        savingsPercentage: mathPercent,
        hasSavings: savings > 0,
        hasExplicitPrices: true,
        topDiscountBadge: '$mathPercent%',
      );
    }

    // Case 3: Only newPrice provided, with valid percentage discount
    if (rawNew != null && rawOld == null && parsedPercent > 0 && parsedPercent < 100) {
      final effectiveOriginal = rawNew / (1 - (parsedPercent / 100));
      final savings = effectiveOriginal - rawNew;
      final mathPercent = parsedPercent.round();
      return OfferPricingResult(
        finalPrice: rawNew,
        originalPrice: effectiveOriginal,
        savingsAmount: savings,
        savingsPercentage: mathPercent,
        hasSavings: savings > 0,
        hasExplicitPrices: true,
        topDiscountBadge: '$mathPercent%',
      );
    }

    // Case 4: Single price only (no discount percentage to derive counterpart)
    if (rawNew != null || rawOld != null) {
      final single = rawNew ?? rawOld;
      return OfferPricingResult(
        finalPrice: single,
        originalPrice: null,
        savingsAmount: 0,
        savingsPercentage: 0,
        hasSavings: false,
        hasExplicitPrices: true,
        topDiscountBadge: parsedPercent > 0 ? '${parsedPercent.toInt()}%' : '',
      );
    }

    // Case 5: Store-wide offer with NO specific prices (e.g. 20% off whole store)
    final badge = parsedPercent > 0
        ? '${parsedPercent.toInt()}%'
        : (discountString.trim().isNotEmpty ? discountString.trim() : '');
    return OfferPricingResult(
      finalPrice: null,
      originalPrice: null,
      savingsAmount: 0,
      savingsPercentage: parsedPercent.round(),
      hasSavings: false,
      hasExplicitPrices: false,
      topDiscountBadge: badge,
    );
  }
}
