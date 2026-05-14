import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_iconly/flutter_iconly.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:zag_offers_admin_app/features/coupons/domain/entities/coupon.dart';
import 'package:zag_offers_admin_app/features/coupons/presentation/bloc/coupons_bloc.dart';
import 'package:zag_offers_admin_app/core/widgets/skeleton_loader.dart';
import 'package:zag_offers_admin_app/core/theme/app_colors.dart';

class CouponsPage extends StatefulWidget {
  const CouponsPage({super.key});

  @override
  State<CouponsPage> createState() => _CouponsPageState();
}

class _CouponsPageState extends State<CouponsPage> {
  String? _selectedStatus;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    context.read<CouponsBloc>().add(const LoadCouponsEvent());
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('سجل الكوبونات المتقدم'),
      ),
      body: Column(
        children: [
          _buildSearchAndFilter(),
          Expanded(
            child: BlocConsumer<CouponsBloc, CouponsState>(
              listener: (context, state) {
                if (state is CouponsError) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(state.message), backgroundColor: AppColors.error),
                  );
                }
              },
              builder: (context, state) {
                if (state is CouponsLoading) {
                  return const ListSkeleton(itemCount: 5);
                } else if (state is CouponsLoaded) {
                  final coupons = state.coupons;
                  if (coupons.isEmpty) {
                    return _buildEmptyState();
                  }

                  // Group coupons by storeName
                  final Map<String, List<Coupon>> grouped = {};
                  for (var c in coupons) {
                    grouped.putIfAbsent(c.storeName, () => []).add(c);
                  }

                  return RefreshIndicator(
                    onRefresh: () async {
                      context.read<CouponsBloc>().add(LoadCouponsEvent(
                            search: _searchController.text.trim().isEmpty ? null : _searchController.text.trim(),
                            status: _selectedStatus,
                          ));
                    },
                    child: ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                      itemCount: grouped.length,
                      itemBuilder: (context, index) {
                        final storeName = grouped.keys.elementAt(index);
                        final storeCoupons = grouped[storeName]!;
                        return _buildStoreCouponGroup(storeName, storeCoupons)
                            .animate(delay: (index * 100).ms)
                            .fadeIn(duration: 400.ms)
                            .slideY(begin: 0.1, curve: Curves.easeOutCubic);
                      },
                    ),
                  );
                }
                return const SizedBox();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchAndFilter() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: AppColors.white,
      child: Column(
        children: [
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'البحث عن الكوبونات...',
              prefixIcon: const Icon(Icons.search_rounded, color: AppColors.primary),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear_rounded),
                      onPressed: () {
                        _searchController.clear();
                        setState(() {});
                        context.read<CouponsBloc>().add(LoadCouponsEvent(status: _selectedStatus));
                      },
                    )
                  : null,
            ),
            onChanged: (value) {
              setState(() {});
              context.read<CouponsBloc>().add(LoadCouponsEvent(search: value, status: _selectedStatus));
            },
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip(null, 'الكل'),
                const SizedBox(width: 8),
                _buildFilterChip('GENERATED', 'قيد الانتظار'),
                const SizedBox(width: 8),
                _buildFilterChip('USED', 'مستخدم'),
                const SizedBox(width: 8),
                _buildFilterChip('EXPIRED', 'منتهي'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStoreCouponGroup(String storeName, List<Coupon> coupons) {
    final int generated = coupons.where((c) => c.status == 'GENERATED').length;
    final int used = coupons.where((c) => c.status == 'USED').length;

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4))],
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        children: [
          // Store Header
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.02),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                  child: const Icon(IconlyBold.buy, color: AppColors.primary, size: 20),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(storeName, style: GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                      Text('${coupons.length} كوبون إجمالي', style: GoogleFonts.cairo(fontSize: 12, color: AppColors.textSecondary)),
                    ],
                  ),
                ),
                _buildStatBadge('المسحوبة', generated.toString(), Colors.blue),
                const SizedBox(width: 8),
                _buildStatBadge('المقبولة', used.toString(), AppColors.success),
              ],
            ),
          ),
          const Divider(height: 1, thickness: 0.5),
          // Coupons List (Expandable or fixed list)
          Padding(
            padding: const EdgeInsets.all(8),
            child: ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: coupons.length > 3 ? 4 : coupons.length,
              itemBuilder: (context, index) {
                if (index == 3) {
                  return TextButton(
                    onPressed: () => _showAllStoreCoupons(storeName, coupons),
                    child: Text('عرض الكل (${coupons.length})', style: GoogleFonts.cairo(fontSize: 13, fontWeight: FontWeight.bold)),
                  );
                }
                final coupon = coupons[index];
                return _buildMiniCouponTile(coupon);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMiniCouponTile(Coupon coupon) {
    final statusColor = _getStatusColor(coupon.status);
    return ListTile(
      dense: true,
      onTap: () => _showCouponDetails(context, coupon),
      leading: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.1), shape: BoxShape.circle),
        child: Icon(_getStatusIcon(coupon.status), color: statusColor, size: 14),
      ),
      title: Text(coupon.code, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 1.2)),
      subtitle: Text(coupon.customerName, style: GoogleFonts.cairo(fontSize: 11)),
      trailing: Text(
        DateFormat('dd/MM HH:mm', 'ar').format(coupon.createdAt),
        style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary),
      ),
    );
  }

  Widget _buildStatBadge(String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: color)),
        Text(label, style: GoogleFonts.cairo(fontSize: 9, color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
      ],
    );
  }

  void _showAllStoreCoupons(String storeName, List<Coupon> coupons) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        builder: (_, scrollController) => Container(
          decoration: const BoxDecoration(color: AppColors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Text('كوبونات $storeName', style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              Expanded(
                child: ListView.separated(
                  controller: scrollController,
                  itemCount: coupons.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, index) => _buildMiniCouponTile(coupons[index])
                      .animate(delay: (index * 50).ms)
                      .fadeIn()
                      .slideX(begin: 0.1),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), shape: BoxShape.circle),
            child: Icon(IconlyBold.ticket, size: 64, color: AppColors.primary.withValues(alpha: 0.7)),
          ),
          const SizedBox(height: 24),
          Text('لا توجد كوبونات', style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String? status, String label) {
    final isSelected = _selectedStatus == status;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) {
          setState(() => _selectedStatus = status);
          context.read<CouponsBloc>().add(LoadCouponsEvent(search: _searchController.text.trim().isEmpty ? null : _searchController.text.trim(), status: status));
        }
      },
      selectedColor: AppColors.primary.withValues(alpha: 0.15),
      labelStyle: TextStyle(
        color: isSelected ? AppColors.primary : AppColors.textSecondary,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        fontFamily: GoogleFonts.cairo().fontFamily,
      ),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: isSelected ? AppColors.primary : Colors.grey.shade200)),
      showCheckmark: false,
    );
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'USED': return Icons.check_circle_rounded;
      case 'EXPIRED': return Icons.cancel_rounded;
      default: return Icons.timer_rounded;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'USED': return AppColors.success;
      case 'EXPIRED': return AppColors.error;
      case 'GENERATED': return AppColors.primary;
      default: return AppColors.textSecondary;
    }
  }

  void _showCouponDetails(BuildContext context, Coupon coupon) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('تفاصيل الكوبون', style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),
            const SizedBox(height: 24),
            _buildDetailRow(IconlyBold.ticket, 'الكود', coupon.code),
            _buildDetailRow(IconlyBold.user2, 'العميل', coupon.customerName),
            _buildDetailRow(IconlyBold.buy, 'المحل', coupon.storeName),
            _buildDetailRow(IconlyBold.discount, 'العرض', coupon.offerTitle),
            _buildDetailRow(IconlyBold.timeCircle, 'التاريخ', DateFormat('yyyy/MM/dd hh:mm a', 'ar').format(coupon.createdAt)),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(onPressed: () => Navigator.pop(context), child: const Text('إغلاق')),
            ),
            const SizedBox(height: 12),
            TextButton.icon(
              onPressed: () {
                context.read<CouponsBloc>().add(DeleteCouponEvent(id: coupon.id));
                Navigator.pop(context);
              },
              icon: const Icon(Icons.delete_outline_rounded, color: AppColors.error, size: 18),
              label: const Text('حذف سجل الكوبون', style: TextStyle(color: AppColors.error)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.primary),
          const SizedBox(width: 12),
          Text(label, style: GoogleFonts.cairo(fontSize: 14, color: AppColors.textSecondary)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
