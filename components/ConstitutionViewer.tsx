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
      {/* Minimalist Key Metric Track */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 pt-4 pb-8 border-y border-white/10">
        <div>
          <p className="font-mono text-xs text-gold font-bold tracking-wider uppercase mb-1">Fee</p>
          <p className="text-white font-bold text-sm sm:text-base">₱25.00 / Sem</p>
        </div>
        <div>
          <p className="font-mono text-xs text-gold font-bold tracking-wider uppercase mb-1">Status</p>
          <p className="text-white font-bold text-sm sm:text-base">Mandatory</p>
        </div>
        <div>
          <p className="font-mono text-xs text-gold font-bold tracking-wider uppercase mb-1">Meetings</p>
          <p className="text-white font-bold text-sm sm:text-base">Monthly</p>
        </div>
        <div>
          <p className="font-mono text-xs text-gold font-bold tracking-wider uppercase mb-1">Fine</p>
          <p className="text-white font-bold text-sm sm:text-base">₱100.00</p>
        </div>
        <div>
          <p className="font-mono text-xs text-gold font-bold tracking-wider uppercase mb-1">Elections</p>
          <p className="text-white font-bold text-sm sm:text-base">First Mon, July</p>
        </div>
        <div>
          <p className="font-mono text-xs text-gold font-bold tracking-wider uppercase mb-1">Amendments</p>
          <p className="text-white font-bold text-sm sm:text-base">¾ Member Vote</p>
        </div>
      </div>

      {/* Editorial Hairline Accordion */}
      <div className="divide-y divide-white/10 border-y border-white/10">
        {constitutionData.articles.map((item: ConstitutionArticle, index: number) => {
          const isOpen = openArticle === item.id
          const indexNumber = String(index + 1).padStart(2, '0')

          return (
            <div key={item.id} className="transition-colors duration-150">
              <button
                type="button"
                onClick={() => toggleArticle(item.id)}
                className="w-full py-6 flex items-center justify-between gap-6 text-left cursor-pointer group"
              >
                <div className="flex items-baseline gap-4 sm:gap-8">
                  <span className="font-mono text-xs text-gold font-bold tracking-widest">
                    {indexNumber}
                  </span>
                  <div>
                    <span className="font-mono text-xs text-white/70 font-semibold tracking-widest uppercase mr-3">
                      {item.article}
                    </span>
                    <h3 className="inline-block font-display font-bold text-lg sm:text-xl text-white group-hover:text-gold transition-colors">
                      {item.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {item.tag && (
                    <span className="hidden sm:inline-block font-mono text-[11px] uppercase tracking-wider text-white/80 font-medium px-2.5 py-0.5 border border-white/15 bg-white/5 rounded">
                      {item.tag}
                    </span>
                  )}
                  <span className="font-mono text-base font-bold text-white/70 group-hover:text-gold transition-colors">
                    {isOpen ? '—' : '+'}
                  </span>
                </div>
              </button>

              {isOpen && (
                <div className="pb-8 pt-2 pl-8 sm:pl-16 pr-4 space-y-5 text-white/90 text-sm sm:text-base leading-relaxed">
                  {item.sections.map((sec, idx) => (
                    <div key={idx} className="space-y-1.5">
                      {sec.number && (
                        <p className="font-mono text-xs sm:text-sm text-gold font-bold tracking-wide uppercase">
                          {sec.number}
                        </p>
                      )}
                      {Array.isArray(sec.content) ? (
                        <ul className="space-y-2 pl-4 list-disc marker:text-gold">
                          {sec.content.map((point, pIdx) => (
                            <li key={pIdx} className="text-white/90 font-normal leading-relaxed">
                              {point}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-white/90 font-normal leading-relaxed">
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
