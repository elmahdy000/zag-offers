import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_vendor_app/core/theme/app_colors.dart';
import 'package:zag_offers_vendor_app/core/utils/time_utils.dart';
import 'package:zag_offers_vendor_app/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:zag_offers_vendor_app/features/dashboard/presentation/bloc/dashboard_bloc.dart';
import 'package:zag_offers_vendor_app/features/dashboard/presentation/widgets/dashboard_skeleton.dart';
import 'package:zag_offers_vendor_app/features/offers/presentation/pages/add_edit_offer_page.dart';
import 'package:zag_offers_vendor_app/features/main/presentation/layout/main_layout.dart';
import 'package:zag_offers_vendor_app/features/notifications/presentation/pages/notifications_page.dart';

class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.select((AuthBloc bloc) {
      if (bloc.state is AuthAuthenticated) {
        return (bloc.state as AuthAuthenticated).user;
      }
      return null;
    });

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () async {
          context.read<DashboardBloc>().add(GetDashboardStatsRequested());
        },
        child: BlocBuilder<DashboardBloc, DashboardState>(
          builder: (context, state) {
            return CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                // Header - Industrial Glass Style
                SliverAppBar(
                  expandedHeight: 220,
                  floating: false,
                  pinned: true,
                  backgroundColor: AppColors.background,
                  elevation: 0,
                  flexibleSpace: FlexibleSpaceBar(
                    background: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            AppColors.primary.withValues(alpha: 0.8),
                            AppColors.primaryDark,
                          ],
                        ),
                      ),
                      child: Stack(
                        children: [
                          Positioned(
                            right: -50,
                            top: -50,
                            child: CircleAvatar(
                              radius: 120,
                              backgroundColor: Colors.white.withValues(alpha: 0.05),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.fromLTRB(24, 60, 24, 0),
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
                                          'نظرة عامة',
                                          style: GoogleFonts.cairo(
                                            color: Colors.white70,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            letterSpacing: 0.5,
                                          ),
                                        ),
                                        Text(
                                          user?.name ?? 'تاجرنا المميز',
                                          style: GoogleFonts.cairo(
                                            color: Colors.white,
                                            fontSize: 20,
                                            fontWeight: FontWeight.w900,
                                          ),
                                        ),
                                      ],
                                    ),
                                    _buildIconButton(
                                      Icons.notifications_none_rounded,
                                      () => Navigator.push(
                                        context,
                                        MaterialPageRoute(builder: (_) => const NotificationsPage()),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 24),
                                // Floating Stats Header
                                Row(
                                  children: [
                                    Expanded(
                                      child: InkWell(
                                        onTap: () => context.findAncestorStateOfType<MainLayoutState>()?.setIndex(1),
                                        child: _buildHeaderStat(
                                          'عروض نشطة',
                                          state is DashboardLoaded ? state.stats.activeOffers.toString() : '...',
                                          Icons.local_fire_department_rounded,
                                        ),
                                      ),
                                    ),
                                    _buildVerticalDivider(),
                                    Expanded(
                                      child: InkWell(
                                        onTap: () => context.findAncestorStateOfType<MainLayoutState>()?.setIndex(2),
                                        child: _buildHeaderStat(
                                          'طلبات اليوم',
                                          state is DashboardLoaded ? state.stats.claimsToday.toString() : '...',
                                          Icons.confirmation_num_outlined,
                                        ),
                                      ),
                                    ),
                                    _buildVerticalDivider(),
                                    Expanded(
                                      child: InkWell(
                                        onTap: () => context.findAncestorStateOfType<MainLayoutState>()?.setIndex(2),
                                        child: _buildHeaderStat(
                                          'مسح اليوم',
                                          state is DashboardLoaded ? state.stats.scansToday.toString() : '...',
                                          Icons.qr_code_scanner_rounded,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                const SliverToBoxAdapter(child: SizedBox(height: 24)),

                // Action Grid - Professional Style
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildSectionHeader('الإجراءات السريعة'),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildCompactAction(
                              Icons.add_rounded,
                              'إضافة عرض',
                              AppColors.primary,
                              () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AddEditOfferPage())),
                            ),
                            _buildCompactAction(
                              Icons.analytics_rounded,
                              'التحليلات',
                              AppColors.accent,
                              () => context.findAncestorStateOfType<MainLayoutState>()?.setIndex(2),
                            ),
                            _buildCompactAction(
                              Icons.star_rounded,
                              'التقييمات',
                              Colors.amber,
                              () => ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('ميزة التقييمات ستتوفر قريباً')),
                              ),
                            ),
                            _buildCompactAction(
                              Icons.settings_rounded,
                              'الإعدادات',
                              AppColors.textTertiary,
                              () => context.findAncestorStateOfType<MainLayoutState>()?.setIndex(3),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                const SliverToBoxAdapter(child: SizedBox(height: 32)),

                // Activity List
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildSectionHeader('أحدث النشاطات'),
                        TextButton(
                          onPressed: () => context.findAncestorStateOfType<MainLayoutState>()?.setIndex(2),
                          child: Text(
                            'عرض الكل',
                            style: GoogleFonts.cairo(
                              fontSize: 12,
                              color: AppColors.primary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                if (state is DashboardLoading)
                  const SliverToBoxAdapter(child: DashboardSkeleton())
                else if (state is DashboardLoaded)
                  state.stats.recentCoupons.isEmpty
                      ? _buildEmptyState()
                      : SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (context, index) => _buildActivityTile(state.stats.recentCoupons[index]),
                            childCount: state.stats.recentCoupons.length,
                          ),
                        ),

                const SliverToBoxAdapter(child: SizedBox(height: 100)),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildIconButton(IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        child: Icon(icon, color: Colors.white, size: 22),
      ),
    );
  }

  Widget _buildHeaderStat(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: Colors.white, size: 20),
        const SizedBox(height: 8),
        Text(
          value,
          style: GoogleFonts.cairo(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w900,
            height: 1,
          ),
        ),
        Text(
          label,
          style: GoogleFonts.cairo(
            color: Colors.white70,
            fontSize: 10,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildVerticalDivider() {
    return Container(
      height: 30,
      width: 1,
      color: Colors.white.withValues(alpha: 0.1),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: GoogleFonts.cairo(
        fontSize: 15,
        fontWeight: FontWeight.w900,
        color: AppColors.textPrimary,
        letterSpacing: 0.5,
      ),
    );
  }

  Widget _buildCompactAction(IconData icon, String label, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Icon(icon, color: color, size: 26),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: GoogleFonts.cairo(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActivityTile(dynamic coupon) {
    final bool isUsed = coupon.status == 'USED';
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: (isUsed ? AppColors.success : AppColors.primary).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                isUsed ? Icons.check_rounded : Icons.local_activity_rounded,
                color: isUsed ? AppColors.success : AppColors.primary,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    coupon.offerTitle,
                    style: GoogleFonts.cairo(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: AppColors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    'العميل: ${coupon.customerName}',
                    style: GoogleFonts.cairo(
                      color: AppColors.textSecondary,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  isUsed ? 'تم المسح' : 'طلب جديد',
                  style: GoogleFonts.cairo(
                    color: isUsed ? AppColors.success : AppColors.primary,
                    fontWeight: FontWeight.w900,
                    fontSize: 9,
                  ),
                ),
                Text(
                  TimeUtils.getRelativeTime(isUsed ? (coupon.redeemedAt ?? coupon.createdAt) : coupon.createdAt),
                  style: GoogleFonts.cairo(
                    color: AppColors.textTertiary,
                    fontSize: 9,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return SliverFillRemaining(
      hasScrollBody: false,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inbox_rounded, size: 48, color: AppColors.border),
            const SizedBox(height: 16),
            Text(
              'لا توجد نشاطات حالياً',
              style: GoogleFonts.cairo(color: AppColors.textTertiary, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}
