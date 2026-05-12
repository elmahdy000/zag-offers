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
              SnackBar(content: Text(state.message, style: GoogleFonts.cairo()), backgroundColor: AppColors.success),
            );
            Navigator.of(context).pop();
            Navigator.of(context).pop();
          } else if (state is OffersError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message, style: GoogleFonts.cairo()), backgroundColor: AppColors.error),
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
      backgroundColor: AppColors.background,
      leading: Padding(
        padding: const EdgeInsets.all(8.0),
        child: CircleAvatar(
          backgroundColor: Colors.black38,
          child: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: Colors.white),
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
                child: const Icon(Icons.local_offer_rounded, size: 80, color: AppColors.textTertiary),
              ),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, Colors.transparent, Colors.black54],
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
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 120),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (widget.offer.images.length > 1) ...[
              _buildThumbnailsRow(),
              const SizedBox(height: 24),
            ],
            
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildBadge('Ø®ØµÙ… ${widget.offer.discount}', AppColors.secondary),
                _buildPreviewIndicator(),
              ],
            ),
            const SizedBox(height: 16),
            
            Text(
              widget.offer.title,
              style: GoogleFonts.cairo(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                height: 1.2,
                color: AppColors.textPrimary,
              ),
            ),
            
            const SizedBox(height: 12),
            if (widget.offer.oldPrice != null || widget.offer.newPrice != null)
              _buildPriceRow(),
            
            const SizedBox(height: 32),
            _buildSectionHeader('Ø¹Ù† Ù‡Ø°Ø§ Ø§Ù„Ø¹Ø±Ø¶'),
            const SizedBox(height: 12),
            Text(
              widget.offer.description.trim().isEmpty ? 'لا يوجد وصف متاح.' : widget.offer.description,
              style: GoogleFonts.cairo(color: AppColors.textSecondary, height: 1.6, fontSize: 14),
            ),
            
            const SizedBox(height: 32),
            _buildExpiryCard(),
            
            if (widget.offer.terms != null && widget.offer.terms!.isNotEmpty) ...[
              const SizedBox(height: 32),
              _buildSectionHeader('Ø§Ù„Ø´Ø±ÙˆØ· ÙˆØ§Ù„Ø£Ø­ÙƒØ§Ù…'),
              const SizedBox(height: 12),
              Text(
                widget.offer.terms!,
                style: GoogleFonts.cairo(color: AppColors.textSecondary, height: 1.6, fontSize: 13),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildBadge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: GoogleFonts.cairo(color: color, fontWeight: FontWeight.w900, fontSize: 12),
      ),
    );
  }

  Widget _buildPreviewIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          const Icon(Icons.remove_red_eye_rounded, color: AppColors.textTertiary, size: 14),
          const SizedBox(width: 6),
          Text(
            'Ù…Ø¹Ø§ÙŠÙ†Ø© Ù…Ø¨Ø§Ø´Ø±Ø©',
            style: GoogleFonts.cairo(fontSize: 10, color: AppColors.textTertiary, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildPriceRow() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        if (widget.offer.newPrice != null)
          Text(
            '${widget.offer.newPrice} Ø¬.Ù…',
            style: GoogleFonts.cairo(fontSize: 26, color: AppColors.primary, fontWeight: FontWeight.w900),
          ),
        if (widget.offer.oldPrice != null) ...[
          const SizedBox(width: 12),
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Text(
              '${widget.offer.oldPrice} Ø¬.Ù…',
              style: GoogleFonts.cairo(
                fontSize: 16,
                color: AppColors.textTertiary,
                decoration: TextDecoration.lineThrough,
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
    );
  }

  Widget _buildExpiryCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.error.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.error.withValues(alpha: 0.1)),
      ),
      child: Row(
        children: [
          Icon(Icons.timer_rounded, color: AppColors.error, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'ØµØ§Ù„Ø­ Ø­ØªÙ‰: ${DateFormat('yyyy/MM/dd').format(widget.offer.endDate)}',
              style: GoogleFonts.cairo(color: AppColors.error, fontWeight: FontWeight.bold, fontSize: 14),
            ),
          ),
        ],
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
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isSelected ? AppColors.primary : AppColors.border,
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
      left: 20,
      right: 20,
      child: BlocBuilder<OffersBloc, OffersState>(
        builder: (context, state) {
          final isLoading = state is OffersLoading;
          return ElevatedButton(
            onPressed: isLoading ? null : _confirmAndSave,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 0,
            ),
            child: isLoading
                ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.publish_rounded, size: 20),
                      const SizedBox(width: 10),
                      Text(
                        widget.isEdit ? 'ØªØ£ÙƒÙŠØ¯ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„Ø§Øª' : 'Ù†Ø´Ø± Ø§Ù„Ø¹Ø±Ø¶ Ø§Ù„Ø¢Ù†',
                        style: GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.bold),
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

