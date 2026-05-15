import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:zag_offers_app/core/theme/app_colors.dart';

class AnimatedSplashPage extends StatefulWidget {
  const AnimatedSplashPage({super.key});

  @override
  State<AnimatedSplashPage> createState() => _AnimatedSplashPageState();
}

class _AnimatedSplashPageState extends State<AnimatedSplashPage>
    with SingleTickerProviderStateMixin {
  static const String _text = 'ZAG OFFERS';
  late AnimationController _controller;
  late Animation<double> _cursorBlink;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    );

    // Cursor blink effect
    _cursorBlink = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.0), weight: 1),
      TweenSequenceItem(tween: Tween(begin: 0.0, end: 1.0), weight: 1),
    ]).animate(CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.8, 1.0),
    ));

    _controller.forward();

    Future.delayed(const Duration(milliseconds: 2400), () {
      if (mounted) _navigate();
    });
  }

  Future<void> _navigate() async {
    final prefs = await SharedPreferences.getInstance();
    final onboardingDone = prefs.getBool('onboarding_completed') ?? false;

    if (!mounted) return;

    if (onboardingDone) {
      Navigator.pushReplacementNamed(context, '/home');
    } else {
      Navigator.pushReplacementNamed(context, '/onboarding');
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.primary,
        body: Center(
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, _) {
              // How many letters to show (0 to _text.length)
              final letterProgress = (_controller.value * 1.4).clamp(0.0, 1.0);
              final visibleCount = (letterProgress * _text.length).floor();
              final showCursor = _controller.value < 0.95;

              return Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Letter-by-letter text
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      for (int i = 0; i < _text.length; i++)
                        _buildLetter(i, visibleCount),
                      // Typing cursor
                      if (showCursor)
                        Opacity(
                          opacity: _controller.value > 0.75
                              ? _cursorBlink.value
                              : 1.0,
                          child: Container(
                            width: 2.5,
                            height: 28,
                            margin: const EdgeInsets.only(left: 2),
                            color: Colors.white,
                          ),
                        ),
                    ],
                  ),

                  const SizedBox(height: 14),

                  // Tagline appears after typing
                  Opacity(
                    opacity: _controller.value > 0.65 ? 1.0 : 0.0,
                    child: const Text(
                      'وفّر أكتر مع كل خروجة',
                      textDirection: TextDirection.rtl,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildLetter(int index, int visibleCount) {
    if (index >= visibleCount) {
      return const SizedBox.shrink();
    }

    final char = _text[index];
    if (char == ' ') {
      return const SizedBox(width: 8);
    }

    final letterStart = index / (_text.length * 1.4);
    final letterEnd = (letterStart + 0.08).clamp(0.0, 1.0);
    final t = ((_controller.value - letterStart) / (letterEnd - letterStart))
        .clamp(0.0, 1.0);
    final scale = Curves.easeOutBack.transform(t);
    final opacity = Curves.easeOut.transform(t.clamp(0.0, 1.0));

    return Opacity(
      opacity: opacity,
      child: Transform.scale(
        scale: scale,
        child: Text(
          char,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 32,
            fontWeight: FontWeight.w900,
            letterSpacing: 2,
          ),
        ),
      ),
    );
  }
}
