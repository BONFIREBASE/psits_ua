import ConstitutionViewer from '@/components/ConstitutionViewer'
import { constitutionData } from '@/data/constitution'

export const metadata = {
  title: 'Constitution and By-Laws (CBL) | PSITS-UA',
  description:
    'Official Constitution and By-Laws of the Philippine Society of Information Technology Students — University of Antique.',
}

export default function CBLPage() {
  return (
    <div className="pt-32 pb-28 max-w-5xl mx-auto px-6 space-y-20">
      <header className="space-y-4 border-b border-white/10 pb-12">
        <p className="font-mono text-xs sm:text-sm text-gold font-bold tracking-widest uppercase">
          University of Antique · College of Computing and Information Sciences
        </p>
        <h1 className="font-display font-black text-3xl sm:text-5xl md:text-6xl text-white tracking-tight uppercase leading-[1.08]">
          PSITS-UA <br />
          <span className="text-white">Constitution and </span>
          <span className="text-gold">By-Laws (CBL)</span>
        </h1>
        <p className="text-white/90 text-base sm:text-lg max-w-2xl pt-2 leading-relaxed font-normal">
          The official governing constitution, membership policies, officer
          duties, and operational guidelines of the Philippine Society of
          Information Technology Students — University of Antique Chapter.
        </p>
      </header>

      <section className="space-y-6">
        <h2 className="font-mono text-xs sm:text-sm text-gold font-bold tracking-widest uppercase">
          Historical Background
        </h2>
        <div className="bg-surface border border-white/10 rounded-xl p-6 sm:p-8 space-y-4 shadow-sm">
          <p className="text-white text-base sm:text-lg leading-relaxed font-normal">
            The <strong className="text-gold font-bold">University of Antique Computer Society</strong> was
            founded through the efforts of <strong className="text-white font-bold">Mrs. Nelly E. Mistio</strong> and
            was approved by the College President of the <strong className="text-white font-bold">Polytechnic State College of Antique (PSCA)</strong> on{' '}
            <strong className="text-gold font-bold">January 8, 1993</strong>. It was then classified as an Interest Group.
          </p>
          <p className="text-white/90 text-base sm:text-lg leading-relaxed font-normal">
            With the approval of the majority of its members, the Computer Society remained an organization exclusive to students under Computer Studies.
            The organization was formally amended to the <strong className="text-white font-bold">Philippine Society of Information Technology Students – UA (PSITS-UA)</strong> and
            made exclusive to Information Technology students only. The amendment was made effective during Academic Year{' '}
            <strong className="text-gold font-bold">2016–2017</strong> with the approval of its officers and members.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="font-mono text-xs sm:text-sm text-gold font-bold tracking-widest uppercase">
          Preamble
        </h2>
        <div className="border-l-3 border-gold pl-6 sm:pl-8 py-3 bg-surface/40 rounded-r-xl">
          <blockquote className="text-white font-normal text-lg sm:text-xl md:text-2xl leading-relaxed italic drop-shadow-sm">
            &ldquo;{constitutionData.preamble.text}&rdquo;
          </blockquote>
        </div>
      </section>

      <section className="space-y-8">
        <div className="space-y-2">
          <h2 className="font-mono text-xs sm:text-sm text-gold font-bold tracking-widest uppercase">
            Codified Articles & By-Laws
          </h2>
          <p className="text-white/80 text-sm sm:text-base font-normal">
            Click on any article to view its official sections and provisions.
          </p>
        </div>

        <ConstitutionViewer />
      </section>
    </div>
  )
}
