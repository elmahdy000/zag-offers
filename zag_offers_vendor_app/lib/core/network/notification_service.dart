import 'dart:developer';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../injection_container.dart' as di;
import '../../features/auth/data/datasources/auth_remote_data_source.dart';
import '../../features/dashboard/presentation/bloc/dashboard_bloc.dart';
import '../../features/notifications/presentation/pages/notifications_page.dart';
import '../../main.dart' show navigatorKey;

/// NOTE: Firebase.initializeApp() and onBackgroundMessage() are registered
/// in main.dart — do NOT call them here to avoid duplicate initialization.
class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static String? _fcmToken;

  static String? get currentToken => _fcmToken;

  static Future<void> initialize() async {
    try {
      // ── 1. Request permission ────────────────────────────────────────────
      final settings = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized ||
          settings.authorizationStatus == AuthorizationStatus.provisional) {
        log('✅ Notification permission granted');

        // الاشتراك في القناة العامة للتجار
        await _messaging.subscribeToTopic('all_merchants');

        // ── 2. Get & cache FCM token ─────────────────────────────────────
        _fcmToken = await _messaging.getToken();
        log('📱 FCM Token: $_fcmToken');

        if (_fcmToken != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('fcm_token', _fcmToken!);
        }
      } else {
        log('⚠️ Notification permission denied');
      }

      // ── 3. Token refresh listener ────────────────────────────────────────
      _messaging.onTokenRefresh.listen((newToken) async {
        log('🔄 FCM Token refreshed');
        _fcmToken = newToken;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('fcm_token', newToken);
        // Only send to backend if user is already logged in
        await sendTokenToBackend();
      });

      // ── 4. Foreground messages ───────────────────────────────────────────
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // ── 5. Notification tapped from background ───────────────────────────
      FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

      // ── 6. App launched from terminated state ────────────────────────────
      final initialMessage = await _messaging.getInitialMessage();
      if (initialMessage != null) {
        _handleNotificationTap(initialMessage);
      }
    } catch (e) {
      log('❌ Notification Initialization Error: $e');
    }
  }

  /// Send the cached FCM token to the backend. Call this after login.
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

  /// Remove FCM token from backend and delete it locally. Call this on logout.
  static Future<void> removeTokenFromBackend() async {
    try {
      if (_fcmToken != null) {
        await di.sl<AuthRemoteDataSource>().removeFcmToken();
      }
      await _messaging.deleteToken();
      _fcmToken = null;
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('fcm_token');
      log('✅ FCM token removed');
    } catch (e) {
      log('❌ Failed to remove FCM token: $e');
    }
  }

  // ── Message handlers ─────────────────────────────────────────────────────

  static void _handleForegroundMessage(RemoteMessage message) {
    log('📩 Foreground message: ${message.notification?.title}');

    // Refresh dashboard stats when a coupon is redeemed
    if (message.data['type'] == 'COUPON_REDEEMED') {
      di.sl<DashboardBloc>().add(GetDashboardStatsRequested());
    }
  }

  static void _handleNotificationTap(RemoteMessage message) {
    log('Notification tapped: ${message.data}');
    final type = message.data['type'];

    if (type == 'COUPON_REDEEMED' || type == 'COUPON_GENERATED') {
      di.sl<DashboardBloc>().add(GetDashboardStatsRequested());
    }

    // Default Navigation to Notifications Page
    final ctx = navigatorKey.currentContext;
    if (ctx != null) {
      Navigator.of(ctx).push(
        MaterialPageRoute(builder: (_) => const NotificationsPage()),
      );
    }
  }
}
