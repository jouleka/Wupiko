import Foundation

/// A local-time preview for the app. AlarmKit resolves the actual relative schedule.
enum AlarmOccurrence {
  static func next(hour: Int, minute: Int, days: [Int], after now: Date,
                   timeZone: TimeZone = .autoupdatingCurrent) -> Date? {
    var calendar = Calendar(identifier: .gregorian)
    calendar.timeZone = timeZone
    let today = calendar.startOfDay(for: now)
    for offset in 0...7 {
      guard let date = calendar.date(byAdding: .day, value: offset, to: today) else { continue }
      let isoDay = (calendar.component(.weekday, from: date) + 5) % 7 + 1
      guard days.isEmpty || days.contains(isoDay) else { continue }
      // Compose this civil date directly. A time-only nextDate search can
      // skip an entire day when the DST gap is less than one hour.
      var components = calendar.dateComponents([.year, .month, .day], from: date)
      components.hour = hour
      components.minute = minute
      components.second = 0
      if let next = calendar.date(from: components),
         calendar.isDate(next, inSameDayAs: date), next > now {
        return next
      }
    }
    return nil
  }
}

/// Wake-up check: one-off follow-up alarms that ring after an occurrence
/// unless the user checks in inside the app. Dismissing the system alert
/// cannot cancel them, so a half-asleep tap on Stop is not enough.
enum BackupPlan {
  struct Slot: Equatable {
    let occurrence: Date
    let at: Date
  }

  /// Minutes after the alarm when Wupiko rings again.
  static let offsets = [1, 3, 6]
  /// Upcoming occurrences armed ahead of time. The app tops this up whenever
  /// it runs, so a user who never opens it still gets this many mornings.
  static let horizon = 3

  static func upcoming(hour: Int, minute: Int, days: [Int], after now: Date,
                       timeZone: TimeZone = .autoupdatingCurrent) -> [Slot] {
    var slots: [Slot] = []
    var cursor = now
    for _ in 0..<(days.isEmpty ? 1 : horizon) {
      guard let next = AlarmOccurrence.next(hour: hour, minute: minute, days: days,
                                            after: cursor, timeZone: timeZone) else { break }
      slots += offsets.map { Slot(occurrence: next, at: next.addingTimeInterval(TimeInterval($0 * 60))) }
      cursor = next
    }
    return slots
  }
}

/// How each morning went, for the island. Pure so it can be tested off-device.
enum MorningOutcome: String, Codable {
  case onTime, late, missed

  /// Outcomes for a check-in now: on time if no follow-up has rung yet.
  static func checkIn(pending: [BackupPlan.Slot], now: Date) -> [(occurrence: Date, outcome: MorningOutcome)] {
    let past = pending.filter { $0.occurrence <= now }
    return Set(past.map(\.occurrence)).sorted().map { occurrence in
      let rang = past.contains { $0.occurrence == occurrence && $0.at <= now }
      return (occurrence, rang ? .late : .onTime)
    }
  }

  /// Occurrences that rang and whose follow-ups are all gone without a check-in.
  static func missed(before: [BackupPlan.Slot], after: [BackupPlan.Slot], now: Date) -> [Date] {
    let rang = Set(before.filter { $0.occurrence <= now }.map(\.occurrence))
    let open = Set(after.map(\.occurrence))
    return rang.subtracting(open).sorted()
  }
}
