import 'dart:io';
import 'dart:typed_data';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:path_provider/path_provider.dart';

class OcrService {
  final TextRecognizer _textRecognizer = TextRecognizer();

  Future<String> extractText(Uint8List imageBytes) async {
    final tempDir = await getTemporaryDirectory();
    final tempFile = File('${tempDir.path}/temp_screenshot.png');
    await tempFile.writeAsBytes(imageBytes);

    try {
      final inputImage = InputImage.fromFilePath(tempFile.path);
      final recognizedText = await _textRecognizer.processImage(inputImage);
      return recognizedText.text;
    } finally {
      if (await tempFile.exists()) {
        await tempFile.delete();
      }
    }
  }

  void dispose() {
    _textRecognizer.close();
  }
}
