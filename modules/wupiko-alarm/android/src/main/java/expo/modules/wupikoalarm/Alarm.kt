package expo.modules.wupikoalarm

import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

internal data class Alarm(
    val id: String, val hour: Int, val minute: Int, val days: List<Int>,
    val label: String, val sound: String, val vibrate: Boolean, val enabled: Boolean,
    val nextAt: Long?, val ringing: Boolean = false,
    /** The occurrence still waiting for a check-in, if any. */
    val waitingSince: Long? = null,
    /** Follow-up ring times not yet delivered for that occurrence. */
    val followUps: List<Long> = emptyList(),
    /** A follow-up has rung, so a check-in now is late. */
    val nagged: Boolean = false,
    /** The current ring is a follow-up. */
    val followUp: Boolean = false
) {
    init {
        require(UUID.fromString(id).toString().equals(id, ignoreCase = true)) { "Invalid alarm ID" }
        require(hour in 0..23 && minute in 0..59 && days.all { it in 1..7 }) { "Invalid alarm time or weekday" }
        require(sound in setOf("daybreak", "ripple", "chime")) { "Unknown alarm sound" }
    }

    fun withNext(after: Long) = copy(nextAt = if (enabled) Occurrence.next(hour, minute, days, after) else null)

    fun toMap(now: Long = System.currentTimeMillis()): Map<String, Any?> = mapOf(
        "id" to id, "hour" to hour, "minute" to minute, "days" to days, "label" to label,
        "sound" to sound, "vibrate" to vibrate, "enabled" to enabled, "nextAt" to nextAt?.toDouble(),
        "nagAt" to followUps.filter { it > now }.minOrNull()?.toDouble()
    )

    fun encode(): JSONObject = JSONObject(toMap()).apply { remove("nagAt") }
        .put("ringing", ringing).put("waitingSince", waitingSince ?: JSONObject.NULL)
        .put("followUps", JSONArray(followUps)).put("nagged", nagged).put("followUp", followUp)

    companion object {
        fun decode(json: JSONObject): Alarm {
            val weekdays: JSONArray = json.getJSONArray("days")
            return Alarm(
                json.getString("id"), json.getInt("hour"), json.getInt("minute"),
                (0 until weekdays.length()).map { weekdays.getInt(it) }.distinct().sorted(),
                json.getString("label"), json.getString("sound"),
                json.getBoolean("vibrate"), json.getBoolean("enabled"),
                if (json.isNull("nextAt")) null else json.getLong("nextAt"),
                json.optBoolean("ringing"),
                if (json.isNull("waitingSince") || !json.has("waitingSince")) null else json.getLong("waitingSince"),
                json.optJSONArray("followUps")?.let { a -> (0 until a.length()).map { a.getLong(it) } } ?: emptyList(),
                json.optBoolean("nagged"), json.optBoolean("followUp")
            )
        }
    }
}
