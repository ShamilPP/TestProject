import 'dart:async';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../../services/socket_service.dart';

// Must be a top-level function (not a class method) so flutter_background_service
// can locate it via AOT reflection in release builds.
@pragma('vm:entry-point')
void onBackgroundServiceStart(ServiceInstance service) async {
  Timer.periodic(const Duration(seconds: 60), (timer) {
    service.invoke('heartbeat');
  });

  service.on('stopService').listen((event) {
    service.stopSelf();
  });
}

class BackgroundServiceInitializer {
  static Future<void> initialize() async {
    final service = FlutterBackgroundService();

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
        onStart: onBackgroundServiceStart,
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

  static void startHeartbeat(SocketService socketService) {
    Timer.periodic(const Duration(seconds: 60), (timer) {
      if (socketService.isConnected) {
        socketService.sendHeartbeat();
      }
    });
  }
}
