import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:google_fonts/google_fonts.dart';
import 'core/widgets/skeleton_loader.dart';
import 'injection_container.dart' as di;
import 'core/theme/app_colors.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/merchants/presentation/bloc/merchants_bloc.dart';
import 'features/users/presentation/bloc/users_bloc.dart';
import 'features/offers/presentation/bloc/offers_bloc.dart';
import 'features/broadcast/presentation/bloc/broadcast_bloc.dart';
import 'features/audit_logs/presentation/bloc/audit_logs_bloc.dart';
import 'features/categories/presentation/bloc/categories_bloc.dart';
import 'features/coupons/presentation/bloc/coupons_bloc.dart';
import 'features/dashboard/presentation/bloc/dashboard_bloc.dart';
import 'features/auth/presentation/pages/login_page.dart';
import 'features/dashboard/presentation/pages/dashboard_page.dart';
import 'firebase_options.dart';

/// Global navigator key — used by NotificationService to show SnackBars and
/// navigate to pages when the app is in the background or foreground.
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

/// Must be a top-level function annotated with @pragma so the Dart VM keeps
/// it alive in an isolate when the app is terminated.
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  debugPrint('FCM background message: ${message.notification?.title}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    ).timeout(const Duration(seconds: 4));
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  } catch (e) {
    debugPrint('Firebase initialization error: $e');
  }

  await di.init();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (_) => di.sl<AuthBloc>()..add(CheckAuthEvent())),
        BlocProvider(create: (_) => di.sl<DashboardBloc>()),
        BlocProvider(create: (_) => di.sl<MerchantsBloc>()),
        BlocProvider(create: (_) => di.sl<UsersBloc>()),
        BlocProvider(create: (_) => di.sl<OffersBloc>()),
        BlocProvider(create: (_) => di.sl<BroadcastBloc>()),
        BlocProvider(create: (_) => di.sl<AuditLogsBloc>()),
        BlocProvider(create: (_) => di.sl<CategoriesBloc>()),
        BlocProvider(create: (_) => di.sl<CouponsBloc>()),
      ],
      child: MaterialApp(
        navigatorKey: navigatorKey,
        title: 'Zag Offers Admin',
        debugShowCheckedModeBanner: false,
        locale: const Locale('ar'),
        supportedLocales: const [Locale('ar')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        theme: AppTheme.lightTheme,
        home: BlocBuilder<AuthBloc, AuthState>(
          builder: (context, state) {
            if (state is AuthAuthenticated) {
              return const DashboardPage();
            } else if (state is AuthInitial || state is AuthLoading) {
              return const Scaffold(
                body: CardSkeleton(),
              );
            } else {
              return const LoginPage();
            }
          },
        ),
      ),
    );
  }
}
