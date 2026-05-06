import 'package:flutter/material.dart';
import 'package:flutter_iconly/flutter_iconly.dart';

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
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: isWide ? double.infinity : 180,
        margin: EdgeInsets.only(right: isWide ? 0 : 12, bottom: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 16,
              offset: const Offset(0, 8),
            ),
          ],
          border: Border.all(color: Colors.grey[100]!),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildImageHeader(context),
              _buildDetailsSection(context),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImageHeader(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Stack(
      children: [
        AspectRatio(
          aspectRatio: 1.35,
          child: NetworkImageWidget(
            imageUrl: offer.image,
            fit: BoxFit.cover,
          ),
        ),
        Positioned(
          top: 10,
          right: 10,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              offer.discount.isNotEmpty
                  ? offer.discount
                  : '${offer.discountPercentage.toInt()}%',
              style: textTheme.labelSmall?.copyWith(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ),
        ),
        Positioned(
          top: 10,
          left: 10,
          child: FavoriteButton(offerId: offer.id, size: 18),
        ),
        Positioned(
          bottom: 10,
          right: 10,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.95),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if ((offer.images?.length ?? 0) > 1) ...[
                  const Icon(Icons.collections_rounded, size: 12, color: AppColors.primary),
                  const SizedBox(width: 4),
                  Text(
                    '${offer.images!.length}',
                    style: textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w700, color: AppColors.primary),
                  ),
                  const SizedBox(width: 6),
                  Container(width: 1, height: 10, color: Colors.grey[300]),
                  const SizedBox(width: 6),
                ],
                Text(
                  offer.store.category ?? 'عرض',
                  style: textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildImageFallback() {
    return Container(
      color: AppColors.primary.withValues(alpha: 0.08),
      child: Center(
        child: Icon(
          CategoryUtils.getIcon(offer.store.category),
          size: 34,
          color: AppColors.primary.withValues(alpha: 0.45),
        ),
      ),
    );
  }

  Widget _buildDetailsSection(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 10, 12, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              offer.title,
              style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800, height: 1.25),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Icon(
                  CategoryUtils.getIcon(offer.store.category),
                  size: 13,
                  color: AppColors.primary,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    offer.store.name,
                    style: textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w700),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(
                  IconlyLight.location,
                  size: 13,
                  color: AppColors.textSecondary,
                ),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    offer.store.area,
                    style: textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w600),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'انتهاؤه قريبًا',
                  style: textTheme.labelSmall?.copyWith(color: Colors.orange[700], fontWeight: FontWeight.w700),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
