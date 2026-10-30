'use client'

import React from 'react'
import Image from 'next/image'
import { Printer, X, CheckCircle2, ShieldCheck, Shirt, AlertCircle, Download } from 'lucide-react'
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
    // If stored as JSON with { bulkItems: [...] }
    if (notes.startsWith('{') && notes.endsWith('}')) {
      const parsed = JSON.parse(notes)
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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      {/* Floating Action Controls (Hidden on Print) */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 print:hidden z-50">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold text-[#0D1117] font-mono font-bold text-xs shadow-lg hover:bg-gold-light transition-all cursor-pointer"
        >
          <Printer size={15} />
          <span>Print / Save as PDF</span>
        </button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Main Official Receipt Document */}
      <div className="bg-white text-slate-900 w-full max-w-3xl my-auto rounded-2xl shadow-2xl p-6 sm:p-10 border border-slate-200 font-sans print:shadow-none print:border-none print:m-0 print:p-6 print:w-full print:max-w-none text-xs sm:text-sm">
        {/* Institutional Header */}
        <div className="pb-4 mb-4 border-b-2 border-slate-900">
          <div className="flex items-center justify-between gap-4">
            {/* University Logo */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 relative flex-shrink-0">
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
              <p className="text-[10px] sm:text-[11px] font-serif uppercase tracking-widest text-slate-600 font-medium">
                Republic of the Philippines
              </p>
              <h1 className="font-serif font-black text-base sm:text-xl text-slate-900 tracking-wide uppercase">
                University of Antique
              </h1>
              <p className="text-[9.5px] sm:text-[10.5px] font-serif italic text-slate-600">
                College of Computer Information Sciences · Sibalom, Antique
              </p>
              <h2 className="font-sans font-extrabold text-[11px] sm:text-xs text-[#1B2A6B] tracking-wider uppercase pt-0.5">
                Philippine Society of Information Technology Students (PSITS-UA)
              </h2>
              <p className="text-[9px] font-sans text-slate-500 tracking-wide">
                Mayor Santiago A. Lotilla St., District I, Sibalom, Antique · psits-ua@antiquespride.edu.ph
              </p>
            </div>

            {/* PSITS Chapter Crest */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 relative flex-shrink-0">
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 pb-3 border-b border-slate-200">
          <div>
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold block">
              Document Code: PSITS-MRCH-REC-2026
            </span>
            <h3 className="font-serif font-black text-base sm:text-lg text-slate-900 uppercase tracking-tight">
              Official Merch Acknowledgement Receipt &amp; Claim Slip
            </h3>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-xs font-bold self-start sm:self-auto">
            <CheckCircle2 size={13} className="text-emerald-700" />
            <span>PAID &amp; CONFIRMED</span>
          </div>
        </div>

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs">
          <div className="space-y-1">
            <div className="flex">
              <span className="w-28 text-slate-500">Receipt Ref:</span>
              <strong className="text-slate-900 font-bold">{receiptRef}</strong>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-500">Payer Name:</span>
              <span className="text-slate-900 font-semibold">{order.student_name}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-500">Student Email:</span>
              <span className="text-slate-900">{order.student_email}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-500">Course / Section:</span>
              <span className="text-slate-900">{order.course_year || 'N/A'}</span>
            </div>
          </div>

          <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
            <div className="flex">
              <span className="w-28 text-slate-500">Order Date:</span>
              <span className="text-slate-900">{formattedDate}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-500">Verified Date:</span>
              <span className="text-slate-900">{verifiedDate}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-500">Payment Mode:</span>
              <span className="text-slate-900 font-semibold">Cash / PSITS Office Verified</span>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-500">Claim Venue:</span>
              <span className="text-emerald-700 font-semibold">PSITS Office, CCIS Building</span>
            </div>
          </div>
        </div>

        {/* Merch Item Specification */}
        <div className="mb-6">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2 font-mono flex items-center gap-1.5">
            <Shirt size={14} className="text-[#1B2A6B]" />
            <span>Merchandise Items Ordered</span>
          </h4>

          {isBulk && bulkItems.length > 0 ? (
            /* Bulk Order Itemized Table */
            <div className="overflow-x-auto border border-slate-300 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-mono text-[11px] text-slate-700 uppercase">
                    <th className="py-2 px-3 w-8">#</th>
                    <th className="py-2 px-3">Student Name</th>
                    <th className="py-2 px-3">Year &amp; Section</th>
                    <th className="py-2 px-3">Size</th>
                    <th className="py-2 px-3 text-right">Unit Price</th>
                    <th className="py-2 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {bulkItems.map((item, idx) => (
                    <tr key={`${item.studentName}-${idx}`} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{item.studentName}</td>
                      <td className="py-2 px-3 text-slate-600">{item.yearSection || order.course_year || '—'}</td>
                      <td className="py-2 px-3 font-bold text-[#1B2A6B]">{item.size}</td>
                      <td className="py-2 px-3 text-right text-slate-600">₱475.00</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">₱475.00</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-300 font-mono font-bold">
                    <td colSpan={3} className="py-2.5 px-3 text-right uppercase text-slate-600">
                      Total ({bulkItems.length} {bulkItems.length === 1 ? 'Shirt' : 'Shirts'}):
                    </td>
                    <td className="py-2.5 px-3 text-[#1B2A6B]">
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
            <div className="border border-slate-300 rounded-lg overflow-hidden font-mono text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-[11px] text-slate-700 uppercase">
                    <th className="py-2 px-3">Item Description</th>
                    <th className="py-2 px-3">Size</th>
                    <th className="py-2 px-3 text-center">Qty</th>
                    <th className="py-2 px-3 text-right">Unit Price</th>
                    <th className="py-2 px-3 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-3 px-3">
                      <strong className="block font-bold text-slate-900">
                        Official PSITS Polo Shirt (AY 2026–2027)
                      </strong>
                      <span className="text-[11px] text-slate-500 font-sans">
                        NexGen TechTorch Edition · Tailored Micro-Poly Fabric
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-[#1B2A6B]">{order.size}</td>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
          <div className="space-y-1.5 text-slate-600 text-[11px] leading-relaxed">
            <p className="font-bold text-slate-800 uppercase tracking-wide font-mono flex items-center gap-1">
              <AlertCircle size={13} className="text-amber-600" />
              <span>Claiming Instructions:</span>
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Present this printed slip or digital confirmation at the PSITS Office.</li>
              <li>Inspect your polo shirt size and stitching prior to signing the release log.</li>
              <li>For bulk orders, the representative is responsible for distributing shirts to listed students.</li>
            </ul>
          </div>

          <div className="flex flex-col justify-end text-center font-mono">
            <div className="pt-8 border-b border-slate-800 pb-1 max-w-[240px] mx-auto w-full">
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
        <div className="mt-8 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-slate-400 gap-2">
          <span>Generated by PSITS-UA Portal System</span>
          <span>Security Hash: {order.id.replace(/-/g, '').slice(0, 16)}</span>
          <span>SIBALOM, ANTIQUE</span>
        </div>
      </div>
    </div>
  )
}
