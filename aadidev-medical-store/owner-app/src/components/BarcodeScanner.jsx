import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export default function BarcodeScanner({ onDetected, onClose }) {
  const containerRef = useRef(null)
  const scannerRef = useRef(null)

  useEffect(() => {
    const id = 'barcode-scanner-region'
    const scanner = new Html5Qrcode(id)
    scannerRef.current = scanner

    Html5Qrcode.getCameras()
      .then(cameras => {
        if (!cameras || cameras.length === 0) return
        const cameraId = cameras[cameras.length - 1].id // usually the back camera on phones
        scanner
          .start(
            cameraId,
            { fps: 10, qrbox: { width: 240, height: 140 } },
            decodedText => {
              onDetected(decodedText)
            },
            () => {} // ignore per-frame scan failures
          )
          .catch(() => {})
      })
      .catch(() => {})

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => scannerRef.current.clear()).catch(() => {})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
        <span style={{ color: 'white', fontWeight: 700 }}>Scan barcode / QR</span>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px' }}>
          Close
        </button>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div id="barcode-scanner-region" ref={containerRef} style={{ width: '100%', maxWidth: 380, borderRadius: 12, overflow: 'hidden' }} />
      </div>
      <div style={{ color: '#cfe3ef', fontSize: 12.5, textAlign: 'center', padding: '0 20px 20px' }}>
        Point the camera at the medicine's barcode. It'll fill in automatically once detected.
      </div>
    </div>
  )
}
