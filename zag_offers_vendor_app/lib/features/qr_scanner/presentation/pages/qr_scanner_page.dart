import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../bloc/qr_scanner_bloc.dart';
import '../../../dashboard/presentation/bloc/dashboard_bloc.dart';

class QRScannerPage extends StatefulWidget {
  const QRScannerPage({super.key});

  @override
  State<QRScannerPage> createState() => _QRScannerPageState();
}

class _QRScannerPageState extends State<QRScannerPage> {
  bool _isScanned = false;
  final MobileScannerController _controller = MobileScannerController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<QRScannerBloc, QRScannerState>(
      listener: (context, state) {
        if (state is QRScannerSuccess) {
          _showResultDialog(context, true, state.message);
          // تحديث لوحة التحكم بعد التفعيل الناجح
          context.read<DashboardBloc>().add(GetDashboardStatsRequested());
        } else if (state is QRScannerError) {
          _showResultDialog(context, false, state.message);
        }
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        body: Stack(
          children: [
            // Scanner View
            MobileScanner(
              controller: _controller,
              onDetect: (capture) {
                if (_isScanned) return;
                final List<Barcode> barcodes = capture.barcodes;
                if (barcodes.isNotEmpty) {
                  final String? code = barcodes.first.rawValue;
                  if (code != null) {
                    setState(() => _isScanned = true);
                    context.read<QRScannerBloc>().add(CouponScanned(code));
                  }
                }
              },
            ),

            // Custom Overlay
            _buildOverlay(context),

            // Back Button
            Positioned(
              top: 48,
              left: 24,
              child: IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close, color: Colors.white, size: 32),
              ),
            ),

            // Torch Button
            Positioned(
              bottom: 48,
              left: 0,
              right: 0,
              child: Center(
                child: IconButton(
                  onPressed: () => _controller.toggleTorch(),
                  icon: const Icon(Icons.flash_on_rounded, color: Colors.white, size: 32),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOverlay(BuildContext context) {
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
                style: GoogleFonts.cairo(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ],
    );
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
              style: GoogleFonts.cairo(
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: GoogleFonts.cairo(
                fontSize: 16,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  if (success) {
                    Navigator.pop(context); // العودة للداشبورد
                  } else {
                    setState(() => _isScanned = false); // إعادة المحاولة
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
                  style: GoogleFonts.cairo(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
