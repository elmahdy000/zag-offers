import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_iconly/flutter_iconly.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/services/socket_service.dart';
import '../../../../core/widgets/network_image_widget.dart';
import '../../../../injection_container.dart';
import '../../../favorites/presentation/bloc/favorites_bloc.dart';
import '../../../favorites/presentation/pages/favorites_page.dart';
import '../../../home/presentation/pages/notifications_page.dart';
import '../../data/datasources/auth_local_data_source.dart';
import '../../domain/usecases/update_avatar_usecase.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../../../../core/utils/snackbar_utils.dart';
import 'login_page.dart';
import '../../../../core/theme/theme_cubit.dart';
import 'zag_rewards_page.dart';
import 'invite_friends_page.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  String _userName = '';
  String _userRole = '';
  String? _avatarUrl;
  int _points = 0;
  String _tier = 'BRONZE';
  String _referralCode = '';
  bool _isLoggingOut = false;
  bool _isUploadingAvatar = false;

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
    final avatar = await sl<AuthLocalDataSource>().getCachedAvatarUrl();
    final points = await sl<AuthLocalDataSource>().getPoints();
    final tier = await sl<AuthLocalDataSource>().getTier();
    final referralCode = await sl<AuthLocalDataSource>().getReferralCode();
    if (mounted) {
      setState(() {
        _userName = name ?? 'مستخدم Zag Offers';
        _userRole = role ?? 'CUSTOMER';
        _avatarUrl = avatar;
        _points = points;
        _tier = tier;
        _referralCode = referralCode ?? '';
      });
    }
  }

  Future<void> _pickAndUploadAvatar() async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(IconlyBroken.image),
                title: const Text('اختر من المعرض'),
                onTap: () => Navigator.pop(context, ImageSource.gallery),
              ),
              ListTile(
                leading: const Icon(IconlyBroken.camera),
                title: const Text('التقط صورة'),
                onTap: () => Navigator.pop(context, ImageSource.camera),
              ),
            ],
          ),
        ),
      ),
    );
    if (source == null || !mounted) return;
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: source, maxWidth: 512, maxHeight: 512);
    if (picked == null) return;
    setState(() => _isUploadingAvatar = true);
    final result = await sl<UpdateAvatarUseCase>().call(picked.path);
    if (!mounted) return;
    result.fold(
      (failure) {
        SnackBarUtils.showError(context, failure.message);
        setState(() => _isUploadingAvatar = false);
      },
      (url) {
        setState(() {
          _avatarUrl = url;
          _isUploadingAvatar = false;
        });
        SnackBarUtils.showSuccess(context, 'تم تغيير الصورة بنجاح');
      },
    );
  }

  Future<void> _logout() async {
    setState(() => _isLoggingOut = true);
    try {
      sl<SocketService>().dispose();
      // Dispatch through AuthBloc â€” it handles FCM token removal + cache clear
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

  void _openInviteFriends() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => InviteFriendsPage(referralCode: _referralCode),
      ),
    );
  }

  Future<void> _deleteAccount() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('حذف الحساب نهائياً'),
        content: const Text(
          'هل أنت متأكد من رغبتك في حذف الحساب؟ هذا الإجراء سيقوم بمسح كل بياناتك ولا يمكن التراجع عنه.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('إلغاء'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('نعم، احذف حسابي'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      setState(() => _isLoggingOut = true);
      context.read<AuthBloc>().add(DeleteAccountRequested());
    }
  }

  Future<void> _openPrivacyPolicy() async {
    try {
      final url = Uri.parse('https://zagoffers.online/privacy');
      final canLaunch = await canLaunchUrl(url);
      if (!mounted) return;
      if (canLaunch) {
        try {
          await launchUrl(url, mode: LaunchMode.externalApplication);
        } catch (_) {
          if (mounted) SnackBarUtils.showError(context, 'تعذر فتح الرابط');
        }
      } else {
        SnackBarUtils.showError(context, 'تعذر فتح سياسة الخصوصية');
      }
    } catch (e) {
      if (mounted) {
        SnackBarUtils.showError(context, 'تعذر فتح سياسة الخصوصية');
      }
    }
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
                  leading: const Icon(IconlyBroken.notification),
                  title: const Text('الإشعارات'),
                  onTap: () {
                    Navigator.pop(context);
                    _openNotifications();
                  },
                ),
                ListTile(
                  leading: const Icon(IconlyBroken.infoSquare),
                  title: const Text('مركز المساعدة'),
                  onTap: () {
                    Navigator.pop(context);
                    _showHelpDialog();
                  },
                ),
                ListTile(
                  leading: const Icon(IconlyBroken.infoCircle),
                  title: const Text('عن التطبيق'),
                  onTap: () {
                    Navigator.pop(context);
                    _showAboutDialogSheet();
                  },
                ),
                ListTile(
                  leading: const Icon(IconlyBroken.lock),
                  title: const Text('سياسة الخصوصية'),
                  onTap: () {
                    Navigator.pop(context);
                    _openPrivacyPolicy();
                  },
                ),
                ListTile(
                  leading: const Icon(IconlyBroken.delete, color: Colors.red),
                  title: const Text('حذف الحساب', style: TextStyle(color: Colors.red)),
                  onTap: () {
                    Navigator.pop(context);
                    _deleteAccount();
                  },
                ),
                ListTile(
                  leading: const Icon(IconlyBroken.document),
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
                          child: GestureDetector(
                            onTap: _isUploadingAvatar ? null : _pickAndUploadAvatar,
                            child: CircleAvatar(
                              radius: 50,
                              backgroundColor: Colors.white,
                              child: _isUploadingAvatar
                                  ? const SizedBox(
                                      width: 30,
                                      height: 30,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 3,
                                        color: AppColors.primary,
                                      ),
                                    )
                                  : _avatarUrl != null
                                      ? ClipRRect(
                                          borderRadius: BorderRadius.circular(50),
                                          child: NetworkImageWidget(
                                            imageUrl: _avatarUrl!,
                                            width: 100,
                                            height: 100,
                                            fit: BoxFit.cover,
                                          ),
                                        )
                                      : const Icon(IconlyBroken.profile, size: 50, color: AppColors.primary),
                            ),
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
                          IconlyBroken.ticketStar,
                          Colors.orange.shade600,
                        ),
                        const SizedBox(width: 16),
                        _buildStatCard(
                          'نوع الحساب',
                          _roleLabel(_userRole),
                          IconlyBroken.shieldDone,
                          const Color(0xFF10B981), // Emerald Green
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    _buildRewardsCard(context),
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

  Widget _buildRewardsCard(BuildContext context) {
    if (_userRole != 'CUSTOMER') return const SizedBox.shrink();
    
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    Color tierColor;
    switch (_tier.toUpperCase()) {
      case 'PLATINUM':
        tierColor = isDark ? const Color(0xFFE5E4E2) : const Color(0xFF555555);
        break;
      case 'GOLD':
        tierColor = const Color(0xFFFFD700);
        break;
      case 'SILVER':
        tierColor = const Color(0xFFC0C0C0);
        break;
      case 'BRONZE':
      default:
        tierColor = const Color(0xFFCD7F32);
        break;
    }

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ZagRewardsPage(
              points: _points,
              tier: _tier,
              userName: _userName,
            ),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: isDark 
                ? [const Color(0xFF1E1E1E), const Color(0xFF2D2D2D)]
                : [Colors.white, const Color(0xFFF9F9F9)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: tierColor.withValues(alpha: 0.15),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
          border: Border.all(
            color: tierColor.withValues(alpha: 0.3),
            width: 1.5,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: tierColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                IconlyBroken.star,
                color: tierColor,
                size: 32,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Zag Rewards',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        '$_points نقطة',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: tierColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: tierColor.withValues(alpha: 0.5)),
                        ),
                        child: Text(
                          _tier.toUpperCase(),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: tierColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const Icon(IconlyLight.arrowLeft2, size: 18, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  Widget _buildPremiumMenu(BuildContext context) {
    return Column(
      children: [
        BlocBuilder<ThemeCubit, ThemeMode>(
          builder: (context, themeMode) {
            final isDark = themeMode == ThemeMode.dark;
            return _buildMenuOption(
              icon: IconlyBroken.setting,
              label: isDark ? 'الوضع الفاتح' : 'الوضع الداكن',
              color: const Color(0xFF6366F1), // Indigo
              onTap: () {
                context.read<ThemeCubit>().toggleTheme();
              },
            );
          },
        ),
        _buildMenuOption(
          icon: IconlyBroken.heart,
          label: 'المفضلات',
          color: const Color(0xFFEC4899), // Pink
          onTap: _openFavorites,
        ),
        _buildMenuOption(
          icon: IconlyBroken.addUser,
          label: 'دعوة الأصدقاء',
          color: Colors.amber.shade600,
          onTap: _openInviteFriends,
        ),
        _buildMenuOption(
          icon: IconlyBroken.notification,
          label: 'الإشعارات',
          color: const Color(0xFF0EA5E9), // Sky Blue
          onTap: _openNotifications,
        ),
        _buildMenuOption(
          icon: IconlyBroken.infoSquare,
          label: 'مركز المساعدة',
          color: const Color(0xFF8B5CF6), // Purple
          onTap: _showHelpDialog,
        ),
        _buildMenuOption(
          icon: IconlyBroken.infoCircle,
          label: 'عن التطبيق',
          color: const Color(0xFF14B8A6), // Teal
          onTap: _showAboutDialogSheet,
        ),
        _buildMenuOption(
          icon: IconlyBroken.lock,
          label: 'سياسة الخصوصية',
          color: Colors.blueGrey,
          onTap: _openPrivacyPolicy,
        ),
        _buildMenuOption(
          icon: IconlyBroken.delete,
          label: 'حذف الحساب',
          color: const Color(0xFFEF4444), // Red
          onTap: _deleteAccount,
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
              Icon(IconlyLight.arrowLeft2, size: 16, color: theme.dividerColor),
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

