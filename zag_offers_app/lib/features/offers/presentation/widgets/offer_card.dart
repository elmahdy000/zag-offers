import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/network_image_widget.dart';
import '../../domain/entities/offer_entity.dart';
import 'favorite_button.dart';
import 'flash_sale_badge.dart';
import '../../../../core/widgets/bouncy_tap.dart';

class OfferCard extends StatelessWidget {
  final OfferEntity offer;
  final VoidCallback? onTap;
  final bool isWide;

  const OfferCard({
    super.key,
    required this.offer,
    this.onTap,
    this.isWide = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    return BouncyTap(
      onTap: onTap,
      scaleFactor: 0.968,
      child: Container(
        width: isWide ? null : 285,
        margin: isWide ? EdgeInsets.zero : const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
        decoration: BoxDecoration(
          color: theme.cardColor,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: isDark 
                ? Colors.white.withValues(alpha: 0.08) 
                : Colors.black.withValues(alpha: 0.06),
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: isDark 
                  ? Colors.black.withValues(alpha: 0.35) 
                  : Colors.black.withValues(alpha: 0.05),
              blurRadius: 14,
              offset: const Offset(0, 4),
            ),
            if (!isDark)
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.03),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildImageSection(context, isDark),
              Expanded(
                child: _buildInfoSection(context, isDark),
              ),
              _buildCouponSeparator(isDark),
              _buildActionSection(context, isDark),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImageSection(BuildContext context, bool isDark) {
    return AspectRatio(
      aspectRatio: 1.82,
      child: Stack(
        fit: StackFit.expand,
        children: [
          Hero(
            tag: 'offer_image_${offer.id}',
            child: NetworkImageWidget(
              imageUrl: offer.image,
              fit: BoxFit.cover,
            ),
          ),
          // Subtle gradient overlay at bottom
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.15),
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.45),
                  ],
                  stops: const [0.0, 0.5, 1.0],
                ),
              ),
            ),
          ),
          // Luxury Floating Discount Badge
          Positioned(
            top: 10,
            right: 10,
            child: _buildDiscountBadge(),
          ),
          // Frosted Favorite Button
          Positioned(
            top: 10,
            left: 10,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.35),
                shape: BoxShape.circle,
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.25),
                  width: 0.8,
                ),
              ),
              padding: const EdgeInsets.all(2),
              child: FavoriteButton(offerId: offer.id, size: 17),
            ),
          ),
          // Flash sale badge
          if (offer.isFlashSale && offer.flashSaleEndsAt != null)
            Positioned(
              bottom: 10,
              left: 10,
              child: FlashSaleBadge(endsAt: offer.flashSaleEndsAt!),
            ),
        ],
      ),
    );
  }

  Widget _buildDiscountBadge() {
    final discountText = offer.discount.isNotEmpty 
        ? (offer.discount.contains('%') ? offer.discount : '${offer.discount}%') 
        : 'خصم خاص';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4.5),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFF5E00), Color(0xFFFF2A55)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(10),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFF3D00).withValues(alpha: 0.4),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('🔥 ', style: TextStyle(fontSize: 10)),
          Text(
            discountText,
            style: GoogleFonts.cairo(
              color: Colors.white,
              fontWeight: FontWeight.w900,
              fontSize: 11.5,
              height: 1.1,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoSection(BuildContext context, bool isDark) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Store Info Row
          Row(
            children: [
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.25),
                    width: 0.8,
                  ),
                ),
                child: Center(
                  child: Text(
                    offer.store.name.isNotEmpty ? offer.store.name.characters.first : 'م',
                    style: GoogleFonts.cairo(
                      color: AppColors.primary,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Row(
                  children: [
                    Flexible(
                      child: Text(
                        offer.store.name,
                        style: GoogleFonts.cairo(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 3),
                    const Icon(
                      Icons.verified_rounded,
                      size: 13,
                      color: AppColors.primary,
                    ),
                  ],
                ),
              ),
              if (offer.store.rating > 0) ...[
                const Icon(Icons.star_rounded, size: 13, color: Colors.amber),
                const SizedBox(width: 2),
                Text(
                  offer.store.rating.toStringAsFixed(1),
                  style: GoogleFonts.cairo(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white70 : Colors.black87,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 5),
          // Title
          SizedBox(
            height: 38,
            child: Text(
              offer.title,
              style: GoogleFonts.cairo(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                height: 1.3,
                color: isDark ? Colors.white : AppColors.textPrimary,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(height: 4),
          // Area & Live Interest Stats
          Row(
            children: [
              Expanded(
                child: Row(
                  children: [
                    Icon(
                      Icons.location_on_rounded,
                      size: 11,
                      color: isDark ? AppColors.textDarkDim : AppColors.textSecondary,
                    ),
                    const SizedBox(width: 2),
                    Flexible(
                      child: Text(
                        offer.store.category != null && offer.store.category!.isNotEmpty
                            ? '${offer.store.area.isNotEmpty ? offer.store.area : "الزقازيق"} • ${offer.store.category}'
                            : (offer.store.area.isNotEmpty ? offer.store.area : 'الزقازيق'),
                        style: GoogleFonts.cairo(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: isDark ? AppColors.textDarkDim : AppColors.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 4),
              ..._buildLiveStats(isDark),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCouponSeparator(bool isDark) {
    return SizedBox(
      height: 16,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            size: const Size(double.infinity, 1),
            painter: _DashedLinePainter(isDark: isDark),
          ),
          // Left Ticket Notch
          Positioned(
            left: -8,
            child: Container(
              width: 16,
              height: 16,
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkBackground : AppColors.background,
                shape: BoxShape.circle,
              ),
            ),
          ),
          // Right Ticket Notch
          Positioned(
            right: -8,
            child: Container(
              width: 16,
              height: 16,
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkBackground : AppColors.background,
                shape: BoxShape.circle,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionSection(BuildContext context, bool isDark) {
    double? displayNewPrice = offer.newPrice;
    double? displayOldPrice = offer.oldPrice;

    if (displayOldPrice == null && displayNewPrice != null && offer.discountPercentage > 0) {
      if (offer.discount.contains('%')) {
        displayOldPrice = displayNewPrice / (1 - (offer.discountPercentage / 100));
      } else {
        displayOldPrice = displayNewPrice + offer.discountPercentage;
      }
    } else if (displayNewPrice == null && displayOldPrice != null && offer.discountPercentage > 0) {
      if (offer.discount.contains('%')) {
        displayNewPrice = displayOldPrice * (1 - (offer.discountPercentage / 100));
      } else {
        displayNewPrice = displayOldPrice - offer.discountPercentage;
      }
    }
    
    if (displayNewPrice == displayOldPrice) {
      displayOldPrice = null;
    }

    final hasPrice = displayNewPrice != null || displayOldPrice != null;

    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 4, 12, 11),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          if (hasPrice)
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (displayOldPrice != null)
                    Text(
                      '${displayOldPrice.toStringAsFixed(0)} ج.م',
                      style: GoogleFonts.cairo(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: isDark ? AppColors.textDarkDim.withValues(alpha: 0.65) : Colors.black45,
                        decoration: TextDecoration.lineThrough,
                        height: 1.1,
                      ),
                    ),
                  if (displayNewPrice != null)
                    Text(
                      '${displayNewPrice.toStringAsFixed(0)} ج.م',
                      style: GoogleFonts.cairo(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w900,
                        fontSize: 15,
                        height: 1.1,
                      ),
                    ),
                ],
              ),
            )
          else
            Expanded(
              child: Text(
                'عرض حصري',
                style: GoogleFonts.cairo(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white70 : AppColors.textPrimary,
                ),
              ),
            ),
          // Chic Voucher Action Pill
          Container(
            padding: EdgeInsets.symmetric(
              horizontal: isWide ? 9 : 13,
              vertical: isWide ? 5 : 6.5,
            ),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppColors.primary, Color(0xFFFF8C35)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(11),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.35),
                  blurRadius: 8,
                  offset: const Offset(0, 2.5),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'احصل عليه',
                  style: GoogleFonts.cairo(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: isWide ? 10.5 : 11.5,
                    height: 1.1,
                  ),
                ),
                const SizedBox(width: 4),
                const Icon(
                  Icons.arrow_back_ios_new_rounded,
                  size: 9,
                  color: Colors.white,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildLiveStats(bool isDark) {
    if (offer.usageLimit != null && offer.usageLimit! > 0) {
      final remaining = offer.usageLimit! - offer.usedCoupons;
      final isCritical = remaining <= 5;
      
      return [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
          decoration: BoxDecoration(
            color: isCritical 
                ? Colors.red.withValues(alpha: 0.12) 
                : AppColors.primary.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Row(
            children: [
              Icon(
                Icons.hourglass_bottom_rounded,
                size: 10,
                color: isCritical ? Colors.red : AppColors.primary,
              ),
              const SizedBox(width: 3),
              Text(
                'باقي $remaining',
                style: GoogleFonts.cairo(
                  fontSize: 9.5,
                  fontWeight: FontWeight.w800,
                  color: isCritical ? Colors.red : AppColors.primary,
                  height: 1.1,
                ),
              ),
            ],
          ),
        ),
      ];
    }

    return [
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(
          color: Colors.orange.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(
          children: [
            const Icon(
              Icons.local_fire_department_rounded,
              size: 11,
              color: Colors.orange,
            ),
            const SizedBox(width: 3),
            Text(
              '${offer.viewCount} مهتم',
              style: GoogleFonts.cairo(
                fontSize: 9.5,
                fontWeight: FontWeight.w800,
                color: Colors.orange,
                height: 1.1,
              ),
            ),
          ],
        ),
      ),
    ];
  }
}

class _DashedLinePainter extends CustomPainter {
  final bool isDark;
  _DashedLinePainter({required this.isDark});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = isDark 
          ? Colors.white.withValues(alpha: 0.12) 
          : Colors.black.withValues(alpha: 0.08)
      ..strokeWidth = 1.2;
    const dashWidth = 5.0;
    const dashSpace = 4.0;
    double startX = 14;
    final endX = size.width - 14;
    while (startX < endX) {
      canvas.drawLine(Offset(startX, 0), Offset(startX + dashWidth, 0), paint);
      startX += dashWidth + dashSpace;
    }
  }

  @override
  bool shouldRepaint(_DashedLinePainter old) => old.isDark != isDark;
}
