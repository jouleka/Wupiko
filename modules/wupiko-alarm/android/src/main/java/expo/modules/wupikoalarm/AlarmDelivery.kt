package expo.modules.wupikoalarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class AlarmDelivery : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val path = intent.data?.pathSegments ?: return
        val id = path.firstOrNull() ?: return
        when (intent.action) {
            AlarmEngine.FIRE -> {
                val time = path.getOrNull(1)?.toLongOrNull() ?: return
                if (AlarmEngine.fire(context, id, time)) {
                    try {
                        context.startForegroundService(Intent(context, RingService::class.java))
                    } catch (e: RuntimeException) {
                        Log.e("Wupiko", "System declined foreground ringing service", e)
                        RingService.postFallback(context, id)
                    }
                }
            }
            AlarmEngine.STOP -> {
                AlarmEngine.stop(context, id)
                RingService.clearFallback(context, id)
            }
        }
    }
}

class RestoreAlarms : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        try {
            val clockChanged = intent.action in setOf(Intent.ACTION_TIME_CHANGED, Intent.ACTION_TIMEZONE_CHANGED)
            // The unlocked broadcast repeats restoration, so only the earlier locked one
            // clears ringing state. An alarm can already be ringing when the user unlocks.
            AlarmEngine.reconcile(context, clockChanged, intent.action == Intent.ACTION_LOCKED_BOOT_COMPLETED)
            AlarmEngine.changed()
        } catch (e: RuntimeException) {
            Log.e("Wupiko", "Could not restore native alarms", e)
        }
    }
}
