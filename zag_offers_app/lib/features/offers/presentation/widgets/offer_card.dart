import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/widgets/bouncy_tap.dart';
import '../../../../core/widgets/network_image_widget.dart';
import '../../domain/entities/offer_entity.dart';
import '../utils/offer_pricing_utils.dart';
import 'favorite_button.dart';
import 'flash_sale_badge.dart';

class OfferCard extends StatelessWidget {
  final OfferEntity offer;
  final VoidCallback? onTap;
  final bool isWide;
  final String? heroTag;

  // Strict Brand Colors (Solid Flat Colors - Zero Gradients)
  static const Color _primaryOrange = Color(0xFFFF5A0A);
  static const Color _darkNavy = Color(0xFF142033);
  static const Color _secondaryText = Color(0xFF718096);
  static const Color _cardDark = Color(0xFF162032);
  static const Color _borderLight = Color(0xFFE2E8F0);
  static const Color _verifiedBlue = Color(0xFF0284C7);

  const OfferCard({
    super.key,
    required this.offer,
    this.onTap,
    this.isWide = false,
    this.heroTag,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final pricing = OfferPricingResult.fromOffer(offer);

    return BouncyTap(
      onTap: onTap,
      scaleFactor: 0.975,
      child: Container(
        width: isWide ? null : 275,
        margin: isWide ? EdgeInsets.zero : const EdgeInsets.symmetric(vertical: 4, horizontal: 4),
        decoration: BoxDecoration(
          color: isDark ? _cardDark : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? Colors.white.withValues(alpha: 0.08) : _borderLight,
            width: 0.8,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildImageSection(context, isDark, pricing),
            _buildInfoSection(context, isDark),
            _buildDivider(isDark),
            _buildActionSection(context, isDark, pricing),
          ],
        ),
      ),
    );
  }

  Widget _buildImageSection(
    BuildContext context,
    bool isDark,
    OfferPricingResult pricing,
  ) {
    final hasImage = offer.image != null && offer.image!.trim().isNotEmpty;
    final initial = offer.store.name.trim().isNotEmpty
        ? offer.store.name.trim().characters.first
        : 'م';

    return AspectRatio(
      aspectRatio: 2.1,
      child: Stack(
        fit: StackFit.expand,
        children: [
          Hero(
            tag: heroTag ?? 'offer_image_${offer.id}',
            child: hasImage
                ? NetworkImageWidget(
                    imageUrl: offer.image,
                    fit: BoxFit.cover,
                  )
                : Container(
                    color: isDark ? const Color(0xFF1E293B) : const Color(0xFFFFF3EC),
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF162032) : Colors.white,
                              shape: BoxShape.circle,
                              border: Border.all(color: _primaryOrange, width: 1.5),
                            ),
                            child: Center(
                              child: Text(
                                initial,
                                style: GoogleFonts.cairo(
                                  color: _primaryOrange,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 20,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            offer.store.name,
                            style: GoogleFonts.cairo(
                              color: _primaryOrange,
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
          ),

          // Solid Primary Orange Discount Badge (NO Gradients)
          if (pricing.topDiscountBadge.isNotEmpty)
            PositionedDirectional(
              top: 8,
              start: 8,
              child: _buildDiscountBadge(pricing.topDiscountBadge),
            ),

          // Clean Circular Favorite Button
          PositionedDirectional(
            top: 8,
            end: 8,
            child: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: isDark
                    ? _cardDark.withValues(alpha: 0.88)
                    : Colors.white.withValues(alpha: 0.92),
                shape: BoxShape.circle,
                border: Border.all(
                  color: isDark ? Colors.white.withValues(alpha: 0.12) : _borderLight,
                  width: 0.8,
                ),
              ),
              child: Center(
                child: FavoriteButton(offerId: offer.id, size: 16),
              ),
            ),
          ),

          // Flash Sale Tag (Solid Amber/Red)
          if (offer.isFlashSale && offer.flashSaleEndsAt != null)
            PositionedDirectional(
              bottom: 8,
              start: 8,
              child: FlashSaleBadge(endsAt: offer.flashSaleEndsAt!),
            ),
        ],
      ),
    );
  }

  // Solid Egyptian Orange Discount Badge
  Widget _buildDiscountBadge(String badgeText) {
    final cleanText = badgeText.contains('%') ? badgeText : '$badgeText%';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7.5, vertical: 3.5),
      decoration: BoxDecoration(
        color: _primaryOrange,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        'خصم $cleanText',
        style: GoogleFonts.cairo(
          color: Colors.white,
          fontWeight: FontWeight.w900,
          fontSize: 10.5,
          height: 1.15,
        ),
      ),
    );
  }

  Widget _buildInfoSection(BuildContext context, bool isDark) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // 1. Store Info Row
          Row(
            children: [
              Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFFFF3EC),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    offer.store.name.trim().isNotEmpty
                        ? offer.store.name.trim().characters.first
                        : 'م',
                    style: GoogleFonts.cairo(
                      color: _primaryOrange,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 5),
              Flexible(
                child: Text(
                  offer.store.name,
                  style: GoogleFonts.cairo(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : _darkNavy,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 3),
              const Icon(
                Icons.verified_rounded,
                size: 12,
                color: _verifiedBlue,
              ),
              if (offer.store.rating > 0) ...[
                const Spacer(),
                const Icon(Icons.star_rounded, size: 12.5, color: Color(0xFFF59E0B)),
                const SizedBox(width: 2),
                Text(
                  offer.store.rating.toStringAsFixed(1),
                  style: GoogleFonts.cairo(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.grey.shade300 : const Color(0xFF92400E),
                  ),
                ),
              ],
            ],
          ),

          const SizedBox(height: 5),

          // 2. Offer Title
          Text(
            offer.title,
            style: GoogleFonts.cairo(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              height: 1.25,
              color: isDark ? Colors.white : _darkNavy,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),

          const SizedBox(height: 5),

          // 3. Location, Category & Live Stats
          Row(
            children: [
              Icon(
                Icons.location_on_outlined,
                size: 11,
                color: _secondaryText,
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
                    color: _secondaryText,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 6),
              ..._buildLiveStats(isDark),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDivider(bool isDark) {
    return Container(
      height: 0.8,
      color: isDark ? Colors.white.withValues(alpha: 0.06) : const Color(0xFFF1F5F9),
      margin: const EdgeInsets.symmetric(horizontal: 12),
    );
  }

  Widget _buildActionSection(
    BuildContext context,
    bool isDark,
    OfferPricingResult pricing,
  ) {
    final bool isSoldOut = offer.usageLimit != null &&
        offer.usageLimit! > 0 &&
        (offer.usageLimit! - offer.usedCoupons) <= 0;

    final hasPrice = pricing.hasExplicitPrices && pricing.finalPrice != null;

    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Pricing Breakdown (Mathematical, RTL compliant)
          if (hasPrice)
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (pricing.originalPrice != null && pricing.hasSavings)
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      textDirection: TextDirection.rtl,
                      children: [
                        Text(
                          pricing.originalPrice!.toStringAsFixed(0),
                          style: GoogleFonts.cairo(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w700,
                            color: _secondaryText,
                            decoration: TextDecoration.lineThrough,
                            decorationColor: _secondaryText,
                            height: 1.1,
                          ),
                        ),
                        const SizedBox(width: 2),
                        Text(
                          'ج.م',
                          style: GoogleFonts.cairo(
                            fontSize: 9,
                            fontWeight: FontWeight.w600,
                            color: _secondaryText,
                            decoration: TextDecoration.lineThrough,
                            decorationColor: _secondaryText,
                            height: 1.1,
                          ),
                        ),
                      ],
                    ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    textDirection: TextDirection.rtl,
                    children: [
                      Text(
                        pricing.finalPrice!.toStringAsFixed(0),
                        style: GoogleFonts.cairo(
                          color: _primaryOrange,
                          fontWeight: FontWeight.w900,
                          fontSize: 15.5,
                          height: 1.1,
                        ),
                      ),
                      const SizedBox(width: 2.5),
                      Text(
                        'ج.م',
                        style: GoogleFonts.cairo(
                          color: _primaryOrange,
                          fontWeight: FontWeight.w800,
                          fontSize: 10.5,
                          height: 1.1,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            )
          else
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'خصم عام',
                    style: GoogleFonts.cairo(
                      fontSize: 9.5,
                      fontWeight: FontWeight.w700,
                      color: _secondaryText,
                      height: 1.1,
                    ),
                  ),
                  Text(
                    pricing.topDiscountBadge.isNotEmpty
                        ? '${pricing.topDiscountBadge} على الفاتورة'
                        : 'عرض حصري بالكوبون',
                    style: GoogleFonts.cairo(
                      color: _primaryOrange,
                      fontWeight: FontWeight.w800,
                      fontSize: 11.5,
                      height: 1.1,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),

          const SizedBox(width: 8),

          // Action Button (Solid Egyptian Orange - NO Gradients)
          isSoldOut
              ? Container(
                  height: 32,
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isDark ? Colors.white.withValues(alpha: 0.08) : _borderLight,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.do_not_disturb_on_rounded,
                        size: 11,
                        color: isDark ? Colors.white54 : _secondaryText,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'نفد الكوبون',
                        style: GoogleFonts.cairo(
                          color: isDark ? Colors.white54 : _secondaryText,
                          fontWeight: FontWeight.w800,
                          fontSize: 10.5,
                          height: 1.1,
                        ),
                      ),
                    ],
                  ),
                )
              : Container(
                  height: 32,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: _primaryOrange,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'احصل عليه',
                        style: GoogleFonts.cairo(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 11,
                          height: 1.1,
                        ),
                      ),
                      const SizedBox(width: 3.5),
                      Icon(
                        Directionality.of(context) == TextDirection.rtl
                            ? Icons.arrow_back_ios_new_rounded
                            : Icons.arrow_forward_ios_rounded,
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
      if (remaining <= 0) {
        return [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
            decoration: BoxDecoration(
              color: const Color(0xFFFEE2E2),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.do_not_disturb_on_rounded,
                  size: 9,
                  color: Color(0xFFDC2626),
                ),
                const SizedBox(width: 2.5),
                Text(
                  'نفدت الكمية',
                  style: GoogleFonts.cairo(
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFFDC2626),
                    height: 1.1,
                  ),
                ),
              ],
            ),
          ),
        ];
      }

      final isCritical = remaining <= 5;
      return [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
          decoration: BoxDecoration(
            color: isCritical ? const Color(0xFFFEE2E2) : const Color(0xFFFFF3EC),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.hourglass_bottom_rounded,
                size: 9,
                color: isCritical ? const Color(0xFFDC2626) : _primaryOrange,
              ),
              const SizedBox(width: 2.5),
              Text(
                'باقي $remaining',
                style: GoogleFonts.cairo(
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                  color: isCritical ? const Color(0xFFDC2626) : _primaryOrange,
                  height: 1.1,
                ),
              ),
            ],
          ),
        ),
      ];
    }

    if (offer.viewCount > 0) {
      final formattedCount = offer.viewCount >= 1000
          ? '${(offer.viewCount / 1000).toStringAsFixed(1)}k'
          : offer.viewCount.toString();

      return [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
          decoration: BoxDecoration(
            color: const Color(0xFFFFF3EC),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.local_fire_department_rounded,
                size: 10,
                color: _primaryOrange,
              ),
              const SizedBox(width: 2.5),
              Text(
                '$formattedCount مهتم',
                style: GoogleFonts.cairo(
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                  color: _primaryOrange,
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
        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF3EC),
          borderRadius: BorderRadius.circular(4),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.auto_awesome_rounded,
              size: 9.5,
              color: _primaryOrange,
            ),
            const SizedBox(width: 2.5),
            Text(
              'جديد ✨',
              style: GoogleFonts.cairo(
                fontSize: 9,
                fontWeight: FontWeight.w800,
                color: _primaryOrange,
                height: 1.1,
              ),
            ),
          ],
        ),
      ),
    ];
  }
}
