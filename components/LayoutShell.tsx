'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CookieConsent from '@/components/CookieConsent'
import MaintenanceWrapper from '@/components/MaintenanceWrapper'
import AuthRedirectHandler from '@/components/AuthRedirectHandler'
import SiteSplashSkeleton from '@/components/SiteSplashSkeleton'

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isCleanRoute = pathname.startsWith('/management')

  if (isCleanRoute) {
    return <>{children}</>
  }

  return (
    <MaintenanceWrapper>
      <SiteSplashSkeleton />
      <AuthRedirectHandler />
      <Navbar />
      <main>{children}</main>
      {/* On community routes, hide the static footer on mobile so the feed feels like a native social app */}
      <div className={pathname.startsWith('/community') ? 'hidden sm:block' : ''}>
        <Footer />
      </div>
      <CookieConsent />
    </MaintenanceWrapper>
  )
}
