import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../injection_container.dart' as di;
import '../network/api_client.dart';
import '../../features/notifications/presentation/bloc/notification_bloc.dart';
import '../utils/navigation_service.dart';
import '../../features/offers/presentation/pages/offer_loading_page.dart';

class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static String? _fcmToken;

  static String? get currentToken => _fcmToken;

  static Future<void> initialize() async {
    // طلب الإذن (iOS + Android 13+)
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional) {
      debugPrint('✅ Notification permission granted');

      // الاشتراك في القناة العامة لكل المستخدمين
      await _messaging.subscribeToTopic('all_users');

      // جلب الـ FCM Token
      _fcmToken = await _messaging.getToken();
      debugPrint('📱 FCM Token: $_fcmToken');

      // حفظ التوكن محلياً
      if (_fcmToken != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('fcm_token', _fcmToken!);
      }
    } else {
      debugPrint('⚠️ Notification permission denied');
    }

    // مستمع للتوكن عند تحديثه (Token Refresh)
    _messaging.onTokenRefresh.listen((newToken) async {
      debugPrint('🔄 FCM Token refreshed');
      _fcmToken = newToken;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('fcm_token', newToken);
      // أرسل التوكن الجديد للسيرفر لو المستخدم مسجل دخوله
      await _sendTokenToServer(newToken);
    });

    // الرسائل أثناء فتح التطبيق (Foreground)
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // الضغط على الإشعار لفتح التطبيق من Background
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    // لو التطبيق اتفتح من Terminated بسبب إشعار
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }
  }

  // ─── إرسال التوكن للـ Backend (بعد login) ────────────────────────────────

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
      if (authToken == null) return; // المستخدم مش مسجل دخول

      await di.sl<ApiClient>().dio.post(
        '/notifications/fcm-token',
        data: {'fcmToken': token},
      );
      debugPrint('✅ FCM token sent to backend');
    } catch (e) {
      debugPrint('❌ Failed to send FCM token: $e');
    }
  }

  static Future<void> removeTokenFromBackend() async {
    try {
      await di.sl<ApiClient>().dio.delete('/notifications/fcm-token');
      await _messaging.deleteToken();
      _fcmToken = null;
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('fcm_token');
      debugPrint('✅ FCM token removed');
    } catch (e) {
      debugPrint('❌ Failed to remove FCM token: $e');
    }
  }

  // ─── Area Subscription ──────────────────────────────────────────────────

  static Future<void> subscribeToArea(String? area) async {
    if (area == null || area.isEmpty) return;
    try {
      final topic = 'area_${area.trim().replaceAll(' ', '_')}';
      await _messaging.subscribeToTopic(topic);
      debugPrint('📍 Subscribed to area: $topic');
    } catch (e) {
      debugPrint('❌ Error subscribing to area: $e');
    }
  }

  static Future<void> unsubscribeFromArea(String? area) async {
    if (area == null || area.isEmpty) return;
    try {
      final topic = 'area_${area.trim().replaceAll(' ', '_')}';
      await _messaging.unsubscribeFromTopic(topic);
    } catch (_) {}
  }

  // ─── Message Handlers ────────────────────────────────────────────────────

  static void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('📩 Foreground message: ${message.notification?.title}');
    final title = message.notification?.title ?? 'إشعار جديد';
    final body = message.notification?.body ?? '';
    
    // إرسال الإشعار لـ BLoC ليظهر كـ SnackBar
    di.sl<NotificationBloc>().add(
      GeneralNotificationReceived(title: title, body: body),
    );
  }

  static void _handleNotificationTap(RemoteMessage message) {
    debugPrint('Notification tapped: ${message.data}');
    final type = message.data['type'];
    final id = message.data['offerId'] ?? message.data['storeId'];
    
    if (type == 'NEW_OFFER' && id != null) {
      _navigateToOffer(id);
    } else if (type == 'OFFER_APPROVED' && id != null) {
      _navigateToOffer(id);
    } else if (type == 'COUPON_REDEEMED') {
      // التوجيه لصفحة الكوبونات
      final context = NavigationService.navigatorKey.currentContext;
      if (context != null) {
        Navigator.of(context).pushNamedAndRemoveUntil('/coupons', (route) => route.isFirst);
      }
    } else if (type == 'DIGEST_NEW_OFFERS') {
      final context = NavigationService.navigatorKey.currentContext;
      if (context != null) {
        Navigator.of(context).pushNamedAndRemoveUntil('/', (route) => false);
      }
    }
  }

  static void _navigateToOffer(String id) {
    final context = NavigationService.navigatorKey.currentContext;
    if (context != null) {
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => OfferLoadingPage(offerId: id)),
      );
    }
  }
}
