import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_vendor_app/core/constants/app_constants.dart';
import 'package:zag_offers_vendor_app/core/theme/app_colors.dart';
import 'package:zag_offers_vendor_app/core/utils/time_utils.dart';
import 'package:zag_offers_vendor_app/core/widgets/network_image.dart';
import 'package:zag_offers_vendor_app/core/widgets/skeleton_loader.dart';
import 'package:zag_offers_vendor_app/features/offers/domain/entities/offer_entity.dart';
import 'package:zag_offers_vendor_app/features/offers/presentation/bloc/offers_bloc.dart';
import 'package:zag_offers_vendor_app/features/offers/presentation/pages/add_edit_offer_page.dart';

class OffersPage extends StatefulWidget {
  const OffersPage({super.key});

  @override
  State<OffersPage> createState() => _OffersPageState();
}

class _OffersPageState extends State<OffersPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    context.read<OffersBloc>().add(GetMyOffersRequested());
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  String _resolveImageUrl(String url) {
    if (url.isEmpty) return '';
    final trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    final base = AppConstants.socketUrl.endsWith('/')
        ? AppConstants.socketUrl.substring(0, AppConstants.socketUrl.length - 1)
        : AppConstants.socketUrl;
    final path = trimmed.startsWith('/') ? trimmed : '/$trimmed';
    return '$base$path';
  }

  List<OfferEntity> _filterOffers(List<OfferEntity> offers, String status) {
    var filtered = offers;
    if (status != 'ALL') {
      filtered = offers.where((o) => o.status == status).toList();
    }
    if (_searchQuery.isNotEmpty) {
      filtered = filtered
          .where((o) => o.title.toLowerCase().contains(_searchQuery.toLowerCase()))
          .toList();
    }
    return filtered;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'إدارة العروض',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        backgroundColor: AppColors.background,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(110),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Container(
                  height: 45,
                  decoration: BoxDecoration(
                    color: AppColors.card,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  child: TextField(
                    controller: _searchController,
                    onChanged: (v) => setState(() => _searchQuery = v),
                    decoration: InputDecoration(
                      hintText: 'ابحث عن عرض...',
                      hintStyle: GoogleFonts.cairo(fontSize: 14, color: Colors.grey),
                      prefixIcon: const Icon(Icons.search, color: AppColors.primary, size: 20),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                  ),
                ),
              ),
              TabBar(
                controller: _tabController,
                isScrollable: true,
                indicatorColor: AppColors.primary,
                labelColor: AppColors.primary,
                unselectedLabelColor: Colors.grey,
                labelStyle: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 13),
                unselectedLabelStyle: GoogleFonts.cairo(fontWeight: FontWeight.w500, fontSize: 13),
                tabs: const [
                  Tab(text: 'الكل'),
                  Tab(text: 'نشط'),
                  Tab(text: 'قيد المراجعة'),
                  Tab(text: 'منتهي'),
                ],
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        heroTag: 'offers_fab',
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const AddEditOfferPage()),
        ),
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: BlocBuilder<OffersBloc, OffersState>(
        builder: (context, state) {
          if (state is OffersLoading) {
            return const ListSkeleton(itemCount: 5);
          } else if (state is OffersError) {
            return _buildErrorState(state.message);
          } else if (state is OffersLoaded) {
            return TabBarView(
              controller: _tabController,
              children: [
                _buildOffersList(state.offers, 'ALL'),
                _buildOffersList(state.offers, 'ACTIVE'),
                _buildOffersList(state.offers, 'PENDING'),
                _buildOffersList(state.offers, 'EXPIRED'),
              ],
            );
          }
          return const SizedBox();
        },
      ),
    );
  }

  Widget _buildOffersList(List<OfferEntity> allOffers, String status) {
    final filtered = _filterOffers(allOffers, status);

    if (filtered.isEmpty) {
      return _buildEmptyState(status);
    }

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () async => context.read<OffersBloc>().add(GetMyOffersRequested()),
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
        itemCount: filtered.length,
        itemBuilder: (context, index) => _buildOfferCard(context, filtered[index]),
      ),
    );
  }

  Widget _buildOfferCard(BuildContext context, OfferEntity offer) {
    final firstImage = offer.images.isNotEmpty ? _resolveImageUrl(offer.images.first) : null;

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.border),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Section
            Stack(
              children: [
                SizedBox(
                  height: 180,
                  width: double.infinity,
                  child: firstImage != null
                      ? NetworkImageWithPlaceholder(
                          imageUrl: firstImage,
                          fit: BoxFit.cover,
                        )
                      : _buildImagePlaceholder(),
                ),
                // Overlay Gradient
                Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.black.withValues(alpha: 0.6),
                        ],
                      ),
                    ),
                  ),
                ),
                // Badges
                Positioned(
                  top: 16,
                  left: 16,
                  child: _buildStatusBadge(offer.status),
                ),
                Positioned(
                  bottom: 16,
                  right: 16,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.accent,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      offer.discount,
                      style: GoogleFonts.cairo(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
                // Actions Button
                Positioned(
                  top: 8,
                  right: 8,
                  child: Material(
                    color: Colors.transparent,
                    child: IconButton(
                      icon: const Icon(Icons.more_horiz, color: Colors.white),
                      onPressed: () => _showOfferOptions(context, offer),
                    ),
                  ),
                ),
              ],
            ),
            // Info Section
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    offer.title,
                    style: GoogleFonts.cairo(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    offer.description,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.cairo(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.visibility_outlined, size: 16, color: Colors.grey),
                          const SizedBox(width: 4),
                          Text(
                            '${offer.viewCount} مشاهدة',
                            style: GoogleFonts.cairo(fontSize: 12, color: Colors.grey),
                          ),
                          const SizedBox(width: 16),
                          const Icon(Icons.confirmation_num_outlined, size: 16, color: AppColors.primary),
                          const SizedBox(width: 4),
                          Text(
                            '${offer.couponsCount} طلب',
                            style: GoogleFonts.cairo(
                              fontSize: 12,
                              color: AppColors.primary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      Text(
                        'ينتهي ${TimeUtils.getRelativeTime(offer.endDate)}',
                        style: GoogleFonts.cairo(
                          fontSize: 12,
                          color: AppColors.primary,
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

  void _showOfferOptions(BuildContext context, OfferEntity offer) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 24),
            _buildOptionTile(
              Icons.edit_outlined,
              'تعديل العرض',
              AppColors.textPrimary,
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => AddEditOfferPage(offer: offer)),
                );
              },
            ),
            _buildOptionTile(
              Icons.delete_outline_rounded,
              'حذف العرض',
              AppColors.error,
              onTap: () {
                Navigator.pop(context);
                _showDeleteConfirm(context, offer.id);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOptionTile(IconData icon, String label, Color color, {required VoidCallback onTap}) {
    return ListTile(
      leading: Icon(icon, color: color),
      title: Text(label, style: GoogleFonts.cairo(color: color, fontWeight: FontWeight.w600)),
      onTap: onTap,
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    String text;
    switch (status) {
      case 'ACTIVE':
        color = AppColors.success;
        text = 'نشط';
        break;
      case 'PENDING':
        color = AppColors.secondary;
        text = 'قيد المراجعة';
        break;
      case 'EXPIRED':
        color = AppColors.error;
        text = 'منتهي';
        break;
      default:
        color = Colors.grey;
        text = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.3),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        text,
        style: GoogleFonts.cairo(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildImagePlaceholder() {
    return Container(
      color: AppColors.surface,
      child: const Icon(Icons.image_outlined, size: 48, color: AppColors.textSecondary),
    );
  }

  Widget _buildEmptyState(String status) {
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
                _searchQuery.isNotEmpty ? Icons.search_off_rounded : Icons.local_offer_outlined,
                size: 64,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              _searchQuery.isNotEmpty ? 'لم نعثر على نتائج' : 'لا توجد عروض',
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
                  ? 'جرّب كلمات بحث مختلفة للوصول إلى العرض المطلوب.'
                  : 'ابدأ بإضافة عرض جديد الآن للوصول لعملائك وزيادة مبيعاتك.',
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

  Widget _buildErrorState(String message) {
    final isConnectionError = message.toLowerCase().contains('connection') || 
                             message.toLowerCase().contains('network') ||
                             message.toLowerCase().contains('socket');

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
              child: Icon(
                isConnectionError ? Icons.wifi_off_rounded : Icons.error_outline_rounded,
                size: 64,
                color: AppColors.error,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              isConnectionError ? 'مشكلة في الاتصال' : 'حدث خطأ غير متوقع',
              style: GoogleFonts.cairo(
                fontWeight: FontWeight.w900,
                fontSize: 20,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              isConnectionError 
                  ? 'يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى'
                  : message,
              textAlign: TextAlign.center,
              style: GoogleFonts.cairo(
                color: AppColors.textSecondary,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: 200,
              height: 50,
              child: ElevatedButton(
                onPressed: () => context.read<OffersBloc>().add(GetMyOffersRequested()),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 0,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.refresh_rounded, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'إعادة المحاولة',
                      style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDeleteConfirm(BuildContext context, String id) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('حذف العرض', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        content: Text('هل أنت متأكد من رغبتك في حذف هذا العرض؟', style: GoogleFonts.cairo()),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('إلغاء')),
          TextButton(
            onPressed: () {
              context.read<OffersBloc>().add(DeleteOfferRequested(id));
              Navigator.pop(context);
            },
            child: const Text('حذف', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }
}
