package expo.modules.wupikoalarm

import android.Manifest
import android.os.Build
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import java.time.ZonedDateTime
import java.util.UUID
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class AlarmEngineTest {
    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val ctx = instrumentation.targetContext
    private val id = UUID.randomUUID().toString()
    private val time = ZonedDateTime.now().plusHours(1)
    private val draft = Alarm(id, time.hour, time.minute, emptyList(), "Wake", "daybreak", true, false, null)
    private fun saved() = AlarmEngine.alarms(ctx).single { it.id == id }

    @Before fun allowNotifications() {
        if (Build.VERSION.SDK_INT >= 33) {
            instrumentation.uiAutomation.grantRuntimePermission(ctx.packageName, Manifest.permission.POST_NOTIFICATIONS)
        }
        RingService.channel(ctx)
    }

    @After fun cleanUp() {
        AlarmEngine.delete(ctx, id)
    }

    @Test fun nativeEditsCancelTheOldDelivery() {
        AlarmEngine.save(ctx, draft)
        assertNull(saved().nextAt)
        AlarmEngine.save(ctx, draft.copy(enabled = true))
        val oldTime = requireNotNull(saved().nextAt)
        AlarmEngine.save(ctx, draft.copy(enabled = true, minute = (draft.minute + 5) % 60, label = "Edited"))
        assertEquals("Edited", saved().label)
        assertFalse(AlarmEngine.fire(ctx, id, oldTime))
        val editedTime = requireNotNull(saved().nextAt)
        AlarmEngine.save(ctx, saved().copy(enabled = false))
        assertFalse(AlarmEngine.fire(ctx, id, editedTime))
        assertNull(saved().nextAt)
        AlarmEngine.delete(ctx, id)
        assertFalse(AlarmEngine.alarms(ctx).any { it.id == id })
        assertFalse(AlarmEngine.fire(ctx, id, editedTime))
    }

    @Test fun stopConsumesOneTimeAndPreservesWeeklyOccurrence() {
        AlarmEngine.save(ctx, draft.copy(enabled = true))
        val oneTime = requireNotNull(saved().nextAt)
        val detachedObserver: () -> Unit = { error("React context closed") }
        AlarmEngine.listeners.add(detachedObserver)
        try {
            assertTrue(AlarmEngine.fire(ctx, id, oneTime))
        } finally {
            AlarmEngine.listeners.remove(detachedObserver)
        }
        assertTrue(saved().ringing)
        assertFalse(saved().enabled)
        AlarmEngine.stop(ctx, id)
        assertFalse(saved().ringing)
        assertFalse(AlarmEngine.fire(ctx, id, oneTime))
        AlarmEngine.save(ctx, draft.copy(enabled = true, days = listOf(time.dayOfWeek.value)))
        val first = requireNotNull(saved().nextAt)
        assertTrue(AlarmEngine.fire(ctx, id, first))
        val next = requireNotNull(saved().nextAt)
        assertTrue(next > first)
        AlarmEngine.stop(ctx, id)
        assertTrue(saved().enabled)
        assertEquals(next, saved().nextAt)
        assertFalse(saved().ringing)
        assertFalse(AlarmEngine.fire(ctx, id, first))
    }
}
