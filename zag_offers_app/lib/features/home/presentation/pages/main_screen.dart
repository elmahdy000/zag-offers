import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:flutter_iconly/flutter_iconly.dart';
import 'package:zag_offers_app/core/services/socket_service.dart';
import 'package:zag_offers_app/core/theme/app_colors.dart';
import 'package:zag_offers_app/features/auth/data/datasources/auth_local_data_source.dart';
import 'package:zag_offers_app/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:zag_offers_app/features/auth/presentation/bloc/auth_state.dart';
import 'package:zag_offers_app/features/auth/presentation/pages/login_page.dart';
import 'package:zag_offers_app/features/auth/presentation/pages/profile_page.dart';
import 'package:zag_offers_app/features/coupons/presentation/pages/my_coupons_page.dart';
import 'package:zag_offers_app/features/favorites/presentation/bloc/favorites_bloc.dart';
import 'package:zag_offers_app/features/favorites/presentation/pages/favorites_page.dart';
import 'package:zag_offers_app/features/offers/presentation/bloc/offers_bloc.dart';
import 'package:zag_offers_app/features/offers/presentation/bloc/offers_event.dart';
import 'package:zag_offers_app/features/offers/presentation/pages/all_offers_page.dart';
import 'package:zag_offers_app/features/offers/presentation/pages/home_page.dart';
import 'package:zag_offers_app/injection_container.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  static MainScreenState? of(BuildContext context) =>
      context.findAncestorStateOfType<MainScreenState>();

  @override
  State<MainScreen> createState() => MainScreenState();
}

class MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;
  String? _userRole;
  StreamSubscription<Map<String, dynamic>>? _newOfferSub;
  final Set<int> _loadedTabs = {0};

  @override
  void initState() {
    super.initState();
    _loadUserRole();
    _initSocket();
    // جلب المفضلة مبكراً لضمان ظهور حالة القلوب بشكل صحيح في كل الصفحات
    context.read<FavoritesBloc>().add(FetchFavorites());
  }

  Future<void> _loadUserRole() async {
    final role = await sl<AuthLocalDataSource>().getUserRole();
    if (!mounted) return;
    setState(() {
      _userRole = role ?? 'CUSTOMER';
      if (_selectedIndex == 2 && !_isCustomer) {
        _selectedIndex = 0;
      }
    });
  }

  Future<void> _initSocket() async {
    final localDataSource = sl<AuthLocalDataSource>();
    final token = await localDataSource.getToken();
    final userId = await localDataSource.getUserId();

    if (token != null && userId != null) {
      final socketService = sl<SocketService>();
      socketService.initSocket(userId, token);

      // Subscribe once — dispatch to OffersBloc so the home feed updates live
      _newOfferSub = socketService.onNewOffer.listen((data) {
        if (!mounted) return;
        context.read<OffersBloc>().add(AddLiveOffer(data));
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'عرض جديد: ${data['title'] ?? 'تحقق من العروض'}',
            ),
            backgroundColor: AppColors.primary,
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 3),
          ),
        );
      });
    }
  }

  @override
  void dispose() {
    _newOfferSub?.cancel();
    super.dispose();
  }

  void setSelectedIndex(int index) {
    if (!_isRoleLoaded && index == 2) return;
    setState(() {
      _selectedIndex = index;
      _loadedTabs.add(index);
    });
  }

  bool get _isRoleLoaded => _userRole != null;
  bool get _isCustomer => _userRole == 'CUSTOMER';

  List<Widget> get _pages => [
        _buildLazyTab(0, const HomePage()),
        _buildLazyTab(1, const AllOffersPage()),
        _buildLazyTab(2, _buildRoleAwareThirdPage()),
        _buildLazyTab(3, const ProfilePage()),
      ];

  Widget _buildLazyTab(int index, Widget child) {
    if (_loadedTabs.contains(index)) {
      return child;
    }
    return const SizedBox.shrink();
  }

  Widget _buildRoleAwareThirdPage() {
    if (!_isRoleLoaded) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    return _isCustomer ? const MyCouponsPage() : const FavoritesPage();
  }

  List<BottomNavigationBarItem> get _items => [
        const BottomNavigationBarItem(
          icon: Icon(IconlyLight.home),
          activeIcon: Icon(IconlyBold.home),
          label: 'الرئيسية',
        ),
        BottomNavigationBarItem(
          icon: Icon(IconlyLight.discount),
          activeIcon: Icon(IconlyBold.discount),
          label: 'العروض',
        ),
        BottomNavigationBarItem(
          icon: Icon(
            !_isRoleLoaded
                ? IconlyLight.moreSquare
                : _isCustomer
                    ? IconlyLight.ticket
                    : IconlyLight.heart,
          ),
          activeIcon: Icon(
            !_isRoleLoaded
                ? IconlyBold.moreSquare
                : _isCustomer
                    ? IconlyBold.ticket
                    : IconlyBold.heart,
          ),
          label: !_isRoleLoaded
              ? 'جاري التحميل'
              : _isCustomer
                  ? 'كوبوناتي'
                  : 'المفضلة',
        ),
        BottomNavigationBarItem(
          icon: Icon(IconlyLight.profile),
          activeIcon: Icon(IconlyBold.profile),
          label: 'حسابي',
        ),
      ];

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthInitial) {
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(builder: (_) => const LoginPage()),
            (route) => false,
          );
        }
      },
      child: Scaffold(
        body: IndexedStack(
        index: _selectedIndex,
        children: _pages,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 15,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedIndex,
          onTap: setSelectedIndex,
          elevation: 0,
          items: _items,
        ),
      ),
    ),   // Scaffold
    );   // BlocListener
  }
}
