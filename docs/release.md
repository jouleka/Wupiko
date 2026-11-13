# Store release

Version and build numbers live in `app.json` (`version`, `ios.buildNumber`, `android.versionCode`). Raise the build numbers for every upload. After changing app config, run `npx expo prebuild --clean`.

## Android (Google Play)

Create an upload key once and keep it, plus its passwords, out of the repository:

```sh
keytool -genkeypair -v -keystore ~/keys/wupiko-upload.jks -alias wupiko-upload -keyalg RSA -keysize 2048 -validity 10000
```

Add the key to `~/.gradle/gradle.properties`:

```properties
WUPIKO_UPLOAD_STORE_FILE=/Users/<you>/keys/wupiko-upload.jks
WUPIKO_UPLOAD_STORE_PASSWORD=...
WUPIKO_UPLOAD_KEY_ALIAS=wupiko-upload
WUPIKO_UPLOAD_KEY_PASSWORD=...
```

Build the bundle from the generated project:

```sh
cd android && ./gradlew bundleRelease
```

Upload `android/app/build/outputs/bundle/release/app-release.aab` and enroll in Play App Signing. `bundleRelease` refuses to run without the upload key. Release APKs without it remain debug-signed for QA only. The `release` source set removes `INTERNET`. Debug builds keep it for Metro.

Play Console declarations this build needs:

- **Exact alarms:** `USE_EXACT_ALARM`, core function is an alarm clock.
- **Full-screen intent:** `USE_FULL_SCREEN_INTENT`, alarm clock.
- **Foreground service:** `systemExempted`, plays the ringing alarm the user scheduled. Play may ask for a short video of an alarm ringing and being stopped.
- **Data safety:** no data collected or shared.
- **Privacy policy:** a public URL serving [privacy.md](privacy.md).

## iOS (App Store)

Open `ios/Wupiko.xcworkspace`, select the Wupiko target, choose your team under Signing & Capabilities, then Product → Archive with *Any iOS Device* selected and upload from the Organizer. `ITSAppUsesNonExemptEncryption` is already `false`.

Release builds run a `[Wupiko] Strip framework symbols` phase (from `plugins/ios-release.js`). It strips debug and local symbols from the prebuilt React Native, Hermes and Expo frameworks, just as Xcode already strips the app binary. This cuts the installed app from about 37 MB to 25 MB, and exported symbols and runtime behavior stay the same. If the phase is missing after `npx expo prebuild --clean`, run `pod install` again.

App Store Connect needs the privacy policy URL, a "Data Not Collected" privacy label, and screenshots. `supportsTablet` is `true`, so iPad screenshots are required too. In the review notes, explain that alarms deliberately ring again at +1, +3 and +6 minutes until the in-app wake-up ritual is finished, and that this is the app's core feature.

## Before submitting

Complete the [real-device checklist](device-checklist.md) on a Release build, including the wake-up follow-ups and ritual check-in, and record results in the [validation record](validation.md).
