package expo.modules.wupikoalarm

import java.time.Instant
import java.time.LocalTime
import java.time.ZoneId

internal object Occurrence {
    // Java's atZone shifts a nonexistent time forward through the DST gap and uses the
    // earlier offset during a fold. A wall-clock occurrence therefore rings once per day.
    fun next(hour: Int, minute: Int, days: List<Int>, after: Long, zone: ZoneId = ZoneId.systemDefault()): Long {
        val today = Instant.ofEpochMilli(after).atZone(zone).toLocalDate()
        val time = LocalTime.of(hour, minute)
        for (offset in 0L..8L) {
            val date = today.plusDays(offset)
            if (days.isNotEmpty() && date.dayOfWeek.value !in days) continue
            val candidate = date.atTime(time).atZone(zone).toInstant().toEpochMilli()
            if (candidate > after) return candidate
        }
        error("No matching weekday")
    }
}
