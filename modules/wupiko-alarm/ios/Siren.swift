import AVFoundation
import MediaPlayer
import UIKit

/// Wupiko's own ring, which takes over from the system alert once the app is
/// open. iOS lets anyone hush an AlarmKit alert and plays it at the system's
/// level; this one ignores the silent switch, holds the volume up, keeps going
/// when the phone is locked, and only the check-in ends it. Main thread only.
final class Siren {
  static let shared = Siren()
  private var player: AVAudioPlayer?
  private var timer: Timer?
  private var volumeView: MPVolumeView?
  private var volumeBefore: Float?
  private var startedAt = Date()

  /// Seconds the ring takes to swell from `rampFrom` to full.
  private static let ramp: TimeInterval = 8
  private static let rampFrom: Float = 0.35

  func start(sound: String) throws {
    guard let url = Bundle.main.url(forResource: sound, withExtension: "wav")
    else { throw AlarmInputError.missingSound }
    if player?.url == url { return }
    stop()
    let session = AVAudioSession.sharedInstance()
    // Playback ignores the silent switch and, with the audio background mode, the lock button.
    try session.setCategory(.playback, mode: .default, options: [])
    try session.setActive(true)
    let player = try AVAudioPlayer(contentsOf: url)
    player.numberOfLoops = -1
    player.volume = Self.rampFrom
    player.play()
    self.player = player
    startedAt = Date()
    volumeBefore = session.outputVolume
    attachVolumeControl()
    let timer = Timer(timeInterval: 0.5, repeats: true) { [weak self] _ in self?.hold() }
    RunLoop.main.add(timer, forMode: .common)
    self.timer = timer
  }

  func stop() {
    timer?.invalidate()
    timer = nil
    guard let player else { return }
    player.stop()
    self.player = nil
    if let volumeBefore { slider?.value = volumeBefore }
    volumeBefore = nil
    // The slider applies its value a moment later, so the view has to outlive this call.
    let view = volumeView
    volumeView = nil
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { view?.removeFromSuperview() }
    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
  }

  private func hold() {
    guard let player else { return }
    // A system alarm alert or a call interrupts playback. Pick it back up afterwards.
    if !player.isPlaying {
      try? AVAudioSession.sharedInstance().setActive(true)
      player.play()
    }
    let progress = Float(min(1, Date().timeIntervalSince(startedAt) / Self.ramp))
    player.volume = Self.rampFrom + (1 - Self.rampFrom) * progress
    if AVAudioSession.sharedInstance().outputVolume < 1 { slider?.value = 1 }
  }

  /// iOS has no call to set the output volume. The system's own volume slider does it.
  private var slider: UISlider? {
    volumeView?.subviews.compactMap { $0 as? UISlider }.first
  }

  private func attachVolumeControl() {
    let window = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
      .flatMap(\.windows).first { $0.isKeyWindow }
    guard let window else { return }
    let view = MPVolumeView(frame: CGRect(x: -400, y: -400, width: 100, height: 40))
    view.alpha = 0.01
    view.isUserInteractionEnabled = false
    window.addSubview(view)
    volumeView = view
  }
}
