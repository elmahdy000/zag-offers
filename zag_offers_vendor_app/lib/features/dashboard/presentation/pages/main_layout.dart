import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:zag_offers_vendor_app/core/theme/app_colors.dart';
import 'package:zag_offers_vendor_app/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:zag_offers_vendor_app/features/offers/presentation/pages/offers_page.dart';
import 'package:zag_offers_vendor_app/features/offers/presentation/bloc/offers_bloc.dart';
import 'package:zag_offers_vendor_app/features/profile/presentation/pages/profile_page.dart';
import 'package:zag_offers_vendor_app/core/network/socket_service.dart';
import 'package:zag_offers_vendor_app/features/qr_scanner/presentation/pages/qr_scanner_page.dart';
import 'package:zag_offers_vendor_app/features/dashboard/presentation/bloc/dashboard_bloc.dart';
import 'package:zag_offers_vendor_app/injection_container.dart' as di;
import 'package:zag_offers_vendor_app/core/network/notification_service.dart';
import 'package:zag_offers_vendor_app/features/auth/data/datasources/auth_remote_data_source.dart';
import 'package:zag_offers_vendor_app/features/reports/presentation/pages/reports_page.dart';
import 'dashboard_page.dart';

class MainLayout extends StatefulWidget {
  const MainLayout({super.key});

  @override
  State<MainLayout> createState() => MainLayoutState();
}

class MainLayoutState extends State<MainLayout> {
  int _currentIndex = 0;
  late SocketService _socketService;

  void setIndex(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  @override
  void initState() {
    super.initState();
    _socketService = di.sl<SocketService>();
    _socketService.connect();
    _setupSocketListeners();
    _registerFcmToken();
  }

  void _registerFcmToken() async {
    await NotificationService.sendTokenToBackend();
  }

  void _setupSocketListeners() {
    _socketService.on('merchant_notification', (data) {
      if (!mounted) return;
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(data['title'], style: const TextStyle(fontWeight: FontWeight.bold)),
              Text(data['body']),
            ],
          ),
          backgroundColor: AppColors.secondary,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 5),
          action: SnackBarAction(
            label: 'تحديث',
            textColor: Colors.white,
            onPressed: () {
              context.read<DashboardBloc>().add(GetDashboardStatsRequested());
            },
          ),
        ),
      );

      context.read<DashboardBloc>().add(GetDashboardStatsRequested());
      context.read<OffersBloc>().add(GetMyOffersRequested());
    });
  }

  @override
  void dispose() {
    _socketService.off('merchant_notification');
    _socketService.disconnect();
    super.dispose();
  }

  final List<Widget> _pages = [
    const DashboardPage(),
    OffersPage(),
    const ReportsPage(),
    ProfilePage(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Padding(
        padding: const EdgeInsets.only(bottom: 80), // زيادة مساحة الحماية
        child: IndexedStack(index: _currentIndex, children: _pages),
      ),
      floatingActionButton: FloatingActionButton(
        heroTag: 'main_fab',
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const QRScannerPage()),
          );
        },
        backgroundColor: AppColors.primary,
        elevation: 8,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: const Icon(Icons.qr_code_scanner, color: Colors.white, size: 28),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: BottomAppBar(
        color: AppColors.card,
        shape: const CircularNotchedRectangle(),
        notchMargin: 8,
        elevation: 20,
        height: 80,
        child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(
                icon: Icons.dashboard_rounded,
                label: 'الرئيسية',
                index: 0,
              ),
              _buildNavItem(
                icon: Icons.local_offer_rounded,
                label: 'العروض',
                index: 1,
              ),
              const SizedBox(width: 48), // Space for FAB
              _buildNavItem(
                icon: Icons.analytics_rounded,
                label: 'التقارير',
                index: 2,
              ),
              _buildNavItem(
                icon: Icons.person_rounded,
                label: 'حسابي',
                index: 3,
              ),
            ],
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required String label,
    required int index,
  }) {
    final isSelected = _currentIndex == index;
    return InkWell(
      onTap: () => setState(() => _currentIndex = index),
      customBorder: const CircleBorder(),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppColors.primary.withValues(alpha: 0.1)
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              color: isSelected ? AppColors.primary : AppColors.textSecondary,
              size: 26,
            ),
          ),
          if (isSelected)
            Text(
              label,
              style: TextStyle(
                color: AppColors.primary,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
        ],
      ),
    );
  }
}
