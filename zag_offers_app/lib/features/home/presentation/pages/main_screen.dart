import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:zag_offers_app/core/theme/app_colors.dart';
import 'package:zag_offers_app/core/widgets/bouncy_tap.dart';

import 'package:flutter_iconly/flutter_iconly.dart';
import 'package:zag_offers_app/core/services/socket_service.dart';
import 'package:zag_offers_app/features/auth/data/datasources/auth_local_data_source.dart';
import 'package:zag_offers_app/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:zag_offers_app/core/services/notification_service.dart';
import 'package:zag_offers_app/features/auth/presentation/bloc/auth_state.dart';
import 'package:zag_offers_app/features/auth/presentation/pages/login_page.dart';
import 'package:zag_offers_app/features/auth/presentation/pages/profile_page.dart';
import 'package:zag_offers_app/features/coupons/presentation/pages/my_coupons_page.dart';
import 'package:zag_offers_app/features/favorites/presentation/bloc/favorites_bloc.dart';
import 'package:zag_offers_app/features/favorites/presentation/pages/favorites_page.dart';
import 'package:zag_offers_app/features/notifications/presentation/bloc/notification_bloc.dart';
import 'package:zag_offers_app/features/offers/presentation/bloc/offers_bloc.dart';
import 'package:zag_offers_app/features/offers/presentation/bloc/offers_event.dart';
import 'package:zag_offers_app/features/offers/presentation/pages/all_offers_page.dart';
import 'package:zag_offers_app/features/offers/presentation/pages/home_page.dart';
import 'package:zag_offers_app/injection_container.dart';
import 'package:zag_offers_app/core/utils/snackbar_utils.dart';

class MainScreen extends StatefulWidget {
  final int initialIndex;
  const MainScreen({super.key, this.initialIndex = 0});

  static MainScreenState? of(BuildContext context) =>
      context.findAncestorStateOfType<MainScreenState>();

  @override
  State<MainScreen> createState() => MainScreenState();
}

class MainScreenState extends State<MainScreen> {
  late int _selectedIndex;
  String? _userRole;
  StreamSubscription<Map<String, dynamic>>? _newOfferSub;
  StreamSubscription<Map<String, dynamic>>? _offersUpdatedSub;
  StreamSubscription<Map<String, dynamic>>? _categoriesUpdatedSub;
  StreamSubscription<Map<String, dynamic>>? _socialProofSub;
  StreamSubscription<Map<String, dynamic>>? _announcementSub;
  final Set<int> _loadedTabs = {};

  @override
  void initState() {
    super.initState();
    _selectedIndex = widget.initialIndex;
    _loadedTabs.add(_selectedIndex);
    _loadUserRole();
    _initSocket();
    // جلب المفضلة مبكراً لضمان ظهور حالة القلوب بشكل صحيح في كل الصفحات
    _fetchFavoritesIfAuthenticated();
    
    // فحص الإشعارات المعلقة بعد اكتمال بناء الواجهة
    WidgetsBinding.instance.addPostFrameCallback((_) {
      NotificationService.checkPendingNotification();
    });
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

  Future<void> _fetchFavoritesIfAuthenticated() async {
    final localDataSource = sl<AuthLocalDataSource>();
    final token = await localDataSource.getToken();
    if (token != null && token.isNotEmpty) {
      if (!mounted) return;
      context.read<FavoritesBloc>().add(FetchFavorites());
    }
  }

  Future<void> _initSocket() async {
    final localDataSource = sl<AuthLocalDataSource>();
    final token = await localDataSource.getToken();
    final userId = await localDataSource.getUserId();
    if (!mounted) return;

    if (token != null && userId != null) {
      final socketService = sl<SocketService>();
      socketService.initSocket(userId, token);

      // Subscribe once — dispatch to OffersBloc so the home feed updates live
      _newOfferSub = socketService.onNewOffer.listen((data) {
        if (!mounted) return;
        context.read<OffersBloc>().add(AddLiveOffer(data));
        final isFlash = data['isFlashSale'] == true;
        
        if (isFlash) {
          SnackBarUtils.showSuccess(
            context,
            '⚡️ فرصة حرق أسعار الآن! ${data['title'] ?? ''}',
            onTap: () {
              if (data['id'] != null) {
                NotificationService.navigateToOffer(data['id'].toString());
              }
            },
          );
        } else {
          SnackBarUtils.showInfo(
            context,
            'عرض جديد: ${data['title'] ?? 'تحقق من العروض'}',
            onTap: () {
              if (data['id'] != null) {
                NotificationService.navigateToOffer(data['id'].toString());
              }
            },
          );
        }
      });

      _offersUpdatedSub = socketService.onOffersUpdated.listen((_) {
        if (!mounted) return;
        context.read<OffersBloc>().add(FetchHomeData());
      });

      _categoriesUpdatedSub = socketService.onCategoriesUpdated.listen((_) {
        if (!mounted) return;
        context.read<OffersBloc>().add(FetchHomeData());
      });

      _socialProofSub = socketService.onSocialProof.listen((data) {
        if (!mounted) return;
        context.read<NotificationBloc>().add(NewSocialProofReceived(
          storeName: data['storeName'] ?? '',
          offerTitle: data['offerTitle'] ?? '',
        ));
      });

      _announcementSub = socketService.onAnnouncement.listen((data) {
        if (!mounted) return;
        final title = data['title']?.toString() ?? 'إعلان';
        final body = data['body']?.toString() ?? '';
        context.read<NotificationBloc>().add(GeneralNotificationReceived(
          title: title,
          body: body,
          type: data['type']?.toString(),
          data: data,
        ));
      });
    }
  }

  @override
  void dispose() {
    _newOfferSub?.cancel();
    _offersUpdatedSub?.cancel();
    _categoriesUpdatedSub?.cancel();
    _socialProofSub?.cancel();
    _announcementSub?.cancel();
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

  Widget _buildFloatingNavBar(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    final navItems = [
      (
        icon: IconlyLight.home,
        activeIcon: IconlyBold.home,
        label: 'الرئيسية',
      ),
      (
        icon: IconlyLight.discount,
        activeIcon: IconlyBold.discount,
        label: 'العروض',
      ),
      (
        icon: !_isRoleLoaded
            ? IconlyLight.moreSquare
            : _isCustomer
                ? IconlyLight.ticket
                : IconlyLight.heart,
        activeIcon: !_isRoleLoaded
            ? IconlyBold.moreSquare
            : _isCustomer
                ? IconlyBold.ticket
                : IconlyBold.heart,
        label: !_isRoleLoaded
            ? '...'
            : _isCustomer
                ? 'كوبوناتي'
                : 'المفضلة',
      ),
      (
        icon: IconlyLight.profile,
        activeIcon: IconlyBold.profile,
        label: 'حسابي',
      ),
    ];

    return Padding(
      padding: EdgeInsets.fromLTRB(16, 0, 16, bottomPadding > 0 ? bottomPadding : 14),
      child: Container(
        height: 64,
        decoration: BoxDecoration(
          color: (isDark ? const Color(0xFF131B2A) : Colors.white)
              .withValues(alpha: 0.88),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isDark
                ? Colors.white.withValues(alpha: 0.1)
                : Colors.black.withValues(alpha: 0.05),
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.45 : 0.08),
              blurRadius: 28,
              offset: const Offset(0, 8),
            ),
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.06),
              blurRadius: 18,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(navItems.length, (index) {
                final item = navItems[index];
                final isSelected = _selectedIndex == index;

                return Expanded(
                  child: BouncyTap(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      setSelectedIndex(index);
                    },
                    scaleFactor: 0.92,
                    child: Center(
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 240),
                        curve: Curves.easeOutCubic,
                        padding: EdgeInsets.symmetric(
                          horizontal: isSelected ? 14 : 6,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.primary.withValues(alpha: isDark ? 0.16 : 0.1)
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            AnimatedScale(
                              scale: isSelected ? 1.08 : 1.0,
                              duration: const Duration(milliseconds: 200),
                              curve: Curves.easeOutBack,
                              child: Icon(
                                isSelected ? item.activeIcon : item.icon,
                                color: isSelected
                                    ? AppColors.primary
                                    : (isDark ? Colors.grey.shade400 : AppColors.textSecondary),
                                size: 21,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              item.label,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                color: isSelected
                                    ? AppColors.primary
                                    : (isDark ? Colors.grey.shade400 : AppColors.textSecondary),
                                height: 1.1,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listenWhen: (_, current) => current is AuthInitial,
      listener: (context, state) {
        if (state is AuthInitial) {
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(builder: (_) => const LoginPage()),
            (route) => false,
          );
        }
      },
      child: Scaffold(
        extendBody: true,
        body: IndexedStack(
          index: _selectedIndex,
          children: _pages,
        ),
        bottomNavigationBar: _buildFloatingNavBar(context),
      ),   // Scaffold
    );   // BlocListener
  }
}
