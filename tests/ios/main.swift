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

let morning = formatter.date(from: "2026-11-11T05:00:00Z")!
let utc = TimeZone(identifier: "UTC")!
let once = BackupPlan.upcoming(hour: 7, minute: 0, days: [], after: morning, timeZone: utc)
precondition(once.map(\.at) == ["07:01", "07:03", "07:06"].map { formatter.date(from: "2026-11-11T\($0):00Z")! },
             "One-time alarm arms three follow-ups for its single occurrence")
let weekly = BackupPlan.upcoming(hour: 7, minute: 0, days: [1, 3], after: morning, timeZone: utc)
precondition(Set(weekly.map(\.occurrence)) == Set(["2026-11-11", "2026-11-16", "2026-11-18"].map { formatter.date(from: "\($0)T07:00:00Z")! }),
             "Weekly alarm arms the next three occurrences")
precondition(weekly.count == 9 && weekly.allSatisfy { $0.at > $0.occurrence })

let seven = formatter.date(from: "2026-11-11T07:00:00Z")!
let slots = BackupPlan.upcoming(hour: 7, minute: 0, days: [], after: morning, timeZone: utc)
let early = MorningOutcome.checkIn(pending: slots, now: seven.addingTimeInterval(30))
precondition(early.count == 1 && early[0].outcome == .onTime, "Checking in before the first follow-up is on time")
let tardy = MorningOutcome.checkIn(pending: slots, now: seven.addingTimeInterval(200))
precondition(tardy[0].outcome == .late, "Checking in after a follow-up rang is late")
precondition(MorningOutcome.checkIn(pending: slots, now: morning).isEmpty, "Nothing to check in before the alarm")
precondition(MorningOutcome.missed(before: slots, after: [], now: seven.addingTimeInterval(400)) == [seven],
             "Every follow-up gone without a check-in is a missed morning")
precondition(MorningOutcome.missed(before: slots, after: Array(slots.suffix(1)), now: seven.addingTimeInterval(200)).isEmpty,
             "A morning with a follow-up still armed is not missed yet")
precondition(MorningOutcome.missed(before: slots, after: [], now: morning).isEmpty, "Future occurrences are never missed")
print("Swift recurrence checks passed.")
