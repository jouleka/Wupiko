package expo.modules.wupikoalarm

import android.app.Activity
import android.content.res.Configuration
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.text.format.DateFormat
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextClock
import android.widget.TextView
import kotlin.math.roundToInt

class RingActivity : Activity() {
    private val listener: () -> Unit = { runOnUiThread { display() } }
    private var showing: String? = null
    private fun dp(value: Int) = (resources.displayMetrics.density * value).roundToInt()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        @Suppress("DEPRECATION")
        window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    override fun onStart() {
        super.onStart()
        AlarmEngine.listeners.add(listener)
        display()
    }

    override fun onStop() {
        AlarmEngine.listeners.remove(listener)
        super.onStop()
    }

    private fun display() {
        if (isFinishing) return
        val alarm = AlarmEngine.alarms(this).filter { it.ringing }.minByOrNull { it.id }
        if (alarm == null) {
            finishAndRemoveTask()
            return
        }
        if (showing == alarm.id) return
        showing = alarm.id
        val dark = when (appearance(this).getString("theme", "system")) {
            "light" -> false
            "dark" -> true
            else -> resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK == Configuration.UI_MODE_NIGHT_YES
        }
        val paper = Color.parseColor(if (dark) "#242520" else "#F9F5EA")
        val ink = Color.parseColor(if (dark) "#F9F5EA" else "#242520")
        window.statusBarColor = paper
        window.navigationBarColor = paper
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility = if (dark) 0 else View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
        val scroll = ScrollView(this).apply {
            isFillViewport = true
            setBackgroundColor(paper)
            setOnApplyWindowInsetsListener { v, insets ->
                @Suppress("DEPRECATION")
                v.setPadding(insets.systemWindowInsetLeft, insets.systemWindowInsetTop,
                    insets.systemWindowInsetRight, insets.systemWindowInsetBottom)
                insets
            }
        }
        val column = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(dp(24), dp(20), dp(24), dp(24))
        }
        val mark = ImageView(this).apply {
            setImageResource(R.drawable.wupiko_ringing)
            scaleType = ImageView.ScaleType.FIT_CENTER
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
        }
        column.addView(mark, dp(196), dp(196))
        val time = TextClock(this).apply {
            format12Hour = "h:mm a"
            format24Hour = "HH:mm"
            gravity = Gravity.CENTER
            textSize = if (DateFormat.is24HourFormat(this@RingActivity)) 60f else 52f
            typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
            setTextColor(ink)
        }
        column.addView(time)
        val title = TextView(this).apply {
            text = alarm.label.ifBlank { "Time to wake up." }
            gravity = Gravity.CENTER
            textSize = 22f
            setTextColor(ink)
            setPadding(0, dp(6), 0, dp(30))
        }
        column.addView(title)
        val stop = Button(this).apply {
            text = "Stop Alarm"
            isAllCaps = false
            textSize = 22f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.parseColor("#242520"))
            minHeight = dp(64)
            background = android.graphics.drawable.RippleDrawable(
                android.content.res.ColorStateList.valueOf(0x22745200),
                GradientDrawable().apply {
                    setColor(Color.parseColor("#FFD45D"))
                    cornerRadius = dp(24).toFloat()
                }, null)
            setOnClickListener {
                performHapticFeedback(android.view.HapticFeedbackConstants.VIRTUAL_KEY)
                AlarmEngine.stop(this@RingActivity, alarm.id)
                RingService.clearFallback(this@RingActivity, alarm.id)
            }
        }
        column.addView(stop, LinearLayout.LayoutParams(-1, -2))
        scroll.addView(column)
        setContentView(scroll)
    }

    companion object {
        internal fun appearance(ctx: android.content.Context) = ctx.createDeviceProtectedStorageContext()
            .getSharedPreferences("wupiko_appearance", android.content.Context.MODE_PRIVATE)
    }
}
