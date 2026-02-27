package com.shamil.system.android_client

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {

    companion object {
        private const val CHANNEL = "com.shamil.system/screenshot"
        private const val REQUEST_MEDIA_PROJECTION = 1000
    }

    private var pendingResult: MethodChannel.Result? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "grantPermission" -> {
                        // Ask for screen capture permission and initialize the service
                        pendingResult = result
                        requestScreenCapturePermission()
                    }

                    "requestScreenCapture" -> {
                        if (ScreenCaptureService.isReady) {
                            // Service is running with an active MediaProjection — just capture
                            val captureIntent = Intent(this, ScreenCaptureService::class.java).apply {
                                action = ScreenCaptureService.ACTION_CAPTURE
                            }
                            startService(captureIntent)
                            result.success(true)
                        } else {
                            // No active MediaProjection — need to re-grant permission
                            pendingResult = result
                            requestScreenCapturePermission()
                        }
                    }

                    "getScreenshot" -> {
                        if (ScreenCaptureService.captureComplete) {
                            val bytes = ScreenCaptureService.screenshotBytes
                            if (bytes != null) {
                                result.success(bytes)
                                ScreenCaptureService.screenshotBytes = null
                                ScreenCaptureService.captureComplete = false
                            } else {
                                result.error("NO_DATA", "Screenshot capture returned no data", null)
                            }
                        } else {
                            result.error("NOT_READY", "Screenshot capture not complete yet", null)
                        }
                    }

                    "hasPermission" -> {
                        result.success(ScreenCaptureService.isReady)
                    }

                    else -> result.notImplemented()
                }
            }
    }

    private fun requestScreenCapturePermission() {
        val projectionManager =
            getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        @Suppress("DEPRECATION")
        startActivityForResult(
            projectionManager.createScreenCaptureIntent(),
            REQUEST_MEDIA_PROJECTION
        )
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_MEDIA_PROJECTION) {
            if (resultCode == Activity.RESULT_OK && data != null) {
                // Start the service with ACTION_INIT — initializes MediaProjection and keeps it alive
                val serviceIntent = Intent(this, ScreenCaptureService::class.java).apply {
                    action = ScreenCaptureService.ACTION_INIT
                    putExtra(ScreenCaptureService.EXTRA_RESULT_CODE, resultCode)
                    putExtra(ScreenCaptureService.EXTRA_DATA, data)
                }
                startForegroundService(serviceIntent)
                pendingResult?.success(true)
            } else {
                pendingResult?.success(false)
            }
            pendingResult = null
        }
    }
}
