import 'dart:async';
import 'dart:developer';

import 'package:socket_io_client/socket_io_client.dart' as io;

import '../constants/app_constants.dart';
import '../../injection_container.dart';
import '../../features/notifications/presentation/bloc/notification_bloc.dart';

class SocketService {
  io.Socket? _socket;
  bool _isInitialized = false;

  // ---------------------------------------------------------------------------
  // Broadcast streams — subscribe from any page without duplicate listeners
  // ---------------------------------------------------------------------------

  final _newOfferController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _couponUpdateController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _socialProofController =
      StreamController<Map<String, dynamic>>.broadcast();

  /// Emitted when the admin approves a new offer and it goes live.
  Stream<Map<String, dynamic>> get onNewOffer => _newOfferController.stream;

  /// Emitted when the vendor redeems the current user's coupon.
  Stream<Map<String, dynamic>> get onCouponUpdate =>
      _couponUpdateController.stream;

  /// Emitted when any customer generates a coupon (social-proof ticker).
  Stream<Map<String, dynamic>> get onSocialProof => _socialProofController.stream;

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /// Connects to the WebSocket server and joins the user's private room.
  /// Safe to call multiple times — subsequent calls are no-ops.
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
      final map = _toMap(data);
      _newOfferController.add(map);
    });

    _socket!.on('social_proof', (data) {
      log('[Socket] social_proof: $data');
      final map = _toMap(data);
      _socialProofController.add(map);
      // Also push to NotificationBloc for the in-app toast
      sl<NotificationBloc>().add(NewSocialProofReceived(
        storeName: map['storeName'] ?? '',
        offerTitle: map['offerTitle'] ?? '',
      ));
    });

    _socket!.on('coupon_update', (data) {
      log('[Socket] coupon_update: $data');
      _couponUpdateController.add(_toMap(data));
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
    _isInitialized = false;
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
