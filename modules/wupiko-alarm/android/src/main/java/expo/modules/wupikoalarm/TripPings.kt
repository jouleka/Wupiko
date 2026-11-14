package expo.modules.wupikoalarm

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.Uri

/**
 * Gentle notifications for the morning find: the story is in, the bag is ready
 * to unpack, and a last call before Wupiko dozes off. Wupiko already holds the
 * exact-alarm permission as an alarm clock, so pings land on time like on iOS.
 */
internal object TripPings {
    const val CHANNEL = "wupiko_trips"
    private const val ACTION = "expo.modules.wupikoalarm.TRIP_PING"

    private fun intent(ctx: Context, id: String) = Intent(ctx, TripPingReceiver::class.java)
        .setAction(ACTION).setData(Uri.parse("wupiko-native://ping/$id"))

    fun status(ctx: Context): String {
        val manager = ctx.getSystemService(NotificationManager::class.java)
        ensureChannel(ctx)
        val blocked = manager.getNotificationChannel(CHANNEL)?.importance == NotificationManager.IMPORTANCE_NONE
        return if (manager.areNotificationsEnabled() && !blocked) "granted" else "denied"
    }

    fun schedule(ctx: Context, id: String, at: Long, title: String, body: String) {
        val pending = PendingIntent.getBroadcast(ctx, 0, intent(ctx, id).putExtra("title", title).putExtra("body", body),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val alarms = ctx.getSystemService(AlarmManager::class.java)
        if (AlarmEngine.exactAllowed(ctx)) alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending)
        else alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending)
    }

    fun cancel(ctx: Context, ids: List<String>) {
        val alarms = ctx.getSystemService(AlarmManager::class.java)
        val manager = ctx.getSystemService(NotificationManager::class.java)
        for (id in ids) {
            PendingIntent.getBroadcast(ctx, 0, intent(ctx, id), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_NO_CREATE)?.let {
                alarms.cancel(it)
                it.cancel()
            }
            manager.cancel(id, NOTICE)
        }
    }

    private fun ensureChannel(ctx: Context) {
        val manager = ctx.getSystemService(NotificationManager::class.java)
        if (manager.getNotificationChannel(CHANNEL) == null) {
            manager.createNotificationChannel(NotificationChannel(CHANNEL, "Morning finds", NotificationManager.IMPORTANCE_DEFAULT).apply {
                description = "When Wupiko’s story and keepsake are ready"
            })
        }
    }

    fun post(ctx: Context, id: String, title: String, body: String) {
        ensureChannel(ctx)
        val launch = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName) ?: return
        val open = PendingIntent.getActivity(ctx, id.hashCode(), launch, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val notice = Notification.Builder(ctx, CHANNEL)
            .setSmallIcon(R.drawable.wupiko_alarm)
            .setContentTitle(title)
            .setContentText(body)
            .setContentIntent(open)
            .setAutoCancel(true)
            .build()
        ctx.getSystemService(NotificationManager::class.java).notify(id, NOTICE, notice)
    }

    private const val NOTICE = 7301
}

class TripPingReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val id = intent.data?.lastPathSegment ?: return
        TripPings.post(context, id, intent.getStringExtra("title") ?: return, intent.getStringExtra("body") ?: "")
    }
}
