import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_admin_app/features/merchants/domain/entities/merchant.dart';
import 'package:intl/intl.dart';

class MerchantCard extends StatelessWidget {
  final Merchant merchant;
  final VoidCallback? onTap;

  const MerchantCard({super.key, required this.merchant, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.blueGrey[100]!.withValues(alpha: 0.5)),
      ),
      elevation: 0,
      color: Colors.white,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: Colors.orange[50],
                  borderRadius: BorderRadius.circular(12),
                  image:
                      (merchant.logoUrl != null && merchant.logoUrl!.isNotEmpty)
                      ? DecorationImage(
                          image: NetworkImage(merchant.logoUrl!),
                          fit: BoxFit.cover,
                        )
                      : null,
                ),
                child: (merchant.logoUrl == null || merchant.logoUrl!.isEmpty)
                    ? Icon(Icons.store, color: Colors.orange[300], size: 32)
                    : null,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      merchant.storeName,
                      style: GoogleFonts.cairo(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      merchant.ownerName,
                      style: GoogleFonts.inter(
                        color: Colors.blueGrey[500],
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(
                          Icons.calendar_today,
                          size: 12,
                          color: Colors.blueGrey[400],
                        ),
                        const SizedBox(width: 4),
                        Text(
                          DateFormat('MMM dd, yyyy').format(merchant.createdAt),
                          style: GoogleFonts.inter(
                            color: Colors.blueGrey[400],
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              _buildStatusBadge(merchant.status),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    Color bgColor;

    switch (status) {
      case 'APPROVED':
        color = Colors.green[700]!;
        bgColor = Colors.green[50]!;
        break;
      case 'REJECTED':
        color = Colors.red[700]!;
        bgColor = Colors.red[50]!;
        break;
      default:
        color = Colors.orange[700]!;
        bgColor = Colors.orange[50]!;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status,
        style: GoogleFonts.inter(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
