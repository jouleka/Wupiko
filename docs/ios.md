# iOS alarm behavior

Wupiko requires iOS 26 or later and an Expo development or standalone build. The Swift module schedules each alarm with AlarmKit after the user grants alarm authorization. The generated app target must have an iOS 26.0 deployment target and a nonempty `NSAlarmKitUsageDescription`. Expo Go does not contain this native module. [Apple’s scheduling sample](https://developer.apple.com/documentation/AlarmKit/scheduling-an-alarm-with-alarmkit)

On earlier iOS versions, UserNotifications can schedule calendar-triggered notifications. Their delivery and presentation follow notification settings. Wupiko sets its deployment target to 26.0 so every supported iPhone has AlarmKit. [Apple’s local notification guide](https://developer.apple.com/documentation/usernotifications/scheduling-a-notification-locally-from-your-app)

## Delivery and controls

AlarmKit owns the schedule, system alert, audio session, and dismissal when the app is suspended or closed. Wupiko supplies the title, tint, and bundled sound. Its alert configuration omits the secondary button, countdown duration, repeat intent, and timer presentation. iOS 26.0 supports a custom Stop Alarm button. iOS 26.1 and later choose the system stop control. A weekly alarm uses one relative schedule with its selected weekdays. A one-time alarm uses the same local-time schedule with recurrence set to never. [Alarm configuration](https://developer.apple.com/documentation/alarmkit/alarmmanager/alarmconfiguration/alarm(schedule:attributes:stopintent:secondaryintent:sound:)) · [System presentation](https://developer.apple.com/documentation/alarmkit/alarmpresentation/alert)

The three original PCM WAV files are copied into the main app bundle by CocoaPods. AlarmKit chooses the final on-device audio and haptic behavior. Its configuration does not expose per-alarm vibration. Test each chosen sound, silent mode, Focus, locked delivery, and reboot on a real phone and record the exact OS version. [Apple’s AlarmKit session](https://developer.apple.com/videos/play/wwdc2025/230/)

## Wake-up check

Wupiko has no snooze, and the wake-up check is part of every alarm, with no setting to turn it off. iOS lets anyone end an AlarmKit alert from the system UI or the side button, and the app is usually not running at that moment, so Wupiko arms the consequence in advance instead of reacting to dismissal. For each enabled alarm the engine registers one-off `fixed` AlarmKit follow-ups at +1, +3 and +6 minutes for the next three occurrences (one for a one-time alarm). Stopping an alert never cancels them. Only `checkIn`, called from the in-app boop ritual, cancels the follow-ups for occurrences that already rang. The short first gap leaves time to open the app and boop Wupiko, but no time to nap.

Because the system alert is all a half-asleep user sees, its title carries the instruction ("… · Then open Wupiko to check in"), and follow-ups say "You dozed off! Open Wupiko and boop it awake". In the app, Stop reads "Stop & wake Wupiko" and leads straight to the check-in screen, which shows a live countdown to the next ring.

Every `state()` call tops up the horizon, drops follow-ups that fired, and replaces future follow-ups whose time no longer matches the schedule after edits or time-zone changes. Follow-up IDs are part of the record's owned IDs, so unowned-registration cleanup leaves them alone. `state()` reports `checkInIds` (an occurrence has rung and its follow-ups are still registered) and each alarm's `nagAt`.

A determined user can still turn the alarm off in the app or delete it. The check targets the half-asleep reflex, not intent. The Android engine does not implement follow-ups yet, so Android alarms ring once.

## Wake-up rituals and streak

Checking in means finishing a short ritual, picked per alarm per day from four: chase Wupiko as it rolls around, swipe open the curtains, drag the sun over the hills, or pop sleepy bubbles. The choice is stable within a day and changes the next, so a half-asleep thumb can't learn one fixed motion. With VoiceOver on, the chase ritual is used because its targets are plain buttons. Finishing it checks in automatically.

The engine keeps an append-only morning log (`wupiko-mornings-v1.json`, latest 500 entries). A check-in before any follow-up rang is `onTime`, after one is `late`. An occurrence whose follow-ups all fired, or that was edited, switched off or deleted while still waiting, is `missed`. The first outcome for an occurrence wins. `state()` returns the log as `mornings` and `followUpIds` for alarms currently ringing because of a follow-up.

The app turns the log into a streak (`src/streak.ts`): consecutive alarm days without a miss, where a day is only as good as its worst alarm and days without alarms don't count. On-time mornings plant flowers in the home sky's garden, late ones buds, misses a wilted stem. Streaks of 3, 7, 14 and 30 unlock outfits for Wupiko (sprout, flower crown, sunnies, golden crown), which are kept forever and chosen in Settings. After a miss, Wupiko is sad for a day. Android does not record mornings yet, so the streak UI is iOS-only.

## Catalog and reconciliation

An atomic JSON file in Application Support retains alarm labels, sounds, selected days, and disabled entries. A serialized Swift engine coordinates changes with AlarmKit. Editing schedules the replacement before committing it to disk and retiring the previous system ID. The next reconciliation cancels unowned registrations left by an interruption. A rejected replacement leaves the previously scheduled alarm available. AlarmKit owns delivery throughout this process.

The native bridge observes the daemon, authorization changes, and significant time changes. State reads compare the catalog against the current system registrations. Completed one-time alarms become disabled. Missing enabled weekly rules are registered again. Revoked permission disables the stored entries the next time Wupiko reconciles. Re-enable them explicitly after granting permission again. [AlarmManager alarms](https://developer.apple.com/documentation/alarmkit/alarmmanager/alarms)

The displayed next occurrence uses the current time zone, moves through a spring gap by its duration, and picks the first occurrence of a repeated autumn time. Apple's relative schedule resolves the actual firing time, including travel and daylight-saving transitions. The API does not supply a resolved timestamp for its next relative occurrence. [Relative schedules](https://developer.apple.com/documentation/alarmkit/alarm/schedule-swift.enum/relative)

Run the Foundation recurrence checks on a Mac from the repository root:

```sh
swiftc modules/wupiko-alarm/ios/AlarmOccurrence.swift tests/ios/main.swift -o /tmp/wupiko-ios-recurrence
/tmp/wupiko-ios-recurrence
```

## Verified on November 10, 2026

An XCTest harness ran the production Swift engine on the iPhone 17 simulator with iOS 26.5 (23F77). It granted AlarmKit authorization, scheduled a one-shot, terminated the process, and observed the daemon reporting the alarm as alerting on relaunch. Calling the native Stop method cleared the ringing state and disabled the entry. The test edited the same entry into a seven-day weekly alarm and repeated the process. After Stop, its registration stayed enabled with the following day's occurrence. Deleting it left an empty catalog. All assertions in this lifecycle run passed.

During a separate attempt to tap the system Stop button, the simulator's SpringBoard crashed inside ToneLibrary while starting audio with an unrecognized `AVAudioSession.reporterID` selector. The daemon still entered its alerting state. System presentation, audible playback, and tapping Stop on the Lock Screen need physical-device verification.
