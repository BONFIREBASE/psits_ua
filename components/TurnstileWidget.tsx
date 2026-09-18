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
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<string | null>(null)
    const [scriptLoaded, setScriptLoaded] = useState(false)

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
      if (resetKey && widgetIdRef.current && window.turnstile) {
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

      // Safety fallback check in case script was cached
      const interval = setInterval(() => {
        if (window.turnstile) {
          setScriptLoaded(true)
          clearInterval(interval)
        }
      }, 200)

      return () => clearInterval(interval)
    }, [])

    // 2. Render Turnstile widget when script is ready
    useEffect(() => {
      if (!scriptLoaded || !containerRef.current || !window.turnstile) return

      // Clean up previous widget instance if any
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {}
        widgetIdRef.current = null
      }

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'dark',
          size: 'flexible',
          action,
          callback: (token: string) => {
            onVerify(token)
          },
          'expired-callback': () => {
            if (onExpire) onExpire()
          },
          'error-callback': (err: string) => {
            if (onError) onError(err)
          },
        })
        widgetIdRef.current = id
      } catch (err) {
        console.warn('Turnstile render error:', err)
      }

      return () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current)
          } catch {}
          widgetIdRef.current = null
        }
      }
    }, [scriptLoaded, siteKey, action, onVerify, onExpire, onError])

    return (
      <div
        ref={containerRef}
        className={`min-h-[65px] flex items-center justify-center overflow-hidden rounded-xl ${className}`}
      />
    )
  }
)

export default TurnstileWidget
