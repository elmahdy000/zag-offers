import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/offer_entity.dart';
import '../bloc/offers_bloc.dart';
import '../../../../injection_container.dart';
import '../../../upload/domain/repositories/upload_repository.dart';

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
  late DateTime _startDate;
  late DateTime _endDate;
  int? _usageLimit;
  
  File? _selectedImage;
  bool _isUploading = false;
  final List<String> _imageUrls = [];

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.offer?.title);
    _descController = TextEditingController(text: widget.offer?.description);
    _discountController = TextEditingController(text: widget.offer?.discount);
    _termsController = TextEditingController(text: widget.offer?.terms);
    _startDate = widget.offer?.startDate ?? DateTime.now();
    _endDate = widget.offer?.endDate ?? DateTime.now().add(const Duration(days: 30));
    _usageLimit = widget.offer?.usageLimit;
    if (widget.offer?.images != null) {
      _imageUrls.addAll(widget.offer!.images);
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);

    if (pickedFile != null) {
      setState(() {
        _selectedImage = File(pickedFile.path);
        _isUploading = true;
      });

      try {
        final uploadUseCase = sl<UploadUseCase>();
        final url = await uploadUseCase(_selectedImage!);
        setState(() {
          _imageUrls.add(url);
          _isUploading = false;
        });
      } catch (e) {
        setState(() => _isUploading = false);
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

  void _onSave() {
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
        images: _imageUrls,
        discount: _discountController.text,
        terms: _termsController.text,
        startDate: _startDate,
        endDate: _endDate,
        usageLimit: _usageLimit,
        status: widget.offer?.status ?? 'PENDING',
        storeId: widget.offer?.storeId ?? '',
      );

      if (widget.offer == null) {
        context.read<OffersBloc>().add(CreateOfferRequested(offer));
      } else {
        context.read<OffersBloc>().add(UpdateOfferRequested(offer));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.offer != null;

    return BlocListener<OffersBloc, OffersState>(
      listener: (context, state) {
        if (state is OfferActionSuccess) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.message), backgroundColor: AppColors.success),
          );
          Navigator.pop(context);
        } else if (state is OffersError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.message), backgroundColor: AppColors.error),
          );
        }
      },
      child: Scaffold(
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
                // Image Picker Section
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
                        controller: _discountController,
                        label: 'الخصم',
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
                BlocBuilder<OffersBloc, OffersState>(
                  builder: (context, state) {
                    return ElevatedButton(
                      onPressed: state is OffersLoading ? null : _onSave,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        elevation: 0,
                      ),
                      child: state is OffersLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : Text(
                              isEdit ? 'تحديث العرض' : 'حفظ العرض',
                              style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildImagePicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'صورة العرض',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 12),
        InkWell(
          onTap: _isUploading ? null : _pickImage,
          child: Container(
            height: 200,
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.primary.withOpacity(0.1), width: 2),
            ),
            child: _isUploading
                ? const Center(child: CircularProgressIndicator())
                : _imageUrls.isNotEmpty
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(22),
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            Image.network(
                              _imageUrls.first.startsWith('http') 
                                ? _imageUrls.first 
                                : 'http://192.168.1.18:3001${_imageUrls.first}', // Local development URL
                              fit: BoxFit.cover,
                            ),
                            Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  colors: [Colors.transparent, Colors.black.withOpacity(0.5)],
                                ),
                              ),
                            ),
                            const Center(
                              child: Icon(Icons.edit_rounded, color: Colors.white, size: 40),
                            ),
                          ],
                        ),
                      )
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add_photo_alternate_rounded, size: 64, color: AppColors.primary.withOpacity(0.5)),
                          const SizedBox(height: 12),
                          Text(
                            'اضغط لاختيار صورة',
                            style: GoogleFonts.cairo(color: AppColors.textSecondary),
                          ),
                        ],
                      ),
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
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          initialValue: initialValue,
          maxLines: maxLines,
          validator: validator,
          onChanged: onChanged,
          keyboardType: keyboardType,
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: Icon(icon, color: AppColors.primaryLight),
            filled: true,
            fillColor: AppColors.card,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
            contentPadding: const EdgeInsets.all(20),
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
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 14),
        ),
        const SizedBox(height: 8),
        InkWell(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                const Icon(Icons.calendar_today_rounded, size: 20, color: AppColors.primaryLight),
                const SizedBox(width: 12),
                Text(
                  DateFormat('yyyy-MM-dd').format(date),
                  style: GoogleFonts.cairo(),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
