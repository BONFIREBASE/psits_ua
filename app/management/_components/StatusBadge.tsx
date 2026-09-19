export type StatusType =
  | 'Draft'
  | 'Published'
  | 'Approved'
  | 'Pending'
  | 'Scheduled'
  | 'Completed'
  | 'Postponed'
  | 'Cancelled'
  | 'Active'
  | 'In Development'
  | 'Archived'

export default function StatusBadge({
  status,
}: {
  status: StatusType
}) {
  const styles: Record<string, string> = {
    Draft: 'bg-black/5 dark:bg-white/8 text-slate-600 dark:text-white/50 border-black/10 dark:border-white/10',
    Published: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    Approved: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
    Pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
    Scheduled: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25',
    Completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    Postponed: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
    Cancelled: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
    Active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    'In Development': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
    Archived: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25',
  }

  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 rounded text-[10px]
        font-mono font-bold uppercase tracking-wider border
        ${styles[status] || styles.Draft}
      `}
    >
      {status}
    </span>
  )
}
