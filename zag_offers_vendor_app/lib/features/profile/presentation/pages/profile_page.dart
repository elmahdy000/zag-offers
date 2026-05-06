import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_vendor_app/core/theme/app_colors.dart';
import 'package:zag_offers_vendor_app/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:zag_offers_vendor_app/features/dashboard/presentation/bloc/dashboard_bloc.dart';
import 'package:zag_offers_vendor_app/features/profile/presentation/bloc/profile_bloc.dart';
import 'package:zag_offers_vendor_app/core/widgets/skeleton_loader.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  @override
  void initState() {
    super.initState();
    context.read<ProfileBloc>().add(GetProfileRequested());
    // Trigger dashboard fetch if not already loaded (to get store name)
    final dashState = context.read<DashboardBloc>().state;
    if (dashState is DashboardInitial) {
      context.read<DashboardBloc>().add(GetDashboardStatsRequested());
    }
  }

  // ── Password change dialog ─────────────────────────────────────────────────
  void _showChangePasswordDialog(BuildContext context) {
    final currentCtrl = TextEditingController();
    final newCtrl = TextEditingController();
    final confirmCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();
    bool obscureCurrent = true;
    bool obscureNew = true;
    bool obscureConfirm = true;

    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogCtx) {
        return BlocConsumer<ProfileBloc, ProfileState>(
          listener: (listenerCtx, state) {
            if (state is PasswordChanged) {
              currentCtrl.dispose();
              newCtrl.dispose();
              confirmCtrl.dispose();
              Navigator.of(dialogCtx).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('تم تغيير كلمة المرور بنجاح', style: GoogleFonts.cairo()),
                  backgroundColor: AppColors.success,
                  behavior: SnackBarBehavior.floating,
                ),
              );
            } else if (state is PasswordChangeError) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.message, style: GoogleFonts.cairo()),
                  backgroundColor: AppColors.error,
                  behavior: SnackBarBehavior.floating,
                ),
              );
            }
          },
          builder: (builderCtx, state) {
            final isChanging = state is PasswordChanging;
            return StatefulBuilder(
              builder: (_, setDialogState) {
                return AlertDialog(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                  title: Text(
                    'تغيير كلمة المرور',
                    style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
                  ),
                  content: Form(
                    key: formKey,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        TextFormField(
                          controller: currentCtrl,
                          obscureText: obscureCurrent,
                          enabled: !isChanging,
                          decoration: InputDecoration(
                            labelText: 'كلمة المرور الحالية',
                            labelStyle: GoogleFonts.cairo(),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            suffixIcon: IconButton(
                              icon: Icon(obscureCurrent ? Icons.visibility_off : Icons.visibility),
                              onPressed: () => setDialogState(() => obscureCurrent = !obscureCurrent),
                            ),
                          ),
                          validator: (v) {
                            if (v == null || v.isEmpty) return 'أدخل كلمة المرور الحالية';
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: newCtrl,
                          obscureText: obscureNew,
                          enabled: !isChanging,
                          decoration: InputDecoration(
                            labelText: 'كلمة المرور الجديدة',
                            labelStyle: GoogleFonts.cairo(),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            suffixIcon: IconButton(
                              icon: Icon(obscureNew ? Icons.visibility_off : Icons.visibility),
                              onPressed: () => setDialogState(() => obscureNew = !obscureNew),
                            ),
                          ),
                          validator: (v) {
                            if (v == null || v.length < 6) return 'يجب أن تكون 6 أحرف على الأقل';
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: confirmCtrl,
                          obscureText: obscureConfirm,
                          enabled: !isChanging,
                          decoration: InputDecoration(
                            labelText: 'تأكيد كلمة المرور',
                            labelStyle: GoogleFonts.cairo(),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            suffixIcon: IconButton(
                              icon: Icon(obscureConfirm ? Icons.visibility_off : Icons.visibility),
                              onPressed: () => setDialogState(() => obscureConfirm = !obscureConfirm),
                            ),
                          ),
                          validator: (v) {
                            if (v != newCtrl.text) return 'كلمتا المرور غير متطابقتين';
                            return null;
                          },
                        ),
                      ],
                    ),
                  ),
                  actions: [
                    TextButton(
                      onPressed: isChanging
                          ? null
                          : () {
                              currentCtrl.dispose();
                              newCtrl.dispose();
                              confirmCtrl.dispose();
                              Navigator.of(dialogCtx).pop();
                            },
                      child: Text('إلغاء', style: GoogleFonts.cairo()),
                    ),
                    ElevatedButton(
                      onPressed: isChanging
                          ? null
                          : () {
                              if (formKey.currentState?.validate() ?? false) {
                                context.read<ProfileBloc>().add(
                                      ChangePasswordRequested(
                                        currentPassword: currentCtrl.text.trim(),
                                        newPassword: newCtrl.text.trim(),
                                      ),
                                    );
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: isChanging
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : Text('تغيير', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                    ),
                  ],
                );
              },
            );
          },
        );
      },
    );
  }

  // ── Logout confirm ─────────────────────────────────────────────────────────
  void _showLogoutConfirm(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('تسجيل الخروج', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        content: Text('هل أنت متأكد من رغبتك في تسجيل الخروج؟', style: GoogleFonts.cairo()),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('إلغاء', style: GoogleFonts.cairo()),
          ),
          TextButton(
            onPressed: () {
              context.read<AuthBloc>().add(LogoutRequested());
              Navigator.pop(context);
            },
            child: Text('تسجيل الخروج', style: GoogleFonts.cairo(color: AppColors.error)),
          ),
        ],
      ),
    );
  }

  // ── Build ──────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'الملف الشخصي',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        backgroundColor: AppColors.background,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () => _showLogoutConfirm(context),
            icon: const Icon(Icons.logout_rounded, color: AppColors.error),
          ),
        ],
      ),
      body: BlocConsumer<ProfileBloc, ProfileState>(
        listener: (context, state) {
          // PasswordChanged / PasswordChangeError are handled inside the dialog's
          // own BlocConsumer to keep dialog-scope feedback clean.
        },
        builder: (context, state) {
          if (state is ProfileLoading) {
            return const Center(child: CardSkeleton());
          }

          if (state is ProfileError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
                    const SizedBox(height: 16),
                    Text(
                      state.message,
                      style: GoogleFonts.cairo(fontSize: 16, color: Colors.grey[700]),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () => context.read<ProfileBloc>().add(GetProfileRequested()),
                      icon: const Icon(Icons.refresh),
                      label: Text('إعادة المحاولة', style: GoogleFonts.cairo()),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          // Resolve user from any state that carries it
          final user = state is ProfileLoaded
              ? state.user
              : state is PasswordChanging
                  ? state.user
                  : state is PasswordChanged
                      ? state.user
                      : state is PasswordChangeError
                          ? state.user
                          : null;

          if (user == null) return const SizedBox();

          // Resolve store name from DashboardBloc
          return BlocBuilder<DashboardBloc, DashboardState>(
            builder: (context, dashState) {
              final storeName = dashState is DashboardLoaded
                  ? (dashState.stats.storeName ?? 'جارٍ التحميل...')
                  : 'جارٍ التحميل...';

              return SingleChildScrollView(
                padding: const EdgeInsets.only(
                    left: 24, right: 24, top: 24, bottom: 100),
                child: Column(
                  children: [
                    // ── Avatar ────────────────────────────────────────────
                    Center(
                      child: Stack(
                        children: [
                          Container(
                            width: 120,
                            height: 120,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: AppColors.primary, width: 4),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.primary.withValues(alpha: 0.2),
                                  blurRadius: 20,
                                  offset: const Offset(0, 10),
                                ),
                              ],
                            ),
                            child: const CircleAvatar(
                              backgroundColor: Colors.white,
                              child: Icon(Icons.person, size: 80, color: AppColors.primaryLight),
                            ),
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: const BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.edit, color: Colors.white, size: 20),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      user.name,
                      style: GoogleFonts.cairo(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      user.role == 'MERCHANT' ? 'تاجر معتمد' : 'مدير النظام',
                      style: GoogleFonts.cairo(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 40),

                    // ── Account info ──────────────────────────────────────
                    _buildInfoCard(
                      title: 'معلومات الحساب',
                      items: [
                        _buildInfoItem(
                            Icons.email_outlined, 'البريد الإلكتروني', user.email),
                        _buildInfoItem(
                            Icons.phone_android_outlined,
                            'رقم الهاتف',
                            user.phone?.isNotEmpty == true ? user.phone! : 'غير مسجل'),
                        _buildInfoItem(
                            Icons.verified_user_outlined, 'حالة الحساب', 'نشط'),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // ── Store info ────────────────────────────────────────
                    _buildInfoCard(
                      title: 'إعدادات المتجر',
                      items: [
                        _buildInfoItem(
                            Icons.storefront_outlined, 'اسم المتجر', storeName),
                        _buildInfoItem(
                            Icons.location_on_outlined, 'المنطقة', 'الزقازيق'),
                      ],
                    ),
                    const SizedBox(height: 40),

                    // ── Action buttons ────────────────────────────────────
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () => _showChangePasswordDialog(context),
                        icon: const Icon(Icons.lock_outline),
                        label: Text(
                          'تغيير كلمة المرور',
                          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
                        ),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          side: const BorderSide(color: AppColors.primary),
                          foregroundColor: AppColors.primary,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: TextButton.icon(
                        onPressed: () => _showLogoutConfirm(context),
                        icon: const Icon(Icons.logout_rounded, color: AppColors.error),
                        label: Text(
                          'تسجيل الخروج',
                          style: GoogleFonts.cairo(
                              fontWeight: FontWeight.bold, color: AppColors.error),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }

  // ── Helper widgets ─────────────────────────────────────────────────────────
  Widget _buildInfoCard({required String title, required List<Widget> items}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.cairo(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 16),
          ...items,
        ],
      ),
    );
  }

  Widget _buildInfoItem(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, size: 20, color: AppColors.primaryLight),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: GoogleFonts.cairo(
                      fontSize: 12, color: AppColors.textSecondary),
                ),
                Text(
                  value,
                  style: GoogleFonts.cairo(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
