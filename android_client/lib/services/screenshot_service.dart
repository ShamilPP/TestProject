import 'dart:typed_data';
import 'package:flutter/services.dart';
import '../core/constants.dart';

class ScreenshotService {
  static const _channel = MethodChannel(AppConstants.screenshotChannel);

  /// Check if screen capture permission has been granted already.
  Future<bool> hasPermission() async {
    try {
      final result = await _channel.invokeMethod<bool>('hasPermission');
      return result ?? false;
    } on PlatformException {
      return false;
    }
  }

  /// Asks user for screen capture permission (one-time consent dialog).
  /// Does NOT capture — just caches the permission for later use.
  Future<bool> grantPermission() async {
    try {
      final result = await _channel.invokeMethod<bool>('grantPermission');
      return result ?? false;
    } on PlatformException catch (e) {
      print('Error granting permission: $e');
      return false;
    }
  }

  /// Captures a screenshot. Uses cached permission if available,
  /// otherwise shows the consent dialog first.
  Future<bool> requestScreenCapture() async {
    try {
      final result = await _channel.invokeMethod<bool>('requestScreenCapture');
      return result ?? false;
    } on PlatformException catch (e) {
      print('Error requesting screen capture: $e');
      return false;
    }
  }

  /// Retrieves the captured screenshot bytes from native side.
  Future<Uint8List?> getScreenshot() async {
    try {
      final bytes = await _channel.invokeMethod<Uint8List>('getScreenshot');
      return bytes;
    } on PlatformException {
      return null;
    }
  }
}
