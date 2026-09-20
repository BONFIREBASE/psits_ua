import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service | PSITS-UA',
  description:
    'Official Terms of Service for the PSITS-UA digital platform, contests, hackathons, and student services, engineered by Bonfire Base Studio.',
  alternates: {
    canonical: '/terms',
  },
}

const termsSections = [
  { id: 'platform', num: '01', label: 'Platform & Pro Bono Craft' },
  { id: 'accounts', num: '02', label: 'Student Accounts & Access' },
  { id: 'competitions', num: '03', label: 'Competitions, Contests & AI' },
  { id: 'voting', num: '04', label: 'Democratic Voting & Secret Ballots' },
  { id: 'showcases', num: '05', label: 'Academic Showcases & SEO' },
  { id: 'security', num: '06', label: 'Security, Telemetry & Fair Use' },
  { id: 'governance', num: '07', label: 'Governing Law & Inquiries' },
]

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-canvas text-text font-body selection:bg-gold/20 selection:text-gold pt-28 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-muted hover:text-text transition-colors group"
          >
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform text-gold" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Title and Metadata */}
        <header className="space-y-3">
          <p className="text-xs font-mono text-gold uppercase tracking-wider">
            PSITS-UA × Bonfire Base Studio
          </p>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 dark:text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs font-mono text-muted">
            Last revised: September 2026 · College of Computing and Information Sciences
          </p>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed pt-2">
            A comprehensive, transparent guide to how our digital platform, student competitions, hackathons, and
            services operate. These terms govern your use of the web application operated for the Philippine Society
            of Information Technology Students — University of Antique Chapter (PSITS-UA).
          </p>
        </header>

        {/* Editorial "On this page" Table of Contents */}
        <nav aria-label="Table of Contents" className="my-10 py-6 border-y border-border/50">
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted mb-3 font-semibold">
            On this page
          </p>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-xs sm:text-sm font-mono">
            {termsSections.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className="flex items-center gap-2.5 py-1 text-slate-700 dark:text-slate-300 hover:text-gold transition-colors group"
              >
                <span className="text-gold font-semibold text-xs">{sec.num}</span>
                <span className="group-hover:underline underline-offset-4">{sec.label}</span>
              </a>
            ))}
          </div>
        </nav>

        {/* Pure Minimalist Flowing Text Divided into Clear Sections */}
        <article className="space-y-14 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
          {/* Section 01: The Platform */}
          <section id="platform" className="scroll-mt-24 space-y-3">
            <p className="text-xs font-mono text-gold uppercase tracking-wider">
              01 · Engineering &amp; Platform Architecture
            </p>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
              The Platform &amp; Pro Bono Craftsmanship
            </h2>
            <p>
              This digital platform is engineered, deployed, and technically maintained on a pro bono basis by the{' '}
              <strong className="text-slate-900 dark:text-white font-semibold">
                Bonfire Base Studio Engineering Team
              </strong>{' '}
              to empower the students and faculty of the College of Computing and Information Sciences (CCIS), University
              of Antique.
            </p>
            <p>
              In accordance with Bonfire Base Studio&apos;s operational principles for pro bono software, visible developer
              attributions are preserved across official footers and codebase repositories. Underlying software
              frameworks, reusable logic, and automated cloud workflows remain the proprietary craftsmanship of Bonfire
              Base Studio, provided freely for student benefit.
            </p>
          </section>

          <hr className="border-border/40" />

          {/* Section 02: Student Accounts */}
          <section id="accounts" className="scroll-mt-24 space-y-3">
            <p className="text-xs font-mono text-gold uppercase tracking-wider">
              02 · Authentication &amp; Eligibility
            </p>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
              Student Accounts &amp; Institutional Access
            </h2>
            <p>
              Access to student-exclusive features — including polo shirt design submissions, official voting, hackathon
              registrations, and officer dashboards — requires authentication via Google Workspace Single Sign-On (OAuth).
            </p>
            <ul className="list-disc list-outside pl-5 space-y-2">
              <li>
                Access is restricted strictly to official institutional email accounts ending in{' '}
                <code className="px-1.5 py-0.5 rounded bg-surface border border-border text-gold font-mono text-xs">
                  @antiquespride.edu.ph
                </code>.
              </li>
              <li>
                Your account is strictly personal. Sharing credentials, submitting contest entries on behalf of
                unverified individuals, or casting ballots via proxy accounts is prohibited.
              </li>
            </ul>
          </section>

          <hr className="border-border/40" />

          {/* Section 03: Competitions, Polo Contest & Hackathons */}
          <section id="competitions" className="scroll-mt-24 space-y-4">
            <p className="text-xs font-mono text-gold uppercase tracking-wider">
              03 · Creative Rights &amp; Competitions
            </p>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
              Competitions, Polo Contest &amp; Hackathons
            </h2>
            <p>
              PSITS-UA hosts creative and technical competitions throughout the academic year as codified in the official
              Calendar of Activities (COA):
            </p>
            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <h3 className="font-display font-semibold text-base text-slate-900 dark:text-white">
                  Polo Shirt Design Contest (COA-3)
                </h3>
                <p>
                  Celebrates student creativity while producing the official uniform apparel for CCIS IT majors:
                </p>
                <ul className="list-disc list-outside pl-5 space-y-2 text-sm sm:text-base">
                  <li>
                    <strong className="text-slate-900 dark:text-white">Originality Warranty:</strong> You certify that all
                    submitted illustrations, mockups, and written concepts are your original creation and do not infringe
                    on third-party copyrights, trademarks, or proprietary assets. Plagiarized entries are immediately
                    disqualified.
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-white">Generative AI &amp; Craftsmanship:</strong> Submissions
                    must reflect the student designer&apos;s own creative execution. Submissions generated entirely by
                    prompts without substantial vector design craftsmanship or original artwork may be disqualified at the
                    discretion of the CCIS Screening Committee.
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-white">Moral Rights &amp; Production License:</strong> The
                    student creator retains full moral rights and public attribution. By submitting, you grant PSITS-UA
                    and CCIS a perpetual, royalty-free, non-exclusive license to print, manufacture, and distribute the
                    selected design on official department polo shirts and merchandise.
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-white">Apparel Manufacturing Adaptation:</strong> The
                    selected design may undergo minor technical adaptations (such as sublimation color profile tuning,
                    vector trapping, or official CCIS/UA seal placement) in collaboration with the student creator to
                    satisfy textile production specifications.
                  </li>
                </ul>
              </div>

              <div className="space-y-1.5 pt-2">
                <h3 className="font-display font-semibold text-base text-slate-900 dark:text-white">
                  Hackathons &amp; Coding Bootcamps (COA-4, COA-9, COA-12)
                </h3>
                <p>
                  Student developers participating in official hackathons and coding bootcamps retain full intellectual
                  property ownership of all source code, software architectures, and prototypes they author. Participants
                  warrant that submitted repositories do not contain malicious payloads, pirated software, or proprietary
                  third-party corporate assets.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-border/40" />

          {/* Section 04: Democratic Voting */}
          <section id="voting" className="scroll-mt-24 space-y-3">
            <p className="text-xs font-mono text-gold uppercase tracking-wider">
              04 · Democracy &amp; Cryptography
            </p>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
              Democratic Voting Standards &amp; Ballot Secrecy
            </h2>
            <p>
              To safeguard democratic student participation across design selections and organization polls, the
              platform operates under strict electoral standards:
            </p>
            <ul className="list-disc list-outside pl-5 space-y-2">
              <li>
                <strong className="text-slate-900 dark:text-white">One-Student-One-Vote:</strong> Each authenticated student
                is entitled to cast exactly one ballot per active contest.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Ballot Secrecy Guarantee:</strong> Individual voter choices
                are cryptographically decoupled from officer views. The management dashboard displays only aggregate turnout
                percentages and verified vote totals. No officer, faculty adviser, or developer can inspect an individual
                student&apos;s vote choice.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Anti-Tampering Enforcement:</strong> Automated scripts,
                headless vote bots, and proxy networks are actively blocked. Any fraudulent ballots will be purged, and the
                associated student account will be referred to the CCIS Student Discipline Committee.
              </li>
            </ul>
          </section>

          <hr className="border-border/40" />

          {/* Section 05: Academic Showcases & SEO */}
          <section id="showcases" className="scroll-mt-24 space-y-3">
            <p className="text-xs font-mono text-gold uppercase tracking-wider">
              05 · Academic Showcases &amp; Discoverability
            </p>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
              Academic Project Showcases &amp; Search Engine Indexing (SEO)
            </h2>
            <p>
              To celebrate student achievements and institutional excellence, approved contest entries, Capstone Project
              demonstrations (COA-11), and Tech Expo showcases (COA-6) are published on public showcase pages and indexed
              by search engines like Google for student portfolio recognition.
            </p>
            <p>
              Unapproved drafts, private evaluation notes, individual ballots, student ID numbers, and administrative
              dashboards (<code className="font-mono text-xs text-gold">/management</code>) are strictly shielded from
              search engines via <code className="font-mono text-xs">robots.txt</code> and anti-indexing headers.
            </p>
          </section>

          <hr className="border-border/40" />

          {/* Section 06: Security & Telemetry */}
          <section id="security" className="scroll-mt-24 space-y-3">
            <p className="text-xs font-mono text-gold uppercase tracking-wider">
              06 · System Integrity &amp; Telemetry
            </p>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
              Platform Security, Telemetry &amp; Fair Use
            </h2>
            <p>
              Bonfire Base Studio monitors anonymized, aggregated platform traffic, voting turnout metrics, and server
              performance diagnostics via Vercel Analytics and Google Search telemetry. This telemetry is strictly
              non-monetized and used solely to maintain uptime during high-concurrency voting events and prevent system
              disruptions.
            </p>
            <p>Users agree to respect platform stability and security. You must not:</p>
            <ul className="list-disc list-outside pl-5 space-y-1.5">
              <li>Bypass rate-limiting controls or Cloudflare Turnstile human verification.</li>
              <li>Upload malicious executables, corrupted files, or offensive content to cloud storage.</li>
              <li>Attempt unauthorized administrative access to officer dashboards or database endpoints.</li>
              <li>Distribute counterfeit QR attendance tokens or scan tokens on behalf of absent peers.</li>
            </ul>
          </section>

          <hr className="border-border/40" />

          {/* Section 07: Governance & Contact */}
          <section id="governance" className="scroll-mt-24 space-y-3">
            <p className="text-xs font-mono text-gold uppercase tracking-wider">
              07 · Institutional Law &amp; Contact
            </p>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
              Governing Law &amp; Official Inquiries
            </h2>
            <p>
              These Terms of Service are governed under the laws of the{' '}
              <strong className="text-slate-900 dark:text-white">Republic of the Philippines</strong>, the PSITS-UA
              Constitution and By-Laws, and the University of Antique Student Handbook. Violations are subject to review
              by the CCIS Student Discipline Committee and the Office of Student Affairs and Services (SAS).
            </p>
            <p>For questions or formal inquiries regarding these terms, please contact:</p>
            <div className="space-y-1 font-mono text-xs pt-1">
              <p>
                Student Governance:{' '}
                <a href="mailto:psits-ua@antiquespride.edu.ph" className="text-gold underline">
                  psits-ua@antiquespride.edu.ph
                </a>
              </p>
              <p>
                Technical Engineering Team:{' '}
                <a href="mailto:bonfire@base69.studio" className="text-gold underline">
                  bonfire@base69.studio
                </a>
              </p>
            </div>
          </section>
        </article>

        {/* Simple Footer Link */}
        <div className="mt-14 pt-6 border-t border-border/60 flex items-center justify-between text-xs font-mono text-muted">
          <Link href="/privacy" className="hover:text-gold transition-colors">
            Read Privacy Policy (R.A. 10173) →
          </Link>
          <span>PSITS-UA × Bonfire Base Studio</span>
        </div>
      </div>
    </main>
  )
}
