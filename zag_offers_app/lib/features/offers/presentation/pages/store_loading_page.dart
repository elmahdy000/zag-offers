import 'package:flutter/material.dart';
import '../../../../core/utils/snackbar_utils.dart';
import '../../../../injection_container.dart' as di;
import '../../domain/repositories/offers_repository.dart';
import 'store_detail_page.dart';

class StoreLoadingPage extends StatefulWidget {
  final String storeId;

  const StoreLoadingPage({super.key, required this.storeId});

  @override
  State<StoreLoadingPage> createState() => _StoreLoadingPageState();
}

class _StoreLoadingPageState extends State<StoreLoadingPage> {
  @override
  void initState() {
    super.initState();
    _fetchAndNavigate();
  }

  Future<void> _fetchAndNavigate() async {
    final repository = di.sl<OffersRepository>();
    final result = await repository.getStoreById(widget.storeId);

    if (!mounted) return;

    result.fold(
      (failure) {
        SnackBarUtils.showError(context, failure.message);
        Navigator.of(context).pop();
      },
      (store) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => StoreDetailPage(store: store),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}
