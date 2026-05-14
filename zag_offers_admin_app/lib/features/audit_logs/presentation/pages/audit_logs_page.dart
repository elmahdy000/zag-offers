import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_iconly/flutter_iconly.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_admin_app/features/audit_logs/domain/entities/audit_log.dart';
import 'package:zag_offers_admin_app/features/audit_logs/presentation/bloc/audit_logs_bloc.dart';
import 'package:zag_offers_admin_app/core/widgets/skeleton_loader.dart';
import 'package:zag_offers_admin_app/core/theme/app_colors.dart';

class AuditLogsPage extends StatefulWidget {
  const AuditLogsPage({super.key});

  @override
  State<AuditLogsPage> createState() => _AuditLogsPageState();
}

class _AuditLogsPageState extends State<AuditLogsPage> {
  @override
  void initState() {
    super.initState();
    context.read<AuditLogsBloc>().add(LoadAuditLogsEvent());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('سجل عمليات المنصة'),
      ),
      body: BlocBuilder<AuditLogsBloc, AuditLogsState>(
        builder: (context, state) {
          if (state is AuditLogsLoading) {
            return const ListSkeleton(itemCount: 5);
          } else if (state is AuditLogsLoaded) {
            if (state.logs.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), shape: BoxShape.circle),
                      child: Icon(IconlyBold.document, size: 64, color: AppColors.primary.withValues(alpha: 0.7)),
                    ),
                    const SizedBox(height: 24),
                    Text('لا توجد سجلات بعد', style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                  ],
                ),
              );
            }
            return RefreshIndicator(
              onRefresh: () async {
                context.read<AuditLogsBloc>().add(LoadAuditLogsEvent());
              },
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: state.logs.length,
                itemBuilder: (context, index) => _buildLogItem(state.logs[index])
                    .animate(delay: (index * 50).ms)
                    .fadeIn(duration: 400.ms)
                    .slideY(begin: 0.1, curve: Curves.easeOutCubic),
              ),
            );
          } else if (state is AuditLogsError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline_rounded, size: 64, color: AppColors.error),
                    const SizedBox(height: 16),
                    Text(state.message, style: GoogleFonts.cairo(color: AppColors.textSecondary), textAlign: TextAlign.center),
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      onPressed: () => context.read<AuditLogsBloc>().add(LoadAuditLogsEvent()),
                      icon: const Icon(IconlyLight.swap),
                      label: const Text('إعادة المحاولة'),
                    ),
                  ],
                ),
              ),
            );
          }
          return const SizedBox();
        },
      ),
    );
  }

  Widget _buildLogItem(AuditLog log) {
    final actionColor = _actionColor(log.action);
    final description = _buildDescription(log);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: InkWell(
        onTap: () => _showLogDetails(context, log, description, actionColor),
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(color: actionColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                    child: Text(
                      log.action.replaceAll('_', ' '),
                      style: GoogleFonts.inter(color: actionColor, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                  Text(DateFormat('HH:mm · dd/MM', 'ar').format(log.createdAt), style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary)),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(width: 4, height: 24, decoration: BoxDecoration(color: actionColor.withValues(alpha: 0.5), borderRadius: BorderRadius.circular(2))),
                  const SizedBox(width: 12),
                  Expanded(child: Text(description, style: GoogleFonts.cairo(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary))),
                ],
              ),
              if (log.details != null) ...[
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.only(right: 16),
                  child: Text(log.details!, style: GoogleFonts.cairo(fontSize: 12, color: AppColors.textSecondary, height: 1.4)),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _showLogDetails(BuildContext context, AuditLog log, String description, Color actionColor) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(10)))),
              const SizedBox(height: 32),
              Row(
                children: [
                  Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: actionColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)), child: Icon(IconlyBold.activity, color: actionColor, size: 28)),
                  const SizedBox(width: 16),
                  Expanded(child: Text(description, style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary))),
                ],
              ),
              const SizedBox(height: 32),
              _buildDetailRow(IconlyBold.user2, 'القائم بالعملية', log.adminName),
              _buildDetailRow(IconlyBold.category, 'الكيان المستهدف', log.entityType),
              _buildDetailRow(IconlyBold.infoSquare, 'معرف الكيان', log.entityId),
              _buildDetailRow(IconlyBold.timeCircle, 'تاريخ العملية', DateFormat('yyyy/MM/dd hh:mm a', 'ar').format(log.createdAt)),
              if (log.details != null && log.details!.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text('تفاصيل إضافية:', style: GoogleFonts.cairo(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade100)),
                  child: Text(log.details!, style: GoogleFonts.inter(fontSize: 13, color: AppColors.textPrimary, height: 1.5)),
                ),
              ],
              const SizedBox(height: 40),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('إغلاق'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.textSecondary.withValues(alpha: 0.5)),
          const SizedBox(width: 12),
          Text(label, style: GoogleFonts.cairo(fontSize: 14, color: AppColors.textSecondary)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  String _buildDescription(AuditLog log) {
    final admin = log.adminName;
    final entityType = log.entityType.toLowerCase();
    final action = log.action.toUpperCase();

    String entity = '';
    switch (entityType) {
      case 'merchant': entity = 'تاجر'; break;
      case 'offer': entity = 'عرض'; break;
      case 'user': entity = 'مستخدم'; break;
      case 'category': entity = 'قسم'; break;
      case 'coupon': entity = 'كوبون'; break;
      default: entity = entityType;
    }

    switch (action) {
      case 'APPROVE_MERCHANT':
      case 'APPROVE_OFFER': return 'وافق $admin على $entity';
      case 'REJECT_MERCHANT':
      case 'REJECT_OFFER': return 'رفض $admin $entity';
      case 'DELETE_USER':
      case 'DELETE_MERCHANT':
      case 'DELETE_OFFER':
      case 'DELETE_CATEGORY':
      case 'DELETE_COUPON': return 'حذف $admin $entity';
      case 'CREATE_CATEGORY': return 'أنشأ $admin $entity جديد';
      case 'UPDATE_PROFILE': return 'قام $admin بتحديث ملفه الشخصي';
      case 'CHANGE_PASSWORD': return 'قام $admin بتغيير كلمة المرور';
      case 'BROADCAST_NOTIFICATION': return 'أرسل $admin تنبيهاً جماعياً';
      case 'LOGIN': return 'قام $admin بتسجيل الدخول';
      case 'LOGOUT': return 'قام $admin بتسجيل الخروج';
      default: return '$admin: $action $entity';
    }
  }

  Color _actionColor(String action) {
    final upper = action.toUpperCase();
    if (upper.contains('APPROVE')) return AppColors.success;
    if (upper.contains('REJECT')) return AppColors.error;
    if (upper.contains('DELETE')) return AppColors.error;
    if (upper.contains('CREATE')) return Colors.blue[600]!;
    if (upper.contains('UPDATE') || upper.contains('CHANGE')) return AppColors.primary;
    if (upper.contains('BROADCAST')) return Colors.purple[600]!;
    return AppColors.textSecondary;
  }
}
