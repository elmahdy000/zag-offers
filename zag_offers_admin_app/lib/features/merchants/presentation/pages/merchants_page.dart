import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_admin_app/features/merchants/domain/entities/merchant.dart';
import 'package:zag_offers_admin_app/features/merchants/presentation/bloc/merchants_bloc.dart';
import 'package:zag_offers_admin_app/core/widgets/bottom_sheet.dart';
import 'package:zag_offers_admin_app/core/widgets/network_image.dart';
import 'package:zag_offers_admin_app/core/widgets/skeleton_loader.dart';
import 'package:zag_offers_admin_app/features/merchants/presentation/widgets/merchant_card.dart';
import 'package:zag_offers_admin_app/core/theme/app_colors.dart';

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
        title: const Text('إدارة التجار'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(130),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'البحث عن التجار...',
                    prefixIcon: const Icon(Icons.search_rounded, color: AppColors.primary),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear_rounded),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _searchQuery = '');
                            },
                          )
                        : null,
                  ),
                  onChanged: (value) =>
                      setState(() => _searchQuery = value.toLowerCase()),
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
                      _buildFilterChip('PENDING', 'قيد الانتظار'),
                      const SizedBox(width: 8),
                      _buildFilterChip('APPROVED', 'مقبول'),
                      const SizedBox(width: 8),
                      _buildFilterChip('REJECTED', 'مرفوض'),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
      body: BlocConsumer<MerchantsBloc, MerchantsState>(
        listenWhen: (_, state) =>
            state is MerchantStatusUpdated ||
            state is MerchantDeleted ||
            state is MerchantsError,
        listener: (context, state) {
          if (state is MerchantStatusUpdated) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('تم تحديث حالة التاجر بنجاح'),
                backgroundColor: AppColors.success,
              ),
            );
          } else if (state is MerchantDeleted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('تم حذف التاجر بنجاح'),
                backgroundColor: AppColors.success,
              ),
            );
          } else if (state is MerchantsError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppColors.error,
              ),
            );
          }
        },
        buildWhen: (_, state) =>
            state is MerchantsInitial ||
            state is MerchantsLoading ||
            state is MerchantsLoaded ||
            state is MerchantsError,
        builder: (context, state) {
          if (state is MerchantsLoading) {
            return const ListSkeleton(itemCount: 5);
          } else if (state is MerchantsLoaded) {
            final filtered = _searchQuery.isEmpty
                ? state.merchants
                : state.merchants.where((m) {
                    return m.storeName.toLowerCase().contains(_searchQuery) ||
                        m.ownerName.toLowerCase().contains(_searchQuery) ||
                        m.phone.toLowerCase().contains(_searchQuery);
                  }).toList();

            if (filtered.isEmpty) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(40),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          _searchQuery.isNotEmpty ? Icons.search_off_rounded : Icons.storefront_rounded,
                          size: 64,
                          color: AppColors.primary.withValues(alpha: 0.7),
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        _searchQuery.isNotEmpty ? 'لم نعثر على نتائج' : 'لا يوجد تجار',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.cairo(
                          fontWeight: FontWeight.w900,
                          fontSize: 20,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _searchQuery.isNotEmpty 
                            ? 'جرّب البحث بكلمات مختلفة للعثور على التاجر المطلوب.'
                            : 'لا يوجد تجار مسجلين حالياً في النظام.',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.cairo(
                          color: AppColors.textSecondary,
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }
            return RefreshIndicator(
              onRefresh: () async {
                context.read<MerchantsBloc>().add(
                  LoadMerchantsEvent(status: _selectedStatus),
                );
              },
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: filtered.length,
                itemBuilder: (context, index) {
                  final merchant = filtered[index];
                  return MerchantCard(
                    merchant: merchant,
                    onTap: () => _showMerchantDetails(context, merchant),
                  );
                },
              ),
            );
          } else if (state is MerchantsError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(40),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: AppColors.error.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.wifi_off_rounded,
                        size: 64,
                        color: AppColors.error,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'حدث خطأ في جلب البيانات',
                      style: GoogleFonts.cairo(
                        fontWeight: FontWeight.w900,
                        fontSize: 20,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      state.message,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.cairo(
                        color: AppColors.textSecondary,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 32),
                    ElevatedButton.icon(
                      onPressed: () => context.read<MerchantsBloc>().add(
                        LoadMerchantsEvent(status: _selectedStatus),
                      ),
                      icon: const Icon(Icons.refresh_rounded),
                      label: const Text('إعادة المحاولة'),
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

  void _showMerchantDetails(BuildContext context, Merchant merchant) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        maxChildSize: 0.9,
        expand: false,
        builder: (_, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.05),
                    shape: BoxShape.circle,
                  ),
                  child: (merchant.logoUrl != null && merchant.logoUrl!.isNotEmpty)
                      ? ClipOval(
                          child: NetworkImageWithPlaceholder(
                            imageUrl: merchant.logoUrl!,
                            fit: BoxFit.cover,
                          ),
                        )
                      : const Icon(Icons.storefront_rounded, size: 40, color: AppColors.primary),
                ),
              ),
              const SizedBox(height: 16),
              Center(
                child: Text(
                  merchant.storeName,
                  style: GoogleFonts.cairo(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              const SizedBox(height: 32),
              _buildDetailItem('المالك', merchant.ownerName, Icons.person_outline_rounded),
              _buildDetailItem('الهاتف', merchant.phone, Icons.phone_android_rounded),
              if (merchant.category != null)
                _buildDetailItem('القسم', merchant.category!, Icons.category_outlined),
              _buildDetailItem(
                'تاريخ الانضمام',
                DateFormat('yyyy/MM/dd hh:mm a', 'ar').format(merchant.createdAt),
                Icons.calendar_today_rounded,
              ),
              const SizedBox(height: 40),
              if (merchant.status == 'PENDING') ...[
                Row(
                  children: [
                    Expanded(
                      child: TextButton(
                        onPressed: () {
                          Navigator.pop(sheetContext);
                          _showRejectionDialog(context, merchant);
                        },
                        style: TextButton.styleFrom(
                          foregroundColor: AppColors.error,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('رفض الطلب', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          context.read<MerchantsBloc>().add(
                            UpdateMerchantStatusEvent(
                              id: merchant.id,
                              status: 'APPROVED',
                            ),
                          );
                          Navigator.pop(sheetContext);
                        },
                        child: const Text('قبول التاجر'),
                      ),
                    ),
                  ],
                ),
              ] else
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(sheetContext),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      side: BorderSide(color: Colors.grey.shade200),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: const Text('إغلاق', style: TextStyle(color: AppColors.textPrimary)),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  void _showRejectionDialog(BuildContext context, Merchant merchant) {
    final reasonController = TextEditingController();
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('سبب الرفض'),
        content: TextField(
          controller: reasonController,
          maxLines: 3,
          decoration: const InputDecoration(
            hintText: 'يرجى توضيح سبب رفض هذا التاجر...',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () {
              context.read<MerchantsBloc>().add(
                UpdateMerchantStatusEvent(
                  id: merchant.id,
                  status: 'REJECTED',
                  reason: reasonController.text.trim().isEmpty
                      ? null
                      : reasonController.text.trim(),
                ),
              );
              Navigator.pop(dialogContext);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('تأكيد الرفض'),
          ),
        ],
      ),
    ).then((_) => reasonController.dispose());
  }

  Widget _buildDetailItem(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, size: 20, color: AppColors.primary),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: GoogleFonts.cairo(fontSize: 12, color: AppColors.textSecondary),
              ),
              Text(
                value,
                style: GoogleFonts.cairo(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
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
      labelStyle: TextStyle(
        color: isSelected ? AppColors.primary : AppColors.textSecondary,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        fontFamily: GoogleFonts.cairo().fontFamily,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isSelected ? AppColors.primary : Colors.grey.shade200,
        ),
      ),
      showCheckmark: false,
    );
  }
}
