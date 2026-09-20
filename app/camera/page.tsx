'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  CameraOff,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  X,
  FlipHorizontal,
  ShieldAlert,
} from 'lucide-react'
import type jsQR from 'jsqr'
import {
  MeetingStore,
  validateScan,
  type ScanResult,
  type Meeting,
} from '../management/_context/attendance-store'
import { AuthProvider, useAuth } from '../management/_context/auth-context'
import { CameraSkeleton } from '../management/_components/SkeletonPreloader'

/* ═══════════════════════════════════════════════════
   FEEDBACK TOAST TYPE
   ═══════════════════════════════════════════════════ */

interface FeedbackToast {
  id: number
  type: 'success' | 'already_scanned' | 'error'
  title: string
  subtitle?: string
}

/* ═══════════════════════════════════════════════════
   INNER CAMERA SCANNER (HOST ONLY & MINIMALIST)
   ═══════════════════════════════════════════════════ */

function MinimalScannerInner() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [cameraError, setCameraError] = useState<string>('')
  const [toast, setToast] = useState<FeedbackToast | null>(null)
  const [scanCount, setScanCount] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number>(0)
  const jsQRRef = useRef<typeof jsQR | null>(null)
  const scanLoopRef = useRef<(() => void) | null>(null)

  // Cooldown / debounce tracking
  const lastScannedTokenRef = useRef<string>('')
  const lastScanTimestampRef = useRef<number>(0)
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Dynamic import jsQR
  useEffect(() => {
    import('jsqr').then((mod) => {
      jsQRRef.current = mod.default
    })
  }, [])

  // Check active meeting
  const checkMeeting = useCallback(() => {
    const meeting = MeetingStore.getActiveMeeting()
    setActiveMeeting(meeting)
    return meeting
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      checkMeeting()
    }, 0)
    return () => clearTimeout(timer)
  }, [checkMeeting])

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  // Start camera when authenticated and meeting is active
  useEffect(() => {
    if (authLoading || !isAuthenticated || !activeMeeting) {
      stopCamera()
      return
    }

    let isMounted = true

    async function startCamera() {
      try {
        stopCamera()
        setCameraError('')
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch (err) {
        if (!isMounted) return
        const msg = err instanceof Error ? err.message : 'Unable to access camera.'
        setCameraError(msg)
      }
    }

    startCamera()

    return () => {
      isMounted = false
      stopCamera()
    }
  }, [authLoading, isAuthenticated, activeMeeting, facingMode, stopCamera])

  // Show transient toast
  const showToast = useCallback((feedback: Omit<FeedbackToast, 'id'>) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }
    const newToast: FeedbackToast = { ...feedback, id: Date.now() }
    setToast(newToast)

    toastTimerRef.current = setTimeout(() => {
      setToast(null)
    }, 2500)
  }, [])

  // Continuous scan loop
  useEffect(() => {
    scanLoopRef.current = () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      const jsQRFn = jsQRRef.current

      if (
        !video ||
        !canvas ||
        !jsQRFn ||
        video.readyState !== video.HAVE_ENOUGH_DATA
      ) {
        animFrameRef.current = requestAnimationFrame(() => scanLoopRef.current?.())
        return
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d', { willReadFrequently: true })

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQRFn(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        })

        if (code && code.data) {
          const now = Date.now()
          // Prevent duplicate trigger of same QR within 3 seconds
          if (
            code.data !== lastScannedTokenRef.current ||
            now - lastScanTimestampRef.current > 3000
          ) {
            lastScannedTokenRef.current = code.data
            lastScanTimestampRef.current = now

            const result: ScanResult = validateScan(code.data)

            if (result.success) {
              setScanCount((c) => c + 1)
              if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(100)
              }
              showToast({
                type: 'success',
                title: result.officerName || 'Officer Checked In',
                subtitle: result.position || 'Present',
              })
            } else if (result.code === 'ALREADY_SCANNED') {
              showToast({
                type: 'already_scanned',
                title: result.officerName || 'Officer',
                subtitle: 'Already checked in',
              })
            } else {
              showToast({
                type: 'error',
                title: 'Scan Failed',
                subtitle: result.error || 'Invalid QR code',
              })
            }
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(() => scanLoopRef.current?.())
    }
  })

  // Kick off scan loop
  useEffect(() => {
    if (isAuthenticated && activeMeeting && !cameraError) {
      animFrameRef.current = requestAnimationFrame(() => scanLoopRef.current?.())
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [isAuthenticated, activeMeeting, cameraError])

  function toggleCamera() {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
  }

  // 1. Loading State
  if (authLoading) {
    return <CameraSkeleton />
  }

  // 2. Host Access Only Gate
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6 text-center text-white select-none">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
          <ShieldAlert size={28} className="text-amber-400" />
        </div>
        <h1 className="font-sans font-bold text-lg text-white">Host Access Required</h1>
        <p className="text-xs text-white/40 mt-1.5 max-w-xs leading-relaxed">
          Only authenticated meeting hosts can access the attendance scanner.
        </p>
        <Link
          href="/management"
          className="mt-6 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold tracking-wide transition-all"
        >
          Log In as Host
        </Link>
      </div>
    )
  }

  // 3. No Active Meeting Gate
  if (!activeMeeting) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6 text-center text-white select-none">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
          <CameraOff size={28} className="text-white/40" />
        </div>
        <h1 className="font-sans font-bold text-lg text-white">No Active Meeting</h1>
        <p className="text-xs text-white/40 mt-1.5 max-w-xs leading-relaxed">
          There is no meeting in session right now. Activate or schedule one in the management portal.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => checkMeeting()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-medium transition-all"
          >
            <RefreshCw size={13} />
            Recheck
          </button>
          <Link
            href="/management/attendance"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-medium transition-all"
          >
            Open Attendance
          </Link>
        </div>
      </div>
    )
  }

  // 4. Camera Error
  if (cameraError) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6 text-center text-white select-none">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
          <XCircle size={28} className="text-red-400" />
        </div>
        <h1 className="font-sans font-bold text-lg text-white">Camera Error</h1>
        <p className="text-xs text-white/40 mt-1.5 max-w-xs leading-relaxed">{cameraError}</p>
        <button
          onClick={() => {
            setCameraError('')
            setFacingMode((prev) => prev)
          }}
          className="mt-6 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium transition-all"
        >
          Retry
        </button>
      </div>
    )
  }

  // 5. Ultra-Minimalist Viewfinder Scanner
  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none touch-none">
      {/* Hidden Canvas for Decoding */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* Minimal Top Controls Bar */}
      <div className="absolute top-0 inset-x-0 p-4 sm:p-6 flex items-center justify-between z-30 pointer-events-auto">
        {/* Meeting Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold truncate max-w-[140px] sm:max-w-[200px]">
            {activeMeeting.title}
          </span>
          <span className="text-[10px] text-white/50 font-mono pl-1 border-l border-white/10">
            {scanCount} in
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Flip Camera */}
          <button
            onClick={toggleCamera}
            aria-label="Switch Camera"
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/80 hover:text-white flex items-center justify-center transition active:scale-95 shadow-lg"
          >
            <FlipHorizontal size={18} />
          </button>

          {/* Close Scanner */}
          <Link
            href="/management/attendance"
            aria-label="Exit Scanner"
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/80 hover:text-white flex items-center justify-center transition active:scale-95 shadow-lg"
          >
            <X size={18} />
          </Link>
        </div>
      </div>

      {/* Viewfinder Center Box */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className="w-64 h-64 sm:w-72 sm:h-72 relative">
          {/* Subtle Corner Brackets */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/80 rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/80 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/80 rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/80 rounded-br-lg" />

          {/* Minimal Scanning Laser */}
          <div
            className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_8px_rgba(251,191,36,0.6)]"
            style={{ animation: 'scanlaser 2s ease-in-out infinite' }}
          />
        </div>
      </div>

      {/* Floating Instant Feedback Pill */}
      {toast && (
        <div className="absolute bottom-8 inset-x-0 flex justify-center px-4 z-40 pointer-events-none">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full backdrop-blur-xl shadow-2xl border text-xs font-medium transition-all transform duration-200 animate-in fade-in slide-in-from-bottom-3 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : toast.type === 'already_scanned'
                ? 'bg-amber-950/90 border-amber-500/40 text-amber-200'
                : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
            {toast.type === 'already_scanned' && <AlertCircle size={16} className="text-amber-400 shrink-0" />}
            {toast.type === 'error' && <XCircle size={16} className="text-rose-400 shrink-0" />}

            <div className="flex items-center gap-1.5 truncate">
              <span className="font-semibold text-white truncate">{toast.title}</span>
              {toast.subtitle && (
                <span className="opacity-70 text-[11px] truncate">· {toast.subtitle}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Laser Keyframe */}
      <style jsx>{`
        @keyframes scanlaser {
          0%, 100% { top: 8px; opacity: 0.2; }
          50% { top: calc(100% - 8px); opacity: 0.9; }
        }
      `}</style>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   EXPORT DEFAULT WITH AUTH PROVIDER
   ═══════════════════════════════════════════════════ */

export default function CameraPage() {
  return (
    <AuthProvider>
      <MinimalScannerInner />
    </AuthProvider>
  )
}
