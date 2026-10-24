'use client'

import React, { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownContentProps {
  content: string
  className?: string
}

export function preprocessMarkdown(content: string): string {
  if (!content) return ''

  let text = content.replace(/\r\n/g, '\n')

  const lines = text.split('\n')
  const processedLines = lines.map((line) => {
    const trimmed = line.trimStart()

    // Convert bullet characters • to markdown list -
    if (trimmed.startsWith('• ') || trimmed.startsWith('•\t')) {
      return line.replace(/^(\s*)•\s*/, '$1- ')
    }

    // Convert unspaced dash list items like "-Have boundaries" to "- Have boundaries"
    if (/^-[A-Za-z0-9"']/.test(trimmed)) {
      return line.replace(/^(\s*)-(\S)/, '$1- $2')
    }

    // Convert unspaced blockquotes like ">Quote" to "> Quote"
    if (/^>[^\s>]/.test(trimmed)) {
      return line.replace(/^(\s*)>([^\s>])/, '$1> $2')
    }

    return line
  })

  text = processedLines.join('\n')

  // Ensure blockquotes have a clean break before them if preceded by non-empty text
  text = text.replace(/([^\n])\n(>\s*)/g, '$1\n\n$2')

  // Handle inline angle quotes like >Don't give up.< or > Don't give up. <
  text = text.replace(/(^|\s)>([^\n<>]+)<(?=[\s,.;:!?]|$)/g, '$1*“$2”*')

  // Preserve soft line breaks via standard Markdown trailing spaces (2 spaces)
  // except for blockquotes, headers, dividers, or empty lines
  const breakPreserved = text.split('\n').map((line) => {
    const trimmed = line.trim()
    if (!trimmed || /^#{1,6}\s/.test(trimmed) || /^---+$/.test(trimmed) || /^>\s/.test(trimmed)) {
      return line
    }
    return line + '  '
  }).join('\n')

  return breakPreserved
}

export default function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  const processed = useMemo(() => preprocessMarkdown(content), [content])

  if (!content) return null

  return (
    <div className={`prose dark:prose-invert max-w-none text-slate-700 dark:text-white/90 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white mt-6 mb-3 tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg sm:text-xl font-display font-bold text-slate-900 dark:text-white mt-5 mb-2.5 tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base sm:text-lg font-display font-bold text-slate-900 dark:text-white mt-4 mb-2 tracking-tight">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-sm sm:text-base leading-[1.8] font-normal text-slate-700 dark:text-white/90 mb-4 last:mb-0 break-words">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="text-slate-900 dark:text-white font-bold">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="text-slate-800 dark:text-white/95 italic font-medium">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-sm sm:text-base text-slate-700 dark:text-white/90 space-y-1.5 my-3 pl-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-sm sm:text-base text-slate-700 dark:text-white/90 space-y-1.5 my-3 pl-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-sm sm:text-base text-slate-700 dark:text-white/90 leading-relaxed">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-amber-500 dark:border-gold pl-4 sm:pl-5 py-3 my-4 bg-amber-500/5 dark:bg-gold/5 rounded-r-xl border border-black/5 dark:border-white/5">
              <div className="text-sm sm:text-base italic font-serif text-slate-800 dark:text-white/95 leading-relaxed">
                {children}
              </div>
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-amber-600 dark:text-gold hover:underline font-medium break-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-amber-600 dark:text-gold text-xs font-mono">
              {children}
            </code>
          ),
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  )
}
