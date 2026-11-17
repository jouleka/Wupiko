package expo.modules.wupikoalarm

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * Wake-up check rules, kept pure so they can be unit tested. A wake-up rings until
 * the app's check-in ends it: there is no Stop.
 */
internal object Wake {
    /** Minutes a wake-up keeps ringing for a check-in before the morning counts as missed. */
    const val WINDOW = 30

    /**
     * One time per minute of the wait. Each starts the ringing again if it was cut
     * short (a reboot, a killed process); the last one gives up and ends the wait.
     */
    fun followUps(occurrence: Long) = (1..WINDOW).map { occurrence + it * 60_000L }

    /** On time if no follow-up has rung yet. */
    fun outcome(nagged: Boolean) = if (nagged) "late" else "onTime"

    /** A wait ends as missed once its last minute has passed. */
    fun exhausted(followUps: List<Long>, now: Long) = followUps.none { it > now }
}

internal data class Morning(val alarmId: String, val at: Long, val outcome: String) {
    fun toMap(): Map<String, Any> = mapOf("alarmId" to alarmId, "at" to at.toDouble(), "outcome" to outcome)
}

/** Append-only record of how each occurrence ended, for the app's streak. */
internal object MorningLog {
    private const val LIMIT = 500

    private fun prefs(ctx: Context) = ctx.createDeviceProtectedStorageContext()
        .getSharedPreferences("wupiko_mornings_v1", Context.MODE_PRIVATE)

    @Synchronized
    fun load(ctx: Context): List<Morning> {
        val array = JSONArray(prefs(ctx).getString("log", "[]"))
        return (0 until array.length()).map { array.getJSONObject(it) }
            .map { Morning(it.getString("alarmId"), it.getLong("at"), it.getString("outcome")) }
    }

    /** The first outcome recorded for an occurrence wins. */
    @Synchronized
    fun record(ctx: Context, entries: List<Morning>) {
        if (entries.isEmpty()) return
        val log = load(ctx).toMutableList()
        for (entry in entries) {
            if (log.none { it.alarmId == entry.alarmId && it.at == entry.at }) log.add(entry)
        }
        val array = JSONArray()
        log.takeLast(LIMIT).forEach { array.put(JSONObject().put("alarmId", it.alarmId).put("at", it.at).put("outcome", it.outcome)) }
        check(prefs(ctx).edit().putString("log", array.toString()).commit()) { "Could not store morning log" }
    }
}
