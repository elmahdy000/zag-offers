import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../network/api_client.dart';
import '../utils/navigation_service.dart';
import '../../injection_container.dart' as di;
import '../../features/dashboard/presentation/pages/main_shell.dart';
import '../../features/notifications/presentation/pages/notifications_page.dart';

class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  Future<void> init() => NotificationService.initStatic();

  static Future<void> initializeLocalNotifications() async {
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('ic_notification');
    const InitializationSettings initializationSettings =
        InitializationSettings(android: initializationSettingsAndroid);

    await _localNotifications.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) async {
        if (response.payload != null) {
          try {
            final data = jsonDecode(response.payload!) as Map<String, dynamic>;
            await Future.delayed(const Duration(milliseconds: 500));
            handleNotificationTapFromData(data);
          } catch (e) {
            debugPrint('❌ Error parsing local notification payload: $e');
          }
        }
      },
    );

    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'admin_channel',
      'إشعارات الإدارة',
      description: 'إشعارات طلبات المتاجر والعروض الجديدة',
      importance: Importance.max,
      playSound: true,
      sound: RawResourceAndroidNotificationSound('notification_sound'),
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
        
  }

  static Future<void> initStatic() async {
    await initializeLocalNotifications();

    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      await _messaging.subscribeToTopic('all_users');
      await _messaging.subscribeToTopic('all_admins');
      
      final token = await _messaging.getToken();
      if (token != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('fcm_token', token);
        await _sendTokenToServer(token);
      }
    }

    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      handleNotificationTapFromData(message.data);
    });

    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      handleNotificationTapFromData(initialMessage.data);
    }
  }

  static Future<void> _sendTokenToServer(String token) async {
    try {
      await di.sl<ApiClient>().post(
        '/notifications/fcm-token',
        data: {'fcmToken': token},
      );
    } catch (_) {}
  }

  static void _handleForegroundMessage(RemoteMessage message) {
    final title = message.notification?.title ?? 'تنبيه إداري';
    final body = message.notification?.body ?? '';
    showLocalNotification(title, body, data: message.data);
  }

  static Future<void> showLocalNotification(String title, String body, {Map<String, dynamic>? data}) async {
    const AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails(
      'admin_channel',
      'إشعارات الإدارة',
      channelDescription: 'إشعارات طلبات المتاجر والعروض الجديدة',
      importance: Importance.max,
      priority: Priority.high,
      icon: 'ic_notification',
      playSound: true,
      sound: RawResourceAndroidNotificationSound('notification_sound'),
    );
    
    const NotificationDetails platformChannelSpecifics =
        NotificationDetails(android: androidPlatformChannelSpecifics);
    
    await _localNotifications.show(
      DateTime.now().millisecond,
      title,
      body,
      platformChannelSpecifics,
      payload: data != null ? jsonEncode(data) : null,
    );
  }

  Future<void> reset() => NotificationService.resetStatic();

  static Future<void> resetStatic() async {
    try {
      await _messaging.unsubscribeFromTopic('all_users');
      await _messaging.unsubscribeFromTopic('all_admins');
      await _messaging.deleteToken();
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('fcm_token');
    } catch (_) {}
  }

  static void handleNotificationTapFromData(Map<String, dynamic> data) {
    final type = data['type']?.toString();
    
    final context = NavigationService.navigatorKey.currentContext;
    if (context == null) return;

    if (type == 'NEW_STORE_REQUEST' || type == 'STORE_PENDING') {
      MainShell.of(context)?.setSelectedIndex(1); // Merchants tab
    } else if (type == 'NEW_OFFER_REQUEST' || type == 'OFFER_PENDING') {
      MainShell.of(context)?.setSelectedIndex(2); // Offers tab
    } else {
      // Navigate to Notifications Page
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const NotificationsPage()),
      );
    }
  }
}
