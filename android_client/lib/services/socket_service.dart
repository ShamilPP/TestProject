import 'package:socket_io_client/socket_io_client.dart' as io;
import '../core/constants.dart';

class SocketService {
  io.Socket? _socket;
  Function(Map<String, dynamic>)? onScreenshotRequest;

  bool get isConnected => _socket?.connected ?? false;

  void connect(String token, String deviceId) {
    _socket = io.io(
      AppConstants.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .enableAutoConnect()
          .enableReconnection()
          .build(),
    );

    _socket!.onConnect((_) {
      print('Socket connected');
      _socket!.emit('device:connect', {'deviceId': deviceId});
    });

    _socket!.on('take_screenshot', (data) {
      print('Screenshot request received: $data');
      if (onScreenshotRequest != null) {
        onScreenshotRequest!(Map<String, dynamic>.from(data));
      }
    });

    _socket!.onDisconnect((_) {
      print('Socket disconnected');
    });

    _socket!.onError((error) {
      print('Socket error: $error');
    });
  }

  void sendHeartbeat() {
    _socket?.emit('device:heartbeat');
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}
