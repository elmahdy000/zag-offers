import 'dart:convert';
import 'dart:developer';
import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../../injection_container.dart' as di;
import '../../features/auth/data/datasources/auth_remote_data_source.dart';
import '../utils/navigation_service.dart';

class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  static String? _fcmToken;

  /// Callbacks to decouple core from feature layer
  static void Function(String? type, Map<String, dynamic> data)? onCouponRedeemed;
  static void Function(String? type, Map<String, dynamic> data)? onNotificationTap;

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
            _handleTap(data);
          } catch (e) {
            debugPrint('Error parsing local notification payload: $e');
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
        log('Notification permission granted');
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
        _handleTap(message.data);
      });

      final initialMessage = await _messaging.getInitialMessage();
      if (initialMessage != null) {
        _handleTap(initialMessage.data);
      }
    } catch (e) {
      log('Notification Initialization Error: $e');
    }
  }

  static Future<void> sendTokenToBackend() async {
    if (_fcmToken == null) {
      _fcmToken = await _messaging.getToken();
    }
    final token = _fcmToken;
    if (token != null) {
      try {
        await di.sl<AuthRemoteDataSource>().updateFcmToken(token);
      } catch (e) {
        debugPrint('FCM token update failed: $e');
      }
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
    } catch (e) {
      debugPrint('Failed to remove FCM token: $e');
    }
  }

  static void _handleForegroundMessage(RemoteMessage message) {
    final title = message.notification?.title ?? message.data['title'] ?? 'تنبيه جديد';
    final body = message.notification?.body ?? message.data['body'] ?? '';
    final imageUrl = message.notification?.android?.imageUrl ?? message.data['imageUrl'];

    showLocalNotification(title, body, data: message.data, imageUrl: imageUrl);
    saveToHistory(title, body, message.data);

    final type = message.data['type']?.toString();
    if (type == 'COUPON_REDEEMED') {
      onCouponRedeemed?.call(type, message.data);
    }
  }

  static void _handleTap(Map<String, dynamic> data) {
    onNotificationTap?.call(data['type']?.toString(), data);
  }

  static Future<void> saveToHistory(String title, String body, Map<String, dynamic> data) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final String? existingData = prefs.getString('notifications_history');
      List<dynamic> history = [];

      if (existingData != null) {
        history = List<dynamic>.from(json.decode(existingData));
      }

      final newNotification = {
        'id': DateTime.now().microsecondsSinceEpoch.toString(),
        'title': title,
        'body': body,
        'type': data['type'],
        'data': data,
        'isRead': false,
        'imageUrl': data['imageUrl'],
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

  static Future<String?> _downloadImage(String imageUrl) async {
    try {
      final uri = Uri.parse(imageUrl);
      final client = HttpClient();
      final request = await client.getUrl(uri);
      final response = await request.close();
      final bytes = await response.fold<List<int>>(<int>[], (prev, chunk) => prev..addAll(chunk));
      client.close();
      final tempDir = Directory.systemTemp;
      final filePath = '${tempDir.path}/notif_${DateTime.now().millisecondsSinceEpoch}.png';
      await File(filePath).writeAsBytes(bytes);
      return filePath;
    } catch (e) {
      log('Error downloading notification image: $e');
      return null;
    }
  }

  static Future<void> showLocalNotification(String title, String body, {Map<String, dynamic>? data, String? imageUrl}) async {
    StyleInformation? styleInformation;
    if (imageUrl != null && imageUrl.isNotEmpty) {
      final filePath = await _downloadImage(imageUrl);
      if (filePath != null) {
        styleInformation = BigPictureStyleInformation(
          FilePathAndroidBitmap(filePath),
          contentTitle: title,
          htmlFormatContentTitle: true,
          summaryText: body,
          htmlFormatSummaryText: true,
        );
      }
    }
    if (styleInformation == null) {
      styleInformation = BigTextStyleInformation(
        body,
        contentTitle: title,
        htmlFormatContentTitle: true,
        htmlFormatSummaryText: true,
      );
    }

    final AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails(
      'merchants_channel',
      'تنبيهات التجار',
      channelDescription: 'إشعارات العمليات والطلبات الجديدة',
      importance: Importance.max,
      priority: Priority.high,
      icon: 'ic_notification',
      styleInformation: styleInformation,
      playSound: true,
      sound: const RawResourceAndroidNotificationSound('notification_sound'),
    );

    final NotificationDetails platformChannelSpecifics =
        NotificationDetails(android: androidPlatformChannelSpecifics);

    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title,
      body,
      platformChannelSpecifics,
      payload: data != null ? jsonEncode(data) : null,
    );
  }

}
