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
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'إدارة العروض',
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
                    hintText: 'البحث عن العروض...',
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
                backgroundColor: Colors.green,
              ),
            );
          } else if (state is OfferDeleted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('تم حذف العرض بنجاح'),
                backgroundColor: Colors.green,
              ),
            );
          } else if (state is OffersError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.red,
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
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.local_offer_outlined,
                      size: 64,
                      color: Colors.blueGrey[300],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      _searchQuery.isNotEmpty
                          ? 'لا يوجد عروض تطابق "$_searchQuery"'
                          : 'لا يوجد عروض حالياً',
                      style: GoogleFonts.cairo(color: Colors.blueGrey[500]),
                    ),
                  ],
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
                    onPressed: () => context.read<OffersBloc>().add(
                      LoadOffersEvent(status: _selectedStatus),
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
          backgroundColor: Colors.red,
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
                  width: 42,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.blueGrey[200],
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              if (images.isNotEmpty) ...[
                SizedBox(
                  height: 200,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: images.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 10),
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
                          color: Colors.orange[50],
                          child: Icon(
                            Icons.image_not_supported,
                            color: Colors.orange[200],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'عدد الصور: ${images.length}',
                  style: GoogleFonts.cairo(fontSize: 12, color: Colors.blueGrey[600]),
                ),
                const SizedBox(height: 12),
              ] else if (offer.imageUrl != null && offer.imageUrl!.isNotEmpty) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.network(
                    offer.imageUrl!,
                    height: 200,
                    width: double.infinity,
                    fit: BoxFit.cover,
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
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
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
              const SizedBox(height: 6),
              Text(
                store['name']?.toString() ?? offer.storeName,
                style: GoogleFonts.cairo(
                  fontSize: 16,
                  color: Colors.orange[800],
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 12),
              _buildInfoItem(
                'الوصف',
                details['description']?.toString() ?? offer.description,
                Icons.description_outlined,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildInfoItem(
                      'تاريخ البدء',
                      DateFormat('yyyy/MM/dd', 'ar').format(
                        DateTime.tryParse(details['startDate']?.toString() ?? '') ?? offer.startDate,
                      ),
                      Icons.calendar_today,
                    ),
                  ),
                  Expanded(
                    child: _buildInfoItem(
                      'تاريخ الانتهاء',
                      DateFormat('yyyy/MM/dd', 'ar').format(
                        DateTime.tryParse(details['endDate']?.toString() ?? '') ?? offer.endDate,
                      ),
                      Icons.event_busy,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildInfoItem(
                      'السعر القديم',
                      offer.oldPrice?.toString() ?? details['oldPrice']?.toString() ?? '-',
                      Icons.money_off,
                    ),
                  ),
                  Expanded(
                    child: _buildInfoItem(
                      'السعر الجديد',
                      offer.newPrice?.toString() ?? details['newPrice']?.toString() ?? '-',
                      Icons.attach_money,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildInfoItem(
                      'الخصم',
                      details['discount']?.toString() ?? '-',
                      Icons.percent_outlined,
                    ),
                  ),
                  Expanded(
                    child: _buildInfoItem(
                      'حد الاستخدام',
                      details['usageLimit'] == null ? 'غير محدد' : details['usageLimit'].toString(),
                      Icons.onetwothree_outlined,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildInfoItem(
                      'الكوبونات',
                      '${counts['coupons'] ?? 0}',
                      Icons.confirmation_number_outlined,
                    ),
                  ),
                  Expanded(
                    child: _buildInfoItem(
                      'المفضلة',
                      '${counts['favorites'] ?? 0}',
                      Icons.favorite_border,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildInfoItem(
                      'المراجعات',
                      '${counts['reviews'] ?? 0}',
                      Icons.reviews_outlined,
                    ),
                  ),
                  Expanded(
                    child: _buildInfoItem(
                      'صاحب المتجر',
                      owner['name']?.toString() ?? '-',
                      Icons.person_outline,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildInfoItem(
                      'هاتف التاجر',
                      owner['phone']?.toString() ?? '-',
                      Icons.phone_outlined,
                    ),
                  ),
                  Expanded(
                    child: _buildInfoItem(
                      'معرف العرض',
                      '#${offer.id.substring(0, 8)}',
                      Icons.tag_outlined,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    _showEditOfferDialog(context, offer, details);
                  },
                  icon: const Icon(Icons.edit_outlined),
                  label: const Text('تعديل بيانات العرض'),
                ),
              ),
              const SizedBox(height: 10),
              if (offer.status == 'PENDING') ...[
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          _showRejectionDialog(context, offer);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red[50],
                          foregroundColor: Colors.red,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('رفض العرض'),
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
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('قبول العرض'),
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: TextButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    _showDeleteConfirmation(context, offer);
                  },
                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                  label: const Text('حذف العرض', style: TextStyle(color: Colors.red)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showRejectionDialog(BuildContext context, Offer offer) {
    final reasonController = TextEditingController();
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('سبب الرفض', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        content: TextField(
          controller: reasonController,
          maxLines: 3,
          decoration: InputDecoration(
            hintText: 'يرجى توضيح سبب رفض هذا العرض...',
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
              context.read<OffersBloc>().add(
                UpdateOfferStatusEvent(
                  id: offer.id,
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

  void _showDeleteConfirmation(BuildContext context, Offer offer) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('حذف العرض', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        content: Text('هل تريد حذف "${offer.title}" نهائياً؟', style: GoogleFonts.cairo()),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () {
              context.read<OffersBloc>().add(DeleteOfferEvent(id: offer.id));
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

  void _showEditOfferDialog(
    BuildContext context,
    Offer offer,
    Map<String, dynamic> details,
  ) {
    final titleController = TextEditingController(
      text: details['title']?.toString() ?? offer.title,
    );
    final descriptionController = TextEditingController(
      text: details['description']?.toString() ?? offer.description,
    );
    final discountController = TextEditingController(
      text: details['discount']?.toString() ?? '',
    );
    final termsController = TextEditingController(
      text: details['terms']?.toString() ?? '',
    );
    final usageLimitController = TextEditingController(
      text: details['usageLimit']?.toString() ?? '',
    );
    final imagesController = TextEditingController(
      text: (details['images'] is List)
          ? (details['images'] as List).map((e) => e.toString()).join('\n')
          : '',
    );
    final startDateController = TextEditingController(
      text: details['startDate']?.toString() ?? offer.startDate.toIso8601String(),
    );
    final endDateController = TextEditingController(
      text: details['endDate']?.toString() ?? offer.endDate.toIso8601String(),
    );
    const allowedStatuses = <String>[
      'PENDING',
      'APPROVED',
      'ACTIVE',
      'PAUSED',
      'REJECTED',
      'EXPIRED',
    ];
    String status = details['status']?.toString() ?? offer.status;
    if (!allowedStatuses.contains(status)) {
      status = 'PENDING';
    }

    showDialog(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (_, setLocalState) => AlertDialog(
          title: Text(
            'تعديل العرض',
            style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
          ),
          content: SizedBox(
            width: 520,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: titleController,
                    decoration: const InputDecoration(labelText: 'العنوان'),
                  ),
                  TextField(
                    controller: descriptionController,
                    maxLines: 3,
                    decoration: const InputDecoration(labelText: 'الوصف'),
                  ),
                  TextField(
                    controller: discountController,
                    decoration: const InputDecoration(labelText: 'الخصم'),
                  ),
                  TextField(
                    controller: termsController,
                    maxLines: 2,
                    decoration: const InputDecoration(labelText: 'الشروط'),
                  ),
                  TextField(
                    controller: usageLimitController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'حد الاستخدام (اختياري)',
                    ),
                  ),
                  TextField(
                    controller: startDateController,
                    decoration: const InputDecoration(
                      labelText: 'تاريخ البدء (ISO)',
                    ),
                  ),
                  TextField(
                    controller: endDateController,
                    decoration: const InputDecoration(
                      labelText: 'تاريخ الانتهاء (ISO)',
                    ),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: status,
                    decoration: const InputDecoration(labelText: 'الحالة'),
                    items: allowedStatuses
                        .map(
                          (s) => DropdownMenuItem<String>(
                            value: s,
                            child: Text(s),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      if (value != null) setLocalState(() => status = value);
                    },
                  ),
                  TextField(
                    controller: imagesController,
                    minLines: 2,
                    maxLines: 5,
                    decoration: const InputDecoration(
                      labelText: 'الصور (رابط لكل سطر)',
                    ),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('إلغاء'),
            ),
            ElevatedButton(
              onPressed: () async {
                final usageLimitText = usageLimitController.text.trim();
                final usageLimit = usageLimitText.isEmpty
                    ? null
                    : int.tryParse(usageLimitText);
                if (usageLimitText.isNotEmpty && usageLimit == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('حد الاستخدام يجب أن يكون رقمًا صحيحًا'),
                      backgroundColor: Colors.red,
                    ),
                  );
                  return;
                }

                final images = imagesController.text
                    .split('\n')
                    .map((e) => e.trim())
                    .where((e) => e.isNotEmpty)
                    .toList();

                try {
                  await sl<ApiClient>().patch(
                    '/admin/offers/${offer.id}',
                    data: {
                      'title': titleController.text.trim(),
                      'description': descriptionController.text.trim(),
                      'discount': discountController.text.trim(),
                      'terms': termsController.text.trim().isEmpty
                          ? null
                          : termsController.text.trim(),
                      'usageLimit': usageLimit,
                      'startDate': startDateController.text.trim(),
                      'endDate': endDateController.text.trim(),
                      'status': status,
                      'images': images,
                    },
                  );
                  if (!context.mounted) return;
                  Navigator.pop(dialogContext);
                  context.read<OffersBloc>().add(
                    LoadOffersEvent(status: _selectedStatus),
                  );
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('تم تحديث العرض بنجاح'),
                      backgroundColor: Colors.green,
                    ),
                  );
                } catch (e) {
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('فشل تحديث العرض: $e'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              },
              child: const Text('حفظ التعديلات'),
            ),
          ],
        ),
      ),
    ).then((_) {
      titleController.dispose();
      descriptionController.dispose();
      discountController.dispose();
      termsController.dispose();
      usageLimitController.dispose();
      imagesController.dispose();
      startDateController.dispose();
      endDateController.dispose();
    });
  }

  Widget _buildInfoItem(String label, String value, IconData icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: Colors.blueGrey[400]),
            const SizedBox(width: 8),
            Text(
              label,
              style: GoogleFonts.inter(fontSize: 12, color: Colors.blueGrey[400]),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          value,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.blueGrey[800],
          ),
        ),
      ],
    );
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'ACTIVE':
        return 'نشط';
      case 'APPROVED':
        return 'مقبول';
      case 'REJECTED':
        return 'مرفوض';
      case 'EXPIRED':
        return 'منتهي';
      case 'PENDING':
        return 'قيد الانتظار';
      default:
        return status;
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'ACTIVE':
        return Colors.green;
      case 'APPROVED':
        return Colors.teal;
      case 'REJECTED':
        return Colors.red;
      case 'EXPIRED':
        return Colors.blueGrey;
      case 'PENDING':
        return const Color(0xFFFF6B00);
      default:
        return Colors.blueGrey;
    }
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
      selectedColor: Colors.orange[100],
      labelStyle: TextStyle(
        color: isSelected ? Colors.orange[800] : Colors.blueGrey[600],
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
    );
  }
}
