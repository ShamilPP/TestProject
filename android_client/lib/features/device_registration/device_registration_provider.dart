import 'package:flutter/material.dart';
import '../../services/device_service.dart';

class DeviceRegistrationProvider extends ChangeNotifier {
  final DeviceService _deviceService;

  bool _isLoading = false;
  bool _isRegistered = false;
  String? _deviceId;
  String? _error;

  DeviceRegistrationProvider(this._deviceService);

  bool get isLoading => _isLoading;
  bool get isRegistered => _isRegistered;
  String? get deviceId => _deviceId;
  String? get error => _error;

  Future<void> checkRegistration() async {
    _deviceId = await _deviceService.getSavedDeviceId();
    _isRegistered = _deviceId != null;
    notifyListeners();
  }

  Future<bool> registerDevice() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final device = await _deviceService.registerDevice();
      _deviceId = device['_id'];
      _isRegistered = true;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
}
