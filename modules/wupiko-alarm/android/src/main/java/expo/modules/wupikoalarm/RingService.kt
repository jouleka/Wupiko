package expo.modules.wupikoalarm

import android.app.ActivityOptions
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Log

class RingService : Service() {
    private var player: MediaPlayer? = null
    private var current: String? = null
    private val main = Handler(Looper.getMainLooper())
    private val stateChanged: () -> Unit = { main.post { if (current != null) refresh() }; Unit }

    override fun onBind(intent: Intent?): IBinder? = null
    override fun onCreate() {
        super.onCreate()
        AlarmEngine.listeners.add(stateChanged)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        refresh()
        return START_STICKY
    }

    private fun refresh() {
        // Runtime notification revocation kills the process. A sticky restart can arrive
        // before the system's permission broadcast, so check again before starting audio.
        if (!AlarmEngine.exactAllowed(this) || !AlarmEngine.notificationsAllowed(this)) {
            AlarmEngine.reconcile(this, forceRestore = false)
        }
        val alarm = AlarmEngine.alarms(this).filter { it.ringing }.sortedBy { it.id }.firstOrNull()
        if (alarm == null) {
            // The user may have stopped it between delivery and service creation.
            if (AlarmEngine.exactAllowed(this)) {
                startForeground(NOTICE, notification(this, null))
            }
            quiet()
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
            return
        }
        if (current == alarm.id) return
        startForeground(NOTICE, notification(this, alarm))
        quiet()
        current = alarm.id
        val attributes = AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build()
        val sound = when (alarm.sound) {
            "ripple" -> R.raw.ripple
            "chime" -> R.raw.chime
            else -> R.raw.daybreak
        }
        try {
            play(Uri.parse("android.resource://$packageName/$sound"), attributes)
        } catch (e: Exception) {
            Log.w("Wupiko", "Alarm audio unavailable; using system alarm tone", e)
            runCatching { play(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM), attributes) }
                .onFailure { Log.e("Wupiko", "System tone unavailable", it) }
        }
        if (alarm.vibrate) {
            getSystemService(Vibrator::class.java).vibrate(
                VibrationEffect.createWaveform(longArrayOf(0, 350, 180, 350, 1300), 0), attributes
            )
        }
    }

    private fun play(uri: Uri, attributes: AudioAttributes) {
        player?.release()
        player = MediaPlayer().also { media ->
            try {
                media.setWakeMode(this, PowerManager.PARTIAL_WAKE_LOCK)
                media.setAudioAttributes(attributes)
                media.setDataSource(this, uri)
                media.isLooping = true
                media.prepare()
                media.start()
            } catch (e: Exception) {
                media.release()
                throw e
            }
        }
    }

    private fun quiet() {
        player?.release()
        player = null
        getSystemService(Vibrator::class.java).cancel()
        current = null
    }

    override fun onDestroy() {
        AlarmEngine.listeners.remove(stateChanged)
        main.removeCallbacksAndMessages(null)
        quiet()
        super.onDestroy()
    }

    companion object {
        const val CHANNEL = "wupiko_alarms"
        private const val NOTICE = 8201
        private const val PI_FLAGS = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE

        fun channel(ctx: Context) {
            val manager = ctx.getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(NotificationChannel(CHANNEL, "Ringing alarms", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Show an alarm and its Stop Alarm action"
                // The service plays the user's per-alarm selection on the alarm audio stream.
                setSound(null, null)
                enableVibration(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            })
        }

        private fun notification(ctx: Context, alarm: Alarm?): Notification {
            channel(ctx)
            val builder = Notification.Builder(ctx, CHANNEL)
                .setSmallIcon(R.drawable.wupiko_alarm)
                .setContentTitle(if (alarm?.followUp == true) "You dozed off! Round two" else alarm?.label?.ifBlank { "Rise & shine" } ?: "Wupiko")
                .setContentText(if (alarm != null) "Then open Wupiko and boop it awake to check in." else "Time to wake up.")
                .setCategory(Notification.CATEGORY_ALARM)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .setOngoing(true)
            if (Build.VERSION.SDK_INT >= 31) builder.setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE)
            if (alarm != null) {
                val options = if (Build.VERSION.SDK_INT >= 35) ActivityOptions.makeBasic()
                    .setPendingIntentCreatorBackgroundActivityStartMode(ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOWED)
                    .toBundle() else null
                val open = PendingIntent.getActivity(ctx, 0, Intent(ctx, RingActivity::class.java)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP), PI_FLAGS, options)
                val stop = PendingIntent.getBroadcast(ctx, 0, Intent(ctx, AlarmDelivery::class.java)
                    .setAction(AlarmEngine.STOP).setData(Uri.parse("wupiko-native://stop/${alarm.id}")), PI_FLAGS)
                // On 14+, the system substitutes a heads-up presentation when special access is off.
                builder.setFullScreenIntent(open, true).setContentIntent(open)
                    .addAction(Notification.Action.Builder(null, "Stop Alarm", stop).build())
            }
            return builder.build()
        }

        fun postFallback(ctx: Context, id: String) {
            val alarm = AlarmEngine.alarms(ctx).firstOrNull { it.id == id && it.ringing } ?: return
            ctx.getSystemService(NotificationManager::class.java).notify(id, NOTICE, notification(ctx, alarm))
        }

        fun clearFallback(ctx: Context, id: String) {
            ctx.getSystemService(NotificationManager::class.java).cancel(id, NOTICE)
        }
    }
}
