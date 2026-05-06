import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_admin_app/features/categories/domain/entities/category.dart';
import 'package:zag_offers_admin_app/features/categories/presentation/bloc/categories_bloc.dart';
import 'package:zag_offers_admin_app/core/widgets/bottom_sheet.dart';
import 'package:zag_offers_admin_app/core/widgets/skeleton_loader.dart';

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
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'إدارة الأقسام',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
        ),
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
              const SnackBar(
                content: Text('تم إنشاء القسم بنجاح'),
                backgroundColor: Colors.green,
              ),
            );
          } else if (state is CategoryUpdated) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('تم تعديل القسم بنجاح'),
                backgroundColor: Colors.green,
              ),
            );
          } else if (state is CategoryDeleted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('تم حذف القسم بنجاح'),
                backgroundColor: Colors.green,
              ),
            );
          } else if (state is CategoriesError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.red,
              ),
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
                    Icon(
                      Icons.category_outlined,
                      size: 64,
                      color: Colors.blueGrey[300],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'لا توجد أقسام بعد',
                      style: GoogleFonts.cairo(color: Colors.blueGrey[500]),
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
                padding: const EdgeInsets.all(16),
                itemCount: state.categories.length,
                itemBuilder: (context, index) {
                  final category = state.categories[index];
                  return Card(
                    elevation: 0,
                    color: Colors.white,
                    margin: const EdgeInsets.only(bottom: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: BorderSide(
                        color: Colors.blueGrey[100]!.withValues(alpha: 0.5),
                      ),
                    ),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: Colors.indigo[50],
                        child: Text(
                          category.name[0],
                          style: TextStyle(color: Colors.indigo[800]),
                        ),
                      ),
                      title: Text(
                        category.name,
                        style: GoogleFonts.cairo(fontWeight: FontWeight.w600),
                      ),
                      onTap: () => _showCategoryDetails(context, category),
                      trailing: IconButton(
                        icon: const Icon(
                          Icons.delete_outline,
                          color: Colors.red,
                        ),
                        onPressed: () => _confirmDelete(context, category),
                      ),
                    ),
                  );
                },
              ),
            );
          } else if (state is CategoriesError) {
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
                    onPressed: () => context.read<CategoriesBloc>().add(
                      LoadCategoriesEvent(),
                    ),
                    child: const Text('إعادة المحاولة'),
                  ),
                ],
              ),
            );
          }
          return const SizedBox();
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddCategoryDialog,
        backgroundColor: const Color(0xFFFF6B00),
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  /// Confirmation dialog before deleting to prevent accidental removals.
  void _confirmDelete(BuildContext context, Category category) {
    final bloc = context.read<CategoriesBloc>();
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(
          'تأكيد الحذف',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
        ),
        content: Text(
          'هل أنت متأكد من حذف قسم "${category.name}"؟ لا يمكن التراجع عن هذا الإجراء.',
          style: GoogleFonts.inter(fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              bloc.add(DeleteCategoryEvent(id: category.id));
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('حذف'),
          ),
        ],
      ),
    );
  }

  void _showAddCategoryDialog() {
    // Clear any leftover text from a previous cancelled dialog.
    _nameController.clear();
    final bloc = context.read<CategoriesBloc>();
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: Colors.white,
        title: Text('إضافة قسم جديد', style: GoogleFonts.cairo()),
        content: TextField(
          controller: _nameController,
          autofocus: true,
          decoration: InputDecoration(
            labelText: 'اسم القسم',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () {
              if (_nameController.text.trim().isNotEmpty) {
                bloc.add(
                  CreateCategoryEvent(name: _nameController.text.trim()),
                );
                _nameController.clear();
                Navigator.pop(dialogContext);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFF6B00),
              foregroundColor: Colors.white,
            ),
            child: const Text('إضافة'),
          ),
        ],
      ),
    );
  }

  void _showCategoryDetails(BuildContext context, Category category) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (sheetContext) {
        return AppBottomSheet(
          title: 'تفاصيل القسم',
          onClose: () => Navigator.pop(sheetContext),
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircleAvatar(
                  radius: 40,
                  backgroundColor: Colors.indigo[50],
                  child: Text(
                    category.name[0],
                    style: TextStyle(color: Colors.indigo[800], fontSize: 24),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  category.name,
                  style: GoogleFonts.cairo(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '${category.offersCount} عرض',
                  style: GoogleFonts.cairo(
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {
                          Navigator.pop(sheetContext);
                          _showEditDialog(context, category);
                        },
                        icon: const Icon(Icons.edit_outlined),
                        label: const Text('تعديل'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFF6B00),
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.pop(sheetContext);
                          _confirmDelete(context, category);
                        },
                        icon: const Icon(Icons.delete_outline, color: Colors.red),
                        label: const Text('حذف', style: TextStyle(color: Colors.red)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showEditDialog(BuildContext context, Category category) {
    _nameController.text = category.name;
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: Colors.white,
        title: Text('تعديل القسم', style: GoogleFonts.cairo()),
        content: TextField(
          controller: _nameController,
          autofocus: true,
          decoration: InputDecoration(
            labelText: 'اسم القسم',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () {
              if (_nameController.text.trim().isNotEmpty) {
                context.read<CategoriesBloc>().add(
                  UpdateCategoryEvent(id: category.id, name: _nameController.text.trim()),
                );
                _nameController.clear();
                Navigator.pop(dialogContext);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFF6B00),
              foregroundColor: Colors.white,
            ),
            child: const Text('حفظ'),
          ),
        ],
      ),
    );
  }

  // ignore: unused_element
  void _showEditCategoryDialog(Category category) {
    _nameController.text = category.name;
    final bloc = context.read<CategoriesBloc>();
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: Colors.white,
        title: Text('تعديل القسم', style: GoogleFonts.cairo()),
        content: TextField(
          controller: _nameController,
          autofocus: true,
          decoration: InputDecoration(
            labelText: 'اسم القسم',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () {
              final name = _nameController.text.trim();
              if (name.isEmpty) return;
              bloc.add(
                UpdateCategoryEvent(id: category.id, name: name, icon: null),
              );
              Navigator.pop(dialogContext);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFF6B00),
              foregroundColor: Colors.white,
            ),
            child: const Text('حفظ'),
          ),
        ],
      ),
    );
  }
}
