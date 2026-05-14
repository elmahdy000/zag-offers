import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/theme/app_colors.dart';
import 'core/theme/app_theme.dart';
import 'firebase_options.dart';
import 'core/network/api_client.dart';
import 'features/auth/data/datasources/auth_remote_data_source.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/auth/presentation/pages/login_page.dart';
import 'features/dashboard/presentation/pages/main_layout.dart';
import 'features/dashboard/presentation/bloc/dashboard_bloc.dart';
import 'features/qr_scanner/presentation/bloc/qr_scanner_bloc.dart';
import 'features/offers/presentation/bloc/offers_bloc.dart';
import 'features/profile/presentation/bloc/profile_bloc.dart';
import 'features/notifications/presentation/bloc/notifications_bloc.dart';

import 'core/utils/navigation_service.dart';
import 'core/network/notification_service.dart';
import 'injection_container.dart' as di;
import 'core/widgets/splash_screen.dart';

/// Top-level background handler — must be annotated so the VM keeps it alive.
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  
  // Initialize local notifications for background
  await NotificationService.initializeLocalNotifications();
  
  final title = message.notification?.title ?? message.data['title'] ?? 'تنبيه جديد';
  final body = message.notification?.body ?? message.data['body'] ?? '';

  if (title.isNotEmpty || body.isNotEmpty) {
    await NotificationService.showLocalNotification(title, body, data: message.data);
    
    // حفظ الإشعار في الـ Background
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
        'body': body,
        'data': message.data,
        'createdAt': DateTime.now().toIso8601String(),
      };
      
      items.insert(0, newItem);
      if (items.length > 50) items = items.sublist(0, 50);
      
      await prefs.setString(storageKey, json.encode(items));
    } catch (_) {}
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    
    // Initialize our NotificationService
    await NotificationService.initialize();
  } catch (e) {
    debugPrint('Firebase initialization error: $e');
  }

  await di.init();
  runApp(const ZagOffersVendorApp());
}

class ZagOffersVendorApp extends StatelessWidget {
  const ZagOffersVendorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(
          create: (_) => di.sl<AuthBloc>()..add(CheckAuthStatus()),
        ),
        BlocProvider(
          create: (_) => di.sl<DashboardBloc>(),
        ),
        BlocProvider(
          create: (_) => di.sl<QRScannerBloc>(),
        ),
        BlocProvider(
          create: (_) => di.sl<OffersBloc>(),
        ),
        BlocProvider(
          create: (_) => di.sl<ProfileBloc>(),
        ),
        BlocProvider(
          create: (_) => di.sl<NotificationsBloc>(),
        ),
      ],
      child: MaterialApp(
        title: 'Zag Offers Vendor',
        navigatorKey: NavigationService.navigatorKey,
        debugShowCheckedModeBanner: false,
        theme: AppTheme.darkTheme.copyWith(
          inputDecorationTheme: InputDecorationTheme(
            filled: true,
            fillColor: AppColors.glassBackground,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: BorderSide(color: AppColors.glassBorder),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: BorderSide(color: AppColors.glassBorder),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: const BorderSide(color: AppColors.primary),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: const BorderSide(color: AppColors.error),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            hintStyle: GoogleFonts.cairo(
              color: AppColors.textDimmer,
              fontWeight: FontWeight.w700,
              fontSize: 14,
            ),
            labelStyle: GoogleFonts.cairo(
              color: AppColors.textDim,
              fontWeight: FontWeight.w900,
              fontSize: 10,
              letterSpacing: 0.3,
            ),
          ),
        ),
        builder: (context, child) {
          return Directionality(
            textDirection: TextDirection.rtl,
            child: child!,
          );
        },
        home: const AuthWrapper(),
      ),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthAuthenticated) {
          context.read<DashboardBloc>().add(GetDashboardStatsRequested());
          NotificationService.sendTokenToBackend();
        }
      },
      child: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, state) {
          if (state is AuthAuthenticated) {
            return const MainLayout();
          } else if (state is AuthInitial || state is AuthLoading) {
            return const SplashScreen();
          }
          return const LoginPage();
        },
      ),
    );
  }
}
