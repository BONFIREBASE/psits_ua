'use client'

import { useState } from 'react'
import { Check, Link as LinkIcon } from 'lucide-react'

interface ShareArticleButtonsProps {
  url: string
  title: string
}

export default function ShareArticleButtons({ url }: ShareArticleButtonsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleFacebookShare = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    window.open(fbUrl, '_blank', 'noopener,noreferrer,width=600,height=500')
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={handleCopy}
        type="button"
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-white/[0.04] border border-white/10 hover:bg-gold/10 hover:border-gold/30 hover:text-gold text-slate-200 transition-all shadow-sm"
      >
        {copied ? (
          <>
            <Check size={14} className="text-emerald-400" />
            <span className="text-emerald-400">Link Copied!</span>
          </>
        ) : (
          <>
            <LinkIcon size={14} className="text-gold" />
            <span>Copy Link</span>
          </>
        )}
      </button>

      <button
        onClick={handleFacebookShare}
        type="button"
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-[#1877F2]/10 border border-[#1877F2]/30 hover:bg-[#1877F2]/20 text-[#1877F2] dark:text-[#4294ff] transition-all shadow-sm"
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        <span>Share to Facebook</span>
      </button>
    </div>
  )
}
