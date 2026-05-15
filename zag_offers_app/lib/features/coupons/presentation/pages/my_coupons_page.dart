import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../../core/widgets/network_image_widget.dart';

import '../../../../core/services/socket_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../injection_container.dart';
import '../bloc/coupons_bloc.dart';
import '../bloc/coupons_event.dart';
import '../bloc/coupons_state.dart';
import '../../../../core/utils/snackbar_utils.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:zag_offers_app/features/auth/presentation/pages/login_page.dart';
import 'package:google_fonts/google_fonts.dart';

class MyCouponsPage extends StatefulWidget {
  const MyCouponsPage({super.key});

  @override
  State<MyCouponsPage> createState() => _MyCouponsPageState();
}

class _MyCouponsPageState extends State<MyCouponsPage> {
  StreamSubscription<Map<String, dynamic>>? _couponSub;
  bool _isLoggedIn = false;

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    final token = prefs.getString('auth_token');
    if (token != null && token.isNotEmpty) {
      setState(() => _isLoggedIn = true);
      context.read<CouponsBloc>().add(FetchUserCoupons());

      // Listen for real-time coupon status changes
      _couponSub?.cancel();
      _couponSub = sl<SocketService>().onCouponUpdate.listen((data) {
        if (!mounted) return;
        context.read<CouponsBloc>().add(FetchUserCoupons());
        final status = data['status'] as String? ?? '';
        if (status == 'USED') {
          SnackBarUtils.showSuccess(context, 'تم استخدام الكوبون بنجاح!');
        }
      });
    } else {
      setState(() => _isLoggedIn = false);
    }
  }

  @override
  void dispose() {
    _couponSub?.cancel();
    super.dispose();
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'GENERATED':
        return Colors.green;
      case 'USED':
        return Colors.grey;
      case 'EXPIRED':
        return Colors.red;
      default:
        return AppColors.textPrimary;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'GENERATED':
        return 'نشط';
      case 'USED':
        return 'تم الاستخدام';
      case 'EXPIRED':
        return 'منتهي الصلاحية';
      default:
        return status;
    }
  }

  Future<void> _copyCode(BuildContext context, String code) async {
    HapticFeedback.mediumImpact();
    await Clipboard.setData(ClipboardData(text: code));
    if (!context.mounted) return;
    SnackBarUtils.showSuccess(context, 'تم نسخ الكود');
  }

  void _showQRDialog(BuildContext context, String code, String storeName) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        content: SizedBox(
          width: MediaQuery.of(dialogContext).size.width * 0.85,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
            Text(
              storeName,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white, // Keep QR background white for readability
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 15,
                  ),
                ],
              ),
              child: QrImageView(
                data: code,
                version: QrVersions.auto,
                size: 200,
                eyeStyle: const QrEyeStyle(
                  eyeShape: QrEyeShape.circle,
                  color: Colors.black, // Dark color for QR contrast
                ),
                dataModuleStyle: const QrDataModuleStyle(
                  dataModuleShape: QrDataModuleShape.square,
                  color: Colors.black,
                ),
              ),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                code,
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                  letterSpacing: 2.5,
                ),
              ),
            ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => _copyCode(dialogContext, code),
            child: const Text('نسخ الكود'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('إغلاق'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'كوبوناتي',
          style: theme.textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.w900,
          ),
        ),
        elevation: 0,
        centerTitle: true,
      ),
      body: !_isLoggedIn ? _buildLoginRequired() : BlocBuilder<CouponsBloc, CouponsState>(
        builder: (context, state) {
          if (state is CouponsLoading || state is CouponsInitial) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state is CouponsError) {
            final isConnectionError = state.message.toLowerCase().contains('connection') || 
                                     state.message.toLowerCase().contains('network') ||
                                     state.message.toLowerCase().contains('socket');

            return Center(
              child: Padding(
                padding: const EdgeInsets.all(40),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: AppColors.error.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        isConnectionError ? Icons.wifi_off_rounded : Icons.error_outline_rounded,
                        size: 64,
                        color: AppColors.error,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      isConnectionError ? 'مشكلة في الاتصال' : 'تعذر تحميل الكوبونات',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      isConnectionError 
                          ? 'يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى'
                          : state.message,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 32),
                    SizedBox(
                      width: 200,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: () => context.read<CouponsBloc>().add(FetchUserCoupons()),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          elevation: 0,
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.refresh_rounded, size: 20),
                            SizedBox(width: 8),
                            Text(
                              'إعادة المحاولة',
                              style: TextStyle(fontWeight: FontWeight.bold),
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

          if (state is UserCouponsLoaded) {
            final coupons = state.coupons;
            if (coupons.isEmpty) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(40),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(32),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            Icon(
                              Icons.confirmation_num_rounded,
                              size: 80,
                              color: AppColors.primary.withValues(alpha: 0.2),
                            ),
                            const Icon(
                              Icons.qr_code_scanner_rounded,
                              size: 40,
                              color: AppColors.primary,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),
                      Text(
                        'لا توجد كوبونات حاليًا',
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'عندما تحصل على كوبون جديد سيظهر هنا. ابدأ باستكشاف العروض المتاحة الآن!',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          height: 1.6,
                          fontSize: 15,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }

            return RefreshIndicator(
              onRefresh: () async {
                context.read<CouponsBloc>().add(FetchUserCoupons());
              },
              child: ListView.builder(
                padding: const EdgeInsets.all(20),
                itemCount: coupons.length,
                itemBuilder: (context, index) {
                  final coupon = coupons[index];
                  final isActive = coupon.status == 'GENERATED';

                  return Container(
                    margin: const EdgeInsets.only(bottom: 20),
                    decoration: BoxDecoration(
                      color: theme.cardColor,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.04),
                          blurRadius: 15,
                          offset: const Offset(0, 8),
                        ),
                      ],
                      border: Border.all(color: theme.dividerColor.withValues(alpha: 0.1)),
                    ),
                    child: Column(
                      children: [
                        ListTile(
                          contentPadding: const EdgeInsets.all(16),
                          leading: NetworkImageWidget(
                            imageUrl: coupon.offer.store.logo,
                            width: 50,
                            height: 50,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          title: Text(
                            coupon.offer.store.name,
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                          ),
                          subtitle: Text(coupon.offer.title, maxLines: 1),
                          trailing: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: _getStatusColor(coupon.status)
                                  .withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              _getStatusText(coupon.status),
                              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                color: _getStatusColor(coupon.status),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                        if (isActive)
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: ElevatedButton(
                              onPressed: () {
                                HapticFeedback.lightImpact();
                                _showQRDialog(
                                  context,
                                  coupon.code,
                                  coupon.offer.store.name,
                                );
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor:
                                    AppColors.primary.withValues(alpha: 0.1),
                                foregroundColor: AppColors.primary,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                minimumSize: const Size(double.infinity, 48),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.qr_code_rounded, size: 20),
                                  const SizedBox(width: 8),
                                  Text(
                                    coupon.code,
                                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 1.5,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
                  );
                },
              ),
            );
          }

          return const SizedBox();
        },
      ),
    );
  }

  Widget _buildLoginRequired() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.confirmation_num_outlined,
                size: 64,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'أين كوبوناتك؟',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'سجل دخولك لتتمكن من رؤية الكوبونات التي قمت بحفظها واستخدامها لدى المتاجر.',
              textAlign: TextAlign.center,
              style: GoogleFonts.cairo(
                color: AppColors.textSecondary,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 55,
              child: ElevatedButton(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const LoginPage()),
                ).then((_) => _checkAuth()),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 0,
                ),
                child: Text(
                  'تسجيل الدخول',
                  style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
