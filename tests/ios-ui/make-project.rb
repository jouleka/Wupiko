# xcodebuild needs an application target for UI tests. The XCTest itself opens
# the installed Wupiko by bundle ID, so it exercises the production binary.
require 'xcodeproj'

project = Xcodeproj::Project.new('Bridge.xcodeproj')
harness = project.new_target(:application, 'Harness', :ios, '26.0')
tests = project.new_target(:ui_test_bundle, 'BridgeUITests', :ios, '26.0')
tests.add_dependency(harness)
harness.add_file_references([project.main_group.new_file('Harness.swift')])
tests.add_file_references([project.main_group.new_file('AlarmBridgeUITests.swift')])

[harness, tests].each do |target|
  target.build_configurations.each do |config|
    settings = config.build_settings
    settings['GENERATE_INFOPLIST_FILE'] = 'YES'
    settings['SWIFT_VERSION'] = '5.0'
    settings['INFOPLIST_KEY_UIApplicationSceneManifest_Generation'] = 'YES'
    settings['INFOPLIST_KEY_UILaunchScreen_Generation'] = 'YES'
    settings['PRODUCT_BUNDLE_IDENTIFIER'] = target == harness ? 'app.wupiko.bridge-harness' : 'app.wupiko.bridge-tests'
    settings['TEST_TARGET_NAME'] = 'Harness' if target == tests
  end
end

scheme = Xcodeproj::XCScheme.new
scheme.configure_with_targets(harness, tests)
scheme.save_as(project.path, 'Bridge', true)
project.save
