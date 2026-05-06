import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:zag_offers_admin_app/features/coupons/domain/entities/coupon.dart';
import 'package:zag_offers_admin_app/features/coupons/presentation/bloc/coupons_bloc.dart';
import 'package:zag_offers_admin_app/core/widgets/skeleton_loader.dart';

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
    // BlocProvider is now global (via MultiBlocProvider in main.dart)
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
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'سجل الكوبونات',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(120),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'البحث عن الكوبونات...',
                    prefixIcon: const Icon(
                      Icons.search,
                      color: Color(0xFFFF6B00),
                    ),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              setState(() {});
                              context.read<CouponsBloc>().add(
                                LoadCouponsEvent(status: _selectedStatus),
                              );
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide(
                        color: Colors.orange.withValues(alpha: 0.1),
                      ),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(
                        color: Color(0xFFFF6B00),
                        width: 1,
                      ),
                    ),
                    contentPadding: const EdgeInsets.symmetric(vertical: 0),
                  ),
                  onChanged: (value) {
                    setState(() {}); // rebuild for suffixIcon
                    context.read<CouponsBloc>().add(
                      LoadCouponsEvent(search: value, status: _selectedStatus),
                    );
                  },
                ),
              ),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16.0,
                  vertical: 8.0,
                ),
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
            ],
          ),
        ),
      ),
      body: BlocConsumer<CouponsBloc, CouponsState>(
        listener: (context, state) {
          if (state is CouponsError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: Colors.red),
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
                    Icon(
                      Icons.confirmation_number_outlined,
                      size: 64,
                      color: Colors.blueGrey[300],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'لم يتم العثور على كوبونات',
                      style: GoogleFonts.cairo(color: Colors.blueGrey[500]),
                    ),
                  ],
                ),
              );
            }
            return RefreshIndicator(
              onRefresh: () async {
                context.read<CouponsBloc>().add(
                  LoadCouponsEvent(
                    search: _searchController.text.trim().isEmpty
                        ? null
                        : _searchController.text.trim(),
                    status: _selectedStatus,
                  ),
                );
              },
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: state.coupons.length,
                itemBuilder: (context, index) {
                  return _buildCouponCard(state.coupons[index]);
                },
              ),
            );
          } else if (state is CouponsError) {
            return Center(
              child: ElevatedButton(
                onPressed: () => context.read<CouponsBloc>().add(
                  LoadCouponsEvent(
                    search: _searchController.text.trim().isEmpty
                        ? null
                        : _searchController.text.trim(),
                    status: _selectedStatus,
                  ),
                ),
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
          context.read<CouponsBloc>().add(
            LoadCouponsEvent(
              search: _searchController.text.trim().isEmpty
                  ? null
                  : _searchController.text.trim(),
              status: status,
            ),
          );
        }
      },
      selectedColor: const Color(0xFFFF6B00).withValues(alpha: 0.1),
      labelStyle: TextStyle(
        color: isSelected ? const Color(0xFFFF6B00) : Colors.blueGrey[600],
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
    );
  }

  Widget _buildCouponCard(Coupon coupon) {
    final statusColor = _getStatusColor(coupon.status);

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: Colors.blueGrey[100]!.withValues(alpha: 0.5)),
      ),
      child: InkWell(
        onTap: () => _showCouponDetails(context, coupon),
        borderRadius: BorderRadius.circular(20),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.orange[50],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.confirmation_number,
                      color: Colors.orange,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          coupon.code,
                          style: GoogleFonts.inter(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 2,
                          ),
                        ),
                        Text(
                          coupon.storeName,
                          style: GoogleFonts.cairo(
                            fontSize: 14,
                            color: Colors.blueGrey[500],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      coupon.status == 'GENERATED'
                          ? 'قيد الانتظار'
                          : coupon.status == 'USED'
                          ? 'مستخدم'
                          : 'منتهي',
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'العميل',
                        style: GoogleFonts.cairo(
                          fontSize: 10,
                          color: Colors.blueGrey[400],
                        ),
                      ),
                      Text(
                        coupon.customerName,
                        style: GoogleFonts.cairo(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'تاريخ الإصدار',
                        style: GoogleFonts.cairo(
                          fontSize: 10,
                          color: Colors.blueGrey[400],
                        ),
                      ),
                      Text(
                        DateFormat('yyyy/MM/dd', 'ar').format(coupon.createdAt),
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
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
    );
  }

  void _showCouponDetails(BuildContext context, Coupon coupon) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.blueGrey[200],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.orange[50],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.confirmation_number,
                    color: Colors.orange,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        coupon.code,
                        style: GoogleFonts.inter(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 2,
                        ),
                      ),
                      Text(
                        coupon.storeName,
                        style: GoogleFonts.cairo(
                          fontSize: 16,
                          color: Colors.blueGrey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                _buildStatusBadge(coupon.status),
              ],
            ),
            const SizedBox(height: 32),
            _buildDetailRow(
              Icons.person_outline,
              'اسم العميل',
              coupon.customerName,
            ),
            _buildDetailRow(
              Icons.calendar_today_outlined,
              'تاريخ الإصدار',
              DateFormat('yyyy/MM/dd - hh:mm a', 'ar').format(coupon.createdAt),
            ),
            _buildDetailRow(
              Icons.local_offer_outlined,
              'عنوان العرض',
              coupon.offerTitle,
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFF6B00),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  'إغلاق',
                  style: GoogleFonts.cairo(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
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
                        TextButton(
                          onPressed: () => Navigator.pop(context, false),
                          child: const Text('إلغاء'),
                        ),
                        TextButton(
                          onPressed: () => Navigator.pop(context, true),
                          style: TextButton.styleFrom(foregroundColor: Colors.red),
                          child: const Text('حذف'),
                        ),
                      ],
                    ),
                  );
                  if (shouldDelete == true && context.mounted) {
                    context.read<CouponsBloc>().add(DeleteCouponEvent(id: coupon.id));
                    Navigator.pop(context);
                  }
                },
                icon: const Icon(Icons.delete_outline, color: Colors.red),
                label: const Text(
                  'حذف الكوبون',
                  style: TextStyle(color: Colors.red),
                ),
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
      decoration: BoxDecoration(
        color: statusColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status == 'GENERATED'
            ? 'قيد الانتظار'
            : status == 'USED'
            ? 'مستخدم'
            : 'منتهي',
        style: TextStyle(
          color: statusColor,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.blueGrey[400]),
          const SizedBox(width: 12),
          Text(
            label,
            style: GoogleFonts.cairo(fontSize: 14, color: Colors.blueGrey[500]),
          ),
          const Spacer(),
          Text(
            value,
            style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'USED':
        return Colors.green;
      case 'EXPIRED':
        return Colors.red;
      case 'GENERATED':
        return const Color(0xFFFF6B00);
      default:
        return Colors.blueGrey;
    }
  }
}

