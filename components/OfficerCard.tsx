import type { Officer } from '@/data/officers'

export default function OfficerCard({
  officer,
  featured = false,
}: {
  officer: Officer
  featured?: boolean
}) {
  return (
    <div
      className={`border p-5 sm:p-6 transition-colors bg-surface/80 hover:bg-surface space-y-3 ${
        featured
          ? 'border-gold/50 border-l-2 border-l-gold shadow-sm'
          : 'border-black/8 dark:border-white/10 hover:border-gold/40 dark:hover:border-white/20'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-gold font-bold uppercase tracking-wider">
          {officer.position}
        </span>
        <span className="font-mono text-[10px] text-slate-500 dark:text-white/60 uppercase tracking-widest border border-black/10 dark:border-white/10 px-2 py-0.5">
          {officer.department}
        </span>
      </div>

      <h3
        className={`font-display font-bold text-slate-900 dark:text-white leading-tight ${
          featured ? 'text-xl sm:text-2xl' : 'text-lg'
        }`}
      >
        {officer.name}
      </h3>
    </div>
  )
}
