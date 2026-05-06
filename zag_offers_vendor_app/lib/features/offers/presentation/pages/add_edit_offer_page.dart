import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../injection_container.dart';
import '../../../upload/domain/repositories/upload_repository.dart';
import '../../domain/entities/offer_entity.dart';
import '../bloc/offers_bloc.dart';

import 'offer_preview_page.dart';

class AddEditOfferPage extends StatefulWidget {
  final OfferEntity? offer;
  const AddEditOfferPage({super.key, this.offer});

  @override
  State<AddEditOfferPage> createState() => _AddEditOfferPageState();
}

class _AddEditOfferPageState extends State<AddEditOfferPage> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _descController;
  late TextEditingController _discountController;
  late TextEditingController _termsController;
  late TextEditingController _oldPriceController;
  late TextEditingController _newPriceController;
  late DateTime _startDate;
  late DateTime _endDate;
  int? _usageLimit;

  bool _isUploading = false;
  final List<String> _imageUrls = [];

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.offer?.title);
    _descController = TextEditingController(text: widget.offer?.description);
    _discountController = TextEditingController(text: widget.offer?.discount);
    _termsController = TextEditingController(text: widget.offer?.terms);
    _oldPriceController = TextEditingController(text: widget.offer?.oldPrice?.toString());
    _newPriceController = TextEditingController(text: widget.offer?.newPrice?.toString());
    _startDate = widget.offer?.startDate ?? DateTime.now();
    _endDate = widget.offer?.endDate ?? DateTime.now().add(const Duration(days: 30));
    _usageLimit = widget.offer?.usageLimit;
    if (widget.offer?.images != null) {
      _imageUrls.addAll(widget.offer!.images);
    }
  }

  String _resolveImageUrl(String url) {
    final trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    final base = AppConstants.socketUrl.endsWith('/')
        ? AppConstants.socketUrl.substring(0, AppConstants.socketUrl.length - 1)
        : AppConstants.socketUrl;
    final path = trimmed.startsWith('/') ? trimmed : '/$trimmed';
    return '$base$path';
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);

    if (pickedFile != null) {
      setState(() => _isUploading = true);
      try {
        final uploadUseCase = sl<UploadUseCase>();
        final url = await uploadUseCase(File(pickedFile.path));
        setState(() {
          _imageUrls.add(url);
          _isUploading = false;
        });
      } catch (e) {
        setState(() => _isUploading = false);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('فشل رفع الصورة: $e')),
        );
      }
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _discountController.dispose();
    _termsController.dispose();
    _oldPriceController.dispose();
    _newPriceController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context, bool isStart) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: isStart ? _startDate : _endDate,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _startDate = picked;
        } else {
          _endDate = picked;
        }
      });
    }
  }

  void _onPreview() {
    if (_formKey.currentState!.validate()) {
      if (_imageUrls.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('الرجاء إضافة صورة واحدة على الأقل للعرض')),
        );
        return;
      }

      final offer = OfferEntity(
        id: widget.offer?.id ?? '',
        title: _titleController.text,
        description: _descController.text,
        images: _imageUrls.map(_resolveImageUrl).toList(),
        discount: _discountController.text,
        terms: _termsController.text,
        startDate: _startDate,
        endDate: _endDate,
        usageLimit: _usageLimit,
        status: widget.offer?.status ?? 'PENDING',
        storeId: widget.offer?.storeId ?? '',
        oldPrice: double.tryParse(_oldPriceController.text),
        newPrice: double.tryParse(_newPriceController.text),
        rejectionReason: widget.offer?.rejectionReason,
        viewCount: widget.offer?.viewCount ?? 0,
        isFeatured: widget.offer?.isFeatured ?? false,
      );

      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => OfferPreviewPage(
            offer: offer,
            isEdit: widget.offer != null,
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.offer != null;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          isEdit ? 'تعديل عرض' : 'إضافة عرض جديد',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        backgroundColor: AppColors.background,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildImagePicker(),
              const SizedBox(height: 24),
              _buildTextField(
                controller: _titleController,
                label: 'عنوان العرض',
                hint: 'مثال: خصم 20% على البيتزا',
                icon: Icons.title_rounded,
                validator: (v) => v!.isEmpty ? 'الرجاء إدخال العنوان' : null,
              ),
              const SizedBox(height: 20),
              _buildTextField(
                controller: _descController,
                label: 'وصف العرض',
                hint: 'اشرح تفاصيل العرض للعملاء',
                icon: Icons.description_outlined,
                maxLines: 3,
                validator: (v) => v!.isEmpty ? 'الرجاء إدخال الوصف' : null,
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: _buildTextField(
                      controller: _oldPriceController,
                      label: 'السعر قبل',
                      hint: '0.0',
                      icon: Icons.price_change_outlined,
                      keyboardType: TextInputType.number,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildTextField(
                      controller: _newPriceController,
                      label: 'السعر بعد',
                      hint: '0.0',
                      icon: Icons.price_check_rounded,
                      keyboardType: TextInputType.number,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: _buildTextField(
                      controller: _discountController,
                      label: 'الخصم (%)',
                      hint: 'مثال: 20%',
                      icon: Icons.percent_rounded,
                      validator: (v) => v!.isEmpty ? 'مطلوب' : null,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildTextField(
                      label: 'حد الاستخدام',
                      hint: 'اختياري',
                      icon: Icons.person_outline,
                      keyboardType: TextInputType.number,
                      onChanged: (v) => _usageLimit = int.tryParse(v),
                      initialValue: _usageLimit?.toString(),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Text(
                'فترة صلاحية العرض',
                style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildDatePicker(
                      label: 'تاريخ البدء',
                      date: _startDate,
                      onTap: () => _selectDate(context, true),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildDatePicker(
                      label: 'تاريخ الانتهاء',
                      date: _endDate,
                      onTap: () => _selectDate(context, false),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              _buildTextField(
                controller: _termsController,
                label: 'الشروط والأحكام (اختياري)',
                hint: 'مثال: لا يسري مع عروض أخرى',
                icon: Icons.gavel_rounded,
                maxLines: 2,
              ),
              const SizedBox(height: 48),
              ElevatedButton(
                onPressed: _onPreview,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.secondary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.remove_red_eye_outlined),
                    const SizedBox(width: 12),
                    Text(
                      'معاينة العرض',
                      style: GoogleFonts.cairo(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImagePicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'صور العرض',
              style: GoogleFonts.cairo(
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            TextButton.icon(
              onPressed: _isUploading ? null : _pickImage,
              icon: const Icon(Icons.add_photo_alternate_outlined),
              label: const Text('إضافة صورة'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (_isUploading)
          Container(
            height: 110,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const CircularProgressIndicator(),
          )
        else if (_imageUrls.isEmpty)
          InkWell(
            onTap: _pickImage,
            child: Container(
              height: 110,
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.15)),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.add_photo_alternate_rounded,
                    size: 40,
                    color: AppColors.primary.withValues(alpha: 0.6),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'اضغط لإضافة صور العرض',
                    style: GoogleFonts.cairo(color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
          )
        else
          SizedBox(
            height: 110,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _imageUrls.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (context, index) {
                final img = _resolveImageUrl(_imageUrls[index]);
                return Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(14),
                      child: Image.network(
                        img,
                        width: 130,
                        height: 110,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          width: 130,
                          height: 110,
                          color: AppColors.primary.withValues(alpha: 0.08),
                          child: const Icon(Icons.broken_image_rounded),
                        ),
                      ),
                    ),
                    Positioned(
                      top: 6,
                      right: 6,
                      child: InkWell(
                        onTap: () => setState(() => _imageUrls.removeAt(index)),
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.65),
                            shape: BoxShape.circle,
                          ),
                          padding: const EdgeInsets.all(4),
                          child: const Icon(
                            Icons.close,
                            color: Colors.white,
                            size: 14,
                          ),
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

  Widget _buildTextField({
    TextEditingController? controller,
    required String label,
    required String hint,
    required IconData icon,
    int maxLines = 1,
    String? Function(String?)? validator,
    TextInputType keyboardType = TextInputType.text,
    void Function(String)? onChanged,
    String? initialValue,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.cairo(
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          initialValue: initialValue,
          maxLines: maxLines,
          validator: validator,
          onChanged: onChanged,
          keyboardType: keyboardType,
          style: GoogleFonts.cairo(fontWeight: FontWeight.w500),
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: Icon(icon, color: AppColors.primary, size: 22),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: AppColors.primary.withValues(alpha: 0.1)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: AppColors.primary.withValues(alpha: 0.1)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppColors.error),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDatePicker({
    required String label,
    required DateTime date,
    required VoidCallback onTap,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.cairo(
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.primary.withValues(alpha: 0.1)),
            ),
            child: Row(
              children: [
                const Icon(Icons.calendar_today_rounded, color: AppColors.primary, size: 20),
                const SizedBox(width: 12),
                Text(
                  DateFormat('yyyy/MM/dd').format(date),
                  style: GoogleFonts.cairo(fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}