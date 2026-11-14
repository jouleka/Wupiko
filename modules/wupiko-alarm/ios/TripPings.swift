import Foundation
import UserNotifications

/// Gentle local notifications for the morning find: the story is in, the bag
/// is ready to unpack, and a last call before Wupiko dozes off.
enum TripPings {
  private static var center: UNUserNotificationCenter { .current() }

  /// "granted", "denied" or "undetermined".
  static func status() async -> String {
    switch await center.notificationSettings().authorizationStatus {
    case .authorized, .provisional, .ephemeral: return "granted"
    case .notDetermined: return "undetermined"
    default: return "denied"
    }
  }

  static func request() async -> Bool {
    (try? await center.requestAuthorization(options: [.alert, .sound])) ?? false
  }

  static func schedule(id: String, at: Date, title: String, body: String) async throws {
    let content = UNMutableNotificationContent()
    content.title = title
    content.body = body
    content.sound = .default
    content.threadIdentifier = "wupiko-trip"
    let seconds = max(1, at.timeIntervalSinceNow)
    let trigger = UNTimeIntervalNotificationTrigger(timeInterval: seconds, repeats: false)
    try await center.add(UNNotificationRequest(identifier: id, content: content, trigger: trigger))
  }

  static func cancel(ids: [String]) {
    center.removePendingNotificationRequests(withIdentifiers: ids)
    center.removeDeliveredNotifications(withIdentifiers: ids)
  }
}
