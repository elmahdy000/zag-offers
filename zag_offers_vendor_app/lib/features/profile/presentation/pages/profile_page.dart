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
    final dashState = context.read<DashboardBloc>().state;
    if (dashState is DashboardInitial) {
      context.read<DashboardBloc>().add(GetDashboardStatsRequested());
    }
  }

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
                  backgroundColor: AppColors.card,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  title: Text(
                    'تغيير كلمة المرور',
                    style: GoogleFonts.cairo(fontWeight: FontWeight.w900, fontSize: 18, color: AppColors.textPrimary),
                  ),
                  content: Form(
                    key: formKey,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _buildPasswordField(
                          controller: currentCtrl,
                          label: 'كلمة المرور الحالية',
                          obscure: obscureCurrent,
                          enabled: !isChanging,
                          onToggle: () => setDialogState(() => obscureCurrent = !obscureCurrent),
                        ),
                        const SizedBox(height: 12),
                        _buildPasswordField(
                          controller: newCtrl,
                          label: 'كلمة المرور الجديدة',
                          obscure: obscureNew,
                          enabled: !isChanging,
                          onToggle: () => setDialogState(() => obscureNew = !obscureNew),
                          validator: (v) => (v == null || v.length < 6) ? 'يجب أن تكون 6 أحرف على الأقل' : null,
                        ),
                        const SizedBox(height: 12),
                        _buildPasswordField(
                          controller: confirmCtrl,
                          label: 'تأكيد كلمة المرور',
                          obscure: obscureConfirm,
                          enabled: !isChanging,
                          onToggle: () => setDialogState(() => obscureConfirm = !obscureConfirm),
                          validator: (v) => v != newCtrl.text ? 'كلمتا المرور غير متطابقتين' : null,
                        ),
                      ],
                    ),
                  ),
                  actions: [
                    TextButton(
                      onPressed: isChanging ? null : () => Navigator.of(dialogCtx).pop(),
                      child: Text('إلغاء', style: GoogleFonts.cairo(color: AppColors.textTertiary)),
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
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: isChanging
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : Text('تحديث', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, color: Colors.white)),
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

  Widget _buildPasswordField({
    required TextEditingController controller,
    required String label,
    required bool obscure,
    required bool enabled,
    required VoidCallback onToggle,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: obscure,
      enabled: enabled,
      style: GoogleFonts.cairo(fontSize: 14, color: AppColors.textPrimary),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: GoogleFonts.cairo(fontSize: 12, color: AppColors.textSecondary),
        filled: true,
        fillColor: AppColors.surface,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
        suffixIcon: IconButton(
          icon: Icon(obscure ? Icons.visibility_off_rounded : Icons.visibility_rounded, size: 20, color: AppColors.textTertiary),
          onPressed: onToggle,
        ),
      ),
      validator: validator ?? (v) => (v == null || v.isEmpty) ? 'مطلوب' : null,
    );
  }

  void _showLogoutConfirm(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('تسجيل الخروج', style: GoogleFonts.cairo(fontWeight: FontWeight.w900, fontSize: 18, color: AppColors.textPrimary)),
        content: Text('هل أنت متأكد من رغبتك في تسجيل الخروج؟', style: GoogleFonts.cairo(color: AppColors.textSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text('إلغاء', style: GoogleFonts.cairo(color: AppColors.textTertiary))),
          TextButton(
            onPressed: () {
              context.read<AuthBloc>().add(LogoutRequested());
              Navigator.pop(context);
            },
            child: Text('تسجيل الخروج', style: GoogleFonts.cairo(color: AppColors.error, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: BlocBuilder<ProfileBloc, ProfileState>(
        builder: (context, state) {
          if (state is ProfileLoading) return const Center(child: CardSkeleton());
          if (state is ProfileError) return _buildErrorState(state.message);

          // Identify the user from the state safely
          dynamic user;
          if (state is ProfileLoaded) user = state.user;
          else if (state is PasswordChanging) user = state.user;
          else if (state is PasswordChanged) user = state.user;
          else if (state is PasswordChangeError) user = state.user;

          if (user == null) {
             if (state is ProfileError) return _buildErrorState(state.message);
             return const Center(child: CardSkeleton());
          }

          return CustomScrollView(
            slivers: [
              // Profile Header
              SliverAppBar(
                expandedHeight: 200,
                pinned: true,
                backgroundColor: AppColors.background,
                elevation: 0,
                flexibleSpace: FlexibleSpaceBar(
                  background: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [AppColors.primary.withValues(alpha: 0.1), AppColors.background],
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(height: 40),
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: AppColors.primary, width: 2),
                            boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.2), blurRadius: 15)],
                          ),
                          child: const CircleAvatar(
                            backgroundColor: AppColors.surface,
                            child: Icon(Icons.person_rounded, size: 50, color: AppColors.primary),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          user.name,
                          style: GoogleFonts.cairo(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
                        ),
                        Text(
                          user.role == 'MERCHANT' ? 'تاجر معتمد' : 'مدير النظام',
                          style: GoogleFonts.cairo(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textTertiary),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Profile Content
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      _buildInfoSection(
                        'معلومات الحساب',
                        [
                          _buildInfoRow(Icons.phone_rounded, 'رقم الهاتف', user.phone ?? 'غير مسجل'),
                          _buildInfoRow(Icons.email_rounded, 'البريد الإلكتروني', user.email),
                        ],
                      ),
                      const SizedBox(height: 20),
                      BlocBuilder<DashboardBloc, DashboardState>(
                        builder: (context, dashState) {
                          final storeName = dashState is DashboardLoaded ? (dashState.stats.storeName ?? '...') : '...';
                          return _buildInfoSection(
                            'إعدادات المتجر',
                            [
                              _buildInfoRow(Icons.storefront_rounded, 'اسم المتجر', storeName),
                              _buildInfoRow(Icons.location_on_rounded, 'المنطقة', 'الزقازيق'),
                            ],
                          );
                        },
                      ),
                      const SizedBox(height: 40),
                      // Action Buttons
                      _buildActionButton(Icons.lock_rounded, 'تغيير كلمة المرور', AppColors.primary, () => _showChangePasswordDialog(context)),
                      const SizedBox(height: 12),
                      _buildActionButton(Icons.logout_rounded, 'تسجيل الخروج', AppColors.error, () => _showLogoutConfirm(context)),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildInfoSection(String title, List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: GoogleFonts.cairo(fontSize: 14, fontWeight: FontWeight.w900, color: AppColors.primary)),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.textTertiary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: GoogleFonts.cairo(fontSize: 10, color: AppColors.textTertiary)),
                Text(value, style: GoogleFonts.cairo(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(IconData icon, String label, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 20, color: color),
            const SizedBox(width: 10),
            Text(label, style: GoogleFonts.cairo(fontSize: 14, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline_rounded, size: 48, color: AppColors.error),
          const SizedBox(height: 16),
          Text(message, style: GoogleFonts.cairo(color: AppColors.textPrimary)),
          TextButton(onPressed: () => context.read<ProfileBloc>().add(GetProfileRequested()), child: const Text('إعادة المحاولة')),
        ],
      ),
    );
  }
}
