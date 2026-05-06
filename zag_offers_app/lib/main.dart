import 'package:flutter/material.dart';
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

// دالة لمعالجة الرسائل في الخلفية (Background Handler)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  debugPrint("Handling a background message: ${message.messageId}");
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
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

  await di.init();
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
        routes: {
          '/coupons': (context) => const MyCouponsPage(),
        },
        builder: (context, child) {
          return Directionality(
            textDirection: TextDirection.rtl,
            child: BlocListener<NotificationBloc, NotificationState>(
              listener: (context, state) {
                if (state is NotificationFeedState && state.latestItem != null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        state.latestItem!.message,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      backgroundColor: Colors.orange[800],
                      behavior: SnackBarBehavior.floating,
                      margin: const EdgeInsets.all(16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      duration: const Duration(seconds: 4),
                    ),
                  );
                  context.read<NotificationBloc>().add(ClearLatestNotification());
                }
              },
              child: child!,
            ),
          );
        },
        home: const SplashPage(),
      ),
    );
  }
}
