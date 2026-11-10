import XCTest

final class AlarmBridgeUITests: XCTestCase {
  private let app = XCUIApplication(bundleIdentifier: "app.wupiko.alarm")
  private let system = XCUIApplication(bundleIdentifier: "com.apple.springboard")

  private func element(_ identifier: String) -> XCUIElement {
    app.descendants(matching: .any).matching(identifier: identifier).firstMatch
  }

  private func deleteOwnAlarm(_ row: XCUIElement) {
    guard row.exists else { return }
    row.tap()
    app.buttons["Delete alarm"].tap()
    app.alerts.buttons["Delete alarm"].tap()
  }

  func testRecurringAlarmSurvivesNativeRoundTrip() throws {
    continueAfterFailure = false
    app.launch()

    if element("welcome-continue").waitForExistence(timeout: 3) {
      element("welcome-continue").tap()
      if element("allow-alarms").waitForExistence(timeout: 2) {
        element("allow-alarms").tap()
        let allow = system.alerts.buttons["Allow"]
        if allow.waitForExistence(timeout: 2) { allow.tap() }
      }
    }

    let label = "Bridge test " + UUID().uuidString.prefix(8)
    let row = app.buttons.matching(NSPredicate(
      format: "identifier BEGINSWITH 'alarm-row-' AND label CONTAINS %@", String(label)
    )).firstMatch
    // Relaunch in teardown if an assertion interrupted the editor. The unique
    // label ensures cleanup only operates on the record created by this test.
    addTeardownBlock {
      self.app.terminate()
      self.app.launch()
      if row.waitForExistence(timeout: 3) { self.deleteOwnAlarm(row) }
    }

    XCTAssertTrue(element("create-alarm").waitForExistence(timeout: 8))
    element("create-alarm").tap()
    element("weekday-1").tap()
    element("weekday-4").tap()
    let field = element("alarm-name")
    if !field.isHittable { app.swipeUp() }
    field.tap()
    field.typeText(String(label) + "\n")
    element("save-alarm").tap()

    XCTAssertTrue(row.waitForExistence(timeout: 8), app.debugDescription)
    XCTAssertTrue(row.label.contains("Mon, Thu"), row.label)
    let savedIdentifier = row.identifier
    app.terminate()
    app.launch()
    XCTAssertTrue(row.waitForExistence(timeout: 8), app.debugDescription)
    XCTAssertEqual(row.identifier, savedIdentifier)
    XCTAssertTrue(row.label.contains("Mon, Thu"), row.label)
    deleteOwnAlarm(row)
    XCTAssertTrue(element("create-alarm").waitForExistence(timeout: 6))
    XCTAssertFalse(row.exists)
  }
}
