import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:zag_offers_app/core/theme/app_colors.dart';
import 'package:zag_offers_app/core/utils/snackbar_utils.dart';
import 'package:zag_offers_app/core/widgets/bouncy_tap.dart';
import 'package:zag_offers_app/core/widgets/network_image_widget.dart';
import 'package:zag_offers_app/features/home/presentation/pages/main_screen.dart';

class CouponCelebrationDialog extends StatefulWidget {
  final String code;
  final String storeName;
  final String? storeLogo;
  final String? storeArea;
  final String offerTitle;
  final double? newPrice;
  final double? oldPrice;
  final String? discount;
  final String status; // 'GENERATED' | 'USED' | 'EXPIRED'
  final VoidCallback? onViewCoupons;

  const CouponCelebrationDialog({
    super.key,
    required this.code,
    required this.storeName,
    this.storeLogo,
    this.storeArea,
    required this.offerTitle,
    this.newPrice,
    this.oldPrice,
    this.discount,
    this.status = 'GENERATED',
    this.onViewCoupons,
  });

  static Future<void> show({
    required BuildContext context,
    required String code,
    required String storeName,
    String? storeLogo,
    String? storeArea,
    required String offerTitle,
    double? newPrice,
    double? oldPrice,
    String? discount,
    String status = 'GENERATED',
    VoidCallback? onViewCoupons,
  }) {
    return showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'CouponCelebration',
      barrierColor: Colors.black.withValues(alpha: 0.65),
      transitionDuration: const Duration(milliseconds: 320),
      pageBuilder: (_, __, ___) => CouponCelebrationDialog(
        code: code,
        storeName: storeName,
        storeLogo: storeLogo,
        storeArea: storeArea,
        offerTitle: offerTitle,
        newPrice: newPrice,
        oldPrice: oldPrice,
        discount: discount,
        status: status,
        onViewCoupons: onViewCoupons,
      ),
      transitionBuilder: (context, anim, _, child) {
        final curved = CurvedAnimation(parent: anim, curve: Curves.easeOutCubic);
        return BackdropFilter(
          filter: ImageFilter.blur(
            sigmaX: anim.value * 12,
            sigmaY: anim.value * 12,
          ),
          child: ScaleTransition(
            scale: Tween<double>(begin: 0.92, end: 1.0).animate(curved),
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
    with SingleTickerProviderStateMixin {
  late final AnimationController _confettiController;
  late final List<_ConfettiParticle> _particles;
  bool _copied = false;

  bool get _isUsed => widget.status == 'USED';
  bool get _isExpired => widget.status == 'EXPIRED';
  bool get _isActive => !_isUsed && !_isExpired;

  @override
  void initState() {
    super.initState();

    // Confetti burst for newly claimed / active coupons
    _confettiController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );
    _particles = List.generate(40, (_) => _ConfettiParticle());
    if (_isActive) {
      _confettiController.forward();
      HapticFeedback.mediumImpact();
    }
  }

  @override
  void dispose() {
    _confettiController.dispose();
    super.dispose();
  }

  void _copyCouponCode() {
    HapticFeedback.selectionClick();
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
            // Confetti Canvas (Only for active coupons)
            if (_isActive)
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

            // Main Ticket Dialog Card
            Container(
              width: math.min(MediaQuery.of(context).size.width * 0.90, 390),
              margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF131B2A) : Colors.white,
                borderRadius: BorderRadius.circular(26),
                border: Border.all(
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.12)
                      : AppColors.primary.withValues(alpha: 0.18),
                  width: 1.2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.18),
                    blurRadius: 32,
                    offset: const Offset(0, 12),
                  ),
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.65 : 0.14),
                    blurRadius: 28,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(26),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _buildHeader(theme, isDark),
                      _buildOfferSummary(theme, isDark),
                      _buildTicketDivider(theme, isDark),
                      _buildQrSection(theme, isDark),
                      _buildFooterActions(theme, isDark),
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

  Widget _buildHeader(ThemeData theme, bool isDark) {
    final initial = widget.storeName.trim().isNotEmpty
        ? widget.storeName.trim().characters.first
        : 'Z';

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF162032) : const Color(0xFFF8FAFC),
        border: Border(
          bottom: BorderSide(
            color: isDark
                ? Colors.white.withValues(alpha: 0.08)
                : Colors.grey.shade200,
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          // Merchant avatar with smart monogram fallback
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
            child: widget.storeLogo != null && widget.storeLogo!.isNotEmpty
                ? NetworkImageWidget(
                    imageUrl: widget.storeLogo!,
                    fit: BoxFit.cover,
                  )
                : Center(
                    child: Text(
                      initial,
                      style: GoogleFonts.cairo(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w900,
                        fontSize: 20,
                      ),
                    ),
                  ),
          ),
          const SizedBox(width: 12),

          // Merchant name & location
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        widget.storeName,
                        style: GoogleFonts.cairo(
                          fontWeight: FontWeight.w800,
                          fontSize: 14.5,
                          color: isDark ? Colors.white : AppColors.textPrimary,
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
                Text(
                  widget.storeArea != null && widget.storeArea!.isNotEmpty
                      ? 'الزقازيق • ${widget.storeArea}'
                      : 'الزقازيق • خصم حصري',
                  style: GoogleFonts.cairo(
                    fontSize: 11,
                    color: isDark ? Colors.grey.shade400 : AppColors.textSecondary,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),

          // Status Badge (Clean, non-overlapping)
          _buildStatusBadge(isDark),

          const SizedBox(width: 6),
          // Close button
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () => Navigator.of(context).pop(),
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.08)
                      : Colors.black.withValues(alpha: 0.05),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.close_rounded,
                  size: 18,
                  color: isDark ? Colors.grey.shade300 : Colors.grey.shade700,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(bool isDark) {
    if (_isUsed) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: isDark ? const Color(0x2010B981) : const Color(0xFFF0FDF4),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0x5010B981), width: 1),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle_rounded, size: 12, color: Color(0xFF10B981)),
            const SizedBox(width: 4),
            Text(
              'تم الاستخدام',
              style: GoogleFonts.cairo(
                color: const Color(0xFF10B981),
                fontWeight: FontWeight.w800,
                fontSize: 10.5,
              ),
            ),
          ],
        ),
      );
    }

    if (_isExpired) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: isDark ? const Color(0x20EF4444) : const Color(0xFFFEF2F2),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0x50EF4444), width: 1),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.history_rounded, size: 12, color: Color(0xFFEF4444)),
            const SizedBox(width: 4),
            Text(
              'منتهي الصلاحية',
              style: GoogleFonts.cairo(
                color: const Color(0xFFEF4444),
                fontWeight: FontWeight.w800,
                fontSize: 10.5,
              ),
            ),
          ],
        ),
      );
    }

    // Default / Claimed / Active
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isDark ? const Color(0x2210B981) : const Color(0xFFECFDF5),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0x6010B981), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.verified_outlined, size: 12, color: Color(0xFF10B981)),
          const SizedBox(width: 4),
          Text(
            'جاهز للاستخدام ✨',
            style: GoogleFonts.cairo(
              color: const Color(0xFF10B981),
              fontWeight: FontWeight.w800,
              fontSize: 10.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOfferSummary(ThemeData theme, bool isDark) {
    final discountStr = widget.discount != null && widget.discount!.isNotEmpty
        ? (widget.discount!.contains('%') ? widget.discount! : '${widget.discount!}%')
        : '';

    return Padding(
      padding: const EdgeInsets.fromLTRB(18, 14, 18, 4),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (discountStr.isNotEmpty) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFFF5722), Color(0xFFFF7043)],
                    ),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.local_offer_rounded, color: Colors.white, size: 12),
                      const SizedBox(width: 4),
                      Text(
                        discountStr,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
              ],
              Flexible(
                child: Text(
                  widget.offerTitle,
                  style: GoogleFonts.cairo(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : AppColors.textPrimary,
                    height: 1.3,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),

          if (widget.newPrice != null && widget.newPrice! > 0) ...[
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Text(
                  widget.newPrice!.toStringAsFixed(0),
                  style: GoogleFonts.cairo(
                    fontSize: 26,
                    fontWeight: FontWeight.w900,
                    color: AppColors.primary,
                    height: 1.1,
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  'ج.م',
                  style: GoogleFonts.cairo(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
                if (widget.oldPrice != null && widget.oldPrice! > widget.newPrice!) ...[
                  const SizedBox(width: 10),
                  Text(
                    '${widget.oldPrice!.toStringAsFixed(0)} ج.م',
                    style: GoogleFonts.cairo(
                      fontSize: 13,
                      decoration: TextDecoration.lineThrough,
                      color: isDark ? Colors.grey.shade400 : AppColors.textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ],
            ),
          ],

          const SizedBox(height: 8),
          Text(
            _isUsed
                ? 'تم تأكيد واستخدام هذا الكوبون بنجاح لدى الكاشير 🎉'
                : 'ورّي الكود للكاشير أو خليه يمسح الـ QR 📱',
            style: GoogleFonts.cairo(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: _isUsed
                  ? const Color(0xFF10B981)
                  : (isDark ? Colors.grey.shade300 : Colors.grey.shade700),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildTicketDivider(ThemeData theme, bool isDark) {
    final bgColor = isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          // Perforated cutout left
          Container(
            width: 14,
            height: 24,
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: const BorderRadius.only(
                topRight: Radius.circular(14),
                bottomRight: Radius.circular(14),
              ),
            ),
          ),
          Expanded(
            child: LayoutBuilder(
              builder: (context, constraints) {
                const dashWidth = 5.0;
                final dashCount = (constraints.maxWidth / (dashWidth * 2)).floor();
                return Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: List.generate(
                    dashCount,
                    (_) => SizedBox(
                      width: dashWidth,
                      height: 1.2,
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
          // Perforated cutout right
          Container(
            width: 14,
            height: 24,
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(14),
                bottomLeft: Radius.circular(14),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQrSection(ThemeData theme, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
      child: Column(
        children: [
          // Clean white QR container with generous quiet zone
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: QrImageView(
              data: widget.code,
              version: QrVersions.auto,
              size: 155,
              gapless: true,
              eyeStyle: const QrEyeStyle(
                eyeShape: QrEyeShape.square,
                color: Color(0xFF0F172A),
              ),
              dataModuleStyle: const QrDataModuleStyle(
                dataModuleShape: QrDataModuleShape.square,
                color: Color(0xFF0F172A),
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Monospaced LTR Coupon Code with Copy Action
          BouncyTap(
            onTap: _copyCouponCode,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: isDark ? 0.16 : 0.08),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: AppColors.primary.withValues(alpha: 0.35),
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Directionality(
                    textDirection: TextDirection.ltr,
                    child: Text(
                      widget.code,
                      style: GoogleFonts.spaceMono(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 2.2,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Icon(
                    _copied ? Icons.check_circle_rounded : Icons.copy_rounded,
                    color: _copied ? const Color(0xFF10B981) : AppColors.primary,
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
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
      child: Row(
        children: [
          // Primary action: Navigate to wallet / View in wallet
          Expanded(
            child: BouncyTap(
              onTap: () {
                Navigator.of(context).pop();
                if (widget.onViewCoupons != null) {
                  widget.onViewCoupons!();
                } else {
                  MainScreen.of(context)?.setSelectedIndex(2);
                }
              },
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFF5722), Color(0xFFFF7043)],
                  ),
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.35),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Center(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.confirmation_num_rounded,
                        color: Colors.white,
                        size: 17,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'عرض في كوبوناتي',
                        style: GoogleFonts.cairo(
                          color: Colors.white,
                          fontSize: 13.5,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Secondary action: Close & return to offer
          BouncyTap(
            onTap: () => Navigator.of(context).pop(),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: isDark
                    ? Colors.white.withValues(alpha: 0.08)
                    : Colors.grey.shade200,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.08)
                      : Colors.grey.shade300,
                  width: 1,
                ),
              ),
              child: Center(
                child: Text(
                  'تم، العودة',
                  style: GoogleFonts.cairo(
                    color: isDark ? Colors.grey.shade300 : AppColors.textPrimary,
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ),
        ],
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
    final rand = math.Random();
    x = 0.5;
    y = 0.3;
    final angle = rand.nextDouble() * math.pi * 2;
    final speed = 0.3 + rand.nextDouble() * 0.7;
    vx = math.cos(angle) * speed;
    vy = math.sin(angle) * speed - 0.2;
    size = 4 + rand.nextDouble() * 6;
    rotation = rand.nextDouble() * math.pi;
    rotationSpeed = (rand.nextDouble() - 0.5) * 6;

    final palette = [
      const Color(0xFFFF5722),
      const Color(0xFFFF8C35),
      const Color(0xFFFFD54F),
      const Color(0xFF10B981),
      const Color(0xFF3B82F6),
      Colors.white,
    ];
    color = palette[rand.nextInt(palette.length)];
  }

  void update(double dt) {
    x += vx * dt;
    y += vy * dt;
    vy += 0.8 * dt; // gravity
    rotation += rotationSpeed * dt;
  }
}

class _ConfettiPainter extends CustomPainter {
  final double progress;
  final List<_ConfettiParticle> particles;

  _ConfettiPainter({required this.progress, required this.particles});

  @override
  void paint(Canvas canvas, Size size) {
    if (progress >= 1.0) return;
    final opacity = (1.0 - progress).clamp(0.0, 1.0);

    for (final p in particles) {
      final px = p.x * size.width;
      final py = p.y * size.height;

      final paint = Paint()
        ..color = p.color.withValues(alpha: opacity)
        ..style = PaintingStyle.fill;

      canvas.save();
      canvas.translate(px, py);
      canvas.rotate(p.rotation);
      canvas.drawRect(
        Rect.fromCenter(center: Offset.zero, width: p.size, height: p.size * 0.6),
        paint,
      );
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(_ConfettiPainter oldDelegate) => true;
}
