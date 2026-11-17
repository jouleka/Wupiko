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
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.os.SystemClock
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Log

class RingService : Service() {
    private var player: MediaPlayer? = null
    private var current: String? = null
    private val main = Handler(Looper.getMainLooper())
    private val stateChanged: () -> Unit = { main.post { if (current != null) refresh() }; Unit }
    // A wake-up is loud whatever the phone's alarm volume is set to. The previous level comes back afterwards.
    private var volumeBefore: Int? = null
    private var startedAt = 0L
    private val loud = object : Runnable {
        override fun run() {
            val audio = getSystemService(AudioManager::class.java)
            val max = audio.getStreamMaxVolume(AudioManager.STREAM_ALARM)
            // Do Not Disturb can refuse the change. The alarm still plays at the level it allows.
            if (audio.getStreamVolume(AudioManager.STREAM_ALARM) < max) {
                runCatching { audio.setStreamVolume(AudioManager.STREAM_ALARM, max, 0) }
            }
            // Swell over the first seconds instead of starting at full blast.
            val gain = (RAMP_FROM + (1 - RAMP_FROM) * (SystemClock.elapsedRealtime() - startedAt) / RAMP_MS).coerceAtMost(1f)
            runCatching { player?.setVolume(gain, gain) }
            main.postDelayed(this, 500)
        }
    }

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
        if (!alarm.isNudge) {
            volumeBefore = getSystemService(AudioManager::class.java).getStreamVolume(AudioManager.STREAM_ALARM)
            startedAt = SystemClock.elapsedRealtime()
            main.post(loud)
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
        main.removeCallbacks(loud)
        volumeBefore?.let { runCatching { getSystemService(AudioManager::class.java).setStreamVolume(AudioManager.STREAM_ALARM, it, 0) } }
        volumeBefore = null
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
        private const val RAMP_FROM = .35f
        private const val RAMP_MS = 8_000f
        private const val PI_FLAGS = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE

        fun channel(ctx: Context) {
            val manager = ctx.getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(NotificationChannel(CHANNEL, "Ringing alarms", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Show a ringing alarm and how to end it"
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
                .setContentTitle(when {
                    alarm?.followUp == true -> "You dozed off! Round two"
                    alarm?.isNudge == true -> alarm.label.ifBlank { "Wupiko reminder" }
                    else -> alarm?.label?.ifBlank { "Rise & shine" } ?: "Wupiko"
                })
                .setContentText(when {
                    alarm == null -> "Time to wake up."
                    alarm.isNudge -> "A little nudge from Wupiko."
                    else -> "It rings until you open Wupiko and feed it some light."
                })
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
                // A reminder stops from the notification. A wake-up opens Wupiko for the check-in, still ringing.
                val stop = PendingIntent.getActivity(ctx, 1, Intent(ctx, RingActivity::class.java)
                    .setAction(AlarmEngine.STOP).setData(Uri.parse("wupiko-native://stop/${alarm.id}"))
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP), PI_FLAGS, options)
                // On 14+, the system substitutes a heads-up presentation when special access is off.
                builder.setFullScreenIntent(open, true).setContentIntent(open)
                    .addAction(Notification.Action.Builder(null, if (alarm.isNudge) "Stop Alarm" else "Wake Wupiko", stop).build())
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
