import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_admin_app/features/users/presentation/bloc/users_bloc.dart';
import 'package:zag_offers_admin_app/features/users/presentation/pages/user_details_page.dart';
import 'package:zag_offers_admin_app/core/widgets/skeleton_loader.dart';
import 'package:zag_offers_admin_app/core/theme/app_colors.dart';

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
      context.read<UsersBloc>().add(
        LoadUsersEvent(search: value.trim().isEmpty ? null : value.trim()),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('إدارة المستخدمين'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(80),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'البحث بالاسم، الهاتف أو البريد...',
                prefixIcon: const Icon(Icons.search_rounded, color: AppColors.primary),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear_rounded),
                        onPressed: () {
                          _searchController.clear();
                          context.read<UsersBloc>().add(const LoadUsersEvent());
                          setState(() {});
                        },
                      )
                    : null,
              ),
              onChanged: (value) {
                setState(() {});
                _onSearchChanged(value);
              },
            ),
          ),
        ),
      ),
      body: BlocConsumer<UsersBloc, UsersState>(
        listenWhen: (_, state) => state is UserDeleted || state is UsersError,
        listener: (context, state) {
          if (state is UserDeleted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('تم حذف المستخدم بنجاح'), backgroundColor: AppColors.success),
            );
          } else if (state is UsersError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: AppColors.error),
            );
          }
        },
        buildWhen: (_, state) =>
            state is UsersInitial ||
            state is UsersLoading ||
            state is UsersLoaded ||
            state is UsersError,
        builder: (context, state) {
          if (state is UsersLoading) {
            return const ListSkeleton(itemCount: 5);
          } else if (state is UsersLoaded) {
            if (state.users.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), shape: BoxShape.circle),
                      child: Icon(Icons.people_rounded, size: 64, color: AppColors.primary.withValues(alpha: 0.7)),
                    ),
                    const SizedBox(height: 24),
                    Text('لم يتم العثور على مستخدمين', style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                  ],
                ),
              );
            }
            return RefreshIndicator(
              onRefresh: () async {
                _searchController.clear();
                context.read<UsersBloc>().add(LoadUsersEvent());
                setState(() {});
              },
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: state.users.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final user = state.users[index];
                  return Container(
                    decoration: BoxDecoration(
                      color: AppColors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4))],
                    ),
                    child: ListTile(
                      onTap: () {
                        Navigator.push<bool>(
                          context,
                          MaterialPageRoute(builder: (_) => UserDetailsPage(user: user)),
                        ).then((shouldRefresh) {
                          if (shouldRefresh == true && context.mounted) {
                            context.read<UsersBloc>().add(LoadUsersEvent());
                          }
                        });
                      },
                      contentPadding: const EdgeInsets.all(16),
                      leading: Container(
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(16)),
                        child: Center(
                          child: Text(
                            user.name.isNotEmpty ? user.name[0] : '?',
                            style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 20),
                          ),
                        ),
                      ),
                      title: Text(user.name, style: GoogleFonts.cairo(fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 4),
                          Text(user.phone, style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary)),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              const Icon(Icons.stars_rounded, size: 16, color: Colors.amber),
                              const SizedBox(width: 6),
                              Text('${user.points} نقطة', style: GoogleFonts.cairo(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                            ],
                          ),
                        ],
                      ),
                      trailing: Icon(Icons.arrow_forward_ios_rounded, size: 16, color: AppColors.textSecondary.withValues(alpha: 0.3)),
                    ),
                  );
                },
              ),
            );
          } else if (state is UsersError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline_rounded, size: 48, color: AppColors.error),
                  const SizedBox(height: 12),
                  Text(state.message, style: GoogleFonts.cairo(color: AppColors.textSecondary)),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => context.read<UsersBloc>().add(LoadUsersEvent()),
                    child: const Text('إعادة المحاولة'),
                  ),
                ],
              ),
            );
          }
          return const SizedBox();
        },
      ),
    );
  }
}
