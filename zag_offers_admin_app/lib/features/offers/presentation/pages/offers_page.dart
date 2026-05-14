import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:zag_offers_admin_app/features/merchants/presentation/bloc/merchants_bloc.dart';
import 'package:zag_offers_admin_app/features/offers/domain/entities/offer.dart';
import 'package:zag_offers_admin_app/features/offers/presentation/bloc/offers_bloc.dart';
import 'package:zag_offers_admin_app/features/offers/presentation/widgets/offer_card.dart';
import 'package:zag_offers_admin_app/core/widgets/skeleton_loader.dart';
import 'package:zag_offers_admin_app/core/widgets/custom_dialogs.dart';
import 'package:zag_offers_admin_app/core/theme/app_colors.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_iconly/flutter_iconly.dart';
import 'add_offer_page.dart';

class OffersPage extends StatefulWidget {
  const OffersPage({super.key});

  @override
  State<OffersPage> createState() => _OffersPageState();
}

class _OffersPageState extends State<OffersPage> {
  String? _selectedStatus;
  String? _selectedMerchantId;
  String? _selectedMerchantName;
  String _searchQuery = '';
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    context.read<OffersBloc>().add(const LoadOffersEvent());
    context.read<MerchantsBloc>().add(const LoadMerchantsEvent(status: 'APPROVED'));
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onFilterChanged() {
    context.read<OffersBloc>().add(LoadOffersEvent(
          status: _selectedStatus,
          merchantId: _selectedMerchantId,
        ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('إدارة العروض'),
        actions: [
          IconButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const AddOfferPage()),
              ).then((_) => _onFilterChanged());
            },
            icon: const Icon(IconlyBold.plus, color: AppColors.primary),
            tooltip: 'إضافة عرض جديد',
          ),
          const SizedBox(width: 8),
        ],
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
                  onChanged: (value) => setState(() => _searchQuery = value.toLowerCase()),
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
                      const SizedBox(width: 8),
                      _buildMerchantFilterChip(),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
      body: Column(
        children: [
          if (_selectedMerchantName != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: AppColors.primary.withValues(alpha: 0.05),
              child: Row(
                children: [
                  const Icon(Icons.store_rounded, size: 16, color: AppColors.primary),
                  const SizedBox(width: 8),
                  Text(
                    'تصفية حسب: $_selectedMerchantName',
                    style: GoogleFonts.cairo(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primary),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedMerchantId = null;
                        _selectedMerchantName = null;
                      });
                      _onFilterChanged();
                    },
                    child: const Icon(Icons.close_rounded, size: 18, color: AppColors.error),
                  ),
                ],
              ),
            ),
          Expanded(
            child: BlocConsumer<OffersBloc, OffersState>(
              listenWhen: (_, state) => state is OfferStatusUpdated || state is OfferDeleted || state is OffersError,
              listener: (context, state) {
                if (state is OfferStatusUpdated) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('تم تحديث حالة العرض بنجاح'), backgroundColor: AppColors.success),
                  );
                } else if (state is OfferDeleted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('تم حذف العرض بنجاح'), backgroundColor: AppColors.success),
                  );
                } else if (state is OffersError) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(state.message), backgroundColor: AppColors.error),
                  );
                }
              },
              buildWhen: (_, state) => state is OffersInitial || state is OffersLoading || state is OffersLoaded || state is OffersError,
              builder: (context, state) {
                if (state is OffersLoading) {
                  return const ListSkeleton(itemCount: 5);
                } else if (state is OffersLoaded) {
                  final filtered = _searchQuery.isEmpty
                      ? state.offers
                      : state.offers.where((o) {
                          return o.title.toLowerCase().contains(_searchQuery) || o.storeName.toLowerCase().contains(_searchQuery) || o.description.toLowerCase().contains(_searchQuery);
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
                              decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), shape: BoxShape.circle),
                              child: Icon(Icons.local_offer_rounded, size: 64, color: AppColors.primary.withValues(alpha: 0.7)),
                            ),
                            const SizedBox(height: 24),
                            Text('لا توجد عروض مطابقة', style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                            const SizedBox(height: 8),
                            Text('جرب تغيير الفلاتر أو كلمة البحث', style: GoogleFonts.cairo(color: AppColors.textSecondary)),
                          ],
                        ),
                      ),
                    );
                  }

                  return RefreshIndicator(
                    onRefresh: () async {
                      _onFilterChanged();
                    },
                    child: ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                      itemCount: filtered.length,
                      itemBuilder: (context, index) {
                        return OfferCard(
                          offer: filtered[index],
                          onTap: () => _showOfferDetails(context, filtered[index]),
                        ).animate().fadeIn(delay: (index * 50).ms).slideY(begin: 0.1);
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

  void _showMerchantPicker() {
    final searchController = TextEditingController();
    String query = '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return DraggableScrollableSheet(
              initialChildSize: 0.7,
              minChildSize: 0.5,
              maxChildSize: 0.9,
              builder: (_, scrollController) => Container(
                decoration: const BoxDecoration(color: AppColors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
                child: Column(
                  children: [
                    const SizedBox(height: 12),
                    Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(10))),
                    Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('تصفية حسب المتجر', style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 16),
                          TextField(
                            controller: searchController,
                            decoration: InputDecoration(
                              hintText: 'ابحث عن متجر...',
                              prefixIcon: const Icon(IconlyLight.search, size: 20),
                              filled: true,
                              fillColor: AppColors.background,
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                            ),
                            onChanged: (v) => setModalState(() => query = v.toLowerCase()),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: BlocBuilder<MerchantsBloc, MerchantsState>(
                        builder: (context, state) {
                          if (state is MerchantsLoading) {
                            return const Center(child: CircularProgressIndicator());
                          } else if (state is MerchantsLoaded) {
                            final filteredMerchants = state.merchants.where((m) => m.storeName.toLowerCase().contains(query)).toList();

                            if (filteredMerchants.isEmpty) {
                              return Center(child: Text('لا يوجد متاجر مطابقة', style: GoogleFonts.cairo(color: AppColors.textSecondary)));
                            }

                            return ListView.builder(
                              controller: scrollController,
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: filteredMerchants.length,
                              itemBuilder: (context, index) {
                                final merchant = filteredMerchants[index];
                                final isSelected = _selectedMerchantId == merchant.id;
                                return ListTile(
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                                  leading: Container(
                                    width: 40,
                                    height: 40,
                                    decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                                    child: Center(
                                      child: Text(merchant.storeName[0], style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                                    ),
                                  ),
                                  title: Text(merchant.storeName, style: GoogleFonts.cairo(fontWeight: isSelected ? FontWeight.bold : FontWeight.normal, color: isSelected ? AppColors.primary : AppColors.textPrimary)),
                                  trailing: isSelected ? const Icon(IconlyBold.tickSquare, color: AppColors.primary, size: 20) : null,
                                  onTap: () {
                                    setState(() {
                                      _selectedMerchantId = merchant.id;
                                      _selectedMerchantName = merchant.storeName;
                                    });
                                    Navigator.pop(context);
                                    _onFilterChanged();
                                  },
                                );
                              },
                            );
                          }
                          return const Center(child: Text('فشل تحميل المحلات'));
                        },
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    ).then((_) => searchController.dispose());
  }

  Widget _buildMerchantFilterChip() {
    final isSelected = _selectedMerchantId != null;
    return ActionChip(
      avatar: Icon(
        isSelected ? IconlyBold.buy : IconlyLight.buy,
        size: 16,
        color: isSelected ? AppColors.primary : AppColors.textSecondary,
      ),
      label: Text(isSelected ? _selectedMerchantName! : 'كل المتاجر'),
      onPressed: _showMerchantPicker,
      backgroundColor: isSelected ? AppColors.primary.withValues(alpha: 0.1) : AppColors.white,
      labelStyle: TextStyle(
        color: isSelected ? AppColors.primary : AppColors.textSecondary,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        fontFamily: GoogleFonts.cairo().fontFamily,
      ),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: isSelected ? AppColors.primary : Colors.grey.shade200)),
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
          _onFilterChanged();
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

  void _showOfferDetails(BuildContext context, Offer offer) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.85,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (_, scrollController) => Container(
          decoration: const BoxDecoration(color: AppColors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
          padding: const EdgeInsets.all(24),
          child: ListView(
            controller: scrollController,
            children: [
              Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(10)))),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      offer.title,
                      style: GoogleFonts.cairo(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                  ),
                  _buildStatusBadge(offer.status),
                ],
              ),
              const SizedBox(height: 8),
              Text(offer.storeName, style: GoogleFonts.cairo(fontSize: 16, color: AppColors.primary, fontWeight: FontWeight.bold)),
              const SizedBox(height: 24),
              _buildDetailSection('تفاصيل العرض', [
                _buildInfoItem(Icons.description_outlined, 'الوصف', offer.description),
                Row(
                  children: [
                    Expanded(child: _buildInfoItem(Icons.calendar_today_rounded, 'البداية', DateFormat('yyyy/MM/dd', 'ar').format(offer.startDate))),
                    Expanded(child: _buildInfoItem(Icons.event_busy_rounded, 'النهاية', DateFormat('yyyy/MM/dd', 'ar').format(offer.endDate))),
                  ],
                ),
                Row(
                  children: [
                    Expanded(child: _buildInfoItem(Icons.money_off_rounded, 'السعر القديم', '${offer.oldPrice ?? '-'} ج.م')),
                    Expanded(child: _buildInfoItem(Icons.attach_money_rounded, 'السعر الجديد', '${offer.newPrice ?? '-'} ج.م')),
                  ],
                ),
              ]),
              const SizedBox(height: 24),
              if (offer.status == 'PENDING') ...[
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          _showRejectionDialog(context, offer);
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.error,
                          side: const BorderSide(color: AppColors.error),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('رفض'),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          context.read<OffersBloc>().add(UpdateOfferStatusEvent(id: offer.id, status: 'APPROVED'));
                          Navigator.pop(context);
                        },
                        style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                        child: const Text('قبول العرض'),
                      ),
                    ),
                  ],
                ),
              ] else ...[
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => AddOfferPage(initialOffer: offer),
                        ),
                      ).then((_) => _onFilterChanged());
                    },
                    icon: const Icon(Icons.edit_outlined),
                    label: const Text('تعديل بيانات العرض'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      side: const BorderSide(color: AppColors.primary),
                      foregroundColor: AppColors.primary,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                    child: const Text('إغلاق'),
                  ),
                ),
              ],
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    _showDeleteConfirmation(context, offer);
                  },
                  icon: const Icon(Icons.delete_outline_rounded, color: AppColors.error, size: 20),
                  label: const Text('حذف العرض نهائياً', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.bold)),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    side: const BorderSide(color: AppColors.error),
                    backgroundColor: AppColors.error.withValues(alpha: 0.05),
                  ),
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
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.grey.shade100)),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _buildInfoItem(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.primary.withValues(alpha: 0.6)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: GoogleFonts.cairo(fontSize: 11, color: AppColors.textSecondary)),
                Text(
                  value,
                  style: GoogleFonts.cairo(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    final color = _statusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
      child: Text(
        _statusLabel(status),
        style: GoogleFonts.cairo(fontSize: 12, color: color, fontWeight: FontWeight.bold),
      ),
    );
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'APPROVED': return 'مقبول';
      case 'PENDING': return 'قيد الانتظار';
      case 'REJECTED': return 'مرفوض';
      case 'EXPIRED': return 'منتهي';
      default: return status;
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'APPROVED': return AppColors.success;
      case 'PENDING': return AppColors.primary;
      case 'REJECTED': return AppColors.error;
      case 'EXPIRED': return AppColors.textSecondary;
      default: return AppColors.textSecondary;
    }
  }

  void _showRejectionDialog(BuildContext context, Offer offer) {
    final reasonController = TextEditingController();
    final bloc = context.read<OffersBloc>();
    
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
              Text('رفض العرض', style: GoogleFonts.cairo(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.error)),
              const SizedBox(height: 8),
              Text('يرجى توضيح سبب رفض العرض " ${offer.title} " ليصل إشعار للتاجر بالسبب.', style: GoogleFonts.cairo(fontSize: 13, color: AppColors.textSecondary)),
              const SizedBox(height: 24),
              TextField(
                controller: reasonController,
                maxLines: 3,
                autofocus: true,
                decoration: const InputDecoration(
                  hintText: 'مثال: الصور غير واضحة، السعر غير منطقي...',
                  filled: true,
                  fillColor: AppColors.background,
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    bloc.add(UpdateOfferStatusEvent(
                      id: offer.id,
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

  void _showDeleteConfirmation(BuildContext context, Offer offer) async {
    final confirmed = await CustomDialogs.showConfirmDialog(
      context: context,
      title: 'حذف العرض نهائياً',
      message: 'هل أنت متأكد من حذف عرض "${offer.title}"؟ سيتم حذف جميع البيانات المرتبطة بالعرض من السجل ولا يمكن استعادتها.',
      isDestructive: true,
      confirmText: 'حذف نهائي',
    );
    
    if (confirmed == true) {
      context.read<OffersBloc>().add(DeleteOfferEvent(id: offer.id));
    }
  }
}
