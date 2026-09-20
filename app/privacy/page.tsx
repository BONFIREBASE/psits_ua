import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy | PSITS-UA',
  description:
    'Official Student Data Privacy Policy of PSITS-UA and Bonfire Base Studio, compliant with the Philippine Data Privacy Act of 2012 (RA 10173).',
  alternates: {
    canonical: '/privacy',
  },
}

const privacySections = [
  { id: 'compliance', num: '01', label: 'Statutory Law & Principles' },
  { id: 'governance', num: '02', label: 'Operational Roles & Governance' },
  { id: 'data-collected', num: '03', label: 'Information We Collect' },
  { id: 'coa-activities', num: '04', label: 'COA Activities & Career' },
  { id: 'subprocessors', num: '05', label: 'Subprocessors & Cookies' },
  { id: 'security-storage', num: '06', label: 'Security & Data Storage' },
  { id: 'inquiries', num: '07', label: 'Data Inquiries (DSAR)' },
  { id: 'rights', num: '08', label: 'Legal Rights & Contact' },
]

export default function PrivacyPolicyPage() {
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
            Philippine Data Privacy Act · R.A. 10173
          </p>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 dark:text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs font-mono text-muted">
            Last revised: September 2026 · College of Computing and Information Sciences
          </p>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed pt-2">
            This Privacy Policy explains how student information is collected, processed, and safeguarded across the
            official digital platforms of the Philippine Society of Information Technology Students — University of
            Antique Chapter (PSITS-UA) and its pro bono engineering team, Bonfire Base Studio.
          </p>
        </header>

        {/* Editorial "On this page" Table of Contents */}
        <nav aria-label="Table of Contents" className="my-10 py-6 border-y border-border/50">
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted mb-3 font-semibold">
            On this page
          </p>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-xs sm:text-sm font-mono">
            {privacySections.map((sec) => (
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
          {/* Section 01: Statutory Compliance */}
          <section id="compliance" className="scroll-mt-24 space-y-3">
            <p className="text-xs font-mono text-gold uppercase tracking-wider">
              01 · Statutory Compliance &amp; Core Principles
            </p>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
              Compliance with R.A. 10173 (Data Privacy Act of 2012)
            </h2>
            <p>
              We are strictly committed to student data protection under{' '}
              <strong className="text-slate-900 dark:text-white font-semibold">
                Republic Act No. 10173
              </strong>
              , commonly known as the{' '}
              <strong className="text-slate-900 dark:text-white font-semibold">
                Data Privacy Act of 2012 (DPA)
              </strong>
              , its Implementing Rules and Regulations (IRR), and all circulars issued by the{' '}
              <strong className="text-slate-900 dark:text-white font-semibold">
                National Privacy Commission (NPC)
              </strong>.
            </p>
            <p>
              All personal information is collected under the statutory principles of <em>transparency</em>,{' '}
              <em>legitimate purpose</em>, and <em>proportionality</em>. We collect only what is strictly required to
              authenticate students and deliver organizational services. We never sell, license, rent, or trade student
              data with third-party advertisers or commercial brokers.
            </p>
          </section>

          <hr className="border-border/40" />

          {/* Section 02: Operational Roles */}
          <section id="governance" className="scroll-mt-24 space-y-3">
            <p className="text-xs font-mono text-gold uppercase tracking-wider">
              02 · Institutional Governance &amp; Entity Roles
            </p>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
              Operational Governance &amp; Entity Roles
            </h2>
            <p>Under Section 3 of R.A. 10173, responsibility for student data is managed under a dual-entity model:</p>
            <ul className="list-disc list-outside pl-5 space-y-2">
              <li>
                <strong className="text-slate-900 dark:text-white">Personal Information Controller (PIC):</strong> The
                PSITS-UA Executive Board and the College of Computing and Information Sciences (CCIS), University of Antique,
                determines organizational purposes, competition rules, ballot validity, and student event participation.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Personal Information Processor (PIP):</strong> The{' '}
                <strong className="text-slate-900 dark:text-white font-semibold">
                  Bonfire Base Studio Engineering Team
                </strong>{' '}
                architectures, provisions, maintains, and secures the database, media storage, edge rate-limiting, and
                software code on a pro bono basis.
              </li>
            </ul>
          </section>

          <hr className="border-border/40" />

          {/* Section 03: Information We Collect */}
          <section id="data-collected" className="scroll-mt-24 space-y-3">
            <p className="text-xs font-mono text-gold uppercase tracking-wider">
              03 · Data Processing &amp; Purpose
            </p>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
              Information We Collect &amp; Why
            </h2>
            <p>We restrict data collection to the minimum required for student verification and competition integrity:</p>
            <ul className="list-disc list-outside pl-5 space-y-2">
              <li>
                <strong className="text-slate-900 dark:text-white">Institutional Identity:</strong> Your full name, profile
                avatar, and institutional email (<code className="px-1.5 py-0.5 rounded bg-surface border border-border text-gold font-mono text-xs">@antiquespride.edu.ph</code>)
                authenticated via Google Workspace OAuth.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Academic Enrollment &amp; Student ID Numbers:</strong> Your
                degree program, year/section (e.g., BSIT 3-A), and student identification number. Student IDs are utilized
                exclusively to verify active enrollment against CCIS registrar rosters and are permanently excluded from public
                showcases and search engine indexing.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Contest Submissions:</strong> Uploaded design artwork,
                concept descriptions, and author attribution for the Polo Shirt Design Competition.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Democratic Ballots &amp; Secret Voting:</strong> Voter ID
                hashes and timestamps are recorded strictly to enforce the <em>One-Student-One-Vote</em> rule. Individual vote
                selections are cryptographically decoupled from officer views so that ballots remain completely confidential.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Ephemeral Security Logs:</strong> IP addresses and browser
                user-agents evaluated in-memory by Cloudflare Turnstile and sliding-window rate limiters to prevent bot spam.
                Security logs are never linked to personal student profiles.
              </li>
            </ul>
          </section>

          <hr className="border-border/40" />

          {/* Section 04: Future COA Activities & Career */}
          <section id="coa-activities" className="scroll-mt-24 space-y-3">
            <p className="text-xs font-mono text-gold uppercase tracking-wider">
              04 · Calendar of Activities (COA) Integration
            </p>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
              Future COA Activities: Career Fairs, Assemblies &amp; Auditing
            </h2>
            <p>
              To support upcoming events codified in the approved 15-event Calendar of Activities (AY 2026–2027), the
              platform handles specialized event data as follows:
            </p>
            <ul className="list-disc list-outside pl-5 space-y-2">
              <li>
                <strong className="text-slate-900 dark:text-white">Career Guidance &amp; Job Fairs (COA-7, COA-10):</strong> For
                internship matching and career fairs, students may voluntarily submit resumes, GitHub profiles, and portfolio
                links. Career data is shared with participating industry partners solely with explicit student opt-in
                consent and is never distributed to third-party headhunters.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Event Attendance &amp; Media Archives (COA-5, COA-8, COA-13):</strong>{' '}
                Cryptographic QR attendance tokens record verified attendance for academic clearance. Candid photography and
                videography captured during public assemblies (Acquaintance Party, CCIS Week, Tech Expos) may be featured in
                the PSITS Historical Archive and university newsletters. Students wishing to be excluded from close-up promotional
                media may request de-tagging via the DSAR contact channel.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Institutional Audit Records (PRES-FM-008):</strong> In
                compliance with Commission on Audit circulars and university student council guidelines, organization treasury
                ledgers, event turnout logs, and official meeting minutes are maintained in audit archives to ensure financial
                transparency and academic accreditation.
              </li>
            </ul>
          </section>

          <hr className="border-border/40" />

          {/* Section 05: Cloud Subprocessors & Cookie Storage */}
          <section id="subprocessors" className="scroll-mt-24 space-y-3">
            <p className="text-xs font-mono text-gold uppercase tracking-wider">
              05 · Subprocessors &amp; Browser Storage
            </p>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
              Cloud Subprocessors &amp; Browser Storage
            </h2>
            <p>
              To deliver resilient operations, student data is processed across enterprise cloud infrastructure under
              strict security standards:
            </p>
            <ul className="list-disc list-outside pl-5 space-y-2">
              <li>
                <strong className="text-slate-900 dark:text-white">Supabase / PostgreSQL:</strong> Relational database hosting,
                user authentication, and database-level Row-Level Security (RLS) policies.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Cloudflare:</strong> Direct media asset storage via Cloudflare R2
                buckets and human verification via Cloudflare Turnstile.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Vercel:</strong> Serverless Next.js edge application hosting
                and aggregated web telemetry.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Upstash:</strong> Serverless in-memory Redis for edge sliding-window
                rate limiting and defense against distributed denial-of-service attempts.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Google Workspace:</strong> Institutional Single Sign-On identity
                provider and Search Console telemetry.
              </li>
            </ul>
            <p className="pt-2">
              Our platform uses strictly essential browser storage:
            </p>
            <ul className="list-disc list-outside pl-5 space-y-1.5">
              <li><strong className="text-slate-900 dark:text-white">Theme Preference (<code className="font-mono text-xs">theme</code>):</strong> Remembers light or dark mode in localStorage.</li>
              <li><strong className="text-slate-900 dark:text-white">Auth Session (<code className="font-mono text-xs">sb-*-auth-token</code>):</strong> Encrypted session cookie to maintain your Google Workspace login.</li>
            </ul>
            <p className="text-xs text-muted">We do not use third-party marketing cookies, cross-site trackers, or advertising pixels.</p>
          </section>

          <hr className="border-border/40" />

          {/* Section 06: Data Security & Storage Safeguards */}
          <section id="security-storage" className="scroll-mt-24 space-y-3">
            <p className="text-xs font-mono text-gold uppercase tracking-wider">
              06 · Encryption &amp; Retention
            </p>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
              Data Storage, Encryption &amp; Security Safeguards
            </h2>
            <p>We enforce modern cryptographic and architectural protections to keep student data safe:</p>
            <ul className="list-disc list-outside pl-5 space-y-2">
              <li>
                <strong className="text-slate-900 dark:text-white">Database Encryption:</strong> PostgreSQL on Supabase
                secured with TLS 1.3 in transit, AES-256 at rest, and database-level Row-Level Security (RLS).
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Direct Storage Uploads:</strong> Student design files
                upload directly to Cloudflare R2 object storage via short-lived presigned URLs, bypassing application servers.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Automated 365-Day Purge:</strong> Unlinked media and
                historical artifacts older than 365 days are routinely purged from cloud storage through automated cleanup jobs.
              </li>
            </ul>
          </section>

          <hr className="border-border/40" />

          {/* Section 07: Student Data Inquiries */}
          <section id="inquiries" className="scroll-mt-24 space-y-3">
            <p className="text-xs font-mono text-gold uppercase tracking-wider">
              07 · DSAR Protocol &amp; Inquiries
            </p>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
              Student Data Inquiries: How to Inquire, Inspect, or Delete Your Data
            </h2>
            <p>
              Every student whose information is held on this platform has the statutory right to request a copy of their
              data, correct inaccurate records, or demand the permanent removal of their submissions and voting logs.
            </p>
            <p>To request your data, follow this simple procedure:</p>
            <ol className="list-decimal list-outside pl-5 space-y-2">
              <li>
                <strong className="text-slate-900 dark:text-white">Send an Email:</strong> From your official institutional
                address (<code className="font-mono text-gold text-xs">name@antiquespride.edu.ph</code>), email both{' '}
                <a href="mailto:psits-ua@antiquespride.edu.ph" className="text-gold underline">
                  psits-ua@antiquespride.edu.ph
                </a>{' '}
                and{' '}
                <a href="mailto:bonfire@base69.studio" className="text-gold underline">
                  bonfire@base69.studio
                </a>.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">State Your Request:</strong> Specify whether you wish to
                inspect a copy of your stored records, correct inaccurate details, or request permanent deletion of your
                contest submission or ballot log.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Turnaround:</strong> Requests sent from verified institutional
                emails are acknowledged within 3 academic days and fulfilled within 5 to 15 working days without any fee.
              </li>
            </ol>
          </section>

          <hr className="border-border/40" />

          {/* Section 08: Legal Rights & Contact */}
          <section id="rights" className="scroll-mt-24 space-y-3">
            <p className="text-xs font-mono text-gold uppercase tracking-wider">
              08 · Statutory Rights &amp; Escalation
            </p>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
              Your Legal Rights &amp; Official Contact
            </h2>
            <p>Under Section 16 of R.A. 10173, student data subjects possess the following enforceable rights:</p>
            <ul className="list-disc list-outside pl-5 space-y-1.5">
              <li><strong className="text-slate-900 dark:text-white">Right to be Informed:</strong> To understand the scope and reason for data collection.</li>
              <li><strong className="text-slate-900 dark:text-white">Right to Access:</strong> To request a summary of personal information held.</li>
              <li><strong className="text-slate-900 dark:text-white">Right to Rectification:</strong> To correct inaccurate or outdated records.</li>
              <li><strong className="text-slate-900 dark:text-white">Right to Erasure:</strong> To request deletion or withdrawal of your data.</li>
              <li>
                <strong className="text-slate-900 dark:text-white">Right to File a Complaint:</strong> You have the right to
                lodge a complaint with the{' '}
                <strong className="text-slate-900 dark:text-white">National Privacy Commission (NPC)</strong> via{' '}
                <a href="https://privacy.gov.ph" target="_blank" rel="noopener noreferrer" className="text-gold underline">
                  privacy.gov.ph
                </a>{' '}
                or <code className="font-mono text-xs">complaints@privacy.gov.ph</code>.
              </li>
            </ul>
            <div className="space-y-1 font-mono text-xs pt-3">
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
          <Link href="/terms" className="hover:text-gold transition-colors">
            Read Terms of Service →
          </Link>
          <span>PSITS-UA × Bonfire Base Studio</span>
        </div>
      </div>
    </main>
  )
}
