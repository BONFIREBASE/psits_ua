import SectionHeader from '@/components/SectionHeader'
import ArchiveStack from '@/components/ArchiveStack'
import ScrollReveal from '@/components/ScrollReveal'
import { archivePhotos } from '@/data/archive'

export const metadata = {
  title: 'About PSITS-UA | History & Archive',
  description:
    'Discover the history of PSITS-UA — established in 1993 at the University of Antique — and explore the PSITS Archive.',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-canvas text-text">

      {/* ── Section 1: Our Story ────────────────────────────────────────── */}
      <section className="relative min-h-[60vh] lg:min-h-[65vh] flex flex-col justify-center pt-32 pb-16 lg:py-20 px-6 overflow-hidden">
        {/* Background glow — mirrors home hero */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-navy/40 rounded-full blur-[140px]" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-gold/8 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-canvas/40 via-transparent to-canvas" />
        </div>

        <div className="relative z-10 max-w-5xl xl:max-w-6xl mx-auto">
          <SectionHeader
            eyebrow="Est. January 8, 1993 · University of Antique"
            title="Our Story"
            subtitle="Rooted in student leadership, computing excellence, and over three decades of heritage."
          />

          <ScrollReveal delay={0.15}>
            <div className="mt-8 space-y-6 max-w-4xl xl:max-w-5xl">
              <p className="text-slate-700 dark:text-white/85 text-base sm:text-lg leading-relaxed font-normal">
                On <span className="text-slate-900 dark:text-white font-semibold">January 8, 1993</span>, through the initiative
                and efforts of <span className="text-gold font-medium">Mrs. Nelly E. Mistio</span>, the organization was
                officially approved by the College President of the{' '}
                <span className="text-slate-900 dark:text-white font-semibold">Polytechnic State College of Antique (PSCA)</span>.
                Originally chartered as the <span className="text-slate-900 dark:text-white font-medium">Computer Society</span>,
                it was established as an interest group exclusive to students under the College of Computer Studies,
                fostering technical camaraderie in Western Visayas long before the modern digital era.
              </p>

              <p className="text-slate-600 dark:text-white/65 text-base leading-relaxed">
                As academic programs advanced and PSCA evolved into the University of Antique, the organization
                adapted to the shifting technological landscape. During Academic Year{' '}
                <span className="text-slate-900 dark:text-white font-medium">2016–2017</span>, through a landmark constitutional
                amendment ratified by its officers and member body, the society was officially renamed the{' '}
                <span className="text-slate-900 dark:text-white font-semibold">
                  Philippine Society of Information Technology Students – UA Chapter (PSITS-UA)
                </span>
                , establishing mandatory, unified representation for all Information Technology majors.
              </p>

              <p className="text-slate-600 dark:text-white/65 text-base leading-relaxed">
                Under Article II of its Constitution and By-Laws, PSITS-UA is chartered not solely to cultivate
                industry-ready computing skills, but to create a dedicated pool of IT enthusiasts who extend
                technology services to the university, champion ethical leadership, and serve as catalysts for
                community growth. Today, as the premier student organization of the College of Computing and
                Information Sciences (CCIS), PSITS-UA continues to uphold this constitutional heritage across
                every batch of IT scholars.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Section 2: PSITS Archive ────────────────────────────────────── */}
      <section className="px-6 pb-28 lg:pb-36 max-w-6xl xl:max-w-7xl mx-auto">
        <div className="mb-14">
          <SectionHeader
            eyebrow="Through the Years"
            title="PSITS Archive"
            subtitle="A look back at the people and moments that shaped PSITS-UA."
          />
        </div>

        {/* Minimalist Tactile Memory Photo Stack */}
        <ScrollReveal delay={0.1}>
          <ArchiveStack photos={archivePhotos} />
        </ScrollReveal>
      </section>
    </main>
  )
}
