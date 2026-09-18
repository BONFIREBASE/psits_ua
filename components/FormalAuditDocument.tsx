'use client'

import Image from 'next/image'
import type {
  OfficerRow,
  PostRow,
  BannerRow,
  MeetingRow,
  TreasuryRow,
  DocumentRow,
  AuditReportRow,
  EventRow,
} from '@/lib/supabase'
import type { Activity } from '@/data/events'
import type { Project } from '@/data/projects'
import type { constitutionData } from '@/data/constitution'

export type DocumentSectionId =
  | 'all'
  | 'executive'
  | 'officers'
  | 'coa'
  | 'attendance'
  | 'cbl'
  | 'treasury'
  | 'documents'
  | 'audit'

export interface FormalAuditDocumentProps {
  officersList: OfficerRow[]
  pubmatList: OfficerRow[]
  postsList: PostRow[]
  bannersList: BannerRow[]
  eventsList: (Activity | EventRow)[]
  projectsList: Project[]
  meetingsList?: MeetingRow[]
  treasuryList?: TreasuryRow[]
  documentsList?: DocumentRow[]
  auditReportsList?: AuditReportRow[]
  cblData?: typeof constitutionData
  generatedDate: string
  exportedBy: string
  selectedSection?: DocumentSectionId
}

/**
 * Standard University of Antique Institutional Letterhead
 */
function InstitutionalLetterhead({
  subtitle = 'College of Computing and Information Sciences',
  code = 'PRES-FM-008 REV.4/03-25-25',
}: {
  subtitle?: string
  code?: string
}) {
  return (
    <div className="pb-4 mb-4 border-b border-slate-900/80">
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

        {/* Center Text Block */}
        <div className="text-center flex-1 space-y-0.5">
          <p className="text-[10px] sm:text-[11px] font-serif uppercase tracking-widest text-slate-600 font-medium">
            Republic of the Philippines
          </p>
          <h1 className="font-serif font-black text-base sm:text-xl text-slate-900 tracking-wide uppercase">
            University of Antique
          </h1>
          <p className="text-[10px] sm:text-[11px] font-serif italic text-slate-600">
            Transforming Lives, Building Communities
          </p>
          <p className="text-[11px] font-serif uppercase text-slate-700 tracking-wider font-semibold">
            {subtitle}
          </p>
          <h2 className="font-sans font-bold text-[11px] sm:text-xs text-[#1B2A6B] tracking-wider uppercase pt-0.5">
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
      <div className="flex items-center justify-between text-[8.5px] font-mono text-slate-400 mt-2 pt-1 border-t border-slate-200">
        <span>ISO 9001:2015 Certified Institutional Documentation</span>
        <span>Control Code: {code}</span>
      </div>
    </div>
  )
}

/**
 * Standard Institutional Sign-Off Block (3-column)
 */
function LeadershipSignOff({
  date = 'Academic Year 2026–2027',
}: {
  date?: string
}) {
  return (
    <div className="pt-6 border-t-2 border-slate-800 print-avoid-break mt-6">
      <p className="text-[10.5px] text-slate-600 italic text-center mb-8 max-w-2xl mx-auto">
        &ldquo;I hereby certify on my official oath that the information set forth in this document constitutes an accurate, complete, and authentic transcript of records extracted directly from the Philippine Society of Information Technology Students — University of Antique Chapter Management System.&rdquo;
      </p>

      <div className="grid grid-cols-3 gap-8 text-center max-w-3xl mx-auto">
        {/* Prepared By */}
        <div className="space-y-1">
          <p className="text-[9.5px] text-slate-500 font-mono uppercase tracking-wider mb-8">Prepared by:</p>
          <div className="border-t border-slate-700 mx-2 pt-1">
            <p className="font-serif font-bold text-xs text-slate-900 uppercase">ARVIN JAMES J. BALQUIN</p>
            <p className="text-[10px] text-slate-600 font-sans">President, PSITS-UA</p>
          </div>
        </div>

        {/* Noted By */}
        <div className="space-y-1">
          <p className="text-[9.5px] text-slate-500 font-mono uppercase tracking-wider mb-8">Noted by:</p>
          <div className="border-t border-slate-700 mx-2 pt-1">
            <p className="font-serif font-bold text-xs text-slate-900 uppercase">CARL SPENCE PERCY, MIT</p>
            <p className="text-[10px] text-slate-600 font-sans">Adviser, PSITS-UA</p>
          </div>
        </div>

        {/* Approved By */}
        <div className="space-y-1">
          <p className="text-[9.5px] text-slate-500 font-mono uppercase tracking-wider mb-8">Approved by:</p>
          <div className="border-t border-slate-700 mx-2 pt-1">
            <p className="font-serif font-bold text-xs text-slate-900 uppercase">DR. JOHN C. AMAR, D.Mgt.</p>
            <p className="text-[10px] text-slate-600 font-sans">Dean, CCIS · University of Antique</p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-300 mt-8 pt-3 flex flex-col sm:flex-row items-center justify-between text-[9.5px] font-mono text-slate-500 gap-2">
        <span>Mayor Santiago A. Lotilla St., District I, Sibalom, Antique · Tel: 036 641 9030 to 37</span>
        <span>PRES-FM-008 REV.4/03-25-25</span>
        <span>ISO 9001:2015 Certified · Official Chapter Record</span>
      </div>
    </div>
  )
}

export default function FormalAuditDocument({
  officersList,
  pubmatList,
  postsList,
  bannersList,
  eventsList,
  projectsList,
  meetingsList = [],
  treasuryList = [],
  documentsList = [],
  auditReportsList = [],
  cblData,
  generatedDate,
  exportedBy,
  selectedSection = 'all',
}: FormalAuditDocumentProps) {
  const showAll = selectedSection === 'all'
  const isSec = (sec: DocumentSectionId) => showAll || selectedSection === sec

  return (
    <div className="print-container bg-white text-slate-900 font-sans p-6 sm:p-10 md:p-12 rounded-2xl shadow-2xl border border-slate-200 max-w-5xl mx-auto my-6 text-[12.5px] leading-relaxed">
      {/* ═══════════════════════════════════════════════════════
          SECTION 1: EXECUTIVE AUDIT & SYSTEM CENSUS
      ══════════════════════════════════════════════════════════ */}
      {isSec('executive') && (
        <section className="mb-10 print-avoid-break">
          <InstitutionalLetterhead code="PRES-FM-008 REV.4/03-25-25" />

          {/* Document Title & Audit Metadata */}
          <div className="text-center mb-6">
            <span className="inline-block text-[9.5px] font-mono tracking-[0.25em] uppercase font-bold text-[#1B2A6B] bg-blue-50 border border-blue-200 px-3 py-1 rounded-full mb-1.5">
              Official Master Archival Dossier · PRES-FM-008
            </span>
            <h3 className="font-serif font-black text-xl sm:text-2xl text-slate-900 uppercase tracking-tight">
              Master Organizational Archive & System Ledger
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              Comprehensive Institutional Record of Leadership, Programs, CBL, Attendance, Treasury, and Governance
            </p>
          </div>

          {/* Document Control Table */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-300 rounded-lg p-3.5 mb-6 text-xs font-mono">
            <div>
              <span className="text-[9.5px] text-slate-500 uppercase block font-semibold">Document Control</span>
              <span className="font-bold text-slate-800">PRES-FM-008 REV.4</span>
            </div>
            <div>
              <span className="text-[9.5px] text-slate-500 uppercase block font-semibold">Generation Date</span>
              <span className="font-bold text-slate-800">{generatedDate}</span>
            </div>
            <div>
              <span className="text-[9.5px] text-slate-500 uppercase block font-semibold">Academic Term</span>
              <span className="font-bold text-slate-800">A.Y. 2026–2027</span>
            </div>
            <div>
              <span className="text-[9.5px] text-slate-500 uppercase block font-semibold">System Operator</span>
              <span className="font-bold text-slate-800 truncate block" title={exportedBy}>
                {exportedBy}
              </span>
            </div>
          </div>

          {/* Executive Record Summary Table */}
          <div className="mb-8">
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider pb-1 mb-2 border-b border-slate-300 flex items-center justify-between text-slate-900">
              <span>I. Executive Record Summary (Master Ledger Census)</span>
              <span className="text-[9.5px] font-mono font-normal text-slate-500">Live Database Verification</span>
            </h4>
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                  <th className="p-2 border-r border-slate-300">Module Category</th>
                  <th className="p-2 border-r border-slate-300">Standard Code</th>
                  <th className="p-2 text-center border-r border-slate-300">Record Count</th>
                  <th className="p-2">Administrative Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2 font-medium border-r border-slate-300">Executive Officers</td>
                  <td className="p-2 font-mono text-[11px] text-slate-600 border-r border-slate-300">SORG-DIR-01</td>
                  <td className="p-2 font-mono text-center font-bold text-slate-900 border-r border-slate-300">{officersList.length}</td>
                  <td className="p-2 text-emerald-700 font-medium">Active & Validated</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="p-2 font-medium border-r border-slate-300">Pubmat Creative Team</td>
                  <td className="p-2 font-mono text-[11px] text-slate-600 border-r border-slate-300">PUBMAT-ROSTER</td>
                  <td className="p-2 font-mono text-center font-bold text-slate-900 border-r border-slate-300">{pubmatList.length}</td>
                  <td className="p-2 text-emerald-700 font-medium">Active & Validated</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium border-r border-slate-300">Calendar of Activities (COA)</td>
                  <td className="p-2 font-mono text-[11px] text-slate-600 border-r border-slate-300">PRES-FM-008</td>
                  <td className="p-2 font-mono text-center font-bold text-slate-900 border-r border-slate-300">{eventsList.length}</td>
                  <td className="p-2 text-emerald-700 font-medium">Approved for AY 2026–2027</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="p-2 font-medium border-r border-slate-300">Attendance Meetings</td>
                  <td className="p-2 font-mono text-[11px] text-slate-600 border-r border-slate-300">ATT-LOG-02</td>
                  <td className="p-2 font-mono text-center font-bold text-slate-900 border-r border-slate-300">{meetingsList.length}</td>
                  <td className="p-2 text-emerald-700 font-medium">Recorded in Registry</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium border-r border-slate-300">Constitution & By-Laws (CBL)</td>
                  <td className="p-2 font-mono text-[11px] text-slate-600 border-r border-slate-300">CBL-UA-2016</td>
                  <td className="p-2 font-mono text-center font-bold text-slate-900 border-r border-slate-300">{cblData?.articles.length || 14} Articles</td>
                  <td className="p-2 text-emerald-700 font-medium">Ratified & In Force</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="p-2 font-medium border-r border-slate-300">Treasury & Financial Records</td>
                  <td className="p-2 font-mono text-[11px] text-slate-600 border-r border-slate-300">FIN-AUD-26</td>
                  <td className="p-2 font-mono text-center font-bold text-slate-900 border-r border-slate-300">{treasuryList.length}</td>
                  <td className="p-2 text-emerald-700 font-medium">Semestral Baseline Active</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium border-r border-slate-300">Official Resolutions & Memos</td>
                  <td className="p-2 font-mono text-[11px] text-slate-600 border-r border-slate-300">SORG-FM-012</td>
                  <td className="p-2 font-mono text-center font-bold text-slate-900 border-r border-slate-300">{documentsList.length}</td>
                  <td className="p-2 text-emerald-700 font-medium">Enacted by Council</td>
                </tr>
              </tbody>
            </table>
          </div>

          {!showAll && <LeadershipSignOff />}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 2: OFFICERS & CREATIVE STAFF DIRECTORY
      ══════════════════════════════════════════════════════════ */}
      {isSec('officers') && (
        <section className={`mb-10 ${showAll ? 'print-page-break pt-6' : ''}`}>
          <InstitutionalLetterhead code="PRES-FM-008 REV.4/03-25-25" />

          <div className="border-b-2 border-slate-800 pb-1 mb-4 flex items-center justify-between">
            <h3 className="font-serif font-bold text-sm sm:text-base text-slate-900 uppercase tracking-wide">
              II. Official Leadership & Creative Staff Directory (AY 2026–2027)
            </h3>
            <span className="text-[10px] font-mono text-slate-500 font-semibold">PRES-FM-008</span>
          </div>

          {/* Executive Officers Table */}
          <div className="mb-6">
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider pb-1 mb-2 border-b border-slate-300 text-slate-800">
              Executive Committee & Class Governors
            </h4>
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300 text-[11px]">
                  <th className="p-1.5 w-10 text-center border-r border-slate-300">No.</th>
                  <th className="p-1.5 border-r border-slate-300">Official Name</th>
                  <th className="p-1.5 border-r border-slate-300">Position / Office</th>
                  <th className="p-1.5 border-r border-slate-300">Year / Section</th>
                  <th className="p-1.5 border-r border-slate-300">Institutional Email</th>
                  <th className="p-1.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {officersList.map((officer, i) => (
                  <tr key={officer.id || i} className="hover:bg-slate-50">
                    <td className="p-1.5 text-center font-mono text-slate-500 border-r border-slate-300">{i + 1}</td>
                    <td className="p-1.5 font-bold text-slate-900 border-r border-slate-300">{officer.name}</td>
                    <td className="p-1.5 text-[#1B2A6B] font-semibold border-r border-slate-300">{officer.position}</td>
                    <td className="p-1.5 text-slate-600 border-r border-slate-300">{officer.year_section || 'CCIS · BSIT'}</td>
                    <td className="p-1.5 font-mono text-[11px] text-slate-600 border-r border-slate-300">{officer.email || '—'}</td>
                    <td className="p-1.5 text-center text-emerald-700 font-medium">Active</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pubmat Creative Team Table */}
          <div className="mb-6">
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider pb-1 mb-2 border-b border-slate-300 text-slate-800">
              Publication & Creative Media Staff (Pubmat)
            </h4>
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300 text-[11px]">
                  <th className="p-1.5 w-10 text-center border-r border-slate-300">No.</th>
                  <th className="p-1.5 border-r border-slate-300">Staff Member</th>
                  <th className="p-1.5 border-r border-slate-300">Creative Role / Specialization</th>
                  <th className="p-1.5 border-r border-slate-300">Department</th>
                  <th className="p-1.5 border-r border-slate-300">Institutional Email</th>
                  <th className="p-1.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pubmatList.map((member, i) => (
                  <tr key={member.id || i} className="hover:bg-slate-50">
                    <td className="p-1.5 text-center font-mono text-slate-500 border-r border-slate-300">{i + 1}</td>
                    <td className="p-1.5 font-bold text-slate-900 border-r border-slate-300">{member.name}</td>
                    <td className="p-1.5 text-slate-800 font-medium border-r border-slate-300">{member.pubmat_role || member.position}</td>
                    <td className="p-1.5 text-slate-600 border-r border-slate-300">{member.year_section || 'CCIS · BSIT'}</td>
                    <td className="p-1.5 font-mono text-[11px] text-slate-600 border-r border-slate-300">{member.email || '—'}</td>
                    <td className="p-1.5 text-center text-emerald-700 font-medium">Active</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!showAll && <LeadershipSignOff />}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 3: CALENDAR OF ACTIVITIES (ACTION PROGRAM)
      ══════════════════════════════════════════════════════════ */}
      {isSec('coa') && (
        <section className={`mb-10 ${showAll ? 'print-page-break pt-6' : ''}`}>
          <InstitutionalLetterhead code="PRES-FM-008 REV.4/03-25-25" />

          <div className="border-b-2 border-slate-800 pb-1 mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-slate-900 uppercase tracking-wide">
                III. Action Program & Calendar of Activities (AY 2026–2027)
              </h3>
              <p className="text-[11px] text-slate-600">
                Official 15-Event Matrix Codified per PRES-FM-008 Internal Communication Standard
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 font-semibold">PRES-FM-008</span>
          </div>

          <table className="w-full text-left text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300 text-[11px]">
                <th className="p-2 border-r border-slate-300 w-1/4">Objectives</th>
                <th className="p-2 border-r border-slate-300 w-1/3">Strategies / Activities</th>
                <th className="p-2 border-r border-slate-300 w-1/5">Person Involved</th>
                <th className="p-2 w-1/5">Time Frame & Venue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {eventsList.length > 0 ? (
                eventsList.map((act, i) => {
                  const actTitle = 'title' in act ? act.title : act.activity
                  let actDesc = 'description' in act && act.description ? act.description : ''
                  let actInvolved = 'involved' in act ? act.involved : ''
                  if (actDesc.includes(' · Involved: ')) {
                    const parts = actDesc.split(' · Involved: ')
                    actDesc = parts[0]
                    if (!actInvolved) actInvolved = parts[1]
                  }
                  if (!actInvolved) actInvolved = 'CCIS IT Students & Officers'
                  if (!actDesc) actDesc = 'Official chapter activity codified under the approved Calendar of Activities AY 2026–2027.'
                  const actVenue = 'location' in act ? act.location : act.venue
                  const actTimeFrame = 'date' in act ? act.date : act.month
                  const actCategory = act.category || 'Academic'

                  return (
                    <tr key={('id' in act && act.id) || i} className="hover:bg-slate-50 align-top">
                      <td className="p-2 border-r border-slate-300 text-slate-700 text-[11.5px] leading-snug">
                        {actDesc}
                      </td>
                      <td className="p-2 border-r border-slate-300">
                        <span className="font-bold text-slate-900 block">{actTitle}</span>
                        <span className="text-[10px] font-mono uppercase text-[#1B2A6B] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 inline-block mt-1">
                          {actCategory}
                        </span>
                      </td>
                      <td className="p-2 border-r border-slate-300 text-slate-700 font-medium text-[11.5px]">
                        {actInvolved}
                      </td>
                      <td className="p-2 font-mono text-[11px] text-slate-700 leading-snug">
                        <div className="font-bold text-slate-900">{actTimeFrame}</div>
                        <div className="text-slate-600">{actVenue}</div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-4 text-center font-mono text-xs text-slate-400 italic">
                    No scheduled activities registered in the official database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {!showAll && <LeadershipSignOff />}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 4: ATTENDANCE SYSTEM LEDGER
      ══════════════════════════════════════════════════════════ */}
      {isSec('attendance') && (
        <section className={`mb-10 ${showAll ? 'print-page-break pt-6' : ''}`}>
          <InstitutionalLetterhead code="ATT-LOG-02" />

          <div className="border-b-2 border-slate-800 pb-1 mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-slate-900 uppercase tracking-wide">
                IV. Attendance System & Meeting Logs (AY 2026–2027)
              </h3>
              <p className="text-[11px] text-slate-600">
                Official Assembly Log and Quorum Register per CBL Article VIII Section 2
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 font-semibold">ATT-LOG-02</span>
          </div>

          <div className="bg-slate-50 border border-slate-300 rounded-lg p-3.5 mb-6 text-xs text-slate-700">
            <p className="font-bold text-slate-900 mb-1">CBL Attendance & Fines Mandate:</p>
            <p className="italic">
              &ldquo;All members are required to attend regular monthly meetings scheduled every last week of the month.
              An unexcused absence incurs a statutory fine of ₱100.00 as ratified under Article VIII, Section 2.&rdquo;
            </p>
          </div>

          <table className="w-full text-left text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300 text-[11px]">
                <th className="p-2 w-10 text-center border-r border-slate-300">No.</th>
                <th className="p-2 border-r border-slate-300">Assembly / Meeting Title</th>
                <th className="p-2 border-r border-slate-300">Session Type</th>
                <th className="p-2 border-r border-slate-300">Scheduled Date & Time</th>
                <th className="p-2 border-r border-slate-300">Venue</th>
                <th className="p-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {meetingsList.length > 0 ? (
                meetingsList.map((m, i) => (
                  <tr key={m.id || i} className="hover:bg-slate-50">
                    <td className="p-2 text-center font-mono text-slate-500 border-r border-slate-300">{i + 1}</td>
                    <td className="p-2 font-bold text-slate-900 border-r border-slate-300">{m.title}</td>
                    <td className="p-2 uppercase font-mono text-[10px] text-[#1B2A6B] border-r border-slate-300">{m.type} Session</td>
                    <td className="p-2 font-mono text-[11px] text-slate-700 border-r border-slate-300">
                      {m.date} · {m.start_time} - {m.end_time}
                    </td>
                    <td className="p-2 text-slate-700 border-r border-slate-300">{m.location}</td>
                    <td className="p-2 text-center text-emerald-700 font-bold uppercase text-[10.5px]">{m.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-4 text-center font-mono text-xs text-slate-400 italic">
                    No assembly records registered in the official database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {!showAll && <LeadershipSignOff />}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 5: CONSTITUTION AND BY-LAWS (CBL)
      ══════════════════════════════════════════════════════════ */}
      {isSec('cbl') && (
        <section className={`mb-10 ${showAll ? 'print-page-break pt-6' : ''}`}>
          <InstitutionalLetterhead code="CBL-UA-2016" />

          <div className="border-b-2 border-slate-800 pb-1 mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-serif font-black text-sm sm:text-base text-slate-900 uppercase tracking-wide">
                V. Constitution and By-Laws (CBL)
              </h3>
              <p className="text-[11px] text-slate-600">
                Philippine Society of Information Technology Students — University of Antique Chapter
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 font-semibold">CBL-UA-2016</span>
          </div>

          {/* Historical Heritage */}
          <div className="bg-slate-50 border border-slate-300 rounded-lg p-3.5 mb-6 text-xs text-slate-700 space-y-1.5">
            <h4 className="font-serif font-bold text-slate-900 uppercase text-xs">Origins & Institutional Heritage</h4>
            <p className="leading-relaxed">
              Founded on <strong>January 8, 1993</strong> through the efforts of <strong>Mrs. Nelly E. Mistio</strong> at the
              Polytechnic State College of Antique (PSCA), approved by the College President as an Interest Group.
              Amended in <strong>A.Y. 2016–2017</strong> to the <em>Philippine Society of Information Technology Students – UA Chapter</em>,
              exclusive to all Information Technology students of the College of Computing and Information Sciences.
            </p>
          </div>

          {/* Official Preamble */}
          <div className="my-6 p-4 border-l-4 border-[#1B2A6B] bg-blue-50/50 rounded-r-lg font-serif">
            <h4 className="font-bold text-xs uppercase text-[#1B2A6B] tracking-wider mb-1">The Official Preamble</h4>
            <p className="italic text-xs sm:text-[12.5px] leading-relaxed text-slate-800 text-justify">
              &ldquo;We, the members of PHILIPPINE SOCIETY OF INFORMATION TECHNOLOGY STUDENTS – UA of the University of Antique,
              imploring the aid of God Almighty in order to establish a wholesome society that shall embody our ideals, promote,
              conserve, and develop the patrimony of our school and serve to ourselves and our posterity, the blessing of our
              national unity therefor promulgate this constitution.&rdquo;
            </p>
          </div>

          {/* Key Articles Grid */}
          <div className="space-y-4 text-xs text-slate-800">
            {cblData?.articles.map((art) => (
              <div key={art.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50/30">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-2">
                  <h5 className="font-serif font-bold text-slate-900 text-[12px]">
                    {art.article}: {art.title}
                  </h5>
                  {art.tag && (
                    <span className="text-[9.5px] font-mono text-slate-500 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                      {art.tag}
                    </span>
                  )}
                </div>
                <div className="space-y-1.5 text-[11.5px] text-slate-700">
                  {art.sections.map((sec, idx) => (
                    <p key={idx} className="leading-snug">
                      {sec.number && <strong className="text-slate-900">{sec.number}: </strong>}
                      {Array.isArray(sec.content) ? sec.content.join(' ') : sec.content}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {!showAll && <LeadershipSignOff />}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 6: TREASURY & FINANCIAL LEDGER
      ══════════════════════════════════════════════════════════ */}
      {isSec('treasury') && (
        <section className={`mb-10 ${showAll ? 'print-page-break pt-6' : ''}`}>
          <InstitutionalLetterhead code="FIN-AUD-26" />

          <div className="border-b-2 border-slate-800 pb-1 mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-slate-900 uppercase tracking-wide">
                VI. Treasury & Financial Statement (AY 2026–2027)
              </h3>
              <p className="text-[11px] text-slate-600">
                Official Financial Statement, Dues Assessment, and Asset Inventory
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 font-semibold">FIN-AUD-26</span>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6 text-center text-xs font-mono">
            <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg">
              <span className="text-[9.5px] text-slate-500 uppercase block">Semestral Membership Due</span>
              <span className="text-sm font-bold text-slate-900">₱25.00 / Student</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg">
              <span className="text-[9.5px] text-slate-500 uppercase block">Statutory Absence Fine</span>
              <span className="text-sm font-bold text-slate-900">₱100.00 / Session</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg">
              <span className="text-[9.5px] text-slate-500 uppercase block">Income Generating Asset</span>
              <span className="text-sm font-bold text-[#1B2A6B]">SUGALAW Photo Booth</span>
            </div>
          </div>

          {/* Treasury Table */}
          <table className="w-full text-left text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300 text-[11px]">
                <th className="p-2 w-10 text-center border-r border-slate-300">No.</th>
                <th className="p-2 border-r border-slate-300">Transaction / Ledger Item</th>
                <th className="p-2 border-r border-slate-300">Academic Period</th>
                <th className="p-2 border-r border-slate-300">Description / Authorization</th>
                <th className="p-2 text-right border-r border-slate-300">Amount (PHP)</th>
                <th className="p-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {treasuryList.length > 0 ? (
                treasuryList.map((t, i) => (
                  <tr key={t.id || i} className="hover:bg-slate-50">
                    <td className="p-2 text-center font-mono text-slate-500 border-r border-slate-300">{i + 1}</td>
                    <td className="p-2 font-bold text-slate-900 border-r border-slate-300">{t.title}</td>
                    <td className="p-2 font-mono text-[11px] text-slate-600 border-r border-slate-300">{t.period}</td>
                    <td className="p-2 text-slate-700 border-r border-slate-300">{t.description}</td>
                    <td className="p-2 font-mono text-right font-bold text-slate-900 border-r border-slate-300">
                      ₱{Number(t.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 text-center text-emerald-700 font-bold uppercase text-[10px]">{t.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-4 text-center font-mono text-xs text-slate-400 italic">
                    No financial ledger entries registered in the official database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {!showAll && <LeadershipSignOff />}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 7: DOCUMENTS & RESOLUTIONS REGISTRY
      ══════════════════════════════════════════════════════════ */}
      {isSec('documents') && (
        <section className={`mb-10 ${showAll ? 'print-page-break pt-6' : ''}`}>
          <InstitutionalLetterhead code="SORG-FM-012 Rev.0/05-24-24" />

          <div className="border-b-2 border-slate-800 pb-1 mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-slate-900 uppercase tracking-wide">
                VII. Registry of Official Resolutions & Documents
              </h3>
              <p className="text-[11px] text-slate-600">
                Official Enactments per SORG-FM-012 Student Organization Resolution Standard
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 font-semibold">SORG-FM-012</span>
          </div>

          <table className="w-full text-left text-xs border-collapse border border-slate-300 mb-6">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300 text-[11px]">
                <th className="p-2 w-10 text-center border-r border-slate-300">No.</th>
                <th className="p-2 border-r border-slate-300">Reference No.</th>
                <th className="p-2 border-r border-slate-300">Document Title</th>
                <th className="p-2 border-r border-slate-300">Category</th>
                <th className="p-2 border-r border-slate-300">Date Enacted</th>
                <th className="p-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {documentsList.length > 0 ? (
                documentsList.map((doc, i) => (
                  <tr key={doc.id || i} className="hover:bg-slate-50">
                    <td className="p-2 text-center font-mono text-slate-500 border-r border-slate-300">{i + 1}</td>
                    <td className="p-2 font-mono font-bold text-slate-900 border-r border-slate-300">{doc.reference_no}</td>
                    <td className="p-2 font-bold text-[#1B2A6B] border-r border-slate-300 leading-snug">{doc.title}</td>
                    <td className="p-2 uppercase font-mono text-[10px] text-slate-600 border-r border-slate-300">{doc.category}</td>
                    <td className="p-2 font-mono text-[11px] text-slate-600 border-r border-slate-300">{doc.date}</td>
                    <td className="p-2 text-center text-emerald-700 font-bold uppercase text-[10px]">{doc.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-4 text-center font-mono text-xs text-slate-400 italic">
                    No official resolutions or documents registered in the official database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Excerpt of Landmark Resolution No. 01 */}
          <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 text-xs font-serif space-y-2">
            <h4 className="font-bold uppercase text-slate-900 text-xs">
              Highlighted Enactment: Resolution No. 01, Series of 2026
            </h4>
            <p className="font-bold text-[#1B2A6B] leading-snug">
              &ldquo;A RESOLUTION AUTHORIZING THE ESTABLISHMENT AND OPERATION OF THE &lsquo;SUGALAW 2026 PHOTO BOOTH&rsquo;
              AS AN INCOME-GENERATING PROJECT AND LONG-TERM ORGANIZATIONAL ASSET OF PSITS-UA&rdquo;
            </p>
            <p className="text-slate-600 text-[11.5px] italic leading-relaxed">
              Adopted on August 17, 2026 at CCIS Student Organizations Office.
              Certified by Kimberly Ann Erispe (Secretary); Attested by Arvin James Balquin (President);
              Noted by Dr. John C. Amar (Dean); Recommended by Wilma Fe S. Vego (SORG Director) and Dr. Runato A. Basañes (Student Affairs Director);
              Approved by Dr. Catherine C. Viesca (Vice President for Academic Affairs).
            </p>
          </div>

          {!showAll && <LeadershipSignOff />}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 8: AUDIT TRAIL & FINAL CERTIFICATION
      ══════════════════════════════════════════════════════════ */}
      {isSec('audit') && (
        <section className={`mb-10 ${showAll ? 'print-page-break pt-6' : ''}`}>
          <InstitutionalLetterhead code="PRES-FM-008 REV.4/03-25-25" />

          <div className="border-b-2 border-slate-800 pb-1 mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-slate-900 uppercase tracking-wide">
                VIII. Audit Trail, Media Assets & Master Certification
              </h3>
              <p className="text-[11px] text-slate-600">
                Official Chapter Audit Clearance and Database Integrity Seal
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 font-semibold">PRES-FM-008</span>
          </div>

          {/* Social Dispatches Table */}
          <div className="mb-6">
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider pb-1 mb-2 border-b border-slate-300 text-slate-800">
              Published Media Dispatches & Official Advisories
            </h4>
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300 text-[11px]">
                  <th className="p-1.5 w-10 text-center border-r border-slate-300">No.</th>
                  <th className="p-1.5 border-r border-slate-300">Dispatch Headline</th>
                  <th className="p-1.5 border-r border-slate-300">Category</th>
                  <th className="p-1.5 border-r border-slate-300">Publication Date</th>
                  <th className="p-1.5">Editorial Credits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {postsList.length > 0 ? (
                  postsList.slice(0, 10).map((post, i) => {
                    let creditsStr = 'PSITS-UA Editorial Board'
                    if (post.credits && typeof post.credits === 'object') {
                      creditsStr = Object.entries(post.credits)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(', ')
                    } else if (post.quote_author) {
                      creditsStr = post.quote_author
                    }

                    return (
                      <tr key={post.id || i} className="hover:bg-slate-50">
                        <td className="p-1.5 text-center font-mono text-slate-500 border-r border-slate-300">{i + 1}</td>
                        <td className="p-1.5 font-semibold text-slate-900 border-r border-slate-300">{post.title}</td>
                        <td className="p-1.5 text-[#1B2A6B] font-medium border-r border-slate-300">{post.category}</td>
                        <td className="p-1.5 font-mono text-[11px] text-slate-600 border-r border-slate-300">{post.date}</td>
                        <td className="p-1.5 text-slate-700 truncate max-w-[200px]" title={creditsStr}>{creditsStr}</td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center font-mono text-xs text-slate-400 italic">
                      No media dispatches or advisories registered in the official database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Master Institutional Sign-Off Block */}
          <LeadershipSignOff />
        </section>
      )}
    </div>
  )
}
