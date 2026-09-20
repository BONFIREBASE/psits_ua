'use client'

import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string
          callback?: (token: string) => void
          'error-callback'?: (errorCode: string) => void
          'expired-callback'?: () => void
          theme?: 'light' | 'dark' | 'auto'
          size?: 'normal' | 'compact' | 'flexible'
          action?: string
        }
      ) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
    onloadTurnstileCallback?: () => void
  }
}

export interface TurnstileWidgetHandle {
  reset: () => void
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: (error: string) => void
  action?: string
  className?: string
  resetKey?: number | string
  size?: 'normal' | 'compact' | 'flexible'
}

const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget(
    {
      onVerify,
      onExpire,
      onError,
      action = 'login',
      className = '',
      resetKey,
      size = 'normal',
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<string | null>(null)
    const [scriptLoaded, setScriptLoaded] = useState(false)
    const [hasError, setHasError] = useState(false)

    // Store callbacks in refs to prevent re-rendering/destroying widget on parent keystrokes
    const onVerifyRef = useRef(onVerify)
    const onExpireRef = useRef(onExpire)
    const onErrorRef = useRef(onError)

    useEffect(() => {
      onVerifyRef.current = onVerify
      onExpireRef.current = onExpire
      onErrorRef.current = onError
    })

    // User's registered Turnstile Site Key with fallback
    const siteKey =
      process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ||
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
      '0x4AAAAAAE7aRIDPE76zqVQq'

    // Expose reset API to parent components
    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.reset(widgetIdRef.current)
          } catch {}
        }
      },
    }))

    // Respond to external resetKey triggers
    useEffect(() => {
      if (resetKey !== undefined && widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current)
        } catch {}
      }
    }, [resetKey])

    // 1. Inject Cloudflare script if not present
    useEffect(() => {
      if (typeof window === 'undefined') return

      if (window.turnstile) {
        setScriptLoaded(true)
        return
      }

      const scriptId = 'cf-turnstile-script'
      let script = document.getElementById(scriptId) as HTMLScriptElement | null

      if (!script) {
        script = document.createElement('script')
        script.id = scriptId
        script.src =
          'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit'
        script.async = true
        script.defer = true
        document.head.appendChild(script)
      }

      window.onloadTurnstileCallback = () => {
        setScriptLoaded(true)
      }

      // Safety polling check in case script was already in cache
      const interval = setInterval(() => {
        if (window.turnstile) {
          setScriptLoaded(true)
          clearInterval(interval)
        }
      }, 200)

      return () => clearInterval(interval)
    }, [])

    // 2. Render Turnstile widget once when ready (STABLE: does NOT re-run on callback changes)
    useEffect(() => {
      if (!scriptLoaded || !containerRef.current || !window.turnstile) return

      // Clean up previous widget instance if any
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {}
        widgetIdRef.current = null
      }

      // Clean container DOM to prevent duplicate iframe glitches
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }

      try {
        setHasError(false)
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'dark',
          size,
          action,
          callback: (token: string) => {
            setHasError(false)
            onVerifyRef.current(token)
          },
          'expired-callback': () => {
            onExpireRef.current?.()
          },
          'error-callback': (err: string) => {
            console.warn('[Cloudflare Turnstile] Challenge error:', err)
            setHasError(true)
            onErrorRef.current?.(err)
          },
        })
        widgetIdRef.current = id
      } catch (err) {
        console.warn('Turnstile render error:', err)
        setHasError(true)
      }

      return () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current)
          } catch {}
          widgetIdRef.current = null
        }
      }
    }, [scriptLoaded, siteKey, action, size])

    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <div
          ref={containerRef}
          className="min-h-[65px] min-w-[300px] flex items-center justify-center overflow-hidden rounded-xl"
        />
        {hasError && (
          <div className="mt-2 text-center">
            <p className="text-[11px] font-mono text-amber-400 mb-1.5">
              Verification failed or blocked by browser shields.
            </p>
            <button
              type="button"
              onClick={() => {
                if (widgetIdRef.current && window.turnstile) {
                  window.turnstile.reset(widgetIdRef.current)
                  setHasError(false)
                }
              }}
              className="text-[10px] font-mono text-gold hover:underline"
            >
              Click to retry challenge
            </button>
          </div>
        )}
      </div>
    )
  }
)

export default TurnstileWidget
