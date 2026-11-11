package expo.modules.wupikoalarm

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class WakeTest {
    private val seven = 1_700_000_000_000L

    @Test fun followUpsRingOneThreeAndSixMinutesLater() {
        assertEquals(listOf(seven + 60_000, seven + 180_000, seven + 360_000), Wake.followUps(seven))
    }

    @Test fun checkingInBeforeAFollowUpIsOnTime() {
        assertEquals("onTime", Wake.outcome(nagged = false))
        assertEquals("late", Wake.outcome(nagged = true))
    }

    @Test fun waitEndsOnlyOnceEveryFollowUpRangAndNothingRings() {
        val pending = Wake.followUps(seven)
        assertFalse(Wake.exhausted(pending, ringing = false, now = seven + 30_000))
        assertFalse("the last follow-up is still ringing", Wake.exhausted(emptyList(), ringing = true, now = seven + 400_000))
        assertTrue(Wake.exhausted(emptyList(), ringing = false, now = seven + 400_000))
        assertTrue("follow-ups lost while the phone was off", Wake.exhausted(pending, ringing = false, now = seven + 400_000))
    }
}
