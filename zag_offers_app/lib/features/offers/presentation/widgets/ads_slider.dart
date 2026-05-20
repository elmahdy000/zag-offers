import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/services/socket_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_url_helper.dart';
import '../../../../injection_container.dart';
import '../pages/offer_loading_page.dart';
import '../pages/store_loading_page.dart';

class BannerItem {
  final String title;
  final String subtitle;
  final String tag;
  final String image;
  final String? actionUrl;

  const BannerItem({
    required this.title,
    this.subtitle = '',
    this.tag = 'عرض مميز',
    this.image = '',
    this.actionUrl,
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

  final List<BannerItem> _fallbackAds = [
    const BannerItem(
      title: 'خصومات تصل لـ 70%',
      subtitle: 'على أفضل الكافيهات والمطاعم في الزقازيق',
      tag: 'عرض لفترة محدودة',
      image: '',
    ),
    const BannerItem(
      title: 'كوبونك وفر أكتر',
      subtitle: 'استخدم الكوبونات الحصرية النهاردة وجرب حاجة جديدة',
      tag: 'وفر أكتر',
      image: '',
    ),
    const BannerItem(
      title: 'أهلاً بيك في الزقازيق',
      subtitle: 'كل العروض اللي محتاجها في مكان واحد',
      tag: 'اكتشف المدينة',
      image: '',
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
    _adTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      if (_pageController.hasClients && _ads.isNotEmpty) {
        final nextId = _pageController.page!.toInt() + 1;
        _pageController.animateToPage(
          nextId,
          duration: const Duration(milliseconds: 1000),
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
                title: (item['title'] as String?)!.trim(),
                subtitle: (item['subtitle'] as String?)?.trim() ?? '',
                tag: (item['tag'] as String?)?.trim() ?? 'عرض مميز',
                image: (item['image'] as String?)?.trim() ?? '',
                actionUrl: item['actionUrl'] as String?,
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

  void _onBannerTap(BannerItem ad) {
    final actionUrl = ad.actionUrl;
    if (actionUrl == null || actionUrl.isEmpty) return;

    if (actionUrl.startsWith('offer:')) {
      final offerId = actionUrl.substring(6);
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => OfferLoadingPage(offerId: offerId),
        ),
      );
    } else if (actionUrl.startsWith('store:')) {
      final storeId = actionUrl.substring(6);
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => StoreLoadingPage(storeId: storeId),
        ),
      );
    } else if (actionUrl.startsWith('http://') || actionUrl.startsWith('https://')) {
      launchUrl(Uri.parse(actionUrl), mode: LaunchMode.externalApplication);
    }
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
    final textTheme = Theme.of(context).textTheme;
    return Column(
      children: [
        SizedBox(
          height: 170,
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
              final isEven = safeIndex % 2 == 0;
              final image = ad.image;

              return GestureDetector(
                onTap: () => _onBannerTap(ad),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(24),
                      image: image.isNotEmpty
                          ? DecorationImage(
                              image: CachedNetworkImageProvider(ImageUrlHelper.resolve(image)),
                              fit: BoxFit.cover,
                            )
                          : null,
                      gradient: image.isEmpty
                          ? LinearGradient(
                              colors: isEven
                                  ? [AppColors.primary, AppColors.primary.withValues(alpha: 0.8)]
                                  : [const Color(0xFF1A1A1A), const Color(0xFF333333)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            )
                          : null,
                      boxShadow: [
                        BoxShadow(
                          color: (isEven ? AppColors.primary : Colors.black).withValues(alpha: 0.15),
                          blurRadius: 12,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Stack(
                      children: [
                        if (image.isNotEmpty)
                          Positioned.fill(
                            child: Container(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(24),
                                color: Colors.black.withValues(alpha: 0.35),
                              ),
                            ),
                          ),
                        Positioned(
                          right: -15,
                          top: -15,
                          child: Icon(
                            isEven ? Icons.stars_rounded : Icons.local_fire_department_rounded,
                            size: 110,
                            color: Colors.white.withValues(alpha: 0.08),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(20.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  ad.tag,
                                  style: textTheme.labelSmall?.copyWith(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                      ),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                ad.title,
                                style: textTheme.headlineSmall?.copyWith(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 20,
                                    ),
                              ),
                              Text(
                                ad.subtitle,
                                style: textTheme.bodySmall?.copyWith(
                                      color: Colors.white.withValues(alpha: 0.8),
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
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 4),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            _ads.length,
            (index) => AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: _currentAdPage == index ? 18 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: _currentAdPage == index ? AppColors.primary : Colors.grey[300],
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
