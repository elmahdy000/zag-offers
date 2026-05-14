import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:zag_offers_admin_app/core/widgets/skeleton_loader.dart';
import 'package:zag_offers_admin_app/features/users/domain/entities/app_user.dart';
import 'package:zag_offers_admin_app/features/users/domain/entities/app_user_details.dart';
import 'package:zag_offers_admin_app/features/users/domain/repositories/user_repository.dart';
import 'package:zag_offers_admin_app/injection_container.dart';
import 'package:zag_offers_admin_app/core/theme/app_colors.dart';

class UserDetailsPage extends StatefulWidget {
  final AppUser user;

  const UserDetailsPage({super.key, required this.user});

  @override
  State<UserDetailsPage> createState() => _UserDetailsPageState();
}

class _UserDetailsPageState extends State<UserDetailsPage> {
  late Future<AppUserDetails> _detailsFuture;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _detailsFuture = _loadDetails();
  }

  Future<AppUserDetails> _loadDetails() async {
    final result = await sl<UserRepository>().getUserDetails(widget.user.id);
    return result.fold(
      (failure) => throw Exception(failure.message),
      (data) => data,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('تفاصيل المستخدم'),
      ),
      body: FutureBuilder<AppUserDetails>(
        future: _detailsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const CardSkeleton();
          }

          if (snapshot.hasError || !snapshot.hasData) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(40),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(color: AppColors.error.withValues(alpha: 0.1), shape: BoxShape.circle),
                      child: const Icon(Icons.error_outline_rounded, color: AppColors.error, size: 64),
                    ),
                    const SizedBox(height: 24),
                    Text('تعذر تحميل البيانات', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.textPrimary)),
                    const SizedBox(height: 12),
                    TextButton.icon(
                      onPressed: () => setState(() => _detailsFuture = _loadDetails()),
                      icon: const Icon(Icons.refresh_rounded),
                      label: const Text('إعادة المحاولة'),
                    ),
                  ],
                ),
              ),
            );
          }

          final user = snapshot.data!;
          return RefreshIndicator(
            onRefresh: () async {
              final future = _loadDetails();
              setState(() => _detailsFuture = future);
              await future;
            },
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppColors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4))],
                  ),
                  child: Column(
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), shape: BoxShape.circle),
                        child: Center(
                          child: Text(
                            user.name.isNotEmpty ? user.name[0] : '?',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 32, color: AppColors.primary),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(user.name, style: GoogleFonts.cairo(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                      const SizedBox(height: 4),
                      Text(user.phone, style: GoogleFonts.inter(color: AppColors.textSecondary, fontSize: 15)),
                      const SizedBox(height: 24),
                      Row(
                        children: [
                          _buildQuickStat(Icons.stars_rounded, user.points.toString(), 'نقاط'),
                          _buildQuickStat(Icons.storefront_rounded, user.storesCount.toString(), 'متاجر'),
                          _buildQuickStat(Icons.confirmation_number_rounded, user.couponsCount.toString(), 'كوبونات'),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                _infoCard('البيانات الأساسية', [
                  _row(Icons.email_outlined, 'البريد الإلكتروني', user.email ?? '-'),
                  _row(Icons.badge_outlined, 'الدور', user.role),
                  _row(Icons.location_on_outlined, 'المنطقة', user.area ?? '-'),
                  _row(Icons.calendar_today_rounded, 'تاريخ الانضمام', DateFormat('yyyy/MM/dd - hh:mm a', 'ar').format(user.createdAt)),
                ]),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _isSubmitting ? null : () => _showEditPointsDialog(user),
                        icon: const Icon(Icons.stars_outlined, size: 20),
                        label: const Text('تعديل النقاط'),
                        style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _isSubmitting ? null : () => _showChangeRoleDialog(user),
                        icon: const Icon(Icons.admin_panel_settings_outlined, size: 20),
                        label: const Text('تغيير الدور'),
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.indigo[50], foregroundColor: Colors.indigo, elevation: 0, padding: const EdgeInsets.symmetric(vertical: 14)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: TextButton.icon(
                    onPressed: _isSubmitting ? null : () => _showDeleteConfirmation(user),
                    icon: const Icon(Icons.delete_outline_rounded, color: AppColors.error),
                    label: const Text('حذف المستخدم نهائياً', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.bold)),
                    style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                  ),
                ),
                const SizedBox(height: 32),
                _sectionTitle('متاجر المستخدم', Icons.storefront_rounded),
                const SizedBox(height: 12),
                if (user.stores.isEmpty)
                  _emptyBox('لا يوجد متاجر مرتبطة بهذا المستخدم')
                else
                  ...user.stores.map((store) => _buildItemCard(Icons.store_rounded, store.name, 'الحالة: ${store.status} • العروض: ${store.offersCount}')),
                const SizedBox(height: 32),
                _sectionTitle('آخر الكوبونات', Icons.confirmation_number_rounded),
                const SizedBox(height: 12),
                if (user.recentCoupons.isEmpty)
                  _emptyBox('لا توجد كوبونات لهذا المستخدم')
                else
                  ...user.recentCoupons.map((coupon) => _buildItemCard(Icons.confirmation_num_rounded, coupon.code, '${coupon.offerTitle ?? "بدون عرض"} • ${coupon.status}\n${DateFormat('yyyy/MM/dd', 'ar').format(coupon.createdAt)}')),
                const SizedBox(height: 40),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildQuickStat(IconData icon, String value, String label) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, size: 22, color: AppColors.primary),
          const SizedBox(height: 8),
          Text(value, style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          Text(label, style: GoogleFonts.cairo(fontSize: 11, color: AppColors.textSecondary)),
        ],
      ),
    );
  }

  Widget _infoCard(String title, List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          const SizedBox(height: 20),
          ...children,
        ],
      ),
    );
  }

  Widget _row(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.textSecondary.withValues(alpha: 0.5)),
          const SizedBox(width: 12),
          Text(label, style: GoogleFonts.cairo(fontSize: 14, color: AppColors.textSecondary)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.primary),
        const SizedBox(width: 8),
        Text(title, style: GoogleFonts.cairo(fontSize: 17, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
      ],
    );
  }

  Widget _emptyBox(String text) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: AppColors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade100)),
      child: Text(text, textAlign: TextAlign.center, style: GoogleFonts.cairo(color: AppColors.textSecondary, fontSize: 13)),
    );
  }

  Widget _buildItemCard(IconData icon, String title, String subtitle) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(color: AppColors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade100)),
      child: ListTile(
        leading: Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(10)), child: Icon(icon, size: 20, color: AppColors.primary)),
        title: Text(title, style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary)),
        subtitle: Text(subtitle, style: GoogleFonts.cairo(fontSize: 12, color: AppColors.textSecondary)),
      ),
    );
  }

  Future<void> _showEditPointsDialog(AppUserDetails user) async {
    final controller = TextEditingController(text: user.points.toString());
    await showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('تعديل نقاط المستخدم'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'عدد النقاط الجديد'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('إلغاء')),
          ElevatedButton(
            onPressed: () async {
              final points = int.tryParse(controller.text.trim());
              if (points == null) return;
              Navigator.pop(dialogContext);
              await _updatePoints(points);
            },
            child: const Text('حفظ'),
          ),
        ],
      ),
    );
    controller.dispose();
  }

  Future<void> _updatePoints(int points) async {
    setState(() => _isSubmitting = true);
    final result = await sl<UserRepository>().updateUser(widget.user.id, points: points);
    if (!mounted) return;
    setState(() => _isSubmitting = false);

    result.fold(
      (failure) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(failure.message), backgroundColor: AppColors.error)),
      (_) async {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم تحديث النقاط بنجاح'), backgroundColor: AppColors.success));
        final future = _loadDetails();
        setState(() => _detailsFuture = future);
        await future;
      },
    );
  }

  Future<void> _showDeleteConfirmation(AppUserDetails user) async {
    final shouldDelete = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('حذف المستخدم'),
        content: Text('هل أنت متأكد من حذف ${user.name}؟ لا يمكن التراجع عن هذا الإجراء.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: const Text('إلغاء')),
          ElevatedButton(onPressed: () => Navigator.pop(dialogContext, true), style: ElevatedButton.styleFrom(backgroundColor: AppColors.error), child: const Text('حذف')),
        ],
      ),
    );

    if (shouldDelete == true) {
      await _deleteUser();
    }
  }

  Future<void> _showChangeRoleDialog(AppUserDetails user) async {
    String selectedRole = user.role;
    await showDialog(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setLocalState) => AlertDialog(
          title: const Text('تغيير دور المستخدم'),
          content: DropdownButtonFormField<String>(
            value: selectedRole,
            items: const [
              DropdownMenuItem(value: 'CUSTOMER', child: Text('CUSTOMER')),
              DropdownMenuItem(value: 'MERCHANT', child: Text('MERCHANT')),
              DropdownMenuItem(value: 'ADMIN', child: Text('ADMIN')),
            ],
            onChanged: (value) {
              if (value != null) setLocalState(() => selectedRole = value);
            },
            decoration: const InputDecoration(labelText: 'الدور'),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('إلغاء')),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(dialogContext);
                await _updateRole(selectedRole);
              },
              child: const Text('حفظ'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _updateRole(String role) async {
    setState(() => _isSubmitting = true);
    final result = await sl<UserRepository>().updateUserRole(widget.user.id, role);
    if (!mounted) return;
    setState(() => _isSubmitting = false);

    result.fold(
      (failure) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(failure.message), backgroundColor: AppColors.error)),
      (_) async {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم تحديث الدور بنجاح'), backgroundColor: AppColors.success));
        final future = _loadDetails();
        setState(() => _detailsFuture = future);
        await future;
      },
    );
  }

  Future<void> _deleteUser() async {
    setState(() => _isSubmitting = true);
    final result = await sl<UserRepository>().deleteUser(widget.user.id);
    if (!mounted) return;
    setState(() => _isSubmitting = false);

    result.fold(
      (failure) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(failure.message), backgroundColor: AppColors.error)),
      (_) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم حذف المستخدم بنجاح'), backgroundColor: AppColors.success));
        Navigator.pop(context, true);
      },
    );
  }
}
