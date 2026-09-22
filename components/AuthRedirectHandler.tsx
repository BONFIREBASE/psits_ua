'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function AuthRedirectHandler() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const target =
      sessionStorage.getItem('psits_auth_redirect') ||
      localStorage.getItem('psits_auth_redirect')

    if (!target) return

    const hash = window.location.hash || ''
    const search = window.location.search || ''
    const hasAuthParams =
      hash.includes('access_token=') ||
      hash.includes('error=') ||
      search.includes('code=') ||
      search.includes('error=')

    // If an OAuth payload arrives at the home page or a public route while targeting management
    if (pathname !== target && (hasAuthParams || pathname === '/')) {
      sessionStorage.removeItem('psits_auth_redirect')
      localStorage.removeItem('psits_auth_redirect')

      // Forward immediately to management target with original hash/search intact
      const destination = `${target}${search}${hash}`
      window.location.replace(destination)
    }
  }, [pathname])

  return null
}
