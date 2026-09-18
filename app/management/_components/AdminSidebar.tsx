'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FileEdit,
  Users,
  CalendarDays,
  Code2,
  ClipboardCheck,
  ClipboardList,
  Landmark,
  FolderOpen,
  HardDriveDownload,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../_context/auth-context'

interface NavItem {
  href: string
  label: string
  icon: typeof LayoutDashboard
  roles?: ('admin' | 'officer')[]
}

const navItems: NavItem[] = [
  { href: '/management/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/management/blog', label: 'Blog / Dispatches', icon: FileEdit },
  { href: '/management/officers', label: 'Officers', icon: Users },
  { href: '/management/events', label: 'Events & Calendar', icon: CalendarDays },
  { href: '/management/projects', label: 'Projects Showcase', icon: Code2 },
  { href: '/management/attendance', label: 'Attendance', icon: ClipboardList },
  { href: '/management/documents', label: 'Documents', icon: FolderOpen },
  { href: '/management/treasury', label: 'Treasury', icon: Landmark, roles: ['admin'] },
  { href: '/management/audit', label: 'Audit Reports', icon: ClipboardCheck, roles: ['admin'] },
  { href: '/management/backup', label: 'Data & Backup', icon: HardDriveDownload, roles: ['admin'] },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const allowedNavItems = navItems.filter((item) => {
    if (!item.roles) return true
    if (!user) return true
    return item.roles.includes(user.role)
  })

  return (
    <aside
      className={`
        hidden lg:flex flex-col flex-shrink-0
        h-screen sticky top-0
        bg-[#0a0e17] border-r border-white/6
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${collapsed ? 'w-[68px]' : 'w-[260px]'}
      `}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-white/6 flex-shrink-0">
        <Image
          src="/assets/logo/PSITS logo.png"
          alt="PSITS-UA"
          width={28}
          height={28}
          className="object-contain flex-shrink-0"
        />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="font-display font-bold text-[14px] text-white tracking-tight whitespace-nowrap overflow-hidden"
            >
              Management
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-minimal">
        {allowedNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`
                group relative flex items-center gap-3 rounded-lg
                transition-all duration-200
                ${collapsed ? 'px-3 py-2.5 justify-center' : 'px-3 py-2.5'}
                ${isActive
                  ? 'bg-gold/10 text-gold'
                  : 'text-white/45 hover:text-white/80 hover:bg-white/[0.04]'
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="admin-sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gold"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <item.icon size={18} className="flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-[13px] font-medium whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )
        })}
      </nav>

      {/* Footer: User + Collapse */}
      <div className="border-t border-white/6 p-2 space-y-1 flex-shrink-0">
        {!collapsed && user && (
          <div className="px-3 py-2 space-y-1">
            <div className="flex items-center justify-between">
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  user.role === 'admin'
                    ? 'bg-gold/15 text-gold border border-gold/25'
                    : 'bg-sky-400/15 text-sky-400 border border-sky-400/25'
                }`}
              >
                {user.role === 'admin' ? 'Super Admin' : 'Officer'}
              </span>
            </div>
            <p className="text-xs text-white/90 font-semibold truncate">
              {user.displayName}
            </p>
            {user.position && (
              <p className="text-[10px] text-white/45 truncate">
                {user.position}
              </p>
            )}
            <p className="text-[10px] text-white/30 font-mono truncate">
              {user.email}
            </p>
          </div>
        )}

        <button
          onClick={logout}
          title="Sign out"
          className={`
            flex items-center gap-3 rounded-lg w-full
            text-white/35 hover:text-red-400 hover:bg-red-500/[0.06]
            transition-all duration-200
            ${collapsed ? 'px-3 py-2.5 justify-center' : 'px-3 py-2.5'}
          `}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && (
            <span className="text-[13px] font-medium">Sign Out</span>
          )}
        </button>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-center w-full py-2 text-white/20 hover:text-white/50 transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  )
}

/* ── Mobile Sidebar (Drawer) ── */

export function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const allowedNavItems = navItems.filter((item) => {
    if (!item.roles) return true
    if (!user) return true
    return item.roles.includes(user.role)
  })

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm lg:hidden"
          />
          <motion.div
            key="sidebar-drawer"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 left-0 z-[101] w-[270px] bg-[#0a0e17] border-r border-white/8 flex flex-col lg:hidden"
          >
            {/* Brand */}
            <div className="flex items-center gap-2.5 px-4 h-16 border-b border-white/6">
              <Image
                src="/assets/logo/PSITS logo.png"
                alt="PSITS-UA"
                width={28}
                height={28}
                className="object-contain"
              />
              <span className="font-display font-bold text-[14px] text-white tracking-tight">
                Management
              </span>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
              {allowedNavItems.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + '/')

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg
                      transition-all duration-200 text-[13px] font-medium
                      ${isActive
                        ? 'bg-gold/10 text-gold'
                        : 'text-white/45 hover:text-white/80 hover:bg-white/[0.04]'
                      }
                    `}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Footer */}
            <div className="border-t border-white/6 p-3 space-y-2">
              {user && (
                <div className="px-1 space-y-0.5">
                  <span
                    className={`inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      user.role === 'admin'
                        ? 'bg-gold/15 text-gold border border-gold/25'
                        : 'bg-sky-400/15 text-sky-400 border border-sky-400/25'
                    }`}
                  >
                    {user.role === 'admin' ? 'Super Admin' : 'Officer'}
                  </span>
                  <p className="text-xs text-white/90 font-semibold truncate">
                    {user.displayName}
                  </p>
                  <p className="text-[10px] text-white/40 font-mono truncate">
                    {user.email}
                  </p>
                </div>
              )}
              <button
                onClick={() => { logout(); onClose() }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg w-full text-white/35 hover:text-red-400 hover:bg-red-500/[0.06] transition-all duration-200 text-[13px] font-medium"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
