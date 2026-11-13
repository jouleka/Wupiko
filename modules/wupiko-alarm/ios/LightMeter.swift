import AVFoundation
import Foundation

/// Estimates how bright it is around the phone from the front camera's automatic
/// exposure. Frames are dropped as they arrive: nothing is shown, stored or sent.
final class LightMeter: NSObject, AVCaptureVideoDataOutputSampleBufferDelegate {
  private let queue = DispatchQueue(label: "wupiko.light")
  private var session: AVCaptureSession?
  private var device: AVCaptureDevice?
  private var lastSent = Date.distantPast
  private let onLux: (Double) -> Void

  init(onLux: @escaping (Double) -> Void) {
    self.onLux = onLux
  }

  static var camera: AVCaptureDevice? {
    AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front)
  }

  /// "ready", "undetermined", "denied" or "unavailable".
  static var availability: String {
    guard camera != nil else { return "unavailable" }
    switch AVCaptureDevice.authorizationStatus(for: .video) {
    case .authorized: return "ready"
    case .notDetermined: return "undetermined"
    default: return "denied"
    }
  }

  static func requestAccess() async -> Bool {
    await AVCaptureDevice.requestAccess(for: .video)
  }

  func start() throws {
    guard let camera = Self.camera else { throw LightError.unavailable }
    guard AVCaptureDevice.authorizationStatus(for: .video) == .authorized else { throw LightError.denied }
    queue.async { [weak self] in
      guard let self, self.session == nil else { return }
      let session = AVCaptureSession()
      session.sessionPreset = .low
      guard let input = try? AVCaptureDeviceInput(device: camera), session.canAddInput(input) else { return }
      session.addInput(input)
      let output = AVCaptureVideoDataOutput()
      output.alwaysDiscardsLateVideoFrames = true
      output.setSampleBufferDelegate(self, queue: self.queue)
      guard session.canAddOutput(output) else { return }
      session.addOutput(output)
      self.device = camera
      self.session = session
      session.startRunning()
    }
  }

  func stop() {
    queue.async { [weak self] in
      self?.session?.stopRunning()
      self?.session = nil
      self?.device = nil
    }
  }

  func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
    let now = Date()
    guard let device, now.timeIntervalSince(lastSent) >= 0.25 else { return }
    lastSent = now
    let seconds = CMTimeGetSeconds(device.exposureDuration)
    let iso = Double(device.iso)
    let aperture = Double(device.lensAperture)
    guard seconds > 0, iso > 0, aperture > 0 else { return }
    // Exposure value at ISO 100, then the standard incident-light estimate E = 2.5 · 2^EV.
    let ev = log2(aperture * aperture / seconds) - log2(iso / 100)
    onLux(2.5 * pow(2, ev))
  }
}

enum LightError: LocalizedError {
  case unavailable
  case denied

  var errorDescription: String? {
    switch self {
    case .unavailable: return "This device has no front camera to measure light."
    case .denied: return "Allow camera access so Wupiko can feel the light."
    }
  }
}
