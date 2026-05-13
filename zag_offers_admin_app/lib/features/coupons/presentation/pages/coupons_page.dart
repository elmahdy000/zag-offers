import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
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
        title: const Text('سجل الكوبونات'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(130),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                child: TextField(
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
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                child: SingleChildScrollView(
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
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
      body: BlocConsumer<CouponsBloc, CouponsState>(
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
            if (state.coupons.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), shape: BoxShape.circle),
                      child: Icon(Icons.confirmation_number_rounded, size: 64, color: AppColors.primary.withValues(alpha: 0.7)),
                    ),
                    const SizedBox(height: 24),
                    Text('لا توجد كوبونات', style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                  ],
                ),
              );
            }
            return RefreshIndicator(
              onRefresh: () async {
                context.read<CouponsBloc>().add(LoadCouponsEvent(search: _searchController.text.trim().isEmpty ? null : _searchController.text.trim(), status: _selectedStatus));
              },
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: state.coupons.length,
                itemBuilder: (context, index) => _buildCouponCard(state.coupons[index]),
              ),
            );
          } else if (state is CouponsError) {
            return Center(
              child: ElevatedButton(
                onPressed: () => context.read<CouponsBloc>().add(LoadCouponsEvent(search: _searchController.text.trim().isEmpty ? null : _searchController.text.trim(), status: _selectedStatus)),
                child: const Text('إعادة المحاولة'),
              ),
            );
          }
          return const SizedBox();
        },
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

  Widget _buildCouponCard(Coupon coupon) {
    final statusColor = _getStatusColor(coupon.status);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: InkWell(
        onTap: () => _showCouponDetails(context, coupon),
        borderRadius: BorderRadius.circular(20),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(12)),
                    child: const Icon(Icons.confirmation_number_rounded, color: AppColors.primary, size: 22),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(coupon.code, style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 1.5, color: AppColors.textPrimary)),
                        Text(coupon.storeName, style: GoogleFonts.cairo(fontSize: 13, color: AppColors.textSecondary)),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                    child: Text(
                      _statusLabel(coupon.status),
                      style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, thickness: 0.5),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildMiniStat('العميل', coupon.customerName, Icons.person_rounded),
                  _buildMiniStat('التاريخ', DateFormat('yyyy/MM/dd', 'ar').format(coupon.createdAt), Icons.calendar_month_rounded),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMiniStat(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppColors.textSecondary.withValues(alpha: 0.5)),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: GoogleFonts.cairo(fontSize: 10, color: AppColors.textSecondary)),
            Text(value, style: GoogleFonts.cairo(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          ],
        ),
      ],
    );
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'GENERATED': return 'قيد الانتظار';
      case 'USED': return 'مستخدم';
      case 'EXPIRED': return 'منتهي';
      default: return status;
    }
  }

  void _showCouponDetails(BuildContext context, Coupon coupon) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(10)))),
            const SizedBox(height: 32),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                  child: const Icon(Icons.confirmation_number_rounded, color: AppColors.primary, size: 28),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(coupon.code, style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.bold, letterSpacing: 2, color: AppColors.textPrimary)),
                      Text(coupon.storeName, style: GoogleFonts.cairo(fontSize: 15, color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
                    ],
                  ),
                ),
                _buildStatusBadge(coupon.status),
              ],
            ),
            const SizedBox(height: 32),
            _buildDetailRow(Icons.person_outline_rounded, 'اسم العميل', coupon.customerName),
            _buildDetailRow(Icons.calendar_today_rounded, 'تاريخ الإصدار', DateFormat('yyyy/MM/dd - hh:mm a', 'ar').format(coupon.createdAt)),
            _buildDetailRow(Icons.local_offer_outlined, 'عنوان العرض', coupon.offerTitle),
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('إغلاق'),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: TextButton.icon(
                onPressed: () async {
                  final shouldDelete = await showDialog<bool>(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: const Text('حذف الكوبون'),
                      content: const Text('هل أنت متأكد من حذف هذا الكوبون؟'),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('إلغاء')),
                        TextButton(onPressed: () => Navigator.pop(context, true), style: TextButton.styleFrom(foregroundColor: AppColors.error), child: const Text('حذف')),
                      ],
                    ),
                  );
                  if (shouldDelete == true && context.mounted) {
                    context.read<CouponsBloc>().add(DeleteCouponEvent(id: coupon.id));
                    Navigator.pop(context);
                  }
                },
                icon: const Icon(Icons.delete_outline_rounded, color: AppColors.error, size: 20),
                label: const Text('حذف الكوبون', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    final statusColor = _getStatusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
      child: Text(_statusLabel(status), style: TextStyle(color: statusColor, fontSize: 12, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        children: [
          Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(10)), child: Icon(icon, size: 20, color: AppColors.primary)),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: GoogleFonts.cairo(fontSize: 11, color: AppColors.textSecondary)),
              Text(value, style: GoogleFonts.cairo(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            ],
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'USED': return AppColors.success;
      case 'EXPIRED': return AppColors.error;
      case 'GENERATED': return AppColors.primary;
      default: return AppColors.textSecondary;
    }
  }
}
