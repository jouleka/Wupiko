package expo.modules.wupikoalarm

import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

internal data class Alarm(
    val id: String, val hour: Int, val minute: Int, val days: List<Int>,
    val label: String, val sound: String, val vibrate: Boolean, val enabled: Boolean,
    val nextAt: Long?, val ringing: Boolean = false
) {
    init {
        require(UUID.fromString(id).toString().equals(id, ignoreCase = true)) { "Invalid alarm ID" }
        require(hour in 0..23 && minute in 0..59 && days.all { it in 1..7 }) { "Invalid alarm time or weekday" }
        require(sound in setOf("daybreak", "ripple", "chime")) { "Unknown alarm sound" }
    }

    fun withNext(after: Long) = copy(nextAt = if (enabled) Occurrence.next(hour, minute, days, after) else null)

    fun toMap(): Map<String, Any?> = mapOf(
        "id" to id, "hour" to hour, "minute" to minute, "days" to days, "label" to label,
        "sound" to sound, "vibrate" to vibrate, "enabled" to enabled, "nextAt" to nextAt?.toDouble()
    )

    fun encode(): JSONObject = JSONObject(toMap()).put("ringing", ringing)

    companion object {
        fun decode(json: JSONObject): Alarm {
            val weekdays: JSONArray = json.getJSONArray("days")
            return Alarm(
                json.getString("id"), json.getInt("hour"), json.getInt("minute"),
                (0 until weekdays.length()).map { weekdays.getInt(it) }.distinct().sorted(),
                json.getString("label"), json.getString("sound"),
                json.getBoolean("vibrate"), json.getBoolean("enabled"),
                if (json.isNull("nextAt")) null else json.getLong("nextAt"),
                json.optBoolean("ringing")
            )
        }
    }
}
