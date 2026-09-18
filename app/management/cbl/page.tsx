import ConstitutionViewer from '@/components/ConstitutionViewer'
import { constitutionData } from '@/data/constitution'

export const metadata = {
  title: 'Constitution and By-Laws (CBL) | PSITS-UA Management',
  description:
    'Official Constitution and By-Laws of the Philippine Society of Information Technology Students — University of Antique.',
}

export default function ManagementCBLPage() {
  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-12">
      {/* Header */}
      <header className="space-y-4 border-b border-white/10 pb-8">
        <p className="font-mono text-xs text-gold font-bold tracking-widest uppercase">
          University of Antique · College of Computing and Information Sciences
        </p>
        <h1 className="font-display font-black text-2xl sm:text-4xl md:text-5xl text-white tracking-tight uppercase leading-tight">
          PSITS-UA <br />
          <span className="text-white">Constitution and </span>
          <span className="text-gold">By-Laws (CBL)</span>
        </h1>
        <p className="text-white/80 text-sm sm:text-base max-w-2xl leading-relaxed">
          The official governing constitution, membership policies, officer
          duties, and operational guidelines of the Philippine Society of
          Information Technology Students — University of Antique Chapter.
        </p>
      </header>

      {/* Historical Background */}
      <section className="space-y-4">
        <h2 className="font-mono text-xs text-gold font-bold tracking-widest uppercase">
          Historical Background
        </h2>
        <div className="bg-[#0d121f] border border-white/10 rounded-xl p-6 sm:p-8 space-y-4 shadow-sm">
          <p className="text-white text-sm sm:text-base leading-relaxed">
            The <strong className="text-gold font-bold">University of Antique Computer Society</strong> was
            founded through the efforts of <strong className="text-white font-bold">Mrs. Nelly E. Mistio</strong> and
            was approved by the College President of the <strong className="text-white font-bold">Polytechnic State College of Antique (PSCA)</strong> on{' '}
            <strong className="text-gold font-bold">January 8, 1993</strong>. It was then classified as an Interest Group.
          </p>
          <p className="text-white/80 text-sm sm:text-base leading-relaxed">
            With the approval of the majority of its members, the Computer Society remained an organization exclusive to students under Computer Studies.
            The organization was formally amended to the <strong className="text-white font-bold">Philippine Society of Information Technology Students – UA (PSITS-UA)</strong> and
            made exclusive to Information Technology students only. The amendment was made effective during Academic Year{' '}
            <strong className="text-gold font-bold">2016–2017</strong> with the approval of its officers and members.
          </p>
        </div>
      </section>

      {/* Preamble */}
      <section className="space-y-4">
        <h2 className="font-mono text-xs text-gold font-bold tracking-widest uppercase">
          Preamble
        </h2>
        <div className="border-l-4 border-gold pl-6 py-2 bg-white/[0.02] rounded-r-xl">
          <blockquote className="text-white font-normal text-base sm:text-lg italic leading-relaxed">
            &ldquo;{constitutionData.preamble.text}&rdquo;
          </blockquote>
        </div>
      </section>

      {/* Codified Articles & By-Laws */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="font-mono text-xs text-gold font-bold tracking-widest uppercase">
            Codified Articles & By-Laws
          </h2>
          <p className="text-white/70 text-xs sm:text-sm">
            Click on any article to view its official sections and provisions.
          </p>
        </div>

        <ConstitutionViewer />
      </section>
    </div>
  )
}
