import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_iconly/flutter_iconly.dart';
import 'package:zag_offers_admin_app/core/theme/app_colors.dart';
import 'package:zag_offers_admin_app/features/merchants/presentation/bloc/merchants_bloc.dart';
import 'package:zag_offers_admin_app/features/categories/presentation/bloc/categories_bloc.dart';
import 'package:zag_offers_admin_app/features/categories/domain/entities/category.dart';

class AddMerchantPage extends StatefulWidget {
  const AddMerchantPage({super.key});

  @override
  State<AddMerchantPage> createState() => _AddMerchantPageState();
}

class _AddMerchantPageState extends State<AddMerchantPage> {
  final _formKey = GlobalKey<FormState>();
  
  final _ownerNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _storeNameController = TextEditingController();
  final _areaController = TextEditingController();
  final _addressController = TextEditingController();
  
  String? _selectedCategoryId;

  @override
  void initState() {
    super.initState();
    context.read<CategoriesBloc>().add(LoadCategoriesEvent());
  }

  @override
  void dispose() {
    _ownerNameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _storeNameController.dispose();
    _areaController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('إضافة تاجر جديد'),
      ),
      body: BlocListener<MerchantsBloc, MerchantsState>(
        listener: (context, state) {
          if (state is MerchantCreated) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('تم إنشاء التاجر والمتجر بنجاح'), backgroundColor: AppColors.success),
            );
            Navigator.pop(context);
          } else if (state is MerchantsError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: AppColors.error),
            );
          }
        },
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSectionTitle('بيانات المالك'),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _ownerNameController,
                  label: 'اسم المالك',
                  icon: IconlyLight.user2,
                  validator: (v) => v?.isEmpty ?? true ? 'الرجاء إدخال اسم المالك' : null,
                ),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _phoneController,
                  label: 'رقم التليفون',
                  icon: IconlyLight.call,
                  keyboardType: TextInputType.phone,
                  validator: (v) => v?.isEmpty ?? true ? 'الرجاء إدخال رقم التليفون' : null,
                ),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _emailController,
                  label: 'البريد الإلكتروني (اختياري)',
                  icon: IconlyLight.message,
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _passwordController,
                  label: 'كلمة المرور',
                  icon: IconlyLight.lock,
                  obscureText: true,
                  validator: (v) => (v?.length ?? 0) < 6 ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : null,
                ),
                
                const SizedBox(height: 32),
                _buildSectionTitle('بيانات المتجر'),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _storeNameController,
                  label: 'اسم المتجر',
                  icon: IconlyLight.buy,
                  validator: (v) => v?.isEmpty ?? true ? 'الرجاء إدخال اسم المتجر' : null,
                ),
                const SizedBox(height: 16),
                _buildCategoryDropdown(),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _areaController,
                  label: 'المنطقة',
                  icon: IconlyLight.location,
                ),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _addressController,
                  label: 'العنوان بالتفصيل',
                  icon: IconlyLight.home,
                ),
                
                const SizedBox(height: 40),
                BlocBuilder<MerchantsBloc, MerchantsState>(
                  builder: (context, state) {
                    final isLoading = state is MerchantActionLoading;
                    return SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: isLoading ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: isLoading
                            ? const CircularProgressIndicator(color: Colors.white)
                            : Text('إنشاء حساب التاجر', style: GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.cairo(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: AppColors.primary,
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    bool obscureText = false,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: AppColors.primary, size: 20),
        filled: true,
        fillColor: AppColors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: Colors.grey.shade200),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
      ),
    );
  }

  Widget _buildCategoryDropdown() {
    return BlocBuilder<CategoriesBloc, CategoriesState>(
      builder: (context, state) {
        List<Category> categories = [];
        if (state is CategoriesLoaded) {
          categories = state.categories;
        }
        
        return DropdownButtonFormField<String>(
          value: _selectedCategoryId,
          items: categories.map((c) => DropdownMenuItem(
            value: c.id,
            child: Text(c.name, style: GoogleFonts.cairo(fontSize: 14)),
          )).toList(),
          onChanged: (v) => setState(() => _selectedCategoryId = v),
          validator: (v) => v == null ? 'الرجاء اختيار القسم' : null,
          decoration: InputDecoration(
            labelText: 'القسم',
            prefixIcon: const Icon(IconlyLight.category, color: AppColors.primary, size: 20),
            filled: true,
            fillColor: AppColors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: Colors.grey.shade200),
            ),
          ),
        );
      },
    );
  }

  void _submit() {
    if (_formKey.currentState?.validate() ?? false) {
      context.read<MerchantsBloc>().add(
        CreateMerchantEvent(
          ownerName: _ownerNameController.text.trim(),
          phone: _phoneController.text.trim(),
          email: _emailController.text.trim().isEmpty ? null : _emailController.text.trim(),
          password: _passwordController.text.trim(),
          storeName: _storeNameController.text.trim(),
          categoryId: _selectedCategoryId!,
          area: _areaController.text.trim().isEmpty ? null : _areaController.text.trim(),
          address: _addressController.text.trim().isEmpty ? null : _addressController.text.trim(),
        ),
      );
    }
  }
}
