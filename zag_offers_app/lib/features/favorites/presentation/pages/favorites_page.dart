import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:zag_offers_app/core/theme/app_colors.dart';
import 'package:zag_offers_app/features/auth/data/datasources/auth_local_data_source.dart';
import 'package:zag_offers_app/features/favorites/presentation/bloc/favorites_bloc.dart';
import 'package:zag_offers_app/features/offers/presentation/pages/offer_detail_page.dart';
import 'package:zag_offers_app/features/offers/presentation/widgets/offer_card.dart';
import 'package:zag_offers_app/features/auth/presentation/pages/login_page.dart';
import 'package:zag_offers_app/injection_container.dart' as di;
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_app/core/widgets/bouncy_tap.dart';
import 'package:zag_offers_app/core/utils/navigation_service.dart';
import 'package:zag_offers_app/features/home/presentation/pages/main_screen.dart';

class FavoritesPage extends StatefulWidget {
  const FavoritesPage({super.key});

  @override
  State<FavoritesPage> createState() => _FavoritesPageState();
}

class _FavoritesPageState extends State<FavoritesPage> {
  static final _loginDescStyle =
      GoogleFonts.cairo(color: AppColors.textSecondary, height: 1.5);
  static final _loginBtnStyle =
      GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16);

  bool _isLoggedIn = false;

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final authLocal = di.sl<AuthLocalDataSource>();
    final token = await authLocal.getToken();
    if (!mounted) return;
    if (token != null && token.isNotEmpty) {
      setState(() => _isLoggedIn = true);
      final state = context.read<FavoritesBloc>().state;
      if (state is! FavoritesLoaded) {
        context.read<FavoritesBloc>().add(FetchFavorites());
      }
    } else {
      setState(() => _isLoggedIn = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: const Icon(
                  Icons.arrow_back_ios_new_rounded,
                  size: 20,
                ),
                onPressed: () => Navigator.pop(context),
              )
            : null,
        title: const Text(
          'المفضلة',
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
        centerTitle: true,
      ),
      body: !_isLoggedIn
          ? _buildLoginRequired()
          : BlocBuilder<FavoritesBloc, FavoritesState>(
              buildWhen: (prev, next) =>
                  next is FavoritesLoaded ||
                  next is FavoritesLoading ||
                  next is FavoritesError,
              builder: (context, state) {
                final theme = Theme.of(context);
                if (state is FavoritesLoading) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (state is FavoritesLoaded) {
                  final favorites = state.favorites;

                  if (favorites.isEmpty) {
                    return RefreshIndicator(
                      onRefresh: () async {
                        context.read<FavoritesBloc>().add(FetchFavorites());
                      },
                      child: SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.fromLTRB(40, 60, 40, 120),
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(32),
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withValues(alpha: 0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: Stack(
                                  alignment: Alignment.center,
                                  children: [
                                    Icon(
                                      Icons.favorite_rounded,
                                      size: 80,
                                      color: AppColors.primary
                                          .withValues(alpha: 0.2),
                                    ),
                                    const Icon(
                                      Icons.favorite_outline_rounded,
                                      size: 40,
                                      color: AppColors.primary,
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 32),
                              Text(
                                'قائمة المفضلة فارغة',
                                style: theme.textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                'ابدأ بإضافة العروض التي تعجبك لتجدها هنا بسهولة في أي وقت.',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: AppColors.textSecondary,
                                  height: 1.6,
                                  fontSize: 15,
                                ),
                              ),
                              const SizedBox(height: 32),
                              BouncyTap(
                                onTap: () {
                                  Navigator.popUntil(context, (route) => route.isFirst);
                                  Future.delayed(const Duration(milliseconds: 150), () {
                                    final rootContext = NavigationService.navigatorKey.currentContext;
                                    if (rootContext != null && rootContext.mounted) {
                                      MainScreen.of(rootContext)?.setSelectedIndex(1);
                                    }
                                  });
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 32, vertical: 14),
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(
                                      colors: [AppColors.primary, AppColors.secondary],
                                    ),
                                    borderRadius: BorderRadius.circular(16),
                                    boxShadow: [
                                      BoxShadow(
                                        color: AppColors.primary.withValues(alpha: 0.3),
                                        blurRadius: 16,
                                        offset: const Offset(0, 6),
                                      ),
                                    ],
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.local_offer_rounded,
                                          color: Colors.white, size: 20),
                                      SizedBox(width: 8),
                                      Text(
                                        'استكشف العروض الآن',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 15,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }

                  final screenWidth = MediaQuery.sizeOf(context).width;
                  final int crossAxisCount = screenWidth > 900
                      ? 4
                      : screenWidth > 600
                          ? 3
                          : screenWidth < 340
                              ? 1
                              : 2;
                  final double childAspectRatio = crossAxisCount == 1
                      ? 0.88
                      : screenWidth > 600
                          ? 0.76
                          : screenWidth < 360
                              ? 0.56
                              : 0.58;

                  return RefreshIndicator(
                    onRefresh: () async {
                      context.read<FavoritesBloc>().add(FetchFavorites());
                    },
                    child: GridView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
                      gridDelegate:
                          SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: crossAxisCount,
                        mainAxisSpacing: 16,
                        crossAxisSpacing: 16,
                        childAspectRatio: childAspectRatio,
                      ),
                      itemCount: favorites.length,
                      itemBuilder: (context, index) {
                        final offer = favorites[index];
                        final cardHeroTag = 'fav_offers_${offer.id}_$index';
                        return OfferCard(
                          offer: offer,
                          isWide: true,
                          heroTag: cardHeroTag,
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => OfferDetailPage(
                                offer: offer,
                                heroTag: cardHeroTag,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  );
                }

                if (state is FavoritesError) {
                  final isConnectionError =
                      state.message.toLowerCase().contains('connection') ||
                          state.message.toLowerCase().contains('network') ||
                          state.message.toLowerCase().contains('socket');

                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(40),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              color: AppColors.error.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              isConnectionError
                                  ? Icons.wifi_off_rounded
                                  : Icons.error_outline_rounded,
                              size: 64,
                              color: AppColors.error,
                            ),
                          ),
                          const SizedBox(height: 24),
                          Text(
                            isConnectionError
                                ? 'مشكلة في الاتصال'
                                : 'تعذر تحميل المفضلة',
                            style: theme.textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            isConnectionError
                                ? 'يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى'
                                : state.message,
                            textAlign: TextAlign.center,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: AppColors.textSecondary,
                              height: 1.5,
                            ),
                          ),
                          const SizedBox(height: 32),
                          SizedBox(
                            width: 200,
                            height: 50,
                            child: ElevatedButton(
                              onPressed: () => context
                                  .read<FavoritesBloc>()
                                  .add(FetchFavorites()),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                elevation: 0,
                              ),
                              child: const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.refresh_rounded, size: 20),
                                  SizedBox(width: 8),
                                  Text(
                                    'إعادة المحاولة',
                                    style:
                                        TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                return const SizedBox();
              },
            ),
    );
  }

  Widget _buildLoginRequired() {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.lock_outline_rounded,
                size: 64,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'سجل دخولك أولاً',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'يجب تسجيل الدخول لتتمكن من إضافة العروض للمفضلة والوصول إليها في أي وقت.',
              textAlign: TextAlign.center,
              style: _loginDescStyle,
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const LoginPage()),
                ).then((_) => _checkAuth()),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 0,
                ),
                child: Text(
                  'تسجيل الدخول',
                  style: _loginBtnStyle,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
