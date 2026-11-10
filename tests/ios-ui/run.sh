#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 || ! "$1" =~ ^[[:xdigit:]]{8}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{12}$ ]]; then
  echo 'Usage: tests/ios-ui/run.sh <booted-simulator-UDID>' >&2
  exit 2
fi
simulator="$1"
source_dir="$(cd "$(dirname "$0")" && pwd)"
xcrun simctl get_app_container "$simulator" app.wupiko.alarm app >/dev/null
ruby -rxcodeproj -e ''

scratch="$(mktemp -d "${TMPDIR:-/tmp}/wupiko-bridge-test.XXXXXXXX")"
cleanup() {
  xcrun simctl uninstall "$simulator" app.wupiko.bridge-tests.xctrunner >/dev/null 2>&1 || true
  rm -rf "$scratch"
}
trap cleanup EXIT
cd "$scratch"
cp "$source_dir/AlarmBridgeUITests.swift" .
cat > Harness.swift <<'SWIFT'
import SwiftUI
@main struct Harness: App {
  var body: some Scene { WindowGroup { Color.clear } }
}
SWIFT
ruby "$source_dir/make-project.rb"
xcodebuild test -quiet -scheme Bridge -destination "id=$simulator" \
  -parallel-testing-enabled NO -derivedDataPath "$scratch/DerivedData"
echo 'Passed the recurring-alarm bridge regression.'
