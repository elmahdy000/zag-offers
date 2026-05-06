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
          content: const Column(
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
      applicationIcon: const CircleAvatar(
        backgroundColor: AppColors.primary,
        child: Icon(Icons.local_offer_rounded, color: Colors.white),
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
                    final messenger = ScaffoldMessenger.of(this.context);
                    Navigator.pop(context);
                    await Clipboard.setData(ClipboardData(text: _userName));
                    messenger.showSnackBar(
                      const SnackBar(
                        content: Text('تم نسخ اسم المستخدم'),
                      ),
                    );
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('الملف الشخصي'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: _showSettingsSheet,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const CircleAvatar(
              radius: 60,
              backgroundColor: AppColors.primary,
              child: Icon(Icons.person, size: 60, color: Colors.white),
            ),
            const SizedBox(height: 16),
            Text(
              _userName,
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                _roleLabel(_userRole),
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                  letterSpacing: 1.1,
                ),
              ),
            ),
            const SizedBox(height: 40),
            Row(
              children: [
                _buildStatCard(
                  'كوبونات نشطة',
                  _userRole == 'CUSTOMER' ? 'متاح' : '--',
                  Icons.confirmation_num,
                  Colors.orange,
                ),
                const SizedBox(width: 16),
                _buildStatCard(
                  'نوع الحساب',
                  _roleLabel(_userRole),
                  Icons.verified_user_outlined,
                  Colors.green,
                ),
              ],
            ),
            const SizedBox(height: 32),
            _buildMenuOption(
              Icons.favorite_outline,
              'المفضلات',
              _openFavorites,
            ),
            _buildMenuOption(
              Icons.notifications_outlined,
              'الإشعارات',
              _openNotifications,
            ),
            _buildMenuOption(
              Icons.help_outline,
              'مركز المساعدة',
              _showHelpDialog,
            ),
            _buildMenuOption(
              Icons.info_outline,
              'عن التطبيق',
              _showAboutDialogSheet,
            ),
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoggingOut ? null : _logout,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.error.withValues(alpha: 0.1),
                  foregroundColor: AppColors.error,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
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
                    : const Text(
                        'تسجيل الخروج',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
              ),
            ),
          ],
        ),
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

  Widget _buildMenuOption(
    IconData icon,
    String label,
    VoidCallback onTap,
  ) {
    return ListTile(
      onTap: onTap,
      leading: Icon(icon, color: AppColors.textPrimary),
      title: Text(
        label,
        style: const TextStyle(fontWeight: FontWeight.bold),
      ),
      trailing: const Icon(Icons.arrow_forward_ios, size: 14),
      contentPadding: const EdgeInsets.symmetric(vertical: 4),
    );
  }
}
