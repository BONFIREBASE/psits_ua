'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  id?: string
}

export default function Select({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  id,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [openUpwards, setOpenUpwards] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  function toggleOpen() {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      setOpenUpwards(spaceBelow < 220 && spaceAbove > spaceBelow)
    }
    setOpen((o) => !o)
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
    }
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('keydown', handleKey)
    }
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  return (
    <div ref={ref} className="relative" id={id}>
      {/* Trigger */}
      <button
        type="button"
        onClick={toggleOpen}
        className={`
          w-full flex items-center justify-between gap-2
          bg-slate-50 dark:bg-white/[0.04] border rounded-lg px-3.5 py-2.5
          text-sm text-left outline-none min-h-[42px]
          transition-all duration-200
          ${open
            ? 'border-gold/50 ring-1 ring-gold/20'
            : 'border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20'
          }
          ${selected ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400 dark:text-white/25'}
        `}
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 text-slate-400 dark:text-white/30 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: openUpwards ? 4 : -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openUpwards ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={`
              absolute z-[70] left-0 right-0 py-1 rounded-lg border border-black/10 dark:border-white/10
              bg-white/95 dark:bg-[#0d1219]/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)]
              max-h-56 overflow-y-auto scrollbar-minimal overscroll-contain
              ${openUpwards ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}
            `}
          >
            {options.map((option) => {
              const isSelected = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  className={`
                    w-full flex items-center justify-between gap-2
                    px-3.5 py-2.5 sm:py-2 text-sm text-left min-h-[38px]
                    transition-colors duration-150 active:bg-black/5 dark:active:bg-white/[0.08]
                    ${isSelected
                      ? 'text-gold bg-gold/[0.08] font-semibold'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-black/5 dark:text-white/60 dark:hover:text-white/90 dark:hover:bg-white/[0.04]'
                    }
                  `}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check size={13} className="flex-shrink-0 text-gold" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
