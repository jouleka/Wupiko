package expo.modules.wupikoalarm

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class AlarmInput : Record {
    @Field var id: String = ""
    @Field var hour: Int = -1
    @Field var minute: Int = -1
    @Field var days: List<Int> = emptyList()
    @Field var label: String = ""
    @Field var sound: String = "daybreak"
    @Field var vibrate: Boolean = true
    @Field var enabled: Boolean = true
    @Field var kind: String = "wake"
}

class WupikoAlarmModule : Module() {
    private var needsRestore = true
    private val ctx: Context get() = requireNotNull(appContext.reactContext).applicationContext
    private val listener: () -> Unit = { sendEvent("onAlarmChange", emptyMap<String, Any>()) }
    private val lightMeter by lazy { LightMeter(ctx) { lux -> sendEvent("onLight", mapOf("lux" to lux)) } }

    override fun definition() = ModuleDefinition {
        Name("WupikoAlarm")
        Events("onAlarmChange", "onLight")
        OnStartObserving { AlarmEngine.listeners.add(listener) }
        OnStopObserving { AlarmEngine.listeners.remove(listener) }
        OnDestroy {
            AlarmEngine.listeners.remove(listener)
            lightMeter.stop()
        }

        AsyncFunction("lightAvailability") { lightMeter.availability }
        AsyncFunction("requestLightAccess") { lightMeter.availability == "ready" }
        AsyncFunction("startLight") { lightMeter.start() }
        AsyncFunction("stopLight") { lightMeter.stop() }

        AsyncFunction("getState") {
            RingService.channel(ctx)
            AlarmEngine.reconcile(ctx, forceRestore = needsRestore)
            needsRestore = false
            val alarms = AlarmEngine.alarms(ctx)
            val now = System.currentTimeMillis()
            mapOf(
                "alarms" to alarms.map { it.toMap(now) },
                "permissions" to mapOf(
                    "alarm" to if (AlarmEngine.exactAllowed(ctx)) "granted" else "denied",
                    "fullScreen" to AlarmEngine.fullScreenAllowed(ctx),
                    "notifications" to AlarmEngine.notificationsAllowed(ctx)
                ),
                "ringingIds" to alarms.filter { it.ringing }.sortedBy { it.id }.map { it.id },
                "checkInIds" to alarms.filter { it.waitingSince != null }.sortedBy { it.waitingSince }.map { it.id },
                "followUpIds" to alarms.filter { it.ringing && it.followUp }.map { it.id },
                "mornings" to MorningLog.load(ctx).map { it.toMap() }
            )
        }

        AsyncFunction("requestPermission") { promise: Promise ->
            RingService.channel(ctx)
            if (!AlarmEngine.exactAllowed(ctx) && Build.VERSION.SDK_INT >= 31) {
                launch(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
                promise.resolve()
            } else if (Build.VERSION.SDK_INT >= 33 &&
                ctx.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                requireNotNull(appContext.permissions).askForPermissions(
                    { promise.resolve() }, Manifest.permission.POST_NOTIFICATIONS
                )
            } else {
                if (!AlarmEngine.notificationsAllowed(ctx)) notificationSettings()
                promise.resolve()
            }
        }

        AsyncFunction("openSettings") {
            when {
                !AlarmEngine.exactAllowed(ctx) && Build.VERSION.SDK_INT >= 31 ->
                    launch(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
                !AlarmEngine.notificationsAllowed(ctx) -> notificationSettings()
                !AlarmEngine.fullScreenAllowed(ctx) && Build.VERSION.SDK_INT >= 34 ->
                    launch(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT)
                else -> launch(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
            }
        }

        AsyncFunction("setRingTheme") { theme: String ->
            require(theme in setOf("system", "light", "dark"))
            RingActivity.appearance(ctx).edit().putString("theme", theme).apply()
        }

        AsyncFunction("saveAlarm") { a: AlarmInput ->
            AlarmEngine.save(ctx, Alarm(a.id, a.hour, a.minute, a.days.distinct().sorted(),
                a.label.trim(), a.sound, a.vibrate, a.enabled, null, kind = a.kind))
        }
        AsyncFunction("deleteAlarm") { id: String ->
            AlarmEngine.delete(ctx, id)
            RingService.clearFallback(ctx, id)
        }
        AsyncFunction("stopAlarm") { id: String ->
            AlarmEngine.stop(ctx, id)
            RingService.clearFallback(ctx, id)
        }
        AsyncFunction("checkIn") { id: String ->
            AlarmEngine.checkIn(ctx, id)
            RingService.clearFallback(ctx, id)
        }
    }

    private fun notificationSettings() {
        val manager = ctx.getSystemService(android.app.NotificationManager::class.java)
        val channelBlocked = manager.getNotificationChannel(RingService.CHANNEL)?.importance ==
            android.app.NotificationManager.IMPORTANCE_NONE && manager.areNotificationsEnabled()
        val intent = Intent(if (channelBlocked) Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS
            else Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, ctx.packageName)
        if (channelBlocked) intent.putExtra(Settings.EXTRA_CHANNEL_ID, RingService.CHANNEL)
        open(intent)
    }

    private fun launch(action: String) = open(Intent(action, Uri.parse("package:${ctx.packageName}")))

    private fun open(intent: Intent) {
        val activity = requireNotNull(appContext.currentActivity) { "Open Wupiko to manage permissions." }
        try {
            activity.startActivity(intent)
        } catch (_: android.content.ActivityNotFoundException) {
            activity.startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${ctx.packageName}")))
        }
    }
}
