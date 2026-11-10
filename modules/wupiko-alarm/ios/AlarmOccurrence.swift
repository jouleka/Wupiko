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
