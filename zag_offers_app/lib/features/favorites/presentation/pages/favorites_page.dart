import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:zag_offers_app/core/theme/app_colors.dart';
import 'package:zag_offers_app/features/favorites/presentation/bloc/favorites_bloc.dart';
import 'package:zag_offers_app/features/offers/presentation/pages/offer_detail_page.dart';
import 'package:zag_offers_app/features/offers/presentation/widgets/offer_card.dart';

class FavoritesPage extends StatefulWidget {
  const FavoritesPage({super.key});

  @override
  State<FavoritesPage> createState() => _FavoritesPageState();
}

class _FavoritesPageState extends State<FavoritesPage> {
  @override
  void initState() {
    super.initState();
    final state = context.read<FavoritesBloc>().state;
    if (state is! FavoritesLoaded) {
      context.read<FavoritesBloc>().add(FetchFavorites());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          'المفضلة',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
      ),
      body: BlocBuilder<FavoritesBloc, FavoritesState>(
        builder: (context, state) {
          if (state is FavoritesLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state is FavoritesLoaded) {
            final favorites = state.favorites;

            if (favorites.isEmpty) {
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
                          Icons.favorite_border_rounded,
                          size: 64,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'قائمة المفضلة فارغة',
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w900,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'ابدأ بإضافة العروض التي تعجبك لتجدها هنا بسهولة في أي وقت.',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }

            return RefreshIndicator(
              onRefresh: () async {
                context.read<FavoritesBloc>().add(FetchFavorites());
              },
              child: GridView.builder(
                padding: const EdgeInsets.all(16),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 16,
                  childAspectRatio: 0.70,
                ),
                itemCount: favorites.length,
                itemBuilder: (context, index) {
                  final offer = favorites[index];
                  return OfferCard(
                    offer: offer,
                    isWide: true,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => OfferDetailPage(offer: offer),
                      ),
                    ),
                  );
                },
              ),
            );
          }

          if (state is FavoritesError) {
            final isConnectionError = state.message.toLowerCase().contains('connection') || 
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
                        isConnectionError ? Icons.wifi_off_rounded : Icons.error_outline_rounded,
                        size: 64,
                        color: AppColors.error,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      isConnectionError ? 'مشكلة في الاتصال' : 'تعذر تحميل المفضلة',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w900,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      isConnectionError 
                          ? 'يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى'
                          : state.message,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 32),
                    SizedBox(
                      width: 200,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: () => context.read<FavoritesBloc>().add(FetchFavorites()),
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
                            const SizedBox(width: 8),
                            Text(
                              'إعادة المحاولة',
                              style: TextStyle(fontWeight: FontWeight.bold),
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
}
