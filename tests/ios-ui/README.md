# iOS alarm bridge regression

Install a bundled Wupiko release on a booted, English-language iOS 26+ test simulator and allow alarm access. The test can complete fresh onboarding and grant the first system prompt. A simulator with a previously denied permission needs access restored in Settings. Use Xcode and Ruby with the `xcodeproj` gem installed.

```sh
xcrun simctl list devices booted
tests/ios-ui/run.sh <simulator-UDID>
```

The test types a unique alarm name, chooses Monday and Thursday in the actual React Native editor, saves through the Swift bridge, and verifies the native row and its ID after terminating and relaunching the app. It deletes that specific alarm. This catches the original dictionary-conversion failure that pure Swift recurrence tests could not reproduce. The runner generates its Xcode project and build results in a temporary directory and removes them afterward.
