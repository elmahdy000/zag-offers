import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_vendor_app/core/theme/app_colors.dart';
import 'package:zag_offers_vendor_app/core/network/api_client.dart';
import 'package:zag_offers_vendor_app/injection_container.dart';
import 'package:intl/intl.dart';

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
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      final response = await _apiClient.dio.get('/notifications');
      final data = response.data;
      if (!mounted) return;
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
      if (!mounted) return;
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('خطأ في جلب الإشعارات: $e', style: GoogleFonts.cairo()),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _markAsRead(String id) async {
    try {
      await _apiClient.dio.post('/notifications/$id/read');
      if (!mounted) return;
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
      await _apiClient.dio.post('/notifications/read-all');
      if (!mounted) return;
      setState(() {
        for (var n in _notifications) {
          n['isRead'] = true;
        }
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('تم تحديد الكل كمقروء', style: GoogleFonts.cairo()),
          backgroundColor: AppColors.success,
        ),
      );
    } catch (e) {
      debugPrint('Error marking all notifications as read: $e');
    }
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
          if (_notifications.any((n) => n['isRead'] == false))
            IconButton(
              icon: const Icon(Icons.done_all_rounded, color: AppColors.primary),
              tooltip: 'تحديد الكل كمقروء',
              onPressed: _markAllAsRead,
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : RefreshIndicator(
              onRefresh: _fetchNotifications,
              color: AppColors.primary,
              child: _notifications.isEmpty
                  ? _buildEmptyState()
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      itemCount: _notifications.length,
                      itemBuilder: (context, index) {
                        final notification = _notifications[index];
                        final isRead = notification['isRead'] == true;
                        final dateStr = notification['createdAt'] as String?;
                        final date = dateStr != null ? DateTime.tryParse(dateStr) : null;
                        
                        return _buildNotificationCard(notification, isRead, date);
                      },
                    ),
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

  Widget _buildNotificationCard(dynamic notification, bool isRead, DateTime? date) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
        border: !isRead ? Border.all(color: AppColors.primary.withValues(alpha: 0.1), width: 1) : null,
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        onTap: () {
          if (!isRead) {
            _markAsRead(notification['id']);
          }
        },
        leading: Stack(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: isRead ? AppColors.background : AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: ClipOval(
                child: notification['imageUrl'] != null 
                    ? Image.network(
                        notification['imageUrl'],
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Icon(Icons.notifications_rounded, color: isRead ? AppColors.textSecondary : AppColors.primary),
                      )
                    : Icon(Icons.notifications_rounded, color: isRead ? AppColors.textSecondary : AppColors.primary),
              ),
            ),
            if (!isRead)
              Positioned(
                right: 0,
                top: 0,
                child: Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: AppColors.accent,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                ),
              ),
          ],
        ),
        title: Text(
          notification['title'] ?? '',
          style: GoogleFonts.cairo(
            fontWeight: isRead ? FontWeight.w600 : FontWeight.w900,
            fontSize: 15,
            color: isRead ? AppColors.textSecondary : AppColors.textPrimary,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 6),
            Text(
              notification['body'] ?? '',
              style: GoogleFonts.cairo(
                fontSize: 13,
                height: 1.4,
                color: isRead ? AppColors.textSecondary.withValues(alpha: 0.7) : AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            if (date != null)
              Row(
                children: [
                  Icon(Icons.access_time_rounded, size: 12, color: AppColors.textSecondary.withValues(alpha: 0.5)),
                  const SizedBox(width: 4),
                  Text(
                    DateFormat('yyyy/MM/dd - hh:mm a').format(date.toLocal()),
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
