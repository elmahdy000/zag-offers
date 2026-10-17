import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:zag_offers_app/core/theme/app_colors.dart';
import 'package:zag_offers_app/core/utils/snackbar_utils.dart';
import 'package:zag_offers_app/core/widgets/bouncy_tap.dart';

class CouponCelebrationDialog extends StatefulWidget {
  final String code;
  final String storeName;
  final String? storeLogo;
  final String offerTitle;
  final double? newPrice;
  final double? oldPrice;
  final String? discount;

  const CouponCelebrationDialog({
    super.key,
    required this.code,
    required this.storeName,
    this.storeLogo,
    required this.offerTitle,
    this.newPrice,
    this.oldPrice,
    this.discount,
  });

  static Future<void> show({
    required BuildContext context,
    required String code,
    required String storeName,
    String? storeLogo,
    required String offerTitle,
    double? newPrice,
    double? oldPrice,
    String? discount,
  }) {
    return showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'CouponCelebration',
      barrierColor: Colors.black.withValues(alpha: 0.65),
      transitionDuration: const Duration(milliseconds: 380),
      pageBuilder: (_, __, ___) => CouponCelebrationDialog(
        code: code,
        storeName: storeName,
        storeLogo: storeLogo,
        offerTitle: offerTitle,
        newPrice: newPrice,
        oldPrice: oldPrice,
        discount: discount,
      ),
      transitionBuilder: (context, anim, _, child) {
        final curved = CurvedAnimation(parent: anim, curve: Curves.easeOutBack);
        return BackdropFilter(
          filter: ImageFilter.blur(
            sigmaX: anim.value * 12,
            sigmaY: anim.value * 12,
          ),
          child: ScaleTransition(
            scale: curved,
            child: FadeTransition(
              opacity: anim,
              child: child,
            ),
          ),
        );
      },
    );
  }

  @override
  State<CouponCelebrationDialog> createState() =>
      _CouponCelebrationDialogState();
}

class _CouponCelebrationDialogState extends State<CouponCelebrationDialog>
    with TickerProviderStateMixin {
  late final AnimationController _stampController;
  late final Animation<double> _stampScale;
  late final Animation<double> _stampOpacity;

  late final AnimationController _confettiController;
  late final List<_ConfettiParticle> _particles;

  bool _copied = false;

  @override
  void initState() {
    super.initState();

    // 1. Confetti burst animation
    _confettiController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );
    _particles = List.generate(45, (_) => _ConfettiParticle());
    _confettiController.forward();

    // 2. Rubber stamp slam animation with delay
    _stampController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 550),
    );

    _stampScale = Tween<double>(begin: 2.8, end: 1.0).animate(
      CurvedAnimation(parent: _stampController, curve: Curves.elasticOut),
    );

    _stampOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _stampController,
        curve: const Interval(0.0, 0.35, curve: Curves.easeIn),
      ),
    );

    Future.delayed(const Duration(milliseconds: 280), () {
      if (mounted) {
        _stampController.forward();
        HapticFeedback.heavyImpact();
      }
    });
  }

  @override
  void dispose() {
    _stampController.dispose();
    _confettiController.dispose();
    super.dispose();
  }

  void _copyCouponCode() {
    HapticFeedback.mediumImpact();
    Clipboard.setData(ClipboardData(text: widget.code));
    setState(() => _copied = true);
    SnackBarUtils.showSuccess(context, 'تم نسخ كود الخصم بنجاح! 📋');
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _copied = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Center(
      child: Material(
        color: Colors.transparent,
        child: Stack(
          alignment: Alignment.center,
          clipBehavior: Clip.none,
          children: [
            // Confetti Canvas
            Positioned.fill(
              child: IgnorePointer(
                child: AnimatedBuilder(
                  animation: _confettiController,
                  builder: (context, _) => CustomPaint(
                    painter: _ConfettiPainter(
                      progress: _confettiController.value,
                      particles: _particles,
                    ),
                  ),
                ),
              ),
            ),

            // Main Ticket Card
            Container(
              width: math.min(MediaQuery.of(context).size.width * 0.88, 380),
              margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF131A29) : Colors.white,
                borderRadius: BorderRadius.circular(28),
                border: Border.all(
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.12)
                      : AppColors.primary.withValues(alpha: 0.18),
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.22),
                    blurRadius: 36,
                    offset: const Offset(0, 14),
                  ),
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.6 : 0.14),
                    blurRadius: 28,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(28),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _buildHeader(theme, isDark),
                      _buildTicketBody(theme, isDark),
                      _buildTicketDivider(theme, isDark),
                      _buildQrSection(theme, isDark),
                      _buildFooterActions(theme, isDark),
                    ],
                  ),
                ),
              ),
            ),

            // Rubber Stamp Animated Overlay
            Positioned(
              top: 50,
              right: 32,
              child: AnimatedBuilder(
                animation: _stampController,
                builder: (context, _) => Opacity(
                  opacity: _stampOpacity.value,
                  child: Transform.scale(
                    scale: _stampScale.value,
                    child: Transform.rotate(
                      angle: -0.18,
                      child: _buildRubberStamp(),
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

  Widget _buildHeader(ThemeData theme, bool isDark) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withValues(alpha: isDark ? 0.25 : 0.12),
            isDark ? const Color(0xFF131A29) : Colors.white,
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.local_fire_department_rounded,
                  color: AppColors.primary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.storeName,
                      style: GoogleFonts.cairo(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                        color: theme.textTheme.titleMedium?.color,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      'الزقازيق • خصم حصري',
                      style: GoogleFonts.cairo(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded, size: 20),
                onPressed: () => Navigator.of(context).pop(),
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            widget.offerTitle,
            style: GoogleFonts.cairo(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              height: 1.35,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildTicketBody(ThemeData theme, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Column(
        children: [
          if (widget.newPrice != null) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Text(
                  widget.newPrice!.toStringAsFixed(0),
                  style: GoogleFonts.cairo(
                    fontSize: 32,
                    fontWeight: FontWeight.w900,
                    color: AppColors.primary,
                    height: 1.1,
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  'ج.م',
                  style: GoogleFonts.cairo(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
                if (widget.oldPrice != null) ...[
                  const SizedBox(width: 10),
                  Text(
                    '${widget.oldPrice!.toStringAsFixed(0)} ج.م',
                    style: GoogleFonts.cairo(
                      fontSize: 14,
                      decoration: TextDecoration.lineThrough,
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ],
            ),
          ],
          const SizedBox(height: 6),
          Text(
            'ورّي الكود للكاشير أو خليه يمسح الـ QR 📱',
            style: GoogleFonts.cairo(
              fontSize: 12.5,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.grey.shade300 : Colors.grey.shade700,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildTicketDivider(ThemeData theme, bool isDark) {
    final bgColor = isDark ? Colors.black : const Color(0xFFF0F2F5);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          Container(
            width: 16,
            height: 28,
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: const BorderRadius.only(
                topRight: Radius.circular(16),
                bottomRight: Radius.circular(16),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 4,
                  offset: const Offset(2, 0),
                ),
              ],
            ),
          ),
          Expanded(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final dashWidth = 6.0;
                final dashCount = (constraints.maxWidth / (dashWidth * 2)).floor();
                return Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: List.generate(
                    dashCount,
                    (_) => SizedBox(
                      width: dashWidth,
                      height: 1.5,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          color: isDark
                              ? Colors.white.withValues(alpha: 0.15)
                              : Colors.black.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(1),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          Container(
            width: 16,
            height: 28,
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                bottomLeft: Radius.circular(16),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 4,
                  offset: const Offset(-2, 0),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQrSection(ThemeData theme, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
      child: Column(
        children: [
          // QR Code with subtle white pad and rounded border
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 18,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: QrImageView(
              data: widget.code,
              version: QrVersions.auto,
              size: 140,
              gapless: true,
              eyeStyle: const QrEyeStyle(
                eyeShape: QrEyeShape.square,
                color: Color(0xFF0D1422),
              ),
              dataModuleStyle: const QrDataModuleStyle(
                dataModuleShape: QrDataModuleShape.circle,
                color: Color(0xFF0D1422),
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Code Pill with Tap to copy
          BouncyTap(
            onTap: _copyCouponCode,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: isDark ? 0.18 : 0.09),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: AppColors.primary.withValues(alpha: 0.45),
                  width: 1.2,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    widget.code,
                    style: GoogleFonts.chivoMono(
                      fontSize: 19,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2.5,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Icon(
                    _copied ? Icons.check_circle_rounded : Icons.copy_rounded,
                    color: _copied ? AppColors.success : AppColors.primary,
                    size: 18,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooterActions(ThemeData theme, bool isDark) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
      child: Row(
        children: [
          Expanded(
            child: BouncyTap(
              onTap: () => Navigator.of(context).pop(),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 13),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.primary, Color(0xFFFF8C35)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.35),
                      blurRadius: 14,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    'تمام، حفظ في كوبوناتي 👍',
                    style: GoogleFonts.cairo(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRubberStamp() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.success.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.success,
          width: 2.2,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.success.withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Text(
        'تم التفعيل 🎉',
        style: GoogleFonts.cairo(
          color: AppColors.success,
          fontWeight: FontWeight.w900,
          fontSize: 13,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

class _ConfettiParticle {
  late double x;
  late double y;
  late double vx;
  late double vy;
  late double size;
  late Color color;
  late double rotation;
  late double rotationSpeed;

  _ConfettiParticle() {
    final random = math.Random();
    x = 0.5;
    y = 0.35;
    final angle = random.nextDouble() * 2 * math.pi;
    final speed = random.nextDouble() * 450 + 150;
    vx = math.cos(angle) * speed;
    vy = math.sin(angle) * speed - 150;
    size = random.nextDouble() * 8 + 4;
    rotation = random.nextDouble() * 2 * math.pi;
    rotationSpeed = (random.nextDouble() - 0.5) * 8;

    final palette = [
      AppColors.primary,
      const Color(0xFFFFB300),
      AppColors.success,
      const Color(0xFF00B0FF),
      const Color(0xFFFF4081),
      Colors.white,
    ];
    color = palette[random.nextInt(palette.length)];
  }
}

class _ConfettiPainter extends CustomPainter {
  final double progress;
  final List<_ConfettiParticle> particles;

  _ConfettiPainter({required this.progress, required this.particles});

  @override
  void paint(Canvas canvas, Size size) {
    if (progress <= 0 || progress >= 1.0) return;

    final opacity = (1.0 - progress).clamp(0.0, 1.0);
    final paint = Paint()..style = PaintingStyle.fill;

    for (final p in particles) {
      final t = progress;
      final px = size.width * p.x + p.vx * t;
      final py = size.height * p.y + p.vy * t + 0.5 * 980 * t * t; // gravity

      paint.color = p.color.withValues(alpha: opacity);

      canvas.save();
      canvas.translate(px, py);
      canvas.rotate(p.rotation + p.rotationSpeed * t);
      canvas.drawRect(
        Rect.fromCenter(
          center: Offset.zero,
          width: p.size,
          height: p.size * 0.6,
        ),
        paint,
      );
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant _ConfettiPainter oldDelegate) => true;
}
