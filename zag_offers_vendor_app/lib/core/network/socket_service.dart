import 'dart:convert';
import 'dart:developer';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_constants.dart';
import 'notification_service.dart';
import '../../injection_container.dart' as di;
import '../../features/dashboard/presentation/bloc/dashboard_bloc.dart';

class SocketService {
  io.Socket? _socket;
  bool _isConnected = false;
  final Map<String, List<Function(dynamic)>> _eventHandlers = {};
  String? _userId;
  final FlutterSecureStorage _secureStorage;

  SocketService({FlutterSecureStorage? secureStorage})
      : _secureStorage = secureStorage ?? const FlutterSecureStorage();

  io.Socket? get socket => _socket;
  bool get isConnected => _isConnected;

  void connect() async {
    if (_socket?.connected == true) {
      return;
    }

    final token = await _secureStorage.read(key: 'auth_token');
    final userData = await _secureStorage.read(key: 'user_data');

    if (token == null) {
      log('WebSocket: No token found, cannot connect authenticated.');
      return;
    }

    // Extract user ID from stored data.
    if (userData != null) {
      try {
        final decoded = jsonDecode(userData);
        if (decoded is Map<String, dynamic>) {
          _userId = (decoded['id'] ?? decoded['_id'])?.toString();
        }
      } catch (e) {
        log('WebSocket: Failed to parse user data: $e');
      }
    }

    _socket?.clearListeners();
    _socket?.dispose();

    _socket = io.io(AppConstants.socketUrl, 
      io.OptionBuilder()
        .setTransports(['websocket'])
        .setAuth({'token': token})
        .enableReconnection()
        .setReconnectionAttempts(10)
        .setReconnectionDelay(1000)
        .disableAutoConnect()
        .build()
    );

    _eventHandlers.forEach((event, handlers) {
      for (final handler in handlers) {
        _socket?.on(event, handler);
      }
    });

    _socket?.onConnect((_) {
      _isConnected = true;
      log('WebSocket: Connected to server');
      
      // Join merchant room (React app compatibility)
      if (_userId != null) {
        _socket?.emit('join_room', {'token': token, 'userId': _userId});
        log('WebSocket: Joined merchant room: $_userId');
      }
    });

    _socket?.onDisconnect((_) {
      _isConnected = false;
      log('WebSocket: Disconnected');
    });

    _socket?.on('merchant_notification', (data) {
      log('WebSocket: Merchant notification received: $data');
      try {
        final Map<String, dynamic> notificationData;
        if (data is String) {
          notificationData = jsonDecode(data) as Map<String, dynamic>;
        } else if (data is Map) {
          notificationData = Map<String, dynamic>.from(data);
        } else {
          notificationData = {};
        }

        final title = notificationData['title']?.toString() ?? 'تنبيه جديد';
        final body = notificationData['body']?.toString() ?? '';
        final type = notificationData['type']?.toString();

        log('WebSocket: Processing notification - type: $type, title: $title');

        NotificationService.showLocalNotification(title, body, data: notificationData);
        NotificationService.saveToHistory(title, body, notificationData);

        if (type == 'COUPON_REDEEMED') {
          di.sl<DashboardBloc>().add(GetDashboardStatsRequested());
        }
      } catch (e) {
        log('WebSocket: Failed to process merchant notification: $e');
      }
    });

    _socket?.on('new_message', (data) {
      log('WebSocket: New message received: $data');
      // Handle chat messages (React app compatibility)
    });

    _socket?.on('error', (data) {
      log('WebSocket Error: $data');
    });

    _socket?.onConnectError((data) {
      log('WebSocket connect error: $data');
    });

    _socket?.connect();
  }

  void disconnect() {
    _socket?.clearListeners();
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _isConnected = false;
    _eventHandlers.clear();
  }

  void updateToken(String token) async {
    await _secureStorage.write(key: 'auth_token', value: token);
    if (_socket != null) {
      _socket?.auth = {'token': token};
      _socket?.disconnect();
      _socket?.connect();
    } else {
      connect();
    }
  }

  void on(String event, Function(dynamic) handler) {
    final handlers = _eventHandlers.putIfAbsent(event, () => []);
    if (!handlers.contains(handler)) {
      handlers.add(handler);
    }
    _socket?.on(event, handler);
  }

  void off(String event) {
    _eventHandlers.remove(event);
    _socket?.off(event);
  }
}
