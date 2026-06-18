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
            Icon(
              success ? Icons.check_circle_outline : Icons.error_outline,
              color: success ? AppColors.success : AppColors.error,
              size: 80,
            ),
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
