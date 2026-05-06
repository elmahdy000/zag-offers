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
      backgroundColor: Colors.white,
      body: BlocListener<OffersBloc, OffersState>(
        listener: (context, state) {
          if (state is OfferActionSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: AppColors.success),
            );
            // Pop back to Offers list (pop twice: preview and add/edit)
            Navigator.of(context).pop();
            Navigator.of(context).pop();
          } else if (state is OffersError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: AppColors.error),
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
            _buildBottomAction(),
          ],
        ),
      ),
    );
  }

  Widget _buildSliverAppBar() {
    final images = widget.offer.images;
    return SliverAppBar(
      expandedHeight: 350,
      pinned: true,
      backgroundColor: AppColors.primary,
      leading: Container(
        margin: const EdgeInsets.all(8),
        decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
        child: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: AppColors.primary),
          onPressed: () => Navigator.pop(context),
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
                color: AppColors.primary,
                child: const Icon(Icons.local_offer_rounded, size: 100, color: Colors.white24),
              ),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.black26, Colors.transparent, Colors.black45],
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
      child: Transform.translate(
        offset: const Offset(0, -30),
        child: Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
          ),
          padding: const EdgeInsets.fromLTRB(24, 32, 24, 120),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (widget.offer.images.length > 1) _buildThumbnailsRow(),
              if (widget.offer.images.length > 1) const SizedBox(height: 24),
              
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.secondary,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      'خصم ${widget.offer.discount}',
                      style: GoogleFonts.cairo(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 14,
                      ),
                    ),
                  ),
                  Row(
                    children: [
                      const Icon(Icons.remove_red_eye_outlined, color: AppColors.textSecondary, size: 16),
                      const SizedBox(width: 4),
                      Text(
                        'معاينة مباشرة',
                        style: GoogleFonts.cairo(fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 20),
              
              Text(
                widget.offer.title,
                style: GoogleFonts.cairo(
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  height: 1.2,
                  color: AppColors.textPrimary,
                ),
              ),
              
              const SizedBox(height: 12),
              if (widget.offer.oldPrice != null || widget.offer.newPrice != null)
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    if (widget.offer.newPrice != null)
                      Text(
                        '${widget.offer.newPrice} ج.م',
                        style: GoogleFonts.cairo(
                          fontSize: 24,
                          color: AppColors.secondary,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    if (widget.offer.oldPrice != null) ...[
                      const SizedBox(width: 12),
                      Padding(
                        padding: const EdgeInsets.bottom(4),
                        child: Text(
                          '${widget.offer.oldPrice} ج.م',
                          style: GoogleFonts.cairo(
                            fontSize: 16,
                            color: Colors.grey[400],
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              
              const SizedBox(height: 32),
              Text(
                'عن هذا العرض',
                style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 12),
              Text(
                widget.offer.description ?? 'لا يوجد وصف متاح.',
                style: GoogleFonts.cairo(color: AppColors.textSecondary, height: 1.6),
              ),
              
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.red[50],
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Icon(Icons.timer_outlined, color: Colors.red[700], size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'صالح حتى: ${DateFormat('yyyy/MM/dd').format(widget.offer.endDate)}',
                        style: GoogleFonts.cairo(
                          color: Colors.red[700],
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              
              if (widget.offer.terms != null && widget.offer.terms!.isNotEmpty) ...[
                const SizedBox(height: 32),
                Text(
                  'الشروط والأحكام',
                  style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 12),
                Text(
                  widget.offer.terms!,
                  style: GoogleFonts.cairo(color: AppColors.textSecondary, height: 1.6),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildThumbnailsRow() {
    return SizedBox(
      height: 60,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: widget.offer.images.length,
        itemBuilder: (context, index) {
          final isSelected = _selectedImageIndex == index;
          return GestureDetector(
            onTap: () => setState(() => _selectedImageIndex = index),
            child: Container(
              width: 60,
              margin: const EdgeInsets.only(left: 12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isSelected ? AppColors.secondary : Colors.grey[200]!,
                  width: 2,
                ),
              ),
              clipBehavior: Clip.antiAlias,
              child: NetworkImageWithPlaceholder(
                imageUrl: widget.offer.images[index],
                fit: BoxFit.cover,
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildBottomAction() {
    return Positioned(
      bottom: 24,
      left: 24,
      right: 24,
      child: BlocBuilder<OffersBloc, OffersState>(
        builder: (context, state) {
          final isLoading = state is OffersLoading;
          return ElevatedButton(
            onPressed: isLoading ? null : _confirmAndSave,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.success,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 18),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              elevation: 8,
              shadowColor: AppColors.success.withValues(alpha: 0.4),
            ),
            child: isLoading
                ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.cloud_upload_rounded),
                      const SizedBox(width: 12),
                      Text(
                        widget.isEdit ? 'تأكيد التعديلات' : 'تأكيد ونشر العرض',
                        style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                    ],
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
