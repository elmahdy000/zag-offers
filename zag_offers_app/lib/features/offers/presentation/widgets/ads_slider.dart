import 'dart:async';
import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';

class AdsSlider extends StatefulWidget {
  const AdsSlider({super.key});

  @override
  State<AdsSlider> createState() => _AdsSliderState();
}

class _AdsSliderState extends State<AdsSlider> {
  final PageController _pageController = PageController();
  int _currentAdPage = 0;
  Timer? _adTimer;

  final List<Map<String, String>> ads = [
    {'title': 'خصومات تصل لـ 70%', 'subtitle': 'على أفضل الكافيهات والمطاعم في الزقازيق', 'tag': 'عرض لفترة محدودة ⚡'},
    {'title': 'كوبونك وفر أكتر', 'subtitle': 'استخدم الكوبونات الحصرية النهاردة وجرب حاجة جديدة', 'tag': 'وفر أكتر 💰'},
    {'title': 'أهلاً بيك في الزقازيق', 'subtitle': 'كل العروض اللي محتاجها في مكان واحد', 'tag': 'اكتشف المدينة ✨'},
  ];

  @override
  void initState() {
    super.initState();
    _startAdTimer();
  }

  void _startAdTimer() {
    _adTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      if (_pageController.hasClients) {
        int nextId = _pageController.page!.toInt() + 1;
        _pageController.animateToPage(
          nextId,
          duration: const Duration(milliseconds: 1000),
          curve: Curves.fastOutSlowIn,
        );
      }
    });
  }

  @override
  void dispose() {
    _adTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          height: 170,
          child: PageView.builder(
            controller: _pageController,
            physics: const BouncingScrollPhysics(),
            onPageChanged: (index) => setState(() => _currentAdPage = index % ads.length),
            itemBuilder: (context, index) {
              final ad = ads[index % ads.length];
              final isEven = (index % ads.length) % 2 == 0;
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    gradient: LinearGradient(
                      colors: isEven 
                        ? [AppColors.primary, AppColors.primary.withValues(alpha: 0.8)]
                        : [const Color(0xFF1A1A1A), const Color(0xFF333333)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
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
                      Positioned(
                        right: -15,
                        top: -15,
                        child: Icon(
                          isEven ? Icons.stars_rounded : Icons.local_fire_department_rounded, 
                          size: 110, 
                          color: Colors.white.withValues(alpha: 0.08)
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
                                ad['tag']!,
                                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                    ),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              ad['title']!,
                              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 20,
                                  ),
                            ),
                            Text(
                              ad['subtitle']!,
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
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
              );
            },
          ),
        ),
        const SizedBox(height: 4),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(ads.length, (index) => AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            margin: const EdgeInsets.symmetric(horizontal: 3),
            width: _currentAdPage == index ? 18 : 6,
            height: 6,
            decoration: BoxDecoration(
              color: _currentAdPage == index ? AppColors.primary : Colors.grey[300],
              borderRadius: BorderRadius.circular(3),
            ),
          )),
        ),
      ],
    );
  }
}
