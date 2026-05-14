import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_admin_app/core/network/api_client.dart';
import 'package:zag_offers_admin_app/core/widgets/skeleton_loader.dart';
import 'package:zag_offers_admin_app/features/auth/domain/entities/admin_user.dart';
import 'package:zag_offers_admin_app/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:zag_offers_admin_app/injection_container.dart';
import 'package:zag_offers_admin_app/core/theme/app_colors.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_iconly/flutter_iconly.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('إعدادات الحساب'),
      ),
      body: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, state) {
          if (state is AuthAuthenticated) {
            final user = state.user;
            return SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  // ── User card ────────────────────────────────────────────
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(
                      color: AppColors.white,
                      borderRadius: BorderRadius.circular(32),
                      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 20, offset: const Offset(0, 10))],
                    ),
                    child: Column(
                      children: [
                        Stack(
                          alignment: Alignment.bottomRight,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(colors: [AppColors.primary, Color(0xFF6C5CE7)]),
                                shape: BoxShape.circle,
                              ),
                              child: CircleAvatar(
                                radius: 50,
                                backgroundColor: AppColors.background,
                                child: Text(
                                  user.name.isNotEmpty ? user.name[0] : '؟',
                                  style: GoogleFonts.cairo(fontSize: 32, fontWeight: FontWeight.w900, color: AppColors.primary),
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(color: AppColors.success, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 3)),
                              child: const Icon(Icons.check_rounded, color: Colors.white, size: 16),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        Text(user.name, style: GoogleFonts.cairo(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.textPrimary)),
                        Text(user.phone, style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                          decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                          child: Text(user.role, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w900, color: AppColors.primary, letterSpacing: 0.5)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 40),

                  // ── Profile management ───────────────────────────────────
                  _buildSectionHeader('إدارة الملف الشخصي', IconlyLight.profile),
                  const SizedBox(height: 16),
                  _buildProfileAction(context, 'تعديل البيانات', IconlyLight.edit, AppColors.primary, onTap: () => _showEditProfileDialog(context, user)),
                  const SizedBox(height: 12),
                  _buildProfileAction(context, 'تغيير كلمة المرور', IconlyLight.lock, AppColors.primary, onTap: () => _showChangePasswordDialog(context)),
                  const SizedBox(height: 40),

                  // ── System Status (live) ─────────────────────────────────
                  _buildSectionHeader('حالة النظام والخدمات', IconlyLight.activity),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(color: AppColors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.grey.shade100)),
                    child: FutureBuilder<bool>(
                      future: sl<ApiClient>().checkHealth(),
                      builder: (context, snapshot) {
                        final isOnline = snapshot.data ?? false;
                        final isChecking = snapshot.connectionState == ConnectionState.waiting;
                        return Column(
                          children: [
                            _buildHealthItem('سيرفر البيانات (API)', isChecking ? 'جاري الفحص...' : (isOnline ? 'يعمل بشكل ممتاز' : 'غير قادر على الاتصال'), isOnline, isChecking: isChecking),
                            const Padding(padding: EdgeInsets.symmetric(vertical: 16), child: Divider(height: 1)),
                            _buildHealthItem('قاعدة البيانات (DB)', 'PostgreSQL / AWS', isOnline, isChecking: isChecking),
                          ],
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 48),

                  // ── Logout ───────────────────────────────────────────────
                  SizedBox(
                    width: double.infinity,
                    child: TextButton.icon(
                      onPressed: () => context.read<AuthBloc>().add(LogoutEvent()),
                      icon: const Icon(IconlyLight.logout, color: AppColors.error),
                      label: Text('تسجيل خروج من لوحة التحكم', style: GoogleFonts.cairo(color: AppColors.error, fontWeight: FontWeight.bold)),
                      style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            );
          }
          return const CardSkeleton();
        },
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.textSecondary.withValues(alpha: 0.5)),
        const SizedBox(width: 8),
        Text(title, style: GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.w900, color: AppColors.textPrimary)),
      ],
    );
  }

  Widget _buildProfileAction(BuildContext context, String title, IconData icon, Color color, {required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(color: AppColors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.grey.shade100)),
        child: Row(
          children: [
            Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)), child: Icon(icon, color: color, size: 20)),
            const SizedBox(width: 16),
            Text(title, style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.textPrimary)),
            const Spacer(),
            Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.textSecondary.withValues(alpha: 0.3)),
          ],
        ),
      ),
    );
  }

  Widget _buildHealthItem(String title, String subtitle, bool isOnline, {bool isChecking = false}) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary)),
              Text(subtitle, style: GoogleFonts.cairo(fontSize: 12, color: AppColors.textSecondary)),
            ],
          ),
        ),
        if (isChecking)
          const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
        else
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(color: isOnline ? AppColors.success : AppColors.error, shape: BoxShape.circle, boxShadow: [BoxShadow(color: (isOnline ? AppColors.success : AppColors.error).withValues(alpha: 0.4), blurRadius: 6, spreadRadius: 1)]),
          ),
      ],
    );
  }

  void _showEditProfileDialog(BuildContext context, AdminUser user) {
    final nameController = TextEditingController(text: user.name);
    final areaController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: Container(
          decoration: const BoxDecoration(color: AppColors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('تعديل البيانات', style: GoogleFonts.cairo(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
              const SizedBox(height: 24),
              TextField(controller: nameController, decoration: const InputDecoration(hintText: 'الاسم الكامل', prefixIcon: Icon(IconlyLight.profile))),
              const SizedBox(height: 16),
              TextField(controller: areaController, decoration: const InputDecoration(hintText: 'المنطقة', prefixIcon: Icon(IconlyLight.location))),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    context.read<AuthBloc>().add(UpdateProfileEvent(name: nameController.text, area: areaController.text));
                    Navigator.pop(context);
                  },
                  child: const Text('حفظ التعديلات'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showChangePasswordDialog(BuildContext context) {
    final currentPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: Container(
          decoration: const BoxDecoration(color: AppColors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('تغيير كلمة المرور', style: GoogleFonts.cairo(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
              const SizedBox(height: 24),
              TextField(controller: currentPasswordController, obscureText: true, decoration: const InputDecoration(hintText: 'كلمة المرور الحالية', prefixIcon: Icon(IconlyLight.lock))),
              const SizedBox(height: 16),
              TextField(controller: newPasswordController, obscureText: true, decoration: const InputDecoration(hintText: 'كلمة المرور الجديدة', prefixIcon: Icon(IconlyLight.lock))),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    context.read<AuthBloc>().add(UpdatePasswordEvent(currentPassword: currentPasswordController.text, newPassword: newPasswordController.text));
                    Navigator.pop(context);
                  },
                  child: const Text('تحديث كلمة المرور'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
