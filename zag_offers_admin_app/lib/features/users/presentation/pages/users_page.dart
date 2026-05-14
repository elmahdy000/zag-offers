import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_admin_app/features/users/presentation/bloc/users_bloc.dart';
import 'package:zag_offers_admin_app/features/users/presentation/pages/user_details_page.dart';
import 'package:zag_offers_admin_app/core/widgets/skeleton_loader.dart';
import 'package:zag_offers_admin_app/core/theme/app_colors.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_iconly/flutter_iconly.dart';

class UsersPage extends StatefulWidget {
  const UsersPage({super.key});

  @override
  State<UsersPage> createState() => _UsersPageState();
}

class _UsersPageState extends State<UsersPage> {
  final _searchController = TextEditingController();
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    context.read<UsersBloc>().add(LoadUsersEvent());
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      context.read<UsersBloc>().add(LoadUsersEvent(search: value.trim().isEmpty ? null : value.trim()));
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('مركز إدارة المستخدمين'),
      ),
      body: BlocConsumer<UsersBloc, UsersState>(
        listenWhen: (_, state) => state is UserDeleted || state is UsersError,
        listener: (context, state) {
          if (state is UserDeleted) {
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم حذف المستخدم بنجاح'), backgroundColor: AppColors.success));
          } else if (state is UsersError) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.message), backgroundColor: AppColors.error));
          }
        },
        builder: (context, state) {
          return Column(
            children: [
              // --- Dashboard Header ---
              _buildDashboardHeader(state),
              
              // --- Search Bar ---
              Padding(
                padding: const EdgeInsets.all(16),
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'ابحث بالاسم، الهاتف...',
                    prefixIcon: const Icon(IconlyLight.search, color: AppColors.primary),
                    filled: true,
                    fillColor: AppColors.white,
                  ),
                  onChanged: _onSearchChanged,
                ),
              ),

              Expanded(
                child: _buildBody(state),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildDashboardHeader(UsersState state) {
    int totalUsers = 0;
    int totalPoints = 0;
    if (state is UsersLoaded) {
      totalUsers = state.totalCount;
      for (var u in state.users) {
        totalPoints += u.points;
      }
    }

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(32)),
        boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))],
      ),
      child: Row(
        children: [
          Expanded(child: _buildSummaryCard('إجمالي المستخدمين', totalUsers.toString(), IconlyBold.user2, AppColors.primary)),
          const SizedBox(width: 12),
          Expanded(child: _buildSummaryCard('إجمالي النقاط', totalPoints.toString(), IconlyBold.star, Colors.amber)),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(height: 8),
          Text(value, style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          Text(label, style: GoogleFonts.cairo(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildBody(UsersState state) {
    if (state is UsersLoading) return const ListSkeleton(itemCount: 5);
    if (state is UsersError) return _buildErrorState(state.message);
    if (state is UsersLoaded) {
      if (state.users.isEmpty) return _buildEmptyState();
      return RefreshIndicator(
        onRefresh: () async => context.read<UsersBloc>().add(LoadUsersEvent()),
        child: ListView.separated(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
          itemCount: state.users.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final user = state.users[index];
            return _buildUserTile(user).animate().fadeIn(delay: (index * 50).ms).slideX(begin: 0.1);
          },
        ),
      );
    }
    return const SizedBox();
  }

  Widget _buildUserTile(dynamic user) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10, offset: const Offset(0, 4))],
        border: Border.all(color: Colors.grey.shade50),
      ),
      child: ListTile(
        onTap: () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => UserDetailsPage(user: user))).then((r) {
            if (r == true) context.read<UsersBloc>().add(LoadUsersEvent());
          });
        },
        contentPadding: const EdgeInsets.all(16),
        leading: Hero(
          tag: 'user-${user.id}',
          child: Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [AppColors.primary, AppColors.primary.withValues(alpha: 0.7)], begin: Alignment.topLeft, end: Alignment.bottomRight),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Center(child: Text(user.name.isNotEmpty ? user.name[0] : '?', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 22))),
          ),
        ),
        title: Text(user.name, style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 15)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(IconlyLight.call, size: 12, color: AppColors.textSecondary),
                const SizedBox(width: 4),
                Text(user.phone, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
              ],
            ),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(color: Colors.amber.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
              child: Text('${user.points} نقطة', style: GoogleFonts.cairo(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.amber.shade900)),
            ),
          ],
        ),
        trailing: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: AppColors.background, shape: BoxShape.circle),
          child: const Icon(IconlyLight.arrowLeft2, size: 12, color: AppColors.textSecondary),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(child: Text('لا يوجد مستخدمين حالياً', style: GoogleFonts.cairo(color: AppColors.textSecondary)));
  }

  Widget _buildErrorState(String msg) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline_rounded, color: AppColors.error, size: 40),
          const SizedBox(height: 16),
          Text(msg, style: GoogleFonts.cairo(color: AppColors.textSecondary)),
          TextButton(onPressed: () => context.read<UsersBloc>().add(LoadUsersEvent()), child: const Text('إعادة المحاولة')),
        ],
      ),
    );
  }
}
