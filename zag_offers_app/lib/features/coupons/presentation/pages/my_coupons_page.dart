import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:intl/intl.dart' hide TextDirection;
import '../../../../core/widgets/skeleton_loader.dart';
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
import '../../../../core/utils/navigation_service.dart';
import '../../../offers/presentation/utils/offer_pricing_utils.dart';

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
  String _activeTab = 'ALL'; // 'ALL', 'ACTIVE', 'USED'

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
    String? storeArea,
    String? discount,
    String status = 'GENERATED',
  }) {
    CouponCelebrationDialog.show(
      context: context,
      code: code,
      storeName: storeName,
      storeLogo: storeLogo,
      storeArea: storeArea,
      offerTitle: offerTitle ?? 'كوبون خصم Zag Offers',
      newPrice: newPrice,
      oldPrice: oldPrice,
      discount: discount,
      status: status,
    );
  }

  Widget _buildFilterTabs(List<CouponEntity> allCoupons) {
    final totalCount = allCoupons.length;
    final activeCount = allCoupons.where((c) => c.isActive).length;
    final usedCount = allCoupons.where((c) => c.status == 'USED').length;

    // Right-to-Left visual order as required:
    // 1. الكل (Rightmost in RTL)
    // 2. الكوبونات النشطة (Center)
    // 3. تم استخدامها (Leftmost in RTL)
    final tabs = [
      {'key': 'ALL', 'label': 'الكل', 'count': totalCount},
      {'key': 'ACTIVE', 'label': 'الكوبونات النشطة', 'count': activeCount},
      {'key': 'USED', 'label': 'تم استخدامها', 'count': usedCount},
    ];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: tabs.map((tab) {
          final isSelected = _activeTab == tab['key'];
          final count = tab['count'] as int;
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: BouncyTap(
                onTap: () {
                  HapticFeedback.selectionClick();
                  setState(() => _activeTab = tab['key'] as String);
                },
                scaleFactor: 0.95,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 220),
                  curve: Curves.easeOutCubic,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppColors.primary
                        : Theme.of(context).dividerColor.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      if (isSelected)
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.32),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                    ],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Flexible(
                        child: Text(
                          tab['label'] as String,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: isSelected
                                ? Colors.white
                                : Theme.of(context).textTheme.bodyMedium?.color,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (count > 0) ...[
                        const SizedBox(width: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 5,
                            vertical: 1,
                          ),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? Colors.white.withValues(alpha: 0.25)
                                : Theme.of(context).dividerColor.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '$count',
                            style: TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w900,
                              color: isSelected
                                  ? Colors.white
                                  : Theme.of(context).textTheme.bodySmall?.color,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildStoreAvatar(StoreEntity store, bool isDark) {
    final hasLogo = store.logo != null && store.logo!.trim().isNotEmpty;
    final initial = store.name.trim().isNotEmpty
        ? store.name.trim().characters.first
        : 'Z';

    return Container(
      width: 42,
      height: 42,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.12)
              : Colors.black.withValues(alpha: 0.08),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(11),
        child: hasLogo
            ? NetworkImageWidget(
                imageUrl: store.logo,
                width: 42,
                height: 42,
                fit: BoxFit.cover,
              )
            : Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isDark
                        ? [
                            AppColors.primary.withValues(alpha: 0.25),
                            const Color(0xFF1E293B),
                          ]
                        : [
                            AppColors.primary.withValues(alpha: 0.15),
                            const Color(0xFFFFEDE6),
                          ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Center(
                  child: Text(
                    initial,
                    style: GoogleFonts.cairo(
                      color: AppColors.primary,
                      fontSize: 19,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildStatusBadge(String status, bool isActive, bool isDark) {
    Color bgColor;
    Color textColor;
    Color dotColor;
    String text;

    if (isActive) {
      bgColor = isDark ? const Color(0x2210B981) : const Color(0xFFECFDF5);
      textColor = const Color(0xFF10B981);
      dotColor = const Color(0xFF10B981);
      text = 'جاهز للاستخدام ✨';
    } else if (status == 'USED') {
      bgColor = isDark ? const Color(0x2264748B) : const Color(0xFFF1F5F9);
      textColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569);
      dotColor = textColor;
      text = 'تم الاستخدام ✓';
    } else {
      bgColor = isDark ? const Color(0x22EF4444) : const Color(0xFFFEF2F2);
      textColor = const Color(0xFFEF4444);
      dotColor = const Color(0xFFEF4444);
      text = 'منتهي الصلاحية';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: textColor.withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 5.5,
            height: 5.5,
            decoration: BoxDecoration(
              color: dotColor,
              shape: BoxShape.circle,
              boxShadow: isActive
                  ? [
                      BoxShadow(
                        color: dotColor.withValues(alpha: 0.6),
                        blurRadius: 4,
                        spreadRadius: 1,
                      )
                    ]
                  : null,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              color: textColor,
              fontWeight: FontWeight.bold,
              fontSize: 10.5,
            ),
          ),
        ],
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
    final pricing = OfferPricingResult.fromOffer(offer);
    final double? saving = pricing.hasSavings ? pricing.savingsAmount : null;

    final primaryBorder = isDark
        ? AppColors.primary.withValues(alpha: 0.35)
        : AppColors.primary.withValues(alpha: 0.25);
    final inactiveBorder = isDark
        ? Colors.white.withValues(alpha: 0.08)
        : Colors.grey.shade200;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131B2A) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isActive ? primaryBorder : inactiveBorder,
          width: isActive ? 1.5 : 1.0,
        ),
        boxShadow: [
          if (isActive)
            BoxShadow(
              color: AppColors.primary.withValues(alpha: isDark ? 0.08 : 0.05),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Top Accent VIP Strip for active coupons
          if (isActive)
            Container(
              height: 3.5,
              decoration: const BoxDecoration(
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
                gradient: LinearGradient(
                  colors: [AppColors.primary, Color(0xFFFF8A65)],
                ),
              ),
            ),

          // 1. Header: Store info + Verified + Status Badge
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                _buildStoreAvatar(store, isDark),
                const SizedBox(width: 10),
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
                                fontWeight: FontWeight.w800,
                                fontSize: 15,
                                letterSpacing: -0.2,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(
                            Icons.verified_rounded,
                            size: 15,
                            color: Color(0xFF0084FF),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Icon(
                            Icons.location_on_rounded,
                            size: 12,
                            color: AppColors.primary.withValues(alpha: 0.85),
                          ),
                          const SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              'الزقازيق • ${store.area}',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: isDark
                                    ? const Color(0xFF94A3B8)
                                    : const Color(0xFF64748B),
                                fontSize: 11.5,
                                fontWeight: FontWeight.w500,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                _buildStatusBadge(coupon.status, isActive, isDark),
              ],
            ),
          ),

          // 2. Offer Showcase Card (Prominent discount & validity)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: BouncyTap(
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => OfferDetailPage(offer: offer),
                ),
              ),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF1B2436)
                      : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.06)
                        : Colors.black.withValues(alpha: 0.05),
                    width: 1,
                  ),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Prominent Offer Discount Badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 9,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFFF5722), Color(0xFFFF7043)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(10),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.28),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.local_offer_rounded,
                            color: Colors.white,
                            size: 14,
                          ),
                          const SizedBox(height: 1),
                          Text(
                            offer.discount.isNotEmpty ? offer.discount : 'خصم',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              fontSize: 11.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            offer.title,
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w800,
                              fontSize: 13.5,
                              height: 1.25,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          // Expiry / validity info
                          Row(
                            children: [
                              Icon(
                                Icons.schedule_rounded,
                                size: 12,
                                color: isDark
                                    ? const Color(0xFF94A3B8)
                                    : const Color(0xFF64748B),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'صالح حتى ${DateFormat('d MMMM yyyy', 'ar').format(coupon.expiresAt ?? offer.expiryDate)}',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: isDark
                                      ? const Color(0xFF94A3B8)
                                      : const Color(0xFF64748B),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                          if (pricing.hasExplicitPrices && pricing.finalPrice != null) ...[
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Text(
                                  '${pricing.finalPrice!.toStringAsFixed(0)} ج.م',
                                  style: const TextStyle(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 14,
                                  ),
                                ),
                                if (pricing.originalPrice != null && pricing.hasSavings) ...[
                                  const SizedBox(width: 6),
                                  Text(
                                    '${pricing.originalPrice!.toStringAsFixed(0)} ج.م',
                                    style: TextStyle(
                                      decoration: TextDecoration.lineThrough,
                                      color: isDark
                                          ? const Color(0xFF64748B)
                                          : const Color(0xFF94A3B8),
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                                if (saving != null && saving > 0) ...[
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 5,
                                      vertical: 1.5,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.green.withValues(alpha: 0.14),
                                      borderRadius: BorderRadius.circular(5),
                                    ),
                                    child: Text(
                                      'وفّرت ${saving.toStringAsFixed(0)} ج.م 🔥',
                                      style: const TextStyle(
                                        color: Colors.green,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 10,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ] else if (pricing.topDiscountBadge.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 6,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        pricing.topDiscountBadge.contains('%')
                                            ? pricing.topDiscountBadge
                                            : '${pricing.topDiscountBadge}%',
                                        textDirection: TextDirection.ltr,
                                        style: const TextStyle(
                                          color: AppColors.primary,
                                          fontWeight: FontWeight.w900,
                                          fontSize: 11,
                                        ),
                                      ),
                                      const SizedBox(width: 3),
                                      const Text(
                                        'خصم على الفاتورة',
                                        style: TextStyle(
                                          color: AppColors.primary,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 10,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      Icons.arrow_forward_ios_rounded,
                      size: 13,
                      color: isDark ? Colors.white38 : Colors.grey.shade400,
                    ),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(height: 8),

          // 3. Ticket Notch & Dashed Line Divider (Tightened density)
          Row(
            children: [
              Container(
                width: 12,
                height: 20,
                decoration: BoxDecoration(
                  color: theme.scaffoldBackgroundColor,
                  borderRadius: const BorderRadius.only(
                    topRight: Radius.circular(12),
                    bottomRight: Radius.circular(12),
                  ),
                  border: Border(
                    top: BorderSide(
                      color: isActive ? primaryBorder : inactiveBorder,
                      width: 1,
                    ),
                    right: BorderSide(
                      color: isActive ? primaryBorder : inactiveBorder,
                      width: 1,
                    ),
                    bottom: BorderSide(
                      color: isActive ? primaryBorder : inactiveBorder,
                      width: 1,
                    ),
                  ),
                ),
              ),
              Expanded(
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final boxWidth = constraints.constrainWidth();
                    const dashWidth = 5.0;
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
                              color: isDark
                                  ? Colors.white24
                                  : Colors.grey.shade300,
                              borderRadius: BorderRadius.circular(1),
                            ),
                          ),
                        );
                      }),
                    );
                  },
                ),
              ),
              Container(
                width: 12,
                height: 20,
                decoration: BoxDecoration(
                  color: theme.scaffoldBackgroundColor,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(12),
                    bottomLeft: Radius.circular(12),
                  ),
                  border: Border(
                    top: BorderSide(
                      color: isActive ? primaryBorder : inactiveBorder,
                      width: 1,
                    ),
                    left: BorderSide(
                      color: isActive ? primaryBorder : inactiveBorder,
                      width: 1,
                    ),
                    bottom: BorderSide(
                      color: isActive ? primaryBorder : inactiveBorder,
                      width: 1,
                    ),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 8),

          // 4. Monospace Coupon Code Box (LTR Protected) + Copy
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF0F172A)
                    : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark ? Colors.white12 : Colors.grey.shade300,
                  style: BorderStyle.solid,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.confirmation_num_rounded,
                      color: AppColors.primary,
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'كود الكوبون',
                          style: TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w600,
                            color: isDark
                                ? const Color(0xFF94A3B8)
                                : const Color(0xFF64748B),
                          ),
                        ),
                        const SizedBox(height: 1),
                        // Explicit LTR so Arabic RTL never inverts hyphen or numbers
                        Directionality(
                          textDirection: TextDirection.ltr,
                          child: Text(
                            coupon.code,
                            style: GoogleFonts.spaceMono(
                              fontWeight: FontWeight.w900,
                              fontSize: 15,
                              letterSpacing: 1.8,
                              color: isActive
                                  ? AppColors.primary
                                  : (isDark ? Colors.white60 : Colors.black54),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (isActive)
                    BouncyTap(
                      onTap: () => _copyCode(context, coupon.code),
                      scaleFactor: 0.94,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 11,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(9),
                          border: Border.all(
                            color: AppColors.primary.withValues(alpha: 0.25),
                            width: 1,
                          ),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.copy_rounded,
                              size: 13,
                              color: AppColors.primary,
                            ),
                            SizedBox(width: 4),
                            Text(
                              'نسخ',
                              style: TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.bold,
                                fontSize: 11.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    // Disabled copy indication for used/expired coupons
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.grey.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isUsed
                                ? Icons.check_circle_outline_rounded
                                : Icons.block_rounded,
                            size: 12,
                            color: Colors.grey,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            isUsed ? 'مُستخدم' : 'منتهي',
                            style: const TextStyle(
                              color: Colors.grey,
                              fontSize: 10.5,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 10),

          // 5. Actions / Status indication
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
            child: isActive
                ? Column(
                    children: [
                      // Accurate QR Redemption label: اعرض QR للكاشير
                      BouncyTap(
                        scaleFactor: 0.97,
                        child: Container(
                          width: double.infinity,
                          height: 44,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFFFF5722), Color(0xFFFF7043)],
                            ),
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primary.withValues(alpha: 0.35),
                                blurRadius: 10,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: ElevatedButton.icon(
                            onPressed: () {
                              HapticFeedback.lightImpact();
                              _showQRDialog(
                                context,
                                coupon.code,
                                store.name,
                                storeLogo: store.logo,
                                storeArea: store.area,
                                offerTitle: offer.title,
                                oldPrice: offer.oldPrice,
                                newPrice: offer.newPrice,
                                discount: offer.discount,
                                status: coupon.status,
                              );
                            },
                            icon: const Icon(
                              Icons.qr_code_2_rounded,
                              size: 20,
                            ),
                            label: const Text(
                              'اعرض QR للكاشير',
                              style: TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 13.5,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.transparent,
                              foregroundColor: Colors.white,
                              shadowColor: Colors.transparent,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      // Balanced row with equal Expanded width & real data validation
                      Row(
                        children: [
                          Expanded(
                            child: SizedBox(
                              height: 40,
                              child: OutlinedButton.icon(
                                onPressed: () => _openExternalMap(store),
                                icon: const Icon(Icons.location_on_rounded, size: 15),
                                label: const Text(
                                  'مكان الفرع',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: isDark
                                      ? Colors.white
                                      : AppColors.textPrimary,
                                  side: BorderSide(
                                    color: isDark
                                        ? Colors.white.withValues(alpha: 0.15)
                                        : Colors.grey.shade300,
                                    width: 1,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  padding: const EdgeInsets.symmetric(horizontal: 8),
                                ),
                              ),
                            ),
                          ),
                          if (store.phone != null && store.phone!.trim().isNotEmpty) ...[
                            const SizedBox(width: 8),
                            Expanded(
                              child: SizedBox(
                                height: 40,
                                child: OutlinedButton.icon(
                                  onPressed: () => _callStore(store.phone),
                                  icon: const Icon(Icons.phone_in_talk_rounded, size: 15),
                                  label: const Text(
                                    'اتصال بالمتجر',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: isDark
                                        ? Colors.white
                                        : AppColors.textPrimary,
                                    side: BorderSide(
                                      color: isDark
                                          ? Colors.white.withValues(alpha: 0.15)
                                          : Colors.grey.shade300,
                                      width: 1,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    padding: const EdgeInsets.symmetric(horizontal: 8),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  )
                : (isUsed
                    // Compact success indication with usage date
                    ? Container(
                        padding: const EdgeInsets.symmetric(
                          vertical: 8,
                          horizontal: 12,
                        ),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0x1510B981)
                              : const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: const Color(0x3010B981),
                            width: 1,
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(
                              Icons.check_circle_rounded,
                              size: 15,
                              color: Color(0xFF10B981),
                            ),
                            const SizedBox(width: 6),
                            Flexible(
                              child: Text(
                                coupon.redeemedAt != null
                                    ? 'تم استخدام الكوبون بنجاح في ${DateFormat('d MMMM yyyy', 'ar').format(coupon.redeemedAt!)} 🎉'
                                    : 'تم استخدام الكوبون بنجاح 🎉',
                                style: const TextStyle(
                                  color: Color(0xFF10B981),
                                  fontWeight: FontWeight.w700,
                                  fontSize: 11.5,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      )
                    // Compact expired indication with expiration date
                    : Container(
                        padding: const EdgeInsets.symmetric(
                          vertical: 8,
                          horizontal: 12,
                        ),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0x15EF4444)
                              : const Color(0xFFFEF2F2),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: const Color(0x30EF4444),
                            width: 1,
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(
                              Icons.history_rounded,
                              size: 15,
                              color: Color(0xFFEF4444),
                            ),
                            const SizedBox(width: 6),
                            Flexible(
                              child: Text(
                                coupon.expiresAt != null
                                    ? 'انتهت صلاحية هذا الكوبون في ${DateFormat('d MMMM yyyy', 'ar').format(coupon.expiresAt!)}'
                                    : 'انتهت صلاحية هذا الكوبون',
                                style: const TextStyle(
                                  color: Color(0xFFEF4444),
                                  fontWeight: FontWeight.w700,
                                  fontSize: 11.5,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      )),
          ),
        ],
      ),
    );
  }

  Widget _buildCouponSkeletonList() {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
      itemCount: 2,
      itemBuilder: (_, __) => const Padding(
        padding: EdgeInsets.only(bottom: 16),
        child: SkeletonLoader(
          width: double.infinity,
          height: 220,
          borderRadius: 20,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: const Icon(
                  Icons.arrow_back_ios_new_rounded,
                  size: 20,
                ),
                onPressed: () => Navigator.pop(context),
              )
            : null,
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
                  return _buildCouponSkeletonList();
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

                  // Requirement: In the All tab, show active coupons first, followed by used and expired coupons.
                  filteredCoupons.sort((a, b) {
                    if (a.isActive && !b.isActive) return -1;
                    if (!a.isActive && b.isActive) return 1;
                    return b.createdAt.compareTo(a.createdAt);
                  });

                  return Column(
                    children: [
                      _buildFilterTabs(allCoupons),
                      Expanded(
                        child: filteredCoupons.isEmpty
                            ? RefreshIndicator(
                                onRefresh: () async {
                                  context.read<CouponsBloc>().add(FetchUserCoupons());
                                },
                                child: SingleChildScrollView(
                                  physics: const AlwaysScrollableScrollPhysics(),
                                  padding: const EdgeInsets.fromLTRB(32, 50, 32, 120),
                                  child: Center(
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(28),
                                          decoration: BoxDecoration(
                                            color: AppColors.primary.withValues(alpha: 0.1),
                                            shape: BoxShape.circle,
                                          ),
                                          child: Icon(
                                            _activeTab == 'ACTIVE'
                                                ? Icons.confirmation_num_rounded
                                                : (_activeTab == 'USED'
                                                    ? Icons.receipt_long_rounded
                                                    : Icons.account_balance_wallet_outlined),
                                            size: 60,
                                            color: AppColors.primary,
                                          ),
                                        ),
                                        const SizedBox(height: 20),
                                        Text(
                                          _activeTab == 'ACTIVE'
                                              ? 'لا توجد كوبونات نشطة حالياً'
                                              : (_activeTab == 'USED'
                                                  ? 'لم تستخدم أي كوبونات بعد'
                                                  : 'لا توجد كوبونات مسجلة'),
                                          style: theme.textTheme.headlineSmall?.copyWith(
                                            fontWeight: FontWeight.w900,
                                            fontSize: 20,
                                          ),
                                          textAlign: TextAlign.center,
                                        ),
                                        const SizedBox(height: 10),
                                        Text(
                                          _activeTab == 'ACTIVE'
                                              ? 'احجز أقوى عروض ومطاعم الزقازيق دلوقتي، وهيظهر كوبونك هنا فوراً!'
                                              : (_activeTab == 'USED'
                                                  ? 'عندما تبرز رمز الـ QR أو كود الكوبون للكاشير في المتجر، ستظهر كوبوناتك المستفاد منها هنا.'
                                                  : 'ابدأ باستكشاف التخفيضات الحصرية في الزقازيق وأضف كوبوناتك إلى محفظتك الآن!'),
                                          textAlign: TextAlign.center,
                                          style: TextStyle(
                                            color: AppColors.textSecondary,
                                            height: 1.5,
                                            fontSize: 13.5,
                                          ),
                                        ),
                                        if (_activeTab != 'USED') ...[
                                          const SizedBox(height: 24),
                                          BouncyTap(
                                            onTap: () {
                                              final main = MainScreen.of(context);
                                              if (main != null) {
                                                main.setSelectedIndex(1);
                                              } else {
                                                Navigator.popUntil(context, (route) => route.isFirst);
                                                Future.delayed(const Duration(milliseconds: 150), () {
                                                  final rootContext = NavigationService.navigatorKey.currentContext;
                                                  if (rootContext != null && rootContext.mounted) {
                                                    MainScreen.of(rootContext)?.setSelectedIndex(1);
                                                  }
                                                });
                                              }
                                            },
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(
                                                  horizontal: 24, vertical: 12),
                                              decoration: BoxDecoration(
                                                gradient: const LinearGradient(
                                                  colors: [AppColors.primary, AppColors.secondary],
                                                ),
                                                borderRadius: BorderRadius.circular(14),
                                                boxShadow: [
                                                  BoxShadow(
                                                    color: AppColors.primary.withValues(alpha: 0.3),
                                                    blurRadius: 14,
                                                    offset: const Offset(0, 5),
                                                  ),
                                                ],
                                              ),
                                              child: const Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  Icon(Icons.local_offer_rounded,
                                                      color: Colors.white, size: 18),
                                                  SizedBox(width: 8),
                                                  Text(
                                                    'تصفح أقوى العروض الآن 🛍️',
                                                    style: TextStyle(
                                                      color: Colors.white,
                                                      fontWeight: FontWeight.bold,
                                                      fontSize: 14,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ],
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
                                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
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
                  return _buildCouponSkeletonList();
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
