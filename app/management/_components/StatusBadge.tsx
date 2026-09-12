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

export default function StatusBadge({
  status,
}: {
  status: StatusType
}) {
  const styles: Record<string, string> = {
    Draft: 'bg-white/8 text-white/50 border-white/10',
    Published: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Scheduled: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    Completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Postponed: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    Active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'In Development': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
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
