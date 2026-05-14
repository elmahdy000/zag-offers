import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../notifications/presentation/bloc/notification_bloc.dart';
import '../../../../core/services/notification_service.dart';

class NotificationsPage extends StatelessWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<NotificationBloc, NotificationState>(
      builder: (context, state) {
        final feedState = state is NotificationFeedState
            ? state
            : NotificationFeedState(items: const []);

        return Scaffold(
          appBar: AppBar(
            title: const Text(
              'الإشعارات',
              style: TextStyle(fontWeight: FontWeight.w900),
            ),
            actions: [
              if (feedState.items.isNotEmpty)
                TextButton(
                  onPressed: () {
                    context.read<NotificationBloc>().add(ClearAllNotifications());
                  },
                  child: const Text(
                    'مسح الكل',
                    style: TextStyle(color: AppColors.error, fontWeight: FontWeight.bold),
                  ),
                ),
              const SizedBox(width: 8),
            ],
          ),
          body: feedState.items.isNotEmpty
              ? ListView.separated(
                  padding: const EdgeInsets.all(20),
                  itemCount: feedState.items.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 16),
                  itemBuilder: (context, index) {
                    final item = feedState.items[index];
                    return _NotificationCard(
                      item: item,
                      onTap: () {
                        if (!item.isRead) {
                          context.read<NotificationBloc>().add(MarkAsRead(item.id));
                        }
                        // إذا كان الإشعار يحتوي على بيانات، يمكننا محاولة التنقل
                        if (item.data != null) {
                          NotificationService.checkPendingNotification(); // Clear any old pending
                          NotificationService.handleNotificationTapFromData(item.data!); 
                        }
                      },
                    );
                  },
                )
              : Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: Theme.of(context).cardColor,
                            shape: BoxShape.circle,
                          ),
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              Icon(
                                Icons.notifications_none_rounded,
                                size: 80,
                                color: Theme.of(context).dividerColor.withValues(alpha: 0.2),
                              ),
                              const Icon(
                                Icons.notifications_off_outlined,
                                size: 40,
                                color: AppColors.textSecondary,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          'لا توجد إشعارات حاليًا',
                          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'عندما تصل تنبيهات جديدة أو رسائل مباشرة ستظهر هنا.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ),
        );
      },
    );
  }

  String _formatRelativeTime(DateTime dateTime) {
    final difference = DateTime.now().difference(dateTime);
    if (difference.inMinutes < 1) return 'الآن';
    if (difference.inMinutes < 60) return 'منذ ${difference.inMinutes} دقيقة';
    if (difference.inHours < 24) return 'منذ ${difference.inHours} ساعة';
    if (difference.inDays < 7) return 'منذ ${difference.inDays} أيام';
    return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
  }
}

class _NotificationCard extends StatelessWidget {
  final NotificationItem item;
  final VoidCallback? onTap;

  const _NotificationCard({
    required this.item,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final categoryInfo = _getCategoryInfo(item);
    
    return Container(
      decoration: BoxDecoration(
        color: item.isRead ? theme.cardColor.withValues(alpha: 0.6) : theme.cardColor,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: item.isRead 
              ? theme.dividerColor.withValues(alpha: 0.08)
              : AppColors.primary.withValues(alpha: 0.2),
          width: 1.5,
        ),
        boxShadow: item.isRead ? null : [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.08),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildLeading(context, categoryInfo),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          if (categoryInfo != null)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: categoryInfo.color.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                categoryInfo.label,
                                style: TextStyle(
                                  color: categoryInfo.color,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          Text(
                            _formatTime(item.createdAt),
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: AppColors.textSecondary.withValues(alpha: 0.5),
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        item.title,
                        style: TextStyle(
                          fontWeight: item.isRead ? FontWeight.bold : FontWeight.w900,
                          fontSize: 15,
                          color: item.isRead ? AppColors.textSecondary : AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.message,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                          fontSize: 13,
                          height: 1.4,
                        ),
                      ),
                      if (item.imageUrl != null) ...[
                        const SizedBox(height: 12),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.network(
                            item.imageUrl!,
                            height: 100,
                            width: double.infinity,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLeading(BuildContext context, _CategoryInfo? info) {
    return Stack(
      children: [
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            color: (info?.color ?? AppColors.primary).withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(18),
          ),
          child: Icon(
            info?.icon ?? (item.isRead ? Icons.notifications_none_rounded : Icons.notifications_active_rounded),
            color: info?.color ?? (item.isRead ? AppColors.textSecondary : AppColors.primary),
            size: 26,
          ),
        ),
        if (!item.isRead)
          Positioned(
            right: 0,
            top: 0,
            child: Container(
              width: 14,
              height: 14,
              decoration: BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2.5),
              ),
            ),
          ),
      ],
    );
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    if (now.day == dateTime.day && now.month == dateTime.month && now.year == dateTime.year) {
      return '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
    }
    return '${dateTime.day}/${dateTime.month}';
  }

  _CategoryInfo? _getCategoryInfo(NotificationItem item) {
    final type = item.type;
    final area = item.data?['area'];
    
    if (type == 'NEW_OFFER' || type == 'OFFER_APPROVED' || type == 'DIGEST_NEW_OFFERS') {
      return _CategoryInfo(
        label: area ?? 'عرض جديد',
        icon: Icons.local_offer_outlined,
        color: Colors.orange,
      );
    }
    
    if (type == 'COUPON_REDEEMED' || type == 'NEW_COUPON' || type == 'COUPON_GENERATED') {
      return _CategoryInfo(
        label: 'كوبونات',
        icon: Icons.confirmation_number_outlined,
        color: Colors.blue,
      );
    }
    
    if (type == 'STORE_APPROVED') {
      return _CategoryInfo(
        label: 'المتجر',
        icon: Icons.storefront_outlined,
        color: Colors.green,
      );
    }

    return null;
  }
}

class _CategoryInfo {
  final String label;
  final IconData icon;
  final Color color;

  _CategoryInfo({required this.label, required this.icon, required this.color});
}
