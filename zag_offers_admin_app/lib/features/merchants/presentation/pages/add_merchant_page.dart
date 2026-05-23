import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_iconly/flutter_iconly.dart';
import 'package:image_picker/image_picker.dart';
import 'package:zag_offers_admin_app/core/network/api_client.dart';
import 'package:zag_offers_admin_app/core/theme/app_colors.dart';
import 'package:zag_offers_admin_app/core/widgets/network_image.dart';
import 'package:zag_offers_admin_app/features/merchants/presentation/bloc/merchants_bloc.dart';
import 'package:zag_offers_admin_app/features/categories/presentation/bloc/categories_bloc.dart';
import 'package:zag_offers_admin_app/features/categories/domain/entities/category.dart';
import 'package:zag_offers_admin_app/features/merchants/domain/entities/merchant.dart';
import 'package:zag_offers_admin_app/core/utils/snackbar_utils.dart';
import 'package:zag_offers_admin_app/injection_container.dart' as di;

class AddMerchantPage extends StatefulWidget {
  final Merchant? merchant;
  const AddMerchantPage({super.key, this.merchant});

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
  File? _selectedImage;
  bool _isUploadingImage = false;

  bool get isEdit => widget.merchant != null;

  @override
  void initState() {
    super.initState();
    context.read<CategoriesBloc>().add(LoadCategoriesEvent());
    if (isEdit) {
      _ownerNameController.text = widget.merchant!.ownerName;
      _phoneController.text = widget.merchant!.phone;
      _storeNameController.text = widget.merchant!.storeName;
      // We cannot pre-fill password because it's not returned from API.
      // Category is tricky if we only have the name, not ID. Let's rely on user selecting it or matching name.
    }
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
        title: Text(isEdit ? 'تعديل بيانات المتجر' : 'إضافة تاجر جديد'),
      ),
      body: BlocListener<MerchantsBloc, MerchantsState>(
        listenWhen: (_, state) => state is MerchantCreated || state is MerchantStatusUpdated || state is MerchantsError,
        listener: (context, state) {
          if (state is MerchantCreated || state is MerchantStatusUpdated) {
            SnackBarUtils.showSuccess(context, isEdit ? 'تم تحديث المتجر بنجاح' : 'تم إنشاء التاجر والمتجر بنجاح');
            Navigator.pop(context);
          } else if (state is MerchantsError) {
            SnackBarUtils.showError(context, state.message);
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
                _buildImagePicker(),
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
                  buildWhen: (prev, next) => next is MerchantActionLoading || next is MerchantCreated || next is MerchantStatusUpdated || next is MerchantsError,
                  builder: (context, state) {
                    final isLoading = state is MerchantActionLoading || _isUploadingImage;
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
                            : Text(isEdit ? 'حفظ التعديلات' : 'إنشاء حساب التاجر', style: GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
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
      buildWhen: (prev, next) => next is CategoriesLoaded || next is CategoriesLoading || next is CategoriesError,
      builder: (context, state) {
        List<Category> categories = [];
        if (state is CategoriesLoaded) {
          categories = state.categories;
        }
        
        final hasValidSelection = categories.any((c) => c.id == _selectedCategoryId);
        
        return DropdownButtonFormField<String>(
          value: hasValidSelection ? _selectedCategoryId : null,
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

  Future<void> _pickImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() {
        _selectedImage = File(image.path);
      });
    }
  }

  Widget _buildImagePicker() {
    return Center(
      child: GestureDetector(
        onTap: _pickImage,
        child: Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            color: AppColors.white,
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.primary.withValues(alpha: 0.3), width: 2),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              ClipOval(
                child: _selectedImage != null
                    ? Image.file(_selectedImage!, width: 120, height: 120, fit: BoxFit.cover)
                    : (isEdit && widget.merchant!.logoUrl != null)
                        ? NetworkImageWithPlaceholder(imageUrl: widget.merchant!.logoUrl!, width: 120, height: 120, fit: BoxFit.cover)
                        : const Center(
                            child: Icon(IconlyLight.image, size: 40, color: AppColors.textSecondary),
                          ),
              ),
              Positioned(
                bottom: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(IconlyBold.camera, size: 20, color: Colors.white),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (_formKey.currentState?.validate() ?? false) {
      String? uploadedLogoUrl;

      if (_selectedImage != null) {
        setState(() => _isUploadingImage = true);
        try {
          final apiClient = di.sl<ApiClient>();
          final formData = FormData.fromMap({
            'file': await MultipartFile.fromFile(_selectedImage!.path),
          });
          final response = await apiClient.upload('/admin/upload', formData);
          uploadedLogoUrl = response.data['url'];
        } catch (e) {
          SnackBarUtils.showError(context, 'فشل في رفع الصورة: $e');
          setState(() => _isUploadingImage = false);
          return;
        }
        setState(() => _isUploadingImage = false);
      }

      if (isEdit) {
        context.read<MerchantsBloc>().add(
          UpdateMerchantEvent(
            id: widget.merchant!.id,
            ownerName: _ownerNameController.text.trim(),
            phone: _phoneController.text.trim(),
            storeName: _storeNameController.text.trim(),
            categoryId: _selectedCategoryId,
            logoUrl: uploadedLogoUrl,
          ),
        );
      } else {
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
}
