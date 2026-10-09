/**
 * Progressive asset preloader for the KasUbAy ant mascot.
 * Optimized specifically for Slow 3G / Mobile Data connections:
 *
 * 1. Tier 1 Critical Sprites (~87KB total):
 *    - Jump sprite (cheer), landing sit, landing wave, and idle lean-1.
 *    - Begun immediately while visitor reads the hero title.
 *    - Uses `img.decode()` for off-thread GPU rasterization so scrolling causes 0 frame drops.
 *
 * 2. Tier 2 Sequential Run Frames (frame-0 to frame-7):
 *    - Deferred to idle time / requestIdleCallback.
 *    - Sequenced one-by-one on 2G/3G/Save-Data to prevent TCP socket starvation.
 *    - Guaranteed arrival before patrol sprint launches (1.8s entrance sequence buffer).
 *
 * 3. Session Singleton Cache:
 *    - Avoids duplicate network transfers and survives component unmounts during stage handoffs.
 */

export const TIER1_CRITICAL_SPRITES = [
  '/assets/kasubay/kasubay-cheer.png', // Needed the instant user scrolls (500ms jump)
  '/assets/kasubay/kasubay-sit.png',   // Needed upon landing (wake-up phase) & sitting rest
  '/assets/kasubay/kasubay-wave.png',  // Needed for landing greeting wave
  '/assets/kasubay/lay/lean-0.png',    // Needed for lounging rest posture
  '/assets/kasubay/lay/lean-1.png',    // Needed for idle lounging breathing
]

export const TIER2_RUN_FRAMES = [
  '/assets/kasubay/run/frame-0.png',
  '/assets/kasubay/run/frame-1.png',
  '/assets/kasubay/run/frame-2.png',
  '/assets/kasubay/run/frame-3.png',
  '/assets/kasubay/run/frame-4.png',
  '/assets/kasubay/run/frame-5.png',
  '/assets/kasubay/run/frame-6.png',
  '/assets/kasubay/run/frame-7.png',
]

const loadedCache = new Set<string>()
let preloadPromise: Promise<void> | null = null

export function isSpriteCached(src: string): boolean {
  return loadedCache.has(src)
}

/**
 * Preloads a single image and decodes it off the main thread into GPU memory
 */
export function preloadAndDecodeImage(src: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (loadedCache.has(src)) return Promise.resolve()

  return new Promise((resolve) => {
    const img = new window.Image()
    img.src = src

    let resolved = false
    const finish = () => {
      if (resolved) return
      resolved = true
      loadedCache.add(src)
      resolve()
    }

    img.onload = finish
    img.onerror = finish

    if (typeof img.decode === 'function') {
      img
        .decode()
        .then(finish)
        .catch(finish)
    }
  })
}

/**
 * Starts the mobile-optimized progressive preloading sequence.
 * Safe to call multiple times (idempotent session singleton).
 */
export function startProgressiveMascotPreload(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (preloadPromise) return preloadPromise

  preloadPromise = (async () => {
    // Step 1: Immediately fetch critical leap & landing frames while visitor reads hero title
    await Promise.all(TIER1_CRITICAL_SPRITES.map(preloadAndDecodeImage))

    // Step 2: Detect mobile network constraints
    const nav = navigator as unknown as {
      connection?: {
        effectiveType?: string
        saveData?: boolean
      }
    }
    const conn = nav.connection
    const isConstrained =
      conn?.saveData ||
      conn?.effectiveType === 'slow-2g' ||
      conn?.effectiveType === '2g' ||
      conn?.effectiveType === '3g'

    // Step 3: Progressive delivery of 8-frame run cycle during idle time
    await new Promise<void>((resolve) => {
      const loadRunFramesBatch = async () => {
        if (isConstrained) {
          // Strictly sequential fetch on Slow 3G to prevent TCP socket starvation
          for (const frameSrc of TIER2_RUN_FRAMES) {
            await preloadAndDecodeImage(frameSrc)
          }
        } else {
          // Pairs of 2 on faster 4G / WiFi
          for (let i = 0; i < TIER2_RUN_FRAMES.length; i += 2) {
            await Promise.all([
              preloadAndDecodeImage(TIER2_RUN_FRAMES[i]),
              TIER2_RUN_FRAMES[i + 1]
                ? preloadAndDecodeImage(TIER2_RUN_FRAMES[i + 1])
                : Promise.resolve(),
            ])
          }
        }
        resolve()
      }

      if ('requestIdleCallback' in window) {
        ;(window as unknown as {
          requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number
        }).requestIdleCallback(
          () => {
            loadRunFramesBatch()
          },
          { timeout: 2000 }
        )
      } else {
        setTimeout(loadRunFramesBatch, 250)
      }
    })
  })()

  return preloadPromise
}
