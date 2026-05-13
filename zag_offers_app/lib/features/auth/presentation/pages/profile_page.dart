import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter/services.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/services/socket_service.dart';
import '../../../../injection_container.dart';
import '../../../favorites/presentation/bloc/favorites_bloc.dart';
import '../../../favorites/presentation/pages/favorites_page.dart';
import '../../../home/presentation/pages/notifications_page.dart';
import '../../data/datasources/auth_local_data_source.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../../../../core/utils/snackbar_utils.dart';
import 'login_page.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  String _userName = '';
  String _userRole = '';
  bool _isLoggingOut = false;

  String _roleLabel(String role) {
    switch (role) {
      case 'ADMIN':
        return 'مدير';
      case 'MERCHANT':
        return 'تاجر';
      case 'CUSTOMER':
        return 'عميل';
      default:
        return role;
    }
  }

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    final name = await sl<AuthLocalDataSource>().getUserName();
    final role = await sl<AuthLocalDataSource>().getUserRole();
    if (mounted) {
      setState(() {
        _userName = name ?? 'مستخدم Zag Offers';
        _userRole = role ?? 'CUSTOMER';
      });
    }
  }

  Future<void> _logout() async {
    setState(() => _isLoggingOut = true);
    try {
      sl<SocketService>().dispose();
      // Dispatch through AuthBloc — it handles FCM token removal + cache clear
      if (mounted) {
        context.read<AuthBloc>().add(LogoutRequested());
      }
    } catch (_) {
      // Fallback: clear cache directly if bloc is unavailable
      await sl<AuthLocalDataSource>().clearCache();
      if (mounted) {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (context) => const LoginPage()),
          (route) => false,
        );
      }
    }
  }

  void _openNotifications() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const NotificationsPage()),
    );
  }

  void _openFavorites() {
    context.read<FavoritesBloc>().add(FetchFavorites());
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const FavoritesPage()),
    );
  }

  void _showHelpDialog() {
    showDialog<void>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('مركز المساعدة'),
          content: SizedBox(
            width: MediaQuery.of(context).size.width * 0.85,
            child: const Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
              Text('يمكنك استخدام التطبيق بهذه الخطوات:'),
              SizedBox(height: 12),
              Text('1. استكشف العروض من الرئيسية أو صفحة العروض.'),
              Text('2. أضف العروض إلى المفضلة للرجوع إليها بسرعة.'),
              Text('3. استخدم حساب عميل للحصول على الكوبونات.'),
              Text('4. من صفحة المتجر يمكنك الاتصال أو فتح واتساب مباشرة.'),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('إغلاق'),
          ),
        ],
      );
      },
    );
  }

  void _showAboutDialogSheet() {
    showAboutDialog(
      context: context,
      applicationName: 'Zag Offers',
      applicationVersion: '1.0.0',
      applicationIcon: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Image.asset(
          'assets/app_icon.png',
          width: 50,
          height: 50,
          fit: BoxFit.cover,
        ),
      ),
      children: const [
        Text(
          'تطبيق لاكتشاف العروض والخصومات والمحلات القريبة داخل الزقازيق.',
        ),
      ],
    );
  }

  void _showSettingsSheet() {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                  leading: const Icon(Icons.notifications_outlined),
                  title: const Text('الإشعارات'),
                  onTap: () {
                    Navigator.pop(context);
                    _openNotifications();
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.help_outline),
                  title: const Text('مركز المساعدة'),
                  onTap: () {
                    Navigator.pop(context);
                    _showHelpDialog();
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.info_outline),
                  title: const Text('عن التطبيق'),
                  onTap: () {
                    Navigator.pop(context);
                    _showAboutDialogSheet();
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.copy_rounded),
                  title: const Text('نسخ اسم المستخدم'),
                  onTap: () async {
                    Navigator.pop(context);
                    await Clipboard.setData(ClipboardData(text: _userName));
                    if (context.mounted) {
                      SnackBarUtils.showSuccess(context, 'تم نسخ اسم المستخدم');
                    }
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 280,
            pinned: true,
            stretch: true,
            backgroundColor: AppColors.primary,
            elevation: 0,
            flexibleSpace: FlexibleSpaceBar(
              stretchModes: const [StretchMode.zoomBackground],
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topRight,
                        end: Alignment.bottomLeft,
                        colors: [
                          Color(0xFFFF7E26),
                          AppColors.primary,
                          Color(0xFFE65100),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    right: -50,
                    top: -50,
                    child: CircleAvatar(
                      radius: 100,
                      backgroundColor: Colors.white.withValues(alpha: 0.1),
                    ),
                  ),
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(height: 40),
                        Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 3),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.2),
                                blurRadius: 20,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: const CircleAvatar(
                            radius: 50,
                            backgroundColor: Colors.white,
                            child: Icon(Icons.person, size: 50, color: AppColors.primary),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _userName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            _roleLabel(_userRole),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.2,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.settings_outlined, color: Colors.white),
                onPressed: _showSettingsSheet,
              ),
              const SizedBox(width: 8),
            ],
          ),
          SliverToBoxAdapter(
            child: Transform.translate(
              offset: const Offset(0, -20),
              child: Container(
                decoration: BoxDecoration(
                  color: theme.scaffoldBackgroundColor,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
                ),
                padding: const EdgeInsets.fromLTRB(24, 30, 24, 40),
                child: Column(
                  children: [
                    Row(
                      children: [
                        _buildStatCard(
                          'كوبونات نشطة',
                          _userRole == 'CUSTOMER' ? 'متاح' : '--',
                          Icons.confirmation_num_rounded,
                          Colors.orange,
                        ),
                        const SizedBox(width: 16),
                        _buildStatCard(
                          'نوع الحساب',
                          _roleLabel(_userRole),
                          Icons.verified_user_rounded,
                          Colors.green,
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),
                    _buildPremiumMenu(context),
                    const SizedBox(height: 40),
                    _buildLogoutButton(),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withValues(alpha: 0.1)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPremiumMenu(BuildContext context) {
    return Column(
      children: [
        _buildMenuOption(
          icon: Icons.favorite_rounded,
          label: 'المفضلات',
          color: Colors.red,
          onTap: _openFavorites,
        ),
        _buildMenuOption(
          icon: Icons.notifications_rounded,
          label: 'الإشعارات',
          color: Colors.blue,
          onTap: _openNotifications,
        ),
        _buildMenuOption(
          icon: Icons.help_center_rounded,
          label: 'مركز المساعدة',
          color: Colors.purple,
          onTap: _showHelpDialog,
        ),
        _buildMenuOption(
          icon: Icons.info_rounded,
          label: 'عن التطبيق',
          color: Colors.teal,
          onTap: _showAboutDialogSheet,
        ),
      ],
    );
  }

  Widget _buildMenuOption({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: theme.cardColor,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: theme.dividerColor.withValues(alpha: 0.1)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                ),
              ),
              Icon(Icons.arrow_forward_ios_rounded, size: 14, color: theme.dividerColor),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLogoutButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _isLoggingOut ? null : _logout,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.error.withValues(alpha: 0.1),
          foregroundColor: AppColors.error,
          elevation: 0,
          padding: const EdgeInsets.symmetric(vertical: 18),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
            side: BorderSide(color: AppColors.error.withValues(alpha: 0.2)),
          ),
        ),
        child: _isLoggingOut
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.error,
                ),
              )
            : const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.logout_rounded, size: 20),
                  SizedBox(width: 10),
                  Text(
                    'تسجيل الخروج',
                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                  ),
                ],
              ),
      ),
    );
  }
}
