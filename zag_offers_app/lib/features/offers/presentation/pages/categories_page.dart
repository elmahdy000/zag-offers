import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:zag_offers_app/core/theme/app_colors.dart';
import 'package:zag_offers_app/core/widgets/network_image_widget.dart';
import 'package:zag_offers_app/core/widgets/glassmorphism_card.dart';
import 'package:zag_offers_app/core/utils/category_utils.dart';
import '../bloc/offers_bloc.dart';
import '../bloc/offers_state.dart';
import '../constants/offer_categories.dart';
import 'all_offers_page.dart';

class CategoriesPage extends StatelessWidget {
  const CategoriesPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        title: Text(
          'كل التصنيفات',
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white : AppColors.textPrimary,
          ),
        ),
        centerTitle: true,
        leading: Container(
          margin: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: theme.cardColor.withValues(alpha: 0.5),
            shape: BoxShape.circle,
          ),
          child: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
            onPressed: () => Navigator.pop(context),
          ),
        ),
      ),
      body: Stack(
        children: [
          // Background Gradient
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    AppColors.primary.withValues(alpha: 0.05),
                    theme.scaffoldBackgroundColor,
                  ],
                ),
              ),
            ),
          ),
          BlocBuilder<OffersBloc, OffersState>(
            builder: (context, state) {
              final List<dynamic> items;
              final bool isDynamic;

              if (state is OffersLoaded && state.categories.isNotEmpty) {
                items = state.categories;
                isDynamic = true;
              } else {
                items = browseCategories;
                isDynamic = false;
              }

              return CustomScrollView(
                physics: const BouncingScrollPhysics(),
                slivers: [
                  const SliverToBoxAdapter(child: SizedBox(height: 100)),
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 40),
                    sliver: SliverGrid(
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 14,
                        mainAxisSpacing: 14,
                        childAspectRatio: 0.85,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final String name;
                          final String? image;
                          final Color color;
                          final IconData icon;
                          final String? description;
                          final String filterName;

                          if (isDynamic) {
                            final cat = items[index];
                            name = CategoryUtils.getDisplayName(cat.name);
                            
                            // Fallback to local asset if backend image is null
                            final localCat = browseCategories.firstWhere(
                              (c) => c.backendName == cat.name || c.name == cat.name,
                              orElse: () => browseCategories[0],
                            );
                            
                            image = cat.image ?? localCat.imagePath;
                            color = CategoryUtils.getColor(cat.name);
                            icon = CategoryUtils.getIcon(cat.name);
                            description = null;
                            filterName = cat.name;
                          } else {
                            final cat = items[index];
                            name = cat.name;
                            image = cat.imagePath;
                            color = cat.color;
                            icon = cat.icon;
                            description = cat.description;
                            filterName = cat.backendName ?? cat.name;
                          }

                          return GlassmorphismCard(
                            borderRadius: 28,
                            opacity: isDark ? 0.4 : 0.7,
                            padding: EdgeInsets.zero,
                            borderColor: color.withValues(alpha: 0.2),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => AllOffersPage(
                                    initialCategory: filterName,
                                  ),
                                ),
                              );
                            },
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 84,
                                  height: 84,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    boxShadow: [
                                      BoxShadow(
                                        color: color.withValues(alpha: 0.2),
                                        blurRadius: 15,
                                        spreadRadius: 2,
                                      ),
                                    ],
                                  ),
                                  child: ClipOval(
                                    child: image != null
                                        ? (image.startsWith('http') || image.startsWith('/')
                                            ? NetworkImageWidget(
                                                imageUrl: image,
                                                fit: BoxFit.cover,
                                              )
                                            : Image.asset(
                                                image,
                                                fit: BoxFit.cover,
                                              ))
                                        : Container(
                                            color: color.withValues(alpha: 0.1),
                                            child: Icon(
                                              icon,
                                              color: color,
                                              size: 32,
                                            ),
                                          ),
                                  ),
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  name,
                                  style: theme.textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 16,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                if (description != null) ...[
                                  const SizedBox(height: 2),
                                  Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 12),
                                    child: Text(
                                      description,
                                      textAlign: TextAlign.center,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: theme.textTheme.labelSmall?.copyWith(
                                        color: AppColors.textSecondary,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 10,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          );
                        },
                        childCount: items.length,
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}
