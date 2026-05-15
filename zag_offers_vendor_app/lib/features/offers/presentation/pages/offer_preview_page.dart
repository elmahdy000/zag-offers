import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/network_image.dart';
import '../../domain/entities/offer_entity.dart';
import '../bloc/offers_bloc.dart';

class OfferPreviewPage extends StatefulWidget {
  final OfferEntity offer;
  final bool isEdit;

  const OfferPreviewPage({
    super.key,
    required this.offer,
    required this.isEdit,
  });

  @override
  State<OfferPreviewPage> createState() => _OfferPreviewPageState();
}

class _OfferPreviewPageState extends State<OfferPreviewPage> {
  int _selectedImageIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: BlocListener<OffersBloc, OffersState>(
        listener: (context, state) {
          if (state is OfferActionSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message, style: GoogleFonts.cairo(fontSize: 13)),
                backgroundColor: AppColors.success,
                behavior: SnackBarBehavior.floating,
              ),
            );
            Navigator.of(context).pop();
            Navigator.of(context).pop();
          } else if (state is OffersError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message, style: GoogleFonts.cairo(fontSize: 13)),
                backgroundColor: AppColors.error,
                behavior: SnackBarBehavior.floating,
              ),
            );
          }
        },
        child: Stack(
          children: [
            CustomScrollView(
              physics: const BouncingScrollPhysics(),
              slivers: [
                _buildSliverAppBar(),
                _buildContentSection(),
              ],
            ),
            _buildFloatingAction(),
          ],
        ),
      ),
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
                imageUrl: images[_selectedImageIndex],
                fit: BoxFit.cover,
              )
            else
              Container(
                color: AppColors.surface,
                child: const Icon(Icons.local_offer_rounded, size: 60, color: AppColors.textTertiary),
              ),
            // Gradient Overlay
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
            
            // Image Paging Indicator
            if (images.length > 1)
              Positioned(
                bottom: 30,
                right: 20,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.black45,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${_selectedImageIndex + 1} / ${images.length}',
                    style: GoogleFonts.cairo(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
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
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 140),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Preview Indicator Badge
            Center(
              child: Container(
                margin: const EdgeInsets.only(bottom: 24),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.auto_awesome_rounded, color: AppColors.primary, size: 14),
                    const SizedBox(width: 8),
                    Text(
                      'وضع المعاينة المباشرة',
                      style: GoogleFonts.cairo(
                        fontSize: 11,
                        color: AppColors.primary,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            if (widget.offer.images.length > 1) ...[
              _buildThumbnailsRow(),
              const SizedBox(height: 24),
            ],

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.offer.title,
                        style: GoogleFonts.cairo(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          color: AppColors.textPrimary,
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      _buildDiscountBadge(),
                    ],
                  ),
                ),
                _buildPriceColumn(),
              ],
            ),

            const SizedBox(height: 32),
            _buildSectionHeader('تفاصيل العرض'),
            const SizedBox(height: 8),
            Text(
              widget.offer.description,
              style: GoogleFonts.cairo(
                color: AppColors.textSecondary,
                height: 1.6,
                fontSize: 13,
              ),
            ),

            const SizedBox(height: 32),
            _buildInfoGrid(),

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
          ],
        ),
      ),
    );
  }

  Widget _buildDiscountBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: AppColors.accent.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        'خصم ${widget.offer.discount}',
        style: GoogleFonts.cairo(
          color: AppColors.accent,
          fontWeight: FontWeight.w900,
          fontSize: 11,
        ),
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
            style: GoogleFonts.cairo(
              fontSize: 22,
              color: AppColors.primary,
              fontWeight: FontWeight.w900,
            ),
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

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: GoogleFonts.cairo(
        fontSize: 14,
        fontWeight: FontWeight.w900,
        color: AppColors.textPrimary,
        letterSpacing: 0.5,
      ),
    );
  }

  Widget _buildInfoGrid() {
    return Row(
      children: [
        Expanded(
          child: _buildInfoItem(
            'تاريخ الانتهاء',
            DateFormat('yyyy/MM/dd').format(widget.offer.endDate),
            Icons.event_note_rounded,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildInfoItem(
            'حد الاستخدام',
            widget.offer.usageLimit?.toString() ?? 'غير محدود',
            Icons.people_alt_rounded,
          ),
        ),
      ],
    );
  }

  Widget _buildInfoItem(String label, String value, IconData icon) {
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
          Icon(icon, color: AppColors.primary, size: 18),
          const SizedBox(height: 8),
          Text(
            label,
            style: GoogleFonts.cairo(fontSize: 10, color: AppColors.textTertiary, fontWeight: FontWeight.bold),
          ),
          Text(
            value,
            style: GoogleFonts.cairo(
              fontSize: 13,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
            ),
          ),
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
                border: Border.all(
                  color: isSelected ? AppColors.primary : Colors.transparent,
                  width: 2,
                ),
              ),
              clipBehavior: Clip.antiAlias,
              child: Opacity(
                opacity: isSelected ? 1.0 : 0.6,
                child: NetworkImageWithPlaceholder(
                  imageUrl: widget.offer.images[index],
                  fit: BoxFit.cover,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildFloatingAction() {
    return Positioned(
      bottom: 24,
      left: 20,
      right: 20,
      child: BlocBuilder<OffersBloc, OffersState>(
        builder: (context, state) {
          final isLoading = state is OffersLoading;
          return Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.3),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: ElevatedButton(
              onPressed: isLoading ? null : _confirmAndSave,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 0,
              ),
              child: isLoading
                  ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(widget.isEdit ? Icons.check_circle_rounded : Icons.rocket_launch_rounded, size: 20),
                        const SizedBox(width: 12),
                        Text(
                          widget.isEdit ? 'حفظ التعديلات النهائية' : 'نشر العرض للعالم الآن',
                          style: GoogleFonts.cairo(fontSize: 15, fontWeight: FontWeight.w900),
                        ),
                      ],
                    ),
            ),
          );
        },
      ),
    );
  }

  void _confirmAndSave() {
    if (widget.isEdit) {
      context.read<OffersBloc>().add(UpdateOfferRequested(widget.offer));
    } else {
      context.read<OffersBloc>().add(CreateOfferRequested(widget.offer));
    }
  }
}
