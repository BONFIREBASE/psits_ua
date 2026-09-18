'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Info } from 'lucide-react'
import type { BannerRow } from '@/lib/supabase'

interface BannerCardProps {
  banner: BannerRow
  isActive?: boolean
  onClick?: () => void
}

export default function BannerCard({ banner, isActive = true, onClick }: BannerCardProps) {
  const [showCredit, setShowCredit] = useState(false)

  // Parse optional creator credit embedded from management
  const creditMatch = banner.subtitle?.match(/\[by:(.*?)\]/)
  const creditName = creditMatch ? creditMatch[1].trim() : null
  const cleanSubtitle = banner.subtitle ? banner.subtitle.replace(/\[by:.*?\]/, '').trim() : ''

  return (
    <div
      onClick={onClick}
      className={`relative w-full h-full min-h-[390px] sm:min-h-[420px] md:min-h-[450px] rounded-3xl overflow-hidden border transition-all duration-500 group select-none ${
        isActive
          ? 'border-white/20 bg-[#070A11] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.95)] ring-1 ring-white/10'
          : 'border-white/15 bg-[#0a0e17] shadow-[0_15px_40px_-10px_rgba(0,0,0,0.85)] hover:border-gold/40 cursor-pointer'
      }`}
    >
      {/* ─── Luminous Top Rim Highlight (Defines card edge in 3D space) ─── */}
      <div
        className={`absolute top-0 inset-x-0 h-[2px] pointer-events-none z-30 transition-opacity duration-500 ${
          isActive
            ? 'bg-gradient-to-r from-transparent via-gold/80 to-transparent opacity-95'
            : 'bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-60 group-hover:opacity-100'
        }`}
      />

      {/* ─── Thumbnail Image Canvas (Responsive mobile & desktop presentation) ─── */}
      {banner.image_url ? (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner.image_url}
            alt={banner.title}
            className="w-full h-full object-cover object-top sm:object-center transition-transform duration-700 group-hover:scale-[1.02]"
          />
        </div>
      ) : (
        /* Text-only fallback background */
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-gradient-to-br from-[#0c121e] via-[#090d16] to-[#05070c]" />
      )}

      {/* ─── Minimalist Standalone Info Icon with Micro Tooltip ─── */}
      {banner.image_url && (
        <div className="absolute top-4 left-5 z-30">
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowCredit((prev) => !prev)
              }}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-black/50 hover:bg-black/80 active:scale-95 backdrop-blur-md border border-white/15 text-white/70 hover:text-white transition-all shadow-md cursor-pointer"
              title="Artwork credit"
              aria-label="Thumbnail creator credit"
            >
              <Info size={13} className="text-gold" />
            </button>

            {/* Minimalist Micro Tooltip */}
            {showCredit && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 top-full mt-1.5 z-50 px-3 py-1.5 rounded-lg bg-[#0d1117]/95 backdrop-blur-md border border-white/15 shadow-2xl text-[11px] font-mono text-white whitespace-nowrap animate-in fade-in zoom-in-95 duration-150"
              >
                <span className="text-white/50">Artwork: </span>
                <span className="text-gold font-semibold">{creditName || 'PSITS Pubmat'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Inactive Back Card Hint ─── */}
      {!isActive && (
        <div className="absolute top-4 right-5 z-20 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-mono tracking-widest uppercase text-white/70 font-bold bg-[#0D1117]/90 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-md">
            Preview
          </span>
        </div>
      )}

      {/* ─── Bottom Dock (Aesthetic soft gradient, zero harsh blur lines) ─── */}
      <div className="absolute bottom-0 inset-x-0 z-20 px-4 sm:px-8 md:px-10 pb-4 sm:pb-5 pt-8 sm:pt-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 md:gap-8">
        {/* Left: Title & Subtitle */}
        <div className="flex-1 max-w-2xl">
          <h2 className="font-display font-black text-lg sm:text-2xl md:text-3xl lg:text-[32px] text-white leading-[1.18] tracking-tight mb-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            {banner.title}
          </h2>

          {cleanSubtitle && (
            <p className="text-white/85 text-[12px] sm:text-sm md:text-[14px] leading-relaxed font-normal drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)] line-clamp-1 sm:line-clamp-2 max-w-xl">
              {cleanSubtitle}
            </p>
          )}
        </div>

        {/* Right (Side): Action CTAs */}
        {(banner.link_text || banner.secondary_link_text) && (
          <div
            className={`flex-shrink-0 flex items-center gap-2 sm:gap-3.5 ${
              !isActive ? 'pointer-events-none' : ''
            }`}
          >
            {banner.link_text && (
              banner.link_url ? (
                banner.link_url.startsWith('http') ? (
                  <a
                    href={banner.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-gold to-[#FFA726] text-slate-950 font-mono font-bold text-xs sm:text-sm hover:shadow-[0_4px_24px_rgba(245,166,35,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md cursor-pointer"
                  >
                    <span>{banner.link_text}</span>
                    <ArrowUpRight size={14} className="sm:w-[15px] sm:h-[15px]" />
                  </a>
                ) : (
                  <Link
                    href={banner.link_url}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-gold to-[#FFA726] text-slate-950 font-mono font-bold text-xs sm:text-sm hover:shadow-[0_4px_24px_rgba(245,166,35,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md cursor-pointer"
                  >
                    <span>{banner.link_text}</span>
                    <ArrowUpRight size={14} className="sm:w-[15px] sm:h-[15px]" />
                  </Link>
                )
              ) : (
                <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-gold to-[#FFA726] text-slate-950 font-mono font-bold text-xs sm:text-sm shadow-md cursor-default">
                  <span>{banner.link_text}</span>
                  <ArrowUpRight size={14} className="sm:w-[15px] sm:h-[15px]" />
                </span>
              )
            )}

            {banner.secondary_link_text && (
              banner.secondary_link_url ? (
                banner.secondary_link_url.startsWith('http') ? (
                  <a
                    href={banner.secondary_link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 hover:border-white/30 text-white/90 hover:text-white font-mono text-xs sm:text-sm transition-all backdrop-blur-md cursor-pointer"
                  >
                    <span>{banner.secondary_link_text}</span>
                  </a>
                ) : (
                  <Link
                    href={banner.secondary_link_url}
                    className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 hover:border-white/30 text-white/90 hover:text-white font-mono text-xs sm:text-sm transition-all backdrop-blur-md cursor-pointer"
                  >
                    <span>{banner.secondary_link_text}</span>
                  </Link>
                )
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white/[0.08] border border-white/15 text-white/80 font-mono text-xs sm:text-sm backdrop-blur-md">
                  {banner.secondary_link_text}
                </span>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}
