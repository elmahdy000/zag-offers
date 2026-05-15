import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../injection_container.dart';
import '../../../upload/domain/usecases/upload_usecase.dart';
import '../../data/models/store_model.dart';
import '../bloc/dashboard_bloc.dart';
import '../bloc/store_setup_bloc.dart';
import '../../../offers/data/models/category_model.dart';

class StoreSetupPage extends StatefulWidget {
  const StoreSetupPage({super.key});

  @override
  State<StoreSetupPage> createState() => _StoreSetupPageState();
}

class _StoreSetupPageState extends State<StoreSetupPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _addressController = TextEditingController();
  final _areaController = TextEditingController();
  final _phoneController = TextEditingController();
  final _whatsappController = TextEditingController();
  
  String? _selectedCategoryId;
  File? _logoFile;
  File? _coverFile;
  final List<File> _galleryFiles = [];
  
  bool _isUploading = false;
  String _uploadStatus = '';

  @override
  void initState() {
    super.initState();
    context.read<StoreSetupBloc>().add(GetCategoriesRequested());
  }

  Future<void> _pickImage(bool isLogo) async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (pickedFile != null) {
      setState(() {
        if (isLogo) {
          _logoFile = File(pickedFile.path);
        } else {
          _coverFile = File(pickedFile.path);
        }
      });
    }
  }

  Future<void> _pickGalleryImages() async {
    final picker = ImagePicker();
    final pickedFiles = await picker.pickMultiImage(imageQuality: 70);
    if (pickedFiles.isNotEmpty) {
      setState(() {
        _galleryFiles.addAll(pickedFiles.map((e) => File(e.path)));
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCategoryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('يرجى اختيار القسم')),
      );
      return;
    }

    setState(() {
      _isUploading = true;
      _uploadStatus = 'جاري رفع الصور...';
    });

    try {
      final uploadUseCase = sl<UploadUseCase>();
      
      String? logoUrl;
      if (_logoFile != null) {
        logoUrl = await uploadUseCase(_logoFile!);
      }

      String? coverUrl;
      if (_coverFile != null) {
        coverUrl = await uploadUseCase(_coverFile!);
      }

      List<String> galleryUrls = [];
      for (var i = 0; i < _galleryFiles.length; i++) {
        setState(() => _uploadStatus = 'جاري رفع صورة المعرض (${i + 1}/${_galleryFiles.length})...');
        final url = await uploadUseCase(_galleryFiles[i]);
        galleryUrls.add(url);
      }

      final storeData = {
        'name': _nameController.text.trim(),
        'address': _addressController.text.trim(),
        'area': _areaController.text.trim(),
        'phone': _phoneController.text.trim(),
        'whatsapp': _whatsappController.text.trim(),
        'categoryId': _selectedCategoryId,
        'logo': logoUrl,
        'coverImage': coverUrl,
        'images': galleryUrls,
      };

      if (!mounted) return;
      context.read<StoreSetupBloc>().add(CreateStoreRequested(storeData));
    } catch (e) {
      setState(() => _isUploading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('خطأ في الرفع: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('إعداد المتجر', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        backgroundColor: AppColors.background,
        elevation: 0,
        centerTitle: true,
      ),
      body: BlocConsumer<StoreSetupBloc, StoreSetupState>(
        listener: (context, state) {
          if (state is StoreCreatedSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('تم إنشاء المتجر بنجاح! بانتظار موافقة الإدارة')),
            );
            context.read<DashboardBloc>().add(GetDashboardStatsRequested());
            Navigator.pop(context);
          } else if (state is StoreSetupError) {
            setState(() => _isUploading = false);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message)),
            );
          }
        },
        builder: (context, state) {
          final categories = state is CategoriesLoaded ? state.categories : <CategoryModel>[];
          final isLoading = state is StoreSetupLoading || _isUploading;

          return Stack(
            children: [
              SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildSectionTitle('المعلومات الأساسية'),
                      const SizedBox(height: 16),
                      _buildTextField(
                        controller: _nameController,
                        label: 'اسم المتجر',
                        hint: 'مثال: مطعم البرنس',
                        icon: Icons.storefront_rounded,
                        validator: (v) => (v == null || v.isEmpty) ? 'مطلوب' : null,
                      ),
                      const SizedBox(height: 16),
                      _buildCategoryDropdown(categories),
                      const SizedBox(height: 16),
                      _buildTextField(
                        controller: _areaController,
                        label: 'المنطقة',
                        hint: 'مثال: القومية، الزقازيق',
                        icon: Icons.map_rounded,
                      ),
                      const SizedBox(height: 16),
                      _buildTextField(
                        controller: _addressController,
                        label: 'العنوان بالتفصيل',
                        hint: 'شارع... بجوار...',
                        icon: Icons.location_on_rounded,
                        maxLines: 2,
                      ),
                      const SizedBox(height: 32),
                      _buildSectionTitle('معلومات التواصل'),
                      const SizedBox(height: 16),
                      _buildTextField(
                        controller: _phoneController,
                        label: 'رقم الهاتف',
                        hint: '010XXXXXXXX',
                        icon: Icons.phone_rounded,
                        keyboardType: TextInputType.phone,
                        validator: (v) => (v == null || v.isEmpty) ? 'مطلوب' : null,
                      ),
                      const SizedBox(height: 16),
                      _buildTextField(
                        controller: _whatsappController,
                        label: 'رقم الواتساب (اختياري)',
                        hint: '010XXXXXXXX',
                        icon: Icons.chat_rounded,
                        keyboardType: TextInputType.phone,
                      ),
                      const SizedBox(height: 32),
                      _buildSectionTitle('صور المتجر'),
                      const SizedBox(height: 16),
                      _buildImagePickers(),
                      const SizedBox(height: 24),
                      _buildGalleryPicker(),
                      const SizedBox(height: 40),
                      _buildSubmitButton(isLoading),
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
              if (isLoading)
                Container(
                  color: Colors.black45,
                  child: Center(
                    child: Card(
                      margin: const EdgeInsets.symmetric(horizontal: 40),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      child: Padding(
                        padding: const EdgeInsets.all(32),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const CircularProgressIndicator(),
                            const SizedBox(height: 20),
                            Text(
                              _uploadStatus.isNotEmpty ? _uploadStatus : 'جاري الحفظ...',
                              style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.cairo(
        fontSize: 16,
        fontWeight: FontWeight.w900,
        color: AppColors.primary,
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    int maxLines = 1,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      keyboardType: keyboardType,
      validator: validator,
      style: GoogleFonts.cairo(fontSize: 14),
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: Icon(icon, size: 20, color: AppColors.textTertiary),
        filled: true,
        fillColor: AppColors.card,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: AppColors.border)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: AppColors.primary)),
      ),
    );
  }

  Widget _buildCategoryDropdown(List<CategoryModel> categories) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButtonFormField<String>(
          value: _selectedCategoryId,
          hint: Text('اختر القسم', style: GoogleFonts.cairo(fontSize: 14)),
          items: categories.map((c) {
            return DropdownMenuItem(
              value: c.id,
              child: Text(c.name, style: GoogleFonts.cairo(fontSize: 14)),
            );
          }).toList(),
          onChanged: (v) => setState(() => _selectedCategoryId = v),
          decoration: const InputDecoration(
            border: InputBorder.none,
            prefixIcon: Icon(Icons.category_rounded, size: 20, color: AppColors.textTertiary),
          ),
        ),
      ),
    );
  }

  Widget _buildImagePickers() {
    return Row(
      children: [
        Expanded(
          child: _buildImageSelector(
            label: 'اللوجو',
            file: _logoFile,
            onTap: () => _pickImage(true),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _buildImageSelector(
            label: 'الغلاف',
            file: _coverFile,
            onTap: () => _pickImage(false),
          ),
        ),
      ],
    );
  }

  Widget _buildImageSelector({required String label, File? file, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        height: 120,
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border, style: BorderStyle.solid),
        ),
        child: file != null
            ? ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Image.file(file, fit: BoxFit.cover),
              )
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.add_a_photo_rounded, color: AppColors.textTertiary),
                  const SizedBox(height: 8),
                  Text(label, style: GoogleFonts.cairo(fontSize: 12, color: AppColors.textTertiary)),
                ],
              ),
      ),
    );
  }

  Widget _buildGalleryPicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('معرض الصور (اختياري)', style: GoogleFonts.cairo(fontSize: 14, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        SizedBox(
          height: 80,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: _galleryFiles.length + 1,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              if (index == _galleryFiles.length) {
                return InkWell(
                  onTap: _pickGalleryImages,
                  child: Container(
                    width: 80,
                    decoration: BoxDecoration(
                      color: AppColors.card,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: const Icon(Icons.add_rounded),
                  ),
                );
              }
              return Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.file(_galleryFiles[index], width: 80, height: 80, fit: BoxFit.cover),
                  ),
                  Positioned(
                    top: 2,
                    right: 2,
                    child: GestureDetector(
                      onTap: () => setState(() => _galleryFiles.removeAt(index)),
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                        child: const Icon(Icons.close, size: 12, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSubmitButton(bool isLoading) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: isLoading ? null : _submit,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          elevation: 0,
        ),
        child: Text(
          'تأكيد وإرسال للمراجعة',
          style: GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}
