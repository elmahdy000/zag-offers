import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_admin_app/features/broadcast/presentation/bloc/broadcast_bloc.dart';

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
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'إرسال تنبيه جماعي',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
        ),
      ),
      body: BlocListener<BroadcastBloc, BroadcastState>(
        listener: (context, state) {
          if (state is BroadcastSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('تم إرسال التنبيه بنجاح!'),
                backgroundColor: Colors.green,
              ),
            );
            _titleController.clear();
            _bodyController.clear();
            _imageUrlController.clear();
            setState(() => _selectedArea = null);
          } else if (state is BroadcastError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildSectionTitle('محتوى الرسالة'),
              const SizedBox(height: 12),
              TextField(
                controller: _titleController,
                decoration: _buildInputDecoration(
                  'العنوان (قصير وجذاب)',
                  Icons.title,
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _bodyController,
                maxLines: 3,
                decoration: _buildInputDecoration(
                  'نص الرسالة',
                  Icons.message,
                ),
              ),
              const SizedBox(height: 24),
              _buildSectionTitle('وسائط (اختياري)'),
              const SizedBox(height: 12),
              TextField(
                controller: _imageUrlController,
                decoration: _buildInputDecoration(
                  'رابط الصورة',
                  Icons.image,
                ),
              ),
              const SizedBox(height: 24),
              _buildSectionTitle('المنطقة المستهدفة (اختياري)'),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _selectedArea,
                decoration: _buildInputDecoration(
                  'اختر المنطقة',
                  Icons.location_on,
                ),
                items: ['كل المناطق', 'الزقازيق', 'القوم', 'حي الزهور']
                    .map((e) {
                  return DropdownMenuItem(
                    value: e == 'كل المناطق' ? null : e,
                    child: Text(e),
                  );
                }).toList(),
                onChanged: (val) => setState(() => _selectedArea = val),
              ),
              const SizedBox(height: 40),
              BlocBuilder<BroadcastBloc, BroadcastState>(
                builder: (context, state) {
                  return ElevatedButton.icon(
                    onPressed: state is BroadcastLoading
                        ? null
                        : () {
                            if (_titleController.text.isEmpty ||
                                _bodyController.text.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('العنوان والنص مطلوبان'),
                                ),
                              );
                              return;
                            }
                            context.read<BroadcastBloc>().add(
                                  SendBroadcastEvent(
                                    title: _titleController.text,
                                    body: _bodyController.text,
                                    imageUrl:
                                        _imageUrlController.text.isEmpty
                                            ? null
                                            : _imageUrlController.text,
                                    area: _selectedArea,
                                  ),
                                );
                          },
                    icon: state is BroadcastLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.send),
                    label: Text(
                      state is BroadcastLoading
                          ? 'جاري الإرسال...'
                          : 'إرسال التنبيه الآن',
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFF6B00),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.cairo(
        fontSize: 16,
        fontWeight: FontWeight.bold,
        color: Colors.blueGrey[700],
      ),
    );
  }

  InputDecoration _buildInputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, color: const Color(0xFFFF6B00).withValues(alpha: 0.5)),
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Color(0xFFFF6B00), width: 1),
      ),
    );
  }
}
