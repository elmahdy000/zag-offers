import 'dart:convert';
import 'dart:developer';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../../injection_container.dart' as di;
import '../../features/auth/data/datasources/auth_remote_data_source.dart';
import '../../features/dashboard/presentation/bloc/dashboard_bloc.dart';
import '../../features/notifications/presentation/pages/notifications_page.dart';
import '../utils/navigation_service.dart';
import '../../features/dashboard/presentation/pages/main_layout.dart';

class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  static String? _fcmToken;

  static String? get currentToken => _fcmToken;

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
      'merchants_channel',
      'تنبيهات التجار',
      description: 'إشعارات العمليات والطلبات الجديدة',
      importance: Importance.max,
      playSound: true,
      // Note: Make sure notification_sound.wav exists in res/raw
      sound: RawResourceAndroidNotificationSound('notification_sound'),
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
  }

  static Future<void> initialize() async {
    try {
      await initializeLocalNotifications();

      final settings = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized ||
          settings.authorizationStatus == AuthorizationStatus.provisional) {
        log('✅ Notification permission granted');
        await _messaging.subscribeToTopic('all_merchants');
        _fcmToken = await _messaging.getToken();
        
        if (_fcmToken != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('fcm_token', _fcmToken!);
        }
      }

      _messaging.onTokenRefresh.listen((newToken) async {
        _fcmToken = newToken;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('fcm_token', newToken);
        await sendTokenToBackend();
      });

      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
      FirebaseMessaging.onMessageOpenedApp.listen((message) {
        handleNotificationTapFromData(message.data);
      });

      final initialMessage = await _messaging.getInitialMessage();
      if (initialMessage != null) {
        handleNotificationTapFromData(initialMessage.data);
      }
    } catch (e) {
      log('❌ Notification Initialization Error: $e');
    }
  }

  static Future<void> sendTokenToBackend() async {
    _fcmToken ??= await _messaging.getToken();
    if (_fcmToken != null) {
      try {
        await di.sl<AuthRemoteDataSource>().updateFcmToken(_fcmToken!);
      } catch (_) {}
    }
  }

  static Future<void> removeTokenFromBackend() async {
    try {
      if (_fcmToken != null) {
        await di.sl<AuthRemoteDataSource>().removeFcmToken();
      }
      await _messaging.deleteToken();
      _fcmToken = null;
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('fcm_token');
    } catch (_) {}
  }

  static void _handleForegroundMessage(RemoteMessage message) {
    final title = message.notification?.title ?? message.data['title'] ?? 'تنبيه جديد';
    final body = message.notification?.body ?? message.data['body'] ?? '';
    
    showLocalNotification(title, body, data: message.data);
    _saveToHistory(title, body, message.data);

    if (message.data['type'] == 'COUPON_REDEEMED') {
      di.sl<DashboardBloc>().add(GetDashboardStatsRequested());
    }
  }

  static Future<void> _saveToHistory(String title, String body, Map<String, dynamic> data) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final String? existingData = prefs.getString('notifications_history');
      List<dynamic> history = [];
      
      if (existingData != null) {
        history = List<dynamic>.from(json.decode(existingData));
      }
      
      final newNotification = {
        'title': title,
        'body': body,
        'data': data,
        'createdAt': DateTime.now().toIso8601String(),
      };
      
      history.insert(0, newNotification);
      
      if (history.length > 50) {
        history = history.sublist(0, 50);
      }
      
      await prefs.setString('notifications_history', json.encode(history));
    } catch (e) {
      log('Error saving notification history: $e');
    }
  }

  static Future<void> showLocalNotification(String title, String body, {Map<String, dynamic>? data}) async {
    const AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails(
      'merchants_channel',
      'تنبيهات التجار',
      channelDescription: 'إشعارات العمليات والطلبات الجديدة',
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

  static void handleNotificationTapFromData(Map<String, dynamic> data) {
    final type = data['type']?.toString();
    
    if (type == 'COUPON_REDEEMED' || type == 'COUPON_GENERATED') {
      di.sl<DashboardBloc>().add(GetDashboardStatsRequested());
    }

    final context = NavigationService.navigatorKey.currentContext;
    if (context == null) return;

    if (type == 'COUPON_REDEEMED') {
      MainLayout.of(context)?.setIndex(0); // Dashboard
    } else if (type == 'NEW_OFFER') {
      MainLayout.of(context)?.setIndex(1); // Offers
    } else {
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const NotificationsPage()),
      );
    }
  }
}
