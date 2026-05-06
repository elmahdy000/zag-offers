import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_admin_app/features/users/presentation/bloc/users_bloc.dart';
import 'package:zag_offers_admin_app/features/users/presentation/pages/user_details_page.dart';
import 'package:zag_offers_admin_app/core/widgets/skeleton_loader.dart';

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
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'إدارة المستخدمين',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(70),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText:
                    'البحث بالاسم، الهاتف أو البريد...',
                prefixIcon: const Icon(Icons.search, color: Color(0xFFFF6B00)),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          context.read<UsersBloc>().add(const LoadUsersEvent());
                          setState(() {});
                        },
                      )
                    : null,
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide.none,
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide(
                    color: Colors.orange.withValues(alpha: 0.1),
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: const BorderSide(
                    color: Color(0xFFFF6B00),
                    width: 1,
                  ),
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
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
              const SnackBar(
                content: Text('تم حذف المستخدم بنجاح'),
                backgroundColor: Colors.green,
              ),
            );
          } else if (state is UsersError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.red,
              ),
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
                    Icon(
                      Icons.people_outline,
                      size: 64,
                      color: Colors.blueGrey[300],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'لم يتم العثور على مستخدمين',
                      style: GoogleFonts.cairo(color: Colors.blueGrey[500]),
                    ),
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
                  return Card(
                    elevation: 0,
                    color: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: BorderSide(
                        color: Colors.blueGrey[100]!.withValues(alpha: 0.5),
                      ),
                    ),
                    child: ListTile(
                      onTap: () {
                        Navigator.push<bool>(
                          context,
                          MaterialPageRoute(
                            builder: (_) => UserDetailsPage(user: user),
                          ),
                        ).then((shouldRefresh) {
                          if (shouldRefresh == true && context.mounted) {
                            context.read<UsersBloc>().add(LoadUsersEvent());
                          }
                        });
                      },
                      contentPadding: const EdgeInsets.all(16),
                      leading: CircleAvatar(
                        backgroundColor: const Color(0xFFFFF7ED),
                        child: Text(
                          user.name.isNotEmpty ? user.name[0] : '?',
                          style: const TextStyle(
                            color: Color(0xFFFF6B00),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      title: Text(
                        user.name,
                        style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user.phone,
                            style: GoogleFonts.inter(fontSize: 13),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(
                                Icons.stars,
                                size: 14,
                                color: Colors.amber,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '${user.points} نقطة',
                                style: GoogleFonts.cairo(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      trailing: const Icon(Icons.chevron_right),
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
                  Icon(Icons.error_outline, size: 48, color: Colors.red[300]),
                  const SizedBox(height: 12),
                  Text(
                    state.message,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(color: Colors.red[700]),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () =>
                        context.read<UsersBloc>().add(LoadUsersEvent()),
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

