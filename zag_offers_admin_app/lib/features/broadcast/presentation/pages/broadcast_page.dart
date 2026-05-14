import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_iconly/flutter_iconly.dart';
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
  String _target = 'ALL'; // ALL, USERS, MERCHANTS

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
        title: const Text('مركز البث والاشعارات'),
      ),
      body: BlocListener<BroadcastBloc, BroadcastState>(
        listener: (context, state) {
          if (state is BroadcastSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('🚀 تم إرسال التنبيه الجماعي بنجاح!'), backgroundColor: AppColors.success),
            );
            _titleController.clear();
            _bodyController.clear();
            _imageUrlController.clear();
            setState(() {
              _selectedArea = null;
              _target = 'ALL';
            });
          } else if (state is BroadcastError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: AppColors.error),
            );
          }
        },
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // --- Stats Row ---
              Row(
                children: [
                  Expanded(child: _buildQuickStat('النشطين', '1.2k', IconlyBold.voice, Colors.amber)),
                  const SizedBox(width: 12),
                  Expanded(child: _buildQuickStat('مرسل اليوم', '4', IconlyBold.send, AppColors.primary)),
                  const SizedBox(width: 12),
                  Expanded(child: _buildQuickStat('الوصول', '98%', IconlyBold.tickSquare, AppColors.success)),
                ],
              ).animate().fadeIn().slideY(begin: 0.1),
              const SizedBox(height: 24),

              // --- Notification Preview ---
              _buildSectionTitle('معاينة الإشعار (مباشر)', IconlyBold.show),
              const SizedBox(height: 12),
              _buildLivePreview().animate().fadeIn(delay: 200.ms).slideY(begin: 0.1),
              const SizedBox(height: 24),

              // --- Target Selection ---
              _buildSectionTitle('الجمهور المستهدف', IconlyBold.user3),
              const SizedBox(height: 12),
              _buildTargetSelector().animate().fadeIn(delay: 300.ms).slideY(begin: 0.1),
              const SizedBox(height: 24),

              // --- Form ---
              _buildFormSection(
                'محتوى الرسالة',
                IconlyBold.edit,
                [
                  TextField(
                    controller: _titleController,
                    onChanged: (v) => setState(() {}),
                    decoration: const InputDecoration(
                      hintText: 'عنوان الإشعار...',
                      prefixIcon: Icon(IconlyBold.edit, color: AppColors.primary),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _bodyController,
                    onChanged: (v) => setState(() {}),
                    maxLines: 3,
                    decoration: const InputDecoration(
                      hintText: 'اكتب نص الرسالة هنا...',
                      prefixIcon: Padding(padding: EdgeInsets.only(bottom: 40), child: Icon(IconlyBold.document, color: AppColors.primary)),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _imageUrlController,
                    onChanged: (v) => setState(() {}),
                    decoration: const InputDecoration(
                      hintText: 'رابط الصورة (اختياري)...',
                      prefixIcon: Icon(IconlyBold.image, color: AppColors.primary),
                    ),
                  ),
                ],
              ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.1),
              const SizedBox(height: 24),

              _buildFormSection(
                'تصفية الموقع',
                IconlyBold.location,
                [
                  DropdownButtonFormField<String>(
                    value: _selectedArea,
                    decoration: const InputDecoration(hintText: 'كل المناطق', prefixIcon: Icon(IconlyBold.location, color: AppColors.primary)),
                    items: ['كل المناطق', 'الزقازيق', 'القوم', 'حي الزهور'].map((e) {
                      return DropdownMenuItem(value: e == 'كل المناطق' ? null : e, child: Text(e));
                    }).toList(),
                    onChanged: (val) => setState(() => _selectedArea = val),
                  ),
                ],
              ).animate().fadeIn(delay: 500.ms).slideY(begin: 0.1),

              const SizedBox(height: 40),

              // --- Action Button ---
              BlocBuilder<BroadcastBloc, BroadcastState>(
                builder: (context, state) {
                  return Container(
                    decoration: BoxDecoration(
                      boxShadow: [
                        BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 8)),
                      ],
                    ),
                    child: ElevatedButton.icon(
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
                                      target: _target,
                                    ),
                                  );
                            },
                      icon: state is BroadcastLoading
                          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(IconlyBold.send),
                      label: Text(state is BroadcastLoading ? 'جاري البث الآن...' : 'بث الإشعار للجميع'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 120),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickStat(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(height: 12),
          Text(value, style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          Text(label, style: GoogleFonts.cairo(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.textSecondary),
        const SizedBox(width: 8),
        Text(title, style: GoogleFonts.cairo(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
      ],
    );
  }

  Widget _buildLivePreview() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade800),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(12),
              image: _imageUrlController.text.isNotEmpty ? DecorationImage(image: NetworkImage(_imageUrlController.text), fit: BoxFit.cover) : null,
            ),
            child: _imageUrlController.text.isEmpty ? const Icon(Icons.notifications_active_rounded, color: Colors.white) : null,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Zag Offers', style: GoogleFonts.inter(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.w600)),
                    Text('الآن', style: GoogleFonts.cairo(color: Colors.white38, fontSize: 10)),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  _titleController.text.isEmpty ? 'عنوان الإشعار' : _titleController.text,
                  style: GoogleFonts.cairo(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  _bodyController.text.isEmpty ? 'نص الرسالة الذي سيظهر للمستخدمين على شاشاتهم...' : _bodyController.text,
                  style: GoogleFonts.cairo(color: Colors.white60, fontSize: 12, height: 1.3),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTargetSelector() {
    return Row(
      children: [
        _buildTargetChip('ALL', 'الجميع', Icons.public_rounded),
        const SizedBox(width: 8),
        _buildTargetChip('USERS', 'المستخدمين', Icons.person_rounded),
        const SizedBox(width: 8),
        _buildTargetChip('MERCHANTS', 'التجار', Icons.store_rounded),
      ],
    );
  }

  Widget _buildTargetChip(String value, String label, IconData icon) {
    final isSelected = _target == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _target = value),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary : AppColors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: isSelected ? AppColors.primary : Colors.grey.shade200),
          ),
          child: Column(
            children: [
              Icon(icon, size: 20, color: isSelected ? Colors.white : AppColors.textSecondary),
              const SizedBox(height: 4),
              Text(label, style: GoogleFonts.cairo(fontSize: 11, color: isSelected ? Colors.white : AppColors.textSecondary, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFormSection(String title, IconData icon, List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(title, style: GoogleFonts.cairo(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            ],
          ),
          const SizedBox(height: 20),
          ...children,
        ],
      ),
    );
  }
}
