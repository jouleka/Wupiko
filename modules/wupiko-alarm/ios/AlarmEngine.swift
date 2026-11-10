import ActivityKit
import AlarmKit
import Foundation
import SwiftUI

private struct WupikoMetadata: AlarmMetadata {}

// Actor reentrancy would allow an alarmUpdates event to reconcile away an in-
// flight edit while schedule() suspends. Hold this gate through the commit.
actor AlarmEngine {
  static let shared = AlarmEngine()
  private let catalog = AlarmCatalog()
  private let manager = AlarmManager.shared
  private var busy = false
  private var queue: [CheckedContinuation<Void, Never>] = []

  private func enter() async {
    if busy {
      await withCheckedContinuation { queue.append($0) }
    } else {
      busy = true
    }
  }

  private func leave() {
    if queue.isEmpty { busy = false }
    else { queue.removeFirst().resume() }
  }

  private var permission: String {
    switch manager.authorizationState {
    case .authorized: return "granted"
    case .notDetermined: return "undetermined"
    case .denied: return "denied"
    @unknown default: return "denied"
    }
  }

  func authorize() async throws {
    _ = try await manager.requestAuthorization()
  }

  private func schedule(_ alarm: StoredAlarm, id: UUID) async throws {
    guard Bundle.main.url(forResource: alarm.sound, withExtension: "wav") != nil
    else { throw AlarmInputError.missingSound }
    let text = alarm.label.trimmingCharacters(in: .whitespacesAndNewlines)
    let title: LocalizedStringResource = "\(text.isEmpty ? "Wupiko" : text)"
    let alert: AlarmPresentation.Alert
    if #available(iOS 26.1, *) {
      alert = .init(title: title)
    } else {
      alert = .init(title: title, stopButton: .init(text: "Stop Alarm", textColor: .white,
                                                    systemImageName: "stop.fill"))
    }
    let attributes = AlarmAttributes(presentation: .init(alert: alert), metadata: WupikoMetadata(),
                                     tintColor: Color(red: 166 / 255, green: 64 / 255, blue: 41 / 255))
    let weekdays: [Locale.Weekday] = [.monday, .tuesday, .wednesday, .thursday, .friday, .saturday, .sunday]
    let repeats: Alarm.Schedule.Relative.Recurrence = alarm.days.isEmpty
      ? .never : .weekly(alarm.days.map { weekdays[$0 - 1] })
    let time = Alarm.Schedule.Relative.Time(hour: alarm.hour, minute: alarm.minute)
    let relative = Alarm.Schedule.relative(.init(time: time, repeats: repeats))
    let config = AlarmManager.AlarmConfiguration.alarm(schedule: relative, attributes: attributes,
                                                        sound: .named(alarm.sound + ".wav"))
    _ = try await manager.schedule(id: id, configuration: config)
  }

  private func cancelUnowned(_ alarms: [Alarm], records: [StoredAlarm]) throws {
    let owned = Set(records.compactMap(\.systemID))
    for alarm in alarms where !owned.contains(alarm.id) {
      try manager.cancel(id: alarm.id)
    }
  }

  func state() async throws -> [String: Any] {
    await enter()
    defer { leave() }
    var records = try catalog.load()
    let authorization = permission
    let system = authorization == "granted" ? try manager.alarms : []
    let systemIDs = Set(system.map(\.id))
    var changed = false
    for i in records.indices {
      guard let id = records[i].systemID, !systemIDs.contains(id) else { continue }
      if authorization == "granted" && !records[i].days.isEmpty {
        // Recover a missing weekly schedule, including after a daemon reset.
        try await schedule(records[i], id: id)
      } else {
        // AlarmKit removes a completed one-shot. Never re-arm it from a stale snapshot.
        records[i].systemID = nil
        changed = true
      }
    }
    if changed { try catalog.write(records) }
    if authorization == "granted" { try cancelUnowned(system, records: records) }
    let ringing = Set(system.filter { $0.state == .alerting }.map(\.id))
    let now = Date()
    let rows = try records.map { try $0.serialized(ringing: $0.systemID.map(ringing.contains) ?? false, now: now) }
    let ids = records.filter { $0.systemID.map(ringing.contains) ?? false }.map { $0.id.uuidString.lowercased() }
    return ["alarms": rows, "permissions": ["alarm": authorization], "ringingIds": ids]
  }

  func save(_ record: StoredAlarm) async throws {
    await enter()
    defer { leave() }
    var records = try catalog.load()
    let authorized = permission == "granted"
    if record.systemID != nil && !authorized { throw AlarmInputError.permissionRequired }
    let system = authorized ? try manager.alarms : []
    // Remove any uncommitted schedule from a prior interrupted transaction.
    if authorized { try cancelUnowned(system, records: records) }
    if let id = record.systemID { try await schedule(record, id: id) }
    let old = records.first { $0.id == record.id }?.systemID
    if let i = records.firstIndex(where: { $0.id == record.id }) { records[i] = record }
    else { records.append(record) }
    do {
      try catalog.write(records)
    } catch {
      if let id = record.systemID { try manager.cancel(id: id) }
      throw error
    }
    if let old, system.contains(where: { $0.id == old }) { try manager.cancel(id: old) }
  }

  func delete(_ id: UUID) async throws {
    await enter()
    defer { leave() }
    var records = try catalog.load()
    records.removeAll { $0.id == id }
    try catalog.write(records)
    if permission == "granted" { try cancelUnowned(manager.alarms, records: records) }
  }

  func stop(_ id: UUID) async throws {
    await enter()
    defer { leave() }
    let records = try catalog.load()
    guard let record = records.first(where: { $0.id == id }), let systemID = record.systemID,
          try manager.alarms.contains(where: { $0.id == systemID && $0.state == .alerting })
    else { return }
    try manager.stop(id: systemID)
    // The daemon retains the weekly rule. state() checks for a missing rule
    // before returning the next occurrence and recognizes completed one-shots.
  }
}
