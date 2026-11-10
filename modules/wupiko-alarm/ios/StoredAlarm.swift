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

struct StoredAlarm: Codable {
  let id: UUID
  let hour: Int
  let minute: Int
  let days: [Int]
  let label: String
  let sound: String
  let vibrate: Bool
  // App identity survives edits. A fresh daemon ID lets an edit fail without
  // cancelling the user's working alarm. Disabled alarms have a nil systemID.
  var systemID: UUID?

  init(id rawID: String, hour: Int, minute: Int, days: [Int], label: String,
       sound: String, vibrate: Bool, enabled: Bool) throws {
    guard let id = UUID(uuidString: rawID),
          (0..<24).contains(hour), (0..<60).contains(minute),
          days.allSatisfy((1...7).contains),
          ["daybreak", "ripple", "chime"].contains(sound) else { throw AlarmInputError.invalidInput }
    self.id = id
    self.hour = hour
    self.minute = minute
    self.days = Set(days).sorted()
    self.label = label
    self.sound = sound
    self.vibrate = vibrate
    self.systemID = enabled ? UUID() : nil
  }

  func serialized(ringing: Bool, now: Date) throws -> [String: Any] {
    var result: [String: Any] = [
      "id": id.uuidString.lowercased(), "hour": hour, "minute": minute, "days": days,
      "label": label, "sound": sound, "vibrate": vibrate, "enabled": systemID != nil, "nextAt": NSNull()
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
