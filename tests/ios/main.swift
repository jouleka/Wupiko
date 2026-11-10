import Foundation

let formatter = ISO8601DateFormatter()
func check(_ now: String, _ hour: Int, _ minute: Int, _ days: [Int],
           _ zone: String, _ expected: String, line: UInt = #line) {
  let next = AlarmOccurrence.next(hour: hour, minute: minute, days: days,
                                  after: formatter.date(from: now)!,
                                  timeZone: TimeZone(identifier: zone)!)
  precondition(next == formatter.date(from: expected),
               "Expected \(expected), received \(String(describing: next)) on line \(line)")
}
check("2026-03-08T05:00:00Z", 2, 30, [7], "America/New_York", "2026-03-08T07:30:00Z")
check("2026-11-01T04:00:00Z", 1, 30, [], "America/New_York", "2026-11-01T05:30:00Z")
check("2026-11-01T05:31:00Z", 1, 30, [7], "America/New_York", "2026-11-08T06:30:00Z")
check("2026-11-10T06:00:00Z", 7, 0, [], "Europe/Tirane", "2026-11-11T06:00:00Z")
check("2026-11-09T23:55:00Z", 0, 0, [2,4], "UTC", "2026-11-10T00:00:00Z")
check("2026-11-09T23:55:00Z", 0, 0, [2,4], "Asia/Tokyo", "2026-11-11T15:00:00Z")
check("2026-10-03T14:00:00Z", 2, 15, [], "Australia/Lord_Howe", "2026-10-03T15:45:00Z")
check("2026-04-04T13:00:00Z", 1, 45, [7], "Australia/Lord_Howe", "2026-04-04T14:45:00Z")
print("Swift recurrence checks passed.")
