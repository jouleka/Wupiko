# Validation record

Verified on November 10, 2026 with Expo SDK 58, React Native 0.88.1 and Xcode 27.2.

| Environment | Evidence |
|---|---|
| Clean checkout | Installed dependencies with `npm ci`, then ran TypeScript, ESLint and the state tests successfully. |
| JavaScript | Six store tests cover edit, enable, disable, delete, failed mutations, persisted preferences, immediate Stop, initial-load retry, and foreground reconciliation. Both production Metro bundles exported to Hermes bytecode. Expo's dependency version check passed. |
| Swift | Eight assertions on the production recurrence function passed, including spring gaps, fall folds, a half-hour DST transition, selected weekdays, and time zones. |
| Kotlin | Six JUnit tests on the production recurrence function passed. They cover one-shot rollover, selected weekdays, exact-minute boundaries, full- and half-hour DST transitions, and time zones. |
| iOS native integration | An XCTest host linked the production Swift engine on an iPhone 17 simulator running iOS 26.5. The daemon registered and fired both one-time and weekly alarms after the host was terminated. Relaunch exposed the ringing IDs. Native Stop disabled the one-shot and preserved the weekly schedule. |
| Android native integration | On an Android 15 emulator, a native test host registered simultaneous one-time and weekly alarms. After process termination and screen lock the receiver started the ringing activity. Stop advanced to the other alarm, then ended the service. The one-shot was disabled and the weekly alarm retained its next occurrence. |

On the iOS simulator, SpringBoard crashed in ToneLibrary during alarm sound playback. The test confirmed AlarmKit's alerting state and the app's native Stop command. Physical lock-screen controls, speaker output, Focus, silent mode, reboot, battery policies and vendor-specific variations require the [real-device checklist](device-checklist.md).
