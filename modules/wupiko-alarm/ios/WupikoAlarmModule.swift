import AlarmKit
import ExpoModulesCore
import UIKit

private struct AlarmInput: Record {
  @Field(.required) var id: String = ""
  @Field(.required) var hour: Int = 0
  @Field(.required) var minute: Int = 0
  @Field(.required) var days: [Int] = []
  @Field(.required) var label: String = ""
  @Field(.required) var sound: String = ""
  @Field(.required) var vibrate: Bool = true
  @Field(.required) var enabled: Bool = true
  @Field var kind: String = "wake"

  func storedAlarm() throws -> StoredAlarm {
    try StoredAlarm(id: id, hour: hour, minute: minute, days: days, label: label,
                    sound: sound, vibrate: vibrate, enabled: enabled, kind: kind)
  }
}

public final class WupikoAlarmModule: Module {
  private var observations: [Task<Void, Never>] = []

  public func definition() -> ModuleDefinition {
    Name("WupikoAlarm")
    Events("onAlarmChange")

    AsyncFunction("getState") { () async throws -> [String: Any] in
      try await AlarmEngine.shared.state()
    }
    AsyncFunction("requestPermission") { () async throws in
      try await AlarmEngine.shared.authorize()
    }
    AsyncFunction("openSettings") { () async throws in
      let url = URL(string: UIApplication.openSettingsURLString)!
      _ = await UIApplication.shared.open(url)
    }
    AsyncFunction("saveAlarm") { (input: AlarmInput) async throws in
      try await AlarmEngine.shared.save(input.storedAlarm())
    }
    AsyncFunction("deleteAlarm") { (id: String) async throws in
      guard let uuid = UUID(uuidString: id) else { throw AlarmInputError.invalidInput }
      try await AlarmEngine.shared.delete(uuid)
    }
    AsyncFunction("stopAlarm") { (id: String) async throws in
      guard let uuid = UUID(uuidString: id) else { throw AlarmInputError.invalidInput }
      try await AlarmEngine.shared.stop(uuid)
    }
    AsyncFunction("checkIn") { (id: String) async throws in
      guard let uuid = UUID(uuidString: id) else { throw AlarmInputError.invalidInput }
      try await AlarmEngine.shared.checkIn(uuid)
    }

    OnStartObserving("onAlarmChange") { self.observe() }
    OnStopObserving("onAlarmChange") { self.stopObserving() }
    OnDestroy { self.stopObserving() }
  }

  private func observe() {
    stopObserving()
    observations = [
      Task { [weak self] in
        for await _ in AlarmManager.shared.alarmUpdates {
          guard !Task.isCancelled else { return }
          self?.sendEvent("onAlarmChange", [:])
        }
      },
      Task { [weak self] in
        for await _ in AlarmManager.shared.authorizationUpdates {
          guard !Task.isCancelled else { return }
          self?.sendEvent("onAlarmChange", [:])
        }
      },
      Task { [weak self] in
        for await _ in NotificationCenter.default.notifications(named: UIApplication.significantTimeChangeNotification) {
          guard !Task.isCancelled else { return }
          self?.sendEvent("onAlarmChange", [:])
        }
      }
    ]
  }

  private func stopObserving() {
    observations.forEach { $0.cancel() }
    observations.removeAll()
  }
}
