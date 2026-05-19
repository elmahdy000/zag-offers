import 'dart:async';
import 'dart:developer';

import 'package:socket_io_client/socket_io_client.dart' as io;

import '../constants/app_constants.dart';
import '../../injection_container.dart';
import '../../features/notifications/presentation/bloc/notification_bloc.dart';

class SocketService {
  io.Socket? _socket;
  bool _isInitialized = false;

  late final StreamController<Map<String, dynamic>> _newOfferController;
  late final StreamController<Map<String, dynamic>> _couponUpdateController;
  late final StreamController<Map<String, dynamic>> _socialProofController;
  late final StreamController<Map<String, dynamic>> _categoriesUpdatedController;
  late final StreamController<Map<String, dynamic>> _bannersUpdatedController;
  late final StreamController<Map<String, dynamic>> _reviewReplyController;

  /// Emitted when the admin approves a new offer and it goes live.
  Stream<Map<String, dynamic>> get onNewOffer => _newOfferController.stream;

  /// Emitted when the vendor redeems the current user's coupon.
  Stream<Map<String, dynamic>> get onCouponUpdate =>
      _couponUpdateController.stream;

  /// Emitted when any customer generates a coupon (social-proof ticker).
  Stream<Map<String, dynamic>> get onSocialProof => _socialProofController.stream;
  Stream<Map<String, dynamic>> get onCategoriesUpdated =>
      _categoriesUpdatedController.stream;
  Stream<Map<String, dynamic>> get onBannersUpdated =>
      _bannersUpdatedController.stream;

  /// Emitted when a merchant replies to the current user's review.
  Stream<Map<String, dynamic>> get onReviewReply => _reviewReplyController.stream;

  SocketService() {
    _initControllers();
  }

  void _initControllers() {
    _newOfferController = StreamController<Map<String, dynamic>>.broadcast();
    _couponUpdateController = StreamController<Map<String, dynamic>>.broadcast();
    _socialProofController = StreamController<Map<String, dynamic>>.broadcast();
    _categoriesUpdatedController = StreamController<Map<String, dynamic>>.broadcast();
    _bannersUpdatedController = StreamController<Map<String, dynamic>>.broadcast();
    _reviewReplyController = StreamController<Map<String, dynamic>>.broadcast();
  }

  /// Connects to the WebSocket server and joins the user's private room.
  /// Safe to call multiple times — subsequent calls are no-ops after first init.
  void initSocket(String userId, String token) {
    if (_isInitialized) return;

    _socket = io.io(
      AppConstants.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .setAuth({'token': token})
          .enableReconnection()
          .disableAutoConnect()
          .build(),
    );

    _socket!.connect();

    _socket!.onConnect((_) {
      log('[Socket] Connected');
      _socket!.emit('join_room', {'room': userId, 'token': token});
    });

    _socket!.on('new_offer', (data) {
      log('[Socket] new_offer: $data');
      if (!_newOfferController.isClosed) _newOfferController.add(_toMap(data));
    });

    _socket!.on('social_proof', (data) {
      log('[Socket] social_proof: $data');
      final map = _toMap(data);
      if (!_socialProofController.isClosed) _socialProofController.add(map);
      sl<NotificationBloc>().add(NewSocialProofReceived(
        storeName: map['storeName'] ?? '',
        offerTitle: map['offerTitle'] ?? '',
      ));
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

    _socket!.onConnectError((error) => log('[Socket] connect_error: $error'));
    _socket!.onDisconnect((_) => log('[Socket] Disconnected'));

    _isInitialized = true;
  }

  void dispose() {
    _socket?.clearListeners();
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _newOfferController.close();
    _couponUpdateController.close();
    _socialProofController.close();
    _categoriesUpdatedController.close();
    _bannersUpdatedController.close();
    _reviewReplyController.close();
    _isInitialized = false;
  }

  /// Re-initializes after dispose so the service can be reused after logout/login.
  void reinit() {
    dispose();
    _initControllers();
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  Map<String, dynamic> _toMap(dynamic data) {
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return {};
  }
}
