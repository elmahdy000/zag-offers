import 'package:flutter/material.dart';
import 'package:flutter_iconly/flutter_iconly.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:zag_offers_app/core/theme/app_colors.dart';

class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key});

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<_OnboardingSlide> _slides = [
    _OnboardingSlide(
      title: 'اكتشف أقوى العروض',
      subtitle: 'تصفّح عروض حصرية من أفضل المتاجر والمطاعم والكافيهات في الزقازيق — كلها في مكان واحد.',
      images: ['food', 'cafe', 'sweets'],
      icon: IconlyBold.discount,
      bgColor: const Color(0xFF1A1A2E),
      accentColor: AppColors.primary,
    ),
    _OnboardingSlide(
      title: 'كل الأقسام اللي تحبها',
      subtitle: 'أزياء، تعليم، صحة، ألعاب، سيارات، وأكتر... كل اللي تحتاجه بخصومات مش هتلاقيها غير هنا.',
      images: ['fashion', 'education', 'gym'],
      icon: IconlyBold.category,
      bgColor: const Color(0xFF16213E),
      accentColor: const Color(0xFF4FC3F7),
    ),
    _OnboardingSlide(
      title: 'وفّر أكتر مع كل خروجة',
      subtitle: 'احصل على كوبونات فورية، شارك العروض مع صحابك، وخليك أول واحد يعرف العرض الجديد.',
      images: ['wedding', 'travel', 'kids'],
      icon: IconlyBold.wallet,
      bgColor: const Color(0xFF0F3460),
      accentColor: const Color(0xFF66BB6A),
    ),
  ];

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _completeOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_completed', true);
    if (!mounted) return;
    Navigator.pushReplacementNamed(context, '/home');
  }

  void _nextPage() {
    if (_currentPage < _slides.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeOutCubic,
      );
    } else {
      _completeOnboarding();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        body: Stack(
          children: [
            // Animated background color
            AnimatedContainer(
              duration: const Duration(milliseconds: 500),
              color: _slides[_currentPage].bgColor,
            ),

            // Page content
            PageView.builder(
              controller: _pageController,
              itemCount: _slides.length,
              onPageChanged: (index) => setState(() => _currentPage = index),
              itemBuilder: (context, index) {
                return _buildSlide(context, _slides[index]);
              },
            ),

            // Skip button (top)
            if (_currentPage < _slides.length - 1)
              Positioned(
                top: MediaQuery.of(context).padding.top + 8,
                left: 12,
                child: TextButton(
                  onPressed: _completeOnboarding,
                  child: Text(
                    'تخطي',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.6),
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),

            // Bottom controls
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 0, 24, 16),
                  child: Row(
                    children: [
                      // Page indicators
                      Row(
                        children: List.generate(_slides.length, (index) {
                          final isActive = index == _currentPage;
                          return AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            margin: const EdgeInsets.only(left: 6),
                            width: isActive ? 24 : 8,
                            height: 8,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(4),
                              color: isActive
                                  ? _slides[_currentPage].accentColor
                                  : Colors.white.withValues(alpha: 0.25),
                            ),
                          );
                        }),
                      ),
                      const Spacer(),
                      // Next / Start button
                      GestureDetector(
                        onTap: _nextPage,
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          padding: EdgeInsets.symmetric(
                            horizontal: _currentPage == _slides.length - 1 ? 28 : 18,
                            vertical: 12,
                          ),
                          decoration: BoxDecoration(
                            color: _slides[_currentPage].accentColor,
                            borderRadius: BorderRadius.circular(25),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                _currentPage == _slides.length - 1
                                    ? 'يلا نبدأ!'
                                    : 'التالي',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              if (_currentPage < _slides.length - 1) ...[
                                const SizedBox(width: 4),
                                const Icon(
                                  Icons.arrow_back_rounded,
                                  size: 16,
                                  color: Colors.white,
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSlide(BuildContext context, _OnboardingSlide slide) {
    final mq = MediaQuery.of(context);
    final screenW = mq.size.width;
    final topPad = mq.padding.top;
    // Use available height minus safe areas and bottom controls
    final availableH = mq.size.height - topPad - mq.padding.bottom - 70;
    final imageAreaH = availableH * 0.50;
    final textAreaH = availableH * 0.45;

    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      child: Padding(
        padding: EdgeInsets.only(top: topPad),
        child: Column(
          children: [
            // ── Top: Category images showcase ──
            SizedBox(
              height: imageAreaH,
              width: screenW,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Stack(
                  alignment: Alignment.center,
                  clipBehavior: Clip.none,
                  children: [
                    // Main center image (large)
                    Positioned(
                      top: 20,
                      child: _buildImageCard(
                        slide.images[0],
                        width: screenW * 0.52,
                        height: imageAreaH * 0.68,
                        borderRadius: 20,
                        accentColor: slide.accentColor,
                      ),
                    ),
                    // Left image (smaller)
                    Positioned(
                      bottom: 0,
                      left: 10,
                      child: Transform.rotate(
                        angle: -0.06,
                        child: _buildImageCard(
                          slide.images[1],
                          width: screenW * 0.3,
                          height: imageAreaH * 0.42,
                          borderRadius: 16,
                          accentColor: slide.accentColor,
                        ),
                      ),
                    ),
                    // Right image (smaller)
                    Positioned(
                      bottom: 0,
                      right: 10,
                      child: Transform.rotate(
                        angle: 0.06,
                        child: _buildImageCard(
                          slide.images[2],
                          width: screenW * 0.3,
                          height: imageAreaH * 0.42,
                          borderRadius: 16,
                          accentColor: slide.accentColor,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // ── Bottom: Text content ──
            SizedBox(
              height: textAreaH,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 28),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Icon
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: slide.accentColor.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        slide.icon,
                        color: slide.accentColor,
                        size: 28,
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Title
                    Text(
                      slide.title,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 10),
                    // Subtitle
                    Text(
                      slide.subtitle,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.7),
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        height: 1.6,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImageCard(
    String categoryKey, {
    required double width,
    required double height,
    required double borderRadius,
    required Color accentColor,
  }) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color: accentColor.withValues(alpha: 0.3),
          width: 2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 15,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius - 1),
        child: Image.asset(
          'assets/categories/$categoryKey.png',
          width: width,
          height: height,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stack) {
            return Container(
              color: accentColor.withValues(alpha: 0.1),
              child: Icon(
                Icons.image_outlined,
                color: Colors.white24,
                size: 32,
              ),
            );
          },
        ),
      ),
    );
  }
}

class _OnboardingSlide {
  final String title;
  final String subtitle;
  final List<String> images;
  final IconData icon;
  final Color bgColor;
  final Color accentColor;

  _OnboardingSlide({
    required this.title,
    required this.subtitle,
    required this.images,
    required this.icon,
    required this.bgColor,
    required this.accentColor,
  });
}
