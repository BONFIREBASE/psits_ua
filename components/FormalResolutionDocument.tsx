'use client'

import Image from 'next/image'

export interface ResolutionData {
  referenceNo: string
  seriesYear?: string
  title: string
  meetingDate?: string
  meetingVenue?: string
  dateAdopted?: string
  description?: string
  whereasClauses?: string[]
  resolvedClauses?: string[]
  secretaryName?: string
  presidentName?: string
  adviserName?: string
  deanName?: string
  sorgDirectorName?: string
  studentAffairsDirectorName?: string
  vpaaName?: string
}

interface FormalResolutionDocumentProps {
  resolution: ResolutionData
}

export default function FormalResolutionDocument({ resolution }: FormalResolutionDocumentProps) {
  const seriesYear = resolution.seriesYear || '2026'
  const meetingDate = resolution.meetingDate || 'August 17, 2026'
  const meetingVenue = resolution.meetingVenue || 'CCIS Student Organizations Office'
  const dateAdopted = resolution.dateAdopted || '17th day of August, 2026'
  const secretaryName = resolution.secretaryName || 'KIMBERLY ANN ERISPE'
  const presidentName = resolution.presidentName || 'ARVIN JAMES BALQUIN'
  const adviserName = resolution.adviserName || 'CARL SPENCE PERCY, MIT'
  const deanName = resolution.deanName || 'DR. JOHN C. AMAR, D.Mgt.'
  const sorgDirectorName = resolution.sorgDirectorName || 'WILMA FE S. VEGO, MATPE'
  const studentAffairsDirectorName = resolution.studentAffairsDirectorName || 'RUNATO A. BASAÑES, PhD'
  const vpaaName = resolution.vpaaName || 'CATHERINE C. VIESCA, CPA, PhD'

  // If description has paragraphs, parse them or fallback to default resolution clauses
  const defaultWhereas = [
    'the Philippine Society of Information Technology Students – University of Antique Chapter (PSITS-UA) seeks to develop activities and projects that promote student engagement, creativity, innovation, and organizational development;',
    'the proposed project and organizational action are designed to serve and benefit the entire studentry of the College of Computing and Information Sciences;',
    'the implementation of this measure is conducted in strict accordance with the policies, guidelines, and directives of the University of Antique and the Student Organizations and Activities Unit:',
  ]

  const defaultResolved = [
    `the Philippine Society of Information Technology Students – University of Antique Chapter (PSITS-UA) officially approves and ratifies: ${resolution.title};`,
    'the designated officers, committees, and coordinators of PSITS-UA are authorized to undertake all necessary preparations and technical executions in pursuit thereof;',
    'this resolution shall take effect immediately upon official review and concurrence by the competent academic and administrative authorities of the University of Antique.',
  ]

  const whereasList = (resolution.whereasClauses && resolution.whereasClauses.length > 0)
    ? resolution.whereasClauses
    : (resolution.description
        ? resolution.description.split('\n\n').filter(Boolean)
        : defaultWhereas)

  const resolvedList = (resolution.resolvedClauses && resolution.resolvedClauses.length > 0)
    ? resolution.resolvedClauses
    : defaultResolved

  return (
    <div className="print-container bg-white text-slate-900 font-serif p-8 sm:p-12 md:p-14 rounded-2xl shadow-2xl border border-slate-200 max-w-4xl mx-auto my-6 text-[13px] leading-relaxed">
      {/* ─── Institutional Letterhead ─── */}
      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-1">
        {/* University Logo */}
        <div className="w-20 h-20 relative flex-shrink-0">
          <Image
            src="/assets/logo/UA Logo.png"
            alt="University of Antique"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Center Institutional Typography */}
        <div className="text-center px-4 space-y-0.5 font-serif">
          <p className="text-[11px] uppercase tracking-widest text-slate-600 font-medium">
            Republic of the Philippines
          </p>
          <h1 className="font-black text-xl sm:text-2xl text-slate-900 tracking-wide uppercase">
            University of Antique
          </h1>
          <p className="text-xs uppercase text-slate-700 tracking-wider font-semibold">
            Sibalom, Antique
          </p>
          <div className="pt-1">
            <p className="text-[11px] font-sans font-bold uppercase tracking-wider text-slate-800">
              Student Organizations and Activities Unit
            </p>
            <p className="text-[10px] font-sans text-slate-500">
              sorg@antiquespride.edu.ph
            </p>
          </div>
        </div>

        {/* PSITS Chapter Logo */}
        <div className="w-20 h-20 relative flex-shrink-0">
          <Image
            src="/assets/logo/PSITS logo.png"
            alt="PSITS-UA Crest"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
      <div className="border-b border-slate-400 pb-0.5 mb-6" />

      {/* ─── Document Title & Excerpt ─── */}
      <div className="text-center mb-6 space-y-1">
        <h2 className="font-black text-base sm:text-lg text-slate-900 uppercase tracking-wide">
          Resolution of Student Organizations
        </h2>
        <h3 className="font-sans font-bold text-xs sm:text-sm text-[#1B2A6B] tracking-wider uppercase">
          Philippine Society of Information Technology Students – University of Antique Chapter
        </h3>
        <p className="text-xs italic text-slate-600 pt-2">
          EXCERPT FROM THE MINUTES OF THE REGULAR MEETING ON {meetingDate.toUpperCase()} AT THE {meetingVenue.toUpperCase()}
        </p>
      </div>

      {/* Resolution Number */}
      <div className="text-center my-4">
        <p className="font-black text-sm tracking-wider uppercase text-slate-900">
          {resolution.referenceNo.startsWith('Resolution') ? resolution.referenceNo : `Resolution No. ${resolution.referenceNo || '01'}`}
        </p>
        <p className="text-xs font-semibold text-slate-700 uppercase">
          Series of {seriesYear}
        </p>
      </div>

      {/* Resolution Title */}
      <div className="my-6 px-4 text-center">
        <p className="font-bold text-sm sm:text-base leading-snug uppercase tracking-tight text-slate-900 max-w-2xl mx-auto">
          {resolution.title.startsWith('A RESOLUTION') ? resolution.title : `A RESOLUTION ${resolution.title.toUpperCase()}`}
        </p>
      </div>

      {/* ─── WHEREAS Clauses ─── */}
      <div className="space-y-3.5 my-6 text-justify text-xs sm:text-[13px] leading-relaxed">
        {whereasList.map((clause, idx) => (
          <p key={idx} className="indent-8">
            <span className="font-bold">WHEREAS, </span>
            {clause.replace(/^(WHEREAS,?\s*)/i, '')}
          </p>
        ))}
      </div>

      {/* ─── RESOLVED Clauses ─── */}
      <div className="space-y-3.5 my-6 text-justify text-xs sm:text-[13px] leading-relaxed">
        {resolvedList.map((clause, idx) => {
          const isFirst = idx === 0
          const isLast = idx === resolvedList.length - 1
          const prefix = isFirst
            ? 'RESOLVED, that '
            : isLast
            ? 'RESOLVED FINALLY, that '
            : 'RESOLVED FURTHER, that '
          const cleanText = clause.replace(/^(RESOLVED(\s+FURTHER|\s+FINALLY)?,?\s+that\s*)/i, '')

          return (
            <p key={idx} className="indent-8">
              <span className="font-bold">{prefix}</span>
              {cleanText}
            </p>
          )
        })}
      </div>

      {/* Adoption Clause */}
      <div className="my-8 text-xs sm:text-[13px]">
        <p className="indent-8">
          Adopted this {dateAdopted} at the {meetingVenue}.
        </p>
      </div>

      {/* ─── Official Signatory Matrix (SORG-FM-012) ─── */}
      <div className="pt-6 border-t border-slate-300 space-y-6 print-avoid-break text-xs">
        {/* Tier 1: Certified Correct & Attested */}
        <div className="grid grid-cols-2 gap-8 text-left">
          <div>
            <p className="text-slate-600 font-sans text-[11px] mb-8">Certified Correct:</p>
            <div className="border-b border-slate-700 inline-block min-w-[200px] pb-0.5">
              <p className="font-bold uppercase text-slate-900">{secretaryName}</p>
            </div>
            <p className="text-[11px] font-sans text-slate-600">Secretary, PSITS-UA</p>
          </div>
          <div>
            <p className="text-slate-600 font-sans text-[11px] mb-8">Attested:</p>
            <div className="border-b border-slate-700 inline-block min-w-[200px] pb-0.5">
              <p className="font-bold uppercase text-slate-900">{presidentName}</p>
            </div>
            <p className="text-[11px] font-sans text-slate-600">President, PSITS-UA</p>
          </div>
        </div>

        {/* Tier 2: Noted by Advisers / Deans */}
        <div>
          <p className="text-slate-600 font-sans text-[11px] mb-8">Noted:</p>
          <div className="grid grid-cols-2 gap-8 text-left">
            <div>
              <div className="border-b border-slate-700 inline-block min-w-[200px] pb-0.5">
                <p className="font-bold uppercase text-slate-900">{adviserName}</p>
              </div>
              <p className="text-[11px] font-sans text-slate-600">Adviser, PSITS-UA</p>
            </div>
            <div>
              <div className="border-b border-slate-700 inline-block min-w-[200px] pb-0.5">
                <p className="font-bold uppercase text-slate-900">{deanName}</p>
              </div>
              <p className="text-[11px] font-sans text-slate-600">Dean, College of Computing and Information Sciences</p>
            </div>
          </div>
        </div>

        {/* Tier 3: Recommending Approval */}
        <div>
          <p className="text-slate-600 font-sans text-[11px] mb-8">Recommending Approval:</p>
          <div className="grid grid-cols-2 gap-8 text-left">
            <div>
              <div className="border-b border-slate-700 inline-block min-w-[200px] pb-0.5">
                <p className="font-bold uppercase text-slate-900">{sorgDirectorName}</p>
              </div>
              <p className="text-[11px] font-sans text-slate-600">Director, Student Organizations and Activities Unit</p>
            </div>
            <div>
              <div className="border-b border-slate-700 inline-block min-w-[200px] pb-0.5">
                <p className="font-bold uppercase text-slate-900">{studentAffairsDirectorName}</p>
              </div>
              <p className="text-[11px] font-sans text-slate-600">Executive Director, Student Affairs Division</p>
            </div>
          </div>
        </div>

        {/* Tier 4: Approved */}
        <div>
          <p className="text-slate-600 font-sans text-[11px] mb-8">Approved:</p>
          <div className="text-left">
            <div className="border-b border-slate-700 inline-block min-w-[240px] pb-0.5">
              <p className="font-bold uppercase text-slate-900">{vpaaName}</p>
            </div>
            <p className="text-[11px] font-sans text-slate-600">Vice President for Academic Affairs</p>
          </div>
        </div>
      </div>

      {/* ─── Institutional Document Footer ─── */}
      <div className="border-t border-slate-300 mt-10 pt-3 flex items-center justify-between text-[11px] font-sans text-slate-500">
        <span className="font-mono">SORG-FM-012</span>
        <span className="font-mono">Rev.0/05-24-24</span>
      </div>
    </div>
  )
}
