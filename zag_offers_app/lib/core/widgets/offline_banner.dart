import 'package:flutter/material.dart';
import 'package:zag_offers_app/core/utils/connectivity_util.dart';

class OfflineBanner extends StatelessWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<bool>(
      stream: ConnectivityUtil().connectionStream,
      initialData: ConnectivityUtil().isOnline,
      builder: (context, snapshot) {
        final isOnline = snapshot.data ?? true;

        if (isOnline) {
          return const SizedBox.shrink();
        }

        return Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.orange[50],
            border: Border(
              bottom: BorderSide(color: Colors.orange[200]!),
            ),
          ),
          child: Row(
            children: [
              Icon(
                Icons.wifi_off_rounded,
                color: Colors.orange[700],
                size: 20,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'أنت غير متصل بالإنترنت - عرض البيانات المحفوظة',
                  style: TextStyle(
                    color: Colors.orange[900],
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
