import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import '../core/constants.dart';

class UploadService {
  String? _token;

  void setToken(String token) {
    _token = token;
  }

  /// Uploads screenshot bytes + OCR text to the server.
  /// Returns the created screenshot record.
  Future<Map<String, dynamic>> uploadScreenshot({
    required String deviceId,
    required String requestId,
    required Uint8List imageBytes,
    required String extractedText,
    List<Map<String, dynamic>> ocrBlocks = const [],
  }) async {
    final uri = Uri.parse('${AppConstants.apiUrl}/screenshots/upload');

    final request = http.MultipartRequest('POST', uri);
    request.headers['Authorization'] = 'Bearer $_token';
    request.fields['deviceId'] = deviceId;
    request.fields['requestId'] = requestId;
    request.fields['extractedText'] = extractedText;
    request.fields['ocrBlocks'] = jsonEncode(ocrBlocks);

    request.files.add(http.MultipartFile.fromBytes(
      'screenshot',
      imageBytes,
      filename: '${DateTime.now().millisecondsSinceEpoch}.png',
    ));

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    final body = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    }
    throw Exception(body['error'] ?? 'Upload failed');
  }
}
