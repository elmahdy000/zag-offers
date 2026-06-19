import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../bloc/qr_scanner_bloc.dart';
import '../../../dashboard/presentation/bloc/dashboard_bloc.dart';

class QRScannerPage extends StatefulWidget {
  final String? storeId;
  const QRScannerPage({super.key, this.storeId});

  @override
  State<QRScannerPage> createState() => _QRScannerPageState();
}

class _QRScannerPageState extends State<QRScannerPage> {
  bool _isScanned = false;
  final MobileScannerController _controller = MobileScannerController();

  static final _dialogTitleStyle = GoogleFonts.cairo(fontWeight: FontWeight.bold);
  static final _dialogBodyStyle = GoogleFonts.cairo(fontSize: 14);
  static final _dialogBtnStyle = GoogleFonts.cairo(fontWeight: FontWeight.bold, color: Colors.white);
  static final _resultTitleStyle = GoogleFonts.cairo(fontSize: 22, fontWeight: FontWeight.bold);
  static final _resultDescStyle = GoogleFonts.cairo(fontSize: 16, color: AppColors.textSecondary);
  static final _resultBtnStyle = GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<QRScannerBloc, QRScannerState>(
      listenWhen: (_, next) => next is QRScannerSuccess || next is QRScannerError,
      listener: (context, state) {
        if (state is QRScannerSuccess) {
          _showResultDialog(context, true, state.message);
          context.read<DashboardBloc>().add(GetDashboardStatsRequested());
        } else if (state is QRScannerError) {
          _showResultDialog(context, false, state.message);
        }
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        body: Stack(
          children: [
            MobileScanner(
              controller: _controller,
              onDetect: (capture) {
                if (_isScanned) return;
                final List<Barcode> barcodes = capture.barcodes;
                if (barcodes.isNotEmpty) {
                  final String? code = barcodes.first.rawValue;
                  if (code != null) {
                    setState(() => _isScanned = true);
                    context.read<QRScannerBloc>().add(CouponScanned(code, storeId: widget.storeId));
                  }
                }
              },
            ),

            const _ScannerOverlay(),

            Positioned(
              top: 48,
              left: 24,
              child: IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close, color: Colors.white, size: 32),
              ),
            ),

            Positioned(
              bottom: 48,
              left: 48,
              child: IconButton(
                onPressed: () => _controller.toggleTorch(),
                icon: const Icon(Icons.flash_on_rounded, color: Colors.white, size: 32),
              ),
            ),

            Positioned(
              bottom: 48,
              right: 48,
              child: IconButton(
                onPressed: () => _showManualInputDialog(context),
                icon: const Icon(Icons.keyboard_rounded, color: Colors.white, size: 32),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showManualInputDialog(BuildContext context) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text('إدخال الكود يدوياً', style: _dialogTitleStyle, textAlign: TextAlign.center),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: controller,
              decoration: InputDecoration(
                hintText: 'أدخل كود الكوبون هنا',
                hintStyle: _dialogBodyStyle,
                filled: true,
                fillColor: AppColors.surface,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
              ),
              textAlign: TextAlign.center,
              style: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 2),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  final code = controller.text.trim();
                  if (code.isNotEmpty) {
                    Navigator.pop(context);
                    setState(() => _isScanned = true);
                    context.read<QRScannerBloc>().add(CouponScanned(code, storeId: widget.storeId));
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: Text('تفعيل الكوبون', style: _dialogBtnStyle),
              ),
            ),
          ],
        ),
      ),
    ).whenComplete(() => controller.dispose());
  }

  void _showResultDialog(BuildContext context, bool success, String message) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 16),
            success ? const AnimatedCheckmark() : const AnimatedCross(),
            const SizedBox(height: 24),
            Text(
              success ? 'تم التفعيل!' : 'خطأ في التفعيل',
              style: _resultTitleStyle,
            ),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: _resultDescStyle,
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  if (success) {
                    Navigator.pop(context);
                  } else {
                    setState(() => _isScanned = false);
                    context.read<QRScannerBloc>().add(ResetScanner());
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: success ? AppColors.success : AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: Text(
                  success ? 'حسناً' : 'إعادة المحاولة',
                  style: _resultBtnStyle,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ScannerOverlay extends StatelessWidget {
  const _ScannerOverlay();

  static final _overlayTitleStyle = GoogleFonts.cairo(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold);

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        ColorFiltered(
          colorFilter: ColorFilter.mode(
            Colors.black.withValues(alpha: 0.5),
            BlendMode.srcOut,
          ),
          child: Stack(
            children: [
              Container(
                decoration: const BoxDecoration(
                  color: Colors.black,
                  backgroundBlendMode: BlendMode.dstOut,
                ),
              ),
              Center(
                child: Container(
                  height: 280,
                  width: 280,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                  ),
                ),
              ),
            ],
          ),
        ),
        Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                height: 280,
                width: 280,
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.secondary, width: 4),
                  borderRadius: BorderRadius.circular(24),
                ),
              ),
              const SizedBox(height: 32),
              Text(
                'ضع كود الكوبون داخل المربع',
                style: _overlayTitleStyle,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class AnimatedCheckmark extends StatefulWidget {
  final double size;
  final Color color;

  const AnimatedCheckmark({
    super.key,
    this.size = 80,
    this.color = const Color(0xFF10B981),
  });

  @override
  State<AnimatedCheckmark> createState() => _AnimatedCheckmarkState();
}

class _AnimatedCheckmarkState extends State<AnimatedCheckmark> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _circleAnimation;
  late final Animation<double> _checkAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _circleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.5, curve: Curves.easeOut),
      ),
    );

    _checkAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.4, 1.0, curve: Curves.elasticOut),
      ),
    );

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          size: Size(widget.size, widget.size),
          painter: _CheckmarkPainter(
            circleProgress: _circleAnimation.value,
            checkProgress: _checkAnimation.value,
            color: widget.color,
          ),
        );
      },
    );
  }
}

class _CheckmarkPainter extends CustomPainter {
  final double circleProgress;
  final double checkProgress;
  final Color color;

  _CheckmarkPainter({
    required this.circleProgress,
    required this.checkProgress,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 5
      ..strokeCap = StrokeCap.round;

    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - paint.strokeWidth) / 2;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -1.5708,
      6.28319 * circleProgress,
      false,
      paint,
    );

    if (checkProgress > 0) {
      final path = Path();
      final startPoint = Offset(size.width * 0.28, size.height * 0.5);
      final midPoint = Offset(size.width * 0.44, size.height * 0.66);
      final endPoint = Offset(size.width * 0.72, size.height * 0.34);

      if (checkProgress <= 0.4) {
        final progress = checkProgress / 0.4;
        path.moveTo(startPoint.dx, startPoint.dy);
        path.lineTo(
          startPoint.dx + (midPoint.dx - startPoint.dx) * progress,
          startPoint.dy + (midPoint.dy - startPoint.dy) * progress,
        );
      } else {
        path.moveTo(startPoint.dx, startPoint.dy);
        path.lineTo(midPoint.dx, midPoint.dy);
        final progress = (checkProgress - 0.4) / 0.6;
        path.lineTo(
          midPoint.dx + (endPoint.dx - midPoint.dx) * progress,
          midPoint.dy + (endPoint.dy - midPoint.dy) * progress,
        );
      }
      canvas.drawPath(path, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _CheckmarkPainter oldDelegate) {
    return oldDelegate.circleProgress != circleProgress ||
        oldDelegate.checkProgress != checkProgress ||
        oldDelegate.color != color;
  }
}

class AnimatedCross extends StatefulWidget {
  final double size;
  final Color color;

  const AnimatedCross({
    super.key,
    this.size = 80,
    this.color = const Color(0xFFEF4444),
  });

  @override
  State<AnimatedCross> createState() => _AnimatedCrossState();
}

class _AnimatedCrossState extends State<AnimatedCross> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _circleAnimation;
  late final Animation<double> _cross1Animation;
  late final Animation<double> _cross2Animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _circleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.4, curve: Curves.easeOut),
      ),
    );

    _cross1Animation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.4, 0.7, curve: Curves.easeOut),
      ),
    );

    _cross2Animation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.7, 1.0, curve: Curves.easeOut),
      ),
    );

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          size: Size(widget.size, widget.size),
          painter: _CrossPainter(
            circleProgress: _circleAnimation.value,
            cross1Progress: _cross1Animation.value,
            cross2Progress: _cross2Animation.value,
            color: widget.color,
          ),
        );
      },
    );
  }
}

class _CrossPainter extends CustomPainter {
  final double circleProgress;
  final double cross1Progress;
  final double cross2Progress;
  final Color color;

  _CrossPainter({
    required this.circleProgress,
    required this.cross1Progress,
    required this.cross2Progress,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 5
      ..strokeCap = StrokeCap.round;

    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - paint.strokeWidth) / 2;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -1.5708,
      6.28319 * circleProgress,
      false,
      paint,
    );

    if (cross1Progress > 0) {
      final start1 = Offset(size.width * 0.32, size.height * 0.32);
      final end1 = Offset(size.width * 0.68, size.height * 0.68);
      canvas.drawLine(
        start1,
        Offset(
          start1.dx + (end1.dx - start1.dx) * cross1Progress,
          start1.dy + (end1.dy - start1.dy) * cross1Progress,
        ),
        paint,
      );
    }

    if (cross2Progress > 0) {
      final start2 = Offset(size.width * 0.68, size.height * 0.32);
      final end2 = Offset(size.width * 0.32, size.height * 0.68);
      canvas.drawLine(
        start2,
        Offset(
          start2.dx + (end2.dx - start2.dx) * cross2Progress,
          start2.dy + (end2.dy - start2.dy) * cross2Progress,
        ),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _CrossPainter oldDelegate) {
    return oldDelegate.circleProgress != circleProgress ||
        oldDelegate.cross1Progress != cross1Progress ||
        oldDelegate.cross2Progress != cross2Progress ||
        oldDelegate.color != color;
  }
}
