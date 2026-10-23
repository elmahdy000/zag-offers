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
import '../../../../core/widgets/skeleton_loader.dart';
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
import '../utils/offer_pricing_utils.dart';

class OfferDetailPage extends StatefulWidget {
  final OfferEntity offer;
  final String? heroTag;

  const OfferDetailPage({super.key, required this.offer, this.heroTag});

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
  bool _isClaimingCoupon = false;

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
                  _buildContentSection(),
                ],
              ),
              _buildStickyActionArea(),
            ],
          ),
        ),
      ),
    );
  }

  void _onCouponStateChange(BuildContext context, CouponsState state) {
    if (state is UserCouponsLoaded) {
      if (mounted) {
        setState(() {
          _userCoupons = state.coupons;
          _isClaimingCoupon = false;
        });
      }
    }
    if (state is CouponsError) {
      if (mounted) {
        setState(() => _isClaimingCoupon = false);
      }
      SnackBarUtils.showError(context, state.message);
    }
    if (state is CouponGeneratedSuccess) {
      if (mounted) {
        setState(() {
          _isClaimingCoupon = false;
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
        icon: NavigationService.getBackIcon(context),
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
                const SizedBox(height: 5),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'الزقازيق',
                      style: GoogleFonts.cairo(
                        color: Colors.white.withValues(alpha: 0.75),
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                    if (widget.offer.store.area.isNotEmpty) ...[
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 6),
                        child: Container(
                          width: 3.5,
                          height: 3.5,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.5),
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                      Text(
                        widget.offer.store.area,
                        style: GoogleFonts.cairo(
                          color: Colors.white.withValues(alpha: 0.75),
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ],
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
                          tag: widget.heroTag ?? 'offer_image_${widget.offer.id}',
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
                    PositionedDirectional(
                      bottom: 16,
                      start: 16,
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
            bottom: 32,
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

  Widget _buildContentSection() {
    final theme = Theme.of(context);
    final bottomInset = MediaQuery.of(context).padding.bottom;

    return SliverToBoxAdapter(
      child: Transform.translate(
        offset: const Offset(0, -20),
        child: Container(
          decoration: BoxDecoration(
            color: theme.scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: EdgeInsets.fromLTRB(
            18,
            _allImages.length > 1 ? 24 : 34,
            18,
            140 + bottomInset,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_allImages.length > 1) ...[
                _buildThumbnailsRow(),
                const SizedBox(height: 14),
              ],
              _buildOfferHeaderHierarchy(),
              const SizedBox(height: 14),
              _buildStoreCard(),
              const SizedBox(height: 14),
              _buildStoreLocationCard(),
              const SizedBox(height: 14),
              _buildDescriptionSection(),
              if (widget.offer.terms != null &&
                  widget.offer.terms!.isNotEmpty) ...[
                const SizedBox(height: 14),
                _buildTermsSection(),
              ],
              const SizedBox(height: 14),
              _buildExpirySection(),
              const SizedBox(height: 14),
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

  String get _displayTitle {
    final title = widget.offer.title.trim();
    final isJustDiscount = RegExp(
      r'^(\d+%\s*خصم|خصم\s*\d+%|\d+%\s*OFF|\d+%|\d+\s*ج\.م)$',
      caseSensitive: false,
    ).hasMatch(title);

    if (isJustDiscount) {
      final desc = widget.offer.description?.trim();
      if (desc != null &&
          desc.isNotEmpty &&
          !RegExp(r'^(\d+%\s*خصم|خصم\s*\d+%|\d+%)$').hasMatch(desc)) {
        return desc;
      }

      final storeName = widget.offer.store.name;
      final category = widget.offer.store.category;
      if (category != null && category.trim().isNotEmpty) {
        return 'عرض $category من $storeName';
      }
      return 'عرض خاص من $storeName';
    }

    return title;
  }

  String get _displayDescription {
    final desc = widget.offer.description?.trim();
    final title = widget.offer.title.trim();
    final storeName = widget.offer.store.name;
    final area = widget.offer.store.area.isNotEmpty ? widget.offer.store.area : 'الزقازيق';
    final category = widget.offer.store.category;

    if (desc != null &&
        desc.isNotEmpty &&
        desc != title &&
        !RegExp(r'^(\d+%\s*خصم|خصم\s*\d+%|\d+%)$').hasMatch(desc)) {
      return desc;
    }

    final pricing = _pricing;
    final discountText = pricing.topDiscountBadge.isNotEmpty
        ? 'بخصم ${pricing.topDiscountBadge}'
        : 'بخصم حصري';

    if (category != null && category.trim().isNotEmpty) {
      return 'استمتع $discountText لدى $storeName ($category) في $area. العرض متاح لجميع عملاء زاج أوفرز ويمكنك الاستفادة منه مباشرة داخل الفرع عند إبراز الكوبون.';
    }

    return 'استمتع $discountText لدى $storeName في $area على المنتجات والخدمات المشمولة بالعرض داخل الفرع عبر تطبيق زاج أوفرز.';
  }

  Widget _buildOfferHeaderHierarchy() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final pricing = _pricing;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 1. Top Meta: Prominent Discount Badge + Symmetrical Stats/Tag Pill
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Start / Right: Primary Discount Badge
            if (pricing.topDiscountBadge.isNotEmpty)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6.5),
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
                    const Text(
                      'خصم',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 12.5,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      pricing.topDiscountBadge.endsWith('%')
                          ? pricing.topDiscountBadge
                          : '${pricing.topDiscountBadge}%',
                      textDirection: TextDirection.ltr,
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
            // End / Left: Symmetrical Secondary Metrics Pill (Views & Social Proof)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5.5),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.grey.shade300,
                  width: 0.8,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Icon(
                    Icons.remove_red_eye_outlined,
                    size: 13,
                    color: isDark ? Colors.grey.shade400 : AppColors.textSecondary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${widget.offer.viewCount}',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.grey.shade300 : AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    width: 3,
                    height: 3,
                    decoration: BoxDecoration(
                      color: isDark ? Colors.grey.shade600 : Colors.grey.shade400,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  _buildSocialProofTag(isDark),
                ],
              ),
            ),
          ],
        ),

        const SizedBox(height: 14),

        // 2. Offer Title
        Text(
          _displayTitle,
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w900,
            fontSize: 20,
            height: 1.35,
          ),
        ),

        // 3. Pricing & Savings (Only displayed for products with actual prices)
        if (pricing.hasExplicitPrices) ...[
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF162032) : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.grey.shade200,
              ),
            ),
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: AlignmentDirectional.centerStart,
              child: Row(
                children: [
                  if (pricing.finalPrice != null) ...[
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      textDirection: TextDirection.rtl,
                      children: [
                        Text(
                          pricing.finalPrice!.toStringAsFixed(0),
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w900,
                            fontSize: 22,
                            height: 1.1,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Text(
                          'ج.م',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w800,
                            fontSize: 14,
                            height: 1.1,
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (pricing.originalPrice != null) ...[
                    const SizedBox(width: 10),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      textDirection: TextDirection.rtl,
                      children: [
                        Text(
                          pricing.originalPrice!.toStringAsFixed(0),
                          style: TextStyle(
                            decoration: TextDecoration.lineThrough,
                            decorationColor: isDark ? Colors.grey.shade400 : AppColors.textSecondary,
                            decorationThickness: 1.8,
                            color: isDark ? Colors.grey.shade400 : AppColors.textSecondary,
                            fontWeight: FontWeight.w700,
                            fontSize: 15,
                            height: 1.1,
                          ),
                        ),
                        const SizedBox(width: 3),
                        Text(
                          'ج.م',
                          style: TextStyle(
                            decoration: TextDecoration.lineThrough,
                            decorationColor: isDark ? Colors.grey.shade400 : AppColors.textSecondary,
                            decorationThickness: 1.8,
                            color: isDark ? Colors.grey.shade400 : AppColors.textSecondary,
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                            height: 1.1,
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(width: 24),
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
                            '(خصم ${pricing.savingsPercentage}%)',
                            textDirection: TextDirection.rtl,
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
          ),
        ],
      ],
    );
  }

  Widget _buildSocialProofTag(bool isDark) {
    final offer = widget.offer;

    if (offer.usageLimit != null && offer.usageLimit! > 0) {
      final remaining = offer.usageLimit! - offer.usedCoupons;
      if (remaining <= 0) {
        return _buildSocialChip(
          icon: Icons.do_not_disturb_on_rounded,
          iconColor: Colors.redAccent,
          label: 'نفدت الكمية',
          labelColor: Colors.redAccent,
        );
      }
      if (remaining <= 5) {
        return _buildSocialChip(
          icon: Icons.hourglass_bottom_rounded,
          iconColor: Colors.orangeAccent,
          label: 'باقي $remaining فقط',
          labelColor: Colors.orangeAccent,
        );
      }
    }

    if (offer.isFeatured || offer.usedCoupons >= 10) {
      return _buildSocialChip(
        icon: Icons.bolt_rounded,
        iconColor: Colors.amber,
        label: 'الأكثر طلباً',
        labelColor: isDark ? Colors.grey.shade300 : AppColors.textPrimary,
      );
    }

    if (offer.usedCoupons > 0) {
      return _buildSocialChip(
        icon: Icons.confirmation_num_outlined,
        iconColor: AppColors.primary,
        label: '${offer.usedCoupons} استخدام',
        labelColor: isDark ? Colors.grey.shade300 : AppColors.textPrimary,
      );
    }

    if (offer.viewCount >= 50) {
      return _buildSocialChip(
        icon: Icons.local_fire_department_rounded,
        iconColor: Colors.deepOrangeAccent,
        label: 'الأكثر تفاعلاً',
        labelColor: isDark ? Colors.grey.shade300 : AppColors.textPrimary,
      );
    }

    return _buildSocialChip(
      icon: Icons.auto_awesome_rounded,
      iconColor: Colors.amber,
      label: 'جديد',
      labelColor: isDark ? Colors.grey.shade300 : AppColors.textPrimary,
    );
  }

  Widget _buildSocialChip({
    required IconData icon,
    required Color iconColor,
    required String label,
    required Color labelColor,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Icon(icon, size: 12.5, color: iconColor),
        const SizedBox(width: 3.5),
        Text(
          label,
          style: TextStyle(
            fontSize: 11.5,
            fontWeight: FontWeight.w700,
            color: labelColor,
          ),
        ),
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
                    widget.offer.store.area.isNotEmpty && widget.offer.store.area != 'الزقازيق'
                        ? 'الزقازيق، ${widget.offer.store.area} — تفاصيل المتجر'
                        : 'الزقازيق — تفاصيل المتجر',
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w700,
                      fontSize: 11.5,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            Icon(
              NavigationService.getForwardIcon(context),
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
                Expanded(
                  child: Text(
                    'مواعيد العمل: ${store.workingHours}',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w500,
                      color: isDark ? Colors.grey.shade400 : AppColors.textSecondary,
                    ),
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
                child: BouncyTap(
                  scaleFactor: 0.96,
                  onTap: () {
                    HapticFeedback.lightImpact();
                    _openExternalMap();
                  },
                  child: Container(
                    height: 40,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFFF5722), Color(0xFFFF7043)],
                      ),
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.28),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.navigation_rounded, size: 16, color: Colors.white),
                        SizedBox(width: 6),
                        Text(
                          'طريق الوصول',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 13,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              if (hasPhone) ...[
                const SizedBox(width: 8),
                BouncyTap(
                  scaleFactor: 0.92,
                  onTap: () {
                    HapticFeedback.lightImpact();
                    _callStore();
                  },
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: Colors.blue.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    alignment: Alignment.center,
                    child: Icon(
                      Icons.call_rounded,
                      size: 18,
                      color: Colors.blue.shade700,
                    ),
                  ),
                ),
              ],
              if (hasWhatsapp) ...[
                const SizedBox(width: 8),
                BouncyTap(
                  scaleFactor: 0.92,
                  onTap: () {
                    HapticFeedback.lightImpact();
                    _whatsappStore();
                  },
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: Colors.green.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    alignment: Alignment.center,
                    child: Icon(
                      Icons.chat_rounded,
                      size: 18,
                      color: Colors.green.shade700,
                    ),
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

    final meaningfulDesc = _displayDescription;

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

  Widget _buildStickyActionArea() {
    final theme = Theme.of(context);
    final textTheme = theme.textTheme;
    final isDark = theme.brightness == Brightness.dark;

    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              theme.scaffoldBackgroundColor.withValues(alpha: 0.0),
              theme.scaffoldBackgroundColor.withValues(alpha: 0.88),
              theme.scaffoldBackgroundColor,
            ],
            stops: const [0.0, 0.35, 1.0],
          ),
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
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
                    final isLoading = state is CouponsLoading || _isClaimingCoupon;

                    final String buttonText;
                    final IconData buttonIcon;
                    final VoidCallback? onPressed;

                    if (hasActiveCoupon) {
                      buttonText = 'عرض الكوبون';
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
                      buttonText = canGenerate ? 'احصل على الكوبون' : 'سجّل حسابك واستمتع بالخصم';
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

                        if (isLoading || _isClaimingCoupon) return;
                        if (mounted) {
                          setState(() => _isClaimingCoupon = true);
                        }
                        HapticFeedback.mediumImpact();
                        _couponsBloc.add(GenerateCouponRequested(widget.offer.id));
                      };
                    }

                    return Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        BouncyTap(
                          scaleFactor: 0.97,
                          onTap: onPressed,
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
                            alignment: Alignment.center,
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
                                      Icon(buttonIcon, size: 20, color: Colors.white),
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
          ),
        ),
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
    final isDark = theme.brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.only(top: 14, bottom: 4),
      child: Center(
        child: SizedBox(
          height: 60,
          child: ListView.separated(
            shrinkWrap: true,
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
            itemCount: images.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
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
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 58,
                  height: 58,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(13),
                    border: Border.all(
                      color: isSelected
                          ? AppColors.primary
                          : (isDark
                              ? Colors.white.withValues(alpha: 0.15)
                              : Colors.black.withValues(alpha: 0.1)),
                      width: isSelected ? 2.5 : 1,
                    ),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.35),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ]
                        : null,
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
        ),
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
              return AppShimmer(
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF162032) : Colors.white,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Row(
                    children: [
                      SkeletonCircle(size: 38),
                      SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SkeletonBox(width: 100, height: 13, borderRadius: 4),
                            SizedBox(height: 6),
                            SkeletonBox(width: 160, height: 11, borderRadius: 4),
                          ],
                        ),
                      ),
                    ],
                  ),
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

