import 'dart:io';
import 'dart:typed_data';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:path_provider/path_provider.dart';

class OcrBlock {
  final String text;
  final double x, y, w, h; // normalized 0.0–1.0 relative to image dimensions

  OcrBlock({
    required this.text,
    required this.x,
    required this.y,
    required this.w,
    required this.h,
  });

  Map<String, dynamic> toJson() => {'text': text, 'x': x, 'y': y, 'w': w, 'h': h};
}

class OcrResult {
  final String text;
  final List<OcrBlock> blocks;

  OcrResult({required this.text, required this.blocks});
}

class OcrService {
  final TextRecognizer _textRecognizer = TextRecognizer();

  Future<OcrResult> extractAll(Uint8List imageBytes) async {
    final tempDir = await getTemporaryDirectory();
    final tempFile = File(
        '${tempDir.path}/temp_ocr_${DateTime.now().millisecondsSinceEpoch}.png');
    await tempFile.writeAsBytes(imageBytes);

    try {
      final inputImage = InputImage.fromFilePath(tempFile.path);
      final recognized = await _textRecognizer.processImage(inputImage);

      // Read image width/height from PNG header (no extra package needed).
      // PNG spec: bytes 16–19 = width, bytes 20–23 = height (big-endian uint32).
      final imgWidth = _readUint32BE(imageBytes, 16).toDouble();
      final imgHeight = _readUint32BE(imageBytes, 20).toDouble();

      final blocks = <OcrBlock>[];
      if (imgWidth > 0 && imgHeight > 0) {
        for (final block in recognized.blocks) {
          for (final line in block.lines) {
            final box = line.boundingBox;
            blocks.add(OcrBlock(
              text: line.text,
              x: (box.left / imgWidth).clamp(0.0, 1.0),
              y: (box.top / imgHeight).clamp(0.0, 1.0),
              w: (box.width / imgWidth).clamp(0.0, 1.0),
              h: (box.height / imgHeight).clamp(0.0, 1.0),
            ));
          }
        }
      }

      return OcrResult(text: recognized.text, blocks: blocks);
    } finally {
      if (await tempFile.exists()) await tempFile.delete();
    }
  }

  int _readUint32BE(Uint8List bytes, int offset) {
    return (bytes[offset] << 24) |
        (bytes[offset + 1] << 16) |
        (bytes[offset + 2] << 8) |
        bytes[offset + 3];
  }

  void dispose() {
    _textRecognizer.close();
  }
}
