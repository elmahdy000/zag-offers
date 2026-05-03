import 'dart:developer';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../injection_container.dart' as di;
import '../../features/auth/data/datasources/auth_remote_data_source.dart';
import '../../features/dashboard/presentation/bloc/dashboard_bloc.dart';

class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static String? _fcmToken;

  static String? get currentToken => _fcmToken;

  static Future<void> initialize() async {
    try {
      await Firebase.initializeApp();

      // طلب الإذن (iOS + Android 13+)
      final settings = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized ||
          settings.authorizationStatus == AuthorizationStatus.provisional) {
        log('✅ Notification permission granted');

        // الاشتراك في القناة العامة للتجار (اختياري)
        await _messaging.subscribeToTopic('all_merchants');

        // جلب الـ FCM Token
        _fcmToken = await _messaging.getToken();
        log('📱 FCM Token: $_fcmToken');

        // حفظ التوكن محلياً
        if (_fcmToken != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('fcm_token', _fcmToken!);
        }
      } else {
        log('⚠️ Notification permission denied');
      }

      // مستمع للتوكن عند تحديثه
      _messaging.onTokenRefresh.listen((newToken) async {
        log('🔄 FCM Token refreshed');
        _fcmToken = newToken;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('fcm_token', newToken);
        await sendTokenToBackend();
      });

      // الرسائل أثناء فتح التطبيق (Foreground)
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // التعامل مع الرسائل في الخلفية
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // الضغط على الإشعار لفتح التطبيق من Background
      FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

      // لو التطبيق اتفتح من Terminated بسبب إشعار
      final initialMessage = await _messaging.getInitialMessage();
      if (initialMessage != null) {
        _handleNotificationTap(initialMessage);
      }
    } catch (e) {
      log('❌ Notification Initialization Error: $e');
    }
  }

  static Future<void> sendTokenToBackend() async {
    if (_fcmToken == null) {
      _fcmToken = await _messaging.getToken();
    }
    if (_fcmToken != null) {
      try {
        await di.sl<AuthRemoteDataSource>().updateFcmToken(_fcmToken!);
        log('✅ FCM token sent to backend');
      } catch (e) {
        log('❌ Failed to send FCM token: $e');
      }
    }
  }

  static void _handleForegroundMessage(RemoteMessage message) {
    log('📩 Foreground message: ${message.notification?.title}');
    
    // تحديث البيانات تلقائياً لو الإشعار يخص كوبون
    if (message.data['type'] == 'COUPON_REDEEMED') {
      di.sl<DashboardBloc>().add(GetDashboardStatsRequested());
    }
    
    // يمكنك هنا إظهار SnackBar أو إشعار محلي
  }

  static void _handleNotificationTap(RemoteMessage message) {
    log('Notification tapped: ${message.data}');
    final type = message.data['type'];
    
    if (type == 'COUPON_REDEEMED' || type == 'COUPON_GENERATED') {
      // تحديث الإحصائيات والتوجيه للوحة التحكم
      di.sl<DashboardBloc>().add(GetDashboardStatsRequested());
      // يمكن إضافة توجيه لصفحة معينة هنا لو رغبت
    } else if (type == 'STORE_APPROVED') {
      // التوجيه لصفحة الملف الشخصي أو الرئيسية
    }
  }
}

Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  log('FCM Message (Background): ${message.messageId}');
}
