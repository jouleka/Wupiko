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
  private let mornings = MorningLog()
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
    let text = alarm.label.trimmingCharacters(in: .whitespacesAndNewlines)
    let weekdays: [Locale.Weekday] = [.monday, .tuesday, .wednesday, .thursday, .friday, .saturday, .sunday]
    let repeats: Alarm.Schedule.Relative.Recurrence = alarm.days.isEmpty
      ? .never : .weekly(alarm.days.map { weekdays[$0 - 1] })
    let time = Alarm.Schedule.Relative.Time(hour: alarm.hour, minute: alarm.minute)
    try await register(id: id, schedule: .relative(.init(time: time, repeats: repeats)),
                       title: "\(text.isEmpty ? "Rise & shine" : text) · Then open Wupiko to check in", sound: alarm.sound)
  }

  private func scheduleBackup(_ alarm: StoredAlarm, id: UUID, at date: Date) async throws {
    try await register(id: id, schedule: .fixed(date), title: "You dozed off! Open Wupiko and boop it awake",
                       sound: alarm.sound)
  }

  private func register(id: UUID, schedule: Alarm.Schedule, title: LocalizedStringResource, sound: String) async throws {
    guard Bundle.main.url(forResource: sound, withExtension: "wav") != nil
    else { throw AlarmInputError.missingSound }
    let alert: AlarmPresentation.Alert
    if #available(iOS 26.1, *) {
      alert = .init(title: title)
    } else {
      alert = .init(title: title, stopButton: .init(text: "Stop Alarm", textColor: .white,
                                                    systemImageName: "stop.fill"))
    }
    let attributes = AlarmAttributes(presentation: .init(alert: alert), metadata: WupikoMetadata(),
                                     tintColor: Color(red: 255 / 255, green: 107 / 255, blue: 74 / 255))
    // Stopping the alarm opens Wupiko so the wake-up check-in is waiting.
    let config = AlarmManager.AlarmConfiguration.alarm(schedule: schedule, attributes: attributes,
                                                        stopIntent: WupikoAlarmIntents.stopAndOpen?(id),
                                                        sound: .named(sound + ".wav"))
    _ = try await manager.schedule(id: id, configuration: config)
  }

  private func cancelUnowned(_ alarms: [Alarm], records: [StoredAlarm]) throws {
    let owned = Set(records.flatMap(\.ownedIDs))
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
    if authorization == "granted" { try cancelUnowned(system, records: records) }
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
    let now = Date()
    if authorization == "granted" {
      let live = Set(system.map(\.id))
      var missed: [Morning] = []
      for i in records.indices {
        let before = (records[i].backups ?? []).map(\.slot)
        if try await reconcileBackups(&records[i], live: live, now: now) { changed = true }
        let after = (records[i].backups ?? []).map(\.slot)
        missed += MorningOutcome.missed(before: before, after: after, now: now)
          .map { Morning(alarm: records[i].id, occurrence: $0, outcome: .missed) }
      }
      try mornings.record(missed)
    }
    if changed { try catalog.write(records) }
    let ringing = Set(system.filter { $0.state == .alerting }.map(\.id))
    let present = Set(authorization == "granted" ? try manager.alarms.map(\.id) : [])
    var rows: [[String: Any]] = []
    var ringingIDs: [String] = []
    var checkInIDs: [String] = []
    var followUpIDs: [String] = []
    for record in records {
      let isRinging = record.ownedIDs.contains(where: ringing.contains)
      // Follow-ups for an occurrence that already rang mean Wupiko is waiting for a check-in.
      let pending = (record.backups ?? []).filter { $0.occurrence <= now && present.contains($0.id) }
      let nagAt = pending.map(\.at).filter { $0 > now }.min()
      rows.append(try record.serialized(ringing: record.systemID.map(ringing.contains) ?? false, now: now, nagAt: nagAt))
      if isRinging { ringingIDs.append(record.id.uuidString.lowercased()) }
      if (record.backups ?? []).contains(where: { ringing.contains($0.id) }) { followUpIDs.append(record.id.uuidString.lowercased()) }
      if !pending.isEmpty { checkInIDs.append(record.id.uuidString.lowercased()) }
    }
    let history = try mornings.load().map { entry -> [String: Any] in
      ["alarmId": entry.alarm.uuidString.lowercased(), "at": Int64(entry.occurrence.timeIntervalSince1970 * 1000),
       "outcome": entry.outcome.rawValue]
    }
    return ["alarms": rows, "permissions": ["alarm": authorization], "ringingIds": ringingIDs,
            "checkInIds": checkInIDs, "followUpIds": followUpIDs, "mornings": history]
  }

  /// Keeps follow-ups armed for the next occurrences. Follow-ups for an
  /// occurrence that already rang stay until they fire or the user checks in.
  private func reconcileBackups(_ record: inout StoredAlarm, live: Set<UUID>, now: Date) async throws -> Bool {
    let original = record.backups ?? []
    var backups = original.filter { live.contains($0.id) || $0.at > now }
    // The wake-up check is part of every alarm. There is deliberately no opt-out.
    let wanted = record.systemID != nil
      ? BackupPlan.upcoming(hour: record.hour, minute: record.minute, days: record.days, after: now) : []
    let matches = { (b: BackupAlarm, slot: BackupPlan.Slot) in b.occurrence == slot.occurrence && b.at == slot.at }
    for backup in backups where backup.occurrence > now
      && (!wanted.contains { matches(backup, $0) } || !live.contains(backup.id)) {
      if live.contains(backup.id) { try manager.cancel(id: backup.id) }
      backups.removeAll { $0.id == backup.id }
    }
    for slot in wanted where !backups.contains(where: { matches($0, slot) }) {
      let id = UUID()
      try await scheduleBackup(record, id: id, at: slot.at)
      backups.append(BackupAlarm(id: id, occurrence: slot.occurrence, at: slot.at))
    }
    record.backups = backups
    return backups != original
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
    let previous = records.first { $0.id == record.id }?.backups ?? []
    let live = Set(system.map(\.id))
    let escaped = Set(previous.filter { $0.occurrence <= Date() && live.contains($0.id) }.map(\.occurrence))
    if let i = records.firstIndex(where: { $0.id == record.id }) { records[i] = record }
    else { records.append(record) }
    do {
      try catalog.write(records)
    } catch {
      if let id = record.systemID { try manager.cancel(id: id) }
      throw error
    }
    if let old, system.contains(where: { $0.id == old }) { try manager.cancel(id: old) }
    // The next state() arms follow-ups for the edited schedule.
    for backup in previous where system.contains(where: { $0.id == backup.id }) { try manager.cancel(id: backup.id) }
    // Editing or switching off an alarm that is still waiting for a check-in is not a way out.
    try mornings.record(escaped.sorted().map { Morning(alarm: record.id, occurrence: $0, outcome: .missed) })
  }

  func delete(_ id: UUID) async throws {
    await enter()
    defer { leave() }
    var records = try catalog.load()
    let pending = records.first { $0.id == id }?.backups ?? []
    records.removeAll { $0.id == id }
    try catalog.write(records)
    if permission == "granted" {
      let live = Set(try manager.alarms.map(\.id))
      let escaped = Set(pending.filter { $0.occurrence <= Date() && live.contains($0.id) }.map(\.occurrence))
      try mornings.record(escaped.sorted().map { Morning(alarm: id, occurrence: $0, outcome: .missed) })
    }
    if permission == "granted" { try cancelUnowned(manager.alarms, records: records) }
  }

  func stop(_ id: UUID) async throws {
    await enter()
    defer { leave() }
    let records = try catalog.load()
    guard let record = records.first(where: { $0.id == id }) else { return }
    let owned = Set(record.ownedIDs)
    for alarm in try manager.alarms where owned.contains(alarm.id) && alarm.state == .alerting {
      try manager.stop(id: alarm.id)
    }
    // The daemon retains the weekly rule. state() checks for a missing rule
    // before returning the next occurrence and recognizes completed one-shots.
    // Stopping never cancels follow-ups; only checkIn does.
  }

  /// The user proved they are awake: silence anything ringing and cancel the
  /// remaining follow-ups for occurrences that already rang.
  func checkIn(_ id: UUID) async throws {
    await enter()
    defer { leave() }
    var records = try catalog.load()
    guard let i = records.firstIndex(where: { $0.id == id }) else { return }
    let now = Date()
    let system = try manager.alarms
    let owned = Set(records[i].ownedIDs)
    for alarm in system where owned.contains(alarm.id) && alarm.state == .alerting { try manager.stop(id: alarm.id) }
    let done = (records[i].backups ?? []).filter { $0.occurrence <= now }
    let live = Set(system.map(\.id))
    // Only occurrences still waiting (a follow-up armed) can be checked in.
    let waiting = done.filter { live.contains($0.id) }
    let open = Set(waiting.map(\.occurrence))
    let outcomes = MorningOutcome.checkIn(pending: done.filter { open.contains($0.occurrence) }.map(\.slot), now: now)
    for backup in done where system.contains(where: { $0.id == backup.id }) { try manager.cancel(id: backup.id) }
    records[i].backups = (records[i].backups ?? []).filter { $0.occurrence > now }
    try catalog.write(records)
    try mornings.record(outcomes.map { Morning(alarm: id, occurrence: $0.occurrence, outcome: $0.outcome) })
  }
}
