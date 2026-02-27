import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../auth/auth_provider.dart';
import '../device_registration/device_registration_provider.dart';
import '../../services/socket_service.dart';
import '../../services/screenshot_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _hasPermission = false;

  @override
  void initState() {
    super.initState();
    _checkAndRequestPermission();
  }

  Future<void> _checkAndRequestPermission() async {
    final screenshotService = context.read<ScreenshotService>();
    final already = await screenshotService.hasPermission();
    if (already) {
      setState(() => _hasPermission = true);
      return;
    }

    // First time — auto-prompt for permission
    final granted = await screenshotService.grantPermission();
    if (mounted) {
      setState(() => _hasPermission = granted);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final device = context.watch<DeviceRegistrationProvider>();
    final socket = context.read<SocketService>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Shamil System'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              socket.disconnect();
              await auth.logout();
            },
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Connection Status Card
            Card(
              child: ListTile(
                leading: Icon(
                  Icons.circle,
                  color: socket.isConnected ? Colors.green : Colors.red,
                  size: 16,
                ),
                title: Text(socket.isConnected ? 'Connected' : 'Disconnected'),
                subtitle: const Text('Server connection status'),
              ),
            ),
            const SizedBox(height: 12),

            // Screen Capture Permission Card
            Card(
              child: ListTile(
                leading: Icon(
                  _hasPermission ? Icons.check_circle : Icons.warning,
                  color: _hasPermission ? Colors.green : Colors.orange,
                ),
                title: Text(_hasPermission
                    ? 'Screen Capture Allowed'
                    : 'Screen Capture Not Granted'),
                subtitle: Text(_hasPermission
                    ? 'Ready to capture screenshots remotely'
                    : 'Tap to grant permission'),
                onTap: _hasPermission
                    ? null
                    : () async {
                        final screenshotService =
                            context.read<ScreenshotService>();
                        final granted =
                            await screenshotService.grantPermission();
                        if (mounted) {
                          setState(() => _hasPermission = granted);
                        }
                      },
              ),
            ),
            const SizedBox(height: 12),

            // Device Info Card
            Card(
              child: ListTile(
                leading:
                    const Icon(Icons.phone_android, color: Color(0xFF58A6FF)),
                title: const Text('Device ID'),
                subtitle: Text(device.deviceId ?? 'Not registered'),
              ),
            ),
            const SizedBox(height: 12),

            // User Info Card
            Card(
              child: ListTile(
                leading: const Icon(Icons.person, color: Color(0xFF58A6FF)),
                title: Text(auth.user?['name'] ?? 'Unknown'),
                subtitle: Text(auth.user?['email'] ?? ''),
              ),
            ),
            const SizedBox(height: 24),

            // Status Info
            Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      socket.isConnected && _hasPermission
                          ? Icons.check_circle_outline
                          : Icons.wifi_off,
                      size: 64,
                      color: socket.isConnected && _hasPermission
                          ? Colors.green
                          : Colors.grey,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      socket.isConnected && _hasPermission
                          ? 'Waiting for screenshot requests...'
                          : !socket.isConnected
                              ? 'Connecting to server...'
                              : 'Grant screen capture permission above',
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            color: Colors.grey,
                          ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
