package expo.modules.wupikoalarm

import android.app.AlarmManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.util.Log
import org.json.JSONObject
import java.time.Instant
import java.time.ZoneId
import java.util.concurrent.CopyOnWriteArraySet

internal object AlarmEngine {
    const val FIRE = "expo.modules.wupikoalarm.FIRE"
    const val STOP = "expo.modules.wupikoalarm.STOP"
    const val FOLLOW = "expo.modules.wupikoalarm.FOLLOW"
    val listeners = CopyOnWriteArraySet<() -> Unit>()

    private fun prefs(ctx: Context) = ctx.createDeviceProtectedStorageContext()
        .getSharedPreferences("wupiko_native_v1", Context.MODE_PRIVATE)

    @Synchronized
    fun alarms(ctx: Context) = prefs(ctx).all.values.map { Alarm.decode(JSONObject(it as String)) }

    private fun find(ctx: Context, id: String): Alarm? = prefs(ctx).getString(id, null)?.let {
        Alarm.decode(JSONObject(it))
    }

    private fun write(ctx: Context, alarm: Alarm, zone: ZoneId = ZoneId.systemDefault()) {
        val json = alarm.encode().put("zone", zone.id)
        check(prefs(ctx).edit().putString(alarm.id, json.toString()).commit()) { "Could not store alarm" }
    }

    fun exactAllowed(ctx: Context) = Build.VERSION.SDK_INT < 31 ||
        ctx.getSystemService(AlarmManager::class.java).canScheduleExactAlarms()

    fun notificationsAllowed(ctx: Context): Boolean {
        val manager = ctx.getSystemService(NotificationManager::class.java)
        return manager.areNotificationsEnabled() &&
            manager.getNotificationChannel(RingService.CHANNEL)?.importance != NotificationManager.IMPORTANCE_NONE
    }

    fun fullScreenAllowed(ctx: Context) = Build.VERSION.SDK_INT < 34 ||
        ctx.getSystemService(NotificationManager::class.java).canUseFullScreenIntent()

    private fun fireIntent(ctx: Context, alarm: Alarm, flags: Int) = PendingIntent.getBroadcast(
        ctx, 0, Intent(ctx, AlarmDelivery::class.java).setAction(FIRE)
            .setData(Uri.parse("wupiko-native://fire/${alarm.id}/${alarm.nextAt}")),
        flags or PendingIntent.FLAG_IMMUTABLE
    )

    private fun schedule(ctx: Context, alarm: Alarm) {
        val time = requireNotNull(alarm.nextAt)
        val launch = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)
            ?: Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER).setPackage(ctx.packageName)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        val show = PendingIntent.getActivity(ctx, 0, launch, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val operation = requireNotNull(fireIntent(ctx, alarm, PendingIntent.FLAG_UPDATE_CURRENT))
        ctx.getSystemService(AlarmManager::class.java)
            .setAlarmClock(AlarmManager.AlarmClockInfo(time, show), operation)
    }

    private fun cancel(ctx: Context, alarm: Alarm?) {
        if (alarm?.nextAt == null) return
        fireIntent(ctx, alarm, PendingIntent.FLAG_NO_CREATE)?.let {
            ctx.getSystemService(AlarmManager::class.java).cancel(it)
            it.cancel()
        }
    }

    private fun followIntent(ctx: Context, id: String, time: Long, flags: Int) = PendingIntent.getBroadcast(
        ctx, 0, Intent(ctx, AlarmDelivery::class.java).setAction(FOLLOW)
            .setData(Uri.parse("wupiko-native://follow/$id/$time")),
        flags or PendingIntent.FLAG_IMMUTABLE
    )

    private fun scheduleFollowUps(ctx: Context, alarm: Alarm, now: Long = System.currentTimeMillis()) {
        val launch = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)
        val show = launch?.let { PendingIntent.getActivity(ctx, 0, it, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT) }
        for (time in alarm.followUps.filter { it > now }) {
            val operation = requireNotNull(followIntent(ctx, alarm.id, time, PendingIntent.FLAG_UPDATE_CURRENT))
            ctx.getSystemService(AlarmManager::class.java).setAlarmClock(AlarmManager.AlarmClockInfo(time, show), operation)
        }
    }

    private fun cancelFollowUps(ctx: Context, alarm: Alarm?) {
        for (time in alarm?.followUps.orEmpty()) {
            followIntent(ctx, alarm!!.id, time, PendingIntent.FLAG_NO_CREATE)?.let {
                ctx.getSystemService(AlarmManager::class.java).cancel(it)
                it.cancel()
            }
        }
    }

    /** Ends a wait without a check-in: editing, deleting or ignoring an alarm is not a way out. */
    private fun abandon(ctx: Context, alarm: Alarm?): Alarm? {
        val since = alarm?.waitingSince ?: return alarm
        cancelFollowUps(ctx, alarm)
        MorningLog.record(ctx, listOf(Morning(alarm.id, since, "missed")))
        return alarm.copy(waitingSince = null, followUps = emptyList(), nagged = false, followUp = false)
    }

    private fun replace(ctx: Context, old: Alarm?, new: Alarm) {
        if (new.enabled && new.nextAt != null) schedule(ctx, new)
        try {
            write(ctx, new)
        } catch (e: Exception) {
            if (new.nextAt != old?.nextAt) cancel(ctx, new)
            throw e
        }
        if (old?.nextAt != new.nextAt) cancel(ctx, old)
    }

    @Synchronized
    fun save(ctx: Context, alarm: Alarm) {
        if (alarm.enabled) {
            check(exactAllowed(ctx)) { "Allow Alarms & reminders to set this alarm." }
            check(notificationsAllowed(ctx)) { "Enable alarm notifications so you can see and stop your alarm." }
        }
        val old = find(ctx, alarm.id)
        replace(ctx, old, alarm.withNext(System.currentTimeMillis()))
        abandon(ctx, old)
        changed()
    }

    @Synchronized
    fun delete(ctx: Context, id: String) {
        val alarm = find(ctx, id) ?: return
        check(prefs(ctx).edit().remove(id).commit()) { "Could not delete alarm" }
        cancel(ctx, alarm)
        abandon(ctx, alarm)
        changed()
    }

    @Synchronized
    fun stop(ctx: Context, id: String) {
        val alarm = find(ctx, id) ?: return
        if (!alarm.ringing) return
        var next = alarm.copy(ringing = false, followUp = false)
        // Stopping never ends the wait. Once the last follow-up has rung and is silenced, the morning is missed.
        if (next.waitingSince != null && Wake.exhausted(next.followUps, false, System.currentTimeMillis())) {
            next = requireNotNull(abandon(ctx, next))
        }
        write(ctx, next)
        changed()
    }

    /** The user finished the app's wake-up ritual: silence everything and log the morning. */
    @Synchronized
    fun checkIn(ctx: Context, id: String) {
        val alarm = find(ctx, id) ?: return
        val since = alarm.waitingSince ?: return
        cancelFollowUps(ctx, alarm)
        MorningLog.record(ctx, listOf(Morning(id, since, Wake.outcome(alarm.nagged))))
        write(ctx, alarm.copy(ringing = false, followUp = false, waitingSince = null, followUps = emptyList(), nagged = false))
        changed()
    }

    /** A follow-up for an occurrence the user silenced without checking in. */
    @Synchronized
    fun fireFollowUp(ctx: Context, id: String, time: Long): Boolean {
        val alarm = find(ctx, id) ?: return false
        if (alarm.waitingSince == null || time !in alarm.followUps) return false
        if (!exactAllowed(ctx) || !notificationsAllowed(ctx)) return false
        write(ctx, alarm.copy(ringing = true, followUp = true, nagged = true, followUps = alarm.followUps - time))
        followIntent(ctx, id, time, PendingIntent.FLAG_NO_CREATE)?.cancel()
        changed()
        return true
    }

    @Synchronized
    fun fire(ctx: Context, id: String, time: Long): Boolean {
        val alarm = find(ctx, id) ?: return false
        if (!alarm.enabled || alarm.nextAt != time) return false
        if (!exactAllowed(ctx) || !notificationsAllowed(ctx)) {
            // An inaudible/missing notification would leave a locked user without Stop Alarm.
            replace(ctx, alarm, alarm.copy(enabled = false, nextAt = null, ringing = false))
            changed()
            return false
        }
        val now = maxOf(System.currentTimeMillis(), time)
        // A previous occurrence still waiting at this point was never checked in.
        val waiting = requireNotNull(abandon(ctx, alarm))
        var next = waiting.copy(enabled = alarm.days.isNotEmpty(), ringing = true, followUp = false,
            waitingSince = time, followUps = Wake.followUps(time), nagged = false).withNext(now)
        try {
            scheduleFollowUps(ctx, next, now)
        } catch (e: RuntimeException) {
            Log.e("Wupiko", "Cannot schedule follow-ups", e)
        }
        if (next.enabled) {
            // A later recurrence must never prevent this occurrence from ringing.
            try {
                schedule(ctx, next)
            } catch (e: RuntimeException) {
                Log.e("Wupiko", "Cannot schedule next occurrence", e)
                next = next.copy(enabled = false, nextAt = null)
            }
        }
        write(ctx, next)
        fireIntent(ctx, alarm, PendingIntent.FLAG_NO_CREATE)?.cancel()
        changed()
        return true
    }

    /** Restore wall times after a reboot, force-stop/relaunch, update or clock change.
     * An expired one-shot stays expired even if the user opens the app the following day.
     */
    @Synchronized
    fun reconcile(ctx: Context, clockChanged: Boolean = false, reboot: Boolean = false, forceRestore: Boolean = true) {
        val now = System.currentTimeMillis()
        val zone = ZoneId.systemDefault()
        val accessible = exactAllowed(ctx) && notificationsAllowed(ctx)
        var changedState = false
        // Follow-ups: end exhausted waits as missed and re-arm the rest after a reboot or force-stop.
        for (alarm in alarms(ctx).filter { it.waitingSince != null }) {
            val live = if (reboot) alarm.copy(ringing = false, followUp = false) else alarm
            if (Wake.exhausted(live.followUps, live.ringing, now)) {
                write(ctx, requireNotNull(abandon(ctx, live)))
                changedState = true
            } else if (accessible && (forceRestore || reboot)) {
                scheduleFollowUps(ctx, live, now)
            }
        }
        for ((_, encoded) in prefs(ctx).all) {
            val json = JSONObject(encoded as String)
            val old = Alarm.decode(json)
            var new = if (reboot) old.copy(ringing = false) else old
            if (!accessible && (old.enabled || old.ringing)) {
                replace(ctx, old, old.copy(enabled = false, nextAt = null, ringing = false))
                RingService.clearFallback(ctx, old.id)
                changedState = true
                continue
            }
            val previousTime = old.nextAt
            if (!old.enabled || previousTime == null) {
                if (new != old) {
                    write(ctx, new)
                    changedState = true
                }
                continue
            }
            val oldZone = ZoneId.of(json.optString("zone", zone.id))
            val zoneChanged = zone != oldZone
            new = when {
                !reboot && !clockChanged && !zoneChanged && now - previousTime in 0L..60_000L &&
                    fireIntent(ctx, old, PendingIntent.FLAG_NO_CREATE) != null ->
                    // setAlarmClock may already have handed off to our receiver. Leave it intact.
                    continue
                new.days.isNotEmpty() && (clockChanged || zoneChanged || previousTime <= now) -> new.withNext(now)
                new.days.isEmpty() && zoneChanged -> {
                    val date = Instant.ofEpochMilli(previousTime).atZone(oldZone).toLocalDate()
                    val time = date.atTime(new.hour, new.minute).atZone(zone).toInstant().toEpochMilli()
                    if (time > now) new.copy(nextAt = time) else new.copy(enabled = false, nextAt = null)
                }
                previousTime <= now -> new.copy(enabled = false, nextAt = null)
                else -> new
            }
            if (new != old || zoneChanged) replace(ctx, old, new)
            else if (forceRestore) schedule(ctx, old)
            if (new != old) changedState = true
        }
        if (changedState) changed()
    }

    // A disappearing React context or ringing Activity must never block OS delivery.
    fun changed() = listeners.forEach { listener ->
        try {
            listener()
        } catch (e: RuntimeException) {
            Log.w("Wupiko", "Alarm observer unavailable", e)
        }
    }
}
