import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _api;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  String? _token;
  Map<String, dynamic>? _user;

  AuthService(this._api);

  String? get token => _token;
  Map<String, dynamic>? get currentUser => _user;
  bool get isLoggedIn => _token != null;

  Future<void> login(String email, String password) async {
    final response = await _api.post('/auth/login', {
      'email': email,
      'password': password,
    });

    _token = response['token'];
    _user = response['user'];
    _api.setToken(_token!);

    await _storage.write(key: 'token', value: _token);
    await _storage.write(key: 'userId', value: _user!['_id']);
  }

  Future<void> register(String name, String email, String password) async {
    final response = await _api.post('/auth/register', {
      'name': name,
      'email': email,
      'password': password,
      'role': 'client',
    });

    _token = response['token'];
    _user = response['user'];
    _api.setToken(_token!);

    await _storage.write(key: 'token', value: _token);
    await _storage.write(key: 'userId', value: _user!['_id']);
  }

  Future<bool> tryAutoLogin() async {
    final token = await _storage.read(key: 'token');
    if (token == null) return false;

    _token = token;
    _api.setToken(token);

    try {
      final response = await _api.get('/auth/me');
      _user = response['user'];
      return true;
    } catch (e) {
      await logout();
      return false;
    }
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    _api.setToken('');
    await _storage.deleteAll();
  }
}
