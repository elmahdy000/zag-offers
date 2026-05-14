import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../core/widgets/stat_card.dart';
import '../../../../../core/widgets/glass_card.dart';
import '../../../../../core/widgets/notification_bubble.dart';
import '../../../offers/presentation/pages/add_edit_offer_page.dart';
import '../../../offers/presentation/pages/offers_page.dart';
import '../../../qr_scanner/presentation/pages/qr_scanner_page.dart';
import '../../domain/entities/dashboard_stats_entity.dart';
import '../bloc/dashboard_bloc.dart';
import 'package:zag_offers_vendor_app/features/notifications/presentation/pages/notifications_page.dart';
import 'package:flutter_iconly/flutter_iconly.dart';

class EnhancedDashboardPage extends StatefulWidget {
  const EnhancedDashboardPage({super.key});

  @override
  State<EnhancedDashboardPage> createState() => _EnhancedDashboardPageState();
}

class _EnhancedDashboardPageState extends State<EnhancedDashboardPage>
    with TickerProviderStateMixin {
  late AnimationController _backgroundController;
  late AnimationController _statsController;
  late AnimationController _actionController;
  
  final List<NotificationData> _notifications = [];
  bool _isRefreshing = false;
  String _lastUpdated = '';

  @override
  void initState() {
    super.initState();
    
    _backgroundController = AnimationController(
      duration: const Duration(seconds: 20),
      vsync: this,
    )..repeat();
    
    _statsController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    
    _actionController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    
    _loadData();
    _updateTimestamp();
  }

  @override
  void dispose() {
    _backgroundController.dispose();
    _statsController.dispose();
    _actionController.dispose();
    super.dispose();
  }

  void _loadData() {
    _statsController.forward(from: 0);
    _actionController.forward(from: 0);
    context.read<DashboardBloc>().add(GetDashboardStatsRequested());
  }

  void _updateTimestamp() {
    setState(() {
      _lastUpdated = DateTime.now().toString().substring(11, 16);
    });
  }

  Future<void> _refreshData() async {
    setState(() => _isRefreshing = true);
    _loadData();
    _updateTimestamp();
    await Future.delayed(const Duration(milliseconds: 800));
    if (!mounted) return;
    setState(() => _isRefreshing = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: NotificationOverlay(
        notifications: _notifications,
        child: Stack(
          children: [
            _buildBackground(),
            SafeArea(
              child: RefreshIndicator(
                onRefresh: _refreshData,
                color: AppColors.primary,
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildHeader(),
                      const SizedBox(height: 32),
                      _buildStatsGrid(),
                      const SizedBox(height: 32),
                      _buildQuickActions(),
                      const SizedBox(height: 32),
                      _buildInsightsSection(),
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

  Widget _buildBackground() {
    return AnimatedBuilder(
      animation: _backgroundController,
      builder: (context, child) {
        return Stack(
          children: [
            Positioned(
              top: -200,
              right: -200,
              child: Transform.rotate(
                angle: _backgroundController.value * 2 * 3.14159,
                child: Container(
                  width: 600,
                  height: 600,
                  decoration: BoxDecoration(
                    gradient: RadialGradient(
                      colors: [AppColors.primary.withValues(alpha: 0.05), Colors.transparent],
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: AppColors.glassBackground,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.glassBorder, width: 1),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(width: 8, height: 8, decoration: const BoxDecoration(color: AppColors.success, shape: BoxShape.circle)),
              const SizedBox(width: 8),
              Text('المتجر نشط الآن', style: AppTheme.small.copyWith(color: AppColors.textDimmer)),
              if (_lastUpdated.isNotEmpty) ...[
                const SizedBox(width: 8),
                Text('• تحديث $_lastUpdated', style: AppTheme.small.copyWith(color: AppColors.textDimmer)),
              ],
            ],
          ),
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            BlocBuilder<DashboardBloc, DashboardState>(
              builder: (context, state) {
                String name = 'متجر زاج';
                if (state is DashboardLoaded) name = state.stats.storeName ?? name;
                return Expanded(
                  child: Text(
                    'مرحبًا بك،\n$name',
                    style: GoogleFonts.cairo(
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        height: 1.2,
                        color: AppColors.text),
                  ),
                );
              },
            ),
            _buildNotificationButton(),
          ],
        ),
      ],
    );
  }

  Widget _buildNotificationButton() {
    return GlassCard(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const NotificationsPage()),
      ),
      padding: const EdgeInsets.all(12),
      borderRadius: 18,
      child: Icon(
        IconlyLight.notification,
        color: AppColors.text,
        size: 28,
      ),
    );
  }

  Widget _buildStatsGrid() {
    return BlocBuilder<DashboardBloc, DashboardState>(
      builder: (context, state) {
        if (state is DashboardLoaded) {
          final s = state.stats;
          return GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 1.1,
            children: [
              StatCard(label: 'نشاط اليوم', value: s.claimsToday.toString(), icon: Icons.local_activity, color: AppColors.primary, bgColor: AppColors.primary, index: 0),
              StatCard(label: 'عروض نشطة', value: s.activeOffers.toString(), icon: Icons.star, color: AppColors.secondary, bgColor: AppColors.secondary, index: 1),
              StatCard(label: 'المسح اليومي', value: s.scansToday.toString(), icon: Icons.qr_code_scanner, color: AppColors.blue, bgColor: AppColors.blue, index: 2),
              StatCard(label: 'إجمالي الطلبات', value: s.totalClaims.toString(), icon: Icons.people, color: AppColors.purple, bgColor: AppColors.purple, index: 3),
            ],
          );
        }
        return const Center(child: CircularProgressIndicator());
      },
    );
  }

  Widget _buildQuickActions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('الإجراءات السريعة', style: AppTheme.title.copyWith(fontWeight: FontWeight.w900)),
        const SizedBox(height: 16),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 4,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          children: [
            _buildActionItem('العروض', Icons.local_offer, AppColors.emerald, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const OffersPage()))),
            _buildActionItem('مسح الكود', Icons.qr_code_scanner, AppColors.primary, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const QRScannerPage(storeId: '')))), // ID handled by Bloc
            _buildActionItem('إضافة', Icons.add_circle_outline, AppColors.purple, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AddEditOfferPage()))),
            _buildActionItem('الملف', Icons.store, AppColors.blue, () {}),
          ],
        ),
      ],
    );
  }

  Widget _buildActionItem(String label, IconData icon, Color color, VoidCallback onTap) {
    return GlassCard(
      onTap: onTap,
      padding: const EdgeInsets.all(8),
      borderRadius: 20,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 4),
          Text(label, style: AppTheme.caption.copyWith(fontWeight: FontWeight.bold, fontSize: 10), textAlign: TextAlign.center),
        ],
      ),
    );
  }

  Widget _buildInsightsSection() {
    return BlocBuilder<DashboardBloc, DashboardState>(
      builder: (context, state) {
        if (state is DashboardLoaded) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildTopOffers(state.stats),
              const SizedBox(height: 24),
              _buildRecentActivity(state.stats),
            ],
          );
        }
        return const SizedBox();
      },
    );
  }

  Widget _buildTopOffers(DashboardStatsEntity stats) {
    return GlassContainer(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.trending_up, color: AppColors.secondary, size: 20),
              const SizedBox(width: 8),
              Text('أفضل العروض أداءً', style: AppTheme.body.copyWith(fontWeight: FontWeight.w900)),
            ],
          ),
          const SizedBox(height: 16),
          if (stats.topOffers.isEmpty)
            _buildEmptyState('لا توجد عروض نشطة حالياً')
          else
            ...stats.topOffers.map((o) => _buildOfferRow(o)),
        ],
      ),
    );
  }

  Widget _buildOfferRow(TopOfferEntity offer) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(offer.title, style: const TextStyle(fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
                Text('${offer.claims} طلب • ${offer.views} مشاهدة', style: AppTheme.caption.copyWith(color: AppColors.textDimmer)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(color: AppColors.secondary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
            child: Text(offer.discount, style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 12)),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentActivity(DashboardStatsEntity stats) {
    return GlassContainer(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.history, color: AppColors.primary, size: 20),
              const SizedBox(width: 8),
              Text('آخر العمليات', style: AppTheme.body.copyWith(fontWeight: FontWeight.w900)),
            ],
          ),
          const SizedBox(height: 16),
          if (stats.recentCoupons.isEmpty)
            _buildEmptyState('لا توجد عمليات مؤخراً')
          else
            ...stats.recentCoupons.take(3).map((c) => _buildCouponRow(c)),
        ],
      ),
    );
  }

  Widget _buildCouponRow(RecentCouponEntity coupon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          CircleAvatar(backgroundColor: AppColors.primary.withValues(alpha: 0.1), radius: 18, child: const Icon(Icons.person, size: 18, color: AppColors.primary)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(coupon.customerName, style: const TextStyle(fontWeight: FontWeight.bold)),
                Text(coupon.offerTitle, style: AppTheme.caption, maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          Text(coupon.status == 'USED' ? 'تم الاستخدام' : 'متاح', style: TextStyle(color: coupon.status == 'USED' ? AppColors.success : AppColors.secondary, fontSize: 11, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Text(message, style: AppTheme.caption.copyWith(color: AppColors.textDimmer)),
      ),
    );
  }
}
