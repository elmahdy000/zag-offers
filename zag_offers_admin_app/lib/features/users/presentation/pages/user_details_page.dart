import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:zag_offers_admin_app/features/users/presentation/bloc/users_bloc.dart';
import 'package:zag_offers_admin_app/core/widgets/skeleton_loader.dart';
import 'package:zag_offers_admin_app/features/users/domain/entities/app_user.dart';
import 'package:zag_offers_admin_app/features/users/domain/entities/app_user_details.dart';
import 'package:zag_offers_admin_app/features/users/domain/repositories/user_repository.dart';
import 'package:zag_offers_admin_app/injection_container.dart';

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
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'تفاصيل المستخدم',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
        ),
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
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.error_outline,
                      color: Colors.red,
                      size: 46,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'تعذر تحميل تفاصيل المستخدم',
                      style: GoogleFonts.cairo(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () =>
                          setState(() => _detailsFuture = _loadDetails()),
                      child: const Text('إعادة المحاولة'),
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
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  color: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 30,
                          child: Text(
                            user.name.isNotEmpty ? user.name[0] : '?',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 20,
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          user.name,
                          style: GoogleFonts.cairo(
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          user.phone,
                          style: GoogleFonts.inter(color: Colors.blueGrey[600]),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                _infoCard('البيانات الأساسية', [
                  _row('البريد الإلكتروني', user.email ?? '-'),
                  _row('الدور', user.role),
                  _row('المنطقة', user.area ?? '-'),
                  _row('النقاط', user.points.toString()),
                  _row(
                    'تاريخ الانضمام',
                    DateFormat(
                      'yyyy/MM/dd - hh:mm a',
                      'ar',
                    ).format(user.createdAt),
                  ),
                ]),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _isSubmitting
                            ? null
                            : () => _showEditPointsDialog(user),
                        icon: const Icon(Icons.stars_outlined),
                        label: Text(
                          'تعديل النقاط',
                          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFF6B00),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _isSubmitting
                            ? null
                            : () => _showChangeRoleDialog(user),
                        icon: const Icon(Icons.admin_panel_settings_outlined),
                        label: Text(
                          'تغيير الدور',
                          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.indigo[50],
                          foregroundColor: Colors.indigo,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          elevation: 0,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _isSubmitting
                            ? null
                            : () => _showDeleteConfirmation(user),
                        icon: const Icon(Icons.delete_outline),
                        label: Text(
                          'حذف المستخدم',
                          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red[50],
                          foregroundColor: Colors.red,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          elevation: 0,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _infoCard('الإحصائيات', [
                  _row('عدد المتاجر', user.storesCount.toString()),
                  _row(
                    'عدد الكوبونات',
                    user.couponsCount.toString(),
                  ),
                  _row('عدد المفضلة', user.favoritesCount.toString()),
                  _row(
                    'عدد المراجعات',
                    user.reviewsCount.toString(),
                  ),
                ]),
                const SizedBox(height: 12),
                _sectionTitle('متاجر المستخدم'),
                const SizedBox(height: 8),
                if (user.stores.isEmpty)
                  _emptyBox(
                    'لا يوجد متاجر مرتبطة بهذا المستخدم',
                  )
                else
                  ...user.stores.map(
                    (store) => Card(
                      color: Colors.white,
                      child: ListTile(
                        leading: const Icon(Icons.storefront_outlined),
                        title: Text(
                          store.name,
                          style: GoogleFonts.cairo(fontWeight: FontWeight.w700),
                        ),
                        subtitle: Text(
                          'الحالة: ${store.status} • العروض: ${store.offersCount}',
                        ),
                      ),
                    ),
                  ),
                const SizedBox(height: 12),
                _sectionTitle('آخر الكوبونات'),
                const SizedBox(height: 8),
                if (user.recentCoupons.isEmpty)
                  _emptyBox(
                    'لا توجد كوبونات لهذا المستخدم',
                  )
                else
                  ...user.recentCoupons.map(
                    (coupon) => Card(
                      color: Colors.white,
                      child: ListTile(
                        leading: const Icon(Icons.confirmation_num_outlined),
                        title: Text(
                          coupon.code,
                          style: GoogleFonts.inter(fontWeight: FontWeight.w700),
                        ),
                        subtitle: Text(
                          '${coupon.offerTitle ?? "بدون عرض"} • ${coupon.status}\n${DateFormat('yyyy/MM/dd', 'ar').format(coupon.createdAt)}',
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _infoCard(String title, List<Widget> children) {
    return Card(
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: GoogleFonts.cairo(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 10),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: GoogleFonts.inter(color: Colors.blueGrey[600]),
            ),
          ),
          Text(value, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _sectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.bold),
    );
  }

  Widget _emptyBox(String text) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(text, style: GoogleFonts.cairo(color: Colors.blueGrey[600])),
    );
  }

  Future<void> _showEditPointsDialog(AppUserDetails user) async {
    final controller = TextEditingController(text: user.points.toString());
    await showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(
          'تعديل نقاط المستخدم',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
        ),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            labelText: 'عدد النقاط',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('إلغاء'),
          ),
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
    final result = await sl<UserRepository>().updateUser(
      widget.user.id,
      points: points,
    );
    if (!mounted) return;
    setState(() => _isSubmitting = false);

    result.fold(
      (failure) => ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(failure.message), backgroundColor: Colors.red),
      ),
      (_) async {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('تم تحديث النقاط بنجاح'),
            backgroundColor: Colors.green,
          ),
        );
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
        title: Text('حذف المستخدم', style: GoogleFonts.cairo()),
        content: Text(
          'هل أنت متأكد من حذف ${user.name}؟ لا يمكن التراجع عن هذا الإجراء.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('حذف'),
          ),
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
          title: Text('تغيير دور المستخدم', style: GoogleFonts.cairo()),
          content: DropdownButtonFormField<String>(
            initialValue: selectedRole,
            items: const [
              DropdownMenuItem(value: 'CUSTOMER', child: Text('CUSTOMER')),
              DropdownMenuItem(value: 'MERCHANT', child: Text('MERCHANT')),
              DropdownMenuItem(value: 'ADMIN', child: Text('ADMIN')),
            ],
            onChanged: (value) {
              if (value != null) {
                setLocalState(() => selectedRole = value);
              }
            },
            decoration: InputDecoration(
              labelText: 'الدور',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('إلغاء'),
            ),
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
    final result = await sl<UserRepository>().updateUserRole(
      widget.user.id,
      role,
    );
    if (!mounted) return;
    setState(() => _isSubmitting = false);

    result.fold(
      (failure) => ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(failure.message), backgroundColor: Colors.red),
      ),
      (_) async {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('تم تحديث الدور بنجاح'),
            backgroundColor: Colors.green,
          ),
        );
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
      (failure) => ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(failure.message), backgroundColor: Colors.red),
      ),
      (_) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('تم حذف المستخدم بنجاح'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true);
      },
    );
  }
}
