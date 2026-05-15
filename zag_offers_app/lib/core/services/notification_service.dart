import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../../injection_container.dart' as di;
import '../network/api_client.dart';
import '../../features/notifications/presentation/bloc/notification_bloc.dart';
import '../utils/navigation_service.dart';
import 'package:zag_offers_app/features/home/presentation/pages/main_screen.dart';
import '../../features/offers/presentation/pages/offer_loading_page.dart';

class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  static String? _fcmToken;
  static String? _lastSubscribedArea;
  static Map<String, dynamic>? _pendingNotificationData;

  static String? get currentToken => _fcmToken;

  static Future<void> initializeLocalNotifications() async {
    // إعداد الإشعارات المحلية للقنوات والصوت
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('ic_notification');
    const InitializationSettings initializationSettings =
        InitializationSettings(android: initializationSettingsAndroid);

    await _localNotifications.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) async {
        if (response.payload != null) {
          debugPrint('🔔 Local Notification Tap Received with payload: ${response.payload}');
          try {
            final data = _parsePayload(response.payload!);
            // تأخير بسيط لضمان استقرار الـ Navigator
            await Future.delayed(const Duration(milliseconds: 500));
            handleNotificationTapFromData(data);
          } catch (e) {
            debugPrint('❌ Error parsing local notification payload: $e');
          }
        }
      },
    );

    // إنشاء قناة الإشعارات مع الصوت المخصص
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'offers_channel',
      'عروض زقازيق',
      description: 'إشعارات العروض والخصومات الجديدة',
      importance: Importance.max,
      playSound: true,
      sound: RawResourceAndroidNotificationSound('notification_sound'),
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
        
    debugPrint('✅ Local Notifications Initialized');
  }

  static Future<void> initialize() async {
    await initializeLocalNotifications();

    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      debugPrint('🔔 Notification permissions granted');
      await _messaging.subscribeToTopic('all_users');
      await _messaging.subscribeToTopic('all_customers');
      debugPrint('🔔 Subscribed to all_users and all_customers');
      
      _fcmToken = await _messaging.getToken();
      debugPrint('🔔 FCM Token: $_fcmToken');
      
      if (_fcmToken != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('fcm_token', _fcmToken!);
        
        // Load last subscribed area from storage to sync
        _lastSubscribedArea = prefs.getString('last_area_topic');
      }
    } else {
      debugPrint('❌ Notification permissions denied');
    }

    _messaging.onTokenRefresh.listen((newToken) async {
      _fcmToken = newToken;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('fcm_token', newToken);
      await _sendTokenToServer(newToken);
    });

    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }
  }

  static Future<void> sendTokenToBackend() async {
    _fcmToken ??= await _messaging.getToken();
    if (_fcmToken != null) {
      await _sendTokenToServer(_fcmToken!);
    }
  }

  static Future<void> _sendTokenToServer(String token) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final authToken = prefs.getString('auth_token');
      if (authToken == null) return;

      await di.sl<ApiClient>().dio.post(
        '/notifications/fcm-token',
        data: {'fcmToken': token},
      );
    } catch (_) {}
  }

  static Future<void> removeTokenFromBackend() async {
    try {
      await di.sl<ApiClient>().dio.delete('/notifications/fcm-token');
      if (_lastSubscribedArea != null) {
        await unsubscribeFromArea(_lastSubscribedArea);
      }
      await _messaging.deleteToken();
      _fcmToken = null;
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('fcm_token');
      await prefs.remove('last_area_topic');
    } catch (_) {}
  }

  static Future<void> subscribeToArea(String? area) async {
    if (area == null || area.isEmpty) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      final topic = _formatTopic(area);

      // Unsubscribe from old area if different
      if (_lastSubscribedArea != null && _lastSubscribedArea != topic) {
        await _messaging.unsubscribeFromTopic(_lastSubscribedArea!);
      }

      await _messaging.subscribeToTopic(topic);
      _lastSubscribedArea = topic;
      await prefs.setString('last_area_topic', topic);
      debugPrint('📍 Area Sync: Subscribed to $topic');
    } catch (e) {
      debugPrint('❌ Area Sync Error: $e');
    }
  }

  static Future<void> unsubscribeFromArea(String? area) async {
    if (area == null || area.isEmpty) return;
    try {
      final topic = _formatTopic(area);
      await _messaging.unsubscribeFromTopic(topic);
    } catch (_) {}
  }

  static String _formatTopic(String name) {
    return 'area_${name.trim().replaceAll(' ', '_')}';
  }

  static void _handleForegroundMessage(RemoteMessage message) {
    final title = message.notification?.title ?? 'تحديث جديد';
    final body = message.notification?.body ?? '';
    
    // إظهار تنبيه محلي للمستخدم ليراه في الـ Foreground
    showLocalNotification(title, body, data: message.data);

    di.sl<NotificationBloc>().add(
      GeneralNotificationReceived(title: title, body: body),
    );
  }

  static Future<void> showLocalNotification(String title, String body, {Map<String, dynamic>? data}) async {
    const AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails(
      'offers_channel',
      'عروض زقازيق',
      channelDescription: 'إشعارات العروض والخصومات الجديدة',
      importance: Importance.max,
      priority: Priority.high,
      ticker: 'ticker',
      icon: 'ic_notification',
      playSound: true,
      sound: RawResourceAndroidNotificationSound('notification_sound'),
    );
    
    const NotificationDetails platformChannelSpecifics =
        NotificationDetails(android: androidPlatformChannelSpecifics);
    
    await _localNotifications.show(
      DateTime.now().millisecond, // ID فريد
      title,
      body,
      platformChannelSpecifics,
      payload: data != null ? _encodePayload(data) : null,
    );
  }

  static String _encodePayload(Map<String, dynamic> data) {
    return jsonEncode(data);
  }

  static Map<String, dynamic> _parsePayload(String payload) {
    try {
      return jsonDecode(payload) as Map<String, dynamic>;
    } catch (e) {
      debugPrint('❌ JSON Decode Error: $e');
      return {};
    }
  }

  static void _handleNotificationTap(RemoteMessage message) {
    debugPrint('🔔 FCM Notification Tap Received: ${message.data}');
    handleNotificationTapFromData(message.data);
  }

  static void handleNotificationTapFromData(Map<String, dynamic> data) {
    debugPrint('🔔 --- Notification Data Debug ---');
    data.forEach((key, value) {
      debugPrint('   🔑 Key: $key | Value: $value (${value.runtimeType})');
    });
    debugPrint('🔔 ------------------------------');

    final type = data['type']?.toString();
    final id = data['offerId']?.toString() ?? data['storeId']?.toString();
    
    debugPrint('🔔 Processing Notification Data - Type: $type, ID: $id');

    final state = NavigationService.navigatorKey.currentState;
    if (state == null) {
      debugPrint('⏳ Navigator not ready. Saving notification as pending.');
      _pendingNotificationData = data;
      return;
    }

    if ((type == 'NEW_OFFER' || type == 'OFFER_APPROVED') && id != null) {
      debugPrint('🚀 Navigating to Offer: $id');
      navigateToOffer(id);
    } else if (type == 'COUPON_REDEEMED' || type == 'NEW_COUPON' || type == 'COUPON_GENERATED') {
      debugPrint('🚀 Navigating to Coupons Tab');
      _navigateNamed('/'); // Go to MainScreen first
      _navigateTab(2); // Index 2 is Coupons
    } else if (type == 'DIGEST_NEW_OFFERS') {
      debugPrint('🚀 Navigating to All Offers Tab');
      _navigateNamed('/');
      _navigateTab(1); // Index 1 is All Offers
    } else if (type == 'ANNOUNCEMENT' || type == 'GENERAL') {
      debugPrint('🚀 Navigating to Notifications Page');
      _navigateNamed('/notifications');
    } else if (type == 'STORE_APPROVED') {
       debugPrint('🚀 Navigating to Home (Store Approved)');
       _navigateNamed('/');
       _navigateTab(0);
    } else {
       debugPrint('⚠️ Unknown notification type or missing ID. Defaulting to Home.');
       _navigateNamed('/');
       _navigateTab(0);
    }
  }

  static void _navigateTab(int index) {
    // نستخدم Delay بسيط لضمان أن الـ MainScreen قد تم بناؤها
    Future.delayed(const Duration(milliseconds: 300), () {
      final currentContext = NavigationService.navigatorKey.currentContext;
      if (currentContext != null) {
        // ignore: use_build_context_synchronously
        MainScreen.of(currentContext)?.setSelectedIndex(index);
      }
    });
  }

  static void _navigateNamed(String route) {
    final state = NavigationService.navigatorKey.currentState;
    if (state != null) {
      // إذا كنا في صفحة فرعية، نعود للرئيسية أولاً لو المسار هو '/'
      if (route == '/') {
        state.popUntil((r) => r.isFirst);
      } else {
        state.pushNamed(route);
      }
    } else {
      debugPrint('❌ Navigation Error: NavigatorState is null');
    }
  }

  static void navigateToOffer(String id) {
    final state = NavigationService.navigatorKey.currentState;
    if (state != null) {
      state.push(
        MaterialPageRoute(builder: (_) => OfferLoadingPage(offerId: id)),
      );
    } else {
      debugPrint('❌ Navigation Error: NavigatorState is null for Offer: $id');
    }
  }

  static void checkPendingNotification() {
    if (_pendingNotificationData != null) {
      debugPrint('🔔 Processing pending notification...');
      final data = _pendingNotificationData!;
      _pendingNotificationData = null;
      handleNotificationTapFromData(data);
    }
  }
}
