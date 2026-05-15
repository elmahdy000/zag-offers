import 'package:flutter/material.dart';
import '../../../../core/utils/snackbar_utils.dart';
import '../../../../injection_container.dart' as di;
import '../../data/datasources/offers_remote_data_source.dart';
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
    try {
      final remoteDataSource = di.sl<OffersRemoteDataSource>();
      final offer = await remoteDataSource.getOfferById(widget.offerId);
      
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => OfferDetailPage(offer: offer),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        SnackBarUtils.showError(context, 'فشل تحميل العرض، يرجى المحاولة مرة أخرى.');
        Navigator.of(context).pop();
      }
    }
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
