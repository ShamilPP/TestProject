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

        // Cached projection token — survives across method channel calls
        private var cachedResultCode: Int? = null
        private var cachedData: Intent? = null
    }

    private var pendingResult: MethodChannel.Result? = null
    private var pendingCapture = false  // true when called from captureWithCached

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "grantPermission" -> {
                        // Only asks for permission, does not capture
                        pendingResult = result
                        pendingCapture = false
                        requestScreenCapturePermission()
                    }
                    "requestScreenCapture" -> {
                        if (cachedResultCode != null && cachedData != null) {
                            // Reuse cached permission — start capture directly
                            startCaptureService(cachedResultCode!!, cachedData!!)
                            result.success(true)
                        } else {
                            // No cached permission — ask user, then capture
                            pendingResult = result
                            pendingCapture = true
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
                        result.success(cachedResultCode != null && cachedData != null)
                    }
                    else -> result.notImplemented()
                }
            }
    }

    private fun requestScreenCapturePermission() {
        val projectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        startActivityForResult(
            projectionManager.createScreenCaptureIntent(),
            REQUEST_MEDIA_PROJECTION
        )
    }

    private fun startCaptureService(resultCode: Int, data: Intent) {
        val serviceIntent = Intent(this, ScreenCaptureService::class.java).apply {
            action = ScreenCaptureService.ACTION_START
            putExtra(ScreenCaptureService.EXTRA_RESULT_CODE, resultCode)
            putExtra(ScreenCaptureService.EXTRA_DATA, data)
        }
        startForegroundService(serviceIntent)
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_MEDIA_PROJECTION) {
            if (resultCode == Activity.RESULT_OK && data != null) {
                // Cache the permission for future use
                cachedResultCode = resultCode
                cachedData = data

                if (pendingCapture) {
                    // Was called from requestScreenCapture — also start capture
                    startCaptureService(resultCode, data)
                }
                pendingResult?.success(true)
            } else {
                pendingResult?.success(false)
            }
            pendingResult = null
            pendingCapture = false
        }
    }
}
