Pod::Spec.new do |s|
  s.name = 'WupikoAlarm'
  s.version = '1.0.0'
  s.summary = 'Wupiko native alarm scheduling'
  s.description = 'Schedules local-time alarms with Apple AlarmKit.'
  s.author = 'Wupiko'
  s.homepage = 'https://github.com/jouleka/Wupiko'
  s.source = { :git => 'https://github.com/jouleka/Wupiko.git' }
  s.license = { :type => 'Proprietary' }
  s.platform = :ios, '26.0'
  s.swift_version = '5.9'
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '*.swift'
  s.resources = 'Sounds/*.wav'
  s.frameworks = 'AlarmKit', 'ActivityKit', 'AppIntents', 'AVFoundation', 'SwiftUI'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
end
