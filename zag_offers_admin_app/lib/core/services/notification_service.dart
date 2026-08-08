import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../network/api_client.dart';
import '../utils/navigation_service.dart';
import '../../injection_container.dart' as di;
import '../../features/dashboard/presentation/pages/main_shell.dart';
import '../../features/notifications/presentation/pages/notifications_page.dart';
import '../storage/token_storage.dart';

class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  Future<void> init() => NotificationService.initStatic();

  static Future<void> initializeLocalNotifications() async {
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('ic_notification');
    const DarwinInitializationSettings initializationSettingsDarwin =
        DarwinInitializationSettings();
    const InitializationSettings initializationSettings =
        InitializationSettings(
          android: initializationSettingsAndroid,
          iOS: initializationSettingsDarwin,
        );

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
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(channel);
  }

  static StreamSubscription<RemoteMessage>? _onMessageSub;
  static StreamSubscription<RemoteMessage>? _onMessageOpenedAppSub;
  static StreamSubscription<String>? _tokenRefreshSub;
  static Map<String, dynamic>? _pendingNotificationData;
  static final Completer<void> _initializationCompleter = Completer<void>();

  static Future<void> initStatic() async {
    try {
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

      await _tokenRefreshSub?.cancel();
      _tokenRefreshSub = _messaging.onTokenRefresh.listen(_sendTokenToServer);

      _onMessageSub = FirebaseMessaging.onMessage.listen(
        _handleForegroundMessage,
      );
      _onMessageOpenedAppSub = FirebaseMessaging.onMessageOpenedApp.listen((
        message,
      ) {
        handleNotificationTapFromData(message.data);
      });

      final initialMessage = await _messaging.getInitialMessage();
      if (initialMessage != null) {
        handleNotificationTapFromData(initialMessage.data);
      }
    } finally {
      if (!_initializationCompleter.isCompleted) {
        _initializationCompleter.complete();
      }
    }
  }

  static Future<void> _sendTokenToServer(String token) async {
    try {
      final authToken = await di.sl<TokenStorage>().read();
      if (authToken == null || authToken.isEmpty) return;
      await di.sl<ApiClient>().post(
        '/notifications/fcm-token',
        data: {'fcmToken': token},
      );
    } catch (_) {}
  }

  static Future<void> sendTokenToBackend() async {
    try {
      await _initializationCompleter.future.timeout(
        const Duration(seconds: 10),
      );
      final token = await _messaging.getToken();
      if (token != null) await _sendTokenToServer(token);
    } catch (e) {
      debugPrint('FCM token update failed: $e');
    }
  }

  static void _handleForegroundMessage(RemoteMessage message) {
    final title = message.notification?.title ?? 'تنبيه إداري';
    final body = message.notification?.body ?? '';
    final imageUrl =
        message.notification?.android?.imageUrl ?? message.data['imageUrl'];
    showLocalNotification(title, body, data: message.data, imageUrl: imageUrl);
  }

  static Future<String?> _downloadImage(String imageUrl) async {
    try {
      final uri = Uri.parse(imageUrl);
      final client = HttpClient();
      final request = await client.getUrl(uri);
      final response = await request.close();
      final bytes = await response.fold<List<int>>(
        <int>[],
        (prev, chunk) => prev..addAll(chunk),
      );
      client.close();
      final tempDir = Directory.systemTemp;
      final filePath =
          '${tempDir.path}/notif_${DateTime.now().millisecondsSinceEpoch}.png';
      await File(filePath).writeAsBytes(bytes);
      return filePath;
    } catch (e) {
      debugPrint('❌ Error downloading notification image: $e');
      return null;
    }
  }

  static Future<void> showLocalNotification(
    String title,
    String body, {
    Map<String, dynamic>? data,
    String? imageUrl,
  }) async {
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
          'admin_channel',
          'إشعارات الإدارة',
          channelDescription: 'إشعارات طلبات المتاجر والعروض الجديدة',
          importance: Importance.max,
          priority: Priority.high,
          icon: 'ic_notification',
          styleInformation: styleInformation,
          playSound: true,
          sound: RawResourceAndroidNotificationSound('notification_sound'),
        );

    final NotificationDetails platformChannelSpecifics = NotificationDetails(
      android: androidPlatformChannelSpecifics,
      iOS: const DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      ),
    );

    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch.remainder(2147483647),
      title,
      body,
      platformChannelSpecifics,
      payload: data != null ? jsonEncode(data) : null,
    );
  }

  Future<void> reset() => NotificationService.resetStatic();

  static Future<void> resetStatic() async {
    try {
      _onMessageSub?.cancel();
      _onMessageOpenedAppSub?.cancel();
      _tokenRefreshSub?.cancel();
      _onMessageSub = null;
      _onMessageOpenedAppSub = null;
      _tokenRefreshSub = null;
      try {
        await di.sl<ApiClient>().delete('/notifications/fcm-token');
      } catch (_) {}
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
    if (context == null) {
      _pendingNotificationData = data;
      return;
    }

    if (type == 'NEW_PENDING_STORE') {
      MainShell.of(context)?.setSelectedIndex(1); // Merchants tab
    } else if (type == 'NEW_PENDING_OFFER') {
      MainShell.of(context)?.setSelectedIndex(2); // Offers tab
    } else {
      // Navigate to Notifications Page
      Navigator.of(
        context,
      ).push(MaterialPageRoute(builder: (_) => const NotificationsPage()));
    }
  }

  static void checkPendingNotification() {
    final data = _pendingNotificationData;
    if (data == null) return;
    _pendingNotificationData = null;
    handleNotificationTapFromData(data);
  }
}
