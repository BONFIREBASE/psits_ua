'use client'

import React, { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import QRCode from 'qrcode'
import { X, Copy, Check, Download, Share2, Sparkles } from 'lucide-react'

function InstagramVerifiedBadge({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-label="Verified"
      className={`${className} shrink-0 text-amber-400 inline-block align-middle select-none drop-shadow-sm`}
      fill="currentColor"
    >
      <title>Verified</title>
      <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.79-4-4-4-.495 0-.965.084-1.4.238C14.55 2.475 13.18 1.6 11.6 1.6s-2.95.875-3.6 2.148c-.435-.154-.905-.238-1.4-.238-2.21 0-4 1.79-4 4 0 .495.084.965.238 1.4C1.575 9.55.7 10.92.7 12.5s.875 2.95 2.148 3.6c-.154.435-.238.905-.238 1.4 0 2.21 1.79 4 4 4 .495 0 .965-.084 1.4-.238.65 1.273 2.02 2.148 3.6 2.148s2.95-.875 3.6-2.148c.435.154.905.238 1.4.238 2.21 0 4-1.79 4-4 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6z" />
      <path d="M10.2 16.2 6.5 12.5l1.4-1.4 2.3 2.3 6-6 1.4 1.4z" className="fill-slate-950" />
    </svg>
  )
}

interface ProfileShareModalProps {
  isOpen: boolean
  onClose: () => void
  profile: {
    displayName: string
    handle: string
    avatar?: string
    yearSection?: string
    isOfficer?: boolean
    isVerified?: boolean
  }
}

export function ProfileShareModal({ isOpen, onClose, profile }: ProfileShareModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const cleanHandle = (profile.handle || 'student').replace(/^@/, '')
  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/community/${cleanHandle}`
    : `https://psitsua.vercel.app/community/${cleanHandle}`

  useEffect(() => {
    if (!isOpen) return

    QRCode.toDataURL(profileUrl, {
      width: 320,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('QR generation error:', err))
  }, [isOpen, profileUrl])

  if (!isOpen) return null

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(profileUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {}
  }

  const handleDownloadQr = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `${cleanHandle}-psits-qr.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleDeviceShare = async () => {
    const shareData = {
      title: `${profile.displayName} (@${cleanHandle}) · PSITS Community`,
      text: `Connect with ${profile.displayName} on PSITS Community!`,
      url: profileUrl,
    }
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData)
        return
      } catch {}
    }
    handleCopyLink()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={cardRef}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-[32px] bg-white dark:bg-gradient-to-b dark:from-[#181c24] dark:via-[#0f1218] dark:to-[#080a0e] text-slate-900 dark:text-white p-6 shadow-2xl border border-black/10 dark:border-white/10 relative overflow-hidden flex flex-col items-center animate-in zoom-in-95 duration-200"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-gold/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row */}
        <div className="w-full flex items-center justify-between pb-3">
          <div className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider uppercase text-gold font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>PSITS COMMUNITY CARD</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Instagram-Style User Identity Preview */}
        <div className="flex flex-col items-center text-center mt-2 mb-4 space-y-2">
          <div className="relative w-16 h-16 shrink-0">
            <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 ring-2 ring-gold/40 shadow-lg flex items-center justify-center">
              {profile.avatar && !profile.avatar.startsWith('preset:') ? (
                <Image
                  src={profile.avatar}
                  alt={profile.displayName}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gold font-bold text-xl bg-slate-900">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {(profile.isOfficer || profile.isVerified) && (
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#0f1218] rounded-full p-0.5 shadow-md z-10 flex items-center justify-center ring-2 ring-white dark:ring-[#0f1218]">
                <InstagramVerifiedBadge className="w-4 h-4" />
              </div>
            )}
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight flex items-center justify-center gap-1.5">
              <span>{profile.displayName}</span>
              {(profile.isOfficer || profile.isVerified) && (
                <InstagramVerifiedBadge className="w-4 h-4 inline-block align-middle" />
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-white/60 font-mono mt-0.5">
              @{cleanHandle} · {profile.yearSection || 'BSIT'}
            </p>
          </div>
        </div>

        {/* QR Code Presentation Box */}
        <div className="w-full bg-slate-50 dark:bg-white rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-200/80 dark:border-transparent shadow-xs relative group">
          {qrDataUrl ? (
            <div className="relative w-52 h-52 flex items-center justify-center">
              <Image
                src={qrDataUrl}
                alt={`QR code for ${cleanHandle}`}
                width={208}
                height={208}
                className="w-full h-full object-contain"
                unoptimized
              />
              {/* Center Logo Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-slate-950 text-gold flex items-center justify-center font-bold text-[10px] tracking-tighter border-2 border-white shadow-md">
                  UA
                </div>
              </div>
            </div>
          ) : (
            <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-400 font-mono">
              Generating QR...
            </div>
          )}
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-2 font-medium">
            Scan to view profile on PSITS Community
          </span>
        </div>

        {/* Action Controls */}
        <div className="w-full grid grid-cols-3 gap-2 mt-5">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/15 text-slate-800 dark:text-white text-xs font-semibold transition-all cursor-pointer border border-black/5 dark:border-white/10 active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-600 dark:text-slate-300" />}
            <span className="text-[11px]">{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadQr}
            className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/15 text-slate-800 dark:text-white text-xs font-semibold transition-all cursor-pointer border border-black/5 dark:border-white/10 active:scale-95"
          >
            <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span className="text-[11px]">Save QR</span>
          </button>

          <button
            type="button"
            onClick={handleDeviceShare}
            className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl bg-gold hover:bg-gold-muted text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-lg shadow-gold/20 active:scale-95"
          >
            <Share2 className="w-4 h-4 text-slate-950" />
            <span className="text-[11px]">Share</span>
          </button>
        </div>
      </div>
    </div>
  )
}
