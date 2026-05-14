import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_admin_app/features/categories/domain/entities/category.dart';
import 'package:zag_offers_admin_app/features/categories/presentation/bloc/categories_bloc.dart';
import 'package:zag_offers_admin_app/core/widgets/custom_dialogs.dart';
import 'package:zag_offers_admin_app/core/widgets/skeleton_loader.dart';
import 'package:zag_offers_admin_app/core/theme/app_colors.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_iconly/flutter_iconly.dart';

class CategoriesPage extends StatefulWidget {
  const CategoriesPage({super.key});

  @override
  State<CategoriesPage> createState() => _CategoriesPageState();
}

class _CategoriesPageState extends State<CategoriesPage> {
  final _nameController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    context.read<CategoriesBloc>().add(LoadCategoriesEvent());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('إدارة الأقسام'),
        actions: [
          IconButton(
            onPressed: _showAddCategoryDialog,
            icon: const Icon(IconlyBold.plus, color: AppColors.primary),
            tooltip: 'إضافة قسم جديد',
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: BlocConsumer<CategoriesBloc, CategoriesState>(
        listenWhen: (_, state) =>
            state is CategoryCreated ||
            state is CategoryUpdated ||
            state is CategoryDeleted ||
            state is CategoriesError,
        listener: (context, state) {
          if (state is CategoryCreated) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('تم إنشاء القسم بنجاح'), backgroundColor: AppColors.success),
            );
          } else if (state is CategoryUpdated) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('تم تعديل القسم بنجاح'), backgroundColor: AppColors.success),
            );
          } else if (state is CategoryDeleted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('تم حذف القسم بنجاح'), backgroundColor: AppColors.success),
            );
          } else if (state is CategoriesError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: AppColors.error),
            );
          }
        },
        buildWhen: (_, state) =>
            state is CategoriesInitial ||
            state is CategoriesLoading ||
            state is CategoriesLoaded ||
            state is CategoriesError,
        builder: (context, state) {
          if (state is CategoriesLoading) {
            return const GridSkeleton(itemCount: 6);
          } else if (state is CategoriesLoaded) {
            if (state.categories.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.category_rounded, size: 64, color: AppColors.primary.withValues(alpha: 0.7)),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'لا توجد أقسام بعد',
                      style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                  ],
                ),
              );
            }
            return RefreshIndicator(
              onRefresh: () async {
                context.read<CategoriesBloc>().add(LoadCategoriesEvent());
              },
              child: ListView.builder(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                itemCount: state.categories.length,
                itemBuilder: (context, index) {
                  final category = state.categories[index];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: AppColors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.03),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                      border: Border.all(color: Colors.grey.shade100),
                    ),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      leading: Container(
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              AppColors.primary.withValues(alpha: 0.2),
                              AppColors.primary.withValues(alpha: 0.05),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Center(
                          child: Text(
                            category.name[0],
                            style: GoogleFonts.cairo(
                              color: AppColors.primary,
                              fontWeight: FontWeight.bold,
                              fontSize: 20,
                            ),
                          ),
                        ),
                      ),
                      title: Text(
                        category.name,
                        style: GoogleFonts.cairo(fontWeight: FontWeight.bold, color: AppColors.textPrimary, fontSize: 16),
                      ),
                      subtitle: Row(
                        children: [
                          Icon(IconlyLight.discount, size: 14, color: AppColors.textSecondary),
                          const SizedBox(width: 4),
                          Text(
                            '${category.offersCount} عرض متاح حالياً',
                            style: GoogleFonts.cairo(fontSize: 12, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                      onTap: () => _showCategoryDetails(context, category),
                      trailing: Container(
                        decoration: BoxDecoration(color: AppColors.error.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(10)),
                        child: IconButton(
                          icon: const Icon(IconlyLight.delete, color: AppColors.error, size: 20),
                          onPressed: () => _confirmDelete(context, category),
                        ),
                      ),
                    ),
                  ).animate().fadeIn(delay: (index * 50).ms).slideX(begin: 0.1);
                },
              ),
            );
          } else if (state is CategoriesError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline_rounded, size: 48, color: AppColors.error),
                  const SizedBox(height: 12),
                  Text(state.message, style: GoogleFonts.cairo(color: AppColors.textSecondary)),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => context.read<CategoriesBloc>().add(LoadCategoriesEvent()),
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

  void _confirmDelete(BuildContext context, Category category) async {
    final bloc = context.read<CategoriesBloc>();
    final confirmed = await CustomDialogs.showConfirmDialog(
      context: context,
      title: 'تأكيد الحذف',
      message: 'هل أنت متأكد من حذف قسم "${category.name}"؟ لا يمكن التراجع عن هذا الإجراء وسيتم إلغاء تصنيف جميع العروض المرتبطة به.',
      isDestructive: true,
      confirmText: 'حذف القسم',
    );
    
    if (confirmed == true) {
      bloc.add(DeleteCategoryEvent(id: category.id));
    }
  }

  void _showAddCategoryDialog() {
    _nameController.clear();
    final bloc = context.read<CategoriesBloc>();
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: Container(
          decoration: const BoxDecoration(color: AppColors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('إضافة قسم جديد', style: GoogleFonts.cairo(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text('أدخل اسماً معبراً للقسم الجديد ليظهر للتجار والعملاء', style: GoogleFonts.cairo(fontSize: 13, color: AppColors.textSecondary)),
              const SizedBox(height: 24),
              TextField(
                controller: _nameController,
                autofocus: true,
                decoration: InputDecoration(
                  labelText: 'اسم القسم',
                  hintText: 'مثال: مطاعم، ملابس...',
                  prefixIcon: const Icon(IconlyLight.category, color: AppColors.primary),
                  filled: true,
                  fillColor: AppColors.background,
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    if (_nameController.text.trim().isNotEmpty) {
                      bloc.add(CreateCategoryEvent(name: _nameController.text.trim()));
                      Navigator.pop(context);
                    }
                  },
                  child: const Text('إنشاء القسم'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showCategoryDetails(BuildContext context, Category category) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (sheetContext) => Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), shape: BoxShape.circle),
              child: Center(
                child: Text(category.name[0], style: GoogleFonts.cairo(color: AppColors.primary, fontSize: 32, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 16),
            Text(category.name, style: GoogleFonts.cairo(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(height: 8),
            Text('${category.offersCount} عرض متاح', style: GoogleFonts.cairo(color: AppColors.textSecondary)),
            const SizedBox(height: 32),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(sheetContext);
                      _showEditDialog(context, category);
                    },
                    icon: const Icon(Icons.edit_outlined),
                    label: const Text('تعديل القسم'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.pop(sheetContext);
                      _confirmDelete(context, category);
                    },
                    icon: const Icon(Icons.delete_outline_rounded, color: AppColors.error),
                    label: const Text('حذف', style: TextStyle(color: AppColors.error)),
                    style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.grey, width: 0.5)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showEditDialog(BuildContext context, Category category) {
    _nameController.text = category.name;
    final bloc = context.read<CategoriesBloc>();
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: Container(
          decoration: const BoxDecoration(color: AppColors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('تعديل القسم', style: GoogleFonts.cairo(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 24),
              TextField(
                controller: _nameController,
                autofocus: true,
                decoration: InputDecoration(
                  labelText: 'اسم القسم',
                  prefixIcon: const Icon(IconlyLight.edit, color: AppColors.primary),
                  filled: true,
                  fillColor: AppColors.background,
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    if (_nameController.text.trim().isNotEmpty) {
                      bloc.add(UpdateCategoryEvent(id: category.id, name: _nameController.text.trim()));
                      Navigator.pop(context);
                    }
                  },
                  child: const Text('حفظ التعديلات'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
