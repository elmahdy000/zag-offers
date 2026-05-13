import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_admin_app/features/broadcast/presentation/bloc/broadcast_bloc.dart';
import 'package:zag_offers_admin_app/core/theme/app_colors.dart';

class BroadcastPage extends StatefulWidget {
  const BroadcastPage({super.key});

  @override
  State<BroadcastPage> createState() => _BroadcastPageState();
}

class _BroadcastPageState extends State<BroadcastPage> {
  final _titleController = TextEditingController();
  final _bodyController = TextEditingController();
  final _imageUrlController = TextEditingController();
  String? _selectedArea;

  @override
  void dispose() {
    _titleController.dispose();
    _bodyController.dispose();
    _imageUrlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('إرسال تنبيه جماعي'),
      ),
      body: BlocListener<BroadcastBloc, BroadcastState>(
        listener: (context, state) {
          if (state is BroadcastSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('تم إرسال التنبيه بنجاح!'), backgroundColor: AppColors.success),
            );
            _titleController.clear();
            _bodyController.clear();
            _imageUrlController.clear();
            setState(() => _selectedArea = null);
          } else if (state is BroadcastError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: AppColors.error),
            );
          }
        },
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildFormSection(
                'محتوى الرسالة',
                Icons.message_rounded,
                [
                  TextField(
                    controller: _titleController,
                    decoration: const InputDecoration(hintText: 'العنوان (قصير وجذاب)', prefixIcon: Icon(Icons.title_rounded, color: AppColors.primary)),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _bodyController,
                    maxLines: 4,
                    decoration: const InputDecoration(hintText: 'نص الرسالة التفصيلي...', prefixIcon: Padding(padding: EdgeInsets.only(bottom: 60), child: Icon(Icons.description_rounded, color: AppColors.primary))),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              _buildFormSection(
                'الوسائط والجمهور',
                Icons.people_alt_rounded,
                [
                  TextField(
                    controller: _imageUrlController,
                    decoration: const InputDecoration(hintText: 'رابط صورة التنبيه (اختياري)', prefixIcon: Icon(Icons.image_rounded, color: AppColors.primary)),
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: _selectedArea,
                    decoration: const InputDecoration(hintText: 'المنطقة المستهدفة', prefixIcon: Icon(Icons.location_on_rounded, color: AppColors.primary)),
                    items: ['كل المناطق', 'الزقازيق', 'القوم', 'حي الزهور'].map((e) {
                      return DropdownMenuItem(value: e == 'كل المناطق' ? null : e, child: Text(e));
                    }).toList(),
                    onChanged: (val) => setState(() => _selectedArea = val),
                  ),
                ],
              ),
              const SizedBox(height: 48),
              BlocBuilder<BroadcastBloc, BroadcastState>(
                builder: (context, state) {
                  return ElevatedButton.icon(
                    onPressed: state is BroadcastLoading
                        ? null
                        : () {
                            if (_titleController.text.isEmpty || _bodyController.text.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('العنوان والنص مطلوبان')));
                              return;
                            }
                            context.read<BroadcastBloc>().add(
                                  SendBroadcastEvent(
                                    title: _titleController.text,
                                    body: _bodyController.text,
                                    imageUrl: _imageUrlController.text.isEmpty ? null : _imageUrlController.text,
                                    area: _selectedArea,
                                  ),
                                );
                          },
                    icon: state is BroadcastLoading
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.send_rounded),
                    label: Text(state is BroadcastLoading ? 'جاري الإرسال...' : 'إرسال التنبيه للجميع الآن'),
                  );
                },
              ),
              const SizedBox(height: 12),
              Text(
                'سيتم إرسال هذا التنبيه كإشعار (Push Notification) لجميع المستخدمين في المنطقة المحددة.',
                textAlign: TextAlign.center,
                style: GoogleFonts.cairo(fontSize: 12, color: AppColors.textSecondary, height: 1.5),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFormSection(String title, IconData icon, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 18, color: AppColors.primary),
            const SizedBox(width: 8),
            Text(title, style: GoogleFonts.cairo(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          ],
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(color: AppColors.white, borderRadius: BorderRadius.circular(24), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4))]),
          child: Column(children: children),
        ),
      ],
    );
  }
}
