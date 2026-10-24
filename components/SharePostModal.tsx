'use client'

import React, { useState } from 'react'
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react'
import type { CommunityPostItem } from '@/app/community/actions'

interface SharePostModalProps {
  isOpen: boolean
  onClose: () => void
  post: CommunityPostItem | null
}

export function SharePostModal({ isOpen, onClose, post }: SharePostModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen || !post) return null

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = `${origin}/community?post=${post.$id}`
  const authorName = post.is_anonymous ? 'Anonymous Kasubay' : post.author_display_name
  const cleanSnippet = post.content
    ? post.content.replace(/[#*`_~]/g, '').trim().slice(0, 100)
    : 'Join the discussion on PSITS Community'
  const shareText = `Check out this post by ${authorName} on PSITS Community: "${cleanSnippet}"`

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      }
    } catch {
      // Fallback
    }
  }

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `PSITS Community: ${authorName}`,
          text: shareText,
          url: shareUrl,
        })
        onClose()
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return
      }
    }
  }

  const openShareWindow = (url: string) => {
    if (typeof window !== 'undefined') {
      const width = 600
      const height = 540
      const left = Math.max(0, (window.innerWidth - width) / 2 + window.screenX)
      const top = Math.max(0, (window.innerHeight - height) / 2 + window.screenY)
      window.open(
        url,
        'share-dialog',
        `width=${width},height=${height},top=${top},left=${left},toolbar=0,menubar=0,location=0,status=0,scrollbars=1,resizable=1`
      )
    }
  }

  // Social Channels configuration
  const socialChannels = [
    {
      name: 'Facebook',
      bg: 'hover:bg-[#1877F2]/10 hover:border-[#1877F2]/40 hover:text-[#1877F2]',
      iconColor: 'text-[#1877F2]',
      onClick: () =>
        openShareWindow(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`
        ),
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: 'Messenger',
      bg: 'hover:bg-[#0084FF]/10 hover:border-[#0084FF]/40 hover:text-[#0084FF]',
      iconColor: 'text-[#0084FF]',
      onClick: () => {
        // Facebook send dialog or direct intent
        openShareWindow(
          `https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(shareUrl)}`
        )
      },
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.09.301 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.056-3.26-5.963 3.26 6.559-6.963 3.13 3.259 5.89-3.259-6.56 6.963z" />
        </svg>
      ),
    },
    {
      name: 'X (Twitter)',
      bg: 'hover:bg-slate-900/10 dark:hover:bg-white/10 hover:border-slate-900/40 dark:hover:border-white/40 hover:text-slate-900 dark:hover:text-white',
      iconColor: 'text-slate-900 dark:text-white',
      onClick: () =>
        openShareWindow(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
        ),
      icon: (
        <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: 'WhatsApp',
      bg: 'hover:bg-[#25D366]/10 hover:border-[#25D366]/40 hover:text-[#25D366]',
      iconColor: 'text-[#25D366]',
      onClick: () =>
        openShareWindow(
          `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`
        ),
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12.031 0C5.396 0 .029 5.367.029 12.002c0 2.117.551 4.184 1.597 6.002L.002 24l6.166-1.618a11.968 11.968 0 005.863 1.522h.005c6.635 0 12.003-5.367 12.003-12.002C24.039 5.367 18.666 0 12.031 0zm0 21.996h-.004a9.96 9.96 0 01-5.081-1.39l-.364-.216-3.771.989 1.006-3.676-.237-.378a9.936 9.936 0 01-1.526-5.323c0-5.503 4.478-9.982 9.982-9.982 2.666 0 5.172 1.038 7.058 2.924 1.885 1.886 2.923 4.392 2.923 7.058 0 5.504-4.478 9.983-9.986 9.983z" />
        </svg>
      ),
    },
    {
      name: 'Telegram',
      bg: 'hover:bg-[#24A1DE]/10 hover:border-[#24A1DE]/40 hover:text-[#24A1DE]',
      iconColor: 'text-[#24A1DE]',
      onClick: () =>
        openShareWindow(
          `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
        ),
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.937z" />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      bg: 'hover:bg-[#0A66C2]/10 hover:border-[#0A66C2]/40 hover:text-[#0A66C2]',
      iconColor: 'text-[#0A66C2]',
      onClick: () =>
        openShareWindow(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        ),
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      ),
    },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#0c1017] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                Share Discussion
              </h3>
              <p className="text-[11px] font-mono text-slate-400 dark:text-white/40">
                Share this post with fellow students
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Post Preview Strip */}
        <div className="px-5 pt-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-white truncate">
                {authorName}
              </span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-white/40">
                {post.author_year_section || 'BSIT'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
              {cleanSnippet || 'Join the discussion on PSITS Community'}
            </p>
          </div>
        </div>

        {/* Social Grid */}
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Share to Social Media
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              {socialChannels.map(channel => (
                <button
                  key={channel.name}
                  type="button"
                  onClick={channel.onClick}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-surface-subtle transition-all cursor-pointer group text-slate-700 dark:text-slate-300 ${channel.bg}`}
                >
                  <div className={`transition-transform duration-200 group-hover:scale-110 ${channel.iconColor}`}>
                    {channel.icon}
                  </div>
                  <span className="text-[11px] font-semibold tracking-tight">
                    {channel.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Copy Direct Link Section */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Copy Direct Link
            </label>
            <div className="flex items-center gap-2 p-1.5 pl-3 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08]">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent text-xs font-mono text-slate-700 dark:text-slate-300 truncate focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  copied
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-gold hover:bg-gold-muted text-slate-950 shadow-xs'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Native Mobile Share Button (if supported) */}
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-surface hover:bg-gold/10 hover:border-gold/30 text-slate-700 dark:text-slate-300 hover:text-gold text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>More sharing options on device</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
