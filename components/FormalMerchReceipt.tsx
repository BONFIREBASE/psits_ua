'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Printer, Download, X, Loader2 } from 'lucide-react'
import type { MerchOrderRow } from '@/lib/supabase'
import { downloadReceiptImage } from '@/lib/receipt-generator'

export interface BulkStudentItem {
  studentNo?: string
  studentName: string
  yearSection?: string
  size: string
}

interface FormalMerchReceiptProps {
  order: MerchOrderRow
  onClose?: () => void
}

export function parseBulkItemsFromNotes(notes: string | null | undefined): BulkStudentItem[] {
  if (!notes) return []
  try {
    const trimmed = notes.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed.bulkItems)) {
        return parsed.bulkItems
      }
    }
  } catch {
    // Fallback
  }
  return []
}

export default function FormalMerchReceipt({ order, onClose }: FormalMerchReceiptProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const bulkItems = parseBulkItemsFromNotes(order.notes)
  const isBulk = bulkItems.length > 0 || order.quantity > 1
  const isPaid = order.status === 'ordered' || order.status === 'ready_for_pickup' || order.status === 'completed'

  const formattedDate = new Date(order.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const receiptRef = `#POLO-${order.id.slice(0, 8).toUpperCase()}`

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      await downloadReceiptImage(order)
    } catch (err) {
      console.error('Direct receipt download error:', err)
      window.print()
    } finally {
      setIsDownloading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      {/* Explicit Print Styles for Real Receipt Slip / A4 Paper */}
      <style jsx global>{`
        @media print {
          @page {
            size: auto;
            margin: 10mm;
          }
          body {
            background: white !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-hidden, nav, header, footer {
            display: none !important;
          }
          .receipt-modal-backdrop {
            position: static !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            box-shadow: none !important;
          }
          .receipt-document {
            box-shadow: none !important;
            border: 1px dashed #94a3b8 !important;
            margin: 0 auto !important;
            padding: 24px !important;
            width: 100% !important;
            max-width: 520px !important;
          }
        }
      `}</style>

      <div className="receipt-modal-backdrop fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Floating Action Controls */}
        <div className="fixed top-3 right-3 sm:top-5 sm:right-5 flex items-center gap-2 print:hidden z-50">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-gold text-[#0D1117] font-mono font-bold text-xs shadow-xl hover:bg-gold-light transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="Download direct receipt image (PNG)"
          >
            {isDownloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            <span>Download PNG</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono font-medium text-xs transition-colors cursor-pointer"
            title="Print receipt or save as PDF"
          >
            <Printer size={15} />
            <span>Print / PDF</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Minimalist Real Receipt Slip Document */}
        <div className="receipt-document bg-white text-slate-900 w-full max-w-lg my-auto rounded-2xl shadow-2xl p-5 sm:p-8 border border-slate-200/90 font-mono text-xs relative overflow-hidden selection:bg-gold/30">
          {/* Subtle Anti-Tamper PSITS Background Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] select-none">
            <div className="w-72 h-72 relative">
              <Image
                src="/assets/logo/PSITS logo.png"
                alt=""
                fill
                className="object-contain grayscale"
              />
            </div>
          </div>

          {/* Receipt Top Header */}
          <div className="text-center space-y-2 pb-3.5 relative z-10">
            {/* Centered PSITS Logo Only */}
            <div className="flex justify-center pb-1">
              <div className="w-12 h-12 relative flex-shrink-0">
                <Image
                  src="/assets/logo/PSITS logo.png"
                  alt="PSITS Crest"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <div>
              <h1 className="font-bold text-xs sm:text-sm tracking-tight text-slate-900 uppercase">
                PHILIPPINE SOCIETY OF INFORMATION TECHNOLOGY STUDENTS
              </h1>
              <p className="text-[10px] text-slate-500 pt-0.5">
                College of Computer Information Sciences · University of Antique
              </p>
              <p className="text-[9.5px] text-slate-400">
                Sibalom, Antique · Academic Year 2026–2027
              </p>
            </div>

            <div className="pt-1.5">
              <div className="inline-block px-3 py-1 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px] tracking-wider uppercase border border-slate-200">
                OFFICIAL MERCHANDISE RECEIPT
              </div>
              <p className="text-[10px] text-slate-500 pt-1">
                NexGen TechTorch Department Polo Shirt
              </p>
            </div>
          </div>

          {/* Dashed Separator */}
          <div className="border-b border-dashed border-slate-300 my-3 relative z-10" />

          {/* Transaction Metadata Key-Value */}
          <div className="space-y-1.5 text-[11px] relative z-10">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">RECEIPT NO:</span>
              <strong className="text-slate-900 font-bold tracking-wider">{receiptRef}</strong>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">DATE:</span>
              <span className="text-slate-800">{formattedDate}</span>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">STATUS:</span>
              <strong className="text-slate-900 font-bold tracking-wider">
                {isPaid ? 'PAID (OFFICE VERIFIED)' : 'ORDER CONFIRMED'}
              </strong>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">STUDENT / PAYER:</span>
              <span className="text-slate-900 font-bold uppercase">{order.student_name}</span>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">CLASS / SECTION:</span>
              <span className="text-slate-800">{order.course_year || 'N/A'}</span>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">EMAIL:</span>
              <span className="text-slate-800 truncate max-w-[220px]">{order.student_email}</span>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">PAYMENT MODE:</span>
              <span className="text-slate-800 font-semibold">{isPaid ? 'Cash (Office Verified)' : 'Cash on Claim'}</span>
            </div>
          </div>

          {/* Dashed Separator */}
          <div className="border-b border-dashed border-slate-300 my-3 relative z-10" />

          {/* Items Header */}
          <div className="text-[11px] font-bold text-slate-700 flex justify-between pb-1.5 border-b border-slate-200 relative z-10">
            <span className="flex-1">ITEM / STUDENT</span>
            <span className="w-12 text-center">SIZE</span>
            <span className="w-10 text-center">QTY</span>
            <span className="w-16 text-right">TOTAL</span>
          </div>

          {/* Items List */}
          <div className="py-2 space-y-1.5 text-[11px] relative z-10">
            {isBulk && bulkItems.length > 0 ? (
              <div className="max-h-[42vh] overflow-y-auto pr-1 divide-y divide-slate-100 print:max-h-none print:overflow-visible">
                {bulkItems.map((item, idx) => (
                  <div key={`${item.studentName}-${idx}`} className="flex justify-between items-center py-1">
                    <span className="flex-1 text-slate-800 truncate pr-2">
                      <span className="text-slate-400 mr-1.5">{String(idx + 1).padStart(2, '0')}.</span>
                      <strong className="font-semibold text-slate-900">{item.studentName}</strong>
                    </span>
                    <span className="w-12 text-center font-bold text-[#1B2A6B]">{item.size}</span>
                    <span className="w-10 text-center text-slate-600">1</span>
                    <span className="w-16 text-right font-medium text-slate-900">₱475.00</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-between items-center py-1">
                <span className="flex-1 pr-2">
                  <strong className="block font-bold text-slate-900">Official PSITS Polo Shirt</strong>
                  <span className="text-[10px] text-slate-500 block">NexGen TechTorch Edition</span>
                </span>
                <span className="w-12 text-center font-bold text-[#1B2A6B]">{order.size}</span>
                <span className="w-10 text-center text-slate-600">{order.quantity || 1}</span>
                <span className="w-16 text-right font-bold text-slate-900">₱{order.total_amount || 475}.00</span>
              </div>
            )}
          </div>

          {/* Dashed Separator */}
          <div className="border-b border-dashed border-slate-300 my-3 relative z-10" />

          {/* Financial Breakdown */}
          <div className="space-y-1 text-[11px] relative z-10">
            <div className="flex justify-between text-slate-600">
              <span>TOTAL ITEMS:</span>
              <span>{order.quantity} pcs</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>UNIT PRICE:</span>
              <span>₱475.00 / ea</span>
            </div>

            <div className="border-b-2 border-slate-900 my-2" />

            <div className="flex justify-between items-baseline pt-0.5 text-slate-900">
              <span className="font-bold text-xs uppercase tracking-wide">
                {isPaid ? 'TOTAL AMOUNT PAID' : 'TOTAL AMOUNT PAYABLE'}:
              </span>
              <strong className="font-black text-base sm:text-lg">
                ₱{order.total_amount || order.quantity * 475}.00
              </strong>
            </div>
          </div>

          {/* Dashed Separator */}
          <div className="border-b border-dashed border-slate-300 my-3 relative z-10" />

          {/* Claim Instructions & Location (No emojis) */}
          <div className="text-center space-y-1 text-[10.5px] text-slate-600 relative z-10">
            <p className="font-bold text-slate-800">
              CLAIM VENUE: PSITS Office, CCIS Building, Main Campus
            </p>
            <p className="text-[10px]">
              Present this receipt slip on your mobile phone upon claiming your shirt.
            </p>
          </div>

          {/* Authentic Circular Organization Digital Verification Stamp */}
          <div className="pt-4 pb-2 flex flex-col items-center justify-center relative z-10">
            <div className="w-28 h-28 rounded-full border-[1.5px] border-slate-700/80 p-1 flex items-center justify-center relative select-none">
              <div className="w-full h-full rounded-full border border-dashed border-slate-400 flex flex-col items-center justify-center text-center p-2">
                <div className="w-7 h-7 relative mb-1 opacity-90">
                  <Image src="/assets/logo/PSITS logo.png" alt="PSITS" fill className="object-contain" />
                </div>
                <span className="text-[7.5px] font-bold text-slate-800 tracking-widest uppercase leading-tight">
                  DIGITALLY VERIFIED
                </span>
                <span className="text-[6.5px] text-slate-500 tracking-wider uppercase pt-0.5">
                  PSITS TREASURY OFFICE
                </span>
                <span className="text-[6px] text-slate-400 tracking-wider uppercase">
                  AY 2026–2027
                </span>
              </div>
            </div>
          </div>

          {/* Dashed Separator */}
          <div className="border-b border-dashed border-slate-300 my-3 relative z-10" />

          {/* Receipt Footer */}
          <div className="text-center space-y-1 text-[10px] text-slate-500 relative z-10">
            <p>PSITS CHAPTER TREASURY OFFICE · SIBALOM, ANTIQUE</p>
            <p className="font-bold text-slate-900 tracking-wider uppercase">
              OFFICIAL DIGITAL RECEIPT · VALID FOR CLAIMING
            </p>
          </div>

          {/* Direct Download Trigger Button on Mobile within modal */}
          <div className="pt-4 print:hidden sm:hidden relative z-10">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full py-2.5 px-4 rounded-xl bg-gold hover:bg-gold-light text-[#0D1117] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>Save / Download Receipt Image</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
