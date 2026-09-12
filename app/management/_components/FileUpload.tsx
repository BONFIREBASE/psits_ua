'use client'

import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react'

interface FileUploadProps {
  accept?: string
  label?: string
  value?: File | null
  preview?: string | null
  onChange: (file: File | null) => void
  maxSizeMB?: number
}

export default function FileUpload({
  accept = 'image/*',
  label = 'Upload file',
  value,
  preview,
  onChange,
  maxSizeMB = 10,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isImage = accept.includes('image')

  function handleFile(file: File) {
    setError(null)

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File exceeds ${maxSizeMB}MB limit.`)
      return
    }

    onChange(file)
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleClear() {
    onChange(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const hasFile = !!value || !!preview

  return (
    <div className="space-y-2">
      {hasFile ? (
        <div className="relative rounded-lg border border-white/10 bg-white/[0.03] overflow-hidden">
          {preview && isImage ? (
            <div className="relative aspect-video bg-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3">
              <FileText size={18} className="text-gold/60 flex-shrink-0" />
              <span className="text-sm text-white/70 truncate flex-1">
                {value?.name || 'Uploaded file'}
              </span>
              <span className="text-[10px] text-white/30 font-mono flex-shrink-0">
                {value ? `${(value.size / 1024).toFixed(1)} KB` : ''}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 w-7 h-7 rounded-md bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/25 transition-all"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            relative rounded-lg border-2 border-dashed cursor-pointer
            flex flex-col items-center justify-center py-8 px-4
            transition-all duration-200
            ${isDragging
              ? 'border-gold/50 bg-gold/[0.04]'
              : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
            }
          `}
        >
          <div className="w-10 h-10 rounded-lg bg-white/[0.06] border border-white/8 flex items-center justify-center mb-3">
            {isImage ? (
              <ImageIcon size={18} className="text-white/30" />
            ) : (
              <Upload size={18} className="text-white/30" />
            )}
          </div>
          <p className="text-sm text-white/50 mb-1">{label}</p>
          <p className="text-[10px] text-white/25 font-mono">
            Drag and drop or click to browse · Max {maxSizeMB}MB
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {error && (
        <p className="text-[11px] text-red-400 font-medium">{error}</p>
      )}
    </div>
  )
}
