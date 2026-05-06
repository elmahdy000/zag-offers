import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_admin_app/features/merchants/domain/entities/merchant.dart';
import 'package:zag_offers_admin_app/features/merchants/presentation/bloc/merchants_bloc.dart';
import 'package:zag_offers_admin_app/core/widgets/bottom_sheet.dart';
import 'package:zag_offers_admin_app/core/widgets/skeleton_loader.dart';
import 'package:zag_offers_admin_app/features/merchants/presentation/widgets/merchant_card.dart';

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
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'إدارة التجار',
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
                    hintText: 'البحث عن التجار...',
                    prefixIcon: const Icon(
                      Icons.search,
                      color: Color(0xFFFF6B00),
                    ),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _searchQuery = '');
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
                  onChanged: (value) =>
                      setState(() => _searchQuery = value.toLowerCase()),
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
                      _buildFilterChip('PENDING', 'قيد الانتظار'),
                      const SizedBox(width: 8),
                      _buildFilterChip('APPROVED', 'مقبول'),
                      const SizedBox(width: 8),
                      _buildFilterChip('REJECTED', 'مرفوض'),
                    ],
                  ),
                ),
              ),
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
                content: Text(
                  'تم تحديث حالة التاجر بنجاح',
                ),
                backgroundColor: Colors.green,
              ),
            );
          } else if (state is MerchantDeleted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('تم حذف التاجر بنجاح'),
                backgroundColor: Colors.green,
              ),
            );
          } else if (state is MerchantsError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.red,
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
            // Client-side search filter
            final filtered = _searchQuery.isEmpty
                ? state.merchants
                : state.merchants.where((m) {
                    return m.storeName.toLowerCase().contains(_searchQuery) ||
                        m.ownerName.toLowerCase().contains(_searchQuery) ||
                        m.phone.toLowerCase().contains(_searchQuery);
                  }).toList();

            if (filtered.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.storefront, size: 64, color: Colors.grey[300]),
                    const SizedBox(height: 16),
                    Text(
                      _searchQuery.isNotEmpty
                          ? 'لا يوجد تجار يطابقون "$_searchQuery"'
                          : 'لا يوجد تجار حالياً',
                      style: GoogleFonts.cairo(color: Colors.grey[500]),
                    ),
                  ],
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
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 48, color: Colors.red[300]),
                  const SizedBox(height: 12),
                  Text(
                    state.message,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(color: Colors.red[700]),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => context.read<MerchantsBloc>().add(
                      LoadMerchantsEvent(status: _selectedStatus),
                    ),
                    child: const Text('إعادة المحاولة'),
                  ),
                ],
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
                    color: Colors.orange[50],
                    shape: BoxShape.circle,
                  ),
                  child: (merchant.logoUrl != null && merchant.logoUrl!.isNotEmpty)
                      ? ClipOval(
                          child: Image.network(
                            merchant.logoUrl!,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Icon(
                              Icons.store,
                              size: 40,
                              color: Colors.orange[400],
                            ),
                          ),
                        )
                      : Icon(Icons.store, size: 40, color: Colors.orange[400]),
                ),
              ),
              const SizedBox(height: 16),
              Center(
                child: Text(
                  merchant.storeName,
                  style: GoogleFonts.cairo(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              _buildDetailItem('المالك', merchant.ownerName, Icons.person_outline),
              _buildDetailItem('الهاتف', merchant.phone, Icons.phone_outlined),
              if (merchant.category != null)
                _buildDetailItem('القسم', merchant.category!, Icons.category_outlined),
              _buildDetailItem(
                'تاريخ الانضمام',
                DateFormat('yyyy/MM/dd hh:mm a', 'ar').format(merchant.createdAt),
                Icons.calendar_today_outlined,
              ),
              const SizedBox(height: 32),
              if (merchant.status == 'PENDING') ...[
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(sheetContext);
                          _showRejectionDialog(context, merchant);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red[50],
                          foregroundColor: Colors.red,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('رفض'),
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
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFF6B00),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('قبول'),
                      ),
                    ),
                  ],
                ),
              ] else
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(sheetContext),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFF6B00),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: const Text('إغلاق'),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  /// Shows a dialog to collect a rejection reason before firing the event.
  void _showRejectionDialog(BuildContext context, Merchant merchant) {
    final reasonController = TextEditingController();
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: Colors.white,
        title: Text(
          'سبب الرفض',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
        ),
        content: TextField(
          controller: reasonController,
          maxLines: 3,
          decoration: InputDecoration(
            hintText:
                'يرجى توضيح سبب رفض هذا التاجر...',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
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
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('تأكيد الرفض'),
          ),
        ],
      ),
    ).then((_) => reasonController.dispose());
  }

  // ignore: unused_element
  void _confirmDeleteMerchant(BuildContext context, Merchant merchant) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('تأكيد الحذف', style: GoogleFonts.cairo()),
        content: Text(
          'هل تريد حذف "${merchant.storeName}" نهائياً؟',
          style: GoogleFonts.cairo(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () {
              context.read<MerchantsBloc>().add(DeleteMerchantEvent(id: merchant.id));
              Navigator.pop(dialogContext);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('حذف'),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailItem(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey[400]),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[400]),
              ),
              Text(
                value,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
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
      selectedColor: Colors.orange[100],
      labelStyle: TextStyle(
        color: isSelected ? Colors.orange[800] : Colors.blueGrey[600],
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
    );
  }
}
