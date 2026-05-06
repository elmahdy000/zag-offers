import 'package:zag_offers_vendor_app/core/utils/time_utils.dart';

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

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () async {
        context.read<DashboardBloc>().add(GetDashboardStatsRequested());
      },
      child: BlocBuilder<DashboardBloc, DashboardState>(
        builder: (context, state) {
          return SafeArea(
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                // Header
                SliverToBoxAdapter(
                  child: Container(
                    padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
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
                                  'مرحباً بك،',
                                  style: GoogleFonts.cairo(
                                    color: Colors.white70,
                                    fontSize: 14,
                                  ),
                                ),
                                Text(
                                  user?.name ?? 'تاجرنا المميز',
                                  style: GoogleFonts.cairo(
                                    color: Colors.white,
                                    fontSize: 22,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                            Stack(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  child: const Icon(
                                    Icons.notifications_none_rounded,
                                    color: Colors.white,
                                    size: 26,
                                  ),
                                ),
                                Positioned(
                                  right: 8,
                                  top: 8,
                                  child: Container(
                                    width: 8,
                                    height: 8,
                                    decoration: const BoxDecoration(
                                      color: AppColors.accent,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 32),
                        // Quick Stats Row
                        Row(
                          children: [
                            Expanded(
                              child: _buildStatCard(
                                title: 'عروض نشطة',
                                value: state is DashboardLoaded
                                    ? state.stats.activeOffers.toString()
                                    : '...',
                                icon: Icons.local_fire_department_rounded,
                                color: AppColors.accent,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildStatCard(
                                title: 'طلبات اليوم',
                                value: state is DashboardLoaded
                                    ? state.stats.claimsToday.toString()
                                    : '...',
                                icon: Icons.confirmation_num_outlined,
                                color: AppColors.primaryLight,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildStatCard(
                                title: 'مسح اليوم',
                                value: state is DashboardLoaded
                                    ? state.stats.scansToday.toString()
                                    : '...',
                                icon: Icons.qr_code_scanner_rounded,
                                color: AppColors.success,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                const SliverToBoxAdapter(child: SizedBox(height: 32)),

                // Quick Actions
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'إجراءات سريعة',
                          style: GoogleFonts.cairo(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildActionItem(
                              Icons.add_circle_outline,
                              'إضافة عرض',
                              AppColors.primary,
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (context) => const AddEditOfferPage()),
                                );
                              },
                            ),
                            _buildActionItem(
                              Icons.analytics_outlined,
                              'التحليلات',
                              AppColors.secondary,
                              onTap: () {
                                (context.findAncestorStateOfType<MainLayoutState>())?.setIndex(2);
                              },
                            ),
                            _buildActionItem(
                              Icons.reviews_outlined,
                              'التقييمات',
                              Colors.purple,
                              onTap: () {},
                            ),
                            _buildActionItem(
                              Icons.settings_outlined,
                              'الإعدادات',
                              AppColors.textSecondary,
                              onTap: () {
                                (context.findAncestorStateOfType<MainLayoutState>())?.setIndex(3);
                              },
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                const SliverToBoxAdapter(child: SizedBox(height: 32)),

                // Recent Activity Header
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'أحدث النشاطات',
                          style: GoogleFonts.cairo(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        TextButton(
                          onPressed: () {
                            (context.findAncestorStateOfType<MainLayoutState>())?.setIndex(2);
                          },
                          child: Text(
                            'عرض الكل',
                            style: GoogleFonts.cairo(
                              fontSize: 14,
                              color: AppColors.primary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SliverToBoxAdapter(child: SizedBox(height: 8)),

                if (state is DashboardLoading)
                  const SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                      child: DashboardSkeleton(),
                    ),
                  )
                else if (state is DashboardError)
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.cloud_off_rounded, size: 64, color: Colors.grey[400]),
                          const SizedBox(height: 16),
                          Text(
                            'تعذر جلب البيانات',
                            style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            state.message,
                            style: GoogleFonts.cairo(color: Colors.grey[600]),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 24),
                          ElevatedButton(
                            onPressed: () => context.read<DashboardBloc>().add(GetDashboardStatsRequested()),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: const Text('إعادة المحاولة'),
                          ),
                        ],
                      ),
                    ),
                  )
                else if (state is DashboardLoaded && state.stats.recentCoupons.isEmpty)
                  SliverToBoxAdapter(
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.all(48.0),
                        child: Column(
                          children: [
                            Icon(Icons.receipt_long_outlined, size: 64, color: Colors.grey[300]),
                            const SizedBox(height: 16),
                            Text(
                              'لا توجد نشاطات بعد',
                              style: GoogleFonts.cairo(
                                color: AppColors.textSecondary,
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  )
                else if (state is DashboardLoaded)
                  SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final coupon = state.stats.recentCoupons[index];
                        final isUsed = coupon.status == 'USED';

                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppColors.card,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: (isUsed ? AppColors.success : AppColors.primary).withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Icon(
                                    isUsed ? Icons.check_circle_outline : Icons.confirmation_num_outlined,
                                    color: isUsed ? AppColors.success : AppColors.primary,
                                    size: 24,
                                  ),
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
                                          height: 1.2,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'بواسطة: ${coupon.customerName}',
                                        style: GoogleFonts.cairo(
                                          color: AppColors.textSecondary,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: (isUsed ? AppColors.success : AppColors.primary).withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        isUsed ? 'تم المسح' : 'تم الطلب',
                                        style: GoogleFonts.cairo(
                                          color: isUsed ? AppColors.success : AppColors.primary,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 10,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      TimeUtils.getRelativeTime(isUsed ? (coupon.redeemedAt ?? coupon.createdAt) : coupon.createdAt),
                                      style: GoogleFonts.cairo(
                                        color: AppColors.textSecondary,
                                        fontSize: 11,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                      childCount: state.stats.recentCoupons.length,
                    ),
                  ),
                const SliverToBoxAdapter(child: SizedBox(height: 100)),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, color: color, size: 28),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '+12%',
                  style: GoogleFonts.cairo(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            value,
            style: GoogleFonts.cairo(
              color: Colors.white,
              fontSize: 28,
              fontWeight: FontWeight.bold,
              height: 1,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: GoogleFonts.cairo(color: Colors.white70, fontSize: 13),
          ),
        ],
      ),
    );
  }

  Widget _buildActionItem(IconData icon, String label, Color color, {VoidCallback? onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.card,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: color.withValues(alpha: 0.2),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: GoogleFonts.cairo(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}
