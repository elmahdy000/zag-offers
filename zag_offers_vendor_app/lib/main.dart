import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';

import 'core/theme/app_colors.dart';
import 'core/network/api_client.dart';
import 'features/auth/data/datasources/auth_remote_data_source.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/auth/presentation/pages/login_page.dart';
import 'features/dashboard/presentation/pages/main_layout.dart';
import 'features/dashboard/presentation/bloc/dashboard_bloc.dart';
import 'features/qr_scanner/presentation/bloc/qr_scanner_bloc.dart';
import 'features/offers/presentation/bloc/offers_bloc.dart';
import 'features/profile/presentation/bloc/profile_bloc.dart';

import 'core/network/notification_service.dart';
import 'injection_container.dart' as di;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await di.init();
  await NotificationService.initialize();
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
          create: (_) => di.sl<DashboardBloc>()..add(GetDashboardStatsRequested()),
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
      ],
      child: MaterialApp(
        title: 'Zag Offers Vendor',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: AppColors.primary,
            background: AppColors.background,
          ),
          textTheme: GoogleFonts.cairoTextTheme(),
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
          // جلب الإحصائيات فور تسجيل الدخول الناجح
          context.read<DashboardBloc>().add(GetDashboardStatsRequested());
        }
      },
      child: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, state) {
          if (state is AuthAuthenticated) {
            return const MainLayout();
          }
          return const LoginPage();
        },
      ),
    );
  }
}
