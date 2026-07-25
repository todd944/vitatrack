import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'

// Restricting to the formats real product barcodes actually use (instead of
// ZXing's default of trying every format, including QR/PDF417/Data Matrix,
// on every frame) means more decode attempts per second and better odds of
// catching a slightly blurry or off-angle scan — which is what "camera
// works but never detects the barcode" usually comes down to in practice.
const hints = new Map()
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
])
hints.set(DecodeHintType.TRY_HARDER, true)

// Full-screen camera overlay that decodes UPC/EAN barcodes in-browser via
// ZXing — no native app, no server round-trip for the scan itself (only the
// barcode-to-product-name lookup afterward calls out to an API). Calls
// onScan(text) once with the decoded barcode, then this component's job is
// done; the caller is responsible for closing it.
export default function BarcodeScanner({ onScan, onClose }) {
  const videoRef = useRef(null)
  const controlsRef = useRef(null)
  const trackRef = useRef(null)
  const [status, setStatus] = useState('starting') // starting | scanning | captured | error | unsupported
  // iOS Safari can grant camera access and attach the stream, but silently
  // refuse to actually play the video frame if too much async work happened
  // between the tap that granted permission and the play() call — the video
  // sits black with no error. `video.paused` alone doesn't catch this: Safari
  // can report the video as "playing" while still delivering zero real
  // frames. This also isn't a one-time-at-startup risk — the camera can
  // freeze mid-session too (phone briefly backgrounds, OS reclaims the
  // camera), so needsTapToPlay is driven by an ongoing check of whether
  // `video.currentTime` is actually advancing, running for as long as the
  // scanner is open, not just a few seconds after it opens.
  const [needsTapToPlay, setNeedsTapToPlay] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)
  // Bumping this forces the effect below to fully tear down and re-acquire
  // the camera from scratch — used for recovery when the track itself dies
  // (not just when playback pauses, which a plain video.play() can fix).
  const [restartKey, setRestartKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setNeedsTapToPlay(false)
    setStatus('starting')

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported')
      return
    }

    const reader = new BrowserMultiFormatReader(hints)
    // decodeFromVideoDevice only asks for facingMode: 'environment', which
    // on most phones falls back to a low, non-HD default resolution — plenty
    // for viewing but often too coarse to resolve the fine bars on a small,
    // curved supplement-bottle barcode. decodeFromConstraints lets us ask
    // for a higher-res feed than that. (A `focusMode: continuous` advanced
    // constraint was tried here too, but it correlated with the camera
    // track dying seconds after starting on iOS — pulled back out.)
    const constraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    }
    reader
      .decodeFromConstraints(constraints, videoRef.current, (result, _error, controls) => {
        if (cancelled || !result) return
        controlsRef.current = controls
        if (controlsRef.current.frameMonitor) clearInterval(controlsRef.current.frameMonitor)
        // A successful decode used to close the overlay instantly, which
        // made a real capture look identical to nothing happening — easy to
        // mistake for the scanner being broken. Holding on a visible
        // "captured" state for a beat before handing off makes a successful
        // scan unmistakable.
        setStatus('captured')
        // Wait for the camera to actually finish releasing before handing
        // control back — otherwise the next scan can be opened (racing a
        // fresh getUserMedia request) while the phone is still tearing down
        // this stream, which is what a "worked once, then camera stopped
        // working on the next scan" pattern looks like. Wrapped in
        // Promise.resolve since some code paths return a plain (sync) stop.
        Promise.resolve(controls.stop()).then(() => {
          setTimeout(() => {
            if (!cancelled) onScan(result.getText())
          }, 700)
        })
      })
      .then((controls) => {
        if (cancelled) {
          controls.stop()
          return
        }
        controlsRef.current = controls
        setStatus('scanning')

        const video = videoRef.current
        if (video?.paused) {
          video.play().catch(() => {})
        }

        const track = video?.srcObject?.getVideoTracks?.()[0]
        trackRef.current = track || null
        const capabilities = track?.getCapabilities?.()
        setTorchSupported(!!capabilities?.torch)

        // Watch currentTime instead of just readyState/videoWidth — those
        // only prove a frame arrived *once*, not that the feed is still
        // live. A stall of ~1.6s (4 stale checks in a row) after having
        // started is just as much "stuck" as never starting in the first
        // place, and both should surface the same recovery button.
        let lastTime = -1
        let staleCount = 0
        const monitor = setInterval(() => {
          const v = videoRef.current
          if (!v) return
          const advancing = v.readyState >= 2 && v.currentTime > lastTime
          lastTime = v.currentTime
          if (advancing) {
            staleCount = 0
            setNeedsTapToPlay(false)
          } else {
            staleCount += 1
            if (staleCount >= 4) setNeedsTapToPlay(true)
          }
        }, 400)
        controlsRef.current.frameMonitor = monitor
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
      if (controlsRef.current?.frameMonitor) clearInterval(controlsRef.current.frameMonitor)
      controlsRef.current?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restartKey])

  const handleRestart = () => {
    // A plain video.play() only helps when playback is merely paused. If
    // the camera flashed on then froze, the underlying track itself likely
    // died — the only real fix is tearing down and requesting a brand new
    // stream, which bumping restartKey triggers via the effect above.
    setRestartKey((k) => k + 1)
  }

  const toggleTorch = () => {
    const next = !torchOn
    trackRef.current
      ?.applyConstraints({ advanced: [{ torch: next }] })
      .then(() => setTorchOn(next))
      .catch(() => {})
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 30, 28, 0.92)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      {status === 'unsupported' && (
        <div className="card" style={{ maxWidth: 320, textAlign: 'center' }}>
          <p style={{ margin: '0 0 12px' }}>This browser doesn't support camera access here. You can still add the product by name below.</p>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      )}
      {status === 'error' && (
        <div className="card" style={{ maxWidth: 320, textAlign: 'center' }}>
          <p style={{ margin: '0 0 12px' }}>Couldn't access the camera — check your browser's camera permission for this site, or add the product by name below.</p>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      )}
      {(status === 'starting' || status === 'scanning' || status === 'captured') && (
        <>
          <div style={{ position: 'relative', width: '100%', maxWidth: 480 }}>
            <video
              ref={videoRef}
              muted
              autoPlay
              playsInline
              style={{ width: '100%', borderRadius: 8, background: '#000', display: 'block' }}
            />
            {needsTapToPlay && status !== 'captured' && (
              <button
                type="button"
                className="btn-primary"
                onClick={handleRestart}
                style={{ position: 'absolute', inset: 0, margin: 'auto', width: 160, height: 44 }}
              >
                Tap to retry camera
              </button>
            )}
            {status === 'scanning' && !needsTapToPlay && (
              // Framing guide only — decoding runs on the full frame
              // regardless, this just helps the user judge distance/angle,
              // which matters a lot more for a small barcode wrapped around
              // a curved supplement bottle than for a flat product box.
              <div
                style={{
                  position: 'absolute',
                  left: '10%',
                  right: '10%',
                  top: '38%',
                  bottom: '38%',
                  border: '2px solid rgba(255,255,255,0.85)',
                  borderRadius: 6,
                  pointerEvents: 'none',
                }}
              />
            )}
            {status === 'captured' && (
              // Unmistakable success feedback: the guide box turns solid
              // green with a checkmark and a bright flash sweeps over the
              // frame once, held for ~700ms before the overlay closes.
              <>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(255,255,255,0.5)',
                    animation: 'barcode-flash 0.4s ease-out',
                    borderRadius: 8,
                    pointerEvents: 'none',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: '10%',
                    right: '10%',
                    top: '38%',
                    bottom: '38%',
                    border: '3px solid #2E7D4F',
                    background: 'rgba(46, 125, 79, 0.25)',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 40,
                    pointerEvents: 'none',
                  }}
                >
                  ✓
                </div>
              </>
            )}
          </div>
          <style>{'@keyframes barcode-flash { from { opacity: 1; } to { opacity: 0; } }'}</style>
          <p style={{ color: 'white', marginTop: 12, fontSize: 14, fontWeight: status === 'captured' ? 700 : 400 }}>
            {status === 'starting' && 'Starting camera…'}
            {status === 'scanning' && 'Fill the box with the barcode, flat side facing the camera, a few inches away'}
            {status === 'captured' && 'Barcode captured ✓'}
          </p>
          {status !== 'captured' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {torchSupported && status === 'scanning' && (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ color: 'white', borderColor: 'white' }}
                  onClick={toggleTorch}
                >
                  {torchOn ? '💡 Light on' : '🔦 Light off'}
                </button>
              )}
              <button
                className="btn-secondary"
                style={{ color: 'white', borderColor: 'white' }}
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
