package expo.modules.wupikoalarm

import android.app.Application
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.UserManager

object DirectBoot {
    /** Called on the main thread. Unlock can race receiver registration at process start. */
    fun afterUnlock(app: Application, initialize: () -> Unit) {
        val user = app.getSystemService(UserManager::class.java)
        if (user.isUserUnlocked) {
            initialize()
            return
        }
        var waiting = true
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
                if (waiting && user.isUserUnlocked) {
                    waiting = false
                    app.unregisterReceiver(this)
                    initialize()
                }
            }
        }
        // ACTION_USER_UNLOCKED is a protected system-only broadcast.
        app.registerReceiver(receiver, IntentFilter(Intent.ACTION_USER_UNLOCKED))
        if (user.isUserUnlocked) receiver.onReceive(app, Intent(Intent.ACTION_USER_UNLOCKED))
    }
}
