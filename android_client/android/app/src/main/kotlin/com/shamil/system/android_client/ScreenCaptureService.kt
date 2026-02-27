package com.shamil.system.android_client

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.DisplayMetrics
import android.view.WindowManager
import androidx.core.app.NotificationCompat
import java.io.ByteArrayOutputStream

class ScreenCaptureService : Service() {

    companion object {
        const val CHANNEL_ID = "shamil_screenshot_channel"
        const val NOTIFICATION_ID = 1001

        // ACTION_INIT — called once when permission is granted; keeps service + MediaProjection alive
        // ACTION_CAPTURE — reuses the running MediaProjection to take a screenshot
        // ACTION_STOP — releases everything and stops the service
        const val ACTION_INIT = "ACTION_INIT"
        const val ACTION_CAPTURE = "ACTION_CAPTURE"
        const val ACTION_STOP = "ACTION_STOP"

        const val EXTRA_RESULT_CODE = "EXTRA_RESULT_CODE"
        const val EXTRA_DATA = "EXTRA_DATA"

        var screenshotBytes: ByteArray? = null
        var captureComplete = false

        // True when the service is running and MediaProjection is initialized
        var isReady = false
    }

    private var mediaProjection: MediaProjection? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_INIT -> {
                // Start foreground and initialize MediaProjection — stays alive until ACTION_STOP
                val notification = buildNotification("Ready for screenshot requests")
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    startForeground(
                        NOTIFICATION_ID, notification,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
                    )
                } else {
                    startForeground(NOTIFICATION_ID, notification)
                }

                val resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, -1)
                val data = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    intent.getParcelableExtra(EXTRA_DATA, Intent::class.java)
                } else {
                    @Suppress("DEPRECATION")
                    intent.getParcelableExtra<Intent>(EXTRA_DATA)
                }

                if (data != null) {
                    initMediaProjection(resultCode, data)
                }
            }

            ACTION_CAPTURE -> {
                // Reuse existing MediaProjection — create VirtualDisplay, capture, release display
                if (mediaProjection != null) {
                    captureScreenshot()
                } else {
                    // Projection was stopped externally — mark as failed so Dart side retries
                    screenshotBytes = null
                    captureComplete = true
                }
            }

            ACTION_STOP -> {
                releaseMediaProjection()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    private fun initMediaProjection(resultCode: Int, data: Intent) {
        val projectionManager =
            getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        mediaProjection = projectionManager.getMediaProjection(resultCode, data)

        // Android 14+ requires a callback before createVirtualDisplay
        mediaProjection?.registerCallback(object : MediaProjection.Callback() {
            override fun onStop() {
                // Projection revoked externally (e.g. user goes to settings)
                mainHandler.post {
                    isReady = false
                    mediaProjection = null
                }
            }
        }, mainHandler)

        isReady = true
    }

    private fun captureScreenshot() {
        val mp = mediaProjection ?: return

        val wm = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val width: Int
        val height: Int
        val density: Int

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val windowMetrics = wm.currentWindowMetrics
            width = windowMetrics.bounds.width()
            height = windowMetrics.bounds.height()
            density = resources.displayMetrics.densityDpi
        } else {
            val metrics = DisplayMetrics()
            @Suppress("DEPRECATION")
            wm.defaultDisplay.getRealMetrics(metrics)
            width = metrics.widthPixels
            height = metrics.heightPixels
            density = metrics.densityDpi
        }

        captureComplete = false
        screenshotBytes = null

        val imageReader = ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, 2)
        val virtualDisplay = mp.createVirtualDisplay(
            "ShamilScreenCapture",
            width, height, density,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            imageReader.surface, null, null
        )

        // Wait for a frame to render, then grab it
        mainHandler.postDelayed({
            val image = imageReader.acquireLatestImage()
            if (image != null) {
                val planes = image.planes
                val buffer = planes[0].buffer
                val pixelStride = planes[0].pixelStride
                val rowStride = planes[0].rowStride
                val rowPadding = rowStride - pixelStride * width

                val bitmap = Bitmap.createBitmap(
                    width + rowPadding / pixelStride,
                    height,
                    Bitmap.Config.ARGB_8888
                )
                bitmap.copyPixelsFromBuffer(buffer)

                val croppedBitmap = Bitmap.createBitmap(bitmap, 0, 0, width, height)

                val outputStream = ByteArrayOutputStream()
                croppedBitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
                screenshotBytes = outputStream.toByteArray()

                bitmap.recycle()
                croppedBitmap.recycle()
                image.close()
            }

            captureComplete = true

            // Release the VirtualDisplay but KEEP MediaProjection alive for future captures
            virtualDisplay?.release()
            imageReader.close()
        }, 500)
    }

    private fun releaseMediaProjection() {
        isReady = false
        mediaProjection?.stop()
        mediaProjection = null
    }

    override fun onDestroy() {
        super.onDestroy()
        releaseMediaProjection()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Screen Capture",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(text: String): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Shamil System")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
}
