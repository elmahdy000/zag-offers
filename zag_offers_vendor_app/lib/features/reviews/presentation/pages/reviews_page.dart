import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_vendor_app/core/theme/app_colors.dart';
import 'package:zag_offers_vendor_app/core/utils/snackbar_utils.dart';
import 'package:zag_offers_vendor_app/features/reviews/presentation/bloc/reviews_bloc.dart';
import 'package:zag_offers_vendor_app/injection_container.dart' as di;

class ReviewsPage extends StatefulWidget {
  final String storeId;

  const ReviewsPage({super.key, required this.storeId});

  @override
  State<ReviewsPage> createState() => _ReviewsPageState();
}

class _ReviewsPageState extends State<ReviewsPage> {
  static final _cairoBold = GoogleFonts.cairo(fontWeight: FontWeight.bold);
  static final _cairoDefault = GoogleFonts.cairo();
  static final _cairoWhiteBold = GoogleFonts.cairo(color: Colors.white, fontWeight: FontWeight.bold);
  static final _cairoWhite = GoogleFonts.cairo(color: Colors.white);
  static final _cairoTextSecondary = GoogleFonts.cairo(color: AppColors.textSecondary);
  static final _cairoBold14White = GoogleFonts.cairo(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14);
  static final _cairoTextDimmerSize11 = GoogleFonts.cairo(color: AppColors.textDimmer, fontSize: 11);
  static final _cairoTextSecondarySize13 = GoogleFonts.cairo(color: AppColors.textSecondary, fontSize: 13);
  static final _cairoPrimaryBoldSize12 = GoogleFonts.cairo(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 12);
  static final _cairoWhite70Size13 = GoogleFonts.cairo(color: Colors.white70, fontSize: 13);
  static final _cairoPrimaryBoldSize16 = GoogleFonts.cairo(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 16);
  static final _cairoTextSecondarySize16 = GoogleFonts.cairo(color: AppColors.textSecondary, fontSize: 16);

  @override
  void initState() {
    super.initState();
    context.read<ReviewsBloc>().add(GetReviewsRequested(widget.storeId));
  }

  Future<void> _showReplyDialog(String reviewId) async {
    final controller = TextEditingController();
    final reply = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: Text('إضافة رد', style: _cairoWhiteBold),
        content: TextField(
          controller: controller,
          maxLines: 3,
          decoration: InputDecoration(
            hintText: 'اكتب ردك هنا...',
            hintStyle: TextStyle(color: AppColors.textSecondary),
            filled: true,
            fillColor: AppColors.card,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
          ),
          style: _cairoWhite,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('إلغاء', style: _cairoDefault),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            onPressed: () => Navigator.pop(ctx, controller.text.trim()),
            child: Text('إرسال', style: _cairoWhite),
          ),
        ],
      ),
    );

    if (reply != null && reply.isNotEmpty) {
      if (!mounted) return;
      context.read<ReviewsBloc>().add(AddReplyRequested(reviewId, reply));
      SnackBarUtils.showSuccess(context, 'تم إضافة الرد بنجاح');
      context.read<ReviewsBloc>().add(GetReviewsRequested(widget.storeId));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('التقييمات', style: _cairoWhiteBold),
        backgroundColor: AppColors.background,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: BlocBuilder<ReviewsBloc, ReviewsState>(
        buildWhen: (prev, next) => next is ReviewsLoading || next is ReviewsLoaded || next is ReviewsError,
        builder: (context, state) {
          if (state is ReviewsLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state is ReviewsError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, color: AppColors.error, size: 48),
                  const SizedBox(height: 16),
                  Text('حدث خطأ أثناء تحميل التقييمات', style: _cairoTextSecondary),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => context.read<ReviewsBloc>().add(GetReviewsRequested(widget.storeId)),
                    child: Text('إعادة المحاولة', style: _cairoDefault),
                  ),
                ],
              ),
            );
          }

          final reviews = state is ReviewsLoaded ? state.reviews : <dynamic>[];

          if (reviews.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.star_border, color: AppColors.textDimmer, size: 64),
                  const SizedBox(height: 16),
                  Text('لا توجد تقييمات بعد', style: _cairoTextSecondarySize16),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => context.read<ReviewsBloc>().add(GetReviewsRequested(widget.storeId)),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: reviews.length,
              itemBuilder: (context, index) => _buildReviewCard(reviews[index]),
            ),
          );
        },
      ),
    );
  }

  Widget _buildReviewCard(review) {
    final date = _formatDate(review.createdAt);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _buildAvatar(review.customerName, review.customerAvatar),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(review.customerName, style: _cairoBold14White),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        ...List.generate(5, (i) {
                          return Icon(
                            i < review.rating ? Icons.star_rounded : Icons.star_border_rounded,
                            color: Colors.amber, size: 18,
                          );
                        }),
                        const SizedBox(width: 8),
                        Text(date, style: _cairoTextDimmerSize11),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (review.comment != null && review.comment!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(review.comment!, style: _cairoTextSecondarySize13),
          ],
          if (review.merchantReply != null && review.merchantReply!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('رد التاجر:', style: _cairoPrimaryBoldSize12),
                  const SizedBox(height: 4),
                  Text(review.merchantReply!, style: _cairoWhite70Size13),
                ],
              ),
            ),
          ] else ...[
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                onPressed: () => _showReplyDialog(review.id),
                icon: const Icon(Icons.reply_rounded, size: 18),
                label: Text('رد', style: _cairoBold),
                style: TextButton.styleFrom(foregroundColor: AppColors.primary),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAvatar(String name, String? avatarUrl) {
    if (avatarUrl != null && avatarUrl.isNotEmpty) {
      return CircleAvatar(
        radius: 20,
        backgroundImage: NetworkImage(avatarUrl),
      );
    }
    return CircleAvatar(
      radius: 20,
      backgroundColor: AppColors.primary.withValues(alpha: 0.2),
      child: Text(
        name.isNotEmpty ? name[0].toUpperCase() : '?',
        style: _cairoPrimaryBoldSize16,
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final dt = DateTime.parse(dateStr);
      const months = [
        '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
      ];
      return '${dt.day} ${months[dt.month]} ${dt.year}';
    } catch (_) {
      return dateStr;
    }
  }
}
