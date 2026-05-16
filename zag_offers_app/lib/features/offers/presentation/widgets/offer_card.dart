import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/category_utils.dart';
import '../../../../core/widgets/network_image_widget.dart';
import '../../domain/entities/offer_entity.dart';
import 'favorite_button.dart';

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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      width: isWide ? null : 260,
      margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? AppColors.borderDark : Colors.black.withValues(alpha: 0.05),
          width: 0.8,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // 1. TOP: Image Section (Fixed Aspect Ratio)
                _buildImageSection(context),
                
                // 2. MIDDLE: Info Section
                Expanded(
                  child: _buildInfoSection(context),
                ),
                
                // 3. SEPARATOR: Coupon Cut-out Line
                _buildCouponSeparator(context),
                
                // 4. BOTTOM: Price & Action Section
                _buildActionSection(context),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildImageSection(BuildContext context) {
    return AspectRatio(
      aspectRatio: 1.8, // More compact header
      child: Stack(
        fit: StackFit.expand,
        children: [
          NetworkImageWidget(
            imageUrl: offer.image,
            fit: BoxFit.cover,
          ),
          // Badges Overlay
          Positioned(
            top: 8,
            right: 8,
            child: _buildDiscountBadge(),
          ),
          Positioned(
            top: 8,
            left: 8,
            child: FavoriteButton(offerId: offer.id, size: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildDiscountBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.circular(6),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 4,
          ),
        ],
      ),
      child: Text(
        offer.discount.isNotEmpty ? offer.discount : 'عرض',
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w900,
          fontSize: 10.5,
          fontFamily: 'Tajawal',
        ),
      ),
    );
  }

  Widget _buildInfoSection(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Padding(
      padding: const EdgeInsets.fromLTRB(10, 8, 10, 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            offer.store.name,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: AppColors.primary,
              fontFamily: 'Tajawal',
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            offer.title,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              height: 1.2,
              color: isDark ? Colors.white : AppColors.textPrimary,
              fontFamily: 'Tajawal',
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            '${offer.store.area ?? ""} • ${offer.store.category ?? ""}',
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w500,
              color: isDark ? Colors.white38 : AppColors.textSecondary,
              fontFamily: 'Tajawal',
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildCouponSeparator(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cutoutColor = isDark ? AppColors.darkBackground : const Color(0xFFF8F9FA);

    return SizedBox(
      height: 16,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Dashed Line
          Row(
            children: List.generate(
              20,
              (index) => Expanded(
                child: Container(
                  height: 1,
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05),
                ),
              ),
            ),
          ),
          // Left Cutout
          Positioned(
            left: -8,
            child: Container(
              width: 16,
              height: 16,
              decoration: BoxDecoration(
                color: cutoutColor,
                shape: BoxShape.circle,
                border: Border.all(
                  color: isDark ? AppColors.borderDark : Colors.black.withValues(alpha: 0.05),
                  width: 0.8,
                ),
              ),
            ),
          ),
          // Right Cutout
          Positioned(
            right: -8,
            child: Container(
              width: 16,
              height: 16,
              decoration: BoxDecoration(
                color: cutoutColor,
                shape: BoxShape.circle,
                border: Border.all(
                  color: isDark ? AppColors.borderDark : Colors.black.withValues(alpha: 0.05),
                  width: 0.8,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionSection(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final hasPrice = offer.newPrice != null;

    return Padding(
      padding: const EdgeInsets.fromLTRB(10, 4, 10, 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          if (hasPrice)
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '${offer.newPrice!.toStringAsFixed(0)} ج.م',
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w900,
                      fontSize: 13,
                      height: 1,
                      fontFamily: 'Tajawal',
                    ),
                  ),
                  if (offer.oldPrice != null)
                    Text(
                      'بدل ${offer.oldPrice!.toStringAsFixed(0)}',
                      style: TextStyle(
                        fontSize: 9,
                        color: isDark ? Colors.white24 : Colors.black26,
                        decoration: TextDecoration.lineThrough,
                        fontFamily: 'Tajawal',
                      ),
                    ),
                ],
              ),
            ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Text(
              'استخدم',
              style: TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.w800,
                fontSize: 9.5,
                fontFamily: 'Tajawal',
              ),
            ),
          ),
        ],
      ),
    );
  }
}
