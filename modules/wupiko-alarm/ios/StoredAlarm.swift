import Foundation

enum AlarmInputError: LocalizedError {
  case invalidInput
  case permissionRequired
  case missingSound
  case recurrenceUnavailable

  var errorDescription: String? {
    switch self {
    case .invalidInput: return "Check the alarm time, weekdays, and sound."
    case .permissionRequired: return "Allow alarms in Settings to turn on this alarm."
    case .missingSound: return "This alarm sound is missing from the installed app."
    case .recurrenceUnavailable: return "The next alarm time could not be calculated."
    }
  }
}

/// A one-off follow-up alarm registered with AlarmKit for one occurrence.
struct BackupAlarm: Codable, Equatable {
  let id: UUID
  let occurrence: Date
  let at: Date
}

struct StoredAlarm: Codable {
  let id: UUID
  let hour: Int
  let minute: Int
  let days: [Int]
  let label: String
  let sound: String
  let vibrate: Bool
  // Optional so catalogs written before kinds existed decode as wake-ups.
  let kind: String?
  /// A nudge is a plain reminder: Stop ends it, with no follow-ups or check-in.
  var isNudge: Bool { kind == "nudge" }
  // App identity survives edits. A fresh daemon ID lets an edit fail without
  // cancelling the user's working alarm. Disabled alarms have a nil systemID.
  var systemID: UUID?
  // Optional so catalogs written before the wake-up check still decode.
  var backups: [BackupAlarm]?
  var ownedIDs: [UUID] { (systemID.map { [$0] } ?? []) + (backups ?? []).map(\.id) }

  init(id rawID: String, hour: Int, minute: Int, days: [Int], label: String,
       sound: String, vibrate: Bool, enabled: Bool, kind: String) throws {
    guard let id = UUID(uuidString: rawID),
          (0..<24).contains(hour), (0..<60).contains(minute),
          days.allSatisfy((1...7).contains),
          ["daybreak", "ripple", "chime"].contains(sound),
          ["wake", "nudge"].contains(kind) else { throw AlarmInputError.invalidInput }
    self.id = id
    self.hour = hour
    self.minute = minute
    self.days = Set(days).sorted()
    self.label = label
    self.sound = sound
    self.vibrate = vibrate
    self.kind = kind
    self.systemID = enabled ? UUID() : nil
    self.backups = []
  }

  func serialized(ringing: Bool, now: Date, nagAt: Date?) throws -> [String: Any] {
    var result: [String: Any] = [
      "id": id.uuidString.lowercased(), "hour": hour, "minute": minute, "days": days,
      "label": label, "sound": sound, "vibrate": vibrate, "kind": kind ?? "wake", "enabled": systemID != nil, "nextAt": NSNull(),
      "nagAt": nagAt.map { Int64($0.timeIntervalSince1970 * 1000) } ?? NSNull()
    ]
    if systemID != nil && !(ringing && days.isEmpty) {
      guard let next = AlarmOccurrence.next(hour: hour, minute: minute, days: days, after: now)
      else { throw AlarmInputError.recurrenceUnavailable }
      result["nextAt"] = Int64(next.timeIntervalSince1970 * 1000)
    }
    return result
  }
}

struct AlarmCatalog {
  private func fileURL() throws -> URL {
    let directory = try FileManager.default.url(for: .applicationSupportDirectory,
                                               in: .userDomainMask, appropriateFor: nil, create: true)
    return directory.appendingPathComponent("wupiko-alarm-catalog-v1.json")
  }

  func load() throws -> [StoredAlarm] {
    let url = try fileURL()
    do {
      return try JSONDecoder().decode([StoredAlarm].self, from: Data(contentsOf: url))
    } catch CocoaError.fileReadNoSuchFile {
      return []
    }
  }

  func write(_ alarms: [StoredAlarm]) throws {
    let data = try JSONEncoder().encode(alarms)
    try data.write(to: fileURL(), options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
  }
}

struct Morning: Codable {
  let alarm: UUID
  let occurrence: Date
  let outcome: MorningOutcome
}

/// Append-only record of how each alarm occurrence ended, for the streak.
struct MorningLog {
  private static let limit = 500

  private func fileURL() throws -> URL {
    let directory = try FileManager.default.url(for: .applicationSupportDirectory,
                                               in: .userDomainMask, appropriateFor: nil, create: true)
    return directory.appendingPathComponent("wupiko-mornings-v1.json")
  }

  func load() throws -> [Morning] {
    do {
      return try JSONDecoder().decode([Morning].self, from: Data(contentsOf: fileURL()))
    } catch CocoaError.fileReadNoSuchFile {
      return []
    }
  }

  /// The first outcome recorded for an occurrence wins.
  func record(_ entries: [Morning]) throws {
    guard !entries.isEmpty else { return }
    var log = try load()
    for entry in entries where !log.contains(where: { $0.alarm == entry.alarm && $0.occurrence == entry.occurrence }) {
      log.append(entry)
    }
    let data = try JSONEncoder().encode(Array(log.suffix(Self.limit)))
    try data.write(to: fileURL(), options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
  }
}

extension BackupAlarm {
  var slot: BackupPlan.Slot { BackupPlan.Slot(occurrence: occurrence, at: at) }
}
