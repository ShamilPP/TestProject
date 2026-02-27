import '../../services/screenshot_service.dart';
import '../../services/ocr_service.dart';
import '../../services/upload_service.dart';

class ScreenshotPipeline {
  final ScreenshotService _screenshotService;
  final OcrService _ocrService;
  final UploadService _uploadService;

  ScreenshotPipeline({
    required ScreenshotService screenshotService,
    required OcrService ocrService,
    required UploadService uploadService,
  })  : _screenshotService = screenshotService,
        _ocrService = ocrService,
        _uploadService = uploadService;

  /// Executes the full screenshot pipeline:
  /// 1. Capture screenshot via MediaProjection
  /// 2. Run OCR on the image
  /// 3. Upload image + text to server
  Future<bool> execute(String deviceId, String requestId) async {
    try {
      print('Pipeline: Starting screenshot capture...');

      // 1. Request screen capture
      final granted = await _screenshotService.requestScreenCapture();
      if (!granted) {
        print('Pipeline: Screen capture permission denied');
        return false;
      }

      // 2. Wait for capture to complete, then retrieve bytes
      await Future.delayed(const Duration(seconds: 2));

      // Retry getting screenshot a few times
      for (int i = 0; i < 5; i++) {
        final bytes = await _screenshotService.getScreenshot();
        if (bytes != null) {
          print('Pipeline: Screenshot captured (${bytes.length} bytes)');

          // 3. Run OCR
          print('Pipeline: Running OCR...');
          final ocrResult = await _ocrService.extractAll(bytes);
          print('Pipeline: OCR extracted ${ocrResult.text.length} chars, ${ocrResult.blocks.length} blocks');

          // 4. Upload to server
          print('Pipeline: Uploading screenshot...');
          await _uploadService.uploadScreenshot(
            deviceId: deviceId,
            requestId: requestId,
            imageBytes: bytes,
            extractedText: ocrResult.text,
            ocrBlocks: ocrResult.blocks.map((b) => b.toJson()).toList(),
          );
          print('Pipeline: Upload complete');
          return true;
        }

        await Future.delayed(const Duration(milliseconds: 500));
      }

      print('Pipeline: Failed to get screenshot bytes after retries');
      return false;
    } catch (e) {
      print('Pipeline error: $e');
      return false;
    }
  }
}
