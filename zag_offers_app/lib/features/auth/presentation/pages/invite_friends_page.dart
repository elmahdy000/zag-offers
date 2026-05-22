import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/snackbar_utils.dart';

class InviteFriendsPage extends StatelessWidget {
  final String referralCode;

  const InviteFriendsPage({super.key, required this.referralCode});

  void _copyCode(BuildContext context) async {
    await Clipboard.setData(ClipboardData(text: referralCode));
    if (context.mounted) {
      SnackBarUtils.showSuccess(context, 'تم نسخ كود الدعوة بنجاح!');
    }
  }

  void _shareCode() {
    Share.share(
      'انضم إلي في تطبيق Zag Offers واستخدم كود الدعوة الخاص بي: $referralCode\n'
      'احصل على خصومات حصرية، واجمع نقاط لتحصل على مكافآت رائعة!\n\n'
      'حمل التطبيق من هنا: https://zagoffers.online',
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('دعوة الأصدقاء'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const SizedBox(height: 20),
            // Illustration or Icon
            Container(
              padding: const EdgeInsets.all(30),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.card_giftcard_rounded,
                size: 80,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 32),
            // Title
            const Text(
              'اكسب 100 نقطة مجاناً!',
              style: TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.w900,
                color: AppColors.primary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            // Subtitle
            const Text(
              'شارك كود الدعوة الخاص بك مع أصدقائك.\nعندما يسجل صديقك ويقوم بأول عملية له، ستحصل أنت وهو على مكافأة 100 نقطة لكل منكما!',
              style: TextStyle(
                fontSize: 16,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 40),
            // Code Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: AppColors.primary.withValues(alpha: 0.3),
                  width: 2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Column(
                children: [
                  const Text(
                    'كود الدعوة الخاص بك',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        referralCode.isNotEmpty ? referralCode : 'غير متاح',
                        style: const TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 4,
                        ),
                      ),
                      const SizedBox(width: 16),
                      if (referralCode.isNotEmpty)
                        IconButton(
                          onPressed: () => _copyCode(context),
                          icon: const Icon(Icons.copy_rounded),
                          color: AppColors.primary,
                          tooltip: 'نسخ الكود',
                        ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
            // Share Button
            if (referralCode.isNotEmpty)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _shareCode,
                  icon: const Icon(Icons.share_rounded, color: Colors.white),
                  label: const Text(
                    'مشاركة الكود',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 5,
                    shadowColor: AppColors.primary.withValues(alpha: 0.5),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
