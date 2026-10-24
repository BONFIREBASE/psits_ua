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

    const targetPath = target.split('?')[0]

    // Clean up storage if user has already arrived at the target route
    if (pathname === targetPath) {
      sessionStorage.removeItem('psits_auth_redirect')
      localStorage.removeItem('psits_auth_redirect')
      return
    }

    const hash = window.location.hash || ''
    const search = window.location.search || ''
    const hasAuthParams =
      hash.includes('access_token=') ||
      hash.includes('error=') ||
      search.includes('code=') ||
      search.includes('error=')

    // If an OAuth payload arrives at the home page or a public route while targeting another route
    if (pathname !== targetPath && (hasAuthParams || pathname === '/')) {
      sessionStorage.removeItem('psits_auth_redirect')
      localStorage.removeItem('psits_auth_redirect')

      // Forward immediately to target with original hash/search safely merged
      let destination = target
      if (search) {
        const cleanSearch = search.replace(/^\?/, '')
        if (cleanSearch) {
          destination += (destination.includes('?') ? '&' : '?') + cleanSearch
        }
      }
      if (hash) {
        destination += hash
      }

      window.location.replace(destination)
    }
  }, [pathname])

  return null
}
