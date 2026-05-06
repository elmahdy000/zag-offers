import 'dart:developer';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';

class SocketService {
  io.Socket? _socket;
  bool _isConnected = false;
  final Map<String, List<Function(dynamic)>> _eventHandlers = {};

  io.Socket? get socket => _socket;
  bool get isConnected => _isConnected;

  void connect() async {
    if (_socket?.connected == true) {
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');

    if (token == null) {
      log('WebSocket: No token found, cannot connect authenticated.');
      return;
    }

    _socket?.clearListeners();
    _socket?.dispose();

    _socket = io.io(AppConstants.socketUrl, 
      io.OptionBuilder()
        .setTransports(['websocket', 'polling'])
        .setAuth({'token': token})
        .enableReconnection()
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
    });

    _socket?.onDisconnect((_) {
      _isConnected = false;
      log('WebSocket: Disconnected');
    });

    _socket?.on('connected', (data) {
      log('WebSocket: Authenticated as ${data['userId']}');
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
