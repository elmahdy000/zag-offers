import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:zag_offers_admin_app/core/network/api_client.dart';
import 'package:zag_offers_admin_app/features/offers/domain/entities/offer.dart';
import 'package:zag_offers_admin_app/features/offers/presentation/bloc/offers_bloc.dart';
import 'package:zag_offers_admin_app/features/offers/presentation/widgets/offer_card.dart';
import 'package:zag_offers_admin_app/core/widgets/skeleton_loader.dart';
import 'package:zag_offers_admin_app/injection_container.dart';
import 'package:zag_offers_admin_app/core/theme/app_colors.dart';

class OffersPage extends StatefulWidget {
  const OffersPage({super.key});

  @override
  State<OffersPage> createState() => _OffersPageState();
}

class _OffersPageState extends State<OffersPage> {
  String? _selectedStatus;
  String _searchQuery = '';
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    context.read<OffersBloc>().add(const LoadOffersEvent());
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
        title: const Text('إدارة العروض'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(130),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'البحث عن العروض...',
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
      body: BlocConsumer<OffersBloc, OffersState>(
        listenWhen: (_, state) =>
            state is OfferStatusUpdated ||
            state is OfferDeleted ||
            state is OffersError,
        listener: (context, state) {
          if (state is OfferStatusUpdated) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('تم تحديث حالة العرض بنجاح'),
                backgroundColor: AppColors.success,
              ),
            );
          } else if (state is OfferDeleted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('تم حذف العرض بنجاح'),
                backgroundColor: AppColors.success,
              ),
            );
          } else if (state is OffersError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppColors.error,
              ),
            );
          }
        },
        buildWhen: (_, state) =>
            state is OffersInitial ||
            state is OffersLoading ||
            state is OffersLoaded ||
            state is OffersError,
        builder: (context, state) {
          if (state is OffersLoading) {
            return const ListSkeleton(itemCount: 5);
          } else if (state is OffersLoaded) {
            final filtered = _searchQuery.isEmpty
                ? state.offers
                : state.offers.where((o) {
                    return o.title.toLowerCase().contains(_searchQuery) ||
                        o.storeName.toLowerCase().contains(_searchQuery) ||
                        o.description.toLowerCase().contains(_searchQuery);
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
                          _searchQuery.isNotEmpty ? Icons.search_off_rounded : Icons.local_offer_rounded,
                          size: 64,
                          color: AppColors.primary.withValues(alpha: 0.7),
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        _searchQuery.isNotEmpty ? 'لم نعثر على نتائج' : 'لا يوجد عروض',
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
                            ? 'جرّب البحث بكلمات مختلفة للعثور على العرض المطلوب.'
                            : 'لا توجد عروض منشورة حالياً في النظام.',
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
                context.read<OffersBloc>().add(
                  LoadOffersEvent(status: _selectedStatus),
                );
              },
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: filtered.length,
                itemBuilder: (context, index) {
                  final offer = filtered[index];
                  return GestureDetector(
                    onTap: () => _openOfferDetails(context, offer),
                    child: OfferCard(offer: offer),
                  );
                },
              ),
            );
          } else if (state is OffersError) {
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
                      onPressed: () => context.read<OffersBloc>().add(
                        LoadOffersEvent(status: _selectedStatus),
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

  Future<void> _openOfferDetails(BuildContext context, Offer offer) async {
    final details = await _getOfferDetails(offer.id);
    if (!context.mounted || details == null) return;
    _showOfferDetails(context, offer, details);
  }

  Future<Map<String, dynamic>?> _getOfferDetails(String id) async {
    try {
      final response = await sl<ApiClient>().get('/admin/offers/$id');
      return Map<String, dynamic>.from(response.data as Map);
    } catch (e) {
      if (!mounted) return null;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('تعذر تحميل تفاصيل العرض: $e'),
          backgroundColor: AppColors.error,
        ),
      );
      return null;
    }
  }

  void _showOfferDetails(
    BuildContext context,
    Offer offer,
    Map<String, dynamic> details,
  ) {
    final statusColor = _statusColor(offer.status);
    final rawImages = details['images'];
    final List<String> images = rawImages is List && rawImages.isNotEmpty
        ? rawImages.whereType<String>().where((e) => e.isNotEmpty).toList()
        : offer.images;
    final store = details['store'] is Map
        ? Map<String, dynamic>.from(details['store'] as Map)
        : <String, dynamic>{};
    final owner = store['owner'] is Map
        ? Map<String, dynamic>.from(store['owner'] as Map)
        : <String, dynamic>{};
    final counts = details['_count'] is Map
        ? Map<String, dynamic>.from(details['_count'] as Map)
        : <String, dynamic>{};

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.84,
        maxChildSize: 0.94,
        expand: false,
        builder: (_, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              if (images.isNotEmpty) ...[
                SizedBox(
                  height: 200,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: images.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 12),
                    itemBuilder: (_, i) => ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Image.network(
                        images[i],
                        width: 300,
                        height: 200,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          width: 300,
                          height: 200,
                          color: AppColors.background,
                          child: const Icon(Icons.image_not_supported_rounded, color: Colors.grey),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
              ],
              Row(
                children: [
                  Expanded(
                    child: Text(
                      details['title']?.toString() ?? offer.title,
                      style: GoogleFonts.cairo(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      _statusLabel(details['status']?.toString() ?? offer.status),
                      style: GoogleFonts.cairo(
                        fontSize: 12,
                        color: statusColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                store['name']?.toString() ?? offer.storeName,
                style: GoogleFonts.cairo(
                  fontSize: 16,
                  color: AppColors.primary,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),
              _buildDetailSection('معلومات العرض', [
                _buildInfoItem('الوصف', details['description']?.toString() ?? offer.description, Icons.description_outlined),
                Row(
                  children: [
                    Expanded(child: _buildInfoItem('البداية', DateFormat('yyyy/MM/dd', 'ar').format(DateTime.tryParse(details['startDate']?.toString() ?? '') ?? offer.startDate), Icons.calendar_today_rounded)),
                    Expanded(child: _buildInfoItem('النهاية', DateFormat('yyyy/MM/dd', 'ar').format(DateTime.tryParse(details['endDate']?.toString() ?? '') ?? offer.endDate), Icons.event_busy_rounded)),
                  ],
                ),
                Row(
                  children: [
                    Expanded(child: _buildInfoItem('السعر القديم', '${offer.oldPrice?.toString() ?? details['oldPrice']?.toString() ?? '-'} ج.م', Icons.money_off_rounded)),
                    Expanded(child: _buildInfoItem('السعر الجديد', '${offer.newPrice?.toString() ?? details['newPrice']?.toString() ?? '-'} ج.م', Icons.attach_money_rounded)),
                  ],
                ),
              ]),
              const SizedBox(height: 24),
              _buildDetailSection('الإحصائيات', [
                Row(
                  children: [
                    Expanded(child: _buildInfoItem('الكوبونات', '${counts['coupons'] ?? 0}', Icons.confirmation_number_outlined)),
                    Expanded(child: _buildInfoItem('المفضلة', '${counts['favorites'] ?? 0}', Icons.favorite_border_rounded)),
                    Expanded(child: _buildInfoItem('المراجعات', '${counts['reviews'] ?? 0}', Icons.reviews_outlined)),
                  ],
                ),
              ]),
              const SizedBox(height: 24),
              _buildDetailSection('معلومات التاجر', [
                _buildInfoItem('صاحب المتجر', owner['name']?.toString() ?? '-', Icons.person_outline_rounded),
                _buildInfoItem('رقم التواصل', owner['phone']?.toString() ?? '-', Icons.phone_android_rounded),
              ]),
              const SizedBox(height: 32),
              if (offer.status == 'PENDING') ...[
                Row(
                  children: [
                    Expanded(
                      child: TextButton(
                        onPressed: () {
                          Navigator.pop(context);
                          _showRejectionDialog(context, offer);
                        },
                        style: TextButton.styleFrom(
                          foregroundColor: AppColors.error,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('رفض العرض', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          context.read<OffersBloc>().add(
                            UpdateOfferStatusEvent(id: offer.id, status: 'APPROVED'),
                          );
                          Navigator.pop(context);
                        },
                        child: const Text('قبول العرض'),
                      ),
                    ),
                  ],
                ),
              ] else
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      side: BorderSide(color: Colors.grey.shade200),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: const Text('إغلاق', style: TextStyle(color: AppColors.textPrimary)),
                  ),
                ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: TextButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    _showDeleteConfirmation(context, offer);
                  },
                  icon: const Icon(Icons.delete_outline_rounded, color: AppColors.error, size: 18),
                  label: const Text('حذف العرض نهائياً', style: TextStyle(color: AppColors.error, fontSize: 13)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: GoogleFonts.cairo(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
        const SizedBox(height: 12),
        ...children,
      ],
    );
  }

  Widget _buildInfoItem(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.primary.withValues(alpha: 0.6)),
          const SizedBox(width: 12),
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

  Color _statusColor(String status) {
    switch (status) {
      case 'APPROVED':
      case 'ACTIVE':
        return AppColors.success;
      case 'PENDING':
        return AppColors.primary;
      case 'REJECTED':
      case 'EXPIRED':
        return AppColors.error;
      default:
        return AppColors.textSecondary;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'APPROVED':
        return 'مقبول';
      case 'ACTIVE':
        return 'نشط';
      case 'PENDING':
        return 'قيد الانتظار';
      case 'REJECTED':
        return 'مرفوض';
      case 'EXPIRED':
        return 'منتهي';
      default:
        return status;
    }
  }

  void _showRejectionDialog(BuildContext context, Offer offer) {
    final reasonController = TextEditingController();
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('سبب الرفض'),
        content: TextField(
          controller: reasonController,
          maxLines: 3,
          decoration: const InputDecoration(hintText: 'يرجى توضيح سبب رفض هذا العرض...'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('إلغاء')),
          ElevatedButton(
            onPressed: () {
              context.read<OffersBloc>().add(UpdateOfferStatusEvent(id: offer.id, status: 'REJECTED', reason: reasonController.text.trim().isEmpty ? null : reasonController.text.trim()));
              Navigator.pop(dialogContext);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('تأكيد الرفض'),
          ),
        ],
      ),
    ).then((_) => reasonController.dispose());
  }

  void _showDeleteConfirmation(BuildContext context, Offer offer) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('حذف العرض'),
        content: Text('هل تريد حذف "${offer.title}" نهائياً؟'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('إلغاء')),
          ElevatedButton(
            onPressed: () {
              context.read<OffersBloc>().add(DeleteOfferEvent(id: offer.id));
              Navigator.pop(dialogContext);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('حذف'),
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
          context.read<OffersBloc>().add(LoadOffersEvent(status: status));
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
}
