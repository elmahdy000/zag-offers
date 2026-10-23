import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/services/socket_service.dart';
import '../../../../core/utils/image_url_helper.dart';
import '../../../../core/widgets/bouncy_tap.dart';
import '../../../../injection_container.dart';
import '../../domain/entities/offer_entity.dart';
import '../../../home/presentation/pages/main_screen.dart';
import '../bloc/offers_bloc.dart';
import '../bloc/offers_state.dart';
import '../pages/offer_detail_page.dart';
import '../pages/offer_loading_page.dart';
import '../pages/store_detail_page.dart';
import '../pages/store_loading_page.dart';
import '../utils/offer_filter_utils.dart';
import '../../../../core/utils/navigation_service.dart';

// Zero Gradient Invariant Constants
const Color _primaryOrange = Color(0xFFFF5A0A);
const Color _darkNavy = Color(0xFF142033);
const Color _cardDark = Color(0xFF162032);
const Color _secondaryGray = Color(0xFF718096);

class BannerItem {
  final String? id;
  final String title;
  final String subtitle;
  final String tag;
  final String image;
  final String? actionUrl;
  final String? offerId;
  final String? storeId;

  const BannerItem({
    this.id,
    required this.title,
    this.subtitle = '',
    this.tag = 'كوبون حصري',
    this.image = '',
    this.actionUrl,
    this.offerId,
    this.storeId,
  });
}

class AdsSlider extends StatefulWidget {
  const AdsSlider({super.key});

  @override
  State<AdsSlider> createState() => _AdsSliderState();
}

class _AdsSliderState extends State<AdsSlider> {
  final PageController _pageController = PageController();
  int _currentAdPage = 0;
  Timer? _adTimer;
  StreamSubscription<Map<String, dynamic>>? _bannersUpdatedSub;

  final List<BannerItem> _fallbackAds = const [
    BannerItem(
      title: 'خصومات تصل لـ 70%',
      subtitle: 'على أفضل الكافيهات والمطاعم في الزقازيق',
      tag: 'كوبون خصم',
      image: '',
      actionUrl: 'category:مطاعم',
    ),
    BannerItem(
      title: 'كوبونك وفر أكتر',
      subtitle: 'استخدم الكوبونات الحصرية النهاردة وجرب حاجة جديدة',
      tag: 'وفر أكتر',
      image: '',
      actionUrl: 'category:دلع بنات',
    ),
    BannerItem(
      title: 'أهلاً بيك في الزقازيق',
      subtitle: 'كل العروض اللي محتاجها في مكان واحد',
      tag: 'عروض حصرية',
      image: '',
      actionUrl: 'explore:all',
    ),
  ];

  List<BannerItem> _ads = [];

  @override
  void initState() {
    super.initState();
    _ads = List<BannerItem>.from(_fallbackAds);
    _startAdTimer();
    _loadBanners();
    _listenToBannerUpdates();
  }

  void _startAdTimer() {
    _adTimer?.cancel();
    _adTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      if (_pageController.hasClients && _ads.isNotEmpty) {
        final nextId = _pageController.page!.toInt() + 1;
        _pageController.animateToPage(
          nextId,
          duration: const Duration(milliseconds: 900),
          curve: Curves.fastOutSlowIn,
        );
      }
    });
  }

  Future<void> _loadBanners() async {
    try {
      final response = await sl<ApiClient>().dio.get('/offers/banners');
      final data = response.data;
      if (data is! List) return;

      final parsed = data
          .whereType<Map>()
          .map((item) => Map<String, dynamic>.from(item))
          .where((item) => (item['title'] as String?)?.trim().isNotEmpty == true)
          .map<BannerItem>((item) => BannerItem(
                id: item['id'] as String?,
                title: (item['title'] as String?)!.trim(),
                subtitle: (item['subtitle'] as String?)?.trim() ?? '',
                tag: (item['tag'] as String?)?.trim() ?? 'كوبون حصري',
                image: (item['image'] as String?)?.trim() ?? '',
                actionUrl: item['actionUrl'] as String?,
                offerId: item['offerId'] as String?,
                storeId: item['storeId'] as String?,
              ))
          .toList();

      if (!mounted || parsed.isEmpty) return;
      setState(() {
        _ads = parsed;
        _currentAdPage = 0;
      });
    } on DioException {
      // keep fallback silently
    } catch (_) {
      // keep fallback silently
    }
  }

  void _listenToBannerUpdates() {
    _bannersUpdatedSub = sl<SocketService>().onBannersUpdated.listen((_) {
      _loadBanners();
    });
  }

  // =========================================================================
  // DYNAMIC INTELLIGENT NAVIGATION (OFFER OR VENDOR PAGE)
  // =========================================================================
  Future<void> _onBannerTap(BannerItem ad) async {
    HapticFeedback.lightImpact();

    final actionUrl = ad.actionUrl?.trim() ?? '';

    // 1. Explicit offer: URI
    if (actionUrl.startsWith('offer:')) {
      final offerId = actionUrl.substring(6).trim();
      if (offerId.isNotEmpty) {
        _navigateToOffer(offerId);
        return;
      }
    }

    // 2. Explicit store: or vendor: URI
    if (actionUrl.startsWith('store:') || actionUrl.startsWith('vendor:')) {
      final storeId = (actionUrl.startsWith('store:')
              ? actionUrl.substring(6)
              : actionUrl.substring(7))
          .trim();
      if (storeId.isNotEmpty) {
        _navigateToStore(storeId);
        return;
      }
    }

    // 3. Web URL
    if (actionUrl.startsWith('http://') || actionUrl.startsWith('https://')) {
      try {
        await launchUrl(Uri.parse(actionUrl), mode: LaunchMode.externalApplication);
        return;
      } catch (_) {}
    }

    if (!mounted) return;

    // 4. Offer ID / Store ID on Banner Item
    if (ad.offerId != null && ad.offerId!.trim().isNotEmpty) {
      _navigateToOffer(ad.offerId!.trim());
      return;
    }
    if (ad.storeId != null && ad.storeId!.trim().isNotEmpty) {
      _navigateToStore(ad.storeId!.trim());
      return;
    }

    // 5. Intelligent Match Against Active Offers and Vendors
    final state = context.read<OffersBloc>().state;
    if (state is OffersLoaded) {
      final List<OfferEntity> allOffers = [
        ...state.allOffers,
        ...state.trendingOffers,
        if (state.recommendedOffers != null) ...state.recommendedOffers!,
      ];

      // A. Match category from actionUrl (e.g. category:حلى بوقك)
      if (actionUrl.startsWith('category:')) {
        final catQuery = actionUrl.substring(9).trim();
        for (final offer in allOffers) {
          if (OfferFilterUtils.matchesCategory(offer.store.category, catQuery)) {
            _navigateToOffer(offer.id);
            return;
          }
        }
      }

      // B. Match by Tag or Title against Store Category
      final tag = ad.tag.trim();
      final title = ad.title.trim();
      final subtitle = ad.subtitle.trim();

      for (final offer in allOffers) {
        if (OfferFilterUtils.matchesCategory(offer.store.category, tag) ||
            OfferFilterUtils.matchesCategory(offer.store.category, title) ||
            OfferFilterUtils.matchesCategory(offer.store.category, subtitle)) {
          _navigateToOffer(offer.id);
          return;
        }
      }

      // C. Match by search tokens against title, store name, or description
      for (final offer in allOffers) {
        if (OfferFilterUtils.matchesSearch(offer, tag) ||
            OfferFilterUtils.matchesSearch(offer, title) ||
            OfferFilterUtils.matchesSearch(offer, subtitle)) {
          _navigateToOffer(offer.id);
          return;
        }
      }

      // D. Fallback to top trending offer
      if (state.trendingOffers.isNotEmpty) {
        _navigateToOffer(state.trendingOffers.first.id);
        return;
      }

      // E. Fallback to any loaded offer
      if (allOffers.isNotEmpty) {
        _navigateToOffer(allOffers.first.id);
        return;
      }
    }

    // 6. Final fallback: Open Explore Offers screen
    MainScreen.of(context)?.setSelectedIndex(1);
  }

  void _navigateToOffer(String offerId) {
    final state = context.read<OffersBloc>().state;
    if (state is OffersLoaded) {
      OfferEntity? found;
      for (final o in state.allOffers) {
        if (o.id == offerId) {
          found = o;
          break;
        }
      }
      if (found == null) {
        for (final o in state.trendingOffers) {
          if (o.id == offerId) {
            found = o;
            break;
          }
        }
      }
      if (found != null) {
        final targetOffer = found;
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => OfferDetailPage(
              offer: targetOffer,
              heroTag: 'ad_banner_offer_${targetOffer.id}',
            ),
          ),
        );
        return;
      }
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => OfferLoadingPage(offerId: offerId),
      ),
    );
  }

  void _navigateToStore(String storeId) {
    final state = context.read<OffersBloc>().state;
    if (state is OffersLoaded) {
      final List<OfferEntity> allOffers = [
        ...state.allOffers,
        ...state.trendingOffers,
        if (state.recommendedOffers != null) ...state.recommendedOffers!,
      ];
      for (final offer in allOffers) {
        if (offer.store.id == storeId) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => StoreDetailPage(store: offer.store),
            ),
          );
          return;
        }
      }
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => StoreLoadingPage(storeId: storeId),
      ),
    );
  }

  @override
  void dispose() {
    _adTimer?.cancel();
    _bannersUpdatedSub?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final scaffoldBg = isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);

    return Column(
      children: [
        SizedBox(
          height: 165,
          child: PageView.builder(
            controller: _pageController,
            physics: const BouncingScrollPhysics(),
            onPageChanged: (index) {
              if (_ads.isNotEmpty) {
                setState(() => _currentAdPage = index % _ads.length);
              }
            },
            itemBuilder: (context, index) {
              final safeIndex = _ads.isNotEmpty ? index % _ads.length : 0;
              final ad = _ads.isNotEmpty ? _ads[safeIndex] : _fallbackAds.first;

              return BouncyTap(
                onTap: () => _onBannerTap(ad),
                scaleFactor: 0.985,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: Container(
                    decoration: BoxDecoration(
                      color: isDark ? _cardDark : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: _primaryOrange.withValues(alpha: 0.35),
                        width: 1.0,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: isDark ? 0.30 : 0.06),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Stack(
                      children: [
                        // Coupon Row: [Main Voucher Body] + [Perforation Divider] + [Ticket Stub]
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // 1. Main Voucher Body (~72% width)
                            Expanded(
                              child: _buildMainCouponBody(ad, isDark),
                            ),

                            // 2. Perforation Divider with Dashes (18px wide)
                            _buildPerforationDivider(isDark, scaffoldBg),

                            // 3. Ticket Stub (88px wide)
                            _buildTicketStub(ad, isDark),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 8),

        // Indicator Pills
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            _ads.length,
            (index) => AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: _currentAdPage == index ? 20 : 6,
              height: 5,
              decoration: BoxDecoration(
                color: _currentAdPage == index
                    ? _primaryOrange
                    : (isDark ? Colors.white24 : Colors.grey.shade300),
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // =========================================================================
  // 1. MAIN VOUCHER BODY
  // =========================================================================
  Widget _buildMainCouponBody(BannerItem ad, bool isDark) {
    final hasImage = ad.image.trim().isNotEmpty;

    return Stack(
      children: [
        // Background image with dark scrim or solid dark card
        if (hasImage) ...[
          Positioned.fill(
            child: CachedNetworkImage(
              imageUrl: ImageUrlHelper.resolve(ad.image),
              fit: BoxFit.cover,
            ),
          ),
          Positioned.fill(
            child: Container(
              color: Colors.black.withValues(alpha: 0.65),
            ),
          ),
        ] else ...[
          PositionedDirectional(
            bottom: -15,
            end: -15,
            child: Icon(
              Icons.confirmation_number_rounded,
              size: 110,
              color: _primaryOrange.withValues(alpha: isDark ? 0.05 : 0.08),
            ),
          ),
        ],

        // Content
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Top Tag Row
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: _primaryOrange,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.confirmation_number_rounded,
                          size: 10.5,
                          color: Colors.white,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          ad.tag,
                          style: GoogleFonts.cairo(
                            color: Colors.white,
                            fontSize: 10.5,
                            fontWeight: FontWeight.w800,
                            height: 1.15,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  // Scissors indicator on perforation boundary
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.content_cut_rounded,
                        size: 11.5,
                        color: _primaryOrange.withValues(alpha: 0.7),
                      ),
                      const SizedBox(width: 2.5),
                      Text(
                        'قص هنا',
                        style: GoogleFonts.cairo(
                          fontSize: 8.5,
                          color: hasImage || isDark
                              ? Colors.white54
                              : _secondaryGray,
                          fontWeight: FontWeight.w700,
                          height: 1.1,
                        ),
                      ),
                    ],
                  ),
                ],
              ),

              // Title and Subtitle
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    ad.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.cairo(
                      color: hasImage || isDark ? Colors.white : _darkNavy,
                      fontSize: 15.5,
                      fontWeight: FontWeight.w900,
                      height: 1.25,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    ad.subtitle.isNotEmpty
                        ? ad.subtitle
                        : 'خصومات وتخفيضات حصرية لجميع الأعضاء',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.cairo(
                      color: hasImage || isDark
                          ? Colors.white.withValues(alpha: 0.78)
                          : _secondaryGray,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      height: 1.2,
                    ),
                  ),
                ],
              ),

              // Bottom CTA Pill
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
                decoration: BoxDecoration(
                  color: _primaryOrange,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'احصل على الكوبون',
                      style: GoogleFonts.cairo(
                        color: Colors.white,
                        fontSize: 10.5,
                        fontWeight: FontWeight.w800,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      NavigationService.getForwardIcon(context),
                      size: 9.5,
                      color: Colors.white,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // =========================================================================
  // 2. PERFORATION DIVIDER (TOP NOTCH, VERTICAL DASHES, BOTTOM NOTCH)
  // =========================================================================
  Widget _buildPerforationDivider(bool isDark, Color scaffoldBg) {
    return SizedBox(
      width: 18,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Vertical dashed line
          CustomPaint(
            size: const Size(18, double.infinity),
            painter: _VerticalDashedPainter(
              color: isDark ? Colors.white24 : Colors.grey.shade300,
            ),
          ),

          // Top Notch (Semicircle pointing downwards)
          Positioned(
            top: -1,
            child: Container(
              width: 16,
              height: 9,
              decoration: BoxDecoration(
                color: scaffoldBg,
                borderRadius: const BorderRadius.vertical(
                  bottom: Radius.circular(9),
                ),
                border: Border(
                  bottom: BorderSide(
                    color: _primaryOrange.withValues(alpha: 0.4),
                    width: 1.0,
                  ),
                  left: BorderSide(
                    color: _primaryOrange.withValues(alpha: 0.4),
                    width: 1.0,
                  ),
                  right: BorderSide(
                    color: _primaryOrange.withValues(alpha: 0.4),
                    width: 1.0,
                  ),
                ),
              ),
            ),
          ),

          // Bottom Notch (Semicircle pointing upwards)
          Positioned(
            bottom: -1,
            child: Container(
              width: 16,
              height: 9,
              decoration: BoxDecoration(
                color: scaffoldBg,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(9),
                ),
                border: Border(
                  top: BorderSide(
                    color: _primaryOrange.withValues(alpha: 0.4),
                    width: 1.0,
                  ),
                  left: BorderSide(
                    color: _primaryOrange.withValues(alpha: 0.4),
                    width: 1.0,
                  ),
                  right: BorderSide(
                    color: _primaryOrange.withValues(alpha: 0.4),
                    width: 1.0,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // 3. TICKET STUB (END / LEFT SIDE IN RTL)
  // =========================================================================
  Widget _buildTicketStub(BannerItem ad, bool isDark) {
    return Container(
      width: 88,
      color: isDark ? const Color(0xFF131B2A) : const Color(0xFFFFF3EC),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 10),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Circular Coupon Icon Badge
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: _primaryOrange.withValues(alpha: 0.12),
              shape: BoxShape.circle,
              border: Border.all(
                color: _primaryOrange.withValues(alpha: 0.35),
                width: 1,
              ),
            ),
            child: const Center(
              child: Icon(
                Icons.confirmation_number_rounded,
                color: _primaryOrange,
                size: 19,
              ),
            ),
          ),
          const SizedBox(height: 5),

          // Stub Title
          Text(
            'قسيمة خصم',
            textAlign: TextAlign.center,
            style: GoogleFonts.cairo(
              color: _primaryOrange,
              fontSize: 10.5,
              fontWeight: FontWeight.w900,
              height: 1.15,
            ),
          ),
          const SizedBox(height: 6),

          // Mini Stylized Barcode
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildBarcodeLine(1.5, 16, isDark),
              const SizedBox(width: 2),
              _buildBarcodeLine(2.5, 16, isDark),
              const SizedBox(width: 2),
              _buildBarcodeLine(1.0, 16, isDark),
              const SizedBox(width: 2.5),
              _buildBarcodeLine(2.0, 16, isDark),
              const SizedBox(width: 2),
              _buildBarcodeLine(1.2, 16, isDark),
              const SizedBox(width: 2),
              _buildBarcodeLine(3.0, 16, isDark),
              const SizedBox(width: 2),
              _buildBarcodeLine(1.0, 16, isDark),
            ],
          ),
          const SizedBox(height: 6),

          // Action prompt
          Text(
            'اضغط للتفعيل',
            textAlign: TextAlign.center,
            style: GoogleFonts.cairo(
              color: isDark ? Colors.grey.shade400 : _secondaryGray,
              fontSize: 9.0,
              fontWeight: FontWeight.w700,
              height: 1.1,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBarcodeLine(double width, double height, bool isDark) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: isDark ? Colors.white30 : _darkNavy.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(0.5),
      ),
    );
  }
}

// ===========================================================================
// VERTICAL DASHED LINE PAINTER FOR TICKET NOTCH DIVIDER
// ===========================================================================
class _VerticalDashedPainter extends CustomPainter {
  final Color color;

  const _VerticalDashedPainter({
    required this.color,
  });

  static const double _dashHeight = 3.5;
  static const double _dashSpace = 3.0;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1.2
      ..style = PaintingStyle.stroke;

    double startY = 10;
    final endY = size.height - 10;
    final x = size.width / 2;

    while (startY < endY) {
      final nextY = (startY + _dashHeight).clamp(0.0, endY);
      canvas.drawLine(
        Offset(x, startY),
        Offset(x, nextY),
        paint,
      );
      startY += _dashHeight + _dashSpace;
    }
  }

  @override
  bool shouldRepaint(covariant _VerticalDashedPainter oldDelegate) =>
      color != oldDelegate.color;
}
