import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';

class ConnectivityUtil {
  static final ConnectivityUtil _instance = ConnectivityUtil._internal();
  factory ConnectivityUtil() => _instance;
  ConnectivityUtil._internal();

  final Connectivity _connectivity = Connectivity();
  final StreamController<bool> _connectionController = StreamController<bool>.broadcast();

  bool _isOnline = true;

  Stream<bool> get connectionStream => _connectionController.stream;
  bool get isOnline => _isOnline;

  Future<void> init() async {
    final result = await _connectivity.checkConnectivity();
    _updateConnectionStatus(result);

    _connectivity.onConnectivityChanged.listen((result) {
      _updateConnectionStatus(result);
    });
  }

  void _updateConnectionStatus(List<ConnectivityResult> result) {
    _isOnline = result.contains(ConnectivityResult.mobile) ||
                result.contains(ConnectivityResult.wifi) ||
                result.contains(ConnectivityResult.ethernet);
    _connectionController.add(_isOnline);
  }

  void dispose() {
    _connectionController.close();
  }
}
