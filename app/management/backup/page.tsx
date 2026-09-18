'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ShieldCheck,
  Calendar,
  Users,
  ClipboardCheck,
  FolderOpen,
  RefreshCw,
  Printer,
  FileText,
  BookOpen,
} from 'lucide-react'
import { projectsData } from '@/data/projects'
import { constitutionData } from '@/data/constitution'
import { useAuth } from '../_context/auth-context'
import {
  supabase,
  getOfficers,
  getPosts,
  getBanners,
  getMeetings,
  getTreasuryRecords,
  getDocuments,
  getAuditReports,
  getEvents,
  type OfficerRow,
  type PostRow,
  type BannerRow,
  type MeetingRow,
  type TreasuryRow,
  type DocumentRow,
  type AuditReportRow,
  type EventRow,
} from '@/lib/supabase'
import FormalAuditDocument, { type DocumentSectionId } from '@/components/FormalAuditDocument'

export default function BackupManagementPage() {
  const { user } = useAuth()

  const [selectedSection, setSelectedSection] = useState<DocumentSectionId>('coa')
  const [previewDoc, setPreviewDoc] = useState<DocumentSectionId | null>(null)
  const [isLoadingLive, setIsLoadingLive] = useState(true)

  // Live database records across all institutional modules
  const [liveOfficers, setLiveOfficers] = useState<OfficerRow[]>([])
  const [livePosts, setLivePosts] = useState<PostRow[]>([])
  const [liveBanners, setLiveBanners] = useState<BannerRow[]>([])
  const [liveMeetings, setLiveMeetings] = useState<MeetingRow[]>([])
  const [liveTreasury, setLiveTreasury] = useState<TreasuryRow[]>([])
  const [liveDocuments, setLiveDocuments] = useState<DocumentRow[]>([])
  const [liveAuditReports, setLiveAuditReports] = useState<AuditReportRow[]>([])
  const [liveEvents, setLiveEvents] = useState<EventRow[]>([])

  // Load real database content from Supabase
  const fetchLiveRecords = useCallback(async () => {
    setIsLoadingLive(true)
    try {
      const [
        officersData,
        postsDataRes,
        bannersData,
        meetingsData,
        treasuryData,
        documentsData,
        auditReportsData,
        eventsData,
      ] = await Promise.all([
        getOfficers(),
        getPosts(),
        getBanners(),
        getMeetings(),
        getTreasuryRecords(),
        getDocuments(),
        getAuditReports(),
        getEvents(),
      ])
      setLiveOfficers(officersData || [])
      setLivePosts(postsDataRes || [])
      setLiveBanners(bannersData || [])
      setLiveMeetings(meetingsData || [])
      setLiveTreasury(treasuryData || [])
      setLiveDocuments(documentsData || [])
      setLiveAuditReports(auditReportsData || [])
      setLiveEvents(eventsData || [])
    } catch (err) {
      console.warn('Error loading live database records:', err)
    } finally {
      setIsLoadingLive(false)
    }
  }, [])

  // Initial fetch and Realtime subscription
  useEffect(() => {
    fetchLiveRecords()

    // Subscribe to realtime changes on public schema so changes update instantly
    const channel = supabase
      .channel('realtime-backup-portal')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        () => {
          fetchLiveRecords()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchLiveRecords])

  // Partition officers vs pubmat team directly from real database records
  const executiveOfficers = useMemo<OfficerRow[]>(() => {
    return liveOfficers.filter((o) => !o.is_pubmat)
  }, [liveOfficers])

  const pubmatCreativeTeam = useMemo<OfficerRow[]>(() => {
    return liveOfficers.filter((o) => o.is_pubmat)
  }, [liveOfficers])

  const effectivePosts = useMemo<PostRow[]>(() => {
    return livePosts
  }, [livePosts])

  if (user && user.role !== 'admin') {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4 pt-24">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
          <ShieldCheck size={28} />
        </div>
        <h2 className="font-display font-bold text-xl text-white">Access Restricted</h2>
        <p className="text-xs text-white/50 leading-relaxed">
          System backup and accredited report operations are restricted exclusively to authorized administration.
        </p>
      </div>
    )
  }

  function printDocument(docId: DocumentSectionId) {
    setSelectedSection(docId)
    setTimeout(() => {
      window.print()
    }, 100)
  }

  const documentItems: {
    id: DocumentSectionId
    title: string
    code: string
    desc: string
    count: string
    icon: typeof Calendar
    tag: string
  }[] = [
    {
      id: 'coa',
      title: 'Calendar of Activities (Action Program)',
      code: 'PRES-FM-008 REV.4/03-25-25',
      desc: 'Official 15-event matrix for AY 2026–2027: Objectives, Strategies, Person Involved, Time Frame & Venue.',
      count: `${liveEvents.length} Activities`,
      icon: Calendar,
      tag: `${liveEvents.length} Events`,
    },
    {
      id: 'officers',
      title: 'Officers & Pubmat Leadership Directory',
      code: 'PRES-FM-008',
      desc: 'Full tabular census of Executive Committee, Class Governors, and Creative Media Staff.',
      count: `${executiveOfficers.length + pubmatCreativeTeam.length} Members`,
      icon: Users,
      tag: `${executiveOfficers.length + pubmatCreativeTeam.length} Active`,
    },
    {
      id: 'attendance',
      title: 'Attendance System & Meeting Logs',
      code: 'ATT-LOG-02',
      desc: 'Assembly schedules, regular and emergency meeting logs, quorum records, and CBL attendance compliance.',
      count: `${liveMeetings.length} Sessions`,
      icon: ClipboardCheck,
      tag: 'CBL Mandate',
    },
    {
      id: 'cbl',
      title: 'Codified Constitution and By-Laws (CBL)',
      code: 'CBL-UA-2016',
      desc: 'Ratified CBL: Historical Heritage (Jan 8, 1993 by Mrs. Nelly E. Mistio), Preamble, and Articles I–XIV.',
      count: `${constitutionData.articles.length} Articles`,
      icon: BookOpen,
      tag: 'In Force',
    },
    {
      id: 'treasury',
      title: 'Treasury & Financial Statement',
      code: 'FIN-AUD-26',
      desc: 'Semestral membership dues assessment (₱25/sem), transaction records, and revenue assets.',
      count: `${liveTreasury.length} Records`,
      icon: FolderOpen,
      tag: 'Financial Ledger',
    },
    {
      id: 'documents',
      title: 'Registry of Resolutions & Documents',
      code: 'SORG-FM-012 Rev.0/05-24-24',
      desc: 'Official legislative enactments, executive resolutions, memorandums, and organizational permits.',
      count: `${liveDocuments.length} Documents`,
      icon: FileText,
      tag: 'SORG Standard',
    },
    {
      id: 'executive',
      title: 'Executive Summary & Master Census',
      code: 'PRES-FM-008',
      desc: 'Master system census, database inventory, academic term metadata, and verification clearance.',
      count: '8 Modules',
      icon: ClipboardCheck,
      tag: 'Accreditation',
    },
    {
      id: 'audit',
      title: 'System Audit Trail & Final Certification',
      code: 'PRES-FM-008 REV.4/03-25-25',
      desc: 'System audit trail, published dispatches, integrity verification, and master leadership sign-off.',
      count: `${effectivePosts.length} Records`,
      icon: ShieldCheck,
      tag: 'Certification',
    },
  ]

  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Non-Printable Top Action Bar */}
      <div className="no-print space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight flex items-center gap-2.5">
              <span>Official Institutional Documents & Reports</span>
              {isLoadingLive && (
                <RefreshCw size={16} className="animate-spin text-gold" />
              )}
            </h1>
            <p className="text-xs sm:text-sm text-white/50 mt-1">
              Accredited University of Antique printable reports connected live to database with real-time sync. Select any document below to preview or print directly onto standard bond paper.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Button-Driven Formal Documents Catalog ─── */}
      <div className="no-print space-y-6">

        {/* Grid of Individual Bond Paper Document Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-white/40">
              Individual Accredited Documents (Print Each on Separate Bond Paper)
            </h3>
            <span className="text-[11px] text-gold/70 font-mono">8 Documents Ready</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documentItems.map((item) => {
              const IconComponent = item.icon
              return (
                <div
                  key={item.id}
                  className="p-5 rounded-xl border border-white/8 hover:border-gold/30 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-gold font-bold px-2 py-0.5 rounded bg-gold/10 border border-gold/20">
                        {item.code}
                      </span>
                      <span className="text-[10px] font-mono text-white/40">
                        {item.tag}
                      </span>
                    </div>
                    <div className="flex items-start gap-3 pt-1">
                      <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/8 flex items-center justify-center text-white/60 group-hover:text-gold group-hover:border-gold/30 transition-colors flex-shrink-0">
                        <IconComponent size={18} />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h4 className="font-display font-bold text-sm text-white group-hover:text-gold transition-colors leading-snug">
                          {item.title}
                        </h4>
                        <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-white/40">
                      {item.count}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewDoc(item.id)}
                        className="px-3 py-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/5 text-xs transition-colors cursor-pointer"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => printDocument(item.id)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gold/15 hover:bg-gold text-gold hover:text-slate-950 font-bold text-xs border border-gold/30 hover:border-gold transition-all active:scale-95 shadow-sm cursor-pointer"
                      >
                        <Printer size={13} />
                        <span>Print Bond Paper</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── MODAL PREVIEW OVERLAY (Only shown when preview clicked) ─── */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto no-print">
          <div className="relative w-full max-w-5xl my-8 bg-slate-900 border border-white/15 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gold/10 text-gold">
                  <Printer size={18} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-base">
                    Document Print Preview
                  </h3>
                  <p className="text-xs text-white/40 font-mono">
                    University of Antique · PSITS-UA Chapter Accreditation
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printDocument(previewDoc)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-slate-950 font-bold text-xs hover:bg-gold-light transition-all shadow-md cursor-pointer"
                >
                  <Printer size={14} />
                  Print Now
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-3 py-2 text-white/50 hover:text-white rounded-lg hover:bg-white/5 text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="max-h-[75vh] overflow-y-auto rounded-xl p-2 bg-slate-800/40">
              <FormalAuditDocument
                officersList={executiveOfficers}
                pubmatList={pubmatCreativeTeam}
                postsList={effectivePosts}
                bannersList={liveBanners}
                eventsList={liveEvents}
                projectsList={projectsData}
                meetingsList={liveMeetings}
                treasuryList={liveTreasury}
                documentsList={liveDocuments}
                auditReportsList={liveAuditReports}
                cblData={constitutionData}
                generatedDate={formattedDate}
                exportedBy={user?.displayName || user?.email || 'System Administrator'}
                selectedSection={previewDoc}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── HIDDEN PRINT CONTAINER (Only visible when browser print dialog is active) ─── */}
      <div className="hidden print:block">
        <FormalAuditDocument
          officersList={executiveOfficers}
          pubmatList={pubmatCreativeTeam}
          postsList={effectivePosts}
          bannersList={liveBanners}
          eventsList={liveEvents}
          projectsList={projectsData}
          meetingsList={liveMeetings}
          treasuryList={liveTreasury}
          documentsList={liveDocuments}
          auditReportsList={liveAuditReports}
          cblData={constitutionData}
          generatedDate={formattedDate}
          exportedBy={user?.displayName || user?.email || 'System Administrator'}
          selectedSection={selectedSection}
        />
      </div>
    </div>
  )
}
