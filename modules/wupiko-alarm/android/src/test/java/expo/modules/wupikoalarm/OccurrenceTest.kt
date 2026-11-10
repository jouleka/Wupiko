package expo.modules.wupikoalarm

import org.junit.Assert.assertEquals
import org.junit.Test
import java.time.Instant
import java.time.ZoneId

class OccurrenceTest {
    private fun checkNext(expected: String, after: String, hour: Int, minute: Int,
                          days: List<Int> = emptyList(), zone: String = "UTC") {
        val next = Occurrence.next(hour, minute, days, Instant.parse(after).toEpochMilli(), ZoneId.of(zone))
        assertEquals(Instant.parse(expected), Instant.ofEpochMilli(next))
    }

    @Test fun oneTimeTodayAndTomorrow() {
        checkNext("2026-11-10T07:00:00Z", "2026-11-10T06:59:59Z", 7, 0)
        checkNext("2026-11-11T07:00:00Z", "2026-11-10T07:00:00Z", 7, 0)
    }
    @Test fun repeatedDaysSkipWeekendAndAcceptSunday() {
        checkNext("2026-11-16T07:00:00Z", "2026-11-13T07:01:00Z", 7, 0, listOf(1, 3, 5))
        checkNext("2026-11-15T07:00:00Z", "2026-11-13T07:01:00Z", 7, 0, listOf(7))
    }
    @Test fun springGapShiftsThroughMissingHour() {
        checkNext("2026-03-08T07:30:00Z", "2026-03-08T05:00:00Z", 2, 30, listOf(7), "America/New_York")
    }
    @Test fun fallFoldUsesFirstOccurrenceOnly() {
        checkNext("2026-11-01T05:30:00Z", "2026-11-01T04:00:00Z", 1, 30, listOf(7), "America/New_York")
        checkNext("2026-11-08T06:30:00Z", "2026-11-01T05:30:00Z", 1, 30, listOf(7), "America/New_York")
    }
    @Test fun timeZoneFollowsLocalWallTime() {
        checkNext("2026-11-10T06:00:00Z", "2026-11-10T00:00:00Z", 7, 0, zone = "Europe/Tirane")
        checkNext("2026-11-10T12:00:00Z", "2026-11-10T00:00:00Z", 7, 0, zone = "America/New_York")
    }
    @Test fun nonHourlyZoneGap() {
        checkNext("2026-10-03T15:40:00Z", "2026-10-03T14:00:00Z", 2, 10, listOf(7), "Australia/Lord_Howe")
    }
}
