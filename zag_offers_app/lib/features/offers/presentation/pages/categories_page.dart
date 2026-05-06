import 'package:flutter/material.dart';
import 'package:zag_offers_app/core/theme/app_colors.dart';
import 'package:zag_offers_app/core/widgets/network_image_widget.dart';
import '../constants/offer_categories.dart';
import 'all_offers_page.dart';

class CategoriesPage extends StatelessWidget {
  const CategoriesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          'كل التصنيفات',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w900,
                color: AppColors.textPrimary,
              ),
        ),
        elevation: 0,
        backgroundColor: Colors.white,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 30),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 0.82,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final category = browseCategories[index];

                  return GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) =>
                              AllOffersPage(initialCategory: category.name),
                        ),
                      );
                    },
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(32),
                        boxShadow: [
                          BoxShadow(
                            color: category.color.withValues(alpha: 0.08),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                        border: Border.all(
                          color: category.color.withValues(alpha: 0.1),
                          width: 1.5,
                        ),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              color: category.color.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: ClipOval(
                              child: category.image != null
                                  ? NetworkImageWidget(
                                      imageUrl: category.image!,
                                      fit: BoxFit.cover,
                                    )
                                  : Icon(
                                      category.icon,
                                      color: category.color,
                                      size: 34,
                                    ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            category.name,
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.textPrimary,
                                  fontSize: 18,
                                ),
                          ),
                          const SizedBox(height: 6),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Text(
                              category.description ?? '',
                              textAlign: TextAlign.center,
                              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                    color: AppColors.textSecondary,
                                    fontWeight: FontWeight.w600,
                                    height: 1.3,
                                  ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
                childCount: browseCategories.length,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
