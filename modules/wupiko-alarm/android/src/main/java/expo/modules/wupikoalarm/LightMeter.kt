package expo.modules.wupikoalarm

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager

/** Reads the phone's ambient light sensor in lux for feeding Wupiko light. */
internal class LightMeter(private val ctx: Context, private val onLux: (Double) -> Unit) : SensorEventListener {
    private val manager get() = ctx.getSystemService(SensorManager::class.java)
    private val sensor get() = manager?.getDefaultSensor(Sensor.TYPE_LIGHT)

    /** The light sensor needs no permission: it is either there or not. */
    val availability get() = if (sensor != null) "ready" else "unavailable"

    fun start() {
        val light = requireNotNull(sensor) { "This phone has no light sensor." }
        manager?.registerListener(this, light, SensorManager.SENSOR_DELAY_UI)
    }

    fun stop() {
        manager?.unregisterListener(this)
    }

    // The light sensor reports only on change, so every reading matters: never drop one.
    override fun onSensorChanged(event: SensorEvent) {
        onLux(event.values[0].toDouble())
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
}
