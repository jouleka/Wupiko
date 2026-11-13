// Release builds: strip debug and local symbols from the embedded frameworks.
//
// Xcode strips the app's own binary when archiving, but the prebuilt React Native,
// Hermes and Expo frameworks are copied in by CocoaPods with their full symbol
// tables, which is roughly half of their size. Stripping them the same way
// (`strip -x -S`, as STRIP_STYLE = non-global does) keeps every exported symbol,
// so nothing changes at runtime. Crash symbolication uses the archive's dSYMs.
//
// The phase must run after "[CP] Embed Pods Frameworks", which CocoaPods appends
// during `pod install`, so it is added from a Podfile post_integrate hook.
const { withPodfile } = require('expo/config-plugins');

const MARKER = '# wupiko-strip-frameworks';

const hook = `
${MARKER}
post_integrate do |installer|
  project = Xcodeproj::Project.open(installer.aggregate_targets.first.user_project_path)
  target = project.targets.find { |t| t.name == 'Wupiko' }
  name = '[Wupiko] Strip framework symbols'
  phase = target.shell_script_build_phases.find { |p| p.name == name } || target.new_shell_script_build_phase(name)
  target.build_phases.delete(phase)
  target.build_phases << phase
  phase.always_out_of_date = '1'
  phase.shell_script = <<~'SH'
    [ "$CONFIGURATION" = "Release" ] || exit 0
    dir="$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH"
    [ -d "$dir" ] || exit 0
    for fw in "$dir"/*.framework; do
      bin="$fw/$(/usr/libexec/PlistBuddy -c 'Print CFBundleExecutable' "$fw/Info.plist")"
      before=$(stat -f%z "$bin")
      xcrun strip -x -S "$bin" 2>/dev/null || { echo "error: could not strip $bin"; exit 1; }
      [ "$(stat -f%z "$bin")" = "$before" ] && continue
      if [ "$CODE_SIGNING_ALLOWED" = "YES" ] && [ -n "$EXPANDED_CODE_SIGN_IDENTITY" ]; then
        codesign --force --sign "$EXPANDED_CODE_SIGN_IDENTITY" --preserve-metadata=identifier,entitlements,flags --timestamp=none "$fw"
      fi
    done
  SH
  project.save
end
`;

module.exports = function withWupikoIosRelease(config) {
  return withPodfile(config, (config) => {
    if (!config.modResults.contents.includes(MARKER)) {
      config.modResults.contents += hook;
    }
    return config;
  });
};
