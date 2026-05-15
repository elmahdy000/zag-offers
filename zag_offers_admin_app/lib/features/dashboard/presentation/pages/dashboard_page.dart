import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_iconly/flutter_iconly.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import 'package:zag_offers_admin_app/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:zag_offers_admin_app/features/merchants/presentation/bloc/merchants_bloc.dart';
import 'package:zag_offers_admin_app/features/merchants/presentation/pages/merchants_page.dart';
import 'package:zag_offers_admin_app/features/merchants/presentation/pages/add_merchant_page.dart';
import 'package:zag_offers_admin_app/features/users/presentation/pages/users_page.dart';
import 'package:zag_offers_admin_app/features/offers/presentation/bloc/offers_bloc.dart';
import 'package:zag_offers_admin_app/features/offers/presentation/pages/offers_page.dart';
import 'package:zag_offers_admin_app/features/broadcast/presentation/pages/broadcast_page.dart';
import 'package:zag_offers_admin_app/features/audit_logs/presentation/bloc/audit_logs_bloc.dart';
import 'package:zag_offers_admin_app/features/audit_logs/presentation/pages/audit_logs_page.dart';
import 'package:zag_offers_admin_app/features/audit_logs/domain/entities/audit_log.dart';
import 'package:zag_offers_admin_app/features/categories/presentation/pages/categories_page.dart';
import 'package:zag_offers_admin_app/features/coupons/presentation/pages/coupons_page.dart';
import 'package:zag_offers_admin_app/features/profile/presentation/pages/profile_page.dart';
import 'package:zag_offers_admin_app/features/dashboard/presentation/bloc/dashboard_bloc.dart';
import 'package:zag_offers_admin_app/features/dashboard/domain/entities/stats.dart';
import 'package:zag_offers_admin_app/injection_container.dart';
import 'package:zag_offers_admin_app/core/services/notification_service.dart';
import 'package:zag_offers_admin_app/core/services/realtime_service.dart';
import 'package:zag_offers_admin_app/core/widgets/skeleton_loader.dart';
import 'package:zag_offers_admin_app/features/notifications/presentation/pages/notifications_page.dart';
import 'package:zag_offers_admin_app/core/theme/app_colors.dart';

typedef OnTabSelected = void Function(int index);

class DashboardPage extends StatefulWidget {
  final OnTabSelected onTabSelected;
  const DashboardPage({super.key, required this.onTabSelected});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    
    context.read<DashboardBloc>().add(LoadDashboardStatsEvent());
    context.read<AuditLogsBloc>().add(LoadAuditLogsEvent());
    
    NotificationService.initStatic().catchError((e) {
      debugPrint('NotificationService init error: $e');
    });
    
    sl<RealtimeService>().connect(
      onAdminNotification: _handleAdminNotification,
    );
  }

  @override
  void dispose() {
    sl<RealtimeService>().disconnect();
    _pulseController.dispose();
    super.dispose();
  }

  void _handleAdminNotification(AdminRealtimeNotification notification) {
    if (!mounted) return;

    context.read<DashboardBloc>().add(LoadDashboardStatsEvent());
    context.read<AuditLogsBloc>().add(LoadAuditLogsEvent());

    if (notification.type == 'NEW_PENDING_OFFER') {
      context.read<OffersBloc>().add(const LoadOffersEvent());
    } else if (notification.type == 'NEW_PENDING_STORE') {
      context.read<MerchantsBloc>().add(const LoadMerchantsEvent());
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(notification.body.isEmpty
            ? notification.title
            : '${notification.title}\n${notification.body}'),
        backgroundColor: AppColors.textPrimary,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: BlocBuilder<DashboardBloc, DashboardState>(
        builder: (context, state) {
          return RefreshIndicator(
            onRefresh: () async {
              context.read<DashboardBloc>().add(LoadDashboardStatsEvent());
              context.read<AuditLogsBloc>().add(LoadAuditLogsEvent());
            },
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: _buildHeader(context),
                ),
                if (state is DashboardInitial || state is DashboardLoading)
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: const CardSkeleton().animate().fadeIn().slideY(begin: 0.1),
                    ),
                  )
                else if (state is DashboardLoaded) ...[
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
                    sliver: SliverToBoxAdapter(
                      child: _buildStatsGrid(state.stats).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1, curve: Curves.easeOutCubic),
                    ),
                  ),
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    sliver: SliverToBoxAdapter(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildSectionTitle('نظرة عامة على النظام'),
                          const SizedBox(height: 16),
                          _buildStatsChart(state.stats),
                        ],
                      ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1),
                    ),
                  ),
                  
                  // --- Live Activity Stream ---
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(24, 32, 24, 0),
                    sliver: SliverToBoxAdapter(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _buildLiveSectionTitle('بث مباشر للعمليات'),
                          TextButton(
                            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AuditLogsPage())),
                            child: Text('عرض السجلات', style: GoogleFonts.cairo(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary)),
                          ),
                        ],
                      ),
                    ),
                  ),
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    sliver: SliverToBoxAdapter(
                      child: _buildLiveActivityStream(),
                    ),
                  ),

                  SliverPadding(
                    padding: const EdgeInsets.all(24),
                    sliver: SliverToBoxAdapter(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildSectionTitle('الإدارة والتحكم السريع'),
                          const SizedBox(height: 16),
                          _buildActionsGrid(context),
                        ],
                      ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.1),
                    ),
                  ),
                ] else if (state is DashboardError)
                  SliverFillRemaining(
                    child: _buildErrorState(state),
                  ),
                const SliverToBoxAdapter(child: SizedBox(height: 120)),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(24, 60, 24, 40),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF2D3436),
            Color(0xFF000000),
          ],
        ),
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(32),
          bottomRight: Radius.circular(32),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'لوحة القيادة المركزية',
                    style: GoogleFonts.cairo(
                      color: Colors.white70,
                      fontSize: 14,
                    ),
                  ),
                  Text(
                    'مرحباً، المدير العام',
                    style: GoogleFonts.cairo(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              Row(
                children: [
                  _buildHeaderIconButton(
                    icon: IconlyLight.notification,
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsPage())),
                  ),
                  const SizedBox(width: 12),
                  _buildHeaderIconButton(
                    icon: IconlyLight.profile,
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfilePage())),
                    color: AppColors.primary,
                  ),
                  const SizedBox(width: 12),
                  _buildHeaderIconButton(
                    icon: IconlyLight.logout,
                    onTap: () => context.read<AuthBloc>().add(LogoutEvent()),
                    color: Colors.redAccent,
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHeaderIconButton({required IconData icon, required VoidCallback onTap, Color? color}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: color ?? Colors.white, size: 22),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.cairo(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: AppColors.textPrimary,
      ),
    );
  }

  Widget _buildLiveSectionTitle(String title) {
    return Row(
      children: [
        ScaleTransition(
          scale: Tween(begin: 0.8, end: 1.2).animate(CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut)),
          child: Container(width: 8, height: 8, decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle)),
        ),
        const SizedBox(width: 8),
        Text(title, style: GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
      ],
    );
  }

  Widget _buildLiveActivityStream() {
    return BlocBuilder<AuditLogsBloc, AuditLogsState>(
      builder: (context, state) {
        if (state is AuditLogsLoading) {
          return const ListSkeleton(itemCount: 3);
        }
        if (state is AuditLogsLoaded) {
          final logs = state.logs.take(5).toList();
          if (logs.isEmpty) {
            return Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: AppColors.white, borderRadius: BorderRadius.circular(20)),
              child: Center(child: Text('لا يوجد نشاطات مسجلة حالياً', style: GoogleFonts.cairo(color: AppColors.textSecondary))),
            );
          }
          return Container(
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 20, offset: const Offset(0, 10))],
            ),
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: logs.length,
              separatorBuilder: (_, __) => Divider(height: 1, color: Colors.grey.shade100, indent: 70),
              itemBuilder: (context, index) {
                final log = logs[index];
                return _buildActivityTile(log);
              },
            ),
          );
        }
        return const SizedBox();
      },
    );
  }

  Widget _buildActivityTile(AuditLog log) {
    String actionText = 'عملية غير معروفة';
    Color color = Colors.grey;
    IconData icon = IconlyBold.infoSquare;

    // Advanced Mapping
    final action = log.action.toUpperCase();
    if (action.contains('MERCHANT') || action.contains('STORE')) {
      actionText = action.contains('REGISTER') || action.contains('SIGNUP') ? 'تسجيل تاجر جديد' : 'تحديث بيانات تاجر';
      if (action.contains('APPROVE')) actionText = 'الموافقة على تاجر';
      color = Colors.blue;
      icon = Icons.storefront_rounded;
    } else if (action.contains('OFFER')) {
      actionText = action.contains('CREATE') || action.contains('ADD') ? 'إضافة عرض جديد' : 'تحديث عرض';
      color = Colors.orange;
      icon = IconlyBold.discount;
    } else if (action.contains('COUPON')) {
      actionText = action.contains('GENERATE') || action.contains('REDEEM') ? 'سحب كوبون خصم' : 'استخدام كوبون';
      color = action.contains('USE') ? Colors.teal : Colors.purple;
      icon = action.contains('USE') ? Icons.verified_rounded : Icons.qr_code_rounded;
    } else if (action.contains('BROADCAST')) {
      actionText = 'إرسال إشعار جماعي';
      color = Colors.red;
      icon = Icons.campaign_rounded;
    } else if (action.contains('LOGIN')) {
      actionText = 'دخول للوحة التحكم';
      color = Colors.indigo;
      icon = Icons.login_rounded;
    } else if (action == 'CREATE') {
      actionText = 'إضافة سجل جديد';
      color = Colors.blue;
      icon = Icons.add_circle_rounded;
    } else if (action == 'UPDATE') {
      actionText = 'تعديل في النظام';
      color = Colors.orange;
      icon = Icons.edit_rounded;
    } else if (action == 'DELETE') {
      actionText = 'حذف من النظام';
      color = Colors.red;
      icon = Icons.delete_forever_rounded;
    } else {
      actionText = log.action.replaceAll('_', ' ').toLowerCase();
    }

    // Clean up technical details
    String cleanDetails = log.details ?? '';
    if (cleanDetails.contains('{') || cleanDetails.contains('ID:') || cleanDetails.length > 60) {
      cleanDetails = ''; // Hide if it looks like technical JSON or IDs
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(12),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: color, size: 22),
        ),
        title: Text(actionText, style: GoogleFonts.cairo(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (cleanDetails.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Text(cleanDetails, style: GoogleFonts.cairo(fontSize: 12, color: AppColors.textSecondary)),
              ),
            Row(
              children: [
                Text(DateFormat('hh:mm a', 'ar').format(log.createdAt), style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary)),
                const SizedBox(width: 8),
                Container(width: 3, height: 3, decoration: const BoxDecoration(color: Colors.grey, shape: BoxShape.circle)),
                const SizedBox(width: 8),
                Text(log.adminName, style: GoogleFonts.cairo(fontSize: 10, color: AppColors.primary, fontWeight: FontWeight.w600)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsGrid(DashboardStats stats) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 1.2,
      children: [
        _buildStatCard('إجمالي التجار', stats.totalMerchants.toString(), IconlyBold.buy, Colors.blue),
        _buildStatCard('إجمالي المستخدمين', stats.totalUsers.toString(), IconlyBold.user2, Colors.green),
        _buildStatCard('العروض النشطة', stats.activeOffers.toString(), IconlyBold.discount, Colors.orange),
        _buildStatCard('طلبات معلقة', stats.pendingMerchants.toString(), IconlyBold.timeCircle, Colors.red),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.08),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: GoogleFonts.inter(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              Text(
                title,
                style: GoogleFonts.cairo(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionsGrid(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 4,
      mainAxisSpacing: 16,
      crossAxisSpacing: 10,
      childAspectRatio: 0.85,
      children: [
        _buildQuickAction(context, 'التجار', IconlyLight.buy, Colors.blue, null, tabIndex: 1),
        _buildQuickAction(context, 'إضافة تاجر', IconlyLight.addUser, Colors.orange, const AddMerchantPage()),
        _buildQuickAction(context, 'المستخدمين', IconlyLight.user2, Colors.green, const UsersPage()),
        _buildQuickAction(context, 'العروض', IconlyLight.discount, Colors.orange, null, tabIndex: 2),
        _buildQuickAction(context, 'الأقسام', IconlyLight.category, Colors.indigo, const CategoriesPage()),
        _buildQuickAction(context, 'الكوبونات', IconlyLight.ticket, Colors.amber, null, tabIndex: 3),
        _buildQuickAction(context, 'التنبيهات', IconlyLight.send, Colors.purple, null, tabIndex: 4),
        _buildQuickAction(context, 'السجلات', IconlyLight.document, Colors.blueGrey, const AuditLogsPage()),
        _buildQuickAction(context, 'الإعدادات', IconlyLight.setting, AppColors.textPrimary, const ProfilePage()),
      ],
    );
  }

  Widget _buildQuickAction(BuildContext context, String label, IconData icon, Color color, Widget? page, {int? tabIndex}) {
    return Column(
      children: [
        InkWell(
          onTap: () {
            if (tabIndex != null) {
              widget.onTabSelected(tabIndex);
            } else if (page != null) {
              Navigator.push(context, MaterialPageRoute(builder: (_) => page));
            }
          },
          borderRadius: BorderRadius.circular(16),
          child: Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: GoogleFonts.cairo(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          textAlign: TextAlign.center,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  Widget _buildStatsChart(DashboardStats stats) {
    final bars = [
      _ChartBar(label: 'التجار', value: stats.totalMerchants.toDouble(), color: Colors.blue),
      _ChartBar(label: 'المستخدمين', value: stats.totalUsers.toDouble(), color: Colors.green),
      _ChartBar(label: 'العروض', value: stats.activeOffers.toDouble(), color: Colors.orange),
      _ChartBar(label: 'المعلق', value: stats.pendingMerchants.toDouble(), color: Colors.red),
    ];

    final maxY = bars.map((b) => b.value).reduce((a, b) => a > b ? a : b);
    final chartMaxY = maxY == 0 ? 10.0 : (maxY * 1.3).ceilToDouble();

    return Container(
      height: 240,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: BarChart(
        BarChartData(
          maxY: chartMaxY,
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            getDrawingHorizontalLine: (_) => FlLine(color: AppColors.textSecondary.withValues(alpha: 0.05), strokeWidth: 1),
          ),
          borderData: FlBorderData(show: false),
          titlesData: FlTitlesData(
            leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                getTitlesWidget: (value, _) {
                  final idx = value.toInt();
                  if (idx < 0 || idx >= bars.length) return const SizedBox();
                  return Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(bars[idx].label, style: GoogleFonts.cairo(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
                  );
                },
              ),
            ),
          ),
          barGroups: List.generate(bars.length, (i) {
            final bar = bars[i];
            return BarChartGroupData(
              x: i,
              barRods: [
                BarChartRodData(
                  toY: bar.value,
                  color: bar.color,
                  width: 32,
                  borderRadius: BorderRadius.circular(8),
                  backDrawRodData: BackgroundBarChartRodData(show: true, toY: chartMaxY, color: bar.color.withValues(alpha: 0.05)),
                ),
              ],
            );
          }),
        ),
      ),
    );
  }

  Widget _buildErrorState(DashboardError state) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(IconlyBold.shieldFail, size: 64, color: AppColors.error),
            const SizedBox(height: 16),
            Text('خطأ في جلب البيانات', style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(state.message, textAlign: TextAlign.center, style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary)),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => context.read<DashboardBloc>().add(LoadDashboardStatsEvent()),
              icon: const Icon(IconlyLight.swap),
              label: const Text('إعادة المحاولة'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ChartBar {
  final String label;
  final double value;
  final Color color;
  const _ChartBar({required this.label, required this.value, required this.color});
}
