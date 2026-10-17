import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../../core/widgets/network_image_widget.dart';
import '../../../../core/services/socket_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../injection_container.dart';
import '../bloc/coupons_bloc.dart';
import '../bloc/coupons_event.dart';
import '../bloc/coupons_state.dart';
import '../../domain/entities/coupon_entity.dart';
import '../../../offers/domain/entities/store_entity.dart';
import '../../../../core/utils/snackbar_utils.dart';
import 'package:zag_offers_app/features/auth/presentation/pages/login_page.dart';
import 'package:zag_offers_app/features/offers/presentation/pages/offer_detail_page.dart';
import '../../../../core/widgets/coupon_celebration_dialog.dart';
import '../../../../core/widgets/bouncy_tap.dart';
import '../../../home/presentation/pages/main_screen.dart';

class MyCouponsPage extends StatefulWidget {
  const MyCouponsPage({super.key});

  @override
  State<MyCouponsPage> createState() => _MyCouponsPageState();
}

class _MyCouponsPageState extends State<MyCouponsPage> {
  static final _loginDescStyle =
      GoogleFonts.cairo(color: AppColors.textSecondary, height: 1.6, fontSize: 14);
  static final _loginBtnStyle =
      GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16);

  StreamSubscription<Map<String, dynamic>>? _couponSub;
  bool _isLoggedIn = false;
  String _activeTab = 'ACTIVE'; // 'ACTIVE', 'USED', 'ALL'

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
          SnackBarUtils.showSuccess(context, 'مبروك! تم استخدام الكوبون بنجاح 🎉');
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

  Color _getStatusColor(String status, [bool isDark = false]) {
    switch (status) {
      case 'GENERATED':
        return AppColors.success;
      case 'USED':
        return isDark ? const Color(0xFF94A3B8) : Colors.blueGrey;
      case 'EXPIRED':
        return AppColors.error;
      default:
        return isDark ? Colors.white70 : AppColors.textPrimary;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'GENERATED':
        return 'جاهز للاستخدام ✨';
      case 'USED':
        return 'تم استخدامه 💰';
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
    SnackBarUtils.showSuccess(context, 'تم نسخ الكود بنجاح 📋');
  }

  Future<void> _openExternalMap(StoreEntity store) async {
    Uri? uri;
    if (store.locationUrl != null && store.locationUrl!.isNotEmpty) {
      uri = Uri.tryParse(store.locationUrl!);
    } else if (store.latitude != null && store.longitude != null) {
      uri = Uri.parse(
          'https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}');
    } else {
      final queryText = '${store.address ?? store.area}, الزقازيق';
      uri = Uri.parse(
          'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(queryText)}');
    }
    if (uri != null) {
      try {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } catch (_) {
        if (mounted) {
          SnackBarUtils.showError(context, 'تعذر فتح تطبيق الخريطة');
        }
      }
    }
  }

  Future<void> _callStore(String? phone) async {
    if (phone != null && phone.isNotEmpty) {
      final clean = phone.replaceAll(RegExp(r'\s+'), '');
      final uri = Uri.parse('tel:$clean');
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      }
    }
  }

  void _showQRDialog(
    BuildContext context,
    String code,
    String storeName, {
    double? oldPrice,
    double? newPrice,
    String? offerTitle,
    String? storeLogo,
  }) {
    CouponCelebrationDialog.show(
      context: context,
      code: code,
      storeName: storeName,
      storeLogo: storeLogo,
      offerTitle: offerTitle ?? 'كوبون خصم Zag Offers',
      newPrice: newPrice,
      oldPrice: oldPrice,
    );
  }

  Widget _buildFilterTabs() {
    final tabs = [
      {'key': 'ACTIVE', 'label': 'كوبونات نشطة ✨'},
      {'key': 'USED', 'label': 'تم استخدامها 💰'},
      {'key': 'ALL', 'label': 'الكل'},
    ];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Row(
        children: tabs.map((tab) {
          final isSelected = _activeTab == tab['key'];
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: BouncyTap(
                onTap: () {
                  HapticFeedback.selectionClick();
                  setState(() => _activeTab = tab['key']!);
                },
                scaleFactor: 0.95,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 220),
                  curve: Curves.easeOutCubic,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppColors.primary
                        : Theme.of(context).dividerColor.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      if (isSelected)
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.32),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                    ],
                  ),
                  child: Text(
                    tab['label']!,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? Colors.white : Theme.of(context).textTheme.bodyMedium?.color,
                    ),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildVoucherTicketCard(BuildContext context, CouponEntity coupon) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isActive = coupon.isActive;
    final isUsed = coupon.status == 'USED';

    final offer = coupon.offer;
    final store = offer.store;
    final double? saving = (offer.oldPrice != null && offer.newPrice != null)
        ? (offer.oldPrice! - offer.newPrice!)
        : null;

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isActive
              ? AppColors.primary.withValues(alpha: 0.3)
              : theme.dividerColor.withValues(alpha: 0.1),
          width: isActive ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.05),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. Header: Store info + Status Badge
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: NetworkImageWidget(
                    imageUrl: store.logo,
                    width: 44,
                    height: 44,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              store.name,
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.verified_rounded, size: 15, color: Color(0xFF0084FF)),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'الزقازيق • ${store.area}',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.textTheme.bodySmall?.color?.withValues(alpha: 0.7),
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusColor(coupon.status).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: _getStatusColor(coupon.status),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 5),
                      Text(
                        _getStatusText(coupon.status),
                        style: TextStyle(
                          color: _getStatusColor(coupon.status),
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // 2. Offer Title & Price
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: InkWell(
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => OfferDetailPage(offer: offer)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    offer.title,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      height: 1.3,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      if (offer.newPrice != null) ...[
                        Text(
                          '${offer.newPrice!.toStringAsFixed(0)} ج.م',
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w900,
                            fontSize: 15,
                          ),
                        ),
                        if (offer.oldPrice != null) ...[
                          const SizedBox(width: 8),
                          Text(
                            '${offer.oldPrice!.toStringAsFixed(0)} ج.م',
                            style: TextStyle(
                              decoration: TextDecoration.lineThrough,
                              color: theme.textTheme.bodySmall?.color?.withValues(alpha: 0.6),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ],
                      if (saving != null && saving > 0) ...[
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.green.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'وفّرت ${saving.toStringAsFixed(0)} ج.م 🔥',
                            style: const TextStyle(
                              color: Colors.green,
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 14),

          // 3. Ticket Notch & Dashed Line Divider
          Row(
            children: [
              Container(
                width: 14,
                height: 24,
                decoration: BoxDecoration(
                  color: theme.scaffoldBackgroundColor,
                  borderRadius: const BorderRadius.only(
                    topRight: Radius.circular(14),
                    bottomRight: Radius.circular(14),
                  ),
                ),
              ),
              Expanded(
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final boxWidth = constraints.constrainWidth();
                    const dashWidth = 6.0;
                    const dashHeight = 1.2;
                    final dashCount = (boxWidth / (2 * dashWidth)).floor();
                    return Flex(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      direction: Axis.horizontal,
                      children: List.generate(dashCount, (_) {
                        return SizedBox(
                          width: dashWidth,
                          height: dashHeight,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              color: theme.dividerColor.withValues(alpha: 0.3),
                            ),
                          ),
                        );
                      }),
                    );
                  },
                ),
              ),
              Container(
                width: 14,
                height: 24,
                decoration: BoxDecoration(
                  color: theme.scaffoldBackgroundColor,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(14),
                    bottomLeft: Radius.circular(14),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // 4. Coupon Code Box + Copy
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withValues(alpha: 0.05) : const Color(0xFFF7F8FA),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isDark ? Colors.white12 : Colors.grey.shade300,
                  style: BorderStyle.solid,
                ),
              ),
              child: Row(
                children: [
                  const Icon(Icons.confirmation_num_rounded, color: AppColors.primary, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      coupon.code,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2.5,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  InkWell(
                    onTap: () => _copyCode(context, coupon.code),
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.copy_rounded, size: 14, color: AppColors.primary),
                          SizedBox(width: 4),
                          Text(
                            'نسخ',
                            style: TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 12),

          // 5. Actions: Show QR (if active), Navigation, Call
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: isActive
                ? Column(
                    children: [
                      BouncyTap(
                        scaleFactor: 0.97,
                        child: ElevatedButton.icon(
                          onPressed: () {
                            HapticFeedback.lightImpact();
                            _showQRDialog(
                              context,
                              coupon.code,
                              store.name,
                              storeLogo: store.logo,
                              offerTitle: offer.title,
                              oldPrice: offer.oldPrice,
                              newPrice: offer.newPrice,
                            );
                          },
                          icon: const Icon(Icons.qr_code_2_rounded, size: 20),
                          label: const Text(
                            'امسح الـ QR عند الكاشير 📱',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            minimumSize: const Size.fromHeight(46),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () => _openExternalMap(store),
                              icon: const Icon(Icons.navigation_rounded, size: 15),
                              label: const Text('مكان الفرع', style: TextStyle(fontSize: 12)),
                              style: OutlinedButton.styleFrom(
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                padding: const EdgeInsets.symmetric(vertical: 8),
                              ),
                            ),
                          ),
                          if (store.phone != null && store.phone!.isNotEmpty) ...[
                            const SizedBox(width: 8),
                            OutlinedButton.icon(
                              onPressed: () => _callStore(store.phone),
                              icon: const Icon(Icons.call_rounded, size: 15),
                              label: const Text('اتصال', style: TextStyle(fontSize: 12)),
                              style: OutlinedButton.styleFrom(
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                padding: const EdgeInsets.symmetric(vertical: 8),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  )
                : Container(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: (isUsed ? Colors.green : Colors.grey).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      isUsed
                          ? 'تم استخدام الكوبون بنجاح 🎉 - استمتعت بالعرض!'
                          : 'انتهت صلاحية هذا الكوبون',
                      style: TextStyle(
                        color: isUsed ? Colors.green.shade700 : Colors.grey.shade600,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
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
          'محفظة الكوبونات 🎟️',
          style: theme.textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.w900,
          ),
        ),
        elevation: 0,
        centerTitle: true,
      ),
      body: !_isLoggedIn
          ? _buildLoginRequired()
          : BlocBuilder<CouponsBloc, CouponsState>(
              buildWhen: (prev, next) =>
                  next is UserCouponsLoaded ||
                  next is CouponsLoading ||
                  next is CouponsInitial ||
                  next is CouponsError ||
                  next is CouponGeneratedSuccess,
              builder: (context, state) {
                if (state is CouponsLoading || state is CouponsInitial) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (state is CouponsError) {
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
                            child: const Icon(
                              Icons.wifi_off_rounded,
                              size: 64,
                              color: AppColors.error,
                            ),
                          ),
                          const SizedBox(height: 24),
                          Text(
                            'مشكلة في الاتصال',
                            style: theme.textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'يرجى التأكد من اتصالك بالإنترنت والمحاولة مرة أخرى',
                            textAlign: TextAlign.center,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: AppColors.textSecondary,
                              height: 1.5,
                            ),
                          ),
                          const SizedBox(height: 32),
                          SizedBox(
                            width: 200,
                            height: 50,
                            child: ElevatedButton(
                              onPressed: () => context
                                  .read<CouponsBloc>()
                                  .add(FetchUserCoupons()),
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
                  final allCoupons = state.coupons;
                  final filteredCoupons = allCoupons.where((c) {
                    if (_activeTab == 'ACTIVE') return c.isActive;
                    if (_activeTab == 'USED') return c.status == 'USED';
                    return true;
                  }).toList();

                  return Column(
                    children: [
                      _buildFilterTabs(),
                      Expanded(
                        child: filteredCoupons.isEmpty
                            ? RefreshIndicator(
                                onRefresh: () async {
                                  context.read<CouponsBloc>().add(FetchUserCoupons());
                                },
                                child: SingleChildScrollView(
                                  physics: const AlwaysScrollableScrollPhysics(),
                                  padding: const EdgeInsets.fromLTRB(40, 60, 40, 120),
                                  child: Center(
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(32),
                                          decoration: BoxDecoration(
                                            color: AppColors.primary.withValues(alpha: 0.1),
                                            shape: BoxShape.circle,
                                          ),
                                          child: const Icon(
                                            Icons.confirmation_num_rounded,
                                            size: 70,
                                            color: AppColors.primary,
                                          ),
                                        ),
                                        const SizedBox(height: 24),
                                        Text(
                                          _activeTab == 'ACTIVE'
                                              ? 'لا توجد كوبونات نشطة حالياً'
                                              : (_activeTab == 'USED'
                                                  ? 'لم تستخدم أي كوبونات بعد'
                                                  : 'لا توجد كوبونات مسجلة'),
                                          style: theme.textTheme.headlineSmall?.copyWith(
                                            fontWeight: FontWeight.w900,
                                          ),
                                          textAlign: TextAlign.center,
                                        ),
                                        const SizedBox(height: 12),
                                        Text(
                                          'احجز أقوى عروض ومطاعم الزقازيق دلوقتي، وهيظهر كوبونك هنا فوراً!',
                                          textAlign: TextAlign.center,
                                          style: TextStyle(
                                            color: AppColors.textSecondary,
                                            height: 1.6,
                                            fontSize: 14,
                                          ),
                                        ),
                                        const SizedBox(height: 28),
                                        BouncyTap(
                                          onTap: () {
                                            final main = MainScreen.of(context);
                                            if (main != null) {
                                              main.setSelectedIndex(1);
                                            } else if (Navigator.canPop(context)) {
                                              Navigator.pop(context);
                                            }
                                          },
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 28, vertical: 14),
                                            decoration: BoxDecoration(
                                              gradient: const LinearGradient(
                                                colors: [AppColors.primary, AppColors.secondary],
                                              ),
                                              borderRadius: BorderRadius.circular(16),
                                              boxShadow: [
                                                BoxShadow(
                                                  color: AppColors.primary.withValues(alpha: 0.3),
                                                  blurRadius: 16,
                                                  offset: const Offset(0, 6),
                                                ),
                                              ],
                                            ),
                                            child: const Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Icon(Icons.local_offer_rounded,
                                                    color: Colors.white, size: 20),
                                                SizedBox(width: 8),
                                                Text(
                                                  'تصفح أقوى العروض الآن 🛍️',
                                                  style: TextStyle(
                                                    color: Colors.white,
                                                    fontWeight: FontWeight.bold,
                                                    fontSize: 15,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              )
                            : RefreshIndicator(
                                onRefresh: () async {
                                  context.read<CouponsBloc>().add(FetchUserCoupons());
                                },
                                child: ListView.builder(
                                  padding: const EdgeInsets.fromLTRB(20, 10, 20, 120),
                                  itemCount: filteredCoupons.length,
                                  itemBuilder: (context, index) {
                                    return _buildVoucherTicketCard(context, filteredCoupons[index]);
                                  },
                                ),
                              ),
                      ),
                    ],
                  );
                }

                if (state is CouponGeneratedSuccess) {
                  return const Center(child: CircularProgressIndicator());
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
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.confirmation_num_rounded,
                size: 64,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'كوبوناتك وخصوماتك في مكان واحد 🎉',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
            ),
            const SizedBox(height: 12),
            Text(
              'سجّل حسابك في ثواني وشوف كل الكوبونات اللي حجزتها واستمتع بالخصم عند الكاشير.',
              textAlign: TextAlign.center,
              style: _loginDescStyle,
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 48,
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
                  'تسجيل الدخول والتوفير',
                  style: _loginBtnStyle,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
