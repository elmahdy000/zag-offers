import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_admin_app/core/network/api_client.dart';
import 'package:zag_offers_admin_app/injection_container.dart';
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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('خطأ في جلب الإشعارات: $e')),
        );
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'الإشعارات',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all),
            tooltip: 'تحديد الكل كمقروء',
            onPressed: _markAllAsRead,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty
              ? Center(
                  child: Text(
                    'لا توجد إشعارات',
                    style: GoogleFonts.cairo(fontSize: 16),
                  ),
                )
              : ListView.builder(
                  itemCount: _notifications.length,
                  itemBuilder: (context, index) {
                    final notification = _notifications[index];
                    final isRead = notification['isRead'] == true;
                    final date = DateTime.tryParse(notification['createdAt'] ?? '');
                    
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      elevation: isRead ? 0 : 2,
                      color: isRead ? Colors.grey.shade50 : Colors.white,
                      child: ListTile(
                        onTap: () {
                          if (!isRead) {
                            _markAsRead(notification['id']);
                          }
                          // Add navigation logic based on notification type if needed
                        },
                        leading: CircleAvatar(
                          backgroundColor: isRead ? Colors.grey.shade200 : Colors.indigo.withValues(alpha: 0.1),
                          backgroundImage: notification['imageUrl'] != null 
                              ? NetworkImage(notification['imageUrl']) 
                              : null,
                          child: notification['imageUrl'] == null 
                              ? Icon(Icons.notifications, color: isRead ? Colors.grey : Colors.indigo)
                              : null,
                        ),
                        title: Text(
                          notification['title'] ?? '',
                          style: GoogleFonts.cairo(
                            fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
                          ),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 4),
                            Text(
                              notification['body'] ?? '',
                              style: GoogleFonts.cairo(fontSize: 13),
                            ),
                            const SizedBox(height: 4),
                            if (date != null)
                              Text(
                                DateFormat('yyyy/MM/dd - hh:mm a', 'ar').format(date.toLocal()),
                                style: GoogleFonts.cairo(fontSize: 11, color: Colors.grey),
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
