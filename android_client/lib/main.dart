import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme.dart';
import 'services/api_service.dart';
import 'services/auth_service.dart';
import 'services/socket_service.dart';
import 'services/screenshot_service.dart';
import 'services/ocr_service.dart';
import 'services/upload_service.dart';
import 'services/device_service.dart';
import 'features/auth/auth_provider.dart';
import 'features/auth/login_screen.dart';
import 'features/device_registration/device_registration_provider.dart';
import 'features/device_registration/device_registration_screen.dart';
import 'features/screenshot/screenshot_pipeline.dart';
import 'features/background_service/background_service_initializer.dart';
import 'features/home/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await BackgroundServiceInitializer.initialize();
  runApp(const ShamilSystemApp());
}

class ShamilSystemApp extends StatelessWidget {
  const ShamilSystemApp({super.key});

  @override
  Widget build(BuildContext context) {
    final apiService = ApiService();
    final authService = AuthService(apiService);
    final socketService = SocketService();
    final screenshotService = ScreenshotService();
    final ocrService = OcrService();
    final uploadService = UploadService();
    final deviceService = DeviceService(apiService);

    return MultiProvider(
      providers: [
        Provider<ApiService>.value(value: apiService),
        Provider<SocketService>.value(value: socketService),
        Provider<ScreenshotService>.value(value: screenshotService),
        Provider<OcrService>.value(value: ocrService),
        Provider<UploadService>.value(value: uploadService),
        ChangeNotifierProvider<AuthProvider>(
          create: (_) => AuthProvider(authService),
        ),
        ChangeNotifierProvider<DeviceRegistrationProvider>(
          create: (_) => DeviceRegistrationProvider(deviceService),
        ),
      ],
      child: MaterialApp(
        title: 'Shamil System',
        theme: AppTheme.darkTheme,
        debugShowCheckedModeBanner: false,
        home: const AuthGate(),
      ),
    );
  }
}

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final auth = context.read<AuthProvider>();
    await auth.tryAutoLogin();
    setState(() => _initialized = true);
  }

  @override
  Widget build(BuildContext context) {
    if (!_initialized) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final auth = context.watch<AuthProvider>();
    if (!auth.isLoggedIn) {
      return const LoginScreen();
    }

    return const DeviceGate();
  }
}

class DeviceGate extends StatefulWidget {
  const DeviceGate({super.key});

  @override
  State<DeviceGate> createState() => _DeviceGateState();
}

class _DeviceGateState extends State<DeviceGate> {
  bool _initialized = false;
  ScreenshotPipeline? _pipeline;

  @override
  void initState() {
    super.initState();
    _initDevice();
  }

  Future<void> _initDevice() async {
    final deviceProvider = context.read<DeviceRegistrationProvider>();
    await deviceProvider.checkRegistration();
    setState(() => _initialized = true);

    if (deviceProvider.isRegistered) {
      _connectSocket();
    }
  }

  void _connectSocket() {
    final auth = context.read<AuthProvider>();
    final deviceProvider = context.read<DeviceRegistrationProvider>();
    final socketService = context.read<SocketService>();
    final uploadService = context.read<UploadService>();

    // Set token on upload service
    uploadService.setToken(auth.token!);

    // Setup screenshot pipeline
    _pipeline = ScreenshotPipeline(
      screenshotService: context.read<ScreenshotService>(),
      ocrService: context.read<OcrService>(),
      uploadService: uploadService,
    );

    // Handle incoming screenshot requests
    socketService.onScreenshotRequest = (data) {
      final requestId = data['requestId'] as String;
      final deviceId = deviceProvider.deviceId!;
      _pipeline?.execute(deviceId, requestId);
    };

    // Connect socket
    socketService.connect(auth.token!, deviceProvider.deviceId!);

    // Start heartbeat
    BackgroundServiceInitializer.startHeartbeat(socketService);
  }

  @override
  Widget build(BuildContext context) {
    if (!_initialized) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final deviceProvider = context.watch<DeviceRegistrationProvider>();
    if (!deviceProvider.isRegistered) {
      return DeviceRegistrationScreen(
        onRegistered: () {
          _connectSocket();
          setState(() {});
        },
      );
    }

    return const HomeScreen();
  }
}
