# Android alarms

Wupiko supports Android 8.0 (API 26) and later. The Expo development build or a release APK contains the local Kotlin module. The alarm receiver, foreground service, lock-screen activity, persistence and recurrence engine run without a JavaScript runtime.

## Scheduling and recovery

- Saving an enabled alarm registers its next occurrence with `AlarmManager.setAlarmClock`. Android owns an immutable broadcast pending intent, so swiping Wupiko out of Recents or killing its background process does not remove the alarm. Each occurrence carries its expected timestamp. The receiver drops stale or duplicate deliveries after edits, disable and delete. [Android alarm scheduling](https://developer.android.com/develop/background-work/services/alarms)
- A one-time alarm becomes disabled when it fires and remains available for editing. A weekly alarm schedules its next selected weekday before ringing. Each ringing alarm has its own stop state. Overlapping alarms share one audio session and Stop Alarm advances to the next active alarm.
- Wall-clock recurrence follows the device time zone. DST gaps move forward by the length of the gap. DST overlaps use the first occurrence. On a time-zone change a future one-time alarm keeps its originally intended local date. An already missed one-time alarm expires.
- Native alarm records are stored in device-protected preferences so the receiver can reschedule after a reboot, including the locked-boot broadcast. Wupiko also listens for clock/zone changes, app replacement and exact-alarm permission restoration. Device-specific pre-unlock delivery must be verified on shipping builds. [Android Direct Boot](https://developer.android.com/privacy-and-security/direct-boot)
- A powered-off device cannot deliver an alarm. Force-stop cancels Android pending intents and blocks app components until the next launch. On launch Wupiko restores future alarms and expires missed one-time alarms. Manufacturer power policies can further affect delivery.

## Permissions and ringing

- Android 12–12L use `SCHEDULE_EXACT_ALARM` special access. Android 13+ uses `USE_EXACT_ALARM` for the app's primary alarm-clock function. The module checks actual scheduling access. [Android exact alarm permissions](https://developer.android.com/about/versions/14/changes/schedule-exact-alarms)
- Enabled alarms also require notifications, including the Alarms notification channel. If notification or exact access is revoked, reconciliation disables affected alarms and stops active rings. The receiver checks access again at delivery so users are never left with an audible alarm they cannot stop from a notification. After restoring access, re-enable desired alarms.
- Delivery starts a foreground service using the alarm permission exemption and the `systemExempted` type. The service plays the selected bundled sound with `USAGE_ALARM` and uses alarm-class vibration when selected. Alarm volume, sound routing, Do Not Disturb and system haptic policies remain under device control. [Foreground service types](https://developer.android.com/about/versions/14/changes/fgs-types-required)
- A high-importance notification contains **Stop Alarm** and a full-screen intent targeting a native activity that can appear over the lock screen. On Android 14+, Settings exposes full-screen special access. Android decides between lock-screen activity and notification presentation. Denying full-screen access still permits an ordinary alarm notification with Stop Alarm. Alarm labels can be visible on the lock screen, subject to system notification privacy settings. [Urgent notifications](https://developer.android.com/develop/ui/views/notifications/build-notification#urgent-message)
- Before Play distribution, complete declarations for exact alarms, full-screen intents and the foreground-service type in the app's Play Console. Eligibility and review depend on the alarm-clock use case. [Play Console requirements](https://support.google.com/googleplay/android-developer/answer/13392821)

## Native recurrence tests

After Expo prebuild, run `./gradlew :wupiko-alarm:testDebugUnitTest` from the generated Android directory. The tests execute the production Kotlin recurrence code across selected weekdays, exact-minute boundaries, spring gaps, autumn folds, time-zone changes and a 30-minute DST transition. Follow the [device checklist](device-checklist.md) to exercise delivery on hardware.

On an API 33+ emulator, run `./gradlew :wupiko-alarm:connectedDebugAndroidTest` to test native persistence, schedule edits, stale deliveries, enable/disable/delete and one-time versus weekly dismissal. The instrumentation suite registers real AlarmManager entries and calls the delivery boundary directly. A timed lock-screen test exercises actual OS delivery.

## Native validation on November 10, 2026

An API 35 ARM64 emulator ran a temporary APK containing the production scheduling, receiver, service, resources and ringing activity, with a small native entry point driving the alarm engine. Create, edit, disable, enable and delete were exercised. Two simultaneous alarms delivered over the lock screen after the app process was killed. The native UI showed the current time, active alarm label and a single **Stop Alarm** button. Stopping both removed the foreground service, disabled the one-time alarm and retained the next weekly occurrence.

A separate run scheduled alarms and rebooted the PIN-protected emulator. Android reported `RUNNING_LOCKED` and two restored exact AlarmManager entries. Before first unlock the ringing activity appeared, both stops worked, and the weekly entry remained registered. Revoking notification permission during another active alarm stopped the service and cleared the active alarms' enabled and ringing flags. These runs cover native alarm behavior. The [validation record](validation.md) tracks full application build and device results.

The complete arm64 Release APK subsequently passed the same one-time delivery flow on the API 35 emulator with Wi-Fi and mobile data disabled. The test went through onboarding, granted the system notification prompt, and set a named alarm with the native time picker and Ripple sound. AlarmManager registered the requested timestamp. With the app process killed and screen asleep, a new process opened the native alarm activity. **Stop Alarm** ended the foreground service. Reopening Wupiko showed the saved alarm switched off. [Ringing screen capture](screenshots/android-ringing.png)

The Release APK also passed a PIN-protected reboot test with a weekly alarm and Wupiko's Dark theme. Android restored the exact registration before first unlock. The named alarm opened over the lock screen in the selected theme while Android reported `RUNNING_LOCKED`. **Stop Alarm** ended the service, and AlarmManager retained the same time on the following Tuesday. [Pre-unlock ringing screen](screenshots/android-ringing-dark.png)

After unlocking, Wupiko showed the one-time alarm off and the weekly alarm on. The generated project's `:wupiko-alarm:testDebugUnitTest` and `:wupiko-alarm:connectedDebugAndroidTest` tasks passed all six JVM tests and both instrumented tests respectively.
