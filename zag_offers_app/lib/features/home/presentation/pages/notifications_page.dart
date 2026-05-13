import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../notifications/presentation/bloc/notification_bloc.dart';

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
                      title: item.title,
                      subtitle: item.message,
                      trailing: _formatRelativeTime(item.createdAt),
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
    if (difference.inHours < 1) return 'منذ ${difference.inMinutes} د';
    if (difference.inDays < 1) return 'منذ ${difference.inHours} س';
    return 'منذ ${difference.inDays} يوم';
  }
}

class _NotificationCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String trailing;

  const _NotificationCard({
    required this.title,
    required this.subtitle,
    required this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: theme.dividerColor.withValues(alpha: 0.1)),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.notifications_active_rounded,
            color: AppColors.primary,
            size: 24,
          ),
        ),
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text(
            subtitle,
            style: theme.textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                  fontSize: 13,
                  height: 1.4,
                ),
          ),
        ),
        trailing: Text(
          trailing,
          style: theme.textTheme.labelSmall?.copyWith(
                fontSize: 10,
                color: AppColors.textSecondary,
              ),
        ),
      ),
    );
  }
}
