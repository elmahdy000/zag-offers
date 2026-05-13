import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_admin_app/features/offers/domain/entities/offer.dart';
import 'package:intl/intl.dart';
import 'package:zag_offers_admin_app/core/theme/app_colors.dart';

class OfferCard extends StatelessWidget {
  final Offer offer;

  const OfferCard({super.key, required this.offer});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 15, offset: const Offset(0, 8))],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              if (offer.imageUrl != null && offer.imageUrl!.isNotEmpty)
                Image.network(
                  offer.imageUrl!,
                  height: 180,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Container(
                    height: 180,
                    width: double.infinity,
                    color: AppColors.background,
                    child: const Icon(Icons.image_not_supported_rounded, color: Colors.grey, size: 32),
                  ),
                )
              else
                Container(
                  height: 180,
                  width: double.infinity,
                  color: AppColors.background,
                  child: Icon(Icons.local_offer_rounded, color: AppColors.primary.withValues(alpha: 0.2), size: 48),
                ),
              Positioned(
                top: 12,
                right: 12,
                child: _buildStatusBadge(offer.status),
              ),
              if (offer.images.length > 1)
                Positioned(
                  bottom: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.6), borderRadius: BorderRadius.circular(8)),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.collections_rounded, color: Colors.white, size: 12),
                        const SizedBox(width: 4),
                        Text('${offer.images.length}', style: GoogleFonts.inter(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(offer.title, style: GoogleFonts.cairo(fontWeight: FontWeight.w900, fontSize: 17, color: AppColors.textPrimary, height: 1.2)),
                          const SizedBox(height: 4),
                          Text(offer.storeName, style: GoogleFonts.cairo(color: AppColors.primary, fontSize: 13, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    if (offer.newPrice != null) ...[
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text('${offer.newPrice} ج.م', style: GoogleFonts.inter(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.w900)),
                          if (offer.oldPrice != null)
                            Text('${offer.oldPrice}', style: GoogleFonts.inter(color: AppColors.textSecondary.withValues(alpha: 0.5), fontSize: 13, decoration: TextDecoration.lineThrough)),
                        ],
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 12),
                Text(offer.description, maxLines: 2, overflow: TextOverflow.ellipsis, style: GoogleFonts.cairo(color: AppColors.textSecondary, fontSize: 13, height: 1.5)),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(12)),
                  child: Row(
                    children: [
                      Icon(Icons.calendar_today_rounded, size: 14, color: AppColors.textSecondary.withValues(alpha: 0.7)),
                      const SizedBox(width: 8),
                      Text('ينتهي: ${DateFormat('yyyy/MM/dd', 'ar').format(offer.endDate)}', style: GoogleFonts.cairo(color: AppColors.textSecondary, fontSize: 11, fontWeight: FontWeight.w600)),
                      const Spacer(),
                      Text('#${offer.id.substring(0, 6).toUpperCase()}', style: GoogleFonts.inter(color: AppColors.textSecondary.withValues(alpha: 0.4), fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    String label;

    switch (status) {
      case 'ACTIVE':
      case 'APPROVED':
        color = AppColors.success;
        label = status == 'ACTIVE' ? 'نشط' : 'مقبول';
        break;
      case 'PENDING':
        color = AppColors.primary;
        label = 'قيد الانتظار';
        break;
      case 'REJECTED':
        color = AppColors.error;
        label = 'مرفوض';
        break;
      case 'EXPIRED':
        color = AppColors.textSecondary;
        label = 'منتهي';
        break;
      default:
        color = AppColors.primary;
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), boxShadow: [BoxShadow(color: color.withValues(alpha: 0.2), blurRadius: 8, offset: const Offset(0, 4))]),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(width: 6, height: 6, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 8),
          Text(label, style: GoogleFonts.cairo(color: color, fontSize: 11, fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }
}
