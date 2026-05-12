import 'dart:developer';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';

class SocketService {
  io.Socket? _socket;
  bool _isConnected = false;
  final Map<String, List<Function(dynamic)>> _eventHandlers = {};
  String? _userId;

  io.Socket? get socket => _socket;
  bool get isConnected => _isConnected;

  void connect() async {
    if (_socket?.connected == true) {
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    final userData = prefs.getString('user_data');

    if (token == null) {
      log('WebSocket: No token found, cannot connect authenticated.');
      return;
    }

    // Extract user ID from stored data (React app compatibility)
    if (userData != null) {
      try {
        final userMap = userData.startsWith('{') ? 
          Map<String, dynamic>.fromEntries(
            userData.split(',').map((e) => MapEntry(e.split(':')[0].trim().replaceAll('{', '').replaceAll('"', ''), 
            e.split(':')[1].trim().replaceAll('}', '').replaceAll('"', '')))
          ) : null;
        _userId = userMap?['id']?.toString();
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
      // Handle real-time notifications (React app compatibility)
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
  }

  void updateToken(String token) {
    if (_socket != null) {
      _socket?.auth = {'token': token};
      _socket?.disconnect().connect();
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
