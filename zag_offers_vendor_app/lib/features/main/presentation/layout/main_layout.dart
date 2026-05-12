import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../dashboard/presentation/pages/enhanced_dashboard_page.dart';
import '../../../offers/presentation/pages/offers_page.dart';
import '../../../profile/presentation/pages/profile_page.dart';
import '../../../qr_scanner/presentation/pages/qr_scanner_page.dart';
import '../../../../core/network/socket_service.dart';
import '../../../../injection_container.dart' as di;
import '../../../../core/network/notification_service.dart';
import '../../../dashboard/presentation/bloc/dashboard_bloc.dart';

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
    // Socket listeners setup
  }

  @override
  void dispose() {
    _socketService.disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: IndexedStack(
        index: _currentIndex,
        children: [
          const EnhancedDashboardPage(),
          const OffersPage(),
          _currentIndex == 2 ? const QRScannerPage() : const SizedBox.shrink(),
          const ProfilePage(),
        ],
      ),
      bottomNavigationBar: _buildBottomNavigationBar(),
    );
  }

  Widget _buildBottomNavigationBar() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.card,
        border: Border(
          top: BorderSide(color: AppColors.border, width: 1),
        ),
      ),
      child: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: setIndex,
        backgroundColor: AppColors.card,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textDimmer,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'الرئيسية',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.local_offer),
            label: 'العروض',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.qr_code_scanner),
            label: 'مسح',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'الملف',
          ),
        ],
      ),
    );
  }
}
