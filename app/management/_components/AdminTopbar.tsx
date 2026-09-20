'use client'

import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

const breadcrumbMap: Record<string, string> = {
  '/management/dashboard': 'Dashboard',
  '/management/blog': 'Blog / Dispatches',
  '/management/blog/new': 'New Post',
  '/management/banners': 'Banners',
  '/management/officers': 'Officers',
  '/management/events': 'Events & Calendar',
  '/management/projects': 'Projects Showcase',
  '/management/audit': 'Audit Reports',
  '/management/treasury': 'Treasury',
  '/management/documents': 'Documents',
  '/management/backup': 'Data & Backup',
}

export default function AdminTopbar({
  onMenuToggle,
}: {
  onMenuToggle: () => void
}) {
  const pathname = usePathname()
  const title = breadcrumbMap[pathname] || 'Management'

  const segments = pathname.split('/').filter(Boolean)
  const crumbs = segments.slice(1).map((seg, i) => {
    const path = '/' + segments.slice(0, i + 2).join('/')
    return {
      label: breadcrumbMap[path] || seg.charAt(0).toUpperCase() + seg.slice(1),
      path,
    }
  })

  return (
    <header className="sticky top-0 z-40 h-14 flex items-center justify-between gap-4 px-4 sm:px-6 bg-white/85 dark:bg-[#0a0e17]/80 backdrop-blur-xl border-b border-black/8 dark:border-white/6 transition-colors duration-200">
      <div className="flex items-center gap-4 min-w-0">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <nav className="flex items-center gap-1.5 text-[12px] font-mono truncate">
          {crumbs.map((crumb, i) => (
            <span key={crumb.path} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-slate-300 dark:text-white/15">/</span>}
              <span
                className={
                  i === crumbs.length - 1
                    ? 'text-slate-900 dark:text-white/80 font-semibold'
                    : 'text-slate-400 dark:text-white/30'
                }
              >
                {crumb.label}
              </span>
            </span>
          ))}
          {crumbs.length === 0 && (
            <span className="text-slate-900 dark:text-white/80 font-semibold">{title}</span>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <ThemeToggle size={18} />
      </div>
    </header>
  )
}
