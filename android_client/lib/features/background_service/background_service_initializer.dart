import 'dart:async';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../../services/socket_service.dart';

class BackgroundServiceInitializer {
  static Future<void> initialize() async {
    final service = FlutterBackgroundService();

    // Create notification channel for the background service
    const channel = AndroidNotificationChannel(
      'shamil_bg_service',
      'Shamil System Background Service',
      description: 'Keeps the device connected for screenshot requests',
      importance: Importance.low,
    );

    final flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();
    await flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    await service.configure(
      androidConfiguration: AndroidConfiguration(
        onStart: _onStart,
        autoStart: true,
        isForegroundMode: true,
        notificationChannelId: 'shamil_bg_service',
        initialNotificationTitle: 'Shamil System',
        initialNotificationContent: 'Connected and waiting for requests',
        foregroundServiceNotificationId: 888,
      ),
      iosConfiguration: IosConfiguration(),
    );
  }

  @pragma('vm:entry-point')
  static Future<void> _onStart(ServiceInstance service) async {
    // Heartbeat timer — sends every 60 seconds
    Timer.periodic(const Duration(seconds: 60), (timer) {
      // The heartbeat is sent via the socket in the main isolate
      // This just keeps the service alive
      service.invoke('heartbeat');
    });

    service.on('stopService').listen((event) {
      service.stopSelf();
    });
  }

  static void startHeartbeat(SocketService socketService) {
    Timer.periodic(const Duration(seconds: 60), (timer) {
      if (socketService.isConnected) {
        socketService.sendHeartbeat();
      }
    });
  }
}
