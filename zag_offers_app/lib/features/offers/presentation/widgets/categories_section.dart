import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/network_image_widget.dart';
import '../../../../core/utils/category_utils.dart';
import '../../domain/entities/category_entity.dart';
import '../constants/offer_categories.dart';
import '../pages/all_offers_page.dart';
import '../pages/categories_page.dart';

class CategoriesSection extends StatelessWidget {
  final List<CategoryEntity> categories;

  const CategoriesSection({
    super.key,
    this.categories = const [],
  });

  @override
  Widget build(BuildContext context) {
    // If no categories from backend, fallback to hardcoded ones for UI continuity
    final bool hasDynamicData = categories.isNotEmpty;
    final displayCount = hasDynamicData ? categories.length : browseCategories.length;
    final int limit = displayCount > 8 ? 8 : displayCount;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'هتدور فين؟',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
              GestureDetector(
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const CategoriesPage(),
                  ),
                ),
                child: Text(
                  'عرض الكل',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 135,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: limit,
            itemBuilder: (context, index) {
              String name;
              String? image;
              Color color;
              IconData icon;
              String filterName;

              if (hasDynamicData) {
                final cat = categories[index];
                name = CategoryUtils.getDisplayName(cat.name);
                image = cat.image;
                color = CategoryUtils.getColor(cat.name);
                icon = CategoryUtils.getIcon(cat.name);
                filterName = cat.name;
              } else {
                final cat = browseCategories[index];
                name = cat.name;
                image = cat.imagePath; // Using local asset path as URL for NetworkImageWidget fallback
                color = cat.color;
                icon = cat.icon;
                filterName = cat.backendName ?? cat.name;
              }

              return Padding(
                padding: const EdgeInsets.only(right: 16),
                child: GestureDetector(
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
                    children: [
                      Container(
                        width: 76,
                        height: 76,
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            colors: [
                              color,
                              color.withValues(alpha: 0.3),
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: color.withValues(alpha: 0.2),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Container(
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                          padding: const EdgeInsets.all(2),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(40),
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
                                      size: 30,
                                    ),
                                  ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        name,
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.labelMedium?.copyWith(
                              fontWeight: FontWeight.w900,
                              fontSize: 12,
                              color: Colors.white,
                            ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
