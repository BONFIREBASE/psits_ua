import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  htmlFor?: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
}

export default function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block font-mono text-[11px] text-slate-600 dark:text-white/60 uppercase tracking-[0.1em] font-semibold"
      >
        {label}
        {required && <span className="text-red-500 dark:text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[11px] text-slate-500 dark:text-white/30 leading-relaxed">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] text-red-500 dark:text-red-400 font-medium">{error}</p>
      )}
    </div>
  )
}

/* Shared input class for consistency */
export const inputStyles =
  'w-full bg-slate-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/25 outline-none transition-all duration-200 focus:border-gold/50 focus:ring-1 focus:ring-gold/20 hover:border-black/20 dark:hover:border-white/20'

export const textareaStyles =
  'w-full bg-slate-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/25 outline-none transition-all duration-200 focus:border-gold/50 focus:ring-1 focus:ring-gold/20 hover:border-black/20 dark:hover:border-white/20 resize-y min-h-[100px]'
