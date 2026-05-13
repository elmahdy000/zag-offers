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
        width: isWide ? null : 280,
        constraints: const BoxConstraints(
          minHeight: 0,
        ),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: Theme.of(context).dividerColor.withValues(alpha: 0.1),
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
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
          aspectRatio: 1.1,
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
              color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.9),
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
                  Container(width: 1, height: 10, color: Theme.of(context).dividerColor),
                  const SizedBox(width: 6),
                ],
                Text(
                  offer.store?.category ?? 'عرض خاص',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w600,
                  ),
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
          CategoryUtils.getIcon(offer.store?.category),
          size: 34,
          color: AppColors.primary.withValues(alpha: 0.45),
        ),
      ),
    );
  }

  Widget _buildDetailsSection(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            offer.title,
            style: textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w800,
              height: 1.1,
              fontSize: 13,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(
                CategoryUtils.getIcon(offer.store?.category),
                size: 13,
                color: AppColors.primary,
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  offer.store?.name ?? '',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: Theme.of(context).textTheme.titleLarge?.color,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
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
                  offer.store?.area ?? '',
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
    );
  }
}
