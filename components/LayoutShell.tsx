'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CookieConsent from '@/components/CookieConsent'
import MaintenanceWrapper from '@/components/MaintenanceWrapper'
import AuthRedirectHandler from '@/components/AuthRedirectHandler'

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isCleanRoute = pathname.startsWith('/management') || pathname.startsWith('/camera')

  if (isCleanRoute) {
    return <>{children}</>
  }

  return (
    <MaintenanceWrapper>
      <AuthRedirectHandler />
      <Navbar />
      <main>{children}</main>
      <Footer />
      <CookieConsent />
    </MaintenanceWrapper>
  )
}
