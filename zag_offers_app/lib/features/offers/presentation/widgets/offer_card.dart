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
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Container(
          width: isWide ? null : 280,
          clipBehavior: Clip.hardEdge,
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
          child: isWide
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: _buildImageHeader(context),
                    ),
                    Flexible(
                      flex: 0,
                      child: _buildDetailsSection(context),
                    ),
                  ],
                )
              : Column(
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
    
    final imageWidget = isWide
        ? SizedBox.expand(
            child: NetworkImageWidget(
              imageUrl: offer.image,
              fit: BoxFit.cover,
            ),
          )
        : AspectRatio(
            aspectRatio: 1.1,
            child: NetworkImageWidget(
              imageUrl: offer.image,
              fit: BoxFit.cover,
            ),
          );
    
    return Stack(
      children: [
        imageWidget,
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
              style: textTheme.labelMedium?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w900,
              ),
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
                  offer.store.category ?? 'عرض خاص',
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

  Widget _buildDetailsSection(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            offer.title,
            style: textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w900,
              height: 1.2,
              fontSize: 15,
              letterSpacing: -0.2,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
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
                  style: textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (offer.newPrice != null)
            Row(
              children: [
                Text(
                  '${offer.newPrice!.toStringAsFixed(0)} ج.م',
                  style: textTheme.titleLarge?.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w900,
                    fontSize: 18,
                  ),
                ),
                const SizedBox(width: 8),
                if (offer.oldPrice != null)
                  Text(
                    '${offer.oldPrice!.toStringAsFixed(0)} ج.م',
                    style: textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary.withValues(alpha: 0.6),
                      decoration: TextDecoration.lineThrough,
                      fontSize: 11,
                    ),
                  ),
              ],
            ),
        ],
      ),
    );
  }
}
