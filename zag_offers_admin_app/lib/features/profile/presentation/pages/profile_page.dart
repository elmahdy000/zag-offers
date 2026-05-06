import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_admin_app/core/network/api_client.dart';
import 'package:zag_offers_admin_app/core/widgets/skeleton_loader.dart';
import 'package:zag_offers_admin_app/features/auth/domain/entities/admin_user.dart';
import 'package:zag_offers_admin_app/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:zag_offers_admin_app/injection_container.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'إعدادات الحساب',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
        ),
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
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: Colors.blueGrey[100]!),
                    ),
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 40,
                          backgroundColor: Colors.blue[50],
                          child: Text(
                            user.name.isNotEmpty ? user.name[0] : '؟',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Colors.blue[800],
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          user.name,
                          style: GoogleFonts.cairo(
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          user.phone,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: Colors.blueGrey[500],
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFF6B00).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            user.role,
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFFFF6B00),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),

                  // ── Profile management ───────────────────────────────────
                  _buildSectionTitle('إدارة الملف الشخصي'),
                  const SizedBox(height: 12),
                  _buildProfileAction(
                    context,
                    'تعديل البيانات',
                    Icons.edit_note_outlined,
                    const Color(0xFFFF6B00),
                    onTap: () => _showEditProfileDialog(context, user),
                  ),
                  const SizedBox(height: 12),
                  _buildProfileAction(
                    context,
                    'تغيير كلمة المرور',
                    Icons.lock_outline,
                    const Color(0xFFFF6B00),
                    onTap: () => _showChangePasswordDialog(context),
                  ),
                  const SizedBox(height: 32),

                  // ── System Status (live) ─────────────────────────────────
                  _buildSectionTitle('حالة النظام'),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.blueGrey[100]!),
                    ),
                    child: FutureBuilder<bool>(
                      future: sl<ApiClient>().checkHealth(),
                      builder: (context, snapshot) {
                        final isOnline = snapshot.data ?? false;
                        final isChecking =
                            snapshot.connectionState == ConnectionState.waiting;
                        return Column(
                          children: [
                            _buildHealthItem(
                              'خادم البيانات',
                              isChecking
                                  ? 'جاري التحقق...'
                                  : (isOnline ? 'متصل' : 'غير متصل'),
                              isOnline,
                              isChecking: isChecking,
                            ),
                            const Divider(height: 32),
                            _buildHealthItem(
                              'قاعدة البيانات',
                              'PostgreSQL',
                              isOnline,
                              isChecking: isChecking,
                            ),
                          ],
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 32),

                  // ── Logout ───────────────────────────────────────────────
                  _buildProfileAction(
                    context,
                    'تسجيل الخروج',
                    Icons.logout,
                    Colors.red,
                    onTap: () => context.read<AuthBloc>().add(LogoutEvent()),
                  ),
                ],
              ),
            );
          }
          return const CardSkeleton();
        },
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Align(
      alignment: Alignment.centerRight,
      child: Text(
        title,
        style: GoogleFonts.cairo(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          color: Colors.blueGrey[800],
        ),
      ),
    );
  }

  Widget _buildProfileAction(
    BuildContext context,
    String title,
    IconData icon,
    Color color, {
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.blueGrey[100]!),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 16),
            Text(
              title,
              style: GoogleFonts.cairo(
                fontWeight: FontWeight.bold,
                fontSize: 15,
              ),
            ),
            const Spacer(),
            Icon(
              Icons.arrow_forward_ios,
              size: 14,
              color: Colors.blueGrey[300],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHealthItem(
    String title,
    String subtitle,
    bool isOnline, {
    bool isChecking = false,
  }) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.cairo(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              Text(
                subtitle,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: Colors.blueGrey[500],
                ),
              ),
            ],
          ),
        ),
        if (isChecking)
          const SizedBox(
            width: 16,
            height: 16,
            child: CardSkeleton(),
          )
        else
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: isOnline ? Colors.green[50] : Colors.red[50],
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              isOnline ? 'نشط' : 'غير نشط',
              style: GoogleFonts.cairo(
                color: isOnline ? Colors.green[700] : Colors.red[700],
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
      ],
    );
  }

  void _showEditProfileDialog(BuildContext context, AdminUser user) {
    final nameController = TextEditingController(text: user.name);
    final areaController = TextEditingController();

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(
          'تعديل الملف الشخصي',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(
                labelText: 'الاسم الكامل',
              ),
            ),
            TextField(
              controller: areaController,
              decoration: const InputDecoration(labelText: 'المنطقة'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () {
              context.read<AuthBloc>().add(
                UpdateProfileEvent(
                  name: nameController.text,
                  area: areaController.text,
                ),
              );
              Navigator.pop(dialogContext);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFF6B00),
              foregroundColor: Colors.white,
            ),
            child: const Text('حفظ'),
          ),
        ],
      ),
    ).then((_) {
      nameController.dispose();
      areaController.dispose();
    });
  }

  void _showChangePasswordDialog(BuildContext context) {
    final currentPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(
          'تغيير كلمة المرور',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: currentPasswordController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'كلمة المرور الحالية',
              ),
            ),
            TextField(
              controller: newPasswordController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'كلمة المرور الجديدة',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () {
              context.read<AuthBloc>().add(
                UpdatePasswordEvent(
                  currentPassword: currentPasswordController.text,
                  newPassword: newPasswordController.text,
                ),
              );
              Navigator.pop(dialogContext);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFF6B00),
              foregroundColor: Colors.white,
            ),
            child: const Text('تحديث'),
          ),
        ],
      ),
    ).then((_) {
      currentPasswordController.dispose();
      newPasswordController.dispose();
    });
  }
}
