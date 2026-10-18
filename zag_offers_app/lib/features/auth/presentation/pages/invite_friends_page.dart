import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/snackbar_utils.dart';
import '../../../../core/widgets/bouncy_tap.dart';

class InviteFriendsPage extends StatelessWidget {
  final String referralCode;

  const InviteFriendsPage({super.key, required this.referralCode});

  void _copyCode(BuildContext context) async {
    HapticFeedback.mediumImpact();
    await Clipboard.setData(ClipboardData(text: referralCode));
    if (context.mounted) {
      SnackBarUtils.showSuccess(context, 'تم نسخ كود الدعوة بنجاح! 📋');
    }
  }

  String _getShareMessage() {
    return 'انضم إلي في تطبيق Zag Offers واستخدم كود الدعوة الخاص بي: $referralCode\n'
        'احصل على خصومات حصرية في الزقازيق، واجمع نقاط لتحصل على مكافآت رائعة!\n\n'
        'حمل التطبيق من هنا: https://zagoffers.online';
  }

  void _shareCode() {
    HapticFeedback.lightImpact();
    SharePlus.instance.share(
      ShareParams(text: _getShareMessage()),
    );
  }

  Future<void> _shareWhatsApp(BuildContext context) async {
    HapticFeedback.lightImpact();
    final message = _getShareMessage();
    final nativeUri = Uri.parse('whatsapp://send?text=${Uri.encodeComponent(message)}');
    final webUri = Uri.parse('https://wa.me/?text=${Uri.encodeComponent(message)}');

    try {
      if (await canLaunchUrl(nativeUri)) {
        await launchUrl(nativeUri);
      } else if (await canLaunchUrl(webUri)) {
        await launchUrl(webUri, mode: LaunchMode.externalApplication);
      } else {
        _shareCode();
      }
    } catch (_) {
      _shareCode();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'دعوة الأصدقاء',
          style: GoogleFonts.cairo(fontWeight: FontWeight.w900),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 40),
        child: Column(
          children: [
            const SizedBox(height: 10),
            // Hero Icon Container with Glow
            Center(
              child: Container(
                width: 110,
                height: 110,
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    colors: [
                      AppColors.primary.withValues(alpha: 0.22),
                      AppColors.primary.withValues(alpha: 0.04),
                    ],
                  ),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.35),
                    width: 2,
                  ),
                ),
                child: const Center(
                  child: Icon(
                    Icons.card_giftcard_rounded,
                    size: 54,
                    color: AppColors.primary,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            // Title
            Text(
              'اكسب 100 نقطة هدية! 🎁',
              style: GoogleFonts.cairo(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : AppColors.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 10),
            // Subtitle
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                'شارك كودك المميز مع أصدقائك في الزقازيق، وعند أول استخدام لكوبون يحصل كل منكما على 100 نقطة فوراً!',
                style: GoogleFonts.cairo(
                  fontSize: 13.5,
                  height: 1.6,
                  color: isDark ? AppColors.textDarkDim : AppColors.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 28),
            // Code Card with strict LTR and Midnight Navy styling
            BouncyTap(
              onTap: referralCode.isNotEmpty ? () => _copyCode(context) : null,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 22),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF162032) : Colors.white,
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(
                    color: isDark
                        ? AppColors.primary.withValues(alpha: 0.4)
                        : AppColors.primary.withValues(alpha: 0.28),
                    width: 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: isDark ? 0.18 : 0.08),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Text(
                      'كود الدعوة الخاص بك',
                      style: GoogleFonts.cairo(
                        fontSize: 12.5,
                        color: isDark ? AppColors.textDarkDim : AppColors.textSecondary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          referralCode.isNotEmpty ? referralCode : 'غير متاح',
                          textDirection: TextDirection.ltr,
                          style: GoogleFonts.spaceMono(
                            fontSize: 26,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 3,
                            color: AppColors.primary,
                          ),
                        ),
                        if (referralCode.isNotEmpty) ...[
                          const SizedBox(width: 14),
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.15),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.copy_rounded,
                              color: AppColors.primary,
                              size: 18,
                            ),
                          ),
                        ],
                      ],
                    ),
                    if (referralCode.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      Text(
                        'اضغط في أي مكان لنسخ الكود بسهولة 📋',
                        style: GoogleFonts.cairo(
                          fontSize: 11.5,
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),
            // 3-Step Journey Section
            _buildHowItWorksSection(context, isDark),
            const SizedBox(height: 32),
            // Action Buttons
            if (referralCode.isNotEmpty) ...[
              // WhatsApp Direct Share Button
              BouncyTap(
                onTap: () => _shareWhatsApp(context),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF25D366), Color(0xFF128C7E)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF25D366).withValues(alpha: 0.35),
                        blurRadius: 14,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.chat_bubble_rounded, color: Colors.white, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'مشاركة فورية عبر واتساب',
                        style: GoogleFonts.cairo(
                          fontSize: 15,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              // General Share Sheet Button
              BouncyTap(
                onTap: _shareCode,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 13),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isDark
                          ? Colors.white.withValues(alpha: 0.1)
                          : Colors.black.withValues(alpha: 0.08),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.share_rounded,
                        color: isDark ? Colors.white70 : AppColors.textPrimary,
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'مشاركة عبر تطبيقات أخرى',
                        style: GoogleFonts.cairo(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white70 : AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildHowItWorksSection(BuildContext context, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131B2A) : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.06)
              : Colors.black.withValues(alpha: 0.06),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.emoji_events_rounded, color: AppColors.primary, size: 20),
              const SizedBox(width: 8),
              Text(
                'كيف تعمل المكافأة؟',
                style: GoogleFonts.cairo(
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildStepRow(
            number: '1',
            title: 'شارك كود الدعوة',
            desc: 'أرسل كودك لأصحابك في الزقازيق عبر واتساب أو وسائل التواصل.',
            isDark: isDark,
          ),
          const SizedBox(height: 12),
          _buildStepRow(
            number: '2',
            title: 'صاحبك يسجل في التطبيق',
            desc: 'يدخل كودك أثناء التسجيل ويستكشف أفضل العروض الحصرية.',
            isDark: isDark,
          ),
          const SizedBox(height: 12),
          _buildStepRow(
            number: '3',
            title: '100 نقطة هدية لكلاكما',
            desc: 'بمجرد استخدام أول كوبون في أي متجر، تضاف 100 نقطة لمحفظتكما!',
            isDark: isDark,
            isLast: true,
          ),
        ],
      ),
    );
  }

  Widget _buildStepRow({
    required String number,
    required String title,
    required String desc,
    required bool isDark,
    bool isLast = false,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 26,
          height: 26,
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.15),
            shape: BoxShape.circle,
            border: Border.all(
              color: AppColors.primary.withValues(alpha: 0.3),
              width: 1,
            ),
          ),
          child: Center(
            child: Text(
              number,
              style: GoogleFonts.cairo(
                color: AppColors.primary,
                fontWeight: FontWeight.w900,
                fontSize: 12,
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.cairo(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                desc,
                style: GoogleFonts.cairo(
                  fontSize: 11.5,
                  height: 1.5,
                  color: isDark ? AppColors.textDarkDim : AppColors.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
