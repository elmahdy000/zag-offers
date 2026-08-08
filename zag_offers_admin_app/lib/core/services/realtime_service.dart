import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:zag_offers_admin_app/core/config/app_config.dart';
import 'package:zag_offers_admin_app/core/storage/token_storage.dart';

class AdminRealtimeNotification {
  final String type;
  final String title;
  final String body;
  final Map<String, dynamic> payload;

  const AdminRealtimeNotification({
    required this.type,
    required this.title,
    required this.body,
    required this.payload,
  });

  factory AdminRealtimeNotification.fromSocketData(dynamic data) {
    final map = data is Map ? Map<String, dynamic>.from(data) : {};
    final rawPayload = map['payload'];

    return AdminRealtimeNotification(
      type: map['type']?.toString() ?? 'SYSTEM',
      title: map['title']?.toString() ?? 'اشعار جديد',
      body: map['body']?.toString() ?? '',
      payload: rawPayload is Map ? Map<String, dynamic>.from(rawPayload) : {},
    );
  }
}

class RealtimeService {
  final TokenStorage _tokenStorage;
  io.Socket? _socket;
  int _connectionGeneration = 0;

  RealtimeService(this._tokenStorage);

  bool get isConnected => _socket?.connected == true;

  Future<void> connect({
    required ValueChanged<AdminRealtimeNotification> onAdminNotification,
  }) async {
    final generation = ++_connectionGeneration;
    final token = await _tokenStorage.read();
    if (generation != _connectionGeneration || token == null || token.isEmpty) {
      return;
    }

    disconnect();

    final socket = io.io(
      AppConfig.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .setAuth({'token': token})
          .enableReconnection()
          .disableAutoConnect()
          .build(),
    );

    socket.onConnect((_) {
      debugPrint('Realtime connected');
      socket.emit('join_room', {'token': token});
    });

    socket.onDisconnect((_) {
      debugPrint('Realtime disconnected');
    });

    socket.onConnectError((error) {
      debugPrint('Realtime connection error: $error');
    });

    socket.on('admin_notification', (data) {
      onAdminNotification(AdminRealtimeNotification.fromSocketData(data));
    });

    socket.on('auth_warning', (data) {
      debugPrint('Realtime auth_warning: $data');
    });

    socket.on('error', (data) {
      debugPrint('Realtime error: $data');
    });

    _socket = socket;
    socket.connect();
  }

  void disconnect() {
    _connectionGeneration++;
    final socket = _socket;
    if (socket == null) return;

    socket.clearListeners();
    socket.disconnect();
    socket.dispose();
    _socket = null;
  }
}
