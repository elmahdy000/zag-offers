import 'dart:developer';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';

class SocketService {
  io.Socket? _socket;
  bool _isConnected = false;

  io.Socket? get socket => _socket;
  bool get isConnected => _isConnected;

  void connect() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');

    if (token == null) {
      log('WebSocket: No token found, cannot connect authenticated.');
      return;
    }

    _socket = io.io(AppConstants.socketUrl, 
      io.OptionBuilder()
        .setTransports(['websocket'])
        .setAuth({'token': token})
        .enableAutoConnect()
        .build()
    );

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
  }

  void disconnect() {
    _socket?.disconnect();
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
    _socket?.on(event, handler);
  }

  void off(String event) {
    _socket?.off(event);
  }
}
