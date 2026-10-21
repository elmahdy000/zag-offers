import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/services/location_service.dart';
import '../../../../core/services/socket_service.dart';
import '../../../../core/utils/snackbar_utils.dart';
import '../../../../core/widgets/bouncy_tap.dart';
import '../../../../core/widgets/network_image_widget.dart';
import '../../../../core/widgets/skeleton_loader.dart';
import '../../../../injection_container.dart';
import '../../../reviews/presentation/bloc/reviews_bloc.dart';
import '../../domain/entities/offer_entity.dart';
import '../../domain/entities/store_entity.dart';
import '../bloc/offers_bloc.dart';
import '../bloc/offers_event.dart';
import '../bloc/offers_state.dart';
import '../utils/offer_pricing_utils.dart';
import 'offer_detail_page.dart';

class StoreDetailPage extends StatefulWidget {
  final StoreEntity store;

  const StoreDetailPage({super.key, required this.store});

  @override
  State<StoreDetailPage> createState() => _StoreDetailPageState();
}

class _StoreDetailPageState extends State<StoreDetailPage> {
  // Brand Color Palette (Strictly Flat - NO Gradients)
  static const Color _primaryOrange = Color(0xFFFF5A0A);
  static const Color _darkNavy = Color(0xFF142033);
  static const Color _lightBg = Color(0xFFF8F9FB);
  static const Color _secondaryGray = Color(0xFF718096);

  late final OffersBloc _offersBloc;
  late final ReviewsBloc _reviewsBloc;
  StreamSubscription<Map<String, dynamic>>? _reviewReplySubscription;

  @override
  void initState() {
    super.initState();
    _offersBloc = sl<OffersBloc>()..add(FetchStoreOffers(widget.store.id));
    _reviewsBloc = sl<ReviewsBloc>()..add(FetchStoreReviews(widget.store.id));
    _reviewReplySubscription = sl<SocketService>().onReviewReply.listen((data) {
      final reviewId = data['reviewId']?.toString();
      final merchantReply = data['merchantReply']?.toString();
      final replyCreatedAtStr = data['replyCreatedAt']?.toString();
      if (reviewId != null && merchantReply != null && replyCreatedAtStr != null) {
        final replyCreatedAt = DateTime.tryParse(replyCreatedAtStr) ?? DateTime.now();
        _reviewsBloc.add(ReviewReplyReceived(
          reviewId: reviewId,
          merchantReply: merchantReply,
          replyCreatedAt: replyCreatedAt,
        ));
      }
    });
  }

  @override
  void dispose() {
    _reviewReplySubscription?.cancel();
    super.dispose();
  }

  Future<void> _launchUrl(BuildContext context, String url) async {
    try {
      final uri = Uri.parse(url);
      if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
        if (!context.mounted) return;
        SnackBarUtils.showError(context, 'تعذر فتح التطبيق المطلوب على هذا الجهاز');
      }
    } catch (_) {
      if (!context.mounted) return;
      SnackBarUtils.showError(context, 'تعذر فتح التطبيق المطلوب على هذا الجهاز');
    }
  }

  String _cleanWhatsAppNumber(String raw) {
    final digits = raw.replaceAll(RegExp(r'\D'), '');
    if (digits.startsWith('01') && digits.length == 11) {
      return '20${digits.substring(1)}';
    }
    if (digits.startsWith('201') && digits.length == 12) {
      return digits;
    }
    if (digits.startsWith('00201')) {
      return digits.substring(2);
    }
    return digits;
  }

  Future<void> _openExternalMap() async {
    final store = widget.store;
    Uri? uri;
    if (store.locationUrl != null && store.locationUrl!.trim().isNotEmpty) {
      uri = Uri.tryParse(store.locationUrl!);
    } else if (store.latitude != null && store.longitude != null) {
      uri = Uri.parse(
        'https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}',
      );
    } else {
      final queryText = '${store.address ?? store.area}, الزقازيق';
      uri = Uri.parse(
        'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(queryText)}',
      );
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

  void _showFullScreenGallery(BuildContext context, int initialIndex) {
    final images = widget.store.images ?? [];
    if (images.isEmpty) return;

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => Scaffold(
          backgroundColor: Colors.black,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.close_rounded, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
          ),
          body: PageView.builder(
            itemCount: images.length,
            controller: PageController(initialPage: initialIndex),
            itemBuilder: (context, index) {
              return Center(
                child: InteractiveViewer(
                  child: NetworkImageWidget(
                    imageUrl: images[index],
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
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final scaffoldBg = isDark ? const Color(0xFF0F172A) : _lightBg;

    return MultiBlocProvider(
      providers: [
        BlocProvider.value(value: _offersBloc),
        BlocProvider.value(value: _reviewsBloc),
      ],
      child: Scaffold(
        backgroundColor: scaffoldBg,
        body: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            _buildSliverAppBar(context, isDark),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 14),
                    _buildStoreIdentity(context, isDark),
                    const SizedBox(height: 16),
                    _buildLocationCard(context, isDark),
                    if (widget.store.images != null && widget.store.images!.isNotEmpty) ...[
                      const SizedBox(height: 22),
                      _buildGallerySection(context, isDark),
                    ],
                    const SizedBox(height: 22),
                    _buildOffersSectionHeader(context, isDark),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            ),
            _buildOffersList(context, isDark),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(18, 24, 18, 12),
                child: _buildReviewsSectionHeader(context, isDark),
              ),
            ),
            _buildReviewsList(context, isDark),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 48 + MediaQuery.paddingOf(context).bottom,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // =========================================================================
  // 1. COMPACT, BRAND-DISTINCTIVE FLAT HEADER (NO GRADIENTS)
  // =========================================================================
  Widget _buildSliverAppBar(BuildContext context, bool isDark) {
    final hasCover = widget.store.coverImage != null && widget.store.coverImage!.trim().isNotEmpty;
    final initial = widget.store.name.trim().isNotEmpty
        ? widget.store.name.trim().characters.first
        : 'Z';

    return SliverAppBar(
      expandedHeight: 180,
      pinned: true,
      elevation: 0,
      backgroundColor: _darkNavy,
      leading: Padding(
        padding: const EdgeInsets.all(8),
        child: Container(
          decoration: BoxDecoration(
            color: _darkNavy.withValues(alpha: 0.85),
            shape: BoxShape.circle,
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.18),
              width: 0.8,
            ),
          ),
          child: IconButton(
            padding: EdgeInsets.zero,
            icon: const Icon(
              Icons.arrow_back_ios_new_rounded,
              size: 16,
              color: Colors.white,
            ),
            onPressed: () => Navigator.pop(context),
          ),
        ),
      ),
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            // Solid dark background or photo with flat solid scrim
            if (hasCover)
              ColorFiltered(
                colorFilter: ColorFilter.mode(
                  Colors.black.withValues(alpha: 0.45),
                  BlendMode.darken,
                ),
                child: NetworkImageWidget(
                  imageUrl: widget.store.coverImage!,
                  fit: BoxFit.cover,
                ),
              )
            else
              Container(
                color: _darkNavy,
                child: Stack(
                  children: [
                    // Flat geometric accent blocks (strictly solid colors)
                    Positioned(
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      child: Container(color: _primaryOrange),
                    ),
                    PositionedDirectional(
                      top: 40,
                      end: -30,
                      child: Container(
                        width: 140,
                        height: 140,
                        decoration: BoxDecoration(
                          color: const Color(0xFF1B2A40),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                    PositionedDirectional(
                      bottom: -20,
                      start: 40,
                      child: Container(
                        width: 90,
                        height: 90,
                        decoration: BoxDecoration(
                          color: const Color(0xFF101928),
                          borderRadius: BorderRadius.circular(20),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            // Top solid accent line if photo is active
            if (hasCover)
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                child: Container(color: _primaryOrange),
              ),

            // Store Monogram / Logo Badge anchored at bottom start
            PositionedDirectional(
              bottom: 14,
              start: 18,
              child: Container(
                width: 72,
                height: 72,
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF162032) : Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: _primaryOrange, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.22),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(13),
                  child: (widget.store.logo != null && widget.store.logo!.trim().isNotEmpty)
                      ? NetworkImageWidget(
                          imageUrl: widget.store.logo!,
                          width: 66,
                          height: 66,
                          fit: BoxFit.cover,
                        )
                      : Container(
                          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFFFF3EC),
                          child: Center(
                            child: Text(
                              initial,
                              style: GoogleFonts.cairo(
                                color: _primaryOrange,
                                fontSize: 30,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                        ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // =========================================================================
  // 2. STORE IDENTITY, CATEGORY & ACTIONS (NO REPETITION)
  // =========================================================================
  Widget _buildStoreIdentity(BuildContext context, bool isDark) {
    final hasPhone = widget.store.phone != null && widget.store.phone!.trim().isNotEmpty;
    final hasWhatsapp = widget.store.whatsapp != null && widget.store.whatsapp!.trim().isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Store Name + Verified Icon
        Row(
          children: [
            Expanded(
              child: Text(
                widget.store.name,
                style: GoogleFonts.cairo(
                  fontSize: 21,
                  fontWeight: FontWeight.w900,
                  height: 1.25,
                  color: isDark ? Colors.white : _darkNavy,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
              decoration: BoxDecoration(
                color: const Color(0xFFE0F2FE),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.verified_rounded, size: 13, color: Color(0xFF0284C7)),
                  const SizedBox(width: 3),
                  Text(
                    'موثق',
                    style: GoogleFonts.cairo(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF0284C7),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),

        const SizedBox(height: 8),

        // Metadata Pills Row: Category • Area • Rating
        Wrap(
          spacing: 8,
          runSpacing: 6,
          children: [
            // Category Pill
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : const Color(0xFFFFF3EC),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                widget.store.category ?? 'متجر',
                style: GoogleFonts.cairo(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w800,
                  color: _primaryOrange,
                ),
              ),
            ),

            // Area Pill
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF162032) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE2E8F0),
                  width: 0.8,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.location_on_outlined,
                    size: 13,
                    color: isDark ? Colors.grey.shade400 : _secondaryGray,
                  ),
                  const SizedBox(width: 3),
                  Text(
                    'الزقازيق، ${widget.store.area}',
                    style: GoogleFonts.cairo(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.grey.shade300 : const Color(0xFF334155),
                    ),
                  ),
                ],
              ),
            ),

            // Rating Pill (if rated)
            if (widget.store.rating > 0)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4.5),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.star_rounded, size: 14, color: Color(0xFFD97706)),
                    const SizedBox(width: 3),
                    Text(
                      widget.store.rating.toStringAsFixed(1),
                      style: const TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF92400E),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),

        // Quick Contact Actions (Flat, Compact)
        if (hasPhone || hasWhatsapp) ...[
          const SizedBox(height: 12),
          Row(
            children: [
              if (hasPhone)
                Expanded(
                  child: BouncyTap(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      final cleanPhone = widget.store.phone!.replaceAll(RegExp(r'\s+'), '');
                      _launchUrl(context, 'tel:$cleanPhone');
                    },
                    child: Container(
                      height: 40,
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.phone_rounded,
                            size: 15,
                            color: isDark ? Colors.grey.shade300 : const Color(0xFF1E293B),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'اتصال هاتفياً',
                            style: GoogleFonts.cairo(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.grey.shade200 : const Color(0xFF1E293B),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              if (hasPhone && hasWhatsapp)
                const SizedBox(width: 8),
              if (hasWhatsapp)
                Expanded(
                  child: BouncyTap(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      final cleanNumber = _cleanWhatsAppNumber(widget.store.whatsapp!);
                      _launchUrl(context, 'https://wa.me/$cleanNumber');
                    },
                    child: Container(
                      height: 40,
                      decoration: BoxDecoration(
                        color: const Color(0xFFDCFCE7),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFF86EFAC)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.chat_bubble_rounded, size: 15, color: Color(0xFF15803D)),
                          const SizedBox(width: 6),
                          Text(
                            'مراسلة واتساب',
                            style: GoogleFonts.cairo(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF15803D),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ],
    );
  }

  // =========================================================================
  // 3. REFINED LOCATION & ROUTE SECTION (NO GRADIENTS, COMPACT)
  // =========================================================================
  Widget _buildLocationCard(BuildContext context, bool isDark) {
    final store = widget.store;
    final detailedAddress = (store.address != null && store.address!.trim().isNotEmpty)
        ? store.address!
        : 'الزقازيق، ${store.area}';
    final distanceText = LocationService.getFormattedDistanceTo(store.latitude, store.longitude);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF162032) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE2E8F0),
          width: 0.9,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row: Pin Icon + Area Title + Copy Action
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: _primaryOrange,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.place_rounded,
                  color: Colors.white,
                  size: 17,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'عنوان المتجر',
                      style: GoogleFonts.cairo(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : _darkNavy,
                      ),
                    ),
                    if (distanceText != null)
                      Row(
                        children: [
                          const Icon(Icons.near_me_rounded, size: 10.5, color: _primaryOrange),
                          const SizedBox(width: 3),
                          Text(
                            'يبعد $distanceText عن موقعك',
                            style: GoogleFonts.cairo(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: _primaryOrange,
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
              BouncyTap(
                onTap: () {
                  Clipboard.setData(ClipboardData(text: '$detailedAddress - ${store.name}'));
                  HapticFeedback.lightImpact();
                  SnackBarUtils.showSuccess(context, 'تم نسخ العنوان بنجاح 📋');
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.copy_rounded, size: 12, color: isDark ? Colors.grey.shade300 : _darkNavy),
                      const SizedBox(width: 4),
                      Text(
                        'نسخ',
                        style: GoogleFonts.cairo(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.grey.shade300 : _darkNavy,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          // Address Line
          Text(
            detailedAddress,
            style: GoogleFonts.cairo(
              fontSize: 12.5,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.grey.shade300 : const Color(0xFF475569),
              height: 1.4,
            ),
          ),

          // Working Hours (if available)
          if (store.workingHours != null && store.workingHours!.trim().isNotEmpty) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  Icons.schedule_rounded,
                  size: 13,
                  color: isDark ? Colors.grey.shade400 : _secondaryGray,
                ),
                const SizedBox(width: 5),
                Expanded(
                  child: Text(
                    'مواعيد العمل: ${store.workingHours}',
                    style: GoogleFonts.cairo(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.grey.shade400 : _secondaryGray,
                    ),
                  ),
                ),
              ],
            ),
          ],

          const SizedBox(height: 12),

          // Solid Orange Directions Button (Flat, NO Gradients)
          BouncyTap(
            onTap: () {
              HapticFeedback.mediumImpact();
              _openExternalMap();
            },
            child: Container(
              height: 42,
              decoration: BoxDecoration(
                color: _primaryOrange,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.navigation_rounded, size: 16, color: Colors.white),
                  const SizedBox(width: 6),
                  Text(
                    'طريق الوصول (خرائط Google)',
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
    );
  }

  // =========================================================================
  // 4. STORE PHOTO GALLERY
  // =========================================================================
  Widget _buildGallerySection(BuildContext context, bool isDark) {
    final images = widget.store.images ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle(title: 'صور من المتجر', isDark: isDark),
        const SizedBox(height: 10),
        SizedBox(
          height: 96,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            itemCount: images.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (context, index) {
              return BouncyTap(
                onTap: () {
                  HapticFeedback.lightImpact();
                  _showFullScreenGallery(context, index);
                },
                child: Container(
                  width: 130,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE2E8F0),
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
        ),
      ],
    );
  }

  // =========================================================================
  // 5. AVAILABLE OFFERS (MAIN ATTRACTION - PROMINENT DISCOUNT & PRICING)
  // =========================================================================
  Widget _buildOffersSectionHeader(BuildContext context, bool isDark) {
    return BlocBuilder<OffersBloc, OffersState>(
      buildWhen: (prev, next) => next is StoreOffersLoaded,
      builder: (context, state) {
        final count = (state is StoreOffersLoaded) ? state.offers.length : 0;
        return Row(
          children: [
            _buildSectionTitle(title: 'العروض المتاحة', isDark: isDark),
            const Spacer(),
            if (count > 0)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFFFF3EC),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '$count عروض حصرية',
                  style: GoogleFonts.cairo(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: _primaryOrange,
                  ),
                ),
              ),
          ],
        );
      },
    );
  }

  Widget _buildOffersList(BuildContext context, bool isDark) {
    return BlocBuilder<OffersBloc, OffersState>(
      buildWhen: (prev, next) => next is StoreOffersLoaded || next is StoreOffersLoading,
      builder: (context, state) {
        if (state is StoreOffersLoading) {
          return SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (_, __) => const Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: CardSkeleton(),
                ),
                childCount: 3,
              ),
            ),
          );
        }

        if (state is StoreOffersLoaded) {
          if (state.offers.isEmpty) {
            return SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 18),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF162032) : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Column(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.local_offer_outlined, color: _secondaryGray, size: 22),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'لا توجد عروض نشطة حالياً',
                        style: GoogleFonts.cairo(
                          fontWeight: FontWeight.w800,
                          fontSize: 13.5,
                          color: isDark ? Colors.white : _darkNavy,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'تابع المتجر لمعرفة أحدث الخصومات فور إضافتها!',
                        style: GoogleFonts.cairo(
                          fontSize: 11.5,
                          color: _secondaryGray,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }

          return SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 18),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) => _buildOfferCard(context, state.offers[index], isDark),
                childCount: state.offers.length,
              ),
            ),
          );
        }

        return SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 18),
            child: Center(
              child: Text(
                'تعذر تحميل العروض حالياً',
                style: GoogleFonts.cairo(fontSize: 12.5, color: _secondaryGray),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildOfferCard(BuildContext context, OfferEntity offer, bool isDark) {
    final pricing = OfferPricingResult.fromOffer(offer);
    final String discountBadge = pricing.topDiscountBadge.isNotEmpty
        ? (pricing.topDiscountBadge.endsWith('%')
            ? 'خصم ${pricing.topDiscountBadge}'
            : 'خصم ${pricing.topDiscountBadge}%')
        : 'خصم خاص';

    final imageUrl = offer.image ?? (offer.images?.isNotEmpty == true ? offer.images!.first : null);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF162032) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE2E8F0),
          width: 0.9,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            HapticFeedback.lightImpact();
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => OfferDetailPage(offer: offer)),
            );
          },
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Offer Thumbnail with Solid Discount Overlay
                Stack(
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE2E8F0),
                        ),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: imageUrl != null
                          ? NetworkImageWidget(imageUrl: imageUrl, fit: BoxFit.cover)
                          : Center(
                              child: Icon(Icons.local_offer_outlined, color: Colors.grey.shade400, size: 28),
                            ),
                    ),
                  ],
                ),

                const SizedBox(width: 12),

                // Offer Info & Pricing Hierarchy
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Prominent Flat Discount Pill
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                        decoration: BoxDecoration(
                          color: _primaryOrange,
                          borderRadius: BorderRadius.circular(5),
                        ),
                        child: Text(
                          discountBadge,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10.5,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),

                      const SizedBox(height: 5),

                      // Offer Title
                      Text(
                        offer.title,
                        style: GoogleFonts.cairo(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : _darkNavy,
                          height: 1.3,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),

                      const SizedBox(height: 6),

                      // Mathematical Pricing Breakdown
                      if (pricing.hasExplicitPrices) ...[
                        Row(
                          children: [
                            if (pricing.finalPrice != null)
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                textDirection: TextDirection.rtl,
                                children: [
                                  Text(
                                    pricing.finalPrice!.toStringAsFixed(0),
                                    style: const TextStyle(
                                      color: _primaryOrange,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 14.5,
                                    ),
                                  ),
                                  const SizedBox(width: 2),
                                  const Text(
                                    'ج.م',
                                    style: TextStyle(
                                      color: _primaryOrange,
                                      fontWeight: FontWeight.w800,
                                      fontSize: 10.5,
                                    ),
                                  ),
                                ],
                              ),
                            if (pricing.originalPrice != null) ...[
                              const SizedBox(width: 8),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                textDirection: TextDirection.rtl,
                                children: [
                                  Text(
                                    pricing.originalPrice!.toStringAsFixed(0),
                                    style: TextStyle(
                                      decoration: TextDecoration.lineThrough,
                                      color: isDark ? Colors.grey.shade400 : _secondaryGray,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 11.5,
                                    ),
                                  ),
                                  const SizedBox(width: 2),
                                  Text(
                                    'ج.م',
                                    style: TextStyle(
                                      decoration: TextDecoration.lineThrough,
                                      color: isDark ? Colors.grey.shade400 : _secondaryGray,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 9.5,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                            if (pricing.hasSavings) ...[
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFDCFCE7),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  'وفر ${pricing.savingsAmount.toStringAsFixed(0)} ج.م',
                                  style: const TextStyle(
                                    color: Color(0xFF15803D),
                                    fontWeight: FontWeight.w800,
                                    fontSize: 9.5,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ] else ...[
                        Text(
                          'العرض متاح داخل الفرع بالكوبون',
                          style: GoogleFonts.cairo(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: isDark ? Colors.grey.shade400 : _secondaryGray,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),

                const SizedBox(width: 6),

                // Subtle Circle Arrow Action
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Icon(
                    Icons.arrow_forward_ios_rounded,
                    size: 11,
                    color: isDark ? Colors.grey.shade400 : _secondaryGray,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // =========================================================================
  // 6. CUSTOMER REVIEWS (ELEGANT, BALANCED CARDS & EMPTY STATE)
  // =========================================================================
  Widget _buildReviewsSectionHeader(BuildContext context, bool isDark) {
    return BlocBuilder<ReviewsBloc, ReviewsState>(
      buildWhen: (prev, next) => next is ReviewsLoaded,
      builder: (context, state) {
        final reviews = (state is ReviewsLoaded) ? state.reviews : [];
        return Row(
          children: [
            _buildSectionTitle(title: 'آراء العملاء', isDark: isDark),
            const Spacer(),
            if (reviews.isNotEmpty)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '${reviews.length} تقييم',
                  style: GoogleFonts.cairo(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.grey.shade300 : _darkNavy,
                  ),
                ),
              ),
          ],
        );
      },
    );
  }

  Widget _buildReviewsList(BuildContext context, bool isDark) {
    return BlocBuilder<ReviewsBloc, ReviewsState>(
      buildWhen: (prev, next) => next is ReviewsLoaded || next is ReviewsLoading,
      builder: (context, state) {
        if (state is ReviewsLoading) {
          return SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (_, __) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: AppShimmer(
                    child: Container(
                      height: 90,
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF162032) : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      padding: const EdgeInsets.all(12),
                      child: const Row(
                        children: [
                          SkeletonCircle(size: 44),
                          SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                SkeletonBox(width: 100, height: 14, borderRadius: 4),
                                SizedBox(height: 8),
                                SkeletonBox(width: double.infinity, height: 12, borderRadius: 4),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                childCount: 2,
              ),
            ),
          );
        }

        if (state is ReviewsLoaded) {
          if (state.reviews.isEmpty) {
            return SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 18),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF162032) : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFFFF3EC),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.rate_review_outlined, color: _primaryOrange, size: 19),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'لا توجد تقييمات بعد',
                              style: GoogleFonts.cairo(
                                fontWeight: FontWeight.w800,
                                fontSize: 13,
                                color: isDark ? Colors.white : _darkNavy,
                              ),
                            ),
                            Text(
                              'كن أول من يشارك تجربته مع هذا المتجر عند إبراز الكوبون!',
                              style: GoogleFonts.cairo(
                                fontSize: 11,
                                color: _secondaryGray,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }

          return SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 18),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final review = state.reviews[index];
                  final initial = review.customerName.trim().isNotEmpty
                      ? review.customerName.trim().characters.first
                      : 'U';

                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF162032) : Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE2E8F0),
                        width: 0.9,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Customer Initial + Name + Star Rating
                        Row(
                          children: [
                            Container(
                              width: 30,
                              height: 30,
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF1E293B) : const Color(0xFFFFF3EC),
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: Text(
                                  initial,
                                  style: GoogleFonts.cairo(
                                    color: _primaryOrange,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                review.customerName,
                                style: GoogleFonts.cairo(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 13,
                                  color: isDark ? Colors.white : _darkNavy,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: List.generate(
                                5,
                                (i) => Icon(
                                  Icons.star_rounded,
                                  size: 14,
                                  color: i < review.rating ? const Color(0xFFF59E0B) : const Color(0xFFE2E8F0),
                                ),
                              ),
                            ),
                          ],
                        ),

                        if (review.comment != null && review.comment!.trim().isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Text(
                            review.comment!,
                            style: GoogleFonts.cairo(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isDark ? Colors.grey.shade300 : const Color(0xFF475569),
                              height: 1.4,
                            ),
                          ),
                        ],

                        // Merchant Reply Sub-Card
                        if (review.merchantReply != null && review.merchantReply!.trim().isNotEmpty) ...[
                          const SizedBox(height: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8F9FA),
                              borderRadius: BorderRadius.circular(8),
                              border: BorderDirectional(
                                start: const BorderSide(color: _primaryOrange, width: 3),
                                top: BorderSide(
                                  color: isDark ? Colors.white.withValues(alpha: 0.05) : const Color(0xFFE2E8F0),
                                ),
                                end: BorderSide(
                                  color: isDark ? Colors.white.withValues(alpha: 0.05) : const Color(0xFFE2E8F0),
                                ),
                                bottom: BorderSide(
                                  color: isDark ? Colors.white.withValues(alpha: 0.05) : const Color(0xFFE2E8F0),
                                ),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Icon(Icons.storefront_rounded, size: 12, color: _primaryOrange),
                                    const SizedBox(width: 4),
                                    Text(
                                      'رد المتجر',
                                      style: GoogleFonts.cairo(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w800,
                                        color: _primaryOrange,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  review.merchantReply!,
                                  style: GoogleFonts.cairo(
                                    fontSize: 11.5,
                                    color: isDark ? Colors.grey.shade300 : const Color(0xFF475569),
                                    height: 1.35,
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
                childCount: state.reviews.length,
              ),
            ),
          );
        }

        return const SliverToBoxAdapter(child: SizedBox.shrink());
      },
    );
  }

  // =========================================================================
  // HELPER: SIGNATURE SECTION TITLE WITH ORANGE ACCENT PILLAR
  // =========================================================================
  Widget _buildSectionTitle({required String title, required bool isDark}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 3.5,
          height: 16,
          decoration: BoxDecoration(
            color: _primaryOrange,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 7),
        Text(
          title,
          style: GoogleFonts.cairo(
            fontSize: 16,
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white : _darkNavy,
          ),
        ),
      ],
    );
  }
}
