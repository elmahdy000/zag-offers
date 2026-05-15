import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_admin_app/features/merchants/domain/entities/merchant.dart';
import 'package:zag_offers_admin_app/features/merchants/presentation/bloc/merchants_bloc.dart';
import 'package:zag_offers_admin_app/core/widgets/network_image.dart';
import 'package:zag_offers_admin_app/core/widgets/skeleton_loader.dart';
import 'package:zag_offers_admin_app/features/merchants/presentation/widgets/merchant_card.dart';
import 'package:zag_offers_admin_app/core/widgets/custom_dialogs.dart';
import 'package:zag_offers_admin_app/core/theme/app_colors.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_iconly/flutter_iconly.dart';
import 'package:zag_offers_admin_app/features/merchants/presentation/pages/add_merchant_page.dart';

class MerchantsPage extends StatefulWidget {
  const MerchantsPage({super.key});

  @override
  State<MerchantsPage> createState() => _MerchantsPageState();
}

class _MerchantsPageState extends State<MerchantsPage> {
  String? _selectedStatus;
  String _searchQuery = '';
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    context.read<MerchantsBloc>().add(const LoadMerchantsEvent());
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
        title: const Text('إدارة الشركاء والتجار'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const AddMerchantPage()),
        ),
        backgroundColor: AppColors.primary,
        child: const Icon(IconlyBold.plus, color: Colors.white),
      ),
      body: BlocConsumer<MerchantsBloc, MerchantsState>(
        listenWhen: (_, state) => state is MerchantStatusUpdated || state is MerchantDeleted || state is MerchantsError,
        listener: (context, state) {
          if (state is MerchantStatusUpdated) {
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم تحديث حالة التاجر بنجاح'), backgroundColor: AppColors.success));
          } else if (state is MerchantDeleted) {
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم حذف التاجر بنجاح'), backgroundColor: AppColors.success));
          } else if (state is MerchantsError) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.message), backgroundColor: AppColors.error));
          }
        },
        builder: (context, state) {
          return Column(
            children: [
              // --- Dashboard Header ---
              _buildDashboardHeader(state),

              // --- Search and Filters ---
              _buildSearchAndFilters(),

              Expanded(
                child: _buildBody(state),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildDashboardHeader(MerchantsState state) {
    int total = 0;
    int pending = 0;
    if (state is MerchantsLoaded) {
      total = state.totalCount;
      pending = state.merchants.where((m) => m.status == 'PENDING').length;
    }

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(32)),
      ),
      child: Row(
        children: [
          Expanded(child: _buildSummaryCard('إجمالي التجار', total.toString(), IconlyBold.buy, AppColors.primary)),
          const SizedBox(width: 12),
          Expanded(child: _buildSummaryCard('طلبات معلقة', pending.toString(), IconlyBold.timeCircle, Colors.orange)),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(height: 8),
          Text(value, style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          Text(label, style: GoogleFonts.cairo(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildSearchAndFilters() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'ابحث عن تاجر أو محل...',
              prefixIcon: const Icon(IconlyLight.search, color: AppColors.primary),
              filled: true,
              fillColor: AppColors.white,
            ),
            onChanged: (v) => setState(() => _searchQuery = v.toLowerCase()),
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip(null, 'الكل'),
                const SizedBox(width: 8),
                _buildFilterChip('PENDING', 'قيد الانتظار'),
                const SizedBox(width: 8),
                _buildFilterChip('APPROVED', 'مقبول'),
                const SizedBox(width: 8),
                _buildFilterChip('REJECTED', 'مرفوض'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody(MerchantsState state) {
    if (state is MerchantsLoading) return const ListSkeleton(itemCount: 5);
    if (state is MerchantsError) return _buildErrorState(state.message);
    if (state is MerchantsLoaded) {
      final filtered = state.merchants.where((m) {
        final matchesSearch = m.storeName.toLowerCase().contains(_searchQuery) || m.ownerName.toLowerCase().contains(_searchQuery) || m.phone.contains(_searchQuery);
        return matchesSearch;
      }).toList();

      if (filtered.isEmpty) return _buildEmptyState();

      return RefreshIndicator(
        onRefresh: () async => context.read<MerchantsBloc>().add(LoadMerchantsEvent(status: _selectedStatus)),
        child: ListView.builder(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
          itemCount: filtered.length,
          itemBuilder: (context, index) {
            final merchant = filtered[index];
            return MerchantCard(
              merchant: merchant,
              onTap: () => _showMerchantDetails(context, merchant),
            ).animate().fadeIn(delay: (index * 50).ms).slideX(begin: 0.1);
          },
        ),
      );
    }
    return const SizedBox();
  }

  Widget _buildEmptyState() {
    return Center(child: Text('لا يوجد تجار حالياً', style: GoogleFonts.cairo(color: AppColors.textSecondary)));
  }

  Widget _buildErrorState(String msg) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline_rounded, color: AppColors.error, size: 40),
          const SizedBox(height: 16),
          Text(msg, style: GoogleFonts.cairo(color: AppColors.textSecondary)),
          TextButton(onPressed: () => context.read<MerchantsBloc>().add(const LoadMerchantsEvent()), child: const Text('إعادة المحاولة')),
        ],
      ),
    );
  }

  void _showMerchantDetails(BuildContext context, Merchant merchant) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
      builder: (sheetContext) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.95,
        expand: false,
        builder: (_, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(10)))),
              const SizedBox(height: 24),
              Center(
                child: Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.05), shape: BoxShape.circle, border: Border.all(color: AppColors.primary.withValues(alpha: 0.1), width: 4)),
                  child: (merchant.logoUrl != null && merchant.logoUrl!.isNotEmpty)
                      ? ClipOval(child: NetworkImageWithPlaceholder(imageUrl: merchant.logoUrl!, fit: BoxFit.cover))
                      : const Icon(IconlyBold.buy, size: 40, color: AppColors.primary),
                ),
              ),
              const SizedBox(height: 16),
              Center(child: Text(merchant.storeName, style: GoogleFonts.cairo(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary))),
              Center(child: _buildStatusBadge(merchant.status)),
              const SizedBox(height: 32),
              _buildDetailItem('اسم المالك', merchant.ownerName, IconlyLight.profile),
              _buildDetailItem('رقم الهاتف', merchant.phone, IconlyLight.call),
              if (merchant.category != null) _buildDetailItem('تصنيف المتجر', merchant.category!, IconlyLight.category),
              _buildDetailItem('تاريخ التسجيل', DateFormat('yyyy/MM/dd hh:mm a', 'ar').format(merchant.createdAt), IconlyLight.calendar),
              const SizedBox(height: 40),
              if (merchant.status == 'PENDING') ...[
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          Navigator.pop(sheetContext);
                          _showRejectionDialog(context, merchant);
                        },
                        style: OutlinedButton.styleFrom(foregroundColor: AppColors.error, side: const BorderSide(color: AppColors.error), padding: const EdgeInsets.symmetric(vertical: 16)),
                        child: const Text('رفض الطلب'),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          context.read<MerchantsBloc>().add(UpdateMerchantStatusEvent(id: merchant.id, status: 'APPROVED'));
                          Navigator.pop(sheetContext);
                        },
                        style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                        child: const Text('تفعيل الحساب'),
                      ),
                    ),
                  ],
                ),
              ] else
                Column(
                  children: [
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => Navigator.pop(sheetContext),
                        style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                        child: const Text('إغلاق'),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () => _confirmDelete(context, merchant),
                        icon: const Icon(IconlyLight.delete, color: AppColors.error, size: 20),
                        label: const Text('حذف الحساب نهائياً', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.bold)),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          side: const BorderSide(color: AppColors.error),
                          backgroundColor: AppColors.error.withValues(alpha: 0.05),
                        ),
                      ),
                    ),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    final color = status == 'APPROVED' ? AppColors.success : (status == 'PENDING' ? Colors.orange : AppColors.error);
    final label = status == 'APPROVED' ? 'حساب نشط' : (status == 'PENDING' ? 'قيد المراجعة' : 'حساب مرفوض');
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
      child: Text(label, style: GoogleFonts.cairo(fontSize: 12, color: color, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildDetailItem(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        children: [
          Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(12)), child: Icon(icon, size: 20, color: AppColors.primary)),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: GoogleFonts.cairo(fontSize: 12, color: AppColors.textSecondary)),
                Text(value, style: GoogleFonts.cairo(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
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
          context.read<MerchantsBloc>().add(LoadMerchantsEvent(status: status));
        }
      },
      selectedColor: AppColors.primary.withValues(alpha: 0.15),
      labelStyle: TextStyle(color: isSelected ? AppColors.primary : AppColors.textSecondary, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal, fontFamily: GoogleFonts.cairo().fontFamily),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: isSelected ? AppColors.primary : Colors.grey.shade200)),
      showCheckmark: false,
    );
  }

  void _showRejectionDialog(BuildContext context, Merchant merchant) {
    final reasonController = TextEditingController();
    final bloc = context.read<MerchantsBloc>();
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: Container(
          decoration: const BoxDecoration(color: AppColors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('رفض طلب التاجر', style: GoogleFonts.cairo(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.error)),
              const SizedBox(height: 8),
              Text('يرجى توضيح سبب رفض طلب التاجر " ${merchant.storeName} " ليصل إشعار لصاحب الطلب بالسبب.', style: GoogleFonts.cairo(fontSize: 13, color: AppColors.textSecondary)),
              const SizedBox(height: 24),
              TextField(
                controller: reasonController,
                maxLines: 3,
                autofocus: true,
                decoration: const InputDecoration(
                  hintText: 'مثال: البيانات غير كاملة، النشاط غير مسموح به...',
                  filled: true,
                  fillColor: AppColors.background,
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    bloc.add(UpdateMerchantStatusEvent(
                      id: merchant.id,
                      status: 'REJECTED',
                      reason: reasonController.text.trim().isEmpty ? null : reasonController.text.trim(),
                    ));
                    Navigator.pop(context);
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
                  child: const Text('تأكيد الرفض وإرسال السبب'),
                ),
              ),
            ],
          ),
        ),
      ),
    ).then((_) => reasonController.dispose());
  }

  void _confirmDelete(BuildContext context, Merchant merchant) async {
    final confirmed = await CustomDialogs.showConfirmDialog(
      context: context,
      title: 'حذف حساب التاجر',
      message: 'هل أنت متأكد من حذف حساب "${merchant.storeName}"؟ سيتم حذف جميع بيانات التاجر والعروض التابعة له نهائياً.',
      isDestructive: true,
      confirmText: 'حذف نهائي',
    );
    
    if (confirmed == true) {
      if (!context.mounted) return;
      context.read<MerchantsBloc>().add(DeleteMerchantEvent(id: merchant.id));
      Navigator.pop(context);
    }
  }
}
