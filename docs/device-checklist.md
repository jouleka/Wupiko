# Release acceptance on real devices

Use a standalone Release build with Metro disconnected. Record the device, OS build, app commit, zone, volume, focus mode, battery mode, scheduled local time, actual time, and outcome. Test one iPhone running iOS 26+ and one Android phone running Android 8+. Include a modern Android 14+ device for full-screen access. Keep a second clock nearby. Restore settings and delete test alarms afterward.

| Scenario | Procedure and expected observation |
|---|---|
| First launch | Complete onboarding, deny access, attempt to enable an alarm. Confirm the app explains how to recover and never confirms a failed schedule. Grant access, return, and save. |
| Delivery and Stop | Set a named one-time alarm two minutes ahead. Lock the screen. Record the alert, label, audible tone, available actions and stop latency. Reopen the app and confirm the alarm is off. |
| Background and termination | Repeat with the app behind another app and after closing it normally. On Android test swiping the task away separately from Settings → Force stop. Record vendor-specific behavior. |
| Reboot | Schedule before reboot. Test delivery before first unlock where supported, then after unlocking, both with and without reopening the app. |
| Repeat | Set a repeating alarm for today plus another day. Stop it and confirm the next selected day remains scheduled. |
| Simultaneous alarms | Set two differently named alarms for the same minute. Stop each separately. Record how the OS presents the second and check both final states. |
| Edit, disable, delete | Move a scheduled alarm later and check the old minute stays quiet. Disable and delete alarms separately, relaunch, and confirm their previous times stay quiet. |
| Notification and alarm access | Revoke access with an alarm scheduled. Check state on return, enable access again, and verify the resulting next occurrence and actual delivery. On Android 14+ repeat with full-screen access off and check the notification Stop action. |
| Clock and zone changes | Schedule a future local time. Change time zone, then change clock time across an occurrence. Compare displayed next time with OS delivery. |
| DST | Test a spring-forward missing time and fall-back repeated time in a zone with DST. Record the OS delivery time and confirm a fall-back alarm does not ring twice. |
| Sound and power | Repeat locked delivery with each tone, silent mode, Focus / DND, low-power / battery saver and, on Android, manufacturer battery restrictions. Check vibration on Android. Record actual device policy. |
| Accessibility | Complete creation, editing and Stop with VoiceOver / TalkBack. Repeat with large text, 24-hour time, dark appearance and reduced motion. Confirm essential controls remain reachable. |
| Offline | Turn on airplane mode, relaunch and repeat scheduling, delivery and Stop. |
| No snooze | Inspect the lock screen, system notification actions, expanded notification, in-app UI, and settings. Only dismissal should end a ringing occurrence. |

A simulator or emulator result covers that environment only. Store submission also requires reviewing the current platform permission declarations, signing and store metadata.
