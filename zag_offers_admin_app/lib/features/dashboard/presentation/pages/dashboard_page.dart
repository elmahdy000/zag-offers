import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
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
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'لوحة التحكم',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const NotificationsPage()),
              );
            },
            icon: const Icon(
              Icons.notifications_outlined,
              color: Color(0xFF64748B),
            ),
          ),
          IconButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ProfilePage()),
              );
            },
            icon: const Icon(
              Icons.account_circle_outlined,
              color: Color(0xFFFF6B00),
            ),
          ),
          IconButton(
            onPressed: () {
              context.read<AuthBloc>().add(LogoutEvent());
            },
            icon: const Icon(Icons.logout, color: Colors.red),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: BlocBuilder<DashboardBloc, DashboardState>(
        builder: (context, state) {
          if (state is DashboardInitial || state is DashboardLoading) {
            return const Padding(
              padding: EdgeInsets.all(32),
              child: CardSkeleton(),
            );
          } else if (state is DashboardLoaded) {
            final stats = state.stats;
            return RefreshIndicator(
              onRefresh: () async {
                context.read<DashboardBloc>().add(LoadDashboardStatsEvent());
              },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'أهلاً بك، الأدمن',
                      style: GoogleFonts.cairo(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.blueGrey[800],
                      ),
                    ),
                    const SizedBox(height: 24),
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      childAspectRatio: 1.5,
                      children: [
                        _buildStatCard(
                          'التجار',
                          stats.totalMerchants.toString(),
                          Icons.store,
                          Colors.blue,
                        ),
                        _buildStatCard(
                          'المستخدمين',
                          stats.totalUsers.toString(),
                          Icons.people,
                          Colors.green,
                        ),
                        _buildStatCard(
                          'العروض النشطة',
                          stats.activeOffers.toString(),
                          Icons.local_offer,
                          Colors.orange,
                        ),
                        _buildStatCard(
                          'قيد الانتظار',
                          stats.pendingMerchants.toString(),
                          Icons.pending_actions,
                          Colors.red,
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'نظرة عامة على المنصة',
                      style: GoogleFonts.cairo(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildStatsChart(stats),
                    const SizedBox(height: 32),
                    Text(
                      'إجراءات سريعة',
                      style: GoogleFonts.cairo(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildActionItem(
                      context,
                      'إدارة التجار',
                      Icons.store,
                      Colors.blue,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const MerchantsPage(),
                          ),
                        );
                      },
                    ),
                    _buildActionItem(
                      context,
                      'إدارة المستخدمين',
                      Icons.people,
                      Colors.green,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const UsersPage()),
                        );
                      },
                    ),
                    _buildActionItem(
                      context,
                      'إدارة العروض',
                      Icons.local_offer,
                      Colors.orange,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const OffersPage()),
                        );
                      },
                    ),
                    _buildActionItem(
                      context,
                      'إرسال تنبيه جماعي',
                      Icons.campaign,
                      Colors.purple,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const BroadcastPage(),
                          ),
                        );
                      },
                    ),
                    _buildActionItem(
                      context,
                      'سجل الكوبونات',
                      Icons.confirmation_number,
                      Colors.amber,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const CouponsPage(),
                          ),
                        );
                      },
                    ),
                    _buildActionItem(
                      context,
                      'سجل العمليات',
                      Icons.list_alt,
                      Colors.blueGrey,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const AuditLogsPage(),
                          ),
                        );
                      },
                    ),
                    _buildActionItem(
                      context,
                      'إدارة الأقسام',
                      Icons.category,
                      Colors.indigo,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const CategoriesPage(),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            );
          } else if (state is DashboardError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.cloud_off_rounded,
                      size: 64,
                      color: Colors.red[300],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Failed to load dashboard',
                      style: GoogleFonts.cairo(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.blueGrey[800],
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      state.message,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: Colors.blueGrey[500],
                      ),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      onPressed: () => context.read<DashboardBloc>().add(
                        LoadDashboardStatsEvent(),
                      ),
                      icon: const Icon(Icons.refresh),
                      label: const Text('Retry'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }
          return const SizedBox();
        },
      ),
    );
  }

  /// Bar chart driven by actual API stats — no more dummy data.
  Widget _buildStatsChart(DashboardStats stats) {
    final bars = [
      _ChartBar(
        label: 'Merchants',
        value: stats.totalMerchants.toDouble(),
        color: Colors.blue,
      ),
      _ChartBar(
        label: 'Users',
        value: stats.totalUsers.toDouble(),
        color: Colors.green,
      ),
      _ChartBar(
        label: 'Offers',
        value: stats.activeOffers.toDouble(),
        color: Colors.orange,
      ),
      _ChartBar(
        label: 'Pending',
        value: stats.pendingMerchants.toDouble(),
        color: Colors.red,
      ),
    ];

    final maxY = bars.map((b) => b.value).reduce((a, b) => a > b ? a : b);
    final chartMaxY = maxY == 0 ? 10.0 : (maxY * 1.3).ceilToDouble();

    return Container(
      height: 220,
      padding: const EdgeInsets.fromLTRB(8, 16, 16, 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: BarChart(
        BarChartData(
          maxY: chartMaxY,
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            getDrawingHorizontalLine: (_) => FlLine(
              color: Colors.blueGrey.withValues(alpha: 0.08),
              strokeWidth: 1,
            ),
          ),
          borderData: FlBorderData(show: false),
          titlesData: FlTitlesData(
            leftTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false),
            ),
            rightTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false),
            ),
            topTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false),
            ),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 32,
                getTitlesWidget: (value, _) {
                  final idx = value.toInt();
                  if (idx < 0 || idx >= bars.length) return const SizedBox();
                  return Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      bars[idx].label,
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        color: Colors.blueGrey[500],
                        fontWeight: FontWeight.w600,
                      ),
                    ),
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
                  width: 28,
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(8),
                  ),
                  backDrawRodData: BackgroundBarChartRodData(
                    show: true,
                    toY: chartMaxY,
                    color: bar.color.withValues(alpha: 0.06),
                  ),
                ),
              ],
            );
          }),
        ),
      ),
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(icon, color: color, size: 28),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                title,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: Colors.blueGrey[500],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionItem(
    BuildContext context,
    String title,
    IconData icon,
    Color color, {
    required VoidCallback onTap,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 0,
      color: Colors.white,
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: color),
        ),
        title: Text(
          title,
          style: GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}

/// Simple data holder for the bar chart.
class _ChartBar {
  final String label;
  final double value;
  final Color color;
  const _ChartBar({
    required this.label,
    required this.value,
    required this.color,
  });
}
