import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'device_registration_provider.dart';

class DeviceRegistrationScreen extends StatelessWidget {
  final VoidCallback? onRegistered;

  const DeviceRegistrationScreen({super.key, this.onRegistered});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DeviceRegistrationProvider>();

    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.devices, size: 64, color: Color(0xFF58A6FF)),
              const SizedBox(height: 16),
              Text(
                'Register Device',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Register this device with the Shamil System to enable remote screenshot capture.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Colors.grey,
                    ),
              ),
              const SizedBox(height: 32),
              if (provider.error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Text(
                    provider.error!,
                    style: const TextStyle(color: Colors.red),
                  ),
                ),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: provider.isLoading
                      ? null
                      : () async {
                          final success = await provider.registerDevice();
                          if (success) onRegistered?.call();
                        },
                  child: provider.isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Register This Device'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
