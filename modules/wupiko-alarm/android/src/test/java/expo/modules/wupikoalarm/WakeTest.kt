package expo.modules.wupikoalarm

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class WakeTest {
    private val seven = 1_700_000_000_000L

    @Test fun theWaitIsCheckedEveryMinuteForHalfAnHour() {
        val times = Wake.followUps(seven)
        assertEquals(30, times.size)
        assertEquals(seven + 60_000, times.first())
        assertEquals(seven + 30 * 60_000, times.last())
        assertTrue(times.zipWithNext().all { (a, b) -> b - a == 60_000L })
    }

    @Test fun checkingInBeforeAFollowUpIsOnTime() {
        assertEquals("onTime", Wake.outcome(nagged = false))
        assertEquals("late", Wake.outcome(nagged = true))
    }

    @Test fun waitEndsOnceItsLastMinuteHasPassed() {
        val pending = Wake.followUps(seven)
        assertFalse(Wake.exhausted(pending, now = seven + 30_000))
        assertFalse("one minute left", Wake.exhausted(pending.takeLast(1), now = seven + 29 * 60_000))
        assertTrue(Wake.exhausted(emptyList(), now = seven + 400_000))
        assertTrue("the phone was off for the whole wait", Wake.exhausted(pending, now = seven + 31 * 60_000))
    }
}
