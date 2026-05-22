import 'dart:async';
import 'dart:developer';
import 'dart:math' hide log;

import 'package:socket_io_client/socket_io_client.dart' as io;

import '../constants/app_constants.dart';
import '../utils/connectivity_util.dart';

class SocketService {
  io.Socket? _socket;
  bool _isInitialized = false;
  String? _userId;
  String? _token;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 5;
  Timer? _reconnectTimer;
  StreamSubscription<bool>? _connectivitySub;

  late final StreamController<Map<String, dynamic>> _newOfferController;
  late final StreamController<Map<String, dynamic>> _offersUpdatedController;
  late final StreamController<Map<String, dynamic>> _couponUpdateController;
  late final StreamController<Map<String, dynamic>> _socialProofController;
  late final StreamController<Map<String, dynamic>> _categoriesUpdatedController;
  late final StreamController<Map<String, dynamic>> _bannersUpdatedController;
  late final StreamController<Map<String, dynamic>> _reviewReplyController;
  late final StreamController<Map<String, dynamic>> _announcementController;

  Stream<Map<String, dynamic>> get onNewOffer => _newOfferController.stream;
  Stream<Map<String, dynamic>> get onOffersUpdated => _offersUpdatedController.stream;
  Stream<Map<String, dynamic>> get onCouponUpdate => _couponUpdateController.stream;
  Stream<Map<String, dynamic>> get onSocialProof => _socialProofController.stream;
  Stream<Map<String, dynamic>> get onCategoriesUpdated => _categoriesUpdatedController.stream;
  Stream<Map<String, dynamic>> get onBannersUpdated => _bannersUpdatedController.stream;
  Stream<Map<String, dynamic>> get onReviewReply => _reviewReplyController.stream;
  Stream<Map<String, dynamic>> get onAnnouncement => _announcementController.stream;

  SocketService() {
    _initControllers();
  }

  void _initControllers() {
    _newOfferController = StreamController<Map<String, dynamic>>.broadcast();
    _offersUpdatedController = StreamController<Map<String, dynamic>>.broadcast();
    _couponUpdateController = StreamController<Map<String, dynamic>>.broadcast();
    _socialProofController = StreamController<Map<String, dynamic>>.broadcast();
    _categoriesUpdatedController = StreamController<Map<String, dynamic>>.broadcast();
    _bannersUpdatedController = StreamController<Map<String, dynamic>>.broadcast();
    _reviewReplyController = StreamController<Map<String, dynamic>>.broadcast();
    _announcementController = StreamController<Map<String, dynamic>>.broadcast();
  }

  void initSocket(String userId, String token) {
    if (_isInitialized) reinit();
    _userId = userId;
    _token = token;
    _reconnectAttempts = 0;
    _connect();
  }

  void _connect() {
    if (_newOfferController.isClosed) _initControllers();
    _socket?.clearListeners();
    _socket?.disconnect();
    _socket?.dispose();

    _socket = io.io(
      AppConstants.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .setAuth({'token': _token ?? ''})
          .enableReconnection()
          .disableAutoConnect()
          .build(),
    );

    _socket!.connect();

    _socket!.onConnect((_) {
      log('[Socket] Connected');
      _reconnectAttempts = 0;
      _reconnectTimer?.cancel();
      _socket!.emit('join_room', {'room': _userId ?? '', 'token': _token ?? ''});
    });

    _socket!.on('new_offer', (data) {
      log('[Socket] new_offer: $data');
      if (!_newOfferController.isClosed) _newOfferController.add(_toMap(data));
    });

    _socket!.on('offers_updated', (data) {
      log('[Socket] offers_updated: $data');
      if (!_offersUpdatedController.isClosed) _offersUpdatedController.add(_toMap(data));
    });

    _socket!.on('social_proof', (data) {
      log('[Socket] social_proof: $data');
      if (!_socialProofController.isClosed) _socialProofController.add(_toMap(data));
    });

    _socket!.on('coupon_update', (data) {
      log('[Socket] coupon_update: $data');
      if (!_couponUpdateController.isClosed) _couponUpdateController.add(_toMap(data));
    });

    _socket!.on('categories_updated', (data) {
      log('[Socket] categories_updated: $data');
      if (!_categoriesUpdatedController.isClosed) _categoriesUpdatedController.add(_toMap(data));
    });

    _socket!.on('banners_updated', (data) {
      log('[Socket] banners_updated: $data');
      if (!_bannersUpdatedController.isClosed) _bannersUpdatedController.add(_toMap(data));
    });

    _socket!.on('review_reply', (data) {
      log('[Socket] review_reply: $data');
      final map = _toMap(data);
      if (!_reviewReplyController.isClosed) _reviewReplyController.add(map);
    });

    _socket!.on('announcement', (data) {
      log('[Socket] announcement: $data');
      final map = _toMap(data);
      if (!_announcementController.isClosed) _announcementController.add(map);
    });

    _socket!.on('auth_warning', (data) {
      log('[Socket] auth_warning: $data');
    });

    _socket!.on('error', (data) {
      log('[Socket] error: $data');
    });

    _socket!.onConnectError((error) {
      log('[Socket] connect_error: $error');
      _scheduleReconnect();
    });
    _socket!.onDisconnect((_) {
      log('[Socket] Disconnected');
      _scheduleReconnect();
    });

    _isInitialized = true;

    _connectivitySub?.cancel();
    _connectivitySub = ConnectivityUtil().connectionStream.listen((isOnline) {
      if (isOnline && (_socket == null || !_socket!.connected)) {
        log('[Socket] Network restored — reconnecting immediately');
        _reconnectAttempts = 0;
        _connect();
      }
    });
  }

  void _scheduleReconnect() {
    if (!_isInitialized || _reconnectAttempts >= _maxReconnectAttempts) return;
    _reconnectTimer?.cancel();
    final delay = Duration(seconds: min(pow(2, _reconnectAttempts).toInt(), 30));
    _reconnectAttempts++;
    log('[Socket] Reconnecting in ${delay.inSeconds}s (attempt $_reconnectAttempts)');
    _reconnectTimer = Timer(delay, () {
      if (_isInitialized) _connect();
    });
  }

  void dispose() {
    _reconnectTimer?.cancel();
    _connectivitySub?.cancel();
    _socket?.clearListeners();
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _newOfferController.close();
    _offersUpdatedController.close();
    _couponUpdateController.close();
    _socialProofController.close();
    _categoriesUpdatedController.close();
    _bannersUpdatedController.close();
    _reviewReplyController.close();
    _announcementController.close();
    _isInitialized = false;
  }

  void reinit() {
    _reconnectTimer?.cancel();
    _connectivitySub?.cancel();
    _socket?.clearListeners();
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _isInitialized = false;
    _reconnectAttempts = 0;
    _closeControllers();
    _initControllers();
  }

  void _closeControllers() {
    _newOfferController.close();
    _offersUpdatedController.close();
    _couponUpdateController.close();
    _socialProofController.close();
    _categoriesUpdatedController.close();
    _bannersUpdatedController.close();
    _reviewReplyController.close();
    _announcementController.close();
  }

  Map<String, dynamic> _toMap(dynamic data) {
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return {};
  }
}
