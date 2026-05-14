import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'core/theme/app_theme.dart';
import 'features/onboarding/presentation/pages/splash_page.dart';
import 'core/services/notification_service.dart';

import 'package:flutter_bloc/flutter_bloc.dart';
import 'features/notifications/presentation/bloc/notification_bloc.dart';
import 'injection_container.dart' as di;
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/offers/presentation/bloc/offers_bloc.dart';
import 'features/offers/presentation/bloc/offers_event.dart';
import 'features/coupons/presentation/bloc/coupons_bloc.dart';
import 'features/favorites/presentation/bloc/favorites_bloc.dart';

import 'firebase_options.dart';
import 'core/utils/navigation_service.dart';
import 'features/coupons/presentation/pages/my_coupons_page.dart';
import 'features/home/presentation/pages/notifications_page.dart';

// دالة لمعالجة الرسائل في الخلفية (Background Handler)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  
  // Initialize local notifications for this isolate
  await NotificationService.initializeLocalNotifications();
  
  // Show local notification if it has content
  final title = message.notification?.title ?? message.data['title'] ?? 'تحديث جديد';
  final body = message.notification?.body ?? message.data['body'] ?? '';
  
  if (title.isNotEmpty || body.isNotEmpty) {
    await NotificationService.showLocalNotification(title, body, data: message.data);
    
    // حفظ الإشعار في الـ Background لضمان ظهوره في السجل
    try {
      final prefs = await SharedPreferences.getInstance();
      const storageKey = 'notifications_history';
      final String? data = prefs.getString(storageKey);
      List<dynamic> items = [];
      if (data != null) {
        items = json.decode(data);
      }
      
      final newItem = {
        'title': title,
        'message': body,
        'createdAt': DateTime.now().toIso8601String(),
      };
      
      items.insert(0, newItem);
      // الاحتفاظ بآخر 50 إشعار فقط
      if (items.length > 50) items = items.sublist(0, 50);
      
      await prefs.setString(storageKey, json.encode(items));
    } catch (e) {
      debugPrint("Error saving background notification: $e");
    }
  }
  
  debugPrint("Handling a background message: ${message.messageId}");
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await di.init();

  // تهيئة Firebase
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    
    // إعداد معالج الرسائل في الخلفية
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    
    // تهيئة خدمة التنبيهات الخاصة بنا
    await NotificationService.initialize();
  } catch (e) {
    debugPrint('Firebase initialization failed: $e');
  }

  runApp(const ZagOffersApp());
}

class ZagOffersApp extends StatelessWidget {
  const ZagOffersApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (_) => di.sl<AuthBloc>()),
        BlocProvider(create: (_) => di.sl<NotificationBloc>()),
        BlocProvider(create: (_) => di.sl<OffersBloc>()..add(FetchHomeData())),
        BlocProvider(create: (_) => di.sl<CouponsBloc>()),
        BlocProvider(create: (_) => di.sl<FavoritesBloc>()),
      ],
      child: MaterialApp(
        navigatorKey: NavigationService.navigatorKey,
        title: 'Zag Offers',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.dark,
        routes: {
          '/coupons': (context) => const MyCouponsPage(),
          '/notifications': (context) => const NotificationsPage(),
        },
        builder: (context, child) {
          return Directionality(
            textDirection: TextDirection.rtl,
            child: child!,
          );
        },
        home: const SplashPage(),
      ),
    );
  }
}
