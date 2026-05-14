import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:zag_offers_admin_app/core/theme/app_colors.dart';
import 'package:zag_offers_admin_app/features/offers/presentation/bloc/offers_bloc.dart';
import 'package:zag_offers_admin_app/features/merchants/presentation/bloc/merchants_bloc.dart';
import 'package:zag_offers_admin_app/features/offers/domain/entities/offer.dart';
import 'package:zag_offers_admin_app/features/upload/domain/repositories/upload_repository.dart';
import 'package:zag_offers_admin_app/injection_container.dart';
import 'package:flutter_iconly/flutter_iconly.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';

class AddOfferPage extends StatefulWidget {
  final Offer? initialOffer;
  const AddOfferPage({super.key, this.initialOffer});

  @override
  State<AddOfferPage> createState() => _AddOfferPageState();
}

class _AddOfferPageState extends State<AddOfferPage> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _discountController = TextEditingController();
  final _termsController = TextEditingController();
  final _originalPriceController = TextEditingController();
  
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now().add(const Duration(days: 30));
  int? _usageLimit;
  
  String? _selectedMerchantId;
  String? _selectedMerchantName;

  bool _isUploading = false;
  final List<String> _imageUrls = [];

  @override
  void initState() {
    super.initState();
    if (widget.initialOffer != null) {
      final offer = widget.initialOffer!;
      _titleController.text = offer.title;
      _descController.text = offer.description;
      _originalPriceController.text = offer.oldPrice?.toString() ?? '';
      _discountController.text = offer.newPrice?.toString() ?? '';
      _startDate = offer.startDate;
      _endDate = offer.endDate;
      _imageUrls.addAll(offer.images);
      _selectedMerchantId = offer.merchantId;
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _discountController.dispose();
    _termsController.dispose();
    _originalPriceController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    try {
      final picker = ImagePicker();
      // Use pickMultiImage to allow selecting multiple images at once
      final List<XFile> pickedFiles = await picker.pickMultiImage(
        imageQuality: 70, // Reduce quality to fix 413 error
        maxWidth: 1440,   // Limit dimensions to fix 413 error
        maxHeight: 1440,
      );

      if (pickedFiles.isNotEmpty) {
        setState(() => _isUploading = true);
        final uploadUseCase = sl<UploadUseCase>();
        
        for (final file in pickedFiles) {
          if (_imageUrls.length >= 5) break; // Limit to 5 images
          
          final result = await uploadUseCase(File(file.path));
          result.fold(
            (failure) => _showError('فشل رفع إحدى الصور: ${failure.message}'),
            (url) => setState(() => _imageUrls.add(url)),
          );
        }
      }
    } on PlatformException catch (e) {
      _showError('خطأ في الوصول للصور: تأكد من إعطاء الصلاحيات اللازمة');
      debugPrint('PlatformException: ${e.message}');
    } catch (e) {
      _showError('خطأ غير متوقع أثناء اختيار الصور');
      debugPrint('General Error: $e');
    } finally {
      setState(() => _isUploading = false);
    }
  }

  void _showImagePreview(String url) {
    showDialog(
      context: context,
      builder: (context) => Dialog.fullscreen(
        backgroundColor: Colors.black,
        child: Stack(
          children: [
            Center(
              child: InteractiveViewer(
                child: Image.network(
                  url,
                  fit: BoxFit.contain,
                  loadingBuilder: (context, child, loadingProgress) {
                    if (loadingProgress == null) return child;
                    return const CircularProgressIndicator(color: Colors.white);
                  },
                ),
              ),
            ),
            Positioned(
              top: 40,
              right: 20,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white, size: 30),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg, style: GoogleFonts.cairo()), backgroundColor: AppColors.error),
    );
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(IconlyBold.tickSquare, color: AppColors.success, size: 50),
              ).animate().scale(duration: 400.ms, curve: Curves.easeOutBack).rotate(begin: -0.5, end: 0),
              const SizedBox(height: 24),
              Text(
                'تم بنجاح!',
                style: GoogleFonts.cairo(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ).animate().fadeIn(delay: 200.ms),
              const SizedBox(height: 8),
              Text(
                widget.initialOffer != null
                    ? 'تم تحديث العرض بنجاح لمتجر\n$_selectedMerchantName'
                    : 'تم إنشاء العرض ونشره بنجاح لمتجر\n$_selectedMerchantName',
                textAlign: TextAlign.center,
                style: GoogleFonts.cairo(fontSize: 14, color: AppColors.textSecondary),
              ).animate().fadeIn(delay: 400.ms),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context); // Close dialog
                    Navigator.pop(this.context); // Close page
                  },
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const Text('رجوع للعروض'),
                ),
              ).animate().slideY(begin: 0.2, delay: 600.ms).fadeIn(),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _selectDate(BuildContext context, bool isStart) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: isStart ? _startDate : _endDate,
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        if (isStart) _startDate = picked;
        else _endDate = picked;
      });
    }
  }

  void _submit() {
    if (_selectedMerchantId == null) {
      _showError('الرجاء اختيار المتجر أولاً');
      return;
    }
    if (_formKey.currentState!.validate()) {
      if (_imageUrls.isEmpty) {
        _showError('الرجاء إضافة صورة واحدة على الأقل');
        return;
      }

      final data = {
        'title': _titleController.text.trim(),
        'description': _descController.text.trim(),
        'images': _imageUrls,
        'discount': _discountController.text.trim(),
        'terms': _termsController.text.trim(),
        'startDate': _startDate.toIso8601String(),
        'endDate': _endDate.toIso8601String(),
        'usageLimit': _usageLimit,
        'storeId': _selectedMerchantId,
        'originalPrice': double.tryParse(_originalPriceController.text),
        'status': widget.initialOffer?.status ?? 'APPROVED',
      };

      if (widget.initialOffer != null) {
        context.read<OffersBloc>().add(UpdateOfferEvent(id: widget.initialOffer!.id, offerData: data));
      } else {
        context.read<OffersBloc>().add(CreateOfferEvent(offerData: data));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<OffersBloc, OffersState>(
      listener: (context, state) {
        if (state is OfferCreated || state is OfferUpdated) {
          _showSuccessDialog();
        } else if (state is OffersError) {
          _showError(state.message);
        }
      },
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: Text(widget.initialOffer != null ? 'تعديل العرض' : 'إضافة عرض جديد'),
          centerTitle: true,
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildMerchantSelector(),
                const SizedBox(height: 24),
                _buildImageSection(),
                const SizedBox(height: 24),
                _buildSectionTitle('المعلومات الأساسية'),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _titleController,
                  label: 'عنوان العرض',
                  hint: 'مثال: خصم 50% على جميع الوجبات',
                  icon: IconlyLight.edit,
                  validator: (v) => v!.isEmpty ? 'مطلوب' : null,
                ),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _descController,
                  label: 'وصف العرض',
                  hint: 'تفاصيل العرض...',
                  icon: IconlyLight.document,
                  maxLines: 3,
                  validator: (v) => v!.isEmpty ? 'مطلوب' : null,
                ),
                const SizedBox(height: 24),
                _buildSectionTitle('الأسعار والخصم'),
                const SizedBox(height: 16),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: _buildTextField(
                        controller: _originalPriceController,
                        label: 'السعر الأصلي',
                        hint: '0.0',
                        icon: IconlyLight.wallet,
                        keyboardType: TextInputType.number,
                        onChanged: (_) => setState(() {}),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildTextField(
                        controller: _discountController,
                        label: 'قيمة الخصم (نص)',
                        hint: 'مثال: 50% أو 100 ج.م',
                        icon: IconlyLight.discount,
                        validator: (v) => v!.isEmpty ? 'مطلوب' : null,
                        onChanged: (_) => setState(() {}),
                      ),
                    ),
                  ],
                ),
                if (_calculateNewPrice() != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(IconlyBold.discount, color: AppColors.success, size: 18),
                        const SizedBox(width: 8),
                        Text(
                          'السعر بعد الخصم (تقريبي): ',
                          style: GoogleFonts.cairo(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                        ),
                        Text(
                          '${_calculateNewPrice()} ج.م',
                          style: GoogleFonts.cairo(fontSize: 14, fontWeight: FontWeight.w900, color: AppColors.success),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 24),
                _buildSectionTitle('الصلاحية والقيود'),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _buildDatePicker('تاريخ البدء', _startDate, () => _selectDate(context, true)),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildDatePicker('تاريخ الانتهاء', _endDate, () => _selectDate(context, false)),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildTextField(
                  label: 'حد الاستخدام (اختياري)',
                  hint: 'أقصى عدد لاستخدام العرض',
                  icon: IconlyLight.profile,
                  keyboardType: TextInputType.number,
                  onChanged: (v) => setState(() => _usageLimit = int.tryParse(v)),
                ),
                const SizedBox(height: 40),
                BlocBuilder<OffersBloc, OffersState>(
                  builder: (context, state) {
                    final isLoading = state is OfferActionLoading;
                    return SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: isLoading ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: isLoading
                            ? const CircularProgressIndicator(color: Colors.white)
                            : Text('إنشاء العرض الآن', style: GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 40),
              ],
            ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.05),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.cairo(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
    );
  }

  Widget _buildMerchantSelector() {
    return InkWell(
      onTap: _showMerchantPicker,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.1)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), shape: BoxShape.circle),
              child: const Icon(IconlyBold.buy, color: AppColors.primary, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('المتجر المستهدف', style: GoogleFonts.cairo(fontSize: 12, color: AppColors.textSecondary)),
                  Text(
                    _selectedMerchantName ?? 'اضغط لاختيار المتجر',
                    style: GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primary),
                  ),
                ],
              ),
            ),
            const Icon(IconlyLight.arrowLeft2, size: 20, color: AppColors.primary),
          ],
        ),
      ),
    );
  }

  void _showMerchantPicker() {
    final searchController = TextEditingController();
    String query = '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return DraggableScrollableSheet(
              initialChildSize: 0.7,
              minChildSize: 0.5,
              maxChildSize: 0.9,
              builder: (_, scrollController) => Container(
                decoration: const BoxDecoration(color: AppColors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
                child: Column(
                  children: [
                    const SizedBox(height: 12),
                    Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(10))),
                    Padding(
                      padding: const EdgeInsets.all(24),
                      child: TextField(
                        controller: searchController,
                        decoration: InputDecoration(
                          hintText: 'ابحث عن متجر...',
                          prefixIcon: const Icon(IconlyLight.search, size: 20),
                          filled: true,
                          fillColor: AppColors.background,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                        ),
                        onChanged: (v) => setModalState(() => query = v.toLowerCase()),
                      ),
                    ),
                    Expanded(
                      child: BlocBuilder<MerchantsBloc, MerchantsState>(
                        builder: (context, state) {
                          if (state is MerchantsLoaded) {
                            final filtered = state.merchants.where((m) => m.storeName.toLowerCase().contains(query)).toList();
                            return ListView.builder(
                              controller: scrollController,
                              itemCount: filtered.length,
                              itemBuilder: (context, index) {
                                final m = filtered[index];
                                return ListTile(
                                  leading: CircleAvatar(backgroundColor: AppColors.primary.withValues(alpha: 0.1), child: Text(m.storeName[0])),
                                  title: Text(m.storeName, style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                                  onTap: () {
                                    setState(() {
                                      _selectedMerchantId = m.id;
                                      _selectedMerchantName = m.storeName;
                                    });
                                    Navigator.pop(context);
                                  },
                                );
                              },
                            );
                          }
                          return const Center(child: CircularProgressIndicator());
                        },
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildImageSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _buildSectionTitle('صور العرض'),
            Text('${_imageUrls.length} / 5', style: GoogleFonts.cairo(fontSize: 12, color: AppColors.textSecondary)),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 100,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              ..._imageUrls.map((url) => _buildImageItem(url)),
              if (_imageUrls.length < 5) _buildAddImageButton(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildImageItem(String url) {
    return Container(
      width: 100,
      margin: const EdgeInsets.only(left: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Stack(
          fit: StackFit.expand,
          children: [
            GestureDetector(
              onTap: () => _showImagePreview(url),
              child: Image.network(
                url,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  color: Colors.grey.shade100,
                  child: const Icon(Icons.broken_image_rounded, color: Colors.grey),
                ),
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return Center(
                    child: CircularProgressIndicator(
                      value: loadingProgress.expectedTotalBytes != null
                          ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                          : null,
                      strokeWidth: 2,
                    ),
                  );
                },
              ),
            ),
            Positioned(
              top: 4,
              right: 4,
              child: GestureDetector(
                onTap: () => setState(() => _imageUrls.remove(url)),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                  child: const Icon(Icons.close, color: Colors.white, size: 16),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAddImageButton() {
    return InkWell(
      onTap: _isUploading ? null : _pickImage,
      child: Container(
        width: 100,
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.1)),
        ),
        child: _isUploading
            ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
            : const Icon(IconlyLight.image, color: AppColors.primary, size: 32),
      ),
    );
  }

  String? _calculateNewPrice() {
    final original = double.tryParse(_originalPriceController.text);
    if (original == null) return null;

    final discountText = _discountController.text.replaceAll('%', '').trim();
    final discountValue = double.tryParse(discountText);
    if (discountValue == null) return null;

    if (_discountController.text.contains('%')) {
      return (original * (1 - discountValue / 100)).toStringAsFixed(0);
    } else {
      final result = original - discountValue;
      return result > 0 ? result.toStringAsFixed(0) : '0';
    }
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
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.cairo(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          validator: validator,
          keyboardType: keyboardType,
          onChanged: onChanged,
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: Icon(icon, size: 20),
            filled: true,
            fillColor: AppColors.white,
          ),
        ),
      ],
    );
  }

  Widget _buildDatePicker(String label, DateTime date, VoidCallback onTap) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.cairo(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
        const SizedBox(height: 8),
        InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: AppColors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade200)),
            child: Row(
              children: [
                const Icon(IconlyLight.calendar, size: 18, color: AppColors.primary),
                const SizedBox(width: 8),
                Text(DateFormat('yyyy/MM/dd').format(date), style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
