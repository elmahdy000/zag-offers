import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:zag_offers_admin_app/core/network/api_client.dart';
import 'package:zag_offers_admin_app/features/merchants/presentation/pages/merchants_page.dart';
import 'package:zag_offers_admin_app/features/offers/presentation/pages/offers_page.dart';
import 'package:zag_offers_admin_app/main.dart' show navigatorKey;
import 'package:zag_offers_admin_app/features/notifications/presentation/pages/notifications_page.dart';

class NotificationService {
  FirebaseMessaging? _fcm;
  final ApiClient _apiClient;
  bool _initialized = false;

  NotificationService(this._apiClient) {
    try {
      if (Firebase.apps.isNotEmpty) {
        _fcm = FirebaseMessaging.instance;
      }
    } catch (e) {
      debugPrint('NotificationService: Error getting FirebaseMessaging instance: $e');
    }
  }

  Future<void> init() async {
    if (_initialized) return;
    if (_fcm == null) {
      debugPrint('NotificationService: Firebase not initialized, skipping setup.');
      return;
    }
    _initialized = true;

    // 1. Request permission
    final settings = await _fcm!.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus != AuthorizationStatus.authorized &&
        settings.authorizationStatus != AuthorizationStatus.provisional) {
      debugPrint('NotificationService: permission denied');
      return;
    }

    // 2. Register FCM token with backend
    final token = await _fcm!.getToken();
    if (token != null) await _registerToken(token);
    _fcm!.onTokenRefresh.listen(_registerToken);

    // 3. Foreground messages: show floating SnackBar
    FirebaseMessaging.onMessage.listen((message) {
      final title = message.notification?.title ?? 'اشعار جديد';
      final body = message.notification?.body ?? '';
      _showSnackBar(title, body, message.data);
    });

    // 4. App opened from background by tapping a notification
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    // 5. App launched from terminated state via a notification
    final initial = await _fcm!.getInitialMessage();
    if (initial != null) _handleNotificationTap(initial);
  }

  Future<void> _registerToken(String token) async {
    try {
      await _apiClient.post('/auth/fcm-token', data: {'fcmToken': token});
      debugPrint('NotificationService: FCM token registered');
    } catch (e) {
      debugPrint('NotificationService: failed to register token: $e');
    }
  }

  void _handleNotificationTap(RemoteMessage message) {
    final type = message.data['type'] as String?;
    debugPrint('Notification tapped, type: $type');

    final ctx = navigatorKey.currentContext;
    if (ctx == null) return;

    switch (type) {
      case 'NEW_MERCHANT_REQUEST':
      case 'MERCHANT_PENDING':
        Navigator.of(ctx).push(
          MaterialPageRoute(builder: (_) => const MerchantsPage()),
        );
        break;
      case 'NEW_OFFER':
      case 'OFFER_PENDING':
        Navigator.of(ctx).push(
          MaterialPageRoute(builder: (_) => const OffersPage()),
        );
        break;
      case 'SYSTEM_UPDATE':
      default:
        Navigator.of(ctx).push(
          MaterialPageRoute(builder: (_) => const NotificationsPage()),
        );
        break;
    }
  }

  void _showSnackBar(String title, String body, Map<String, dynamic> data) {
    final ctx = navigatorKey.currentContext;
    if (ctx == null) return;

    ScaffoldMessenger.of(ctx).showSnackBar(
      SnackBar(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
            if (body.isNotEmpty)
              Text(body, style: const TextStyle(fontSize: 12)),
          ],
        ),
        backgroundColor: const Color(0xFF1E293B),
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 4),
        action: data['type'] != null
            ? SnackBarAction(
                label: 'عرض',
                textColor: const Color(0xFFFF6B00),
                onPressed: () =>
                    _handleNotificationTap(RemoteMessage(data: data)),
              )
            : null,
      ),
    );
  }
}
