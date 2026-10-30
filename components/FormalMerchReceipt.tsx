'use client'

import React from 'react'
import Image from 'next/image'
import { Printer, X, CheckCircle2, ShieldCheck, Shirt, AlertCircle, Users } from 'lucide-react'
import type { MerchOrderRow } from '@/lib/supabase'

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
  const bulkItems = parseBulkItemsFromNotes(order.notes)
  const isBulk = bulkItems.length > 0 || order.quantity > 1

  const formattedDate = new Date(order.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const verifiedDate = order.verified_at
    ? new Date(order.verified_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : formattedDate

  const receiptRef = `#POLO-${order.id.slice(0, 8).toUpperCase()}`

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      {/* Explicit Print Styles for Standard A4 Bond Paper */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          body {
            background: white !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide non-print chrome */
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
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .receipt-print-table-container {
            max-height: none !important;
            overflow: visible !important;
            border: 1px solid #cbd5e1 !important;
          }
          .receipt-print-row {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="receipt-modal-backdrop fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
        {/* Floating Action Controls (Hidden on Print) */}
        <div className="fixed top-3 right-3 sm:top-5 sm:right-5 flex items-center gap-2 print:hidden z-50">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-gold text-[#0D1117] font-mono font-bold text-xs shadow-xl hover:bg-gold-light transition-all cursor-pointer active:scale-95"
            title="Print receipt or save as PDF formatted for A4 paper"
          >
            <Printer size={15} />
            <span>Print / Save PDF (A4)</span>
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

        {/* Main Official Receipt Document Formatted for A4 / Screen */}
        <div className="receipt-document bg-white text-slate-900 w-full max-w-3xl my-auto rounded-2xl shadow-2xl p-4 sm:p-8 md:p-10 border border-slate-200 font-sans text-xs sm:text-sm">
          {/* Institutional Header */}
          <div className="pb-3.5 mb-3.5 border-b-2 border-slate-900">
            <div className="flex items-center justify-between gap-2.5 sm:gap-4">
              {/* University Logo */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 relative flex-shrink-0">
                <Image
                  src="/assets/logo/UA Logo.png"
                  alt="University of Antique"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              {/* Center Header Text */}
              <div className="text-center flex-1 space-y-0.5">
                <p className="text-[9px] sm:text-[10.5px] font-serif uppercase tracking-widest text-slate-600 font-medium">
                  Republic of the Philippines
                </p>
                <h1 className="font-serif font-black text-sm sm:text-lg md:text-xl text-slate-900 tracking-wide uppercase leading-tight">
                  University of Antique
                </h1>
                <p className="text-[8.5px] sm:text-[10px] font-serif italic text-slate-600">
                  College of Computer Information Sciences · Sibalom, Antique
                </p>
                <h2 className="font-sans font-extrabold text-[10px] sm:text-xs text-[#1B2A6B] tracking-wider uppercase pt-0.5">
                  Philippine Society of Information Technology Students (PSITS-UA)
                </h2>
                <p className="text-[8px] sm:text-[9px] font-sans text-slate-500 tracking-wide">
                  Mayor Santiago A. Lotilla St., District I, Sibalom, Antique · psits-ua@antiquespride.edu.ph
                </p>
              </div>

              {/* PSITS Chapter Crest */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 relative flex-shrink-0">
                <Image
                  src="/assets/logo/PSITS logo.png"
                  alt="PSITS-UA Crest"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Receipt Title & Verification Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-5 pb-3 border-b border-slate-200">
            <div>
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold block">
                Document Code: PSITS-MRCH-REC-2026
              </span>
              <h3 className="font-serif font-black text-sm sm:text-base md:text-lg text-slate-900 uppercase tracking-tight">
                Official Merch Acknowledgement Receipt &amp; Claim Slip
              </h3>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-[11px] sm:text-xs font-bold self-start sm:self-auto">
              <CheckCircle2 size={13} className="text-emerald-700" />
              <span>PAID &amp; CONFIRMED</span>
            </div>
          </div>

          {/* Order Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 font-mono text-[11px] sm:text-xs">
            <div className="space-y-1">
              <div className="flex">
                <span className="w-24 sm:w-28 text-slate-500">Receipt Ref:</span>
                <strong className="text-slate-900 font-bold">{receiptRef}</strong>
              </div>
              <div className="flex">
                <span className="w-24 sm:w-28 text-slate-500">Payer Name:</span>
                <span className="text-slate-900 font-semibold">{order.student_name}</span>
              </div>
              <div className="flex">
                <span className="w-24 sm:w-28 text-slate-500">Student Email:</span>
                <span className="text-slate-900 truncate">{order.student_email}</span>
              </div>
              <div className="flex">
                <span className="w-24 sm:w-28 text-slate-500">Course / Section:</span>
                <span className="text-slate-900">{order.course_year || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
              <div className="flex">
                <span className="w-24 sm:w-28 text-slate-500">Order Date:</span>
                <span className="text-slate-900">{formattedDate}</span>
              </div>
              <div className="flex">
                <span className="w-24 sm:w-28 text-slate-500">Verified Date:</span>
                <span className="text-slate-900">{verifiedDate}</span>
              </div>
              <div className="flex">
                <span className="w-24 sm:w-28 text-slate-500">Payment Mode:</span>
                <span className="text-slate-900 font-semibold">Cash / PSITS Office Verified</span>
              </div>
              <div className="flex">
                <span className="w-24 sm:w-28 text-slate-500">Claim Venue:</span>
                <span className="text-emerald-700 font-semibold">PSITS Office, CCIS Building</span>
              </div>
            </div>
          </div>

          {/* Merch Item Specification */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-2 font-mono">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Shirt size={14} className="text-[#1B2A6B]" />
                <span>Merchandise Items Ordered</span>
              </h4>
              {isBulk && bulkItems.length > 0 && (
                <span className="text-[11px] text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                  Total: {bulkItems.length} Students
                </span>
              )}
            </div>

            {isBulk && bulkItems.length > 0 ? (
              /* Bulk Order Itemized Table (Supports 30+ students cleanly with scroll on screen & continuous flow on print) */
              <div className="receipt-print-table-container overflow-x-auto border border-slate-300 rounded-lg max-h-[50vh] sm:max-h-[58vh] overflow-y-auto print:max-h-none print:overflow-visible">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-100 print:static">
                    <tr className="border-b border-slate-300 font-mono text-[10.5px] text-slate-700 uppercase">
                      <th className="py-2 px-2.5 w-8 text-center">#</th>
                      <th className="py-2 px-3">Student Name</th>
                      <th className="py-2 px-3">Year &amp; Section</th>
                      <th className="py-2 px-3 text-center">Size</th>
                      <th className="py-2 px-3 text-right">Unit Price</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {bulkItems.map((item, idx) => (
                      <tr
                        key={`${item.studentName}-${idx}`}
                        className="receipt-print-row odd:bg-white even:bg-slate-50/70 hover:bg-slate-100/50 transition-colors"
                      >
                        <td className="py-1.5 px-2.5 text-slate-400 text-center text-[10.5px]">{idx + 1}</td>
                        <td className="py-1.5 px-3 font-bold text-slate-900 text-[11px]">{item.studentName}</td>
                        <td className="py-1.5 px-3 text-slate-600 text-[10.5px]">{item.yearSection || order.course_year || '—'}</td>
                        <td className="py-1.5 px-3 font-bold text-[#1B2A6B] text-center text-[11px]">{item.size}</td>
                        <td className="py-1.5 px-3 text-right text-slate-600 text-[10.5px]">₱475.00</td>
                        <td className="py-1.5 px-3 text-right font-bold text-slate-900 text-[11px]">₱475.00</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 border-t-2 border-slate-300 font-mono font-bold">
                      <td colSpan={3} className="py-2.5 px-3 text-right uppercase text-slate-600">
                        Total ({bulkItems.length} {bulkItems.length === 1 ? 'Shirt' : 'Shirts'}):
                      </td>
                      <td className="py-2.5 px-3 text-center text-[#1B2A6B]">
                        {order.quantity} pcs
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">₱475.00/ea</td>
                      <td className="py-2.5 px-3 text-right text-base text-slate-900">
                        ₱{order.total_amount || bulkItems.length * 475}.00
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              /* Individual Order Table */
              <div className="receipt-print-table-container border border-slate-300 rounded-lg overflow-hidden font-mono text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[11px] text-slate-700 uppercase">
                      <th className="py-2 px-3">Item Description</th>
                      <th className="py-2 px-3 text-center">Size</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Unit Price</th>
                      <th className="py-2 px-3 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="receipt-print-row">
                      <td className="py-3 px-3">
                        <strong className="block font-bold text-slate-900">
                          Official PSITS Polo Shirt (AY 2026–2027)
                        </strong>
                        <span className="text-[11px] text-slate-500 font-sans">
                          NexGen TechTorch Edition · Tailored Micro-Poly Fabric
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-[#1B2A6B] text-center">{order.size}</td>
                      <td className="py-3 px-3 text-center">{order.quantity}</td>
                      <td className="py-3 px-3 text-right text-slate-600">₱{order.unit_price || 475}.00</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">₱{order.total_amount || 475}.00</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold">
                      <td colSpan={4} className="py-2.5 px-3 text-right uppercase text-slate-600">
                        Total Amount Paid:
                      </td>
                      <td className="py-2.5 px-3 text-right text-base text-slate-900">
                        ₱{order.total_amount || 475}.00
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Claiming Instructions & Signatures */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-3.5 border-t border-slate-200">
            <div className="space-y-1 text-slate-600 text-[10.5px] sm:text-[11px] leading-relaxed">
              <p className="font-bold text-slate-800 uppercase tracking-wide font-mono flex items-center gap-1">
                <AlertCircle size={13} className="text-amber-600" />
                <span>Claiming Instructions:</span>
              </p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Present this printed slip or digital confirmation at the PSITS Office.</li>
                <li>Inspect your polo shirt size and stitching prior to signing the release log.</li>
                <li>For bulk orders, the representative is responsible for distributing shirts to listed students.</li>
              </ul>
            </div>

            <div className="flex flex-col justify-end text-center font-mono">
              <div className="pt-6 sm:pt-8 border-b border-slate-800 pb-1 max-w-[240px] mx-auto w-full">
                <strong className="font-bold text-xs uppercase text-slate-900 block">
                  {order.verified_by || 'PSITS Treasury Committee'}
                </strong>
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider pt-1 block">
                Official Chapter Verifier &amp; Issuer
              </span>
            </div>
          </div>

          {/* Institutional Document Footer */}
          <div className="mt-6 sm:mt-8 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-slate-400 gap-1.5 sm:gap-2">
            <span>Generated by PSITS-UA Portal System</span>
            <span>Security Hash: {order.id.replace(/-/g, '').slice(0, 16).toUpperCase()}</span>
            <span>SIBALOM, ANTIQUE</span>
          </div>
        </div>
      </div>
    </>
  )
}
