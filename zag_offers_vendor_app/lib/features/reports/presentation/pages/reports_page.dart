import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_vendor_app/core/theme/app_colors.dart';
import 'package:zag_offers_vendor_app/core/utils/time_utils.dart';
import 'package:zag_offers_vendor_app/features/dashboard/presentation/bloc/dashboard_bloc.dart';
import 'package:zag_offers_vendor_app/core/widgets/skeleton_loader.dart';

class ReportsPage extends StatelessWidget {
  const ReportsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'تقارير الأداء',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        backgroundColor: AppColors.background,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppColors.primary),
            onPressed: () => context.read<DashboardBloc>().add(GetDashboardStatsRequested()),
          ),
        ],
      ),
      body: BlocBuilder<DashboardBloc, DashboardState>(
        builder: (context, state) {
          if (state is DashboardLoading) {
            return const Padding(
              padding: EdgeInsets.all(24.0),
              child: ListSkeleton(itemCount: 6),
            );
          } else if (state is DashboardError) {
            return _buildErrorState(context, state.message);
          } else if (state is DashboardLoaded) {
            return RefreshIndicator(
              onRefresh: () async {
                context.read<DashboardBloc>().add(GetDashboardStatsRequested());
              },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Summary Section
                    Text(
                      'نظرة عامة',
                      style: GoogleFonts.cairo(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: _buildSummaryCard(
                            'إجمالي المسح',
                            state.stats.scansToday.toString(),
                            Icons.qr_code_scanner_rounded,
                            AppColors.primary,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildSummaryCard(
                            'عروض نشطة',
                            state.stats.activeOffers.toString(),
                            Icons.local_offer_rounded,
                            AppColors.secondary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),

                    // Chart Section (Placeholder for now)
                    Text(
                      'إحصائيات الاستخدام الأسبوعية',
                      style: GoogleFonts.cairo(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      height: 200,
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: CustomPaint(
                        painter: SimpleChartPainter(AppColors.primary),
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Detailed Activity
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'سجل العمليات الأخير',
                          style: GoogleFonts.cairo(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        if (state.stats.recentCoupons.isNotEmpty)
                          Text(
                            '${state.stats.recentCoupons.length} عملية',
                            style: GoogleFonts.cairo(
                              fontSize: 14,
                              color: AppColors.textSecondary,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    if (state.stats.recentCoupons.isEmpty)
                      _buildEmptyState()
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: state.stats.recentCoupons.length,
                        itemBuilder: (context, index) {
                          final coupon = state.stats.recentCoupons[index];
                          return _buildHistoryItem(coupon);
                        },
                      ),
                    const SizedBox(height: 100),
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

  Widget _buildSummaryCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.05),
            blurRadius: 15,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 16),
          Text(
            value,
            style: GoogleFonts.cairo(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          Text(
            title,
            style: GoogleFonts.cairo(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryItem(dynamic coupon) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey[50]!),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.success.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.check_rounded, color: AppColors.success),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  coupon.offerTitle,
                  style: GoogleFonts.cairo(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    color: AppColors.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  'العميل: ${coupon.customerName}',
                  style: GoogleFonts.cairo(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '#${coupon.code}',
                style: GoogleFonts.cairo(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  color: AppColors.primary,
                ),
              ),
              Text(
                TimeUtils.getRelativeTime(coupon.redeemedAt),
                style: GoogleFonts.cairo(
                  fontSize: 11,
                  color: Colors.grey,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          children: [
            Icon(Icons.history_rounded, size: 64, color: Colors.grey[200]),
            const SizedBox(height: 16),
            Text(
              'لا يوجد سجل عمليات بعد',
              style: GoogleFonts.cairo(color: Colors.grey, fontSize: 16),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: AppColors.error),
            const SizedBox(height: 16),
            Text(message, textAlign: TextAlign.center, style: GoogleFonts.cairo()),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.read<DashboardBloc>().add(GetDashboardStatsRequested()),
              child: const Text('إعادة المحاولة'),
            ),
          ],
        ),
      ),
    );
  }
}

class SimpleChartPainter extends CustomPainter {
  final Color color;
  SimpleChartPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withValues(alpha: 0.1)
      ..style = PaintingStyle.fill;

    final linePaint = Paint()
      ..color = color
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final path = Path();
    final points = [
      Offset(0, size.height * 0.8),
      Offset(size.width * 0.2, size.height * 0.6),
      Offset(size.width * 0.4, size.height * 0.7),
      Offset(size.width * 0.6, size.height * 0.4),
      Offset(size.width * 0.8, size.height * 0.5),
      Offset(size.width, size.height * 0.2),
    ];

    path.moveTo(points[0].dx, points[0].dy);
    for (var i = 1; i < points.length; i++) {
      path.lineTo(points[i].dx, points[i].dy);
    }

    canvas.drawPath(path, linePaint);

    // Fill area
    final fillPath = Path.from(path)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(fillPath, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
