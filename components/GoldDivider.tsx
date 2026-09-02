import clsx from 'clsx'

export default function GoldDivider({ className }: { className?: string }) {
  return (
    <div className={clsx('flex items-center gap-4', className)}>
      <div className="flex-1 h-px bg-white/5" />
      <div className="w-2 h-2 bg-gold rounded-full opacity-60" />
      <div className="flex-1 h-px bg-white/5" />
    </div>
  )
}
