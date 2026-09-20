'use client'

import { useState } from 'react'
import { constitutionData, ConstitutionArticle } from '@/data/constitution'

export default function ConstitutionViewer() {
  const [openArticle, setOpenArticle] = useState<string | null>('article-2')

  const toggleArticle = (id: string) => {
    setOpenArticle(openArticle === id ? null : id)
  }

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 pt-4 pb-8 border-y border-border-theme">
        <div>
          <p className="font-mono text-xs text-amber-600 dark:text-gold font-bold tracking-wider uppercase mb-1">Fee</p>
          <p className="text-foreground-theme font-bold text-sm sm:text-base">₱25.00 / Sem</p>
        </div>
        <div>
          <p className="font-mono text-xs text-amber-600 dark:text-gold font-bold tracking-wider uppercase mb-1">Status</p>
          <p className="text-foreground-theme font-bold text-sm sm:text-base">Mandatory</p>
        </div>
        <div>
          <p className="font-mono text-xs text-amber-600 dark:text-gold font-bold tracking-wider uppercase mb-1">Meetings</p>
          <p className="text-foreground-theme font-bold text-sm sm:text-base">Monthly</p>
        </div>
        <div>
          <p className="font-mono text-xs text-amber-600 dark:text-gold font-bold tracking-wider uppercase mb-1">Fine</p>
          <p className="text-foreground-theme font-bold text-sm sm:text-base">₱100.00</p>
        </div>
        <div>
          <p className="font-mono text-xs text-amber-600 dark:text-gold font-bold tracking-wider uppercase mb-1">Elections</p>
          <p className="text-foreground-theme font-bold text-sm sm:text-base">First Mon, July</p>
        </div>
        <div>
          <p className="font-mono text-xs text-amber-600 dark:text-gold font-bold tracking-wider uppercase mb-1">Amendments</p>
          <p className="text-foreground-theme font-bold text-sm sm:text-base">¾ Member Vote</p>
        </div>
      </div>

      <div className="divide-y divide-border-theme border-y border-border-theme">
        {constitutionData.articles.map((item: ConstitutionArticle, index: number) => {
          const isOpen = openArticle === item.id
          const indexNumber = String(index + 1).padStart(2, '0')

          return (
            <div key={item.id} className="transition-colors duration-150">
              <button
                type="button"
                onClick={() => toggleArticle(item.id)}
                className="w-full py-5 sm:py-6 flex items-center justify-between gap-3 sm:gap-6 text-left cursor-pointer group"
              >
                <div className="flex items-baseline gap-3 sm:gap-8 min-w-0 flex-1">
                  <span className="font-mono text-xs text-amber-600 dark:text-gold font-bold tracking-widest shrink-0">
                    {indexNumber}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-[11px] sm:text-xs text-muted-foreground-theme font-semibold tracking-widest uppercase mr-2 sm:mr-3 inline-block">
                      {item.article}
                    </span>
                    <h3 className="inline font-display font-bold text-base sm:text-xl text-foreground-theme group-hover:text-amber-600 dark:group-hover:text-gold transition-colors break-words">
                      {item.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  {item.tag && (
                    <span className="hidden sm:inline-block font-mono text-[11px] uppercase tracking-wider text-muted-foreground-theme font-medium px-2.5 py-0.5 border border-border-theme bg-surface-theme/60 rounded">
                      {item.tag}
                    </span>
                  )}
                  <span className="font-mono text-base font-bold text-muted-foreground-theme group-hover:text-amber-600 dark:group-hover:text-gold transition-colors shrink-0">
                    {isOpen ? '—' : '+'}
                  </span>
                </div>
              </button>

              {isOpen && (
                <div className="pb-8 pt-2 pl-8 sm:pl-16 pr-4 space-y-5 text-foreground-theme/90 text-sm sm:text-base leading-relaxed">
                  {item.sections.map((sec, idx) => (
                    <div key={idx} className="space-y-1.5">
                      {sec.number && (
                        <p className="font-mono text-xs sm:text-sm text-amber-600 dark:text-gold font-bold tracking-wide uppercase">
                          {sec.number}
                        </p>
                      )}
                      {Array.isArray(sec.content) ? (
                        <ul className="space-y-2 pl-4 list-disc marker:text-gold">
                          {sec.content.map((point, pIdx) => (
                            <li key={pIdx} className="text-foreground-theme/90 font-normal leading-relaxed">
                              {point}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-foreground-theme/90 font-normal leading-relaxed">
                          {sec.content}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
