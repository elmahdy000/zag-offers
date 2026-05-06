import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_admin_app/features/audit_logs/domain/entities/audit_log.dart';
import 'package:zag_offers_admin_app/features/audit_logs/presentation/bloc/audit_logs_bloc.dart';
import 'package:zag_offers_admin_app/core/widgets/skeleton_loader.dart';

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
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'سجل عمليات المنصة',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
        ),
      ),
      body: BlocBuilder<AuditLogsBloc, AuditLogsState>(
        builder: (context, state) {
          if (state is AuditLogsLoading) {
            return const ListSkeleton(itemCount: 5);
          } else if (state is AuditLogsLoaded) {
            if (state.logs.isEmpty) {
              return Center(
                child: Text(
                  'لم يتم العثور على سجلات',
                  style: GoogleFonts.cairo(color: Colors.blueGrey[500]),
                ),
              );
            }
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: state.logs.length,
              itemBuilder: (context, index) {
                return _buildLogItem(state.logs[index]);
              },
            );
          } else if (state is AuditLogsError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.error_outline,
                      size: 64,
                      color: Colors.red[300],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      state.message,
                      style: GoogleFonts.cairo(
                        fontSize: 16,
                        color: Colors.grey[700],
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () => context.read<AuditLogsBloc>().add(LoadAuditLogsEvent()),
                      icon: const Icon(Icons.refresh),
                      label: const Text('إعادة المحاولة'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFFF6B00),
                        foregroundColor: Colors.white,
                      ),
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

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.blueGrey[100]!),
      ),
      child: InkWell(
        onTap: () => _showLogDetails(context, log, description, actionColor),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: actionColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      log.action.replaceAll('_', ' '),
                      style: GoogleFonts.inter(
                        color: actionColor,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Text(
                    DateFormat('HH:mm · dd/MM', 'ar').format(log.createdAt),
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: Colors.blueGrey[400],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                description,
                style: GoogleFonts.cairo(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              if (log.details != null) ...[
                const SizedBox(height: 4),
                Text(
                  log.details!,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: Colors.blueGrey[500],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _showLogDetails(
    BuildContext context,
    AuditLog log,
    String description,
    Color actionColor,
  ) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.blueGrey[200],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: actionColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(Icons.info_outline, color: actionColor),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      description,
                      style: GoogleFonts.cairo(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              _buildDetailRow(
                'نوع العملية',
                log.action.replaceAll('_', ' '),
              ),
              _buildDetailRow('اسم المشرف', log.adminName),
              _buildDetailRow('الكيان المستهدف', log.entityType),
              _buildDetailRow('معرف الكيان', log.entityId),
              _buildDetailRow(
                'تاريخ العملية',
                DateFormat('yyyy/MM/dd hh:mm a', 'ar').format(log.createdAt),
              ),
              if (log.details != null && log.details!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  'تفاصيل إضافية:',
                  style: GoogleFonts.cairo(
                    fontSize: 14,
                    color: Colors.blueGrey[400],
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.blueGrey[50],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    log.details!,
                    style: GoogleFonts.inter(fontSize: 14),
                  ),
                ),
              ],
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFF6B00),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    'إغلاق',
                    style: GoogleFonts.cairo(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: GoogleFonts.cairo(fontSize: 14, color: Colors.blueGrey[500]),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.left,
            ),
          ),
        ],
      ),
    );
  }

  /// Maps every known action verb to a human-readable Arabic sentence.
  String _buildDescription(AuditLog log) {
    final admin = log.adminName;
    final entityType = log.entityType.toLowerCase();
    final action = log.action.toUpperCase();

    String entity = '';
    switch (entityType) {
      case 'merchant':
        entity = 'تاجر';
        break;
      case 'offer':
        entity = 'عرض';
        break;
      case 'user':
        entity = 'مستخدم';
        break;
      case 'category':
        entity = 'قسم';
        break;
      case 'coupon':
        entity = 'كوبون';
        break;
      default:
        entity = entityType;
    }

    switch (action) {
      case 'APPROVE_MERCHANT':
      case 'APPROVE_OFFER':
        return 'وافق $admin على $entity';
      case 'REJECT_MERCHANT':
      case 'REJECT_OFFER':
        return 'رفض $admin $entity';
      case 'DELETE_USER':
      case 'DELETE_MERCHANT':
      case 'DELETE_OFFER':
      case 'DELETE_CATEGORY':
      case 'DELETE_COUPON':
        return 'حذف $admin $entity';
      case 'CREATE_CATEGORY':
        return 'أنشأ $admin $entity جديد';
      case 'UPDATE_PROFILE':
        return 'قام $admin بتحديث ملفه الشخصي';
      case 'CHANGE_PASSWORD':
        return 'قام $admin بتغيير كلمة المرور';
      case 'BROADCAST_NOTIFICATION':
        return 'أرسل $admin تنبيهاً جماعياً';
      case 'LOGIN':
        return 'قام $admin بتسجيل الدخول';
      case 'LOGOUT':
        return 'قام $admin بتسجيل الخروج';
      default:
        return '$admin: $action $entity';
    }
  }

  /// Assigns a colour to each action category for the badge.
  Color _actionColor(String action) {
    final upper = action.toUpperCase();
    if (upper.contains('APPROVE')) return Colors.green[700]!;
    if (upper.contains('REJECT')) return Colors.red[700]!;
    if (upper.contains('DELETE')) return Colors.red[400]!;
    if (upper.contains('CREATE')) return Colors.blue[700]!;
    if (upper.contains('UPDATE') || upper.contains('CHANGE'))
      return const Color(0xFFFF6B00);
    if (upper.contains('BROADCAST')) return Colors.purple[700]!;
    return Colors.blueGrey[600]!;
  }
}

