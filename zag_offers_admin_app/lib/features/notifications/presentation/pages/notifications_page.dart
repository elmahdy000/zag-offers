import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_admin_app/core/network/api_client.dart';
import 'package:zag_offers_admin_app/injection_container.dart';
import 'package:intl/intl.dart';
import 'package:zag_offers_admin_app/core/theme/app_colors.dart';
import 'package:zag_offers_admin_app/core/utils/image_url_helper.dart';
import 'package:zag_offers_admin_app/core/utils/snackbar_utils.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  final ApiClient _apiClient = sl<ApiClient>();
  List<dynamic> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
  }

  Future<void> _fetchNotifications() async {
    setState(() => _isLoading = true);
    try {
      final response = await _apiClient.get('/notifications');
      final data = response.data;
      setState(() {
        if (data is List) {
          _notifications = List<dynamic>.from(data);
        } else if (data is Map && data['items'] is List) {
          _notifications = List<dynamic>.from(data['items'] as List);
        } else {
          _notifications = [];
        }
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        SnackBarUtils.showError(context, 'خطأ في جلب الإشعارات: $e');
      }
    }
  }

  Future<void> _markAsRead(String id) async {
    try {
      await _apiClient.post('/notifications/$id/read');
      setState(() {
        final index = _notifications.indexWhere((n) => n['id'] == id);
        if (index != -1) {
          _notifications[index]['isRead'] = true;
        }
      });
    } catch (e) {
      debugPrint('Error marking notification as read: $e');
    }
  }

  Future<void> _markAllAsRead() async {
    try {
      await _apiClient.post('/notifications/read-all');
      setState(() {
        for (var n in _notifications) {
          n['isRead'] = true;
        }
      });
    } catch (e) {
      debugPrint('Error marking all notifications as read: $e');
    }
  }

  Future<void> _deleteNotification(String id) async {
    try {
      await _apiClient.delete('/notifications/$id');
      setState(() {
        _notifications.removeWhere((n) => n['id'] == id);
      });
    } catch (e) {
      debugPrint('Error deleting notification: $e');
    }
  }

  Future<void> _deleteAllNotifications() async {
    try {
      await _apiClient.delete('/notifications/clear-all');
      setState(() => _notifications.clear());
    } catch (e) {
      debugPrint('Error deleting all notifications: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          _notifications.isEmpty
              ? 'الإشعارات'
              : 'الإشعارات (${_notifications.where((n) => n['isRead'] != true).length})',
        ),
        actions: [
          if (_notifications.isNotEmpty) ...[
            IconButton(
              icon: const Icon(Icons.done_all_rounded, color: AppColors.primary),
              tooltip: 'تحديد الكل كمقروء',
              onPressed: _markAllAsRead,
            ),
            IconButton(
              icon: const Icon(Icons.delete_sweep_rounded, color: AppColors.error),
              tooltip: 'حذف الكل',
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: Text('حذف الإشعارات', style: GoogleFonts.cairo()),
                    content: Text('هل أنت متأكد من حذف جميع الإشعارات؟', style: GoogleFonts.cairo()),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx),
                        child: Text('إلغاء', style: GoogleFonts.cairo()),
                      ),
                      TextButton(
                        onPressed: () {
                          Navigator.pop(ctx);
                          _deleteAllNotifications();
                        },
                        child: Text('حذف الكل', style: GoogleFonts.cairo(color: AppColors.error)),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchNotifications,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _notifications.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.notifications_none_rounded, size: 64, color: AppColors.textSecondary.withValues(alpha: 0.2)),
                        const SizedBox(height: 16),
                        Text('لا توجد إشعارات حالياً', style: GoogleFonts.cairo(fontSize: 16, color: AppColors.textSecondary)),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    itemCount: _notifications.length,
                    itemBuilder: (context, index) {
                      final notification = _notifications[index];
                      final isRead = notification['isRead'] == true;
                      final date = DateTime.tryParse(notification['createdAt'] ?? '');
                      
                      return Dismissible(
                        key: ValueKey(notification['id']),
                        direction: DismissDirection.endToStart,
                        confirmDismiss: (direction) async {
                          return await showDialog(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: Text('حذف الإشعار', style: GoogleFonts.cairo()),
                              content: Text('هل أنت متأكد من حذف هذا الإشعار؟', style: GoogleFonts.cairo()),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.pop(ctx, false),
                                  child: Text('إلغاء', style: GoogleFonts.cairo()),
                                ),
                                TextButton(
                                  onPressed: () => Navigator.pop(ctx, true),
                                  child: Text('حذف', style: GoogleFonts.cairo(color: AppColors.error)),
                                ),
                              ],
                            ),
                          );
                        },
                        onDismissed: (_) => _deleteNotification(notification['id']),
                        background: Container(
                          decoration: BoxDecoration(
                            color: AppColors.error,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 24),
                          child: const Icon(Icons.delete_rounded, color: Colors.white, size: 28),
                        ),
                        child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                        decoration: BoxDecoration(
                          color: isRead ? AppColors.white.withValues(alpha: 0.6) : AppColors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            if (!isRead) BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4))
                          ],
                          border: Border.all(color: isRead ? Colors.transparent : Colors.grey.shade100),
                        ),
                        child: ListTile(
                          onTap: () {
                            if (!isRead) _markAsRead(notification['id']);
                          },
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          leading: Stack(
                            children: [
                              CircleAvatar(
                                radius: 24,
                                backgroundColor: isRead ? Colors.grey.shade100 : AppColors.primary.withValues(alpha: 0.1),
                                backgroundImage: notification['imageUrl'] != null
                                    ? NetworkImage(ImageUrlHelper.resolve(notification['imageUrl']))
                                    : null,
                                child: notification['imageUrl'] == null ? Icon(Icons.notifications_rounded, color: isRead ? Colors.grey : AppColors.primary) : null,
                              ),
                              if (!isRead)
                                Positioned(
                                  right: 0,
                                  top: 0,
                                  child: Container(width: 12, height: 12, decoration: BoxDecoration(color: AppColors.primary, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2))),
                                ),
                            ],
                          ),
                          title: Text(
                            notification['title'] ?? '',
                            style: GoogleFonts.cairo(fontWeight: isRead ? FontWeight.bold : FontWeight.w900, fontSize: 14, color: isRead ? AppColors.textSecondary : AppColors.textPrimary),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 4),
                              Text(notification['body'] ?? '', style: GoogleFonts.cairo(fontSize: 13, color: AppColors.textSecondary, height: 1.4)),
                              const SizedBox(height: 8),
                              if (date != null)
                                Row(
                                  children: [
                                    Icon(Icons.access_time_rounded, size: 12, color: AppColors.textSecondary.withValues(alpha: 0.5)),
                                    const SizedBox(width: 4),
                                    Text(DateFormat('yyyy/MM/dd - hh:mm a', 'ar').format(date.toLocal()), style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary.withValues(alpha: 0.6))),
                                  ],
                                ),
                            ],
                          ),
                        ),
                      ),
                    );
                    },
                  ),
      ),
    );
  }
}
