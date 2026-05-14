import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../bloc/notifications_bloc.dart';
import '../../domain/entities/notification_entity.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  @override
  void initState() {
    super.initState();
    context.read<NotificationsBloc>().add(GetNotificationsRequested());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'الإشعارات',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        backgroundColor: AppColors.background,
        elevation: 0,
        actions: [
          BlocBuilder<NotificationsBloc, NotificationsState>(
            builder: (context, state) {
              if (state is NotificationsLoaded && state.notifications.isNotEmpty) {
                return IconButton(
                  icon: const Icon(Icons.done_all_rounded, color: AppColors.primary),
                  tooltip: 'تحديد الكل كمقروء',
                  onPressed: () => context.read<NotificationsBloc>().add(MarkAllAsReadRequested()),
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
      body: BlocBuilder<NotificationsBloc, NotificationsState>(
        builder: (context, state) {
          if (state is NotificationsLoading) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primary));
          } else if (state is NotificationsError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(state.message, style: GoogleFonts.cairo(color: AppColors.error)),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => context.read<NotificationsBloc>().add(GetNotificationsRequested()),
                    child: Text('إعادة المحاولة', style: GoogleFonts.cairo()),
                  ),
                ],
              ),
            );
          } else if (state is NotificationsLoaded) {
            if (state.notifications.isEmpty) {
              return _buildEmptyState();
            }
            return RefreshIndicator(
              onRefresh: () async {
                context.read<NotificationsBloc>().add(GetNotificationsRequested());
              },
              color: AppColors.primary,
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(vertical: 12),
                itemCount: state.notifications.length,
                itemBuilder: (context, index) {
                  return _buildNotificationCard(state.notifications[index]);
                },
              ),
            );
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return ListView(
      children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.2),
        Center(
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.05),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.notifications_none_rounded,
                  size: 80,
                  color: AppColors.primary.withValues(alpha: 0.2),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'لا توجد إشعارات حالياً',
                style: GoogleFonts.cairo(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'سنقوم بتنبيهك عند حدوث أي نشاط جديد',
                style: GoogleFonts.cairo(
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildNotificationCard(NotificationEntity notification) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      decoration: BoxDecoration(
        color: notification.isRead ? AppColors.card.withValues(alpha: 0.6) : AppColors.card,
        borderRadius: BorderRadius.circular(20),
        border: notification.isRead ? null : Border.all(color: AppColors.primary.withValues(alpha: 0.3), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ListTile(
        onTap: () {
          if (!notification.isRead) {
            context.read<NotificationsBloc>().add(MarkNotificationAsReadRequested(notification.id));
          }
        },
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            color: notification.isRead ? Colors.grey.withValues(alpha: 0.1) : AppColors.primary.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(
            notification.isRead ? Icons.notifications_none_rounded : Icons.notifications_active_rounded, 
            color: notification.isRead ? Colors.grey : AppColors.primary
          ),
        ),
        title: Text(
          notification.title,
          style: GoogleFonts.cairo(
            fontWeight: notification.isRead ? FontWeight.bold : FontWeight.w900,
            fontSize: 15,
            color: notification.isRead ? AppColors.textSecondary : AppColors.textPrimary,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 6),
            Text(
              notification.body,
              style: GoogleFonts.cairo(
                fontSize: 13,
                height: 1.4,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.access_time_rounded, size: 12, color: AppColors.textSecondary.withValues(alpha: 0.5)),
                const SizedBox(width: 4),
                Text(
                  DateFormat('yyyy/MM/dd - hh:mm a', 'ar').format(notification.createdAt.toLocal()),
                  style: GoogleFonts.cairo(
                    fontSize: 10,
                    color: AppColors.textSecondary.withValues(alpha: 0.5),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
