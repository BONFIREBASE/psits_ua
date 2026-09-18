'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from './_context/auth-context'
import { ToastProvider } from './_components/Toast'
import AdminSidebar, { MobileSidebar } from './_components/AdminSidebar'
import AdminTopbar from './_components/AdminTopbar'
import { ManagementShellSkeleton } from './_components/SkeletonPreloader'

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const pathname = usePathname()

  // Login page at /management is always accessible
  if (pathname === '/management') {
    return <>{children}</>
  }

  if (isLoading) {
    return <ManagementShellSkeleton />
  }

  if (!isAuthenticated) {
    return <RedirectToLogin />
  }

  return <>{children}</>
}

function RedirectToLogin() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/management')
  }, [router])
  return <ManagementShellSkeleton />
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Don't show admin shell on login page
  if (pathname === '/management' || !isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-[#0a0e17]">
      <AdminSidebar />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar onMenuToggle={() => setMobileOpen((o) => !o)} />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AuthGate>
          <AdminShell>{children}</AdminShell>
        </AuthGate>
      </ToastProvider>
    </AuthProvider>
  )
}
