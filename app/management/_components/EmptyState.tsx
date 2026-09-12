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
      <div className="w-14 h-14 rounded-xl bg-white/[0.04] border border-white/8 flex items-center justify-center mb-5">
        {icon || <FileText size={24} className="text-white/20" />}
      </div>
      <h3 className="font-display font-bold text-lg text-white/80 mb-2">{title}</h3>
      <p className="text-sm text-white/40 max-w-sm mb-6 leading-relaxed">{description}</p>
      {action}
    </div>
  )
}
