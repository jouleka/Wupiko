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
