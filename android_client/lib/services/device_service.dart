import 'package:device_info_plus/device_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class DeviceService {
  final ApiService _api;

  DeviceService(this._api);

  Future<String?> getSavedDeviceId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('deviceId');
  }

  Future<Map<String, dynamic>> registerDevice() async {
    final deviceInfo = DeviceInfoPlugin();
    final androidInfo = await deviceInfo.androidInfo;

    final response = await _api.post('/devices/register', {
      'deviceName': androidInfo.device,
      'model': '${androidInfo.manufacturer} ${androidInfo.model}',
    });

    final deviceId = response['device']['_id'];
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('deviceId', deviceId);

    return response['device'];
  }
}
