import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_admin_app/features/offers/domain/entities/offer.dart';
import 'package:intl/intl.dart';

class OfferCard extends StatelessWidget {
  final Offer offer;

  const OfferCard({super.key, required this.offer});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: Colors.blueGrey[100]!.withValues(alpha: 0.5)),
      ),
      clipBehavior: Clip.antiAlias,
      elevation: 0,
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              if (offer.imageUrl != null && offer.imageUrl!.isNotEmpty)
                Image.network(
                  offer.imageUrl!,
                  height: 150,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Container(
                    height: 150,
                    color: Colors.orange[50],
                    child: Icon(
                      Icons.image_not_supported,
                      color: Colors.orange[200],
                    ),
                  ),
                ),
              if (offer.images.length > 1)
                Positioned(
                  top: 10,
                  right: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.collections_rounded, color: Colors.white, size: 12),
                        const SizedBox(width: 4),
                        Text(
                          '${offer.images.length}',
                          style: GoogleFonts.inter(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        offer.title,
                        style: GoogleFonts.cairo(
                          fontWeight: FontWeight.bold,
                          fontSize: 17,
                        ),
                      ),
                    ),
                    _buildStatusBadge(offer.status),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text(
                      offer.storeName,
                      style: GoogleFonts.cairo(
                        color: Colors.orange[800],
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const Spacer(),
                    if (offer.newPrice != null) ...[
                      Text(
                        '${offer.newPrice} ج.م',
                        style: GoogleFonts.inter(
                          color: Colors.blue[800],
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (offer.oldPrice != null) ...[
                        const SizedBox(width: 8),
                        Text(
                          '${offer.oldPrice}',
                          style: GoogleFonts.inter(
                            color: Colors.grey[400],
                            fontSize: 12,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      ],
                    ],
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  offer.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    color: Colors.blueGrey[600],
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(
                      Icons.date_range_outlined,
                      size: 14,
                      color: Colors.blueGrey[400],
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'ينتهي: ${DateFormat('yyyy/MM/dd', 'ar').format(offer.endDate)}',
                      style: GoogleFonts.inter(
                        color: Colors.blueGrey[400],
                        fontSize: 12,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '#${offer.id.substring(0, 6)}',
                      style: GoogleFonts.inter(
                        color: Colors.blueGrey[400],
                        fontSize: 11,
                      ),
                    ),
                  ],
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
    Color bgColor;
    String label;

    switch (status) {
      case 'ACTIVE':
        color = Colors.green[700]!;
        bgColor = Colors.green[50]!;
        label = 'نشط';
        break;
      case 'APPROVED':
        color = Colors.teal[700]!;
        bgColor = Colors.teal[50]!;
        label = 'مقبول';
        break;
      case 'PENDING':
        color = Colors.orange[700]!;
        bgColor = Colors.orange[50]!;
        label = 'قيد الانتظار';
        break;
      case 'REJECTED':
        color = Colors.red[700]!;
        bgColor = Colors.red[50]!;
        label = 'مرفوض';
        break;
      case 'EXPIRED':
        color = Colors.blueGrey[700]!;
        bgColor = Colors.blueGrey[100]!;
        label = 'منتهي';
        break;
      default:
        color = Colors.orange[700]!;
        bgColor = Colors.orange[50]!;
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: GoogleFonts.inter(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
