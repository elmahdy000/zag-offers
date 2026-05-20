import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/network_image_widget.dart';
import '../../../../core/utils/category_utils.dart';
import '../../domain/entities/category_entity.dart';
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
    final bool hasDynamicData = categories.isNotEmpty;
    final int limit = categories.length > 12 ? 12 : categories.length;

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
        if (!hasDynamicData)
          const SizedBox(
            height: 80,
            child: Center(
              child: Text('لا توجد تصنيفات حالياً'),
            ),
          )
        else
        _CategoriesListView(
          categories: categories,
          limit: limit,
        ),
      ],
    );
  }
}

class _CategoriesListView extends StatelessWidget {
  final List<CategoryEntity> categories;
  final int limit;

  const _CategoriesListView({
    required this.categories,
    required this.limit,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final items = categories.take(limit).map((cat) => _CategoryItemData(
      name: CategoryUtils.getDisplayName(cat.name),
      image: cat.image,
      color: CategoryUtils.getColor(cat.name),
      icon: CategoryUtils.getIcon(cat.name),
      filterName: cat.name,
    )).toList(growable: false);

    return SizedBox(
      height: 135,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: items.length,
        itemBuilder: (context, index) {
          final item = items[index];
          return Padding(
            padding: const EdgeInsets.only(right: 16),
            child: GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => AllOffersPage(
                      initialCategory: item.filterName,
                    ),
                  ),
                );
              },
              child: Column(
                children: [
                  Container(
                    width: 82,
                    height: 82,
                    padding: const EdgeInsets.all(3),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        colors: [
                          item.color,
                          item.color.withValues(alpha: 0.3),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: item.color.withValues(alpha: 0.2),
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
                        child: item.image != null
                            ? (item.image!.startsWith('http') || item.image!.startsWith('/')
                                ? NetworkImageWidget(
                                    imageUrl: item.image!,
                                    fit: BoxFit.cover,
                                  )
                                : Image.asset(
                                    item.image!,
                                    fit: BoxFit.cover,
                                  ))
                            : Container(
                                color: item.color.withValues(alpha: 0.1),
                                child: Icon(
                                  item.icon,
                                  color: item.color,
                                  size: 30,
                                ),
                              ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    item.name,
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.labelMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                      letterSpacing: -0.2,
                      color: theme.brightness == Brightness.dark
                          ? Colors.white
                          : AppColors.textPrimary.withValues(alpha: 0.9),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _CategoryItemData {
  final String name;
  final String? image;
  final Color color;
  final IconData icon;
  final String filterName;

  const _CategoryItemData({
    required this.name,
    this.image,
    required this.color,
    required this.icon,
    required this.filterName,
  });
}
