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
  BookOpen,
  HardDriveDownload,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Palette,
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
  { href: '/management/banners', label: 'Banners', icon: Megaphone },
  { href: '/management/submissions', label: 'Polo Contest', icon: Palette },
  { href: '/management/officers', label: 'Officers', icon: Users },
  { href: '/management/events', label: 'Events & Calendar', icon: CalendarDays },
  { href: '/management/projects', label: 'Projects Showcase', icon: Code2 },
  { href: '/management/attendance', label: 'Attendance', icon: ClipboardList },
  { href: '/management/documents', label: 'Documents', icon: FolderOpen },
  { href: '/management/cbl', label: 'Constitution (CBL)', icon: BookOpen },
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
        bg-white dark:bg-[#0a0e17] border-r border-black/8 dark:border-white/6
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${collapsed ? 'w-[64px]' : 'w-[252px]'}
      `}
    >
      {/* Brand Header — Compact 48px height */}
      <div className="flex items-center justify-between px-3.5 h-12 border-b border-black/8 dark:border-white/6 flex-shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
          <Image
            src="/assets/logo/PSITS logo.png"
            alt="PSITS-UA"
            width={24}
            height={24}
            className="object-contain flex-shrink-0"
          />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="font-display font-bold text-[13px] text-slate-900 dark:text-white tracking-tight whitespace-nowrap overflow-hidden"
              >
                Management
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-black/5 dark:text-white/30 dark:hover:text-white/75 dark:hover:bg-white/[0.04] transition-colors flex-shrink-0"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation — High-density, fits all 12 items on screen without scrolling */}
      <nav className="flex-1 py-1.5 px-2 space-y-0.5 overflow-y-auto scrollbar-minimal">
        {allowedNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`
                group relative flex items-center gap-2.5 rounded-md
                transition-all duration-150
                ${collapsed ? 'px-2.5 py-1.5 justify-center' : 'px-2.5 py-1.5'}
                ${isActive
                  ? 'bg-gold/15 text-gold font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-black/5 dark:text-white/50 dark:hover:text-white/90 dark:hover:bg-white/[0.04]'
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="admin-sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-gold"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <item.icon size={15} className="flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.12 }}
                    className="text-[12.5px] font-medium whitespace-nowrap overflow-hidden leading-snug"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )
        })}
      </nav>

      {/* Compact User Footer + Quick Sign Out */}
      <div className="border-t border-black/8 dark:border-white/6 p-2 flex-shrink-0">
        {!collapsed && user ? (
          <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/[0.04]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-gold/15 text-gold text-[10px] font-bold border border-gold/25 flex items-center justify-center flex-shrink-0">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-[11.5px] font-semibold text-slate-800 dark:text-white/90 truncate leading-tight">
                  {user.displayName}
                </p>
                <p className="text-[9px] font-mono text-gold uppercase tracking-wider leading-none mt-0.5 font-semibold">
                  {user.role === 'admin' ? 'Super Admin' : 'Officer'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:text-white/30 dark:hover:text-red-400 dark:hover:bg-red-500/[0.08] rounded-md transition-colors flex-shrink-0"
            >
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            title="Sign Out"
            className="flex items-center justify-center w-full py-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:text-white/35 dark:hover:text-red-400 dark:hover:bg-red-500/[0.06] rounded-md transition-colors"
          >
            <LogOut size={14} />
          </button>
        )}
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
            className="fixed inset-0 z-[100] bg-black/40 dark:bg-black/70 backdrop-blur-sm lg:hidden"
          />
          <motion.div
            key="sidebar-drawer"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 left-0 z-[101] w-[260px] bg-white dark:bg-[#0a0e17] border-r border-black/8 dark:border-white/8 flex flex-col lg:hidden shadow-2xl"
          >
            {/* Brand */}
            <div className="flex items-center gap-2.5 px-3.5 h-12 border-b border-black/8 dark:border-white/6 flex-shrink-0">
              <Image
                src="/assets/logo/PSITS logo.png"
                alt="PSITS-UA"
                width={24}
                height={24}
                className="object-contain"
              />
              <span className="font-display font-bold text-[13px] text-slate-900 dark:text-white tracking-tight">
                Management
              </span>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
              {allowedNavItems.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + '/')

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`
                      flex items-center gap-2.5 px-2.5 py-1.5 rounded-md
                      transition-all duration-150 text-[12.5px] font-medium
                      ${isActive
                        ? 'bg-gold/15 text-gold font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-black/5 dark:text-white/50 dark:hover:text-white/90 dark:hover:bg-white/[0.04]'
                      }
                    `}
                  >
                    <item.icon size={15} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Footer */}
            <div className="border-t border-black/8 dark:border-white/6 p-2 flex-shrink-0">
              {user ? (
                <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/[0.04]">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-gold/15 text-gold text-[10px] font-bold border border-gold/25 flex items-center justify-center flex-shrink-0">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11.5px] font-semibold text-slate-800 dark:text-white/90 truncate leading-tight">
                        {user.displayName}
                      </p>
                      <p className="text-[9px] font-mono text-gold uppercase tracking-wider leading-none mt-0.5 font-semibold">
                        {user.role === 'admin' ? 'Super Admin' : 'Officer'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { logout(); onClose() }}
                    title="Sign Out"
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:text-white/30 dark:hover:text-red-400 dark:hover:bg-red-500/[0.08] rounded-md transition-colors flex-shrink-0"
                  >
                    <LogOut size={13} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { logout(); onClose() }}
                  className="flex items-center justify-center w-full py-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:text-white/35 dark:hover:text-red-400 dark:hover:bg-red-500/[0.06] rounded-md transition-colors"
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
