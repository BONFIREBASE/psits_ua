import { adviser, officers, Officer } from '@/data/officers'
import { ShieldCheck, GraduationCap, Users, Award, BookOpen } from 'lucide-react'

export const metadata = {
  title: 'Officers & Administration | PSITS-UA',
  description:
    'Official directory of PSITS-UA Executive Officers and Faculty Adviser for Academic Year 2026–2027.',
}

export default function OfficersPage() {
  const executives = officers.filter((o) => o.roleGroup === 'Executive')
  const secretariat = officers.filter(
    (o) => o.roleGroup === 'Secretariat & Finance'
  )
  const operations = officers.filter((o) => o.roleGroup === 'Operations & PR')
  const representatives = officers.filter(
    (o) => o.roleGroup === 'Year Representatives'
  )

  return (
    <div className="pt-32 pb-28 max-w-6xl mx-auto px-6 space-y-20">
      {/* Header */}
      <header className="space-y-4 border-b border-white/10 pb-12">
        <p className="font-mono text-xs sm:text-sm text-gold font-bold tracking-widest uppercase">
          01 / Leadership Directory · A.Y. 2026–2027
        </p>
        <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-white tracking-tight uppercase leading-[1.08]">
          Officers & <span className="text-gold">Adviser</span>
        </h1>
        <p className="text-white/85 text-base sm:text-lg max-w-2xl pt-2 leading-relaxed font-normal">
          The officially ratified executive council, committee heads, and faculty
          leadership governing the Philippine Society of Information Technology
          Students — University of Antique Chapter.
        </p>
      </header>

      {/* Faculty Adviser Feature Card */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 font-mono text-xs text-gold uppercase tracking-wider">
          <GraduationCap size={14} className="text-gold" />
          <span>Faculty Leadership</span>
        </div>

        <div className="border border-gold/50 border-l-3 border-l-gold bg-surface/60 p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-white/10 pb-4">
            <div>
              <span className="font-mono text-xs text-white/60 uppercase tracking-widest">
                Program Head & Adviser
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mt-1">
                {adviser.name},{' '}
                <span className="text-gold font-mono text-xl sm:text-2xl font-bold">
                  {adviser.credentials}
                </span>
              </h2>
            </div>
            <span className="font-mono text-xs text-gold/90 px-2.5 py-1 border border-gold/30 bg-gold/5 uppercase tracking-wider self-start sm:self-auto">
              Faculty Adviser
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm text-white/80 font-mono pt-1">
            <p className="text-white font-medium">{adviser.title}</p>
            <p className="text-white/70 sm:text-right">
              {adviser.department} · {adviser.institution}
            </p>
          </div>
        </div>
      </section>

      {/* Executive Council */}
      <section className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 font-mono text-xs text-gold uppercase tracking-wider">
            <Award size={14} className="text-gold" />
            <span>Executive Leadership</span>
          </div>
          <span className="font-mono text-[11px] text-white/50 uppercase tracking-wider">
            Presidency
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          {executives.map((officer) => (
            <OfficerTile key={officer.name} officer={officer} featured />
          ))}
        </div>
      </section>

      {/* Secretariat & Finance */}
      <section className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 font-mono text-xs text-gold uppercase tracking-wider">
            <ShieldCheck size={14} className="text-gold" />
            <span>Secretariat, Treasury & Audit</span>
          </div>
          <span className="font-mono text-[11px] text-white/50 uppercase tracking-wider">
            Administration
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {secretariat.map((officer) => (
            <OfficerTile key={officer.name} officer={officer} />
          ))}
        </div>
      </section>

      {/* Operations & Public Relations */}
      <section className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 font-mono text-xs text-gold uppercase tracking-wider">
            <BookOpen size={14} className="text-gold" />
            <span>Public Relations & Business Operations</span>
          </div>
          <span className="font-mono text-[11px] text-white/50 uppercase tracking-wider">
            Operations
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {operations.map((officer) => (
            <OfficerTile key={officer.name} officer={officer} />
          ))}
        </div>
      </section>

      {/* Year Representatives */}
      <section className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 font-mono text-xs text-gold uppercase tracking-wider">
            <Users size={14} className="text-gold" />
            <span>Year Level Representatives</span>
          </div>
          <span className="font-mono text-[11px] text-white/50 uppercase tracking-wider">
            Class Delegates
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {representatives.map((officer) => (
            <OfficerTile key={officer.name} officer={officer} />
          ))}
        </div>
      </section>
    </div>
  )
}

function OfficerTile({
  officer,
  featured = false,
}: {
  officer: Officer
  featured?: boolean
}) {
  return (
    <div
      className={`border p-5 sm:p-6 transition-colors bg-surface/50 hover:bg-surface space-y-3 ${
        featured
          ? 'border-gold/40 border-l-2 border-l-gold'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-gold font-bold uppercase tracking-wider">
          {officer.position}
        </span>
        <span className="font-mono text-[10px] text-white/60 uppercase tracking-widest border border-white/10 px-2 py-0.5">
          {officer.department}
        </span>
      </div>

      <h3
        className={`font-display font-bold text-white leading-tight ${
          featured ? 'text-xl sm:text-2xl' : 'text-lg'
        }`}
      >
        {officer.name}
      </h3>
    </div>
  )
}
