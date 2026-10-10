'use client'

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useSyncExternalStore,
} from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { startProgressiveMascotPreload } from '@/lib/kasubayPreload'

type MascotState =
  | 'walk-right'
  | 'walk-left'
  | 'pause-right'
  | 'pause-left'
  | 'mid-rest'

type RestPosture = 'wave' | 'sit' | 'lay'

const SUPPORT_MESSAGES = [
  // Original favorites
  'Good luck sa midterms, nak.',
  'Keep fighting, kaya mo \'yan.',
  'Toun mayad ghaaa',
  'Review anay di sagi chat!',
  'Proud meee sa\'yo.',
  'Kakayanin natin \'to, Nak.',
  'Laban lang palagi.',
  'Isang sem na lang, kapit lang.',
  'Tiwala sa sarili, kaya mo \'to.',
  // Category A: IT & Coding Student Humor
  'Wala na bang bugs, nak?',
  'Git commit, git tulog!',
  'Naka-semicolon ka na ba?',
  'Ctrl + S every 2 seconds!',
  'Wag kalimutan mag-save!',
  'Debugging is 90% kape.',
  // Category B: Authentic Kinaray-a / Antique Flavor
  'Indi mag-surrender, kasubay!',
  'Baskug gid ang IT Kasubay!',
  'Kaon anay bago mag-code.',
  'Ubra lang, makatapos gid!',
  'Toun mayad para maipabugal!',
  // Category C: Academic & Thesis / Midterms Survival
  'Pasado gid kamo tanan!',
  'Uno ang target, nak!',
  'Thesis defense? Kayang-kaya!',
  'Clearance signed na ba tanan?',
  'Singko is not an option!',
  // Category D: Student Self-Care & Balance
  'Inom tubig, \'wag puro kape!',
  'Stretch gamay, masakit ang likod!',
  'Pahuway man gamay ang mata.',
]

const REST_MESSAGES = [
  'Pahuway man gamay ang mata.',
  'Stretch gamay, masakit ang likod!',
  'Inom tubig, \'wag puro kape!',
  'Kaon anay bago mag-code.',
  'Git commit, git tulog!',
  'Debugging is 90% kape.',
  'Hingalo gamay, lakad liwat!',
  'Kapoy man mag-sagi dagan, nak!',
  'Chill anay sa stat card...',
  'Pahuway anay, makatapos gid!',
  'Wala na bang bugs, nak?',
]

function getRandomMessage(exclude?: string | null): string {
  const pool = SUPPORT_MESSAGES.filter((m) => m !== exclude)
  return pool[Math.floor(Math.random() * pool.length)]
}

function getRestMessage(exclude?: string | null): string {
  const pool = REST_MESSAGES.filter((m) => m !== exclude)
  return pool[Math.floor(Math.random() * pool.length)]
}

const RUN_FRAMES = [
  '/assets/kasubay/run/frame-0.png',
  '/assets/kasubay/run/frame-1.png',
  '/assets/kasubay/run/frame-2.png',
  '/assets/kasubay/run/frame-3.png',
  '/assets/kasubay/run/frame-4.png',
  '/assets/kasubay/run/frame-5.png',
  '/assets/kasubay/run/frame-6.png',
  '/assets/kasubay/run/frame-7.png',
]

const MIN_X = 8 // Left border boundary % (prevents bubble overhang on narrow mobile screens)
const MAX_X = 76 // Right border boundary % (prevents bubble overhang and clipping on right border)
const SPEED = 8.2 // Percentage traveled per second (~10s for full traversal)

// Safe external store subscription for prefers-reduced-motion (no cascading renders)
function subscribeReducedMotion(callback: () => void) {
  if (typeof window === 'undefined') return () => { }
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

function getReducedMotionSnapshot() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getReducedMotionServerSnapshot() {
  return false
}

interface KasubayPatrolProps {
  isReady?: boolean
}

export default function KasubayPatrol({ isReady = true }: KasubayPatrolProps) {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  )

  const [state, setState] = useState<MascotState>('walk-right')
  const [frameIndex, setFrameIndex] = useState(0)
  const [speechBubble, setSpeechBubble] = useState<string | null>(null)
  const [isJumping, setIsJumping] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [entrancePhase, setEntrancePhase] = useState<'wake' | 'wave' | 'patrol'>('wake')
  const [restPosture, setRestPosture] = useState<RestPosture>('wave')
  const [leanFrame, setLeanFrame] = useState<0 | 1>(0)

  // Tracking exact horizontal position and direction
  const containerRef = useRef<HTMLDivElement>(null)
  const posRef = useRef(MIN_X)
  const dirRef = useRef<1 | -1>(1) // 1 = moving right, -1 = moving left
  const [facing, setFacing] = useState<'right' | 'left'>('right')
  const stateRef = useRef<MascotState>('walk-right')
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null)
  const jumpTimerRef = useRef<NodeJS.Timeout | null>(null)
  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Mid-patrol action target (can be a jump or a quick rest/sit breather)
  const midActionRef = useRef<{ targetX: number; type: 'jump' | 'rest' } | null>(null)

  // Sync stateRef
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Ensure progressive preloading is running if user lands directly on stats section
  useEffect(() => {
    startProgressiveMascotPreload()
  }, [])

  // Trigger a lively jump with supportive speech bubble without stopping traversal
  const triggerJump = useCallback((quote?: string) => {
    setIsJumping(true)
    setSpeechBubble(quote ?? getRandomMessage())

    if (jumpTimerRef.current) clearTimeout(jumpTimerRef.current)
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)

    // Touch down after 600ms
    jumpTimerRef.current = setTimeout(() => {
      setIsJumping(false)
    }, 600)

    // Keep supportive bubble visible for 3.5s
    bubbleTimerRef.current = setTimeout(() => {
      setSpeechBubble(null)
    }, 3500)
  }, [])

  // Trigger a natural mid-patrol resting breather on the card rim
  const triggerMidRest = useCallback(() => {
    setState('mid-rest')
    setRestPosture('sit')
    if (Math.random() < 0.75) {
      setSpeechBubble(getRestMessage())
    }

    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)

    // Rest for 3.6s, then resume traversal in current direction
    pauseTimerRef.current = setTimeout(() => {
      setSpeechBubble(null)
      const nextWalkState = dirRef.current === 1 ? 'walk-right' : 'walk-left'
      setState(nextWalkState)
    }, 3600)
  }, [])

  // Helper to schedule a potential random mid-patrol action (jump or breather)
  const scheduleMidAction = useCallback(() => {
    const roll = Math.random()
    if (roll < 0.4) {
      // 40% chance: playful jump while crossing
      midActionRef.current = {
        targetX: 36 + Math.random() * 22,
        type: 'jump',
      }
    } else if (roll < 0.7) {
      // 30% chance: quick sitting breather near center
      midActionRef.current = {
        targetX: 38 + Math.random() * 18,
        type: 'rest',
      }
    } else {
      // 30% chance: uninterrupted crossing
      midActionRef.current = null
    }
  }, [])

  // Entrance sequence: when isReady is handed off from hero leap, wake up, greet, then launch patrol sprint
  useEffect(() => {
    if (!isReady || hasStarted) return

    // Phase 1 is already active by default (entrancePhase initialized to 'wake')
    // Phase 2: Wake up, wave, and display student encouragement message
    const waveTimer = setTimeout(() => {
      setEntrancePhase('wave')
      setSpeechBubble(getRandomMessage())
    }, 550)

    // Phase 3: Launch into patrol across the stat card
    startTimerRef.current = setTimeout(() => {
      setEntrancePhase('patrol')
      setHasStarted(true)
      scheduleMidAction()
    }, 1800)

    // Auto-dismiss initial speech bubble after 3.8s
    bubbleTimerRef.current = setTimeout(() => {
      setSpeechBubble(null)
    }, 3800)

    return () => {
      clearTimeout(waveTimer)
      if (startTimerRef.current) clearTimeout(startTimerRef.current)
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
    }
  }, [isReady, hasStarted, scheduleMidAction])

  // Continuous position loop (runs only once scrolled into view and launched)
  useEffect(() => {
    if (!isReady || reducedMotion || !hasStarted) return

    let lastTime = performance.now()
    let frameId: number

    const tick = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now

      if (stateRef.current === 'walk-right' || stateRef.current === 'walk-left') {
        posRef.current += dirRef.current * SPEED * delta

        if (midActionRef.current !== null) {
          const { targetX, type } = midActionRef.current
          const reached =
            (dirRef.current === 1 && posRef.current >= targetX) ||
            (dirRef.current === -1 && posRef.current <= targetX)

          if (reached) {
            midActionRef.current = null
            if (type === 'jump') {
              triggerJump()
            } else {
              triggerMidRest()
            }
          }
        } else if (dirRef.current === 1 && posRef.current >= MAX_X) {
          posRef.current = MAX_X
          dirRef.current = -1
          setFacing('left')

          // Varied edge behavior: 40% sit, 35% lay, 25% wave
          const roll = Math.random()
          const posture: RestPosture =
            roll < 0.4 ? 'sit' : roll < 0.75 ? 'lay' : 'wave'
          setRestPosture(posture)
          setState('pause-right')

          let duration = 2800
          if (posture === 'sit') {
            duration = 4500
            if (Math.random() < 0.8) setSpeechBubble(getRestMessage())
          } else if (posture === 'lay') {
            duration = 5200
            if (Math.random() < 0.8) setSpeechBubble(getRestMessage())
          } else {
            duration = 2800
            setSpeechBubble(getRandomMessage())
          }

          pauseTimerRef.current = setTimeout(() => {
            setSpeechBubble(null)
            scheduleMidAction()
            setState('walk-left')
          }, duration)
        } else if (dirRef.current === -1 && posRef.current <= MIN_X) {
          posRef.current = MIN_X
          dirRef.current = 1
          setFacing('right')

          // Varied edge behavior: 40% sit, 35% lay, 25% wave
          const roll = Math.random()
          const posture: RestPosture =
            roll < 0.4 ? 'sit' : roll < 0.75 ? 'lay' : 'wave'
          setRestPosture(posture)
          setState('pause-left')

          let duration = 2800
          if (posture === 'sit') {
            duration = 4500
            if (Math.random() < 0.8) setSpeechBubble(getRestMessage())
          } else if (posture === 'lay') {
            duration = 5200
            if (Math.random() < 0.8) setSpeechBubble(getRestMessage())
          } else {
            duration = 2800
            setSpeechBubble(getRandomMessage())
          }

          pauseTimerRef.current = setTimeout(() => {
            setSpeechBubble(null)
            scheduleMidAction()
            setState('walk-right')
          }, duration)
        }

        if (containerRef.current) {
          containerRef.current.style.left = `${posRef.current}%`
        }
      }

      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frameId)
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
      if (jumpTimerRef.current) clearTimeout(jumpTimerRef.current)
    }
  }, [isReady, reducedMotion, hasStarted, scheduleMidAction, triggerJump, triggerMidRest])

  // Sequential 8-frame walk/run cycle (starts only when running)
  useEffect(() => {
    if (!isReady || !hasStarted || !state.startsWith('walk') || reducedMotion) return

    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % RUN_FRAMES.length)
    }, 90)

    return () => clearInterval(interval)
  }, [isReady, hasStarted, state, reducedMotion])

  // Alternating breathing posture when lounging in lay posture
  useEffect(() => {
    if (reducedMotion || restPosture !== 'lay') return
    const isPaused =
      state === 'pause-right' || state === 'pause-left' || state === 'mid-rest'
    if (!isPaused) return

    const interval = setInterval(() => {
      setLeanFrame((prev) => (prev === 0 ? 1 : 0))
    }, 2400)
    return () => clearInterval(interval)
  }, [reducedMotion, restPosture, state])

  // Interactive click handler (clicking while resting wakes him up with a cheerful bounce!)
  const handleClick = useCallback(() => {
    const currentState = stateRef.current
    if (
      currentState === 'mid-rest' ||
      currentState === 'pause-right' ||
      currentState === 'pause-left'
    ) {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
      triggerJump('Gising pa, nak! Laban liwat!')

      const nextWalkState = dirRef.current === 1 ? 'walk-right' : 'walk-left'
      pauseTimerRef.current = setTimeout(() => {
        setState(nextWalkState)
      }, 700)
    } else {
      triggerJump()
    }
  }, [triggerJump])

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (startTimerRef.current) clearTimeout(startTimerRef.current)
      if (jumpTimerRef.current) clearTimeout(jumpTimerRef.current)
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
    }
  }, [])

  // Direction facing:
  const scaleX = facing === 'left' ? -1 : 1

  // Rest state determination
  const isResting =
    state === 'pause-right' || state === 'pause-left' || state === 'mid-rest'

  // Determine current active sprite:
  // Before patrol begins: waking up (sit) -> greeting (wave).
  // In jump: celebratory cheer sprite.
  // In rest: sitting (sit), lounging (lean-0/lean-1), or waving (wave).
  // In motion: sequential 8-frame run cycle.
  let activeSprite = RUN_FRAMES[frameIndex]
  if (!hasStarted) {
    activeSprite =
      entrancePhase === 'wake'
        ? '/assets/kasubay/kasubay-sit.png'
        : '/assets/kasubay/kasubay-wave.png'
  } else if (isJumping) {
    activeSprite = '/assets/kasubay/kasubay-cheer.png'
  } else if (isResting) {
    if (restPosture === 'sit') {
      activeSprite = '/assets/kasubay/kasubay-sit.png'
    } else if (restPosture === 'lay') {
      activeSprite =
        leanFrame === 0
          ? '/assets/kasubay/lay/lean-0.png'
          : '/assets/kasubay/lay/lean-1.png'
    } else {
      activeSprite = '/assets/kasubay/kasubay-wave.png'
    }
  }

  if (!isReady) {
    return null
  }

  if (reducedMotion) {
    return (
      <div className="absolute bottom-full left-6 z-20 pointer-events-auto translate-y-[6px] sm:translate-y-[8px]">
        {/* Ground Contact Shadow */}
        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 sm:w-11 h-2 bg-black/35 dark:bg-black/55 rounded-full blur-[1px] pointer-events-none" />
        <button
          type="button"
          onClick={handleClick}
          className="relative block w-[66px] h-[84px] sm:w-[84px] sm:h-[106px] focus:outline-none cursor-pointer"
          aria-label="KasUbAy Mascot"
        >
          <Image
            src="/assets/kasubay/kasubay-wave.png"
            alt="KasUbAy Ant Mascot"
            fill
            className="object-contain object-bottom"
            priority
            unoptimized
          />
        </button>
        <AnimatePresence>
          {speechBubble && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: -10, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute -top-11 sm:-top-12 left-1/2 -translate-x-1/2 whitespace-nowrap z-30 pointer-events-none"
            >
              <div className="relative px-2.5 py-1 rounded-md bg-white/95 dark:bg-[#0D1117]/95 backdrop-blur-md border border-black/10 dark:border-white/15 text-neutral-800 dark:text-neutral-100 shadow-sm text-[11px] sm:text-xs font-medium tracking-tight">
                {speechBubble}
                <div
                  aria-hidden="true"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-white/95 dark:bg-[#0D1117]/95 border-r border-b border-black/10 dark:border-white/15"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div
      className="absolute bottom-full left-0 right-0 pointer-events-none z-20 select-none overflow-visible translate-y-[6px] sm:translate-y-[8px]"
      aria-hidden="true"
    >
      <div
        ref={containerRef}
        style={{ left: `${MIN_X}%` }}
        className="absolute bottom-0 pointer-events-auto cursor-pointer"
        onClick={handleClick}
      >
        {/* Dynamic Ground Contact Shadow (anchors mascot to card rim) */}
        <motion.div
          className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 sm:w-11 h-2 bg-black/35 dark:bg-black/55 rounded-full blur-[1px] pointer-events-none"
          animate={{
            opacity: isJumping
              ? 0.25
              : isResting && restPosture === 'lay'
                ? 0.85
                : 0.75,
            scale: isJumping
              ? 0.6
              : isResting && restPosture === 'lay'
                ? 1.15
                : 1,
          }}
          transition={{ duration: 0.25 }}
        />

        {/* Ant Mascot Container with scroll-entrance drop, direction flip, in-motion leap & idle breathing */}
        <motion.div
          className="relative w-[66px] h-[84px] sm:w-[84px] sm:h-[106px] origin-bottom"
          initial={{ opacity: 0, y: -28, scale: 0.9 }}
          animate={{
            opacity: 1,
            scaleX: scaleX,
            scale: 1,
            y: !hasStarted
              ? 0
              : isJumping
                ? [0, -24, 0]
                : isResting && (restPosture === 'sit' || restPosture === 'lay')
                  ? [0, -2, 0]
                  : 0,
          }}
          transition={{
            opacity: { duration: 0.3 },
            scale: { type: 'spring', damping: 15, stiffness: 260 },
            y: !hasStarted
              ? { type: 'spring', damping: 14, stiffness: 240 }
              : isJumping
                ? { duration: 0.6, times: [0, 0.45, 1], ease: ['easeOut', 'easeIn'] }
                : isResting && (restPosture === 'sit' || restPosture === 'lay')
                  ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.15 },
            scaleX: { duration: 0.15 },
          }}
        >
          {/* Individual Isolated Frame (zero bleed, no sliding strip background) */}
          <Image
            src={activeSprite}
            alt="KasUbAy Ant Mascot"
            fill
            sizes="(max-width: 640px) 68px, 90px"
            className="object-contain object-bottom drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)] dark:drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
            priority
            unoptimized
          />
        </motion.div>

        {/* Minimalist Speech Bubble on Entrance, Click, Jump, Rest & Edge Stop */}
        <AnimatePresence>
          {speechBubble && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: -10, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className={`absolute -top-11 sm:-top-12 whitespace-nowrap z-30 pointer-events-none ${
                state === 'pause-right'
                  ? 'right-0 sm:right-2'
                  : state === 'pause-left'
                    ? 'left-0 sm:left-2'
                    : 'left-1/2 -translate-x-1/2'
              }`}
            >
              <div className="relative px-2.5 py-1 rounded-md bg-white/95 dark:bg-[#0D1117]/95 backdrop-blur-md border border-black/10 dark:border-white/15 text-neutral-800 dark:text-neutral-100 shadow-md text-[11px] sm:text-xs font-semibold tracking-tight">
                {speechBubble}
                <div
                  aria-hidden="true"
                  className={`absolute -bottom-1 w-2 h-2 rotate-45 bg-white/95 dark:bg-[#0D1117]/95 border-r border-b border-black/10 dark:border-white/15 ${
                    state === 'pause-right'
                      ? 'right-6 sm:right-8'
                      : state === 'pause-left'
                        ? 'left-6 sm:left-8'
                        : 'left-1/2 -translate-x-1/2'
                  }`}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
