import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:zag_offers_vendor_app/core/theme/app_colors.dart';
import 'package:zag_offers_vendor_app/core/utils/image_url_helper.dart';
import 'package:zag_offers_vendor_app/core/utils/time_utils.dart';
import 'package:zag_offers_vendor_app/core/widgets/network_image.dart';
import 'package:zag_offers_vendor_app/features/offers/domain/entities/offer_entity.dart';
import 'package:zag_offers_vendor_app/features/offers/presentation/pages/add_edit_offer_page.dart';

class OfferDetailsPage extends StatefulWidget {
  final OfferEntity offer;

  const OfferDetailsPage({super.key, required this.offer});

  @override
  State<OfferDetailsPage> createState() => _OfferDetailsPageState();
}

class _OfferDetailsPageState extends State<OfferDetailsPage> {
  int _selectedImageIndex = 0;

  String _resolveImageUrl(String url) => ImageUrlHelper.resolve(url);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          _buildSliverAppBar(),
          _buildContentSection(),
        ],
      ),
      bottomNavigationBar: _buildBottomActions(),
    );
  }

  Widget _buildSliverAppBar() {
    final images = widget.offer.images;
    return SliverAppBar(
      expandedHeight: 400,
      pinned: true,
      stretch: true,
      backgroundColor: AppColors.background,
      leading: Padding(
        padding: const EdgeInsets.all(12.0),
        child: CircleAvatar(
          backgroundColor: Colors.black26,
          child: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 16, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
        ),
      ),
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            if (images.isNotEmpty)
              NetworkImageWithPlaceholder(
                imageUrl: _resolveImageUrl(images[_selectedImageIndex]),
                fit: BoxFit.cover,
              )
            else
              Container(
                color: AppColors.surface,
                child: const Icon(Icons.image_not_supported_rounded, size: 64, color: AppColors.textTertiary),
              ),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  stops: [0.0, 0.6, 1.0],
                  colors: [Colors.black26, Colors.transparent, AppColors.background],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContentSection() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status and Badges
            Center(
              child: Padding(
                padding: const EdgeInsets.only(bottom: 24),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildStatusBadge(widget.offer.status),
                    const SizedBox(width: 8),
                    _buildDiscountBadge(),
                  ],
                ),
              ),
            ),

            if (widget.offer.images.length > 1) ...[
              _buildThumbnailsRow(),
              const SizedBox(height: 24),
            ],

            // Rejection Reason if any
            if (widget.offer.status == 'REJECTED' && widget.offer.rejectionReason != null) ...[
              _buildRejectionPanel(),
              const SizedBox(height: 24),
            ],

            // Title and Prices
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    widget.offer.title,
                    style: GoogleFonts.cairo(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textPrimary,
                      height: 1.2,
                    ),
                  ),
                ),
                _buildPriceColumn(),
              ],
            ),
            
            const SizedBox(height: 32),
            
            // Stats Grid
            _buildStatsGrid(),

            const SizedBox(height: 32),
            _buildSectionHeader('وصف العرض'),
            const SizedBox(height: 8),
            Text(
              widget.offer.description,
              style: GoogleFonts.cairo(
                color: AppColors.textSecondary,
                height: 1.6,
                fontSize: 13,
              ),
            ),

            if (widget.offer.terms != null && widget.offer.terms!.isNotEmpty) ...[
              const SizedBox(height: 32),
              _buildSectionHeader('الشروط والأحكام'),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Text(
                  widget.offer.terms!,
                  style: GoogleFonts.cairo(
                    color: AppColors.textTertiary,
                    height: 1.6,
                    fontSize: 12,
                  ),
                ),
              ),
            ],

            const SizedBox(height: 32),
            _buildSectionHeader('المواعيد'),
            const SizedBox(height: 12),
            _buildInfoRow(Icons.calendar_today_rounded, 'تاريخ الانتهاء', DateFormat('yyyy/MM/dd').format(widget.offer.endDate)),
            const SizedBox(height: 8),
            _buildInfoRow(Icons.access_time_rounded, 'الحالة الزمنية', TimeUtils.getRelativeTime(widget.offer.endDate)),
          ],
        ),
      ),
    );
  }

  Widget _buildDiscountBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.circular(30),
      ),
      child: Text(
        widget.offer.discount,
        style: GoogleFonts.cairo(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 11),
      ),
    );
  }

  Widget _buildPriceColumn() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        if (widget.offer.newPrice != null)
          Text(
            '${widget.offer.newPrice} ج.م',
            style: GoogleFonts.cairo(fontSize: 22, color: AppColors.primary, fontWeight: FontWeight.w900),
          ),
        if (widget.offer.oldPrice != null)
          Text(
            '${widget.offer.oldPrice} ج.م',
            style: GoogleFonts.cairo(
              fontSize: 13,
              color: AppColors.textTertiary,
              decoration: TextDecoration.lineThrough,
            ),
          ),
      ],
    );
  }

  Widget _buildRejectionPanel() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.error.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.error.withValues(alpha: 0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.error_outline_rounded, color: AppColors.error, size: 16),
              const SizedBox(width: 8),
              Text('سبب الرفض من الإدارة', style: GoogleFonts.cairo(color: AppColors.error, fontWeight: FontWeight.w900, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 8),
          Text(widget.offer.rejectionReason!, style: GoogleFonts.cairo(color: AppColors.error.withValues(alpha: 0.8), fontSize: 11)),
        ],
      ),
    );
  }

  Widget _buildThumbnailsRow() {
    return SizedBox(
      height: 50,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: widget.offer.images.length,
        itemBuilder: (context, index) {
          final isSelected = _selectedImageIndex == index;
          return GestureDetector(
            onTap: () => setState(() => _selectedImageIndex = index),
            child: Container(
              width: 50,
              margin: const EdgeInsets.only(left: 10),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: isSelected ? AppColors.primary : Colors.transparent, width: 2),
              ),
              clipBehavior: Clip.antiAlias,
              child: NetworkImageWithPlaceholder(
                imageUrl: _resolveImageUrl(widget.offer.images[index]),
                fit: BoxFit.cover,
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatsGrid() {
    return Row(
      children: [
        Expanded(child: _buildStatBox('المشاهدات', widget.offer.viewCount.toString(), Icons.visibility_rounded, Colors.blue)),
        const SizedBox(width: 12),
        Expanded(child: _buildStatBox('الطلبات', widget.offer.couponsCount.toString(), Icons.confirmation_num_rounded, Colors.orange)),
      ],
    );
  }

  Widget _buildStatBox(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 16),
          const SizedBox(height: 8),
          Text(value, style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.textPrimary)),
          Text(label, style: GoogleFonts.cairo(fontSize: 10, color: AppColors.textTertiary, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(title, style: GoogleFonts.cairo(fontSize: 14, fontWeight: FontWeight.w900, color: AppColors.textPrimary));
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, color: AppColors.textTertiary, size: 14),
        const SizedBox(width: 8),
        Text(label, style: GoogleFonts.cairo(color: AppColors.textSecondary, fontSize: 11)),
        const Spacer(),
        Text(value, style: GoogleFonts.cairo(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 11)),
      ],
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    String text;
    switch (status) {
      case 'ACTIVE': color = AppColors.success; text = 'نشط حالياً'; break;
      case 'PENDING': color = AppColors.warning; text = 'قيد المراجعة'; break;
      case 'EXPIRED': color = AppColors.textTertiary; text = 'منتهي'; break;
      case 'REJECTED': color = AppColors.error; text = 'مرفوض'; break;
      default: color = AppColors.textTertiary; text = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Text(text, style: GoogleFonts.cairo(color: color, fontSize: 10, fontWeight: FontWeight.w900)),
    );
  }

  Widget _buildBottomActions() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      decoration: BoxDecoration(
        color: AppColors.card,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: ElevatedButton.icon(
        onPressed: () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => AddEditOfferPage(offer: widget.offer)));
        },
        icon: const Icon(Icons.edit_rounded, size: 16),
        label: Text('تعديل البيانات', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 14)),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 0,
        ),
      ),
    );
  }
}
