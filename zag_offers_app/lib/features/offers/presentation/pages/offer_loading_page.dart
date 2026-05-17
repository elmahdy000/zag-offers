import 'package:flutter/material.dart';
import '../../../../core/utils/snackbar_utils.dart';
import '../../../../injection_container.dart' as di;
import '../../domain/repositories/offers_repository.dart';
import 'offer_detail_page.dart';

class OfferLoadingPage extends StatefulWidget {
  final String offerId;

  const OfferLoadingPage({super.key, required this.offerId});

  @override
  State<OfferLoadingPage> createState() => _OfferLoadingPageState();
}

class _OfferLoadingPageState extends State<OfferLoadingPage> {
  @override
  void initState() {
    super.initState();
    _fetchAndNavigate();
  }

  Future<void> _fetchAndNavigate() async {
    final repository = di.sl<OffersRepository>();
    final result = await repository.getOfferById(widget.offerId);
    
    if (!mounted) return;

    result.fold(
      (failure) {
        SnackBarUtils.showError(context, failure.message);
        Navigator.of(context).pop();
      },
      (offer) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => OfferDetailPage(offer: offer),
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
