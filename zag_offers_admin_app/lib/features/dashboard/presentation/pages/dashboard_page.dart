import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_iconly/flutter_iconly.dart';
import 'package:zag_offers_admin_app/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:zag_offers_admin_app/features/merchants/presentation/bloc/merchants_bloc.dart';
import 'package:zag_offers_admin_app/features/merchants/presentation/pages/merchants_page.dart';
import 'package:zag_offers_admin_app/features/users/presentation/pages/users_page.dart';
import 'package:zag_offers_admin_app/features/offers/presentation/bloc/offers_bloc.dart';
import 'package:zag_offers_admin_app/features/offers/presentation/pages/offers_page.dart';
import 'package:zag_offers_admin_app/features/broadcast/presentation/pages/broadcast_page.dart';
import 'package:zag_offers_admin_app/features/audit_logs/presentation/pages/audit_logs_page.dart';
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

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  @override
  void initState() {
    super.initState();
    context.read<DashboardBloc>().add(LoadDashboardStatsEvent());
    sl<NotificationService>().init().catchError((e) {
      debugPrint('NotificationService init error: $e');
    });
    sl<RealtimeService>().connect(
      onAdminNotification: _handleAdminNotification,
    );
  }

  @override
  void dispose() {
    sl<RealtimeService>().disconnect();
    super.dispose();
  }

  void _handleAdminNotification(AdminRealtimeNotification notification) {
    if (!mounted) return;

    context.read<DashboardBloc>().add(LoadDashboardStatsEvent());

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
        backgroundColor: const Color(0xFF0F172A),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      body: BlocBuilder<DashboardBloc, DashboardState>(
        builder: (context, state) {
          return RefreshIndicator(
            onRefresh: () async {
              context.read<DashboardBloc>().add(LoadDashboardStatsEvent());
            },
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: _buildHeader(context),
                ),
                if (state is DashboardInitial || state is DashboardLoading)
                  const SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: CardSkeleton(),
                    ),
                  )
                else if (state is DashboardLoaded) ...[
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
                    sliver: SliverToBoxAdapter(
                      child: _buildStatsGrid(state.stats),
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
                      ),
                    ),
                  ),
                  SliverPadding(
                    padding: const EdgeInsets.all(24),
                    sliver: SliverToBoxAdapter(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildSectionTitle('الإدارة والتحكم'),
                          const SizedBox(height: 16),
                          _buildActionsGrid(context),
                        ],
                      ),
                    ),
                  ),
                ] else if (state is DashboardError)
                  SliverFillRemaining(
                    child: _buildErrorState(state),
                  ),
                const SliverToBoxAdapter(child: SizedBox(height: 40)),
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
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF1E293B),
            Color(0xFF0F172A),
          ],
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(32),
          bottomRight: Radius.circular(32),
        ),
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
                    'لوحة القيادة',
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
        color: const Color(0xFF1E293B),
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
      childAspectRatio: 1.3,
      children: [
        _buildStatCard('إجمالي التجار', stats.totalMerchants.toString(), IconlyBold.store, Colors.blue),
        _buildStatCard('إجمالي المستخدمين', stats.totalUsers.toString(), IconlyBold.userGroup, Colors.green),
        _buildStatCard('العروض النشطة', stats.activeOffers.toString(), IconlyBold.discount, Colors.orange),
        _buildStatCard('طلبات معلقة', stats.pendingMerchants.toString(), IconlyBold.timeCircle, Colors.red),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
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
                  color: const Color(0xFF0F172A),
                ),
              ),
              Text(
                title,
                style: GoogleFonts.cairo(
                  fontSize: 12,
                  color: const Color(0xFF64748B),
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
      mainAxisSpacing: 20,
      crossAxisSpacing: 10,
      children: [
        _buildQuickAction(context, 'التجار', IconlyLight.store, Colors.blue, const MerchantsPage()),
        _buildQuickAction(context, 'المستخدمين', IconlyLight.userGroup, Colors.green, const UsersPage()),
        _buildQuickAction(context, 'العروض', IconlyLight.discount, Colors.orange, const OffersPage()),
        _buildQuickAction(context, 'الأقسام', IconlyLight.category, Colors.indigo, const CategoriesPage()),
        _buildQuickAction(context, 'الكوبونات', IconlyLight.ticket, Colors.amber, const CouponsPage()),
        _buildQuickAction(context, 'التنبيهات', IconlyLight.send, Colors.purple, const BroadcastPage()),
        _buildQuickAction(context, 'السجلات', IconlyLight.document, Colors.blueGrey, const AuditLogsPage()),
        _buildQuickAction(context, 'الإعدادات', IconlyLight.setting, Colors.blueGrey.shade900, const ProfilePage()),
      ],
    );
  }

  Widget _buildQuickAction(BuildContext context, String label, IconData icon, Color color, Widget page) {
    return Column(
      children: [
        InkWell(
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => page)),
          borderRadius: BorderRadius.circular(16),
          child: Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: color, size: 26),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: GoogleFonts.cairo(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
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
        color: Colors.white,
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
            getDrawingHorizontalLine: (_) => FlLine(color: Colors.blueGrey.withValues(alpha: 0.05), strokeWidth: 1),
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
                    child: Text(bars[idx].label, style: GoogleFonts.cairo(fontSize: 10, color: Colors.blueGrey[500], fontWeight: FontWeight.bold)),
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
            const Icon(IconlyBold.shieldFail, size: 64, color: Colors.redAccent),
            const SizedBox(height: 16),
            Text('خطأ في جلب البيانات', style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(state.message, textAlign: TextAlign.center, style: GoogleFonts.inter(fontSize: 14, color: Colors.blueGrey[500])),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => context.read<DashboardBloc>().add(LoadDashboardStatsEvent()),
              icon: const Icon(IconlyLight.swap),
              label: const Text('إعادة المحاولة'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
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
