import { FileText } from 'lucide-react'
import type { ReactNode } from 'react'

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/8 flex items-center justify-center mb-5">
        {icon || <FileText size={24} className="text-slate-400 dark:text-white/20" />}
      </div>
      <h3 className="font-display font-bold text-lg text-foreground-theme mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground-theme max-w-sm mb-6 leading-relaxed">{description}</p>
      {action}
    </div>
  )
}
