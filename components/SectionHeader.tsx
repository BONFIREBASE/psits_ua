interface SectionHeaderProps {
  eyebrow: string
  title: string
  subtitle?: string
}

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: SectionHeaderProps) {
  return (
    <div>
      <p className="text-gold text-sm font-medium tracking-wide mb-3">
        {eyebrow}
      </p>
      <h1 className="font-display font-extrabold text-h1 text-white gold-underline mb-4">
        {title}
      </h1>
      {subtitle && (
        <p className="text-muted text-lg max-w-xl mt-6 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  )
}
