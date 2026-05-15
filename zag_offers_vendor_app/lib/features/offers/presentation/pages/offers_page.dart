import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_vendor_app/core/constants/app_constants.dart';
import 'package:zag_offers_vendor_app/core/theme/app_colors.dart';
import 'package:zag_offers_vendor_app/core/utils/time_utils.dart';
import 'package:zag_offers_vendor_app/core/utils/image_url_helper.dart';
import 'package:zag_offers_vendor_app/core/widgets/network_image.dart';
import 'package:zag_offers_vendor_app/core/widgets/skeleton_loader.dart';
import 'package:zag_offers_vendor_app/features/offers/domain/entities/offer_entity.dart';
import 'package:zag_offers_vendor_app/features/offers/presentation/bloc/offers_bloc.dart';
import 'package:zag_offers_vendor_app/features/offers/presentation/pages/add_edit_offer_page.dart';
import 'package:zag_offers_vendor_app/features/offers/presentation/pages/offer_details_page.dart';

class OffersPage extends StatefulWidget {
  const OffersPage({super.key});

  @override
  State<OffersPage> createState() => _OffersPageState();
}

class _OffersPageState extends State<OffersPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    context.read<OffersBloc>().add(GetMyOffersRequested());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  String _resolveImageUrl(String url) => ImageUrlHelper.resolve(url);

  List<OfferEntity> _filterOffers(List<OfferEntity> offers, String status) {
    if (status == 'ALL') return offers;
    return offers.where((o) => o.status == status).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'إدارة العروض',
          style: GoogleFonts.cairo(fontWeight: FontWeight.w900, fontSize: 18),
        ),
        centerTitle: true,
        backgroundColor: AppColors.background,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(100),
          child: Column(
            children: [
              const SizedBox(height: 8),
              TabBar(
                controller: _tabController,
                isScrollable: true,
                indicatorColor: AppColors.primary,
                indicatorWeight: 3,
                labelColor: AppColors.primary,
                unselectedLabelColor: AppColors.textTertiary,
                labelStyle: GoogleFonts.cairo(fontWeight: FontWeight.w900, fontSize: 12),
                unselectedLabelStyle: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 12),
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
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: const Icon(Icons.add_rounded, color: Colors.white, size: 28),
      ),
      body: BlocConsumer<OffersBloc, OffersState>(
        listener: (context, state) {
          if (state is OfferActionSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message, style: GoogleFonts.cairo(fontSize: 13)),
                backgroundColor: AppColors.success,
              ),
            );
          } else if (state is OffersError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message, style: GoogleFonts.cairo(fontSize: 13)),
                backgroundColor: AppColors.error,
              ),
            );
          }
        },
        buildWhen: (previous, current) => 
            current is OffersLoading || 
            current is OffersLoaded || 
            current is OffersError,
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
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
        itemCount: filtered.length,
        itemBuilder: (context, index) => _buildOfferCard(context, filtered[index]),
      ),
    );
  }

  Widget _buildOfferCard(BuildContext context, OfferEntity offer) {
    final hasImage = offer.images.isNotEmpty;
    final firstImage = hasImage ? _resolveImageUrl(offer.images.first) : null;

    return InkWell(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => OfferDetailsPage(offer: offer)),
      ),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                children: [
                  SizedBox(
                    height: 140,
                    width: double.infinity,
                    child: firstImage != null
                        ? NetworkImageWithPlaceholder(
                            imageUrl: firstImage,
                            fit: BoxFit.cover,
                          )
                        : _buildImagePlaceholder(),
                  ),
                  Positioned(
                    top: 12,
                    left: 12,
                    child: _buildStatusBadge(offer.status),
                  ),
                  Positioned(
                    bottom: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        offer.discount,
                        style: GoogleFonts.cairo(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 4,
                    right: 4,
                    child: Material(
                      color: Colors.transparent,
                      child: IconButton(
                        icon: Icon(
                          Icons.more_vert_rounded, 
                          color: hasImage ? Colors.white : AppColors.textPrimary, 
                          size: 24
                        ),
                        onPressed: () => _showOfferOptions(context, offer),
                      ),
                    ),
                  ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      offer.title,
                      style: GoogleFonts.cairo(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        color: AppColors.textPrimary,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      offer.description,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.cairo(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (offer.newPrice != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12.0),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                '${offer.newPrice} ج.م',
                                style: GoogleFonts.cairo(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 18,
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            if (offer.oldPrice != null)
                              Text(
                                '${offer.oldPrice} ج.م',
                                style: GoogleFonts.cairo(
                                  color: AppColors.textTertiary,
                                  decoration: TextDecoration.lineThrough,
                                  decorationThickness: 2,
                                  fontSize: 12,
                                ),
                              ),
                          ],
                        ),
                      ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.visibility_rounded, size: 14, color: AppColors.textTertiary),
                            const SizedBox(width: 4),
                            Text(
                              '${offer.viewCount}',
                              style: GoogleFonts.cairo(fontSize: 11, color: AppColors.textTertiary),
                            ),
                            const SizedBox(width: 12),
                            Icon(Icons.confirmation_num_rounded, size: 14, color: AppColors.accent),
                            const SizedBox(width: 4),
                            Text(
                              '${offer.couponsCount}',
                              style: GoogleFonts.cairo(
                                fontSize: 11,
                                color: AppColors.accent,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        Text(
                          'ينتهي ${TimeUtils.getRelativeTime(offer.endDate)}',
                          style: GoogleFonts.cairo(
                            fontSize: 10,
                            color: AppColors.textTertiary,
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
      ),
    );
  }

  void _showOfferOptions(BuildContext context, OfferEntity offer) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 32,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            _buildOptionTile(
              Icons.edit_rounded,
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
              Icons.delete_rounded,
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
      leading: Icon(icon, color: color, size: 22),
      title: Text(label, style: GoogleFonts.cairo(color: color, fontWeight: FontWeight.bold, fontSize: 14)),
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
        color = AppColors.warning;
        text = 'قيد المراجعة';
        break;
      case 'EXPIRED':
        color = AppColors.textTertiary;
        text = 'منتهي';
        break;
      default:
        color = AppColors.textTertiary;
        text = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        text,
        style: GoogleFonts.cairo(
          color: color,
          fontSize: 9,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }

  Widget _buildImagePlaceholder() {
    return Container(
      color: AppColors.surface,
      child: const Icon(Icons.image_rounded, size: 32, color: AppColors.textTertiary),
    );
  }

  Widget _buildEmptyState(String status) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              _searchQuery.isNotEmpty ? Icons.search_off_rounded : Icons.local_offer_rounded,
              size: 48,
              color: AppColors.border,
            ),
            const SizedBox(height: 20),
            Text(
              _searchQuery.isNotEmpty ? 'لم نعثر على نتائج' : 'لا توجد عروض',
              style: GoogleFonts.cairo(
                fontWeight: FontWeight.w900,
                fontSize: 16,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline_rounded, size: 48, color: AppColors.error),
          const SizedBox(height: 16),
          Text(
            'حدث خطأ في التحميل',
            style: GoogleFonts.cairo(fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 24),
          TextButton(
            onPressed: () => context.read<OffersBloc>().add(GetMyOffersRequested()),
            child: const Text('إعادة المحاولة'),
          ),
        ],
      ),
    );
  }

  void _showDeleteConfirm(BuildContext context, String id) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('حذف العرض', style: GoogleFonts.cairo(fontWeight: FontWeight.w900, fontSize: 16, color: AppColors.textPrimary)),
        content: Text('هل أنت متأكد من رغبتك في حذف هذا العرض؟', style: GoogleFonts.cairo(fontSize: 14, color: AppColors.textSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text('إلغاء', style: GoogleFonts.cairo(color: AppColors.textTertiary))),
          TextButton(
            onPressed: () {
              context.read<OffersBloc>().add(DeleteOfferRequested(id));
              Navigator.pop(context);
            },
            child: Text('حذف', style: GoogleFonts.cairo(color: AppColors.error)),
          ),
        ],
      ),
    );
  }
}
