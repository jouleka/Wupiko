# iOS alarm behavior

Wupiko requires iOS 26 or later and an Expo development or standalone build. The Swift module schedules each alarm with AlarmKit after the user grants alarm authorization. The generated app target must have an iOS 26.0 deployment target and a nonempty `NSAlarmKitUsageDescription`. Expo Go does not contain this native module. [Apple’s scheduling sample](https://developer.apple.com/documentation/AlarmKit/scheduling-an-alarm-with-alarmkit)

On earlier iOS versions, UserNotifications can schedule calendar-triggered notifications. Their delivery and presentation follow notification settings. Wupiko sets its deployment target to 26.0 so every supported iPhone has AlarmKit. [Apple’s local notification guide](https://developer.apple.com/documentation/usernotifications/scheduling-a-notification-locally-from-your-app)

## Delivery and controls

AlarmKit owns the schedule, system alert, audio session, and dismissal when the app is suspended or closed. Wupiko supplies the title, tint, and bundled sound. Its alert configuration omits the secondary button, countdown duration, repeat intent, and timer presentation. iOS 26.0 supports a custom Stop Alarm button. iOS 26.1 and later choose the system stop control. A weekly alarm uses one relative schedule with its selected weekdays. A one-time alarm uses the same local-time schedule with recurrence set to never. [Alarm configuration](https://developer.apple.com/documentation/alarmkit/alarmmanager/alarmconfiguration/alarm(schedule:attributes:stopintent:secondaryintent:sound:)) · [System presentation](https://developer.apple.com/documentation/alarmkit/alarmpresentation/alert)

The three original PCM WAV files are copied into the main app bundle by CocoaPods. AlarmKit chooses the final on-device audio and haptic behavior. Its configuration does not expose per-alarm vibration. Test each chosen sound, silent mode, Focus, locked delivery, and reboot on a real phone and record the exact OS version. [Apple’s AlarmKit session](https://developer.apple.com/videos/play/wwdc2025/230/)

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
